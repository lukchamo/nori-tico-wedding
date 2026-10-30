import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const now = sql`(unixepoch() * 1000)`;

/**
 * Una invitación = un "invitado principal" (grupo) con sus cupos.
 * Es la unidad del CRM: se envía, se abre y se confirma.
 */
export const invitations = sqliteTable(
  "invitations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    category: text("category").notNull().default("Familia"),
    seats: integer("seats").notNull().default(1),
    phone: text("phone"),
    tags: text("tags").notNull().default(""),
    source: text("source", { enum: ["import", "admin", "web"] }).notNull().default("admin"),

    sentAt: integer("sent_at"),
    sentCount: integer("sent_count").notNull().default(0),
    firstOpenedAt: integer("first_opened_at"),
    lastOpenedAt: integer("last_opened_at"),
    openCount: integer("open_count").notNull().default(0),

    rsvpStatus: text("rsvp_status", { enum: ["pending", "yes", "no"] }).notNull().default("pending"),
    rsvpAttending: integer("rsvp_attending"),
    rsvpMessage: text("rsvp_message"),
    rsvpAt: integer("rsvp_at"),

    createdAt: integer("created_at").notNull().default(now),
    updatedAt: integer("updated_at").notNull().default(now),
  },
  (t) => [index("invitations_rsvp_idx").on(t.rsvpStatus), index("invitations_name_idx").on(t.name)],
);

/** Personas dentro de cada invitación. */
export const guests = sqliteTable(
  "guests",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    invitationId: integer("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    relation: text("relation").notNull().default(""),
    isChild: integer("is_child", { mode: "boolean" }).notNull().default(false),
    attending: integer("attending", { mode: "boolean" }),
    createdAt: integer("created_at").notNull().default(now),
  },
  (t) => [index("guests_invitation_idx").on(t.invitationId)],
);

/**
 * Línea de tiempo del CRM: comentarios del equipo, mensajes de invitados,
 * confirmaciones, envíos y aperturas.
 */
export const activities = sqliteTable(
  "activities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    invitationId: integer("invitation_id").references(() => invitations.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["note", "message", "rsvp", "sent", "open", "update", "created", "chat"],
    }).notNull(),
    author: text("author").notNull().default("sistema"),
    body: text("body").notNull().default(""),
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at").notNull().default(now),
  },
  (t) => [index("activities_invitation_idx").on(t.invitationId), index("activities_created_idx").on(t.createdAt)],
);

/** Conversaciones con las asesoras de outfits (Workers AI). */
export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionId: text("session_id").notNull(),
    invitationId: integer("invitation_id").references(() => invitations.id, { onDelete: "set null" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    createdAt: integer("created_at").notNull().default(now),
  },
  (t) => [index("chat_session_idx").on(t.sessionId)],
);

export type Invitation = typeof invitations.$inferSelect;
export type Guest = typeof guests.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;

/** Intentos fallidos de PIN del backoffice, por IP (frena la adivinación del PIN de 4 dígitos). */
export const loginAttempts = sqliteTable("login_attempts", {
  ip: text("ip").primaryKey(),
  fails: integer("fails").notNull().default(0),
  windowStart: integer("window_start").notNull(),
  lockedUntil: integer("locked_until"),
});
