"use client";

import { useEffect, useState } from "react";

type Props = {
  mode: "invitacion" | "participacion";
  guestName?: string | null;
  trackCode?: string | null;
};

export function Cover({ mode, guestName, trackCode }: Props) {
  const [opened, setOpened] = useState(false);
  const [gone, setGone] = useState(false);

  // Registra la visita del invitado (solo navegadores reales: los bots de vista previa no ejecutan JS).
  useEffect(() => {
    if (!trackCode) return;
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: trackCode, event: "view" }),
      keepalive: true,
    }).catch(() => {});
  }, [trackCode]);

  const open = () => {
    if (opened) return;
    setOpened(true);
    setTimeout(() => setGone(true), 1300);
  };

  const label = mode === "participacion" ? "Abrir participación" : "Abrir invitación";
  const hint = mode === "participacion" ? "para abrir nuestra participación" : "para abrir tu invitación";

  return (
    <div className={`inv-cover serif${opened ? " is-open" : ""}${gone ? " is-gone" : ""}`} aria-hidden={gone}>
      <div className="inv-cover-top serif">Nos casamos</div>

      {guestName ? (
        <div className="inv-cover-for">
          <small>Invitación especial para</small>
          <div className="script">{guestName}</div>
        </div>
      ) : null}

      <button type="button" onClick={open} aria-label={label} className="inv-env-btn">
        <div className="inv-env">
          <div className="inv-env-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/foto-sobre.jpg" alt="Norida y Agustín" />
          </div>
          <div className="inv-env-body" />
          <div className="inv-env-flap" />
        </div>
      </button>

      <div className="inv-cover-hint">
        <div className="display">Toca el sobre</div>
        <div className="serif">{hint}</div>
      </div>

      <div className="inv-cover-bottom script">Norida &amp; Agustín</div>
    </div>
  );
}
