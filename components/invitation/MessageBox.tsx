"use client";

import { useRef, useState } from "react";
import { celebrate } from "@/lib/effects";
import type { PublicInvitation } from "@/lib/invitations";

type Props = {
  /** Con invitación el mensaje queda en su ficha; sin ella (enlace general) se pide el nombre. */
  invitation: Pick<PublicInvitation, "code" | "name"> | null;
};

/** Tarjeta de participación: lo único que se puede hacer es enviar un mensaje a los novios. */
export function MessageBox({ invitation }: Props) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!invitation && !name.trim()) {
      setError("Escribe tu nombre para que sepamos quién eres.");
      return;
    }
    if (!message.trim()) {
      setError("Escribe tu mensaje.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: invitation?.code ?? null, name: invitation ? null : name, message }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "No pudimos enviar tu mensaje.");
      celebrate(submitRef.current);
      setSent(true);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar tu mensaje. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="inv-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }} aria-live="polite">
        <div className="display inv-thanks">¡Gracias! Tu mensaje ya les llegó a los novios 💛</div>
        <button type="button" className="inv-link" onClick={() => setSent(false)}>
          Escribir otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form className="inv-form" onSubmit={send} aria-live="polite">
      {invitation ? null : (
        <>
          <label className="inv-form-label" htmlFor="msg-name">
            Tu nombre
          </label>
          <input id="msg-name" className="inv-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" maxLength={80} autoComplete="name" />
        </>
      )}
      <label className="inv-form-label" htmlFor="msg-text">
        Tu mensaje para los novios
      </label>
      <textarea id="msg-text" className="inv-textarea" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} placeholder="Escríbenos unas palabras…" />
      {error ? <div className="inv-error">{error}</div> : null}
      <div className="inv-form-actions">
        <button type="submit" ref={submitRef} className="inv-pill inv-pill-solid" disabled={sending}>
          {sending ? "Enviando…" : "Enviar mensaje"}
        </button>
      </div>
    </form>
  );
}
