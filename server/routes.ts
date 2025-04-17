import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import PgSimpleStore from 'connect-pg-simple';
import { pool } from './db';

// Import schemas for validation
import {
  insertClientSchema,
  insertInteractionSchema,
  insertAdminSchema,
  loginSchema,
  type Admin
} from '@shared/schema';
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

declare module 'express-session' {
  export interface SessionData {
    passport: {
      user: { id: number; username: string; role: string };
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Set up session store using Postgres
  const PostgresStore = PgSimpleStore(session);
  app.use(session({
    store: new PostgresStore({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'travel-crm-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  }));

  // Set up passport
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      if (!admin.active) {
        return done(null, false, { message: 'Account is disabled' });
      }

      const isValidPassword = await storage.validatePassword(password, admin.password);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      // Update last login time
      await storage.updateLastLogin(admin.id);

      return done(null, { 
        id: admin.id, 
        username: admin.username, 
        role: admin.role 
      });
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user: Express.User, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: Express.User, done) => {
    done(null, user);
  });

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  };

  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (req.user && (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };

  // Helper for creating audit logs
  const createAuditLog = async (req: Request, entityType: string, entityId: number, action: string, details: string) => {
    if (req.user) {
      await storage.createAuditLog({
        adminId: (req.user as any).id,
        entityType,
        entityId,
        action,
        details
      });
    }
  };

  // Auth routes
  app.post('/api/auth/login', (req, res, next) => {
    try {
      loginSchema.parse(req.body);

      passport.authenticate('local', (err: Error, user: Express.User, info: { message: string }) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: info.message });
        }
        req.logIn(user, function(err) {
          if (err) {
            return next(err);
          }
          return res.json({ 
            user: {
              id: (user as any).id,
              username: (user as any).username,
              role: (user as any).role
            }
          });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout(function() {
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      return res.json({ user: req.user });
    }
    res.status(401).json({ message: 'Not authenticated' });
  });

  // Admin routes
  app.get('/api/admins', requireAdmin, async (req, res, next) => {
    try {
      const admins = await storage.listAdmins();
      // Remove password from response
      const sanitizedAdmins = admins.map(({ password, ...admin }) => admin);
      res.json(sanitizedAdmins);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/admins', requireAdmin, async (req, res, next) => {
    try {
      const adminData = insertAdminSchema.parse(req.body);
      const admin = await storage.createAdmin(adminData);
      // Remove password from response
      const { password, ...sanitizedAdmin } = admin;

      await createAuditLog(req, 'admin', admin.id, 'create', `Admin ${admin.username} created`);

      res.status(201).json(sanitizedAdmin);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  app.put('/api/admins/:id', requireAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      // Allow partial updates
      const adminData = req.body;
      const updatedAdmin = await storage.updateAdmin(id, adminData);

      if (!updatedAdmin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      // Remove password from response
      const { password, ...sanitizedAdmin } = updatedAdmin;

      await createAuditLog(req, 'admin', id, 'update', `Admin ${updatedAdmin.username} updated`);

      res.json(sanitizedAdmin);
    } catch (error) {
      next(error);
    }
  });

  // Client routes
  app.get('/api/clients', requireAuth, async (req, res, next) => {
    try {
      let clients;
      const searchQuery = req.query.q as string;

      if (searchQuery) {
        clients = await storage.searchClients(searchQuery);
      } else {
        clients = await storage.listClients();
      }

      res.json(clients);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/clients/:id', requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      res.json(client);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/clients', requireAuth, async (req, res, next) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      // Add the creator ID
      clientData.createdBy = (req.user as any).id;

      const client = await storage.createClient(clientData);

      await createAuditLog(
        req, 
        'client', 
        client.id, 
        'create', 
        `Client ${client.firstName} ${client.lastName} created`
      );

      res.status(201).json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      // Handle database errors with specific messages
      if (error instanceof Error && error.message.includes('column "address" of relation "clients" does not exist')) {
        return res.status(400).json({ message: "The client schema has changed. Please refresh the page and try again." });
      }
      // Generic error handling
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: errorMessage });
    }
  });

  app.put('/api/clients/:id', requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      const existingClient = await storage.getClient(id);
      if (!existingClient) {
        return res.status(404).json({ message: 'Client not found' });
      }

      const clientData = req.body;
      const updatedClient = await storage.updateClient(id, clientData);

      await createAuditLog(
        req, 
        'client', 
        id, 
        'update', 
        `Client ${existingClient.firstName} ${existingClient.lastName} updated`
      );

      res.json(updatedClient);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/clients/:id', requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      const deleted = await storage.deleteClient(id);

      if (deleted) {
        await createAuditLog(
          req, 
          'client', 
          id, 
          'delete', 
          `Client ${client.firstName} ${client.lastName} deleted`
        );

        return res.json({ message: 'Client deleted successfully' });
      }

      res.status(500).json({ message: 'Failed to delete client' });
    } catch (error) {
      next(error);
    }
  });

  // Interaction routes
  app.get('/api/clients/:clientId/interactions', requireAuth, async (req, res, next) => {
    try {
      const clientId = parseInt(req.params.clientId, 10);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: 'Invalid client ID' });
      }

      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      const interactions = await storage.listInteractionsByClient(clientId);
      res.json(interactions);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/clients/:clientId/interactions', requireAuth, async (req, res, next) => {
    try {
      const clientId = parseInt(req.params.clientId, 10);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: 'Invalid client ID' });
      }

      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      const interactionData = insertInteractionSchema.parse({
        ...req.body,
        clientId,
        createdBy: (req.user as any).id
      });

      const interaction = await storage.createInteraction(interactionData);

      await createAuditLog(
        req, 
        'interaction', 
        interaction.id, 
        'create', 
        `Interaction created for client ${client.firstName} ${client.lastName}`
      );

      res.status(201).json(interaction);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  app.put('/api/interactions/:id', requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      const existingInteraction = await storage.getInteraction(id);
      if (!existingInteraction) {
        return res.status(404).json({ message: 'Interaction not found' });
      }

      const interactionData = req.body;
      const updatedInteraction = await storage.updateInteraction(id, interactionData);

      await createAuditLog(
        req, 
        'interaction', 
        id, 
        'update', 
        `Interaction ${existingInteraction.title} updated`
      );

      res.json(updatedInteraction);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/interactions/:id', requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      const interaction = await storage.getInteraction(id);
      if (!interaction) {
        return res.status(404).json({ message: 'Interaction not found' });
      }

      const deleted = await storage.deleteInteraction(id);

      if (deleted) {
        await createAuditLog(
          req, 
          'interaction', 
          id, 
          'delete', 
          `Interaction ${interaction.title} deleted`
        );

        return res.json({ message: 'Interaction deleted successfully' });
      }

      res.status(500).json({ message: 'Failed to delete interaction' });
    } catch (error) {
      next(error);
    }
  });

  // Audit log routes
  app.get('/api/audit-logs', requireAuth, async (req, res, next) => {
    try {
      const logs = await storage.listAuditLogs();
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/clients/:clientId/audit-logs', requireAuth, async (req, res, next) => {
    try {
      const clientId = parseInt(req.params.clientId, 10);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: 'Invalid client ID' });
      }

      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      const logs = await storage.getClientAuditLogs(clientId);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  // Create a default admin if none exists
  try {
    const admins = await storage.listAdmins();
    if (admins.length === 0) {
      await storage.createAdmin({
        username: 'admin',
        password: 'admin123',
        fullName: 'System Administrator',
        email: 'admin@travelcrm.com',
        role: 'admin',
        active: true
      });
      console.log('Default admin account created');
    }
  } catch (err) {
    console.error('Failed to create default admin:', err);
  }

  return httpServer;
}