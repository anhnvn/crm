import { 
  admins, 
  clients, 
  interactions, 
  auditLogs, 
  type Admin, 
  type InsertAdmin, 
  type Client, 
  type InsertClient, 
  type Interaction, 
  type InsertInteraction, 
  type AuditLog, 
  type InsertAuditLog 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from 'bcrypt';

export interface IStorage {
  // Admin methods
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: number, admin: Partial<Admin>): Promise<Admin | undefined>;
  listAdmins(): Promise<Admin[]>;
  validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  updateLastLogin(id: number): Promise<void>;

  // Client methods
  getClient(id: number): Promise<Client | undefined>;
  listClients(limit?: number): Promise<Client[]>;
  searchClients(query: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Interaction methods
  getInteraction(id: number): Promise<Interaction | undefined>;
  listInteractionsByClient(clientId: number): Promise<Interaction[]>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
  updateInteraction(id: number, interaction: Partial<Interaction>): Promise<Interaction | undefined>;
  deleteInteraction(id: number): Promise<boolean>;

  // Audit log methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  listAuditLogs(limit?: number): Promise<AuditLog[]>;
  getClientAuditLogs(clientId: number): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // Admin methods
  async getAdmin(id: number): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const hashedPassword = await bcrypt.hash(insertAdmin.password, 10);
    const [admin] = await db
      .insert(admins)
      .values({ ...insertAdmin, password: hashedPassword })
      .returning();
    return admin;
  }

  async updateAdmin(id: number, adminData: Partial<Admin>): Promise<Admin | undefined> {
    if (adminData.password) {
      adminData.password = await bcrypt.hash(adminData.password, 10);
    }
    
    const [admin] = await db
      .update(admins)
      .set(adminData)
      .where(eq(admins.id, id))
      .returning();
    return admin;
  }

  async listAdmins(): Promise<Admin[]> {
    return db.select().from(admins).orderBy(admins.fullName);
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async updateLastLogin(id: number): Promise<void> {
    await db
      .update(admins)
      .set({ lastLogin: new Date() })
      .where(eq(admins.id, id));
  }

  // Client methods
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async listClients(limit: number = 100): Promise<Client[]> {
    return db.select().from(clients).orderBy(desc(clients.updatedAt)).limit(limit);
  }

  async searchClients(query: string): Promise<Client[]> {
    return db.select().from(clients).where(
      sql`(${clients.firstName} || ' ' || ${clients.lastName}) ILIKE ${'%' + query + '%'} OR 
          ${clients.email} ILIKE ${'%' + query + '%'} OR 
          ${clients.phone} ILIKE ${'%' + query + '%'}`
    );
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set({ ...clientData, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db
      .delete(clients)
      .where(eq(clients.id, id))
      .returning({ id: clients.id });
    return result.length > 0;
  }

  // Interaction methods
  async getInteraction(id: number): Promise<Interaction | undefined> {
    const [interaction] = await db.select().from(interactions).where(eq(interactions.id, id));
    return interaction;
  }

  async listInteractionsByClient(clientId: number): Promise<Interaction[]> {
    return db
      .select()
      .from(interactions)
      .where(eq(interactions.clientId, clientId))
      .orderBy(desc(interactions.date));
  }

  async createInteraction(insertInteraction: InsertInteraction): Promise<Interaction> {
    const [interaction] = await db
      .insert(interactions)
      .values(insertInteraction)
      .returning();
    return interaction;
  }

  async updateInteraction(id: number, interactionData: Partial<Interaction>): Promise<Interaction | undefined> {
    const [interaction] = await db
      .update(interactions)
      .set({ ...interactionData, updatedAt: new Date() })
      .where(eq(interactions.id, id))
      .returning();
    return interaction;
  }

  async deleteInteraction(id: number): Promise<boolean> {
    const result = await db
      .delete(interactions)
      .where(eq(interactions.id, id))
      .returning({ id: interactions.id });
    return result.length > 0;
  }

  // Audit log methods
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db
      .insert(auditLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async listAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async getClientAuditLogs(clientId: number): Promise<AuditLog[]> {
    return db
      .select()
      .from(auditLogs)
      .where(and(
        eq(auditLogs.entityType, 'client'),
        eq(auditLogs.entityId, clientId)
      ))
      .orderBy(desc(auditLogs.createdAt));
  }
}

export const storage = new DatabaseStorage();
