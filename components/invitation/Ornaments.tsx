// Ramas, flores y corazones de la tarjeta. Mismos trazos del diseño original, sin ids SVG compartidos.

const LEAF = "M0,-9 C5,-7 6,-2 4,3 C2,7 -2,7 -4,3 C-6,-2 -5,-7 0,-9 Z";
const PETAL_ROTATIONS = [0, 72, 144, 216, 288];

type Palette = { stroke: string; strokeOpacity: number; leaves: [string, number][]; petal: number };

// Mezclas precalculadas de color-mix(): verde 55% + crema 45% y crema 55% + dorado 45%.
const SAGE_MIX = "#ADB497";
const GOLD_MIX = "#E5D5B1";

const PALETTES: Record<"light" | "photo" | "dark", Palette> = {
  light: {
    stroke: "#6E7C4D",
    strokeOpacity: 0.4,
    leaves: [
      ["#4B5A2F", 0.85],
      ["#6E7C4D", 0.8],
      [SAGE_MIX, 0.85],
      ["#4B5A2F", 0.7],
      ["#6E7C4D", 0.7],
      [SAGE_MIX, 0.6],
    ],
    petal: 0.95,
  },
  photo: {
    stroke: "#C9A961",
    strokeOpacity: 0.4,
    leaves: [
      ["#FBF9F2", 0.6],
      ["#C9A961", 0.6],
      [GOLD_MIX, 0.6],
      ["#FBF9F2", 0.5],
      ["#C9A961", 0.5],
      [GOLD_MIX, 0.45],
    ],
    petal: 0.85,
  },
  dark: {
    stroke: "#C9A961",
    strokeOpacity: 0.35,
    leaves: [
      ["#FBF9F2", 0.5],
      ["#C9A961", 0.55],
      [GOLD_MIX, 0.5],
      ["#FBF9F2", 0.4],
      ["#C9A961", 0.4],
      [GOLD_MIX, 0.35],
    ],
    petal: 0.9,
  },
};

const LEAF_TRANSFORMS = [
  "translate(8,9) rotate(-30) scale(0.85)",
  "translate(17,5) rotate(-5) scale(1)",
  "translate(28,11) rotate(20) scale(0.8)",
  "translate(40,7) rotate(-15) scale(0.65)",
  "translate(51,14) rotate(35) scale(0.55)",
  "translate(63,18) rotate(10) scale(0.45)",
];

function Flower({ transform, opacity, center = 1.8 }: { transform: string; opacity: number; center?: number }) {
  return (
    <g transform={transform}>
      {PETAL_ROTATIONS.map((r) => (
        <g key={r} transform={`rotate(${r})`}>
          <ellipse cx="0" cy="-4" rx="2.6" ry="3.6" fill="#FBF9F2" opacity={opacity} />
        </g>
      ))}
      <circle r={center} fill="#C9A961" />
    </g>
  );
}

function SprigHalf({ p }: { p: Palette }) {
  return (
    <g>
      <path d="M2,4 C28,13 52,6 76,13" fill="none" stroke={p.stroke} strokeWidth="0.8" opacity={p.strokeOpacity} />
      {p.leaves.map(([fill, op], i) => (
        <path key={i} d={LEAF} fill={fill} opacity={op} transform={LEAF_TRANSFORMS[i]} />
      ))}
      <Flower transform="translate(21,16) scale(0.5)" opacity={p.petal} />
    </g>
  );
}

/** Rama de esquina a esquina que abre cada sección. */
export function Sprig({ variant = "light", className = "inv-sprig" }: { variant?: keyof typeof PALETTES; className?: string }) {
  const p = PALETTES[variant];
  return (
    <svg viewBox="0 0 480 50" className={className} aria-hidden="true">
      <SprigHalf p={p} />
      <g transform="translate(480,0) scale(-1,1)">
        <SprigHalf p={p} />
      </g>
    </svg>
  );
}

/** Pequeño adorno central que cierra algunas secciones. */
export function SmallSprig() {
  return (
    <svg viewBox="0 0 100 26" className="inv-sprig-sm" aria-hidden="true">
      <path d={LEAF} fill="#4B5A2F" opacity="0.8" transform="translate(32,14) rotate(-25) scale(0.9)" />
      <path d={LEAF} fill="#6E7C4D" opacity="0.7" transform="translate(22,17) rotate(-42) scale(0.62)" />
      <Flower transform="translate(50,13) scale(0.55)" opacity={0.95} center={1.6} />
      <path d={LEAF} fill="#6E7C4D" opacity="0.7" transform="translate(78,17) rotate(42) scale(0.62)" />
      <path d={LEAF} fill="#4B5A2F" opacity="0.8" transform="translate(68,14) rotate(25) scale(0.9)" />
    </svg>
  );
}

const HEART = "M12 21s-8-4.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-8 11-8 11z";

export function HeartOutline({ size = 16, color = "#C9A961", width = 1.4 }: { size?: number; color?: string; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={HEART} />
    </svg>
  );
}

export function HeartDot({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#C9A961" stroke="#FBF9F2" strokeWidth="1" aria-hidden="true">
      <path d={HEART} />
    </svg>
  );
}

export function GiftIcon({ size = 28, color = "#4B5A2F", width = 1.4 }: { size?: number; color?: string; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12v9H4v-9" />
      <path d="M2 7h20v5H2z" />
      <path d="M12 22V7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C9 2 12 7 12 7z" />
    </svg>
  );
}
