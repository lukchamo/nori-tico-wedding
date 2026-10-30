"use client";

import { useEffect, useRef, useState } from "react";
import { WEDDING } from "@/lib/config";
import { notes } from "@/lib/effects";

/** Lo emite la portada al abrir el sobre: ese toque es el que permite al navegador reproducir audio. */
export const OPEN_EVENT = "inv:open";

const PREF = "nt_music"; // "off" si el invitado silenció la música
const VOLUME = 0.7;

const readPref = () => {
  try {
    return localStorage.getItem(PREF);
  } catch {
    return null;
  }
};
const writePref = (value: "on" | "off") => {
  try {
    localStorage.setItem(PREF, value);
  } catch {}
};

// Entrada suave (iOS ignora `volume` y suena al volumen del equipo; la pista ya viene masterizada suave).
function fadeIn(a: HTMLAudioElement) {
  const t0 = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / 1600);
    a.volume = VOLUME * k;
    if (k < 1 && !a.paused) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Música de fondo: suena al abrir el sobre y se activa o silencia con el botón. */
export function MusicButton() {
  const audio = useRef<HTMLAudioElement>(null);
  const wanted = useRef(false); // el invitado quiere música: se retoma al volver a la pestaña
  const [on, setOn] = useState(false);

  const start = () => {
    const a = audio.current;
    if (!a) return;
    wanted.current = true;
    a.volume = 0;
    a.play().then(
      () => fadeIn(a),
      () => (wanted.current = false),
    );
  };

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const sync = () => setOn(!a.paused);
    const onOpen = () => {
      if (readPref() !== "off" && a.paused) start();
    };
    const onVisibility = () => {
      if (document.hidden) a.pause();
      else if (wanted.current) a.play().catch(() => {});
    };
    a.addEventListener("play", sync);
    a.addEventListener("pause", sync);
    window.addEventListener(OPEN_EVENT, onOpen);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      a.removeEventListener("play", sync);
      a.removeEventListener("pause", sync);
      window.removeEventListener(OPEN_EVENT, onOpen);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      writePref("on");
      start();
      notes(e.currentTarget);
    } else {
      writePref("off");
      wanted.current = false;
      a.pause();
    }
  };

  return (
    <div className="inv-music">
      <button
        type="button"
        className={`inv-music-toggle${on ? " is-on" : ""}`}
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? "Silenciar la música" : "Activar la música"}
      >
        {on ? (
          <span className="inv-music-bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5A2F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H3v6h3l5 4V5z" />
            <path d="m22 9-6 6M16 9l6 6" />
          </svg>
        )}
        <span>Música</span>
      </button>
      <a
        className="inv-music-song"
        href={WEDDING.spotifyUrl}
        target="_blank"
        rel="noopener"
        aria-label={`Escuchar nuestra canción, «${WEDDING.songTitle}», en Spotify`}
        title={`Nuestra canción: «${WEDDING.songTitle}»`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4B5A2F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
        </svg>
      </a>
      <audio ref={audio} src={WEDDING.music.src} loop preload="none" />
    </div>
  );
}
