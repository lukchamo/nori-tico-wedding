"use client";

import { useState, useTransition } from "react";
import { markSentAction } from "@/app/admin/actions";
import { invitationMessage, whatsappHref } from "@/lib/whatsapp";

type Props = { id: number; name: string; phone: string | null; seats: number; url: string; compact?: boolean };

export function SendButtons({ id, name, phone, seats, url, compact }: Props) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();
  const text = invitationMessage(name, seats, url);

  const sendWa = () => {
    window.open(whatsappHref(phone, text), "_blank", "noopener");
    startTransition(() => markSentAction(id, "whatsapp"));
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      startTransition(() => markSentAction(id, "link"));
    } catch {}
  };

  return (
    <div className="adm-row-actions">
      <button type="button" className={`adm-btn wa${compact ? " sm" : ""}`} onClick={sendWa} title={phone ? `Enviar a ${phone}` : "Sin teléfono: elegirás el contacto en WhatsApp"}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.6 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.6 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3zM12 21.7c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.8 1 1-3.7-.2-.4a9.8 9.8 0 0 1-1.5-5.2c0-5.4 4.4-9.8 9.9-9.8 2.6 0 5.1 1 7 2.9a9.7 9.7 0 0 1 2.9 7c0 5.4-4.5 9.8-9.9 9.8zm5.4-7.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.8.4 3.5 3.5 0 0 0-1.1 2.6c0 1.5 1.1 3 1.3 3.2s2.2 3.3 5.3 4.6c2 .8 2.7.9 3.7.8.6-.1 1.8-.7 2-1.5s.3-1.3.2-1.5-.3-.2-.6-.3z" />
        </svg>
        {compact ? "WhatsApp" : phone ? "Enviar por WhatsApp" : "WhatsApp (sin número)"}
      </button>
      <button type="button" className={`adm-btn${compact ? " sm" : ""}`} onClick={copy}>
        {copied ? "¡Copiado!" : compact ? "Copiar" : "Copiar mensaje"}
      </button>
    </div>
  );
}
