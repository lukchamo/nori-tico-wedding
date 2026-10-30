"use client";

import { useEffect, useRef, useState } from "react";
import { onMotion, reduced, toggleMotion } from "@/lib/story-motion";

/** Botón "Pausar animaciones" (WCAG 2.2.2): guarda la preferencia y reconstruye la coreografía. */
export function MotionToggle() {
  const [off, setOff] = useState(false);
  useEffect(() => {
    setOff(reduced());
    return onMotion(setOff);
  }, []);
  const label = off ? "Activar animaciones" : "Pausar animaciones";
  return (
    <button type="button" className="hs-motion" aria-pressed={off} title={label} onClick={toggleMotion}>
      <span className="hs-motion-label">{label}</span>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        {off ? (
          <path d="M4 2.5v11l9.5-5.5z" fill="currentColor" />
        ) : (
          <>
            <rect x="3" y="2.5" width="3.6" height="11" rx="1" fill="currentColor" />
            <rect x="9.4" y="2.5" width="3.6" height="11" rx="1" fill="currentColor" />
          </>
        )}
      </svg>
    </button>
  );
}

/** Registra la apertura de la invitación personalizada (los bots de vista previa no ejecutan JS). */
export function TrackView({ code }: { code: string }) {
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, event: "view" }),
      keepalive: true,
    }).catch(() => {});
  }, [code]);
  return null;
}

/** Mueve el avión sobre la ruta (p de 0 a 1). Lo usan el carrusel nativo y la galería fijada. */
export function setRoute(p: number) {
  const mover = document.querySelector<HTMLElement>(".hs-plane-mover");
  const plane = document.querySelector<HTMLElement>(".hs-plane");
  if (!mover || !plane) return;
  const k = Math.min(1, Math.max(0, p));
  const y = Math.sin(k * Math.PI * 5) * 7;
  const slope = Math.cos(k * Math.PI * 5) * 14;
  mover.style.transform = `translate3d(${(k * 100).toFixed(2)}%,0,0)`;
  plane.style.transform = `translateY(${y.toFixed(1)}px) rotate(${slope.toFixed(1)}deg)`;
}

/** Anterior / siguiente y contador del carrusel nativo (celular, pantallas bajas y movimiento reducido). */
export function TravelControls({ total }: { total: number }) {
  const [index, setIndex] = useState(0);
  const step = useRef(0);

  useEffect(() => {
    const track = document.getElementById("hs-track");
    if (!track) return;
    const measure = () => {
      const items = track.querySelectorAll<HTMLElement>(".hs-stamp");
      step.current = items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : track.clientWidth;
    };
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!step.current) measure();
        const max = track.scrollWidth - track.clientWidth;
        setIndex(Math.min(total - 1, Math.round(track.scrollLeft / (step.current || 1))));
        if (max > 0) setRoute(track.scrollLeft / max);
      });
    };
    measure();
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [total]);

  const go = (dir: 1 | -1) => {
    const track = document.getElementById("hs-track");
    if (!track) return;
    const next = Math.min(total - 1, Math.max(0, index + dir));
    track.scrollTo({ left: next * (step.current || track.clientWidth), behavior: reduced() ? "auto" : "smooth" });
  };

  return (
    <div className="hs-travel-controls">
      <button type="button" className="hs-round" onClick={() => go(-1)} disabled={index === 0} aria-label="Viaje anterior">
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <p className="hs-counter display" aria-live="polite">
        <span className="sr-only">Viaje </span>
        {String(index + 1).padStart(2, "0")} <span aria-hidden="true">/</span>
        <span className="sr-only"> de </span> {String(total).padStart(2, "0")}
      </p>
      <button type="button" className="hs-round" onClick={() => go(1)} disabled={index === total - 1} aria-label="Viaje siguiente">
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
