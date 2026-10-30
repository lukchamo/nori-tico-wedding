import { ChatTranscript } from "@/components/admin/ChatTranscript";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addGuestAction,
  addNoteAction,
  deleteInvitationAction,
  removeGuestAction,
  setGuestAttendingAction,
  setRsvpAction,
  updateInvitationAction,
} from "@/app/admin/actions";
import { ConfirmSubmit, CopyText } from "@/components/admin/CopyText";
import { SendButtons } from "@/components/admin/SendButtons";
import { StagePill } from "@/components/admin/StagePill";
import { NoteComposer, Timeline } from "@/components/admin/Timeline";
import { fmtDateTime, fmtPhone, fmtRelative } from "@/lib/format";
import { getSeatLabels } from "@/lib/floor-db";
import { getInvitationDetail } from "@/lib/invitations";
import { siteUrl } from "@/lib/site";

type Params = Promise<{ id: string }>;

export default async function InvitationDetail({ params }: { params: Params }) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();
  const [data, base, seatLabels] = await Promise.all([getInvitationDetail(numId), siteUrl(), getSeatLabels()]);
  if (!data) notFound();
  const { invitation: inv, guests, timeline, chat } = data;
  const url = `${base}/i/${inv.code}`;
  const yes = guests.filter((g) => g.attending === true).length;

  return (
    <>
      <div className="adm-hero">
        <div>
          <Link href="/admin/invitados" className="adm-subtle" style={{ textDecoration: "none" }}>
            ← Invitados
          </Link>
          <h1 style={{ marginTop: 6 }}>{inv.name}</h1>
          <div className="adm-hero-meta">
            <StagePill stage={inv.stage} />
            <span>{inv.category}</span>
            <span>·</span>
            <span>
              {inv.seats} cupo{inv.seats === 1 ? "" : "s"}
            </span>
            {inv.phone ? (
              <>
                <span>·</span>
                <span>{fmtPhone(inv.phone)}</span>
              </>
            ) : null}
            {inv.tags
              ? inv.tags.split(",").map((t) => (
                  <span key={t} className="adm-tag">
                    {t}
                  </span>
                ))
              : null}
          </div>
        </div>
        <div className="adm-row-actions">
          <SendButtons id={inv.id} name={inv.name} phone={inv.phone} seats={inv.seats} url={url} />
          <a className="adm-btn" href={`/i/${inv.code}?preview=1`} target="_blank" rel="noopener">
            Ver tarjeta
          </a>
        </div>
      </div>

      <div className="adm-stats">
        <div className="adm-stat">
          <div className="label">Enviada</div>
          <div className="value">{inv.sentAt ? fmtRelative(inv.sentAt) : "No"}</div>
        </div>
        <div className="adm-stat">
          <div className="label">Aperturas</div>
          <div className="value">{inv.openCount ? `${inv.openCount} · ${fmtRelative(inv.lastOpenedAt)}` : "Ninguna"}</div>
        </div>
        <div className="adm-stat">
          <div className="label">Respuesta</div>
          <div className="value">
            {inv.rsvpStatus === "yes" ? `Sí · ${inv.rsvpAttending}/${inv.seats}` : inv.rsvpStatus === "no" ? "No asiste" : "Pendiente"}
          </div>
        </div>
        <div className="adm-stat">
          <div className="label">Respondió</div>
          <div className="value">{inv.rsvpAt ? fmtDateTime(inv.rsvpAt) : "—"}</div>
        </div>
      </div>

      <div className="adm-detail">
        <div>
          <section className="adm-card">
            <div className="adm-card-title">
              <h2>Enlace personalizado</h2>
            </div>
            <div className="adm-link-box">
              <code>{url}</code>
              <CopyText text={url} />
            </div>
            {inv.rsvpMessage ? (
              <div className="adm-event message" style={{ borderTop: "none", paddingBottom: 0 }}>
                <div className="adm-event-icon">💌</div>
                <div>
                  <div className="adm-event-meta">
                    <b>Mensaje al confirmar</b>
                  </div>
                  <div className="adm-event-body">{inv.rsvpMessage}</div>
                </div>
              </div>
            ) : null}
          </section>

          <section className="adm-card">
            <div className="adm-card-title">
              <h2>
                Personas ({guests.length}
                {inv.rsvpStatus === "yes" && guests.length ? ` · ${yes} asisten` : ""})
              </h2>
            </div>
            <div className="adm-people">
              {guests.map((g) => (
                <div key={g.id} className="adm-person">
                  <div className="who">
                    <b>{g.name}</b>
                    <div className="adm-subtle">
                      {g.relation || "—"}
                      {g.isChild && !/niñ/i.test(g.relation) ? " · niño/a" : ""}
                      {seatLabels.get(g.id) ? (
                        <Link href="/admin/mesas" className="adm-tag" style={{ marginLeft: 6, textDecoration: "none" }}>
                          🪑 {seatLabels.get(g.id)!.table} · silla {seatLabels.get(g.id)!.seat}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <div className="adm-seg" role="group" aria-label={`Asistencia de ${g.name}`}>
                    {(
                      [
                        ["yes", "Asiste", g.attending === true],
                        ["no", "No", g.attending === false],
                        ["unknown", "?", g.attending === null],
                      ] as const
                    ).map(([v, label, on]) => (
                      <form key={v} action={setGuestAttendingAction.bind(null, g.id, v)} style={{ display: "contents" }}>
                        <button type="submit" aria-pressed={on} className={v === "unknown" ? "unk" : v}>
                          {label}
                        </button>
                      </form>
                    ))}
                  </div>
                  <form action={removeGuestAction.bind(null, g.id)}>
                    <button type="submit" className="adm-icon-btn" title={`Quitar a ${g.name}`}>
                      ✕
                    </button>
                  </form>
                </div>
              ))}
              {!guests.length ? <div className="adm-empty">Sin personas en la lista.</div> : null}
            </div>
            <form action={addGuestAction.bind(null, inv.id)} className="adm-row-actions" style={{ marginTop: 12 }}>
              <input name="name" className="adm-input" placeholder="Nombre" required maxLength={80} style={{ flex: "1 1 140px", width: "auto" }} />
              <input name="relation" className="adm-input" placeholder="Relación" maxLength={40} style={{ flex: "1 1 100px", width: "auto" }} />
              <label className="adm-check">
                <input type="checkbox" name="isChild" /> Niño/a
              </label>
              <button type="submit" className="adm-btn">
                Agregar
              </button>
            </form>
          </section>

          <section className="adm-card">
            <div className="adm-card-title">
              <h2>Registrar respuesta manualmente</h2>
            </div>
            <form action={setRsvpAction.bind(null, inv.id)} className="adm-row-actions">
              <select name="status" className="adm-select" defaultValue={inv.rsvpStatus} style={{ width: "auto" }}>
                <option value="pending">Pendiente</option>
                <option value="yes">Sí asiste</option>
                <option value="no">No asiste</option>
              </select>
              <input
                name="attending"
                type="number"
                min={0}
                max={inv.seats}
                defaultValue={inv.rsvpAttending ?? inv.seats}
                className="adm-input"
                style={{ width: 90 }}
                aria-label="Personas que asisten"
              />
              <span className="adm-subtle">de {inv.seats}</span>
              <button type="submit" className="adm-btn">
                Guardar
              </button>
            </form>
            <p className="adm-subtle" style={{ margin: "8px 0 0" }}>
              Úsalo cuando te confirmen por teléfono o en persona.
            </p>
          </section>

          <section className="adm-card">
            <details className="adm-details">
              <summary className="adm-card-title" style={{ marginBottom: 0 }}>
                <h2>Editar datos</h2>
                <span className="adm-subtle">Mostrar ▾</span>
              </summary>
              <form action={updateInvitationAction.bind(null, inv.id)} className="adm-form-grid" style={{ marginTop: 14 }}>
                <div className="adm-field full">
                  <label htmlFor="f-name">Nombre en la tarjeta</label>
                  <input id="f-name" name="name" className="adm-input" defaultValue={inv.name} required maxLength={80} />
                </div>
                <div className="adm-field">
                  <label htmlFor="f-phone">Teléfono (WhatsApp)</label>
                  <input id="f-phone" name="phone" className="adm-input" defaultValue={inv.phone ?? ""} inputMode="tel" placeholder="3001234567" />
                </div>
                <div className="adm-field">
                  <label htmlFor="f-seats">Cupos</label>
                  <input id="f-seats" name="seats" type="number" min={1} max={20} className="adm-input" defaultValue={inv.seats} />
                </div>
                <div className="adm-field">
                  <label htmlFor="f-cat">Categoría</label>
                  <select id="f-cat" name="category" className="adm-select" defaultValue={inv.category}>
                    <option>Familia</option>
                    <option>Amigos</option>
                    <option>Trabajo</option>
                  </select>
                </div>
                <div className="adm-field">
                  <label htmlFor="f-tags">Etiquetas (separadas por coma)</label>
                  <input id="f-tags" name="tags" className="adm-input" defaultValue={inv.tags} placeholder="Padrinos, Mesa 3" />
                </div>
                <div className="full adm-row-actions" style={{ justifyContent: "space-between" }}>
                  <button type="submit" className="adm-btn primary">
                    Guardar cambios
                  </button>
                </div>
              </form>
              <form action={deleteInvitationAction.bind(null, inv.id)} style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                <ConfirmSubmit className="adm-btn danger sm" message={`¿Eliminar la invitación de ${inv.name}? No se puede deshacer.`}>
                  Eliminar invitación
                </ConfirmSubmit>
                <span className="adm-subtle" style={{ marginLeft: 8 }}>
                  Borra la invitación, sus personas y comentarios.
                </span>
              </form>
            </details>
          </section>
        </div>

        <div>
          <section className="adm-card">
            <div className="adm-card-title">
              <h2>Comentarios y seguimiento</h2>
              <span className="adm-subtle">{timeline.length} movimientos</span>
            </div>
            <NoteComposer action={addNoteAction.bind(null, inv.id)} placeholder={`Nota sobre ${inv.name}: llamadas, acuerdos, mesa, regalos…`} />
            <Timeline items={timeline} />
          </section>

          {chat.length ? (
            <section className="adm-card">
              <div className="adm-card-title">
                <h2>Conversación con las asesoras IA</h2>
                <span className="adm-subtle">{chat.length} mensajes</span>
              </div>
              <div>
<ChatTranscript messages={chat} />
</div>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
