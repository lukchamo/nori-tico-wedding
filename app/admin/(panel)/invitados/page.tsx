import Link from "next/link";
import { SendButtons } from "@/components/admin/SendButtons";
import { StagePill } from "@/components/admin/StagePill";
import { fmtPhone, fmtRelative, normalizeName } from "@/lib/format";
import { STAGES, listInvitations, type Stage } from "@/lib/invitations";
import { siteUrl } from "@/lib/site";

type Search = Promise<Record<string, string | string[] | undefined>>;

const ORDER: Stage[] = ["por_enviar", "enviada", "vista", "confirmada", "declinada"];

export default async function Invitados({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const etapa = typeof sp.etapa === "string" && sp.etapa in STAGES ? (sp.etapa as Stage) : null;
  const categoria = typeof sp.categoria === "string" ? sp.categoria : "";
  const sinTel = sp.sintel === "1";
  const orden = typeof sp.orden === "string" ? sp.orden : "nombre";

  const [all, base] = await Promise.all([listInvitations(), siteUrl()]);
  const categories = [...new Set(all.map((r) => r.category))].sort();

  const nq = normalizeName(q);
  const scoped = all.filter(
    (r) =>
      (!nq || normalizeName(r.name).includes(nq) || (r.phone ?? "").includes(nq.replace(/\D/g, "") || "§") || normalizeName(r.tags).includes(nq)) &&
      (!categoria || r.category === categoria) &&
      (!sinTel || !r.phone),
  );
  const rows = scoped.filter((r) => !etapa || r.stage === etapa);
  if (orden === "actividad") rows.sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0));
  if (orden === "cupos") rows.sort((a, b) => b.seats - a.seats);

  const link = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const cur: Record<string, string | null> = { q: q || null, etapa, categoria: categoria || null, sintel: sinTel ? "1" : null, orden: orden !== "nombre" ? orden : null };
    for (const [k, v] of Object.entries({ ...cur, ...patch })) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/invitados${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Invitados</h1>
          <p>
            {rows.length} invitación(es) · {rows.reduce((s, r) => s + r.seats, 0)} cupos en esta vista
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

      <form className="adm-filters" action="/admin/invitados">
        <input className="adm-input" name="q" defaultValue={q} placeholder="Buscar nombre, teléfono o etiqueta…" />
        <select className="adm-select" name="categoria" defaultValue={categoria}>
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="adm-select" name="orden" defaultValue={orden}>
          <option value="nombre">Orden: nombre</option>
          <option value="actividad">Orden: última actividad</option>
          <option value="cupos">Orden: más cupos</option>
        </select>
        <label className="adm-check">
          <input type="checkbox" name="sintel" value="1" defaultChecked={sinTel} /> Sin teléfono
        </label>
        {etapa ? <input type="hidden" name="etapa" value={etapa} /> : null}
        <button className="adm-btn" type="submit">
          Filtrar
        </button>
        {q || categoria || sinTel || etapa ? (
          <Link className="adm-btn" href="/admin/invitados">
            Limpiar
          </Link>
        ) : null}
      </form>

      <div className="adm-chips">
        <Link className="adm-chip" href={link({ etapa: null })} aria-current={!etapa ? "true" : undefined}>
          Todas<b>{scoped.length}</b>
        </Link>
        {ORDER.map((s) => (
          <Link key={s} className="adm-chip" href={link({ etapa: s })} aria-current={etapa === s ? "true" : undefined}>
            {STAGES[s].label}
            <b>{scoped.filter((r) => r.stage === s).length}</b>
          </Link>
        ))}
      </div>

      <div className="adm-table">
        <div className="adm-tr head">
          <span>Invitado principal</span>
          <span>Cupos</span>
          <span>Estado</span>
          <span>Aperturas</span>
          <span>Último movimiento</span>
          <span>Enviar</span>
        </div>
        {rows.length ? (
          rows.map((r) => (
            <div key={r.id} className="adm-tr">
              <div style={{ minWidth: 0 }}>
                <Link href={`/admin/invitados/${r.id}`} className="adm-name">
                  {r.name}
                </Link>
                <div className="adm-subtle">
                  {r.category}
                  {r.phone ? ` · ${fmtPhone(r.phone)}` : " · sin teléfono"}
                  {r.tags
                    ? r.tags.split(",").map((t) => (
                        <span key={t} className="adm-tag" style={{ marginLeft: 6 }}>
                          {t}
                        </span>
                      ))
                    : null}
                </div>
              </div>
              <span className="c-seats adm-num">
                {r.rsvpStatus === "yes" ? `${r.rsvpAttending}/${r.seats}` : r.seats}
                <span className="adm-subtle"> {r.people !== r.seats ? `(${r.people} en lista)` : ""}</span>
              </span>
              <span className="c-stage">
                <StagePill stage={r.stage} />
              </span>
              <span className="c-open adm-subtle">{r.openCount ? `${r.openCount}× · ${fmtRelative(r.lastOpenedAt)}` : "—"}</span>
              <span className="c-last adm-subtle">{fmtRelative(r.lastActivityAt)}</span>
              <span className="c-actions">
                <SendButtons id={r.id} name={r.name} phone={r.phone} seats={r.seats} url={`${base}/i/${r.code}`} compact />
              </span>
            </div>
          ))
        ) : (
          <div className="adm-empty">No hay invitaciones con estos filtros.</div>
        )}
      </div>
    </>
  );
}
