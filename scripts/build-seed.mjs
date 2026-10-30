#!/usr/bin/env node
// Genera el SQL de carga inicial de invitados a partir de las dos hojas exportadas
// de Google Sheets ("Detalle Invitados" y "Telefonos Invitados").
//
// Uso:
//   node scripts/build-seed.mjs [detalle.csv] [telefonos.csv] > data/private/seed.sql
//   npx wrangler d1 execute DB --remote --file data/private/seed.sql
//
// Los CSV y el SQL contienen teléfonos de personas: viven en data/private/ (ignorado por git).
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const detallePath = process.argv[2] ?? "data/private/detalle.csv";
const telefonosPath = process.argv[3] ?? "data/private/telefonos.csv";
const outPath = process.argv[4] ?? "data/private/seed.sql";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const key = (s) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

// "german" -> "German"; los nombres con mayúsculas se dejan tal cual.
const prettyName = (s) => {
  const t = s.trim().replace(/\s+/g, " ");
  return t === t.toLowerCase() ? t.replace(/(^|\s)(\p{L})/gu, (_, sp, ch) => sp + ch.toUpperCase()) : t;
};

const slug = (s) =>
  key(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

const code = (name) => `${slug(name)}-${randomBytes(3).toString("hex").slice(0, 4)}`;
const q = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);

// ---------- Teléfonos (hoja resumen: invitado principal, cupos, teléfono) ----------
const phoneRows = parseCsv(readFileSync(telefonosPath, "utf8")).slice(1);
const summary = new Map();
for (const [name, cant, tel] of phoneRows) {
  if (!name?.trim() || /^suma total/i.test(name.trim())) continue;
  summary.set(key(name), { name: name.trim(), seats: Number(cant) || 1, phone: tel?.trim() || null });
}

// ---------- Detalle (una fila por persona) ----------
const detalle = parseCsv(readFileSync(detallePath, "utf8"));
const header = detalle.findIndex((r) => r[0] === "Item");
const groups = new Map();
for (const r of detalle.slice(header + 1)) {
  const [item, , nombre, categoria, relacion, principal, cupos, , telefono] = r;
  if (!/^\d+$/.test(item ?? "") || !nombre?.trim()) continue;
  const k = key(principal);
  if (!groups.has(k)) groups.set(k, { principal: principal.trim(), seats: Number(cupos) || 1, phone: null, people: [] });
  const g = groups.get(k);
  if (telefono?.trim() && !g.phone) g.phone = telefono.trim();
  const cat = key(categoria);
  g.people.push({
    name: prettyName(nombre),
    relation: relacion.trim().replace(/^niños$/i, "Niño/a"),
    category: cat.startsWith("amigo") ? "Amigos" : cat.startsWith("ninos") ? null : "Familia",
    isChild: cat.startsWith("ninos") || key(relacion).startsWith("ninos"),
    isPrincipal: key(nombre) === k,
  });
}

// Nombres a mostrar en la tarjeta cuando la hoja usa un apodo genérico.
const DISPLAY_OVERRIDES = { hija: "Gabriela Lucía y Valentina Sofía" };

const out = [];
const warnings = [];
let totalSeats = 0;
const keys = new Set([...summary.keys(), ...groups.keys()]);

for (const k of [...keys].sort()) {
  const s = summary.get(k);
  const g = groups.get(k);
  const rawName = s?.name ?? g?.principal ?? k;
  const name = DISPLAY_OVERRIDES[k] ?? prettyName(rawName);
  const seats = s?.seats ?? g?.seats ?? 1;
  const phone = s?.phone ?? g?.phone ?? null;
  const people = g?.people ?? [];
  const adults = people.filter((p) => !p.isChild);
  const cats = adults.map((p) => p.category).filter(Boolean);
  const category = cats.filter((c) => c === "Amigos").length > cats.length / 2 ? "Amigos" : "Familia";
  const tags = [];
  if (people.some((p) => /trabajo/i.test(p.relation))) tags.push("Trabajo");
  if (people.some((p) => p.isChild)) tags.push("Con niños");
  if (k === "hija") tags.push("Hijas");
  totalSeats += seats;

  const notes = [];
  if (s && g && s.seats !== g.seats) notes.push(`Cupos distintos entre hojas: Teléfonos=${s.seats}, Detalle=${g.seats}. Se usó ${seats}.`);
  if (s?.phone && g?.phone && s.phone !== g.phone) notes.push(`Teléfono alterno en la hoja Detalle: ${g.phone}.`);
  if (g && people.length !== seats) notes.push(`La hoja lista ${people.length} persona(s) para ${seats} cupo(s).`);
  if (!phone) notes.push("Sin teléfono registrado: pídelo para poder enviar la invitación por WhatsApp.");
  if (notes.length) warnings.push(`${name}: ${notes.join(" ")}`);

  const c = code(rawName);
  out.push(
    `INSERT INTO invitations (code, name, category, seats, phone, tags, source) VALUES (${q(c)}, ${q(name)}, ${q(category)}, ${seats}, ${q(phone)}, ${q(tags.join(","))}, 'import');`,
  );
  const inv = `(SELECT id FROM invitations WHERE code = ${q(c)})`;
  // El invitado principal primero, luego el resto en el orden de la hoja.
  for (const p of [...people].sort((a, b) => Number(b.isPrincipal) - Number(a.isPrincipal))) {
    out.push(
      `INSERT INTO guests (invitation_id, name, relation, is_child) VALUES (${inv}, ${q(p.name)}, ${q(p.relation)}, ${p.isChild ? 1 : 0});`,
    );
  }
  out.push(
    `INSERT INTO activities (invitation_id, type, author, body) VALUES (${inv}, 'created', 'sistema', ${q("Importado desde Google Sheets (Invitados Matrimonio).")});`,
  );
  for (const n of notes) {
    out.push(`INSERT INTO activities (invitation_id, type, author, body, pinned) VALUES (${inv}, 'note', 'sistema', ${q(n)}, 1);`);
  }
}

writeFileSync(outPath, out.join("\n") + "\n");
console.error(`Invitaciones: ${keys.size} · Cupos: ${totalSeats} · SQL: ${outPath}`);
if (warnings.length) console.error(`\nRevisiones (${warnings.length}):\n- ` + warnings.join("\n- "));
