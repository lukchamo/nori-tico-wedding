import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { activities, chatMessages, guests, invitations, type Activity, type Guest, type Invitation } from "@/db/schema";
import { getDb } from "./db";
import { newCode, normalizeName } from "./format";

export type Stage = "por_enviar" | "enviada" | "vista" | "confirmada" | "declinada";

export const STAGES: Record<Stage, { label: string; tone: string }> = {
  por_enviar: { label: "Por enviar", tone: "muted" },
  enviada: { label: "Enviada", tone: "info" },
  vista: { label: "Vista", tone: "gold" },
  confirmada: { label: "Confirmada", tone: "ok" },
  declinada: { label: "No asiste", tone: "bad" },
};

export function stageOf(inv: Pick<Invitation, "rsvpStatus" | "firstOpenedAt" | "sentAt">): Stage {
  if (inv.rsvpStatus === "yes") return "confirmada";
  if (inv.rsvpStatus === "no") return "declinada";
  if (inv.firstOpenedAt) return "vista";
  if (inv.sentAt) return "enviada";
  return "por_enviar";
}

export type PublicInvitation = Pick<
  Invitation,
  "code" | "name" | "seats" | "rsvpStatus" | "rsvpAttending" | "rsvpMessage"
> & { guests: Pick<Guest, "id" | "name" | "isChild" | "attending">[] };

export async function getPublicInvitation(code: string): Promise<PublicInvitation | null> {
  const db = await getDb();
  const inv = await db.query.invitations.findFirst({ where: eq(invitations.code, code) });
  if (!inv) return null;
  const people = await db
    .select({ id: guests.id, name: guests.name, isChild: guests.isChild, attending: guests.attending })
    .from(guests)
    .where(eq(guests.invitationId, inv.id))
    .orderBy(guests.id);
  return {
    code: inv.code,
    name: inv.name,
    seats: inv.seats,
    rsvpStatus: inv.rsvpStatus,
    rsvpAttending: inv.rsvpAttending,
    rsvpMessage: inv.rsvpMessage,
    guests: people,
  };
}

async function findByName(name: string): Promise<Invitation | undefined> {
  const db = await getDb();
  const target = normalizeName(name);
  if (!target) return undefined;
  const all = await db.select().from(invitations);
  return all.find((i) => normalizeName(i.name) === target);
}

const REOPEN_LOG_GAP = 12 * 60 * 60 * 1000;

/** Registra que un invitado abrió su enlace personalizado (desde el navegador, no desde bots de vista previa). */
export async function trackOpen(code: string, event: "view" | "envelope") {
  const db = await getDb();
  const inv = await db.query.invitations.findFirst({ where: eq(invitations.code, code) });
  if (!inv) return;
  const now = Date.now();
  if (event === "view") {
    const shouldLog = !inv.lastOpenedAt || now - inv.lastOpenedAt > REOPEN_LOG_GAP;
    await db
      .update(invitations)
      .set({
        openCount: sql`${invitations.openCount} + 1`,
        firstOpenedAt: inv.firstOpenedAt ?? now,
        lastOpenedAt: now,
        updatedAt: now,
      })
      .where(eq(invitations.id, inv.id));
    if (shouldLog) {
      await db.insert(activities).values({
        invitationId: inv.id,
        type: "open",
        author: inv.name,
        body: inv.firstOpenedAt ? "Volvió a abrir la invitación." : "Abrió la invitación por primera vez.",
      });
    }
  }
}

export type RsvpInput = {
  code?: string | null;
  name?: string | null;
  phone?: string | null;
  status: "yes" | "no";
  attending?: number | null;
  guestIds?: number[] | null;
  message?: string | null;
};

export async function submitRsvp(input: RsvpInput) {
  const db = await getDb();
  const now = Date.now();
  const message = input.message?.trim().slice(0, 1000) || null;

  let inv: Invitation | undefined;
  if (input.code) inv = await db.query.invitations.findFirst({ where: eq(invitations.code, input.code) });
  if (!inv && input.name) inv = await findByName(input.name);

  // Enlace genérico sin invitación registrada: se crea un registro nuevo para que aparezca en el CRM.
  if (!inv) {
    const name = input.name?.trim().slice(0, 80);
    if (!name) throw new Error("Falta el nombre");
    const seats = Math.max(1, Math.min(10, input.attending ?? 1));
    const [created] = await db
      .insert(invitations)
      .values({
        code: newCode(name),
        name,
        seats,
        phone: input.phone?.replace(/\D/g, "").slice(0, 15) || null,
        source: "web",
        tags: "Registro web",
      })
      .returning();
    inv = created;
    // Personas del grupo (la persona y sus acompañantes) para que aparezcan en la organización de mesas.
    await db.insert(guests).values(
      Array.from({ length: seats }, (_, i) => ({
        invitationId: created.id,
        name: i === 0 ? name : `Acompañante ${seats > 2 ? i + " " : ""}de ${name}`,
        relation: i === 0 ? "" : "Acompañante",
      })),
    );
    await db.insert(activities).values({
      invitationId: inv.id,
      type: "created",
      author: "invitado",
      body: "Se registró desde el enlace general de la invitación.",
    });
  }

  let attending = 0;
  if (input.status === "yes") {
    const people = await db.select().from(guests).where(eq(guests.invitationId, inv.id));
    if (input.guestIds && people.length) {
      const chosen = new Set(input.guestIds.filter((id) => people.some((p) => p.id === id)));
      attending = Math.min(chosen.size, inv.seats);
      for (const p of people) {
        await db.update(guests).set({ attending: chosen.has(p.id) }).where(eq(guests.id, p.id));
      }
    } else {
      attending = Math.max(1, Math.min(inv.seats, input.attending ?? inv.seats));
    }
  } else {
    await db.update(guests).set({ attending: false }).where(eq(guests.invitationId, inv.id));
  }

  const changed = inv.rsvpStatus !== "pending";
  await db
    .update(invitations)
    .set({
      rsvpStatus: input.status,
      rsvpAttending: input.status === "yes" ? attending : 0,
      rsvpMessage: message,
      rsvpAt: now,
      firstOpenedAt: inv.firstOpenedAt ?? now,
      updatedAt: now,
    })
    .where(eq(invitations.id, inv.id));

  const body =
    input.status === "yes"
      ? `${changed ? "Actualizó su respuesta: " : ""}Confirmó asistencia · ${attending} de ${inv.seats} cupo(s).`
      : `${changed ? "Actualizó su respuesta: " : ""}No podrá asistir.`;
  await db.insert(activities).values({ invitationId: inv.id, type: "rsvp", author: inv.name, body });
  if (message) {
    await db.insert(activities).values({ invitationId: inv.id, type: "message", author: inv.name, body: message });
  }
  return { attending, seats: inv.seats, name: inv.name, code: inv.code };
}

// ---------------------------------------------------------------- Backoffice

export type InvitationRow = Invitation & { stage: Stage; people: number; lastActivityAt: number | null };

export async function listInvitations(): Promise<InvitationRow[]> {
  const db = await getDb();
  const rows = await db.select().from(invitations).orderBy(invitations.name);
  const counts = await db
    .select({ id: guests.invitationId, n: sql<number>`count(*)` })
    .from(guests)
    .groupBy(guests.invitationId);
  const last = await db
    .select({ id: activities.invitationId, at: sql<number>`max(${activities.createdAt})` })
    .from(activities)
    .where(sql`${activities.type} <> 'created'`)
    .groupBy(activities.invitationId);
  const countMap = new Map(counts.map((c) => [c.id, Number(c.n)]));
  const lastMap = new Map(last.map((l) => [l.id, Number(l.at)]));
  return rows.map((r) => ({
    ...r,
    stage: stageOf(r),
    people: countMap.get(r.id) ?? 0,
    lastActivityAt: lastMap.get(r.id) ?? null,
  }));
}

export async function getStats() {
  const db = await getDb();
  const rows = await db.select().from(invitations);
  const people = await db.select({ isChild: guests.isChild, attending: guests.attending, inv: guests.invitationId }).from(guests);
  const chats = await db
    .select({ n: sql<number>`count(distinct ${chatMessages.sessionId})` })
    .from(chatMessages);
  const byStage: Record<Stage, number> = { por_enviar: 0, enviada: 0, vista: 0, confirmada: 0, declinada: 0 };
  let seats = 0,
    seatsYes = 0,
    seatsNo = 0,
    seatsPending = 0,
    attending = 0;
  for (const r of rows) {
    byStage[stageOf(r)]++;
    seats += r.seats;
    if (r.rsvpStatus === "yes") {
      seatsYes += r.seats;
      attending += r.rsvpAttending ?? 0;
    } else if (r.rsvpStatus === "no") seatsNo += r.seats;
    else seatsPending += r.seats;
  }
  const byCategory = new Map<string, { invitations: number; seats: number; attending: number }>();
  for (const r of rows) {
    const c = byCategory.get(r.category) ?? { invitations: 0, seats: 0, attending: 0 };
    c.invitations++;
    c.seats += r.seats;
    c.attending += r.rsvpStatus === "yes" ? (r.rsvpAttending ?? 0) : 0;
    byCategory.set(r.category, c);
  }
  return {
    invitations: rows.length,
    seats,
    seatsYes,
    seatsNo,
    seatsPending,
    attending,
    children: people.filter((p) => p.isChild).length,
    sent: rows.filter((r) => r.sentAt).length,
    opened: rows.filter((r) => r.firstOpenedAt).length,
    responded: rows.filter((r) => r.rsvpStatus !== "pending").length,
    withoutPhone: rows.filter((r) => !r.phone).length,
    chatSessions: Number(chats[0]?.n ?? 0),
    byStage,
    byCategory: [...byCategory.entries()].map(([name, v]) => ({ name, ...v })),
  };
}

export async function getInvitationDetail(id: number) {
  const db = await getDb();
  const inv = await db.query.invitations.findFirst({ where: eq(invitations.id, id) });
  if (!inv) return null;
  const people = await db.select().from(guests).where(eq(guests.invitationId, id)).orderBy(guests.id);
  const timeline = await db
    .select()
    .from(activities)
    .where(eq(activities.invitationId, id))
    .orderBy(desc(activities.pinned), desc(activities.createdAt), desc(activities.id));
  const chat = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.invitationId, id))
    .orderBy(chatMessages.createdAt);
  return { invitation: { ...inv, stage: stageOf(inv) }, guests: people, timeline, chat };
}

export type FeedItem = Activity & { invitationName: string | null };

export async function getFeed(types?: Activity["type"][], limit = 150, opts: { hideSystem?: boolean } = {}): Promise<FeedItem[]> {
  const db = await getDb();
  const rows = await db
    .select({ a: activities, name: invitations.name })
    .from(activities)
    .leftJoin(invitations, eq(activities.invitationId, invitations.id))
    .where(
      and(
        types?.length ? inArray(activities.type, types) : sql`${activities.type} <> 'created'`,
        opts.hideSystem ? sql`${activities.author} <> 'sistema'` : undefined,
      ),
    )
    .orderBy(desc(activities.createdAt), desc(activities.id))
    .limit(limit);
  return rows.map((r) => ({ ...r.a, invitationName: r.name }));
}

export async function getChatSessions(limit = 60) {
  const db = await getDb();
  const sessions = await db
    .select({
      sessionId: chatMessages.sessionId,
      invitationId: sql<number | null>`max(${chatMessages.invitationId})`,
      messages: sql<number>`count(*)`,
      startedAt: sql<number>`min(${chatMessages.createdAt})`,
      lastAt: sql<number>`max(${chatMessages.createdAt})`,
    })
    .from(chatMessages)
    .groupBy(chatMessages.sessionId)
    .orderBy(sql`max(${chatMessages.createdAt}) desc`)
    .limit(limit);
  if (!sessions.length) return [];
  const msgs = await db
    .select()
    .from(chatMessages)
    .where(inArray(chatMessages.sessionId, sessions.map((s) => s.sessionId)))
    .orderBy(chatMessages.createdAt, chatMessages.id);
  const invIds = sessions.map((s) => s.invitationId).filter((v): v is number => v != null);
  const names = invIds.length
    ? await db.select({ id: invitations.id, name: invitations.name }).from(invitations).where(inArray(invitations.id, invIds))
    : [];
  const nameMap = new Map(names.map((n) => [n.id, n.name]));
  return sessions.map((s) => ({
    ...s,
    invitationName: s.invitationId ? (nameMap.get(s.invitationId) ?? null) : null,
    transcript: msgs.filter((m) => m.sessionId === s.sessionId),
  }));
}

export async function logActivity(values: {
  invitationId: number;
  type: Activity["type"];
  body: string;
  author?: string;
  pinned?: boolean;
}) {
  const db = await getDb();
  await db.insert(activities).values({ author: "sistema", ...values });
}

export async function invitationExists(id: number) {
  const db = await getDb();
  const r = await db.select({ id: invitations.id }).from(invitations).where(and(eq(invitations.id, id))).limit(1);
  return r.length > 0;
}
