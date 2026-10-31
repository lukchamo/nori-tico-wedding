"use client";

import { useRef, useState } from "react";
import { WEDDING } from "@/lib/config";
import { giftBurst, sparkle } from "@/lib/effects";
import { GiftIcon } from "./Ornaments";

function CopyIcon({ size }: { size: number }) {
  return (
    <span className="inv-copy-icon" style={{ width: size, height: size }}>
      <svg className="cp" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6E7C4D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      <svg className="ok" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

function useCopied() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copy = (text: string, el?: Element | null) => {
    sparkle(el);
    try {
      navigator.clipboard?.writeText(text);
    } catch {}
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };
  return [copied, copy] as const;
}

export function GiftEnvelope() {
  const [open, setOpen] = useState(false);
  const [numCopied, copyNum] = useCopied();
  const [keyCopied, copyKey] = useCopied();
  const card = useRef<HTMLDivElement>(null);

  const envBtn = useRef<HTMLButtonElement>(null);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) setTimeout(() => giftBurst(envBtn.current), 380);
    if (next) setTimeout(() => card.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 650);
  };

  return (
    <div className={open ? "is-gift-open" : undefined} style={{ width: "100%" }}>
      <button type="button" ref={envBtn} className="inv-gift-env" onClick={toggle} aria-expanded={open} aria-label="Abrir sobre de regalo">
        <div className="inv-gift-body">
          <GiftIcon size={26} color="#6E7C4D" width={1.3} />
        </div>
        <div className="inv-gift-flap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#C9A961" stroke="#FBF9F2" strokeWidth="1" aria-hidden="true">
            <path d="M12 21s-8-4.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-8 11-8 11z" />
          </svg>
        </div>
      </button>
      <div className="inv-gift-hint">{open ? "Toca el sobre para cerrar" : "Toca el sobre para abrir"}</div>

      {/* Cerrado, el panel es invisible: inert lo saca del recorrido con Tab y del lector de pantalla. */}
      <div className="inv-gift-panel" inert={!open}>
        <div className="inv-gift-card" ref={card}>
          <div className="inv-gift-bank">{WEDDING.gift.bank}</div>
          <button type="button" className={`inv-copy inv-copy-num serif${numCopied ? " is-copied" : ""}`} onClick={(e) => copyNum(WEDDING.gift.account, e.currentTarget)}>
            <span>{WEDDING.gift.account}</span>
            <CopyIcon size={13} />
          </button>
          <div className="inv-gift-holder">{WEDDING.gift.holder}</div>
          <button type="button" className={`inv-copy inv-copy-key${keyCopied ? " is-copied" : ""}`} onClick={(e) => copyKey(WEDDING.gift.key, e.currentTarget)}>
            <span>Llave: {WEDDING.gift.key}</span>
            <CopyIcon size={11} />
          </button>
          <div className="inv-gift-tip">Toca el número o la llave para copiarlos</div>
          <div className="inv-divider" style={{ margin: "12px 0", gap: 8 }}>
            <div />
            <span style={{ fontSize: 11 }}>❈</span>
            <div />
          </div>
          <div className="inv-gift-qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/qr-nubank.png" width={600} height={600} loading="lazy" decoding="async" alt={`Código QR Nu Bank, llave ${WEDDING.gift.key}`} />
          </div>
          <div className="inv-gift-qr-tip">Escanéalo desde tu app bancaria con Bre-B</div>
        </div>
      </div>
    </div>
  );
}
