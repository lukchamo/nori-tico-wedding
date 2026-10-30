import Link from "next/link";
import { StagePill } from "@/components/admin/StagePill";
import { Timeline } from "@/components/admin/Timeline";
import { PLATE_COST, WEDDING } from "@/lib/config";
import { fmtCOP, fmtRelative } from "@/lib/format";
import { STAGES, getFeed, getStats, listInvitations, type Stage } from "@/lib/invitations";

const ORDER: Stage[] = ["por_enviar", "enviada", "vista", "confirmada", "declinada"];

export default async function Dashboard() {
  const [stats, feed, messages, rows] = await Promise.all([getStats(), getFeed(undefined, 12, { hideSystem: true }), getFeed(["message"], 6), listInvitations()]);
  const days = Math.max(0, Math.ceil((new Date(WEDDING.dateISO).getTime() - Date.now()) / 86_400_000));
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  const projected = stats.attending + Math.round(stats.seatsPending * 0.8);
  const adults = stats.seats - stats.children;
  const budget = adults * PLATE_COST.adult + stats.children * PLATE_COST.child;
  const toSend = rows.filter((r) => r.stage === "por_enviar").slice(0, 8);

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Resumen de invitados</h1>
          <p>
            Faltan <b>{days}</b> días para el {WEDDING.dateLabel}.
          </p>
        </div>
        <div className="adm-row-actions">
          <a className="adm-btn" href="/admin/export">
            Exportar CSV
          </a>
          <Link className="adm-btn primary" href="/admin/invitados/nuevo">
            + Nueva invitación
          </Link>
        </div>
      </div>

      <div className="adm-kpis">
        <div className="adm-kpi accent">
          <div className="label">Confirmados</div>
          <div className="value">{stats.attending}</div>
          <div className="sub">
            personas de {stats.seats} cupos · {pct(stats.attending, stats.seats)}%
          </div>
        </div>
        <div className="adm-kpi">
          <div className="label">Invitaciones</div>
          <div className="value">{stats.invitations}</div>
          <div className="sub">{stats.seats} personas invitadas</div>
        </div>
        <div className="adm-kpi">
          <div className="label">Pendientes</div>
          <div className="value">{stats.seatsPending}</div>
          <div className="sub">cupos sin respuesta</div>
        </div>
        <div className="adm-kpi">
          <div className="label">No asisten</div>
          <div className="value">{stats.seatsNo}</div>
          <div className="sub">cupos liberados</div>
        </div>
        <div className="adm-kpi">
          <div className="label">Enviadas · vistas</div>
          <div className="value">
            {stats.sent} · {stats.opened}
          </div>
          <div className="sub">{stats.invitations - stats.sent} por enviar</div>
        </div>
        <div className="adm-kpi">
          <div className="label">Proyección</div>
          <div className="value">{projected}</div>
          <div className="sub">confirmados + 80% de pendientes</div>
        </div>
      </div>

      <div className="adm-two">
        <div>
          <section className="adm-card">
            <div className="adm-card-title">
              <h2>Embudo de invitaciones</h2>
              <Link href="/admin/invitados">Ver lista →</Link>
            </div>
            <div className="adm-funnel">
              {ORDER.map((s) => (
                <Link key={s} href={`/admin/invitados?etapa=${s}`} className="adm-funnel-row" style={{ textDecoration: "none" }}>
                  <span>{STAGES[s].label}</span>
                  <div className="adm-funnel-bar">
                    <span className={`bg-${STAGES[s].tone}`} style={{ width: `${pct(stats.byStage[s], stats.invitations)}%` }} />
                  </div>
                  <b>{stats.byStage[s]}</b>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: 18 }}>
              <div className="adm-label" style={{ marginBottom: 6 }}>
                Cupos ({stats.seats})
              </div>
              <div className="adm-progress" aria-label="Distribución de cupos">
                <span className="bg-ok" style={{ width: `${pct(stats.attending, stats.seats)}%` }} />
                <span className="bg-gold" style={{ width: `${pct(stats.seatsYes - stats.attending, stats.seats)}%` }} />
                <span className="bg-bad" style={{ width: `${pct(stats.seatsNo, stats.seats)}%` }} />
              </div>
              <div className="adm-legend">
                <span>
                  <i className="bg-ok" />
                  Asisten {stats.attending}
                </span>
                <span>
                  <i className="bg-gold" />
                  Cupos no usados {stats.seatsYes - stats.attending}
                </span>
                <span>
                  <i className="bg-bad" />
                  No asisten {stats.seatsNo}
                </span>
                <span>
                  <i className="bg-muted" />
                  Pendientes {stats.seatsPending}
                </span>
              </div>
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-title">
              <h2>Por categoría</h2>
            </div>
            <div className="adm-table" style={{ border: "none" }}>
              <div className="adm-tr head" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr" }}>
                <span>Categoría</span>
                <span>Invitaciones</span>
                <span>Cupos</span>
                <span>Confirmados</span>
              </div>
              {stats.byCategory.map((c) => (
                <Link
                  key={c.name}
                  href={`/admin/invitados?categoria=${encodeURIComponent(c.name)}`}
                  className="adm-tr"
                  style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr", textDecoration: "none" }}
                >
                  <b>{c.name}</b>
                  <span className="adm-num">{c.invitations}</span>
                  <span className="adm-num">{c.seats}</span>
                  <span className="adm-num">{c.attending}</span>
                </Link>
              ))}
            </div>
            <p className="adm-subtle" style={{ marginBottom: 0 }}>
              {stats.children} niños en la lista · costo estimado de platos para {stats.seats} cupos: <b>{fmtCOP(budget)}</b> ({fmtCOP(PLATE_COST.adult)} adulto,{" "}
              {fmtCOP(PLATE_COST.child)} niño).
            </p>
          </section>

          <section className="adm-card">
            <div className="adm-card-title">
              <h2>Siguientes por enviar</h2>
              <Link href="/admin/invitados?etapa=por_enviar">Ver todas →</Link>
            </div>
            {toSend.length ? (
              <div className="adm-people">
                {toSend.map((r) => (
                  <div key={r.id} className="adm-person">
                    <div className="who">
                      <Link href={`/admin/invitados/${r.id}`} className="adm-name">
                        {r.name}
                      </Link>
                      <div className="adm-subtle">
                        {r.seats} cupo{r.seats === 1 ? "" : "s"} · {r.phone ? r.phone : "sin teléfono"}
                      </div>
                    </div>
                    <StagePill stage={r.stage} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="adm-empty">¡Todas las invitaciones fueron enviadas! 🎉</div>
            )}
          </section>
        </div>

        <div>
          <section className="adm-card">
            <div className="adm-card-title">
              <h2>Mensajes de los invitados</h2>
              <Link href="/admin/actividad?tipo=message">Ver todos →</Link>
            </div>
            {messages.length ? (
              <div className="adm-people">
                {messages.map((m) => (
                  <div key={m.id} className="adm-person" style={{ alignItems: "flex-start" }}>
                    <div className="who">
                      <div className="adm-subtle">
                        <Link href={`/admin/invitados/${m.invitationId}`} className="adm-name" style={{ color: "var(--ink)" }}>
                          {m.invitationName ?? m.author}
                        </Link>{" "}
                        · {fmtRelative(m.createdAt)}
                      </div>
                      <div style={{ fontStyle: "italic", marginTop: 2 }}>“{m.body}”</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="adm-empty">Cuando alguien deje un mensaje al confirmar, aparecerá aquí.</div>
            )}
          </section>

          <section className="adm-card">
            <div className="adm-card-title">
              <h2>Últimos movimientos</h2>
              <Link href="/admin/actividad">Ver actividad →</Link>
            </div>
            <Timeline items={feed} showInvitation />
          </section>
        </div>
      </div>
    </>
  );
}
