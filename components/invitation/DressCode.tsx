"use client";

import Link from "next/link";
import { useState } from "react";
import { WEDDING } from "@/lib/config";

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
            onClick={() => setActive(c.id)}
            className={`inv-swatch${c.id === active ? " is-active" : ""}`}
            style={{ background: c.hex }}
          />
        ))}
      </div>
      <div className="inv-swatch-name">{current.name}</div>
      <Link href={advisorsHref} className="inv-btn-outline-gold">
        Habla con Gabriela y Valentina, asesoras de Outfits
      </Link>
    </>
  );
}
