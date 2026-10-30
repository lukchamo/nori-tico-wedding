"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { activities, guests, invitations } from "@/db/schema";
import { loginWithPin, logout, requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sanitizePlan, type FloorPlan } from "@/lib/floor";
import { saveFloorPlan } from "@/lib/floor-db";
import { newCode } from "@/lib/format";
import { logActivity } from "@/lib/invitations";

const CATEGORIES = ["Familia", "Amigos", "Trabajo"];

function refresh() {
  revalidatePath("/admin", "layout");
}

const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const int = (fd: FormData, k: string, min: number, max: number, fallback: number) => {
  const n = parseInt(String(fd.get(k) ?? ""), 10);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const cleanPhone = (s: string) => s.replace(/\D/g, "").slice(0, 15) || null;
const cleanTags = (s: string) =>
  s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8)
    .join(",");

// ---------------------------------------------------------------- Sesión

export async function loginAction(_prev: { error?: string } | null, fd: FormData): Promise<{ error?: string }> {
  const pin = str(fd, "pin", 12);
  if (!/^\d{4}$/.test(pin)) return { error: "El PIN tiene 4 dígitos." };
  const res = await loginWithPin(pin);
  if (!res.ok) return { error: res.error };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

// ---------------------------------------------------------------- Invitaciones

export async function createInvitationAction(fd: FormData) {
  await requireAdmin();
  const db = await getDb();
  const name = str(fd, "name", 80);
  if (!name) redirect("/admin/invitados/nuevo?error=nombre");
  const people = str(fd, "guests", 2000)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20);
  const seats = int(fd, "seats", 1, 20, Math.max(1, people.length || 1));
  const category = CATEGORIES.includes(str(fd, "category")) ? str(fd, "category") : "Familia";
  const [inv] = await db
    .insert(invitations)
    .values({
      code: newCode(name),
      name,
      seats,
      category,
      phone: cleanPhone(str(fd, "phone", 30)),
      tags: cleanTags(str(fd, "tags")),
      source: "admin",
    })
    .returning();
  const list = people.length ? people : [name];
  for (const p of list) {
    const child = /\(niñ[oa]\)|\bniñ[oa]\b/i.test(p);
    await db.insert(guests).values({ invitationId: inv.id, name: p.replace(/\(niñ[oa]\)/i, "").trim(), isChild: child });
  }
  await logActivity({ invitationId: inv.id, type: "created", author: "Equipo", body: "Invitación creada desde el backoffice." });
  const note = str(fd, "note", 2000);
  if (note) await logActivity({ invitationId: inv.id, type: "note", author: "Equipo", body: note });
  refresh();
  redirect(`/admin/invitados/${inv.id}`);
}

export async function updateInvitationAction(id: number, fd: FormData) {
  await requireAdmin();
  const db = await getDb();
  const inv = await db.query.invitations.findFirst({ where: eq(invitations.id, id) });
  if (!inv) return;
  const next = {
    name: str(fd, "name", 80) || inv.name,
    phone: cleanPhone(str(fd, "phone", 30)),
    seats: int(fd, "seats", 1, 20, inv.seats),
    category: CATEGORIES.includes(str(fd, "category")) ? str(fd, "category") : inv.category,
    tags: cleanTags(str(fd, "tags")),
  };
  const labels: Record<keyof typeof next, string> = { name: "Nombre", phone: "Teléfono", seats: "Cupos", category: "Categoría", tags: "Etiquetas" };
  const changes = (Object.keys(next) as (keyof typeof next)[])
    .filter((k) => (inv[k] ?? "") !== (next[k] ?? ""))
    .map((k) => `${labels[k]}: ${inv[k] || "—"} → ${next[k] || "—"}`);
  if (!changes.length) return;
  await db.update(invitations).set({ ...next, updatedAt: Date.now() }).where(eq(invitations.id, id));
  await logActivity({ invitationId: id, type: "update", author: "Equipo", body: changes.join(" · ") });
  refresh();
}

export async function deleteInvitationAction(id: number) {
  await requireAdmin();
  const db = await getDb();
  await db.delete(invitations).where(eq(invitations.id, id));
  refresh();
  redirect("/admin/invitados");
}

export async function markSentAction(id: number, channel: "whatsapp" | "link") {
  await requireAdmin();
  const db = await getDb();
  const now = Date.now();
  await db
    .update(invitations)
    .set({ sentAt: sql`coalesce(${invitations.sentAt}, ${now})`, sentCount: sql`${invitations.sentCount} + 1`, updatedAt: now })
    .where(eq(invitations.id, id));
  await logActivity({
    invitationId: id,
    type: "sent",
    author: "Equipo",
    body: channel === "whatsapp" ? "Invitación enviada por WhatsApp." : "Enlace de la invitación copiado para enviar.",
  });
  refresh();
}

export async function setRsvpAction(id: number, fd: FormData) {
  await requireAdmin();
  const db = await getDb();
  const inv = await db.query.invitations.findFirst({ where: eq(invitations.id, id) });
  if (!inv) return;
  const status = str(fd, "status") as "pending" | "yes" | "no";
  if (!["pending", "yes", "no"].includes(status)) return;
  const attending = status === "yes" ? int(fd, "attending", 0, inv.seats, inv.seats) : status === "no" ? 0 : null;
  const now = Date.now();
  await db
    .update(invitations)
    .set({ rsvpStatus: status, rsvpAttending: attending, rsvpAt: status === "pending" ? null : now, updatedAt: now })
    .where(eq(invitations.id, id));
  const body =
    status === "yes"
      ? `Confirmación registrada por el equipo · ${attending} de ${inv.seats} cupo(s).`
      : status === "no"
        ? "Registrado por el equipo: no asistirá."
        : "Respuesta reiniciada a pendiente.";
  await logActivity({ invitationId: id, type: "rsvp", author: "Equipo", body });
  refresh();
}

// ---------------------------------------------------------------- Personas

export async function addGuestAction(invitationId: number, fd: FormData) {
  await requireAdmin();
  const name = str(fd, "name", 80);
  if (!name) return;
  const db = await getDb();
  await db.insert(guests).values({ invitationId, name, relation: str(fd, "relation", 40), isChild: fd.get("isChild") === "on" });
  await logActivity({ invitationId, type: "update", author: "Equipo", body: `Persona agregada: ${name}.` });
  refresh();
}

export async function removeGuestAction(guestId: number) {
  await requireAdmin();
  const db = await getDb();
  const g = await db.query.guests.findFirst({ where: eq(guests.id, guestId) });
  if (!g) return;
  await db.delete(guests).where(eq(guests.id, guestId));
  await logActivity({ invitationId: g.invitationId, type: "update", author: "Equipo", body: `Persona retirada: ${g.name}.` });
  refresh();
}

export async function setGuestAttendingAction(guestId: number, value: "yes" | "no" | "unknown") {
  await requireAdmin();
  const db = await getDb();
  await db
    .update(guests)
    .set({ attending: value === "unknown" ? null : value === "yes" })
    .where(eq(guests.id, guestId));
  refresh();
}

// ---------------------------------------------------------------- Comentarios (CRM)

export async function addNoteAction(invitationId: number | null, fd: FormData) {
  await requireAdmin();
  const body = str(fd, "body", 4000);
  if (!body) return;
  const author = str(fd, "author", 40) || "Equipo";
  const db = await getDb();
  await db.insert(activities).values({ invitationId, type: "note", author, body, pinned: fd.get("pinned") === "on" });
  refresh();
}

export async function togglePinAction(activityId: number) {
  await requireAdmin();
  const db = await getDb();
  await db
    .update(activities)
    .set({ pinned: sql`not ${activities.pinned}` })
    .where(eq(activities.id, activityId));
  refresh();
}

export async function deleteNoteAction(activityId: number) {
  await requireAdmin();
  const db = await getDb();
  await db.delete(activities).where(and(eq(activities.id, activityId), eq(activities.type, "note")));
  refresh();
}

// ---------------------------------------------------------------- Mesas

const KINDS = new Set(["round", "rect", "head", "dance", "dj", "bar", "buffet", "cake", "photo", "gifts", "entrance", "plant"]);

export async function saveFloorPlanAction(json: string, baseVersion: number) {
  await requireAdmin();
  if (json.length > 400_000) return { ok: false as const, error: "El plano es demasiado grande." };
  let plan: FloorPlan;
  try {
    const raw = JSON.parse(json) as FloorPlan;
    if (!Array.isArray(raw.items) || typeof raw.seats !== "object") throw new Error("forma");
    const items = raw.items
      .filter((i) => i && typeof i.id === "string" && KINDS.has(i.kind))
      .slice(0, 300)
      .map((i) => ({
        id: String(i.id).slice(0, 40),
        kind: i.kind,
        label: String(i.label ?? "").slice(0, 60),
        x: Math.round(Number(i.x) || 0),
        y: Math.round(Number(i.y) || 0),
        w: Math.max(20, Math.min(2000, Math.round(Number(i.w) || 0))),
        h: Math.max(20, Math.min(2000, Math.round(Number(i.h) || 0))),
        r: Math.round(Number(i.r) || 0) % 360,
        seats: Math.max(0, Math.min(30, Math.round(Number(i.seats) || 0))),
      }));
    plan = sanitizePlan({ width: Number(raw.width) || 2400, height: Number(raw.height) || 1600, items, seats: raw.seats });
  } catch {
    return { ok: false as const, error: "Plano inválido." };
  }
  const res = await saveFloorPlan(plan, baseVersion);
  if (!res.ok) return { ok: false as const, conflict: true, version: res.version, error: "Otra persona cambió el plano. Recarga para ver la última versión." };
  revalidatePath("/admin/mesas");
  return { ok: true as const, version: res.version };
}
