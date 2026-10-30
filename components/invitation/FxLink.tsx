"use client";

import { notes, sparkle } from "@/lib/effects";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { fx?: "sparkle" | "notes" };

/** Enlace con un pequeño efecto al tocarlo (no interfiere con la navegación). */
export function FxLink({ fx = "sparkle", onClick, ...rest }: Props) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        if (fx === "notes") notes(e.currentTarget);
        else sparkle(e.currentTarget);
        onClick?.(e);
      }}
    />
  );
}
