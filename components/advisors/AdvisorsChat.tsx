"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { WEDDING } from "@/lib/config";
import { sparkle } from "@/lib/effects";
import { readAiStream } from "@/lib/sse";

type Msg = { role: "user" | "assistant"; content: string };

type Props = { code: string | null; guestName: string | null; backHref: string; suggestions: string[] };

const STORAGE_KEY = "nt-asesoras";

function newSessionId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function AdvisorsChat({ code, guestName, backHref, suggestions }: Props) {
  const greeting = `¡Hola${guestName ? `, ${guestName}` : ""}! 💐 Somos Gabi y Vale, las asesoras de outfits de la boda de mamá y papá. Es una boda de día, ${WEDDING.dressCode.toLowerCase()}, con colores frescos. ¿Qué te gustaría ponerte? Cuéntanos y te ayudamos ✨`;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<string>("");
  const endRef = useRef<HTMLDivElement>(null);
  const storageKey = `${STORAGE_KEY}:${code ?? "general"}`;

  // Conversación guardada solo en este navegador (comodidad: no se pierde al volver de la tarjeta).
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null") as { id: string; messages: Msg[] } | null;
      if (saved?.id) {
        sessionRef.current = saved.id;
        setMessages(saved.messages ?? []);
        return;
      }
    } catch {}
    sessionRef.current = newSessionId();
  }, [storageKey]);

  useEffect(() => {
    try {
      if (sessionRef.current) sessionStorage.setItem(storageKey, JSON.stringify({ id: sessionRef.current, messages }));
    } catch {}
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, storageKey]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setError(null);
    setInput("");
    const history: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history, sessionId: sessionRef.current, code }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "No pudimos responder ahora.");
      }
      let acc = "";
      await readAiStream(res.body, (t) => {
        acc += t;
        setMessages([...history, { role: "assistant", content: acc }]);
      });
      if (!acc.trim()) setMessages([...history, { role: "assistant", content: "Uy, nos quedamos pensando 🙈 ¿Nos repites la pregunta?" }]);
    } catch (e) {
      setMessages(history);
      setError(e instanceof Error ? e.message : "No pudimos responder ahora.");
    } finally {
      setBusy(false);
    }
  }

  const last = messages.at(-1);
  const waiting = busy && last?.role === "assistant" && !last.content;

  return (
    <div className="adv-root">
      <div className="adv-card serif">
        <header className="adv-header">
          <Link href={backHref} className="adv-back">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Volver a la tarjeta
          </Link>
          <div className="adv-avatars" aria-hidden="true">
            <div className="adv-avatar script" style={{ background: "#D3A8A0" }}>
              G
            </div>
            <div className="adv-avatar script" style={{ background: "#9FB4C7" }}>
              V
            </div>
          </div>
          <h1 className="script adv-title" style={{ fontWeight: 400, marginBottom: 0 }}>
            Gabriela y Valentina
          </h1>
          <div className="adv-sub">Asesoras de outfits</div>
          <div className="adv-palette" aria-label="Paleta sugerida">
            {WEDDING.colors.map((c) => (
              <span key={c.id} title={c.name} style={{ background: c.hex }} />
            ))}
          </div>
        </header>

        <div className="adv-log" aria-live="polite">
          <div className="adv-msg bot">{greeting}</div>
          {messages.map((m, i) =>
            m.role === "assistant" && !m.content ? null : (
              <div key={i} className={`adv-msg ${m.role === "user" ? "me" : "bot"}`}>
                {m.content}
              </div>
            ),
          )}
          {waiting ? (
            <div className="adv-msg bot adv-typing" aria-label="Escribiendo">
              <span />
              <span />
              <span />
            </div>
          ) : null}
          {error ? (
            <div className="adv-note" role="alert">
              {error}
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        {messages.length === 0 ? (
          <div className="adv-chips">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="adv-chip"
                onClick={(e) => {
                  sparkle(e.currentTarget, ["#C9A961", "#D3A8A0", "#9FB4C7", "#8A9A6B"]);
                  ask(s);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        <div className="adv-note">Recuerda: los novios se reservan el blanco y el marfil 🤍</div>

        <form
          className="adv-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) sparkle(e.currentTarget.querySelector(".adv-send"), ["#C9A961", "#D3A8A0", "#9FB4C7", "#8A9A6B"]);
            ask(input);
          }}
        >
          <input
            className="adv-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregúntanos qué ponerte…"
            maxLength={600}
            aria-label="Tu pregunta"
          />
          <button type="submit" className="adv-send" disabled={busy || !input.trim()} aria-label="Enviar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22l-4-9-9-4 20-7z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
