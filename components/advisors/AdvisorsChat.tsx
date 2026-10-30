"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ADVISORS_START, STYLE_OPTIONS, parseAdvisorReply, type QuickOption } from "@/lib/advisors";
import { WEDDING } from "@/lib/config";
import { sparkle } from "@/lib/effects";
import { fmtBytes, optimizeImage } from "@/lib/image";
import { matchLooks } from "@/lib/lookbook";
import { readAiStream } from "@/lib/sse";
import { Gallery, Lightbox, LookCarousel, RichText } from "./LookViewer";

type Msg = { role: "user" | "assistant"; content: string; image?: string; hadImage?: boolean };
type Props = { code: string | null; guestName: string | null; backHref: string };

const STORAGE_KEY = "nt-asesoras";
const COLORS = ["#C9A961", "#D3A8A0", "#9FB4C7", "#8A9A6B"];
const PHOTO_PROMPT = "Analicen mi outfit, por favor. ¿Sirve para la boda?";

function newSessionId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function AdvisorsChat({ code, guestName, backHref }: Props) {
  const greeting = `¡Hola${guestName ? `, ${guestName}` : ""}! 💐 Somos Gabi y Vale, las asesoras de outfits de la boda de mamá y papá. Es una boda de día, ${WEDDING.dressCode.toLowerCase()}, con colores frescos. Elige una opción, escríbenos o mándanos una foto de tu outfit y te decimos cómo se ve ✨`;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ dataUrl: string; info: string } | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [viewer, setViewer] = useState<{ ids: string[]; index: number } | null>(null);
  const [gallery, setGallery] = useState(false);
  const sessionRef = useRef<string>("");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const storageKey = `${STORAGE_KEY}:${code ?? "general"}`;

  // Conversación guardada solo en este navegador (sin las fotos, que no se guardan en ningún lado).
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
      if (sessionRef.current) {
        const slim = messages.map(({ image, ...m }) => (image ? { ...m, hadImage: true } : m));
        sessionStorage.setItem(storageKey, JSON.stringify({ id: sessionRef.current, messages: slim }));
      }
    } catch {}
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, storageKey]);

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setError(null);
    setOptimizing(true);
    try {
      const img = await optimizeImage(file);
      setPhoto({ dataUrl: img.dataUrl, info: `Optimizada: ${fmtBytes(img.originalBytes)} → ${fmtBytes(img.bytes)} · ${img.width}×${img.height}` });
      inputRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos leer la foto.");
    } finally {
      setOptimizing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function ask(text: string, withPhoto = photo?.dataUrl ?? null) {
    const q = (text.trim() || (withPhoto ? PHOTO_PROMPT : "")).slice(0, 600);
    if (!q || busy) return;
    setError(null);
    setInput("");
    setPhoto(null);
    const userMsg: Msg = { role: "user", content: q, ...(withPhoto ? { image: withPhoto } : {}) };
    const history: Msg[] = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.role,
            content: m.image || m.hadImage ? `${m.content} [compartió una foto de su outfit]` : m.content,
          })),
          image: withPhoto,
          sessionId: sessionRef.current,
          code,
        }),
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
      setMessages(messages);
      if (withPhoto) setPhoto({ dataUrl: withPhoto, info: "Lista para enviar" });
      setError(e instanceof Error ? e.message : "No pudimos responder ahora.");
    } finally {
      setBusy(false);
    }
  }

  function runOption(o: QuickOption, el?: Element | null) {
    sparkle(el, COLORS);
    if (o.action === "photo") fileRef.current?.click();
    else if (o.action === "lookbook") setGallery(true);
    else if (o.prompt) ask(o.prompt, null);
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const waiting = busy && lastAssistant && !lastAssistant.content && messages.at(-1) === lastAssistant;

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
          <button type="button" className="adv-back right" onClick={(e) => runOption({ label: "", action: "lookbook" }, e.currentTarget)}>
            ✨ Lookbook
          </button>
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
          {messages.length === 0 ? (
            <div className="adv-start">
              {ADVISORS_START.map((o) => (
                <button key={o.label} type="button" className={`adv-option${o.action ? " accent" : ""}`} onClick={(e) => runOption(o, e.currentTarget)}>
                  {o.label}
                </button>
              ))}
            </div>
          ) : null}

          {messages.map((m, i) => {
            if (m.role === "user") {
              return (
                <div key={i} className="adv-msg me">
                  {m.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="adv-msg-photo" src={m.image} alt="Foto de tu outfit" />
                  ) : m.hadImage ? (
                    <div className="adv-msg-photo-placeholder">📷 Foto analizada</div>
                  ) : null}
                  {m.content}
                </div>
              );
            }
            if (!m.content) return null;
            const parsed = parseAdvisorReply(m.content);
            const isLast = m === lastAssistant;
            const done = !(busy && isLast);
            const prevUser = messages[i - 1]?.content ?? "";
            const looks = parsed.looks.length ? parsed.looks : done ? matchLooks(`${prevUser} ${parsed.text}`) : [];
            const options: QuickOption[] = parsed.options.length
              ? parsed.options.map((label) => (/foto/i.test(label) ? { label: `📸 ${label}`, action: "photo" as const } : { label, prompt: label }))
              : /estilo/i.test(parsed.text)
                ? STYLE_OPTIONS
                : [];
            return (
              <div key={i} className="adv-turn">
                <div className="adv-msg bot">
                  <RichText text={parsed.text} />
                </div>
                {done && looks.length ? <LookCarousel ids={looks} onOpen={(ids, index) => setViewer({ ids, index })} /> : null}
                {done && isLast && !busy && options.length ? (
                  <div className="adv-start compact">
                    {options.map((o) => (
                      <button key={o.label} type="button" className={`adv-option${o.action ? " accent" : ""}`} onClick={(e) => runOption(o, e.currentTarget)}>
                        {o.label}
                      </button>
                    ))}
                    <button type="button" className="adv-option accent" onClick={(e) => runOption({ label: "", action: "photo" }, e.currentTarget)}>
                      📸 Enviar foto
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
          {waiting ? (
            <div className="adv-msg bot adv-typing" aria-label="Escribiendo">
              <span />
              <span />
              <span />
            </div>
          ) : null}
          {error ? (
            <div className="adv-note adv-error" role="alert">
              {error}
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="adv-note">Recuerda: los novios se reservan el blanco y el marfil 🤍</div>

        <div className="adv-composer">
          {photo || optimizing ? (
            <div className="adv-photo-preview">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.dataUrl} alt="Foto lista para enviar" />
              ) : (
                <div className="adv-photo-loading" />
              )}
              <div>
                <b>{optimizing ? "Optimizando tu foto…" : "Foto lista ✨"}</b>
                <small>{photo?.info ?? "Reducimos el tamaño para enviarla rápido"}</small>
              </div>
              {photo ? (
                <button type="button" onClick={() => setPhoto(null)} aria-label="Quitar foto">
                  ✕
                </button>
              ) : null}
            </div>
          ) : null}
          <form
            className="adv-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim() || photo) sparkle(e.currentTarget.querySelector(".adv-send"), COLORS);
              ask(input);
            }}
          >
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
            <button type="button" className="adv-attach" onClick={() => fileRef.current?.click()} aria-label="Subir foto de tu outfit" disabled={busy}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 8h3l2-2h6l2 2h3v11H4z" />
                <circle cx="12" cy="13.5" r="3.5" />
              </svg>
            </button>
            <input
              ref={inputRef}
              className="adv-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={photo ? "Cuéntanos algo de la foto (opcional)…" : "Pregúntanos qué ponerte…"}
              maxLength={600}
              aria-label="Tu pregunta"
            />
            <button type="submit" className="adv-send" disabled={busy || optimizing || (!input.trim() && !photo)} aria-label="Enviar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {gallery ? (
        <Gallery
          onClose={() => setGallery(false)}
          onOpen={(ids, index) => setViewer({ ids, index })}
        />
      ) : null}
      {viewer ? (
        <Lightbox
          ids={viewer.ids}
          index={viewer.index}
          onClose={() => setViewer(null)}
          onNavigate={(ids, index) => setViewer({ ids, index })}
          onAsk={(title) => {
            setViewer(null);
            setGallery(false);
            ask(`Cuéntenme cómo combinar el look «${title}» y si me sirve para la boda.`, null);
          }}
        />
      ) : null}
    </div>
  );
}
