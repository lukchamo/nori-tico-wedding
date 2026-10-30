"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORY_LABEL, LOOKS, LOOK_BY_ID, STYLE_LABEL, lookImage, lookThumb, type LookCategory } from "@/lib/lookbook";

/** Texto con **negritas** y listas "- " / "* " / "1." (sin HTML: React escapa todo). */
export function RichText({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`l${blocks.length}`}>
          {list.map((li, i) => (
            <li key={i}>{inline(li)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const item = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (item) list.push(item[1]);
    else {
      flush();
      if (line) blocks.push(<p key={`p${blocks.length}`}>{inline(line)}</p>);
    }
  }
  flush();
  return <div className="adv-rich">{blocks}</div>;
}

function inline(s: string): React.ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>,
  );
}

/** Carrusel horizontal de looks dentro de una respuesta. */
export function LookCarousel({ ids, onOpen }: { ids: string[]; onOpen: (ids: string[], index: number) => void }) {
  const looks = ids.map((id) => LOOK_BY_ID.get(id)).filter((l): l is NonNullable<typeof l> => !!l);
  const track = useRef<HTMLDivElement>(null);
  if (!looks.length) return null;
  const scroll = (dir: number) => track.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  return (
    <div className="adv-carousel">
      <div className="adv-carousel-track" ref={track}>
        {looks.map((l, i) => (
          <button key={l.id} type="button" className="adv-look" onClick={() => onOpen(looks.map((x) => x.id), i)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lookThumb(l.id)} alt={l.title} loading="lazy" width={360} height={480} />
            <span className="adv-look-cat">{CATEGORY_LABEL[l.category]}</span>
            <span className="adv-look-title">{l.title}</span>
            <span className="adv-look-zoom" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </span>
          </button>
        ))}
      </div>
      {looks.length > 1 ? (
        <div className="adv-carousel-nav">
          <button type="button" onClick={() => scroll(-1)} aria-label="Anterior">
            ‹
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Siguiente">
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Visor a pantalla completa: foto grande, prendas, cómo combinarlo y looks que combinan. */
export function Lightbox({
  ids,
  index,
  onClose,
  onNavigate,
  onAsk,
}: {
  ids: string[];
  index: number;
  onClose: () => void;
  onNavigate: (ids: string[], index: number) => void;
  onAsk: (title: string) => void;
}) {
  const look = LOOK_BY_ID.get(ids[index]);
  const touch = useRef<number | null>(null);
  const go = (d: number) => onNavigate(ids, (index + d + ids.length) % ids.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  });

  if (!look) return null;
  const pairs = look.pairsWith.map((id) => LOOK_BY_ID.get(id)).filter((l): l is NonNullable<typeof l> => !!l);

  return (
    <div className="adv-lightbox" role="dialog" aria-modal="true" aria-label={look.title} onClick={onClose}>
      <div className="adv-lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="adv-lightbox-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
        <div
          className="adv-lightbox-media"
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current === null) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
            touch.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={look.id} src={lookImage(look.id)} alt={look.title} />
          {ids.length > 1 ? (
            <>
              <button type="button" className="adv-lightbox-arrow left" onClick={() => go(-1)} aria-label="Anterior">
                ‹
              </button>
              <button type="button" className="adv-lightbox-arrow right" onClick={() => go(1)} aria-label="Siguiente">
                ›
              </button>
              <div className="adv-lightbox-count">
                {index + 1} / {ids.length}
              </div>
            </>
          ) : null}
        </div>
        <div className="adv-lightbox-info">
          <div className="adv-lightbox-tags">
            <span>{CATEGORY_LABEL[look.category]}</span>
            {look.style.map((s) => (
              <span key={s}>{STYLE_LABEL[s]}</span>
            ))}
          </div>
          <h2 className="script">{look.title}</h2>
          <p>{look.summary}</p>
          <h3>Las prendas</h3>
          <ul>
            {look.pieces.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <h3>Cómo combinarlo</h3>
          <ul>
            {look.combine.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {pairs.length ? (
            <>
              <h3>Combínalo con</h3>
              <div className="adv-pairs">
                {pairs.map((p) => (
                  <button key={p.id} type="button" onClick={() => onNavigate([look.id, ...pairs.map((x) => x.id)], pairs.indexOf(p) + 1)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={lookThumb(p.id)} alt="" loading="lazy" />
                    <span>{p.title}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
          <button type="button" className="adv-ask" onClick={() => onAsk(look.title)}>
            Preguntar a Gabi y Vale por este look
          </button>
        </div>
      </div>
    </div>
  );
}

const FILTERS: (LookCategory | "todo")[] = ["todo", "mujer", "hombre", "zapatos-mujer", "zapatos-hombre", "accesorios", "peinado"];

/** Lookbook completo con filtros por categoría. */
export function Gallery({ onClose, onOpen }: { onClose: () => void; onOpen: (ids: string[], index: number) => void }) {
  const [filter, setFilter] = useState<LookCategory | "todo">("todo");
  const list = LOOKS.filter((l) => filter === "todo" || l.category === filter);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="adv-gallery" role="dialog" aria-modal="true" aria-label="Lookbook">
      <div className="adv-gallery-head">
        <div>
          <div className="adv-sub">Lookbook de la boda</div>
          <h2 className="script">Ideas para inspirarte</h2>
        </div>
        <button type="button" className="adv-lightbox-close static" onClick={onClose} aria-label="Cerrar lookbook">
          ✕
        </button>
      </div>
      <div className="adv-gallery-filters">
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === "todo" ? "Todo" : CATEGORY_LABEL[f]}
          </button>
        ))}
      </div>
      <div className="adv-gallery-grid">
        {list.map((l, i) => (
          <button key={l.id} type="button" className="adv-look grid" onClick={() => onOpen(list.map((x) => x.id), i)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lookThumb(l.id)} alt={l.title} loading="lazy" width={360} height={480} />
            <span className="adv-look-cat">{CATEGORY_LABEL[l.category]}</span>
            <span className="adv-look-title">{l.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
