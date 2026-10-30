"use client";

import Link from "next/link";
import { useState } from "react";
import { WEDDING } from "@/lib/config";
import { sparkle } from "@/lib/effects";

export function DressCodeSwatches({ advisorsHref }: { advisorsHref: string }) {
  const [active, setActive] = useState<string>(WEDDING.colors[0].id);
  const current = WEDDING.colors.find((c) => c.id === active) ?? WEDDING.colors[0];
  return (
    <>
      <div className="inv-swatches" role="radiogroup" aria-label="Colores sugeridos">
        {WEDDING.colors.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={c.id === active}
            aria-label={c.name}
            onClick={(e) => {
              setActive(c.id);
              sparkle(e.currentTarget, [c.hex, "#C9A961", "#FBF9F2"]);
            }}
            className={`inv-swatch${c.id === active ? " is-active" : ""}`}
            style={{ background: c.hex }}
          />
        ))}
      </div>
      <div className="inv-swatch-name inv-pop" key={current.id}>
        {current.name}
      </div>
      <Link href={advisorsHref} className="inv-btn-outline-gold" onClick={(e) => sparkle(e.currentTarget)}>
        Habla con Gabriela y Valentina, asesoras de Outfits
      </Link>
    </>
  );
}
