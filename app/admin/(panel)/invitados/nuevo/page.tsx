import Link from "next/link";
import { createInvitationAction } from "@/app/admin/actions";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function NewInvitation({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  return (
    <>
      <div className="adm-head">
        <div>
          <Link href="/admin/invitados" className="adm-subtle" style={{ textDecoration: "none" }}>
            ← Invitados
          </Link>
          <h1 style={{ marginTop: 6 }}>Nueva invitación</h1>
          <p>Se genera un enlace personalizado listo para enviar por WhatsApp.</p>
        </div>
      </div>
      <section className="adm-card" style={{ maxWidth: 720 }}>
        <form action={createInvitationAction} className="adm-form-grid">
          {sp.error ? (
            <div className="full" style={{ color: "var(--bad)" }}>
              Escribe el nombre del invitado principal.
            </div>
          ) : null}
          <div className="adm-field full">
            <label htmlFor="n-name">Invitado principal (nombre en la tarjeta)</label>
            <input id="n-name" name="name" className="adm-input" required maxLength={80} placeholder="Ej. Familia Pérez o Andrea Silva" />
          </div>
          <div className="adm-field">
            <label htmlFor="n-phone">Teléfono (WhatsApp)</label>
            <input id="n-phone" name="phone" className="adm-input" inputMode="tel" placeholder="3001234567" />
          </div>
          <div className="adm-field">
            <label htmlFor="n-seats">Cupos</label>
            <input id="n-seats" name="seats" type="number" min={0} max={20} className="adm-input" placeholder="Por defecto: número de personas" aria-describedby="n-seats-hint" />
            <small id="n-seats-hint" className="adm-subtle">
              0 = sin cupo: no se le pide confirmar
            </small>
          </div>
          <div className="adm-field">
            <label htmlFor="n-cat">Categoría</label>
            <select id="n-cat" name="category" className="adm-select" defaultValue="Familia">
              <option>Familia</option>
              <option>Amigos</option>
              <option>Trabajo</option>
            </select>
          </div>
          <div className="adm-field">
            <label htmlFor="n-tags">Etiquetas</label>
            <input id="n-tags" name="tags" className="adm-input" placeholder="Padrinos, Mesa 3" />
          </div>
          <div className="adm-field full">
            <label htmlFor="n-guests">Personas (una por línea; agrega “(niño)” si aplica)</label>
            <textarea id="n-guests" name="guests" className="adm-textarea" placeholder={"Andrea Silva\nYamit"} />
          </div>
          <div className="adm-field full">
            <label htmlFor="n-note">Comentario inicial (opcional)</label>
            <textarea id="n-note" name="note" className="adm-textarea" placeholder="Ej. Confirmar si viene con acompañante" />
          </div>
          <div className="full adm-row-actions">
            <button type="submit" className="adm-btn primary">
              Crear invitación
            </button>
            <Link href="/admin/invitados" className="adm-btn">
              Cancelar
            </Link>
          </div>
        </form>
      </section>
    </>
  );
}
