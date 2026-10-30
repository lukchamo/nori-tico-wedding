/* Ilustraciones SVG de la versión "historia". Todas se generan en el servidor (sin JS en el cliente):
   la coreografía de components/historia/StoryMotion.tsx solo las anima. Motivo visual: dos mitades
   (Agustín en oliva, Norida en terracota) que se encuentran y forman una sola figura. */

const OLIVE = "#4B5A2F";
const TERRA = "#BF7E5A";
const GOLD = "#C9A961";

/* ---------- Hero: dos hilos sobre el cielo del amanecer y la orilla abajo ---------- */

/** Hilos de fondo (decorativos): cruzan el cielo detrás del texto. */
export function HeroThreads() {
  return (
    <svg className="hs-hero-threads" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <g fill="none" strokeLinecap="round" strokeWidth="2.4">
        <path pathLength={1} className="hs-draw" d="M-40 330 C260 170 520 210 720 420 C900 610 1180 520 1640 300" stroke={OLIVE} strokeOpacity=".3" />
        <path pathLength={1} className="hs-draw" d="M-40 560 C300 660 560 520 760 380 C980 230 1240 260 1640 470" stroke={TERRA} strokeOpacity=".34" />
      </g>
    </svg>
  );
}

/** Mar y arena: una franja en el flujo de la página (el texto nunca queda encima del agua). La arena sigue en el capítulo 1. */
export function HeroShore() {
  return (
    <svg className="hs-shore-svg" viewBox="0 0 1600 300" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hs-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9BFCF" />
          <stop offset="1" stopColor="#7F9DB4" />
        </linearGradient>
        <linearGradient id="hs-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EFE2C6" />
          <stop offset=".6" stopColor="#E6D3AE" />
        </linearGradient>
      </defs>
      <rect width="1600" height="300" fill="#E6D3AE" />
      <rect width="1600" height="130" fill="url(#hs-sea)" />
      <g className="hs-loop-x">
        <path d={`M0 28 q50 -10 100 0 ${"t100 0 ".repeat(31)}`} fill="none" stroke="#FBF9F2" strokeOpacity=".55" strokeWidth="3" />
        <path d={`M0 64 q80 -12 160 0 ${"t160 0 ".repeat(19)}`} fill="none" stroke="#FBF9F2" strokeOpacity=".4" strokeWidth="2.5" />
      </g>
      <path d="M0 120 C300 100 520 112 800 106 C1080 100 1300 92 1600 110 L1600 300 L0 300 Z" fill="url(#hs-sand)" />
    </svg>
  );
}

/** Línea — corazón — línea: dos hilos que llegan desde los lados y se cierran en un corazón. */
export function HeartRule({ className = "hs-heart-rule" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 240 40" aria-hidden="true" focusable="false">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
        <path pathLength={1} className="hs-draw" d="M4 22 L98 22" stroke={OLIVE} />
        <path pathLength={1} className="hs-draw" d="M236 22 L142 22" stroke={TERRA} />
        <path pathLength={1} className="hs-draw" d="M120 34 C108 26 103 21 103 15 C103 9 107 6 111.5 6 C115 6 118 8 120 12" stroke={OLIVE} />
        <path pathLength={1} className="hs-draw" d="M120 34 C132 26 137 21 137 15 C137 9 133 6 128.5 6 C125 6 122 8 120 12" stroke={TERRA} />
      </g>
    </svg>
  );
}

/* ---------- Capítulo 1: huellas en la arena que se cruzan ---------- */

type Pt = [number, number];
type Curve = [Pt, Pt, Pt, Pt];

function bezier([p0, p1, p2, p3]: Curve, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

/** Puntos a distancia constante sobre la curva, con su ángulo de avance. */
function along(curve: Curve, step: number) {
  const samples: Pt[] = [];
  for (let i = 0; i <= 400; i++) samples.push(bezier(curve, i / 400));
  const out: { p: Pt; a: number }[] = [];
  let acc = step / 2;
  for (let i = 1; i < samples.length; i++) {
    const [x0, y0] = samples[i - 1];
    const [x1, y1] = samples[i];
    acc += Math.hypot(x1 - x0, y1 - y0);
    if (acc >= step) {
      acc = 0;
      out.push({ p: [x1, y1], a: Math.atan2(y1 - y0, x1 - x0) });
    }
  }
  return out;
}

// Huella descalza apuntando hacia -y: planta, talón y dedos en un solo path.
const circ = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const ell = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const FOOT_R = [ell(0.5, -5, 5.6, 8.2), ell(0, 10, 4.3, 5.2), circ(-2.6, -16.4, 2.3), circ(1.6, -17.6, 1.5), circ(4.6, -15.8, 1.3)].join("");
const FOOT_L = [ell(-0.5, -5, 5.6, 8.2), ell(0, 10, 4.3, 5.2), circ(2.6, -16.4, 2.3), circ(-1.6, -17.6, 1.5), circ(-4.6, -15.8, 1.3)].join("");

function trail(curve: Curve, step: number, scale: number, side: number, startLeft = true) {
  return along(curve, step).map(({ p, a }, i) => {
    const left = (i % 2 === 0) === startLeft;
    const off = (left ? -1 : 1) * 7 * scale;
    const nx = -Math.sin(a), ny = Math.cos(a);
    const x = p[0] + nx * off * side;
    const y = p[1] + ny * off * side;
    const deg = (a * 180) / Math.PI + 90;
    return { x: +x.toFixed(1), y: +y.toFixed(1), deg: +deg.toFixed(1), left };
  });
}

type Geometry = {
  w: number;
  h: number;
  scale: number;
  step: number;
  him: Curve;
  her: Curve;
  together: Curve;
  gap: number;
};

const LANDSCAPE: Geometry = {
  w: 1600, h: 1000, scale: 1.25, step: 52, gap: 24,
  him: [[-40, 1060], [260, 900], [560, 720], [790, 600]],
  her: [[1640, 1060], [1340, 890], [1050, 720], [810, 600]],
  together: [[800, 590], [830, 440], [770, 260], [800, 70]],
};

const PORTRAIT: Geometry = {
  w: 800, h: 1400, scale: 1.15, step: 50, gap: 20,
  him: [[-40, 1460], [130, 1300], [300, 1150], [392, 1040]],
  her: [[840, 1460], [670, 1300], [500, 1150], [408, 1040]],
  together: [[400, 1030], [420, 820], [380, 620], [400, 430]],
};

function Prints({ g, who }: { g: Geometry; who: "him" | "her" }) {
  const own = trail(g[who], g.step, g.scale, 1, who === "him");
  const shift: Curve = g.together.map(([x, y]) => [x + (who === "him" ? -g.gap : g.gap), y]) as Curve;
  const shared = trail(shift, g.step, g.scale, 1, who === "her");
  const color = who === "him" ? "rgba(75,90,47,.5)" : "rgba(168,98,62,.5)";
  return (
    <g className={`hs-prints hs-prints-${who}`} fill={color}>
      {[...own, ...shared].map((f, i) => (
        <path key={i} className={`hs-print ${i < own.length ? "hs-print-own" : "hs-print-shared"}`} d={f.left ? FOOT_L : FOOT_R} transform={`translate(${f.x} ${f.y}) rotate(${f.deg}) scale(${g.scale})`} />
      ))}
    </g>
  );
}

/** Ondas suaves de la arena (textura estática, deterministas). */
function ripples(g: Geometry) {
  const out: string[] = [];
  for (let y = g.h * 0.08; y < g.h; y += g.h * 0.16) {
    const x0 = ((y * 7) % 260) - 200;
    out.push(`M${x0.toFixed(0)} ${y.toFixed(0)} q${g.w * 0.08} -14 ${g.w * 0.16} 0 t${g.w * 0.16} 0`);
    out.push(`M${(x0 + g.w * 0.6).toFixed(0)} ${(y + g.h * 0.07).toFixed(0)} q${g.w * 0.07} -12 ${g.w * 0.14} 0 t${g.w * 0.14} 0`);
  }
  return out;
}

function BeachSvg({ g, className }: { g: Geometry; className: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${g.w} ${g.h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`hs-beach-sand-${g.w}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E6D3AE" />
          <stop offset=".45" stopColor="#EBDBBA" />
          <stop offset="1" stopColor="#F1E5CB" />
        </linearGradient>
      </defs>
      <rect width={g.w} height={g.h} fill={`url(#hs-beach-sand-${g.w})`} />
      <g fill="none" stroke="#D2BC90" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round">
        {ripples(g).map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <Prints g={g} who="him" />
      <Prints g={g} who="her" />
    </svg>
  );
}

export function BeachScene() {
  return (
    <>
      <BeachSvg g={LANDSCAPE} className="hs-beach-svg hs-only-wide" />
      <BeachSvg g={PORTRAIT} className="hs-beach-svg hs-only-tall" />
    </>
  );
}

/* ---------- Capítulo 2: sellos de viaje ---------- */

const STAMP_ART: Record<string, React.ReactNode> = {
  "santa-marta": (
    <>
      <rect width="300" height="190" fill="#CFE0EA" />
      <circle cx="225" cy="62" r="26" fill="#F2C879" />
      <path d="M0 120 L60 70 L95 98 L140 52 L190 104 L230 84 L300 120 Z" fill="#8A9A6B" />
      <path d="M118 66 L140 52 L160 72 L148 70 L138 78 L128 68 Z" fill="#FBF9F2" />
      <rect y="118" width="300" height="72" fill="#7F9DB4" />
      <path d="M0 134 q25 -6 50 0 t50 0 t50 0 t50 0 t50 0 t50 0" fill="none" stroke="#FBF9F2" strokeOpacity=".6" strokeWidth="3" />
    </>
  ),
  cartagena: (
    <>
      <rect width="300" height="190" fill="#F4D9C3" />
      <rect x="20" y="60" width="64" height="80" fill="#D3A8A0" />
      <rect x="84" y="44" width="70" height="96" fill="#E9C77E" />
      <rect x="154" y="66" width="60" height="74" fill="#9FB4C7" />
      <rect x="214" y="52" width="66" height="88" fill="#BF7E5A" />
      <rect x="96" y="66" width="46" height="10" fill="#4B5A2F" />
      <rect x="226" y="74" width="42" height="10" fill="#4B5A2F" />
      <path d="M0 140 H300 V190 H0 Z" fill="#C9B79A" />
      <path d="M30 190 V168 a16 16 0 0 1 32 0 V190 M110 190 V168 a16 16 0 0 1 32 0 V190 M190 190 V168 a16 16 0 0 1 32 0 V190" fill="#8D7A5C" />
    </>
  ),
  tayrona: (
    <>
      <rect width="300" height="190" fill="#D7E6DF" />
      <rect y="112" width="300" height="78" fill="#7FA2BA" />
      <ellipse cx="70" cy="140" rx="58" ry="38" fill="#B79E80" />
      <ellipse cx="128" cy="150" rx="36" ry="26" fill="#A08667" />
      <path d="M220 160 C222 120 228 90 236 60" stroke="#6E5A3A" strokeWidth="6" fill="none" />
      <path d="M236 60 q-36 -6 -56 18 M236 60 q-20 -24 -50 -20 M236 60 q22 -28 50 -16 M236 60 q34 4 46 30" stroke="#4B5A2F" strokeWidth="10" strokeLinecap="round" fill="none" />
      <rect y="168" width="300" height="22" fill="#EBDBBA" />
    </>
  ),
  medellin: (
    <>
      <rect width="300" height="190" fill="#E4EEDC" />
      <path d="M0 150 L50 92 L110 128 L170 70 L230 110 L300 80 V190 H0 Z" fill="#8A9A6B" />
      <path d="M0 170 L70 132 L140 158 L210 120 L300 150 V190 H0 Z" fill="#6E7C4D" />
      <path d="M10 40 L290 100" stroke="#4B5A2F" strokeWidth="2" />
      <path d="M150 70 v10" stroke="#4B5A2F" strokeWidth="2" />
      <rect x="134" y="80" width="32" height="24" rx="5" fill="#BF7E5A" />
      <rect x="140" y="85" width="20" height="9" rx="2" fill="#FBF9F2" />
      <circle cx="60" cy="40" r="6" fill="#E9C77E" />
      <circle cx="248" cy="44" r="5" fill="#D3A8A0" />
    </>
  ),
  "san-andres": (
    <>
      <rect width="300" height="190" fill="#EAF3F7" />
      <rect y="70" width="300" height="24" fill="#BFE3E2" />
      <rect y="94" width="300" height="24" fill="#8FD0D3" />
      <rect y="118" width="300" height="24" fill="#5FB3C2" />
      <rect y="142" width="300" height="24" fill="#3C8FB0" />
      <rect y="166" width="300" height="24" fill="#2D6E93" />
      <ellipse cx="200" cy="74" rx="56" ry="10" fill="#EBDBBA" />
      <path d="M196 72 C198 54 202 40 210 28" stroke="#6E5A3A" strokeWidth="4" fill="none" />
      <path d="M210 28 q-24 -2 -36 14 M210 28 q-12 -16 -32 -12 M210 28 q16 -18 34 -8 M210 28 q22 4 28 20" stroke="#4B5A2F" strokeWidth="7" strokeLinecap="round" fill="none" />
    </>
  ),
  pereira: (
    <>
      <rect width="300" height="190" fill="#F3E7CF" />
      <circle cx="240" cy="50" r="22" fill="#F2C879" />
      <path d="M0 110 C60 80 120 90 170 104 C220 118 260 96 300 90 V190 H0 Z" fill="#8A9A6B" />
      <path d="M0 140 C80 116 150 126 210 140 C250 150 280 136 300 130 V190 H0 Z" fill="#6E7C4D" />
      <path d="M20 128 C70 108 130 112 180 124 M10 160 C80 140 160 146 240 162 M60 182 C120 168 200 172 290 180" stroke="#4B5A2F" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" fill="none" />
      <circle cx="96" cy="150" r="3" fill="#A2462F" />
      <circle cx="150" cy="134" r="3" fill="#A2462F" />
      <circle cx="210" cy="166" r="3" fill="#A2462F" />
    </>
  ),
  quindio: (
    <>
      <rect width="300" height="190" fill="#E2E9E4" />
      <path d="M0 130 L70 70 L130 112 L200 58 L300 120 V190 H0 Z" fill="#ADB497" />
      <rect y="150" width="300" height="40" fill="#8A9A6B" />
      {[60, 150, 236].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 172 C${x + 1} 120 ${x - 2} 70 ${x + 2} ${30 + i * 8}`} stroke="#7C6A4C" strokeWidth="4" fill="none" />
          <path d={`M${x + 2} ${30 + i * 8} q-22 0 -30 14 M${x + 2} ${30 + i * 8} q-6 -18 -24 -16 M${x + 2} ${30 + i * 8} q10 -18 26 -12 M${x + 2} ${30 + i * 8} q22 2 26 16`} stroke="#4B5A2F" strokeWidth="6" strokeLinecap="round" fill="none" />
        </g>
      ))}
    </>
  ),
  parapente: (
    <>
      <rect width="300" height="190" fill="#D6E5EE" />
      <path d="M0 160 L80 112 L150 146 L230 100 L300 136 V190 H0 Z" fill="#8A9A6B" />
      <path d="M92 52 Q150 18 208 52 Q150 40 92 52 Z" fill="#BF7E5A" />
      <path d="M92 52 L146 104 M208 52 L154 104 M120 44 L148 104 M180 44 L152 104" stroke="#4B5A2F" strokeWidth="1.2" />
      <circle cx="150" cy="104" r="5" fill="#4B5A2F" />
      <path d="M150 109 v12" stroke="#4B5A2F" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  "cable-vuelo": (
    <>
      <rect width="300" height="190" fill="#E7EEDD" />
      <path d="M0 150 C60 110 120 140 180 112 C230 90 270 104 300 96 V190 H0 Z" fill="#6E7C4D" />
      <path d="M10 26 L290 136" stroke="#4B5A2F" strokeWidth="2" />
      <path d="M170 80 L170 96" stroke="#4B5A2F" strokeWidth="2" />
      <circle cx="170" cy="102" r="6" fill="#BF7E5A" />
      <path d="M170 108 L170 124 M170 112 L158 104 M170 112 L182 104 M170 124 L162 136 M170 124 L178 136" stroke="#BF7E5A" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  "montana-rusa": (
    <>
      <rect width="300" height="190" fill="#F6E3D6" />
      <path d="M0 160 C40 160 50 60 90 60 C130 60 120 150 150 150 C175 150 168 96 196 96 C226 96 230 160 300 160" stroke="#BF7E5A" strokeWidth="5" fill="none" />
      <path d="M0 168 C40 168 50 68 90 68 C130 68 120 158 150 158 C175 158 168 104 196 104 C226 104 230 168 300 168" stroke="#BF7E5A" strokeWidth="2" fill="none" />
      <path d="M40 190 V140 M90 190 V70 M150 190 V156 M196 190 V102 M250 190 V166" stroke="#8D7A5C" strokeWidth="3" />
      <rect x="74" y="48" width="34" height="14" rx="4" fill="#4B5A2F" transform="rotate(-4 90 55)" />
    </>
  ),
  maletas: (
    <>
      <rect width="300" height="190" fill="#EFE6D2" />
      <rect x="92" y="62" width="116" height="96" rx="12" fill="#BF7E5A" />
      <path d="M128 62 V44 a8 8 0 0 1 8 -8 h28 a8 8 0 0 1 8 8 V62" stroke="#4B5A2F" strokeWidth="6" fill="none" />
      <path d="M120 62 V158 M180 62 V158" stroke="#9A5F40" strokeWidth="6" />
      <circle cx="108" cy="166" r="7" fill="#4B5A2F" />
      <circle cx="192" cy="166" r="7" fill="#4B5A2F" />
      <rect x="140" y="92" width="40" height="26" rx="4" fill="#FBF9F2" transform="rotate(8 160 105)" />
      <path d="M150 104 h20" stroke="#C9A961" strokeWidth="3" transform="rotate(8 160 105)" />
    </>
  ),
};

export const STAMPS = [
  { id: "santa-marta", title: "Santa Marta", desc: "La Sierra Nevada mirando al mar" },
  { id: "cartagena", title: "Cartagena", desc: "Balcones y murallas" },
  { id: "tayrona", title: "El Tayrona", desc: "Selva, piedras y mar" },
  { id: "medellin", title: "Medellín", desc: "La ciudad de la eterna primavera" },
  { id: "san-andres", title: "San Andrés", desc: "El mar de los siete colores" },
  { id: "pereira", title: "Pereira", desc: "Montañas de café" },
  { id: "quindio", title: "Quindío", desc: "Tierra de palmas de cera" },
  { id: "parapente", title: "Parapente", desc: "Volar, aunque dé miedo" },
  { id: "cable-vuelo", title: "Cable vuelo", desc: "Lanzarse sin pensarlo dos veces" },
  { id: "montana-rusa", title: "Montañas rusas", desc: "Gritar juntos en cada bajada" },
  { id: "maletas", title: "… y lo que se atravesara", desc: "Maletas siempre listas" },
] as const;

export function StampArt({ id }: { id: string }) {
  return (
    <svg className="hs-stamp-art" viewBox="0 0 300 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {STAMP_ART[id]}
    </svg>
  );
}

/** Ruta punteada con el avión que avanza con la galería. */
export function FlightRoute() {
  return (
    <div className="hs-route" aria-hidden="true">
      <svg className="hs-route-line" viewBox="0 0 1000 40" preserveAspectRatio="none" focusable="false">
        <path d="M0 22 C120 6 240 36 360 20 C480 4 600 36 720 20 C840 6 920 30 1000 18" fill="none" stroke={GOLD} strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="hs-plane-run">
        <div className="hs-plane-mover">
          <svg className="hs-plane" viewBox="0 0 32 32" focusable="false">
            <path d="M30 16 L4 6 L9 16 L4 26 Z" fill={OLIVE} />
            <path d="M9 16 H22" stroke="#FBF9F2" strokeWidth="1.4" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ---------- Capítulo 3: dos hilos que forman un anillo ---------- */

export function RingScene() {
  return (
    <svg className="hs-ring-svg" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hs-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E9D196" />
          <stop offset=".5" stopColor="#C9A961" />
          <stop offset="1" stopColor="#A9883F" />
        </linearGradient>
      </defs>
      <circle className="hs-ring-band" cx="200" cy="215" r="128" fill="none" stroke="url(#hs-gold)" strokeWidth="18" />
      <g fill="none" strokeLinecap="round" strokeWidth="3.2">
        <path pathLength={1} className="hs-draw hs-ring-half" d="M200 343 A128 128 0 0 1 200 87" stroke={OLIVE} />
        <path pathLength={1} className="hs-draw hs-ring-half" d="M200 343 A128 128 0 0 0 200 87" stroke={TERRA} />
      </g>
      <g className="hs-gem">
        <path d="M176 78 L188 62 H212 L224 78 L200 104 Z" fill="#F4F7FA" stroke="#A9B9C6" strokeWidth="1.5" />
        <path d="M176 78 H224 M188 62 L196 78 L200 104 M212 62 L204 78 L200 104" fill="none" stroke="#A9B9C6" strokeWidth="1.1" />
      </g>
      <g className="hs-sparks" fill={GOLD}>
        {[
          [150, 52, 1],
          [254, 46, 0.8],
          [272, 104, 0.6],
          [128, 108, 0.7],
        ].map(([x, y, s], i) => (
          <path key={i} className="hs-spark" d="M0 -9 L2 -2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2 -2 Z" transform={`translate(${x} ${y}) scale(${s})`} />
        ))}
      </g>
    </svg>
  );
}

/* ---------- Capítulo 4: un hogar que se multiplica ---------- */

const HEARTS: [number, number, number][] = [
  [250, 151, 0.85],
  [176, 96, 0.8],
  [326, 96, 0.8],
  [118, 150, 0.7],
  [384, 150, 0.7],
  [60, 92, 0.6],
  [444, 92, 0.6],
  [250, 26, 0.75],
];

function Figure({ x, h, color, cls }: { x: number; h: number; color: string; cls: string }) {
  const head = h * 0.2;
  const top = 412 - h;
  return (
    <g className={`hs-fig ${cls}`}>
      <circle cx={x} cy={top + head} r={head} fill={color} />
      <path d={`M${x - h * 0.2} 412 C${x - h * 0.22} ${top + head * 2.6} ${x - h * 0.14} ${top + head * 2.2} ${x} ${top + head * 2.2} C${x + h * 0.14} ${top + head * 2.2} ${x + h * 0.22} ${top + head * 2.6} ${x + h * 0.2} 412 Z`} fill={color} />
    </g>
  );
}

export function HomeScene() {
  return (
    <svg className="hs-home-svg" viewBox="0 0 500 440" aria-hidden="true" focusable="false">
      <path d="M30 414 H470" stroke="#C9B79A" strokeWidth="3" strokeLinecap="round" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5">
        <path pathLength={1} className="hs-draw hs-house" d="M60 214 L250 64" stroke={OLIVE} />
        <path pathLength={1} className="hs-draw hs-house" d="M440 214 L250 64" stroke={TERRA} />
        <path pathLength={1} className="hs-draw hs-house" d="M96 186 V412 H404 V186" stroke={GOLD} strokeWidth="3.5" />
      </g>
      <circle className="hs-house-window" cx="250" cy="150" r="22" fill="#FBF5E6" stroke={GOLD} strokeWidth="2.5" />
      <g className="hs-hearts" fill="#D3A8A0">
        {HEARTS.map(([x, y, s], i) => (
          <path key={i} className={`hs-heart hs-heart-${i}`} d="M0 8 C-6 4 -9 1 -9 -3 C-9 -6.5 -6.5 -9 -3.5 -9 C-1.6 -9 -0.5 -8 0 -6.6 C0.5 -8 1.6 -9 3.5 -9 C6.5 -9 9 -6.5 9 -3 C9 1 6 4 0 8 Z" transform={`translate(${x} ${y}) scale(${s * 1.4})`} />
        ))}
      </g>
      <Figure x={162} h={150} color={OLIVE} cls="hs-fig-a" />
      <Figure x={226} h={136} color={TERRA} cls="hs-fig-n" />
      <Figure x={296} h={92} color="#C98F86" cls="hs-fig-g" />
      <Figure x={352} h={70} color="#7F9DB4" cls="hs-fig-v" />
    </svg>
  );
}

/* ---------- Capítulo 6: el cielo del día de la boda ---------- */

export function DaySilhouette() {
  return (
    <svg className="hs-day-land" viewBox="0 0 1600 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <path d="M0 150 C220 90 420 120 620 150 C820 180 1040 110 1240 120 C1400 128 1500 150 1600 140 V260 H0 Z" fill="#ADB497" fillOpacity=".7" />
      <path d="M0 200 C260 160 520 190 800 196 C1080 202 1320 168 1600 186 V260 H0 Z" fill="#8A9A6B" fillOpacity=".85" />
      <g fill="#6E7C4D">
        <path d="M300 168 V128 L330 104 L360 128 V168 Z" />
        <path d="M326 104 V78 M318 86 H334" stroke="#6E7C4D" strokeWidth="4" />
        <path d="M1220 148 h120 v32 h-120 z M1236 148 l44 -26 l44 26 z" />
      </g>
    </svg>
  );
}
