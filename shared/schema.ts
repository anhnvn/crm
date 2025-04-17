import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const marketTypeEnum = pgEnum('market_type', ['local', 'oversea']);
export const segmentEnum = pgEnum('segment', ['FIT', 'Series', 'Group', 'OTA', 'Wellness']);
export const businessTypeEnum = pgEnum('business_type', ['Tour Operator', 'Travel Agent']);
export const interactionTypeEnum = pgEnum('interaction_type', ['call', 'email', 'meeting', 'note', 'other']);

// Admin Users
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"),
  active: boolean("active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminsRelations = relations(admins, ({ many }) => ({
  auditLogs: many(auditLogs),
}));

// Clients
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  marketType: marketTypeEnum("market_type").notNull().default('local'),
  market: text("market"),
  segment: segmentEnum("segment"),
  businessType: businessTypeEnum("business_type"),
  headcountName: text("headcount_name"),
  headcountRole: text("headcount_role"),
  headcountEmail: text("headcount_email"),
  if_active: boolean("if_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => admins.id),
});

export const clientsRelations = relations(clients, ({ many, one }) => ({
  interactions: many(interactions),
  creator: one(admins, {
    fields: [clients.createdBy],
    references: [admins.id],
  }),
}));

// Interactions
export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  type: interactionTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => admins.id),
});

export const interactionsRelations = relations(interactions, ({ one }) => ({
  client: one(clients, {
    fields: [interactions.clientId],
    references: [clients.id],
  }),
  creator: one(admins, {
    fields: [interactions.createdBy],
    references: [admins.id],
  }),
}));

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => admins.id),
  entityType: text("entity_type").notNull(), // 'client', 'interaction', 'admin'
  entityId: integer("entity_id").notNull(),
  action: text("action").notNull(), // 'create', 'update', 'delete'
  details: text("details").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  admin: one(admins, {
    fields: [auditLogs.adminId],
    references: [admins.id],
  }),
}));

// Schema validation with zod
export const insertAdminSchema = createInsertSchema(admins)
  .omit({ id: true, lastLogin: true, createdAt: true });

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const insertClientSchema = createInsertSchema(clients)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertInteractionSchema = createInsertSchema(interactions)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    date: z.coerce.date(),
  });

export const insertAuditLogSchema = createInsertSchema(auditLogs)
  .omit({ id: true, createdAt: true });

// Types
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
