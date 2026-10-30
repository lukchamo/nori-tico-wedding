import { eq } from "drizzle-orm";
import { floorPlans, guests, invitations } from "@/db/schema";
import { getDb } from "./db";
import { emptyPlan, isTable, sanitizePlan, type FloorPlan, type SeatingGuest } from "./floor";

const PLAN_ID = "main";

export async function getFloorPlan(): Promise<{ plan: FloorPlan; version: number; updatedAt: number | null }> {
  const db = await getDb();
  const row = await db.query.floorPlans.findFirst({ where: eq(floorPlans.id, PLAN_ID) });
  if (!row) return { plan: emptyPlan(), version: 0, updatedAt: null };
  try {
    return { plan: JSON.parse(row.data) as FloorPlan, version: row.version, updatedAt: row.updatedAt };
  } catch {
    return { plan: emptyPlan(), version: row.version, updatedAt: row.updatedAt };
  }
}

export async function saveFloorPlan(plan: FloorPlan, baseVersion: number) {
  const db = await getDb();
  const current = await db.query.floorPlans.findFirst({ where: eq(floorPlans.id, PLAN_ID) });
  const currentVersion = current?.version ?? 0;
  if (currentVersion !== baseVersion) return { ok: false as const, version: currentVersion };
  const version = currentVersion + 1;
  const data = JSON.stringify(plan);
  await db
    .insert(floorPlans)
    .values({ id: PLAN_ID, data, version, updatedAt: Date.now() })
    .onConflictDoUpdate({ target: floorPlans.id, set: { data, version, updatedAt: Date.now() } });
  return { ok: true as const, version };
}

export async function getSeatingGuests(): Promise<SeatingGuest[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: guests.id,
      name: guests.name,
      isChild: guests.isChild,
      attending: guests.attending,
      invitationId: guests.invitationId,
      invitationName: invitations.name,
      category: invitations.category,
      rsvp: invitations.rsvpStatus,
    })
    .from(guests)
    .innerJoin(invitations, eq(guests.invitationId, invitations.id))
    .orderBy(invitations.name, guests.id);
  return rows;
}

/** guestId -> "Mesa 3 · silla 2" para mostrar en el CRM y en el CSV. */
export async function getSeatLabels(): Promise<Map<number, { table: string; seat: number }>> {
  const { plan } = await getFloorPlan();
  const clean = sanitizePlan(plan);
  const names = new Map(clean.items.filter((i) => isTable(i.kind)).map((t) => [t.id, t.label]));
  const out = new Map<number, { table: string; seat: number }>();
  for (const [gid, s] of Object.entries(clean.seats)) {
    const label = names.get(s.table);
    if (label) out.set(Number(gid), { table: label, seat: s.seat + 1 });
  }
  return out;
}
