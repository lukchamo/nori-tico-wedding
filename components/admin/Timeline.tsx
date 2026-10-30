import Link from "next/link";
import { deleteNoteAction, togglePinAction } from "@/app/admin/actions";
import type { Activity } from "@/db/schema";
import { fmtDateTime, fmtRelative } from "@/lib/format";

const ICONS: Record<Activity["type"], string> = {
  note: "💬",
  message: "💌",
  rsvp: "✅",
  sent: "📲",
  open: "👀",
  update: "✏️",
  created: "✨",
  chat: "👗",
};

const TYPE_LABEL: Record<Activity["type"], string> = {
  note: "Comentario",
  message: "Mensaje del invitado",
  rsvp: "Confirmación",
  sent: "Envío",
  open: "Apertura",
  update: "Cambio",
  created: "Creación",
  chat: "Asesoras IA",
};

type Item = Activity & { invitationName?: string | null };

export function Timeline({ items, showInvitation }: { items: Item[]; showInvitation?: boolean }) {
  if (!items.length) return <div className="adm-empty">Todavía no hay movimientos.</div>;
  return (
    <div className="adm-timeline">
      {items.map((a) => {
        const icon = a.type === "rsvp" && /no podrá|no asistirá/i.test(a.body) ? "❌" : ICONS[a.type];
        return (
          <div key={a.id} className={`adm-event ${a.type}${a.pinned ? " pinned" : ""}`}>
            <div className="adm-event-icon" aria-hidden="true">
              {a.pinned ? "📌" : icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="adm-event-meta">
                {showInvitation && a.invitationId && a.author === a.invitationName ? (
                  <Link href={`/admin/invitados/${a.invitationId}`} style={{ color: "var(--ink)", fontWeight: 700, fontSize: 13 }}>
                    {a.author}
                  </Link>
                ) : (
                  <b>{a.author}</b>
                )}
                <span>{TYPE_LABEL[a.type]}</span>
                {showInvitation && a.invitationId && a.author !== a.invitationName ? (
                  <Link href={`/admin/invitados/${a.invitationId}`} style={{ color: "var(--olive-2)" }}>
                    · {a.invitationName ?? "Invitación"}
                  </Link>
                ) : showInvitation && a.type === "note" ? (
                  <span>· General</span>
                ) : null}
                <span title={fmtDateTime(a.createdAt)}>· {fmtRelative(a.createdAt)}</span>
                {a.type === "note" ? (
                  <span className="adm-event-tools">
                    <form action={togglePinAction.bind(null, a.id)}>
                      <button className="adm-icon-btn" type="submit" title={a.pinned ? "Desfijar" : "Fijar arriba"}>
                        {a.pinned ? "Desfijar" : "Fijar"}
                      </button>
                    </form>
                    <form action={deleteNoteAction.bind(null, a.id)}>
                      <button className="adm-icon-btn" type="submit" title="Eliminar comentario">
                        Eliminar
                      </button>
                    </form>
                  </span>
                ) : null}
              </div>
              <div className="adm-event-body">{a.body}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function NoteComposer({ action, placeholder }: { action: (fd: FormData) => Promise<void>; placeholder?: string }) {
  return (
    <form action={action} className="adm-composer">
      <textarea name="body" className="adm-textarea" placeholder={placeholder ?? "Escribe un comentario o nota de seguimiento…"} required maxLength={4000} />
      <div className="adm-composer-foot">
        <input name="author" className="adm-input" placeholder="Autor (ej. Norida)" defaultValue="Novios" maxLength={40} aria-label="Autor" />
        <label className="adm-check">
          <input type="checkbox" name="pinned" /> Fijar arriba
        </label>
        <button type="submit" className="adm-btn primary" style={{ marginLeft: "auto" }}>
          Comentar
        </button>
      </div>
    </form>
  );
}
