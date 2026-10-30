"use client";

import { useState } from "react";
import type { PublicInvitation } from "@/lib/invitations";

type Step = "idle" | "asking" | "yes-form" | "no-form" | "done-yes" | "done-no";

type Props = {
  invitation: PublicInvitation | null;
  /** Enlaces antiguos tipo ?nombre=&cupos= sin invitación registrada. */
  legacyName?: string | null;
  legacySeats?: number | null;
};

export function Rsvp({ invitation, legacyName, legacySeats }: Props) {
  const answered = invitation?.rsvpStatus === "yes" ? "done-yes" : invitation?.rsvpStatus === "no" ? "done-no" : null;
  const [step, setStep] = useState<Step>(answered ?? "idle");
  const [fromServer, setFromServer] = useState(!!answered);

  const maxSeats = invitation?.seats ?? legacySeats ?? 6;
  const people = invitation?.guests ?? [];
  const [checked, setChecked] = useState<Set<number>>(() => {
    const prev = people.filter((g) => g.attending);
    const base = prev.length ? prev : people;
    return new Set(base.slice(0, maxSeats).map((g) => g.id));
  });
  const [count, setCount] = useState<number>(invitation?.rsvpAttending || invitation?.seats || legacySeats || 1);
  const [name, setName] = useState(legacyName ?? "");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ attending: number; message: boolean } | null>(
    invitation && answered ? { attending: invitation.rsvpAttending ?? 0, message: !!invitation.rsvpMessage } : null,
  );

  const needsName = !invitation;

  const toggle = (id: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < maxSeats) next.add(id);
      return next;
    });
  };

  async function send(status: "yes" | "no") {
    setError(null);
    if (needsName && !name.trim()) {
      setError("Escribe tu nombre para que sepamos quién eres.");
      return;
    }
    if (status === "yes" && people.length && checked.size === 0) {
      setError("Marca al menos una persona o elige “No podré ir”.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: invitation?.code ?? null,
          name: needsName ? name : null,
          phone: needsName ? phone : null,
          status,
          attending: people.length ? null : count,
          guestIds: people.length ? [...checked] : null,
          message,
        }),
      });
      const data = (await res.json().catch(() => null)) as { attending?: number; error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "No pudimos guardar tu respuesta.");
      setResult({ attending: data?.attending ?? 0, message: !!message.trim() });
      setFromServer(false);
      setStep(status === "yes" ? "done-yes" : "done-no");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar tu respuesta. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  const nameFields = needsName ? (
    <>
      <label className="inv-form-label" htmlFor="rsvp-name">
        Tu nombre
      </label>
      <input id="rsvp-name" className="inv-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" maxLength={80} autoComplete="name" />
    </>
  ) : null;

  const messageField = (
    <>
      <label className="inv-form-label" htmlFor="rsvp-msg">
        Un mensaje para los novios (opcional)
      </label>
      <textarea id="rsvp-msg" className="inv-textarea" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} placeholder="Escríbenos unas palabras…" />
    </>
  );

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }} aria-live="polite">
      {step === "idle" && (
        <button type="button" onClick={() => setStep("asking")} className="inv-btn-solid" style={{ marginTop: 8, padding: "14px 34px" }}>
          Confirmar asistencia
        </button>
      )}

      {step === "asking" && (
        <div className="inv-rsvp-row">
          <button type="button" onClick={() => setStep("yes-form")} className="inv-pill inv-pill-solid">
            Sí, allí estaré
          </button>
          <button type="button" onClick={() => setStep("no-form")} className="inv-pill inv-pill-ghost">
            No podré ir
          </button>
        </div>
      )}

      {step === "yes-form" && (
        <form
          className="inv-form"
          onSubmit={(e) => {
            e.preventDefault();
            send("yes");
          }}
        >
          {nameFields}
          {people.length ? (
            <>
              <span className="inv-form-label">¿Quiénes asistirán?</span>
              <div className="inv-guest-list">
                {people.map((g) => {
                  const on = checked.has(g.id);
                  return (
                    <label key={g.id} className={`inv-guest${on ? "" : " is-off"}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(g.id)} />
                      <span>{g.name}</span>
                      {g.isChild ? <small>Niño/a</small> : null}
                    </label>
                  );
                })}
              </div>
            </>
          ) : maxSeats > 1 || needsName ? (
            <>
              <span className="inv-form-label" style={{ textAlign: "center" }}>
                ¿Cuántas personas asistirán?
              </span>
              <div className="inv-stepper">
                <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} disabled={count <= 1} aria-label="Menos">
                  −
                </button>
                <output className="display">{count}</output>
                <button type="button" onClick={() => setCount((c) => Math.min(maxSeats, c + 1))} disabled={count >= maxSeats} aria-label="Más">
                  +
                </button>
              </div>
            </>
          ) : null}
          {needsName ? (
            <>
              <label className="inv-form-label" htmlFor="rsvp-phone">
                Celular (opcional)
              </label>
              <input id="rsvp-phone" className="inv-input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={20} autoComplete="tel" />
            </>
          ) : null}
          {messageField}
          {error ? <div className="inv-error">{error}</div> : null}
          <div className="inv-form-actions">
            <button type="submit" className="inv-pill inv-pill-solid" disabled={sending}>
              {sending ? "Enviando…" : "Enviar confirmación"}
            </button>
            <button type="button" className="inv-pill inv-pill-ghost" onClick={() => setStep("asking")} disabled={sending}>
              Volver
            </button>
          </div>
        </form>
      )}

      {step === "no-form" && (
        <form
          className="inv-form"
          onSubmit={(e) => {
            e.preventDefault();
            send("no");
          }}
        >
          {nameFields}
          {messageField}
          {error ? <div className="inv-error">{error}</div> : null}
          <div className="inv-form-actions">
            <button type="submit" className="inv-pill inv-pill-solid" disabled={sending}>
              {sending ? "Enviando…" : "Enviar respuesta"}
            </button>
            <button type="button" className="inv-pill inv-pill-ghost" onClick={() => setStep("asking")} disabled={sending}>
              Volver
            </button>
          </div>
        </form>
      )}

      {step === "done-yes" && (
        <>
          <div className="display inv-thanks">¡Gracias por confirmar! Te esperamos con mucha alegría.</div>
          {result && maxSeats > 1 ? (
            <div className="serif" style={{ fontSize: 15, color: "#6E7C4D", fontStyle: "italic", marginTop: 6 }}>
              {result.attending === 1 ? "1 persona confirmada" : `${result.attending} personas confirmadas`}
            </div>
          ) : null}
          {result?.message && !fromServer ? (
            <div className="serif" style={{ fontSize: 14, color: "#6E7C4D", marginTop: 4 }}>
              Tu mensaje ya les llegó a los novios 💛
            </div>
          ) : null}
          <button type="button" className="inv-link" style={{ marginTop: 14 }} onClick={() => setStep("asking")}>
            Cambiar mi respuesta
          </button>
        </>
      )}

      {step === "done-no" && (
        <>
          <div className="display inv-thanks">Gracias por avisarnos. ¡Te extrañaremos ese día!</div>
          <button type="button" className="inv-link" style={{ marginTop: 14 }} onClick={() => setStep("asking")}>
            Cambiar mi respuesta
          </button>
        </>
      )}
    </div>
  );
}
