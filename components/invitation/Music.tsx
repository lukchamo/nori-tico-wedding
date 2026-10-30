"use client";

import { useEffect, useRef, useState } from "react";
import { WEDDING } from "@/lib/config";
import { notes } from "@/lib/effects";

/** Lo emite la portada al abrir el sobre: ese toque es el que permite al navegador reproducir audio. */
export const OPEN_EVENT = "inv:open";

const PREF = "nt_music"; // "off" si el invitado pausó la canción
const API_URL = "https://open.spotify.com/embed/iframe-api/v1";
const TRACK_URI = `spotify:track:${new URL(WEDDING.spotifyUrl).pathname.split("/").pop()}`;

type Playback = { isPaused: boolean; isBuffering: boolean; duration: number; position: number };
type Controller = {
  play(): void;
  pause(): void;
  resume(): void;
  addListener(event: "ready", cb: () => void): void;
  addListener(event: "playback_update", cb: (e: { data: Playback }) => void): void;
};
type SpotifyApi = {
  createController(el: HTMLElement, opts: { uri: string; width: string; height: number }, cb: (c: Controller) => void): void;
};
type SpotifyWindow = Window & { onSpotifyIframeApiReady?: (api: SpotifyApi) => void; __spotifyApi?: Promise<SpotifyApi> };

// Carga la API de inserción de Spotify una sola vez.
function loadSpotify(): Promise<SpotifyApi> {
  const w = window as SpotifyWindow;
  w.__spotifyApi ??= new Promise((resolve) => {
    w.onSpotifyIframeApiReady = resolve;
    const s = document.createElement("script");
    s.src = API_URL;
    s.async = true;
    document.head.appendChild(s);
  });
  return w.__spotifyApi;
}

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

/**
 * Su canción de Spotify con el reproductor oficial: suena al abrir el sobre, se ve en una barra abajo
 * y se pausa o retoma con el botón de arriba. Sin sesión de Spotify, el reproductor solo da un
 * fragmento de 30 s: al terminar se repite.
 */
export function MusicButton() {
  const host = useRef<HTMLDivElement>(null);
  const ctl = useRef<Controller | null>(null);
  const last = useRef<Playback | null>(null);
  const wanted = useRef(false); // el invitado quiere la canción sonando
  const pending = useRef(false); // pidió la canción antes de que el reproductor estuviera listo
  const hiddenPause = useRef(false);
  const restarting = useRef(false);
  const grace = useRef(0); // tras pedir play, el reproductor aún informa «en pausa» unos instantes
  const [on, setOn] = useState(false);
  const [shown, setShown] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const play = () => {
    wanted.current = true;
    grace.current = Date.now() + 4000;
    setShown(true);
    const c = ctl.current;
    if (!c) {
      pending.current = true;
      return;
    }
    const p = last.current;
    if (p && p.position > 500 && p.position < p.duration - 500) c.resume();
    else c.play();
    // Si el navegador no dejó arrancar (iPhone, por ejemplo), se pide tocar ▶ en el reproductor.
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      const now = last.current;
      if (wanted.current && (!now || now.isPaused || now.position === 0)) setNeedsTap(true);
    }, 3500);
  };

  const stop = () => {
    wanted.current = false;
    pending.current = false;
    clearTimeout(tapTimer.current);
    setNeedsTap(false);
    ctl.current?.pause();
  };

  useEffect(() => {
    let alive = true;
    const el = document.createElement("div"); // Spotify lo reemplaza por su iframe: fuera del árbol de React
    host.current?.appendChild(el);
    loadSpotify().then((api) => {
      if (!alive) return;
      api.createController(el, { uri: TRACK_URI, width: "100%", height: 80 }, (c) => {
        c.addListener("ready", () => {
          ctl.current = c;
          if (pending.current) {
            pending.current = false;
            play();
          }
        });
        c.addListener("playback_update", ({ data }) => {
          last.current = data;
          const ended = data.duration > 0 && data.position >= data.duration - 250;
          if (data.position < 2000) restarting.current = false;
          // Fin del fragmento o de la canción: vuelve a empezar.
          if (ended && !data.isPaused && wanted.current && !restarting.current) {
            restarting.current = true;
            c.play();
          }
          const playing = !data.isPaused && data.duration > 0 && !ended;
          setOn(playing);
          if (playing) {
            setNeedsTap(false);
            wanted.current = true;
          } else if (data.isPaused && !document.hidden && Date.now() > grace.current) wanted.current = false; // pausó en el reproductor
        });
      });
    });

    const onOpen = () => {
      if (readPref() !== "off") play();
    };
    const onVisibility = () => {
      const c = ctl.current;
      if (!c) return;
      if (document.hidden && wanted.current) {
        hiddenPause.current = true;
        c.pause();
      } else if (!document.hidden && hiddenPause.current) {
        hiddenPause.current = false;
        if (wanted.current) c.resume();
      }
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive = false;
      clearTimeout(tapTimer.current);
      window.removeEventListener(OPEN_EVENT, onOpen);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (on || (wanted.current && !needsTap)) {
      writePref("off");
      stop();
      setShown(false);
    } else {
      writePref("on");
      play();
      notes(e.currentTarget);
    }
  };

  const close = () => {
    writePref("off");
    stop();
    setShown(false);
  };

  return (
    <>
      <div className="inv-music">
        <button
          type="button"
          className={`inv-music-toggle${on ? " is-on" : ""}`}
          onClick={toggle}
          aria-pressed={on}
          aria-label={on ? "Pausar nuestra canción" : `Escuchar nuestra canción, «${WEDDING.songTitle}»`}
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
      </div>

      <div className={`inv-song${shown ? " is-shown" : ""}`} role="region" aria-label="Nuestra canción" aria-hidden={!shown}>
        <span className="inv-song-tag">♪ Nuestra canción</span>
        <button type="button" className="inv-song-close" onClick={close} aria-label="Pausar y cerrar el reproductor" tabIndex={shown ? 0 : -1}>
          ×
        </button>
        {needsTap ? <div className="inv-song-hint">Toca ▶ para escucharla</div> : null}
        <div className="inv-song-player" ref={host} />
      </div>
    </>
  );
}
