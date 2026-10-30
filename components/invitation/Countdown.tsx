"use client";

import { useEffect, useRef, useState } from "react";
import { WEDDING } from "@/lib/config";
import { HeartOutline } from "./Ornaments";

const TARGET = new Date(WEDDING.dateISO).getTime();
const pad = (n: number) => String(n).padStart(2, "0");

function useCountdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  const total = Math.floor(Math.max(0, TARGET - now) / 1000);
  return {
    days: pad(Math.floor(total / 86400)),
    hours: pad(Math.floor((total % 86400) / 3600)),
    minutes: pad(Math.floor((total % 3600) / 60)),
    seconds: pad(total % 60),
  };
}

export function CountdownBoxes({ className = "inv-count-boxes" }: { className?: string }) {
  const c = useCountdown();
  const items: [string, string][] = [
    [c.days, "Días"],
    [c.hours, "Horas"],
    [c.minutes, "Min"],
    [c.seconds, "Seg"],
  ];
  return (
    <div className={className}>
      {items.map(([v, l]) => (
        <div key={l}>
          <div className="inv-count-num display">{v}</div>
          <div className="inv-count-label">{l}</div>
        </div>
      ))}
    </div>
  );
}

/** Barra "Faltan N días": se queda fija arriba desde que se pasa por ella hasta el final de la tarjeta. */
export function StickyDays() {
  const { days } = useCountdown();
  const anchor = useRef<HTMLDivElement>(null);
  const [fixed, setFixed] = useState(false);

  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setFixed(!e.isIntersecting && e.boundingClientRect.top < 0), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.stickyBar = fixed ? "1" : "0";
    return () => {
      delete document.documentElement.dataset.stickyBar;
    };
  }, [fixed]);

  const bar = (cls: string) => (
    <div className={cls} aria-hidden={cls.includes("is-fixed") ? true : undefined}>
      <HeartOutline size={14} width={1.6} />
      <span className="inv-sticky-label">Faltan</span>
      <span className="inv-sticky-days display">{days}</span>
      <span className="inv-sticky-label">días para nuestra boda</span>
    </div>
  );

  return (
    <>
      <div ref={anchor}>{bar("inv-sticky")}</div>
      {fixed ? <div className="inv-fixed-lane">{bar("inv-sticky is-fixed")}</div> : null}
    </>
  );
}
