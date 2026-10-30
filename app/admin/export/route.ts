import { isAdmin } from "@/lib/auth";
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
  const [rows, base] = await Promise.all([listInvitations(), siteUrl()]);
  const header = ["Invitado principal", "Categoría", "Cupos", "Teléfono", "Estado", "Asisten", "Mensaje", "Enviada", "Aperturas", "Etiquetas", "Enlace"];
  const lines = rows.map((r) =>
    [
      r.name,
      r.category,
      r.seats,
      r.phone,
      STAGES[r.stage].label,
      r.rsvpStatus === "yes" ? r.rsvpAttending : r.rsvpStatus === "no" ? 0 : "",
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
