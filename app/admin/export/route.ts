import { isAdmin } from "@/lib/auth";
import { getSeatLabels, getSeatingGuests } from "@/lib/floor-db";
import { STAGES, listInvitations } from "@/lib/invitations";
import { siteUrl } from "@/lib/site";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  if (!(await isAdmin())) return new Response("No autorizado", { status: 401 });
  const [rows, base, seatLabels, people] = await Promise.all([listInvitations(), siteUrl(), getSeatLabels(), getSeatingGuests()]);
  const tablesOf = (invitationId: number) =>
    [...new Set(people.filter((p) => p.invitationId === invitationId).map((p) => seatLabels.get(p.id)?.table).filter(Boolean))].join(" / ");
  const header = ["Invitado principal", "Categoría", "Cupos", "Teléfono", "Estado", "Asisten", "Mesa", "Mensaje", "Enviada", "Aperturas", "Etiquetas", "Enlace"];
  const lines = rows.map((r) =>
    [
      r.name,
      r.category,
      r.seats,
      r.phone,
      STAGES[r.stage].label,
      r.rsvpStatus === "yes" ? r.rsvpAttending : r.rsvpStatus === "no" ? 0 : "",
      tablesOf(r.id),
      r.rsvpMessage,
      r.sentAt ? fmtDateTime(r.sentAt) : "",
      r.openCount,
      r.tags,
      `${base}/i/${r.code}`,
    ]
      .map(cell)
      .join(","),
  );
  const csv = "﻿" + [header.join(","), ...lines].join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="invitados-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
