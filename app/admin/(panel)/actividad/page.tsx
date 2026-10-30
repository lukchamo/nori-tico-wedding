import Link from "next/link";
import { addNoteAction } from "@/app/admin/actions";
import { NoteComposer, Timeline } from "@/components/admin/Timeline";
import type { Activity } from "@/db/schema";
import { getFeed } from "@/lib/invitations";

type Search = Promise<Record<string, string | string[] | undefined>>;

const FILTERS: { key: string; label: string; types?: Activity["type"][] }[] = [
  { key: "", label: "Todo" },
  { key: "note", label: "Comentarios del equipo", types: ["note"] },
  { key: "message", label: "Mensajes de invitados", types: ["message"] },
  { key: "rsvp", label: "Confirmaciones", types: ["rsvp"] },
  { key: "sent", label: "Envíos", types: ["sent"] },
  { key: "open", label: "Aperturas", types: ["open"] },
  { key: "chat", label: "Asesoras IA", types: ["chat"] },
];

export default async function Actividad({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const tipo = typeof sp.tipo === "string" ? sp.tipo : "";
  const filter = FILTERS.find((f) => f.key === tipo) ?? FILTERS[0];
  const items = await getFeed(filter.types, 200);

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Actividad y comentarios</h1>
          <p>Todo lo que pasa con las invitaciones, más las notas generales del equipo.</p>
        </div>
      </div>
      <div className="adm-chips">
        {FILTERS.map((f) => (
          <Link key={f.key} className="adm-chip" href={f.key ? `/admin/actividad?tipo=${f.key}` : "/admin/actividad"} aria-current={f.key === filter.key ? "true" : undefined}>
            {f.label}
          </Link>
        ))}
      </div>
      <section className="adm-card" style={{ maxWidth: 820 }}>
        <NoteComposer action={addNoteAction.bind(null, null)} placeholder="Comentario general (proveedores, pendientes, ideas)…" />
        <Timeline items={items} showInvitation />
      </section>
    </>
  );
}
