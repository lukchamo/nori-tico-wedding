// Plano del salón y ubicación de invitados en mesas. Lógica pura (sin DOM ni BD):
// geometría de mesas y sillas, plano sugerido y propuestas aleatorias de ubicación.

export type TableKind = "round" | "rect" | "head";
export type DecorKind = "dance" | "dj" | "bar" | "buffet" | "cake" | "photo" | "gifts" | "entrance" | "plant";
export type FloorKind = TableKind | DecorKind;

export type FloorItem = {
  id: string;
  kind: FloorKind;
  label: string;
  x: number;
  y: number;
  /** Solo decorados: las mesas calculan su tamaño a partir de las sillas. */
  w: number;
  h: number;
  r: number;
  seats: number;
};

export type SeatRef = { table: string; seat: number };

export type FloorPlan = {
  width: number;
  height: number;
  items: FloorItem[];
  /** guestId -> silla */
  seats: Record<string, SeatRef>;
};

export type SeatingGuest = {
  id: number;
  name: string;
  isChild: boolean;
  attending: boolean | null;
  invitationId: number;
  invitationName: string;
  category: string;
  rsvp: "pending" | "yes" | "no";
};

export const FLOOR_W = 2400;
export const FLOOR_H = 1600;
export const GRID = 10;
export const CHAIR_R = 21;

export const KIND_INFO: Record<FloorKind, { label: string; icon: string; table: boolean; w: number; h: number }> = {
  round: { label: "Mesa redonda", icon: "◯", table: true, w: 0, h: 0 },
  rect: { label: "Mesa rectangular", icon: "▭", table: true, w: 0, h: 0 },
  head: { label: "Mesa de novios", icon: "💍", table: true, w: 0, h: 0 },
  dance: { label: "Pista de baile", icon: "💃", table: false, w: 480, h: 400 },
  dj: { label: "DJ / Música", icon: "🎧", table: false, w: 180, h: 100 },
  bar: { label: "Bar", icon: "🍸", table: false, w: 320, h: 90 },
  buffet: { label: "Buffet", icon: "🍽️", table: false, w: 380, h: 90 },
  cake: { label: "Torta", icon: "🎂", table: false, w: 110, h: 110 },
  photo: { label: "Photobooth", icon: "📸", table: false, w: 200, h: 200 },
  gifts: { label: "Lluvia de sobres", icon: "💌", table: false, w: 170, h: 90 },
  entrance: { label: "Entrada", icon: "🚪", table: false, w: 240, h: 40 },
  plant: { label: "Plantas / flores", icon: "🌿", table: false, w: 90, h: 90 },
};

export const CATEGORY_COLOR: Record<string, string> = {
  Familia: "#6E7C4D",
  Amigos: "#BF7E5A",
  Trabajo: "#4F76A0",
};
export const categoryColor = (c: string) => CATEGORY_COLOR[c] ?? "#8A8676";

export const isTable = (k: FloorKind): k is TableKind => KIND_INFO[k].table;

export const emptyPlan = (): FloorPlan => ({ width: FLOOR_W, height: FLOOR_H, items: [], seats: {} });

export function newId(prefix = "t") {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

/** Tamaño de una mesa según sus sillas. */
export function tableSize(item: Pick<FloorItem, "kind" | "seats">) {
  const n = Math.max(1, item.seats);
  if (item.kind === "round") {
    const d = Math.max(110, Math.round((n * (CHAIR_R * 2 + 12)) / Math.PI) - 20);
    return { w: d, h: d };
  }
  if (item.kind === "head") return { w: Math.max(200, n * 62), h: 80 };
  return { w: Math.max(160, Math.ceil(n / 2) * 62), h: 92 };
}

export function itemSize(item: FloorItem) {
  return isTable(item.kind) ? tableSize(item) : { w: item.w, h: item.h };
}

/** Posición de cada silla, relativa al centro de la mesa y sin rotar. */
export function chairPositions(item: Pick<FloorItem, "kind" | "seats">): { x: number; y: number }[] {
  const n = item.seats;
  const { w, h } = tableSize(item);
  const gap = CHAIR_R + 9;
  if (item.kind === "round") {
    const R = w / 2 + gap;
    return Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
      return { x: Math.round(R * Math.cos(a)), y: Math.round(R * Math.sin(a)) };
    });
  }
  if (item.kind === "head") {
    return Array.from({ length: n }, (_, i) => ({ x: Math.round(-w / 2 + ((i + 0.5) * w) / n), y: -(h / 2 + gap) }));
  }
  const top = Math.ceil(n / 2);
  const bottom = n - top;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < top; i++) pts.push({ x: Math.round(-w / 2 + ((i + 0.5) * w) / top), y: -(h / 2 + gap) });
  for (let i = 0; i < bottom; i++) pts.push({ x: Math.round(-w / 2 + ((i + 0.5) * w) / bottom), y: h / 2 + gap });
  return pts;
}

export const snap = (v: number) => Math.round(v / GRID) * GRID;

export function initials(name: string) {
  const parts = name
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Limpia asignaciones a mesas o sillas que ya no existen y a invitados borrados. */
export function sanitizePlan(plan: FloorPlan, guestIds?: Set<number>): FloorPlan {
  const tables = new Map(plan.items.filter((i) => isTable(i.kind)).map((t) => [t.id, t]));
  const used = new Set<string>();
  const seats: Record<string, SeatRef> = {};
  for (const [gid, s] of Object.entries(plan.seats)) {
    const t = tables.get(s.table);
    const key = `${s.table}:${s.seat}`;
    if (!t || s.seat < 0 || s.seat >= t.seats || used.has(key)) continue;
    if (guestIds && !guestIds.has(Number(gid))) continue;
    used.add(key);
    seats[gid] = s;
  }
  return { ...plan, seats };
}

/** ¿Este invitado se debe ubicar? (no se ubican quienes dijeron que no asisten). */
export function isSeatable(g: SeatingGuest, onlyConfirmed: boolean) {
  if (g.rsvp === "no" || g.attending === false) return false;
  if (onlyConfirmed) return g.rsvp === "yes";
  return true;
}

// ---------------------------------------------------------------- Plano sugerido

/** Crea un salón de partida: mesa de novios, pista, DJ, bar, buffet y mesas redondas alrededor. */
export function suggestedLayout(guestCount: number, seatsPerTable = 10): FloorPlan {
  const items: FloorItem[] = [];
  const add = (kind: FloorKind, x: number, y: number, extra: Partial<FloorItem> = {}) => {
    const info = KIND_INFO[kind];
    items.push({ id: newId(kind[0]), kind, label: info.label, x, y, w: info.w, h: info.h, r: 0, seats: 0, ...extra });
  };
  const cx = FLOOR_W / 2;
  add("head", cx, 170, { seats: 4, label: "Mesa de novios" });
  add("cake", cx + 330, 170);
  add("dance", cx, 560);
  add("dj", cx, 830);
  add("bar", FLOOR_W - 120, 760, { r: 90 });
  add("buffet", 120, 760, { r: 90 });
  add("entrance", cx, FLOOR_H - 30);
  add("gifts", cx - 330, FLOOR_H - 110);
  add("photo", FLOOR_W - 230, FLOOR_H - 230);
  add("plant", 80, 80);
  add("plant", FLOOR_W - 80, 80);

  const blocked = items.map((i) => {
    const { w, h } = itemSize(i);
    const [bw, bh] = i.r % 180 === 90 ? [h, w] : [w, h];
    return { x1: i.x - bw / 2 - 170, x2: i.x + bw / 2 + 170, y1: i.y - bh / 2 - 170, y2: i.y + bh / 2 + 170 };
  });
  const needed = Math.max(1, Math.ceil(guestCount / seatsPerTable));
  const spots: { x: number; y: number; d: number }[] = [];
  for (let y = 330; y <= FLOOR_H - 230; y += 290) {
    for (let x = 330; x <= FLOOR_W - 330; x += 290) {
      if (blocked.some((b) => x > b.x1 && x < b.x2 && y > b.y1 && y < b.y2)) continue;
      spots.push({ x, y, d: Math.hypot(x - cx, (y - 560) * 1.3) });
    }
  }
  spots.sort((a, b) => a.d - b.d);
  spots.slice(0, needed).forEach((s, i) => {
    items.push({ id: newId("m"), kind: "round", label: `Mesa ${i + 1}`, x: s.x, y: s.y, w: 0, h: 0, r: 0, seats: seatsPerTable });
  });
  // Numeración de izquierda a derecha y de arriba abajo.
  const tables = items.filter((i) => i.kind === "round").sort((a, b) => a.y - b.y || a.x - b.x);
  tables.forEach((t, i) => (t.label = `Mesa ${i + 1}`));
  return { width: FLOOR_W, height: FLOOR_H, items, seats: {} };
}

// ---------------------------------------------------------------- Propuestas aleatorias

export type ProposalOptions = { keepExisting: boolean; onlyConfirmed: boolean; mode: "grupos" | "azar"; seed: number };
export type ProposalStats = { placed: number; unplaced: number; splitGroups: number; mixedTables: number; freeSeats: number; needed: number };

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Propone una ubicación: los grupos (invitaciones) quedan juntos en la misma mesa siempre que se pueda,
 * las mesas tienden a ser de una misma categoría (familia, amigos, trabajo) y cada semilla da una variante distinta.
 * La mesa de novios no se usa en las propuestas.
 */
export function proposeSeating(plan: FloorPlan, guests: SeatingGuest[], opts: ProposalOptions): { seats: Record<string, SeatRef>; stats: ProposalStats } {
  const rand = rng(opts.seed);
  const tables = shuffle(
    plan.items.filter((i) => i.kind === "round" || i.kind === "rect"),
    rand,
  );
  const eligible = guests.filter((g) => isSeatable(g, opts.onlyConfirmed));
  const eligibleIds = new Set(eligible.map((g) => String(g.id)));
  const byId = new Map(guests.map((g) => [String(g.id), g]));

  const seats: Record<string, SeatRef> = {};
  const taken = new Map<string, Set<number>>(plan.items.map((t) => [t.id, new Set<number>()]));
  const tableCats = new Map<string, Map<string, number>>(tables.map((t) => [t.id, new Map()]));

  const occupy = (gid: string, table: string, seat: number) => {
    seats[gid] = { table, seat };
    taken.get(table)?.add(seat);
    const g = byId.get(gid);
    const cats = tableCats.get(table);
    if (g && cats) cats.set(g.category, (cats.get(g.category) ?? 0) + 1);
  };

  if (opts.keepExisting) {
    for (const [gid, s] of Object.entries(plan.seats)) {
      // Lo ya ubicado se respeta, incluida la mesa de novios.
      if (eligibleIds.has(gid) && taken.has(s.table)) occupy(gid, s.table, s.seat);
    }
  }

  const free = (t: FloorItem) => {
    const used = taken.get(t.id)!;
    const out: number[] = [];
    for (let i = 0; i < t.seats; i++) if (!used.has(i)) out.push(i);
    return out;
  };

  const pending = eligible.filter((g) => !seats[String(g.id)]);
  let units: SeatingGuest[][];
  if (opts.mode === "azar") {
    units = shuffle(pending, rand).map((g) => [g]);
  } else {
    const groups = new Map<number, SeatingGuest[]>();
    for (const g of pending) groups.set(g.invitationId, [...(groups.get(g.invitationId) ?? []), g]);
    const cats = shuffle([...new Set(pending.map((g) => g.category))], rand);
    units = cats.flatMap((c) =>
      shuffle(
        [...groups.values()].filter((u) => u[0].category === c),
        rand,
      ).sort((a, b) => b.length - a.length || (rand() < 0.5 ? -1 : 1)),
    );
  }

  const splitInvitations = new Set<number>();
  let unplaced = 0;

  for (const unit of units) {
    const cat = unit[0].category;
    const candidates = tables
      .map((t) => {
        const f = free(t);
        const cats = tableCats.get(t.id)!;
        const sameCat = cats.get(cat) ?? 0;
        const otherCat = [...cats.entries()].filter(([c]) => c !== cat).reduce((s, [, n]) => s + n, 0);
        return { t, f, sameCat, otherCat };
      })
      .filter((c) => c.f.length >= unit.length);

    if (candidates.length) {
      // Mejor ajuste: preferir mesas de la misma categoría y que queden lo más llenas posible, con algo de azar.
      const scored = candidates
        .map((c) => ({
          ...c,
          score:
            opts.mode === "azar"
              ? rand()
              : c.sameCat * 3 - c.otherCat * 4 - (c.f.length - unit.length) * 0.6 + (c.sameCat === 0 && c.otherCat === 0 ? 1 : 0) + rand() * 2.5,
        }))
        .sort((a, b) => b.score - a.score);
      const pick = scored[0];
      unit.forEach((g, i) => occupy(String(g.id), pick.t.id, pick.f[i]));
      continue;
    }

    // No cabe completo en ninguna mesa: se reparte empezando por la que tenga más sillas libres.
    let rest = [...unit];
    const byRoom = tables.map((t) => ({ t, f: free(t) })).filter((c) => c.f.length).sort((a, b) => b.f.length - a.f.length);
    for (const c of byRoom) {
      if (!rest.length) break;
      const chunk = rest.slice(0, c.f.length);
      chunk.forEach((g, i) => occupy(String(g.id), c.t.id, c.f[i]));
      rest = rest.slice(chunk.length);
    }
    if (rest.length !== unit.length && unit.length > 1) splitInvitations.add(unit[0].invitationId);
    unplaced += rest.length;
  }

  // Grupos repartidos en varias mesas (incluye los que ya estaban así).
  const tablesByInv = new Map<number, Set<string>>();
  for (const [gid, s] of Object.entries(seats)) {
    const g = byId.get(gid);
    if (!g) continue;
    tablesByInv.set(g.invitationId, (tablesByInv.get(g.invitationId) ?? new Set()).add(s.table));
  }
  const splitGroups = [...tablesByInv.values()].filter((s) => s.size > 1).length;
  const mixedTables = [...tableCats.values()].filter((m) => [...m.values()].filter((n) => n > 0).length > 1).length;
  const freeSeats = tables.reduce((s, t) => s + free(t).length, 0);

  return {
    seats,
    stats: { placed: Object.keys(seats).length, unplaced, splitGroups, mixedTables, freeSeats, needed: Math.max(0, unplaced) },
  };
}

/** Agrega mesas redondas en espacios libres hasta cubrir las sillas que faltan. */
export function addTablesFor(plan: FloorPlan, missingSeats: number, seatsPerTable = 10): FloorPlan {
  const items = [...plan.items];
  let toAdd = Math.ceil(missingSeats / seatsPerTable);
  const occupied = (x: number, y: number) =>
    items.some((i) => {
      const { w, h } = itemSize(i);
      return Math.abs(i.x - x) < w / 2 + 190 && Math.abs(i.y - y) < h / 2 + 190;
    });
  let n = items.filter((i) => isTable(i.kind) && i.kind !== "head").length;
  for (let y = 300; y <= plan.height - 200 && toAdd > 0; y += 140) {
    for (let x = 300; x <= plan.width - 300 && toAdd > 0; x += 140) {
      if (occupied(x, y)) continue;
      items.push({ id: newId("m"), kind: "round", label: `Mesa ${++n}`, x, y, w: 0, h: 0, r: 0, seats: seatsPerTable });
      toAdd--;
    }
  }
  return { ...plan, items };
}
