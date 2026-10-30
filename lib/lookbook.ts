// Lookbook de las asesoras: looks curados para una boda de día, semiformal casual y clima cálido.
// Paleta de la boda: verde salvia, terracota, azul cielo y rosa palo. Nada de blanco, marfil ni crema.
// Imágenes generadas con FLUX.2 (scripts/gen-lookbook.sh) en public/lookbook/.

export type LookCategory = "mujer" | "hombre" | "zapatos-hombre" | "zapatos-mujer" | "accesorios" | "peinado";
export type LookStyle = "clasico" | "boho" | "moderno" | "tropical";

export type Look = {
  id: string;
  title: string;
  category: LookCategory;
  style: LookStyle[];
  summary: string;
  pieces: string[];
  combine: string[];
  pairsWith: string[];
  keywords: string[];
};

export const CATEGORY_LABEL: Record<LookCategory, string> = {
  mujer: "Mujer",
  hombre: "Hombre",
  "zapatos-hombre": "Zapatos de hombre",
  "zapatos-mujer": "Zapatos de mujer",
  accesorios: "Accesorios",
  peinado: "Peinados",
};

export const STYLE_LABEL: Record<LookStyle, string> = {
  clasico: "Clásico elegante",
  boho: "Boho romántico",
  moderno: "Moderno minimal",
  tropical: "Tropical caribeño",
};

export const LOOKS: Look[] = [
  // ---------------- Mujer
  {
    id: "m-midi-salvia",
    title: "Vestido midi verde salvia",
    category: "mujer",
    style: ["clasico"],
    summary: "Vestido midi fluido de gasa en verde salvia, con escote en V discreto y mangas cortas: el color de la boda, fresco y elegante.",
    pieces: ["Vestido midi de gasa o crepé verde salvia", "Sandalias de tacón cuadrado nude", "Aretes dorados pequeños", "Clutch de mimbre"],
    combine: ["Acentos dorados: argollas, pulsera fina o cinturón delgado.", "Para la iglesia, un chal ligero en rosa palo cubre los hombros.", "Labios en tono terracota suave para dar calidez."],
    pairsWith: ["zm-tacon-cuadrado", "ac-mujer-mimbre", "pe-recogido-flores"],
    keywords: ["vestido", "verde", "salvia", "midi", "clasico", "elegante", "mujer"],
  },
  {
    id: "m-satin-terracota",
    title: "Slip dress satinado terracota",
    category: "mujer",
    style: ["moderno"],
    summary: "Vestido de satén terracota al tobillo con tiras finas: minimal y luminoso, ideal con dorados.",
    pieces: ["Slip dress de satén terracota", "Blazer ligero arena (para la misa)", "Sandalias de tiras doradas", "Aretes escultóricos dorados"],
    combine: ["Lleva el blazer para la ceremonia y quítatelo en la recepción.", "Accesorios dorados y nada más: el satén ya brilla.", "Cabello liso o en moño pulido para un look moderno."],
    pairsWith: ["zm-bailarinas-doradas", "ac-mujer-mimbre", "pe-mono-pulido"],
    keywords: ["vestido", "terracota", "satin", "satén", "moderno", "minimal", "mujer", "largo"],
  },
  {
    id: "m-boho-azul",
    title: "Vestido boho floral azul cielo",
    category: "mujer",
    style: ["boho"],
    summary: "Vestido midi estampado de flores pequeñas sobre azul cielo, con mangas abullonadas y volantes: romántico y fresco.",
    pieces: ["Vestido floral azul cielo con volantes", "Cuñas de yute", "Sombrero o tocado floral", "Bolso de mimbre"],
    combine: ["Las cuñas de yute te dejan bailar toda la tarde.", "Suma un tocado de flores secas en tonos rosa palo.", "Aretes de perla pequeños, nada recargado."],
    pairsWith: ["zm-cuna-yute", "ac-tocado-floral", "pe-trenza-suelta"],
    keywords: ["vestido", "floral", "flores", "azul", "cielo", "boho", "romantico", "estampado", "mujer"],
  },
  {
    id: "m-plisada-rosa",
    title: "Falda plisada rosa palo",
    category: "mujer",
    style: ["clasico"],
    summary: "Falda midi plisada rosa palo con blusa de seda en verde salvia: un dos piezas fácil de volver a usar.",
    pieces: ["Falda midi plisada rosa palo", "Blusa de seda verde salvia", "Sandalias nude", "Cinturón dorado delgado"],
    combine: ["Mete la blusa en la falda y marca la cintura con un cinturón fino.", "Si prefieres un solo tono, cambia la blusa por una en rosa palo.", "Bolso pequeño en terracota para dar contraste."],
    pairsWith: ["zm-tacon-cuadrado", "ac-mujer-mimbre", "pe-recogido-flores"],
    keywords: ["falda", "plisada", "rosa", "palo", "blusa", "dos piezas", "clasico", "mujer"],
  },
  {
    id: "m-palazzo-azul",
    title: "Conjunto de lino azul cielo",
    category: "mujer",
    style: ["moderno"],
    summary: "Pantalón palazzo y top de lino azul cielo: cómodo, fresco y elegante para quien no quiere vestido.",
    pieces: ["Pantalón palazzo de lino azul cielo", "Top o blusa a juego", "Sandalias de tacón cuadrado", "Collar dorado"],
    combine: ["El monocromático estiliza: mismo tono arriba y abajo.", "Una blazer o kimono ligero para la iglesia.", "Agrega un bolso terracota o rosa palo."],
    pairsWith: ["zm-tacon-cuadrado", "ac-mujer-mimbre", "pe-mono-pulido"],
    keywords: ["pantalon", "palazzo", "lino", "azul", "conjunto", "sin vestido", "comodo", "moderno", "mujer"],
  },
  {
    id: "m-jumpsuit-salvia",
    title: "Enterizo verde salvia",
    category: "mujer",
    style: ["moderno"],
    summary: "Jumpsuit de pierna ancha en verde salvia con cinturón: práctico para bailar y muy favorecedor.",
    pieces: ["Enterizo verde salvia de pierna ancha", "Cinturón dorado", "Sandalias de tiras", "Aretes largos"],
    combine: ["Ajusta la cintura con un cinturón dorado.", "Bailarinas doradas de repuesto para la pista.", "Peinado recogido para lucir los aretes."],
    pairsWith: ["zm-bailarinas-doradas", "ac-mujer-mimbre", "pe-mono-pulido"],
    keywords: ["enterizo", "jumpsuit", "verde", "salvia", "pantalon", "moderno", "comodo", "mujer"],
  },
  {
    id: "m-tropical-hojas",
    title: "Vestido estampado tropical",
    category: "mujer",
    style: ["tropical"],
    summary: "Vestido wrap con estampado de hojas en verdes y terracota sobre fondo azul cielo: alegre y caribeño.",
    pieces: ["Vestido cruzado (wrap) estampado de hojas", "Cuñas de yute", "Argollas doradas", "Abanico de palma"],
    combine: ["Deja que el estampado hable: accesorios lisos y dorados.", "Un abanico es el mejor aliado para una boda de día.", "Bolso pequeño en un color del estampado."],
    pairsWith: ["zm-cuna-yute", "ac-mujer-mimbre", "pe-trenza-suelta"],
    keywords: ["vestido", "tropical", "hojas", "estampado", "wrap", "cruzado", "caribe", "mujer"],
  },
  // ---------------- Hombre
  {
    id: "h-guayabera-salvia",
    title: "Guayabera de lino verde salvia",
    category: "hombre",
    style: ["tropical", "clasico"],
    summary: "Guayabera de lino verde salvia con pantalón beige arena y mocasines de ante café: el clásico caribeño de día.",
    pieces: ["Guayabera de lino manga larga verde salvia", "Pantalón de lino beige arena", "Mocasines de ante café", "Correa café"],
    combine: ["La guayabera va por fuera del pantalón, bien planchada.", "Mangas largas para la misa; puedes remangarlas en la recepción.", "Zapato y correa del mismo tono café."],
    pairsWith: ["zh-mocasin-ante", "ac-hombre", "h-traje-lino-arena"],
    keywords: ["guayabera", "lino", "verde", "salvia", "hombre", "tropical", "caribe", "clasico"],
  },
  {
    id: "h-traje-lino-arena",
    title: "Traje de lino arena + camisa azul cielo",
    category: "hombre",
    style: ["clasico"],
    summary: "Traje de lino beige arena con camisa azul cielo, sin corbata: semiformal y fresco.",
    pieces: ["Traje de lino beige arena", "Camisa azul cielo", "Mocasines o derbys café", "Pañuelo de bolsillo terracota"],
    combine: ["Sin corbata y con el primer botón abierto: semiformal casual.", "El pañuelo terracota conecta con la paleta de la boda.", "Evita la camisa blanca: el azul cielo es la mejor alternativa."],
    pairsWith: ["zh-derby-cafe", "ac-hombre", "zh-monk"],
    keywords: ["traje", "lino", "beige", "arena", "camisa", "azul", "hombre", "clasico", "blazer", "saco"],
  },
  {
    id: "h-camisa-terracota",
    title: "Camisa de lino terracota",
    category: "hombre",
    style: ["tropical", "moderno"],
    summary: "Camisa de lino terracota con pantalón de dril verde oliva y derbys café claro: cálido y relajado.",
    pieces: ["Camisa de lino terracota", "Pantalón de dril verde oliva", "Derbys café claro", "Reloj de correa de cuero"],
    combine: ["Camisa por dentro y correa café para verse más pulido.", "Mangas remangadas a tres cuartos después de la misa.", "Medias tobilleras invisibles si usas mocasines."],
    pairsWith: ["zh-derby-cafe", "ac-hombre", "zh-alpargata"],
    keywords: ["camisa", "lino", "terracota", "dril", "oliva", "hombre", "tropical", "casual"],
  },
  {
    id: "h-blazer-salvia",
    title: "Blazer verde salvia",
    category: "hombre",
    style: ["moderno"],
    summary: "Blazer desestructurado verde salvia, camisa azul cielo y pantalón gris piedra: moderno y con estilo.",
    pieces: ["Blazer de lino o algodón verde salvia", "Camisa azul cielo", "Pantalón gris piedra", "Mocasines de ante"],
    combine: ["Blazer abierto, sin corbata.", "Mocasines sin medias visibles para un look moderno.", "Un reloj sencillo es todo el accesorio que necesitas."],
    pairsWith: ["zh-mocasin-ante", "ac-hombre", "h-traje-lino-arena"],
    keywords: ["blazer", "saco", "chaqueta", "verde", "salvia", "moderno", "hombre"],
  },
  {
    id: "h-camisa-rosa",
    title: "Camisa rosa palo + pantalón azul marino",
    category: "hombre",
    style: ["clasico"],
    summary: "Camisa de lino rosa palo con pantalón azul marino y mocasines café: un contraste elegante y fresco.",
    pieces: ["Camisa de lino rosa palo", "Pantalón azul marino de lino o algodón", "Mocasines café", "Correa café"],
    combine: ["El rosa palo se ve elegante con azul marino.", "Puedes sumar un blazer azul marino para la ceremonia.", "Zapatos café, nunca negros en una boda de día."],
    pairsWith: ["zh-mocasin-ante", "zh-monk", "ac-hombre"],
    keywords: ["camisa", "rosa", "palo", "azul", "marino", "hombre", "clasico"],
  },
  {
    id: "h-cubana-azul",
    title: "Camisa cuello cubano azul cielo",
    category: "hombre",
    style: ["moderno", "tropical"],
    summary: "Camisa de cuello cubano azul cielo con pantalón plisado verde oliva: tendencia, fresco y fácil.",
    pieces: ["Camisa de cuello cubano azul cielo", "Pantalón plisado verde oliva", "Alpargatas o mocasines", "Lentes de sol"],
    combine: ["Camisa por dentro con pantalón de tiro alto.", "Ideal para la recepción; para la misa añade un blazer.", "Cadena fina o reloj como único detalle."],
    pairsWith: ["zh-alpargata", "zh-mocasin-ante", "ac-hombre"],
    keywords: ["camisa", "cubana", "cuello cubano", "azul", "cielo", "oliva", "moderno", "hombre"],
  },
  // ---------------- Zapatos hombre
  {
    id: "zh-mocasin-ante",
    title: "Mocasines de ante café",
    category: "zapatos-hombre",
    style: ["clasico", "tropical"],
    summary: "Mocasines de ante (suede) café: el zapato estrella para bodas de día con lino y guayabera.",
    pieces: ["Mocasín penny o de borlas en ante café"],
    combine: ["Combínalos con lino, guayabera o traje claro.", "Con medias invisibles para que se vea el tobillo.", "Correa en un tono café parecido."],
    pairsWith: ["h-guayabera-salvia", "h-blazer-salvia", "h-camisa-rosa"],
    keywords: ["zapatos", "mocasines", "ante", "suede", "loafers", "cafe", "hombre"],
  },
  {
    id: "zh-derby-cafe",
    title: "Derbys de cuero café claro",
    category: "zapatos-hombre",
    style: ["clasico"],
    summary: "Derbys o brogues de cuero café claro: más formales que el mocasín, perfectos con traje de lino.",
    pieces: ["Derby o brogue de cuero café claro"],
    combine: ["Con traje de lino o pantalón de dril.", "Medias en un tono del pantalón.", "Evita el negro: en el día se ve pesado."],
    pairsWith: ["h-traje-lino-arena", "h-camisa-terracota"],
    keywords: ["zapatos", "derby", "brogue", "cuero", "cafe", "formal", "hombre"],
  },
  {
    id: "zh-monk",
    title: "Double monk café",
    category: "zapatos-hombre",
    style: ["moderno", "clasico"],
    summary: "Zapatos de doble hebilla en cuero café: un toque de estilo para traje o pantalón de vestir.",
    pieces: ["Double monk strap en cuero café"],
    combine: ["Con traje claro o pantalón azul marino.", "Hebillas plateadas o doradas según tu reloj.", "Pantalón con quiebre corto para lucirlos."],
    pairsWith: ["h-traje-lino-arena", "h-camisa-rosa"],
    keywords: ["zapatos", "monk", "hebilla", "cuero", "cafe", "hombre"],
  },
  {
    id: "zh-alpargata",
    title: "Alpargatas elegantes",
    category: "zapatos-hombre",
    style: ["tropical"],
    summary: "Alpargatas de ante o lona en tono arena con suela de yute: lo más fresco para la pista de baile.",
    pieces: ["Alpargata de ante o lona color arena"],
    combine: ["Solo con looks tropicales o camisa de lino.", "Ideales como repuesto para bailar.", "Sin medias."],
    pairsWith: ["h-camisa-terracota", "h-cubana-azul"],
    keywords: ["zapatos", "alpargatas", "espadrilles", "yute", "casual", "bailar", "hombre"],
  },
  // ---------------- Zapatos mujer
  {
    id: "zm-tacon-cuadrado",
    title: "Sandalias de tacón cuadrado",
    category: "zapatos-mujer",
    style: ["clasico", "moderno"],
    summary: "Sandalias nude o doradas de tacón cuadrado medio: elegantes y estables sobre césped o adoquín.",
    pieces: ["Sandalia de tacón cuadrado de 5 a 7 cm, nude o dorada"],
    combine: ["El tono nude alarga la pierna con cualquier color.", "Perfectas con vestido midi o conjunto de lino.", "Si hay césped, el tacón cuadrado no se entierra."],
    pairsWith: ["m-midi-salvia", "m-plisada-rosa", "m-palazzo-azul"],
    keywords: ["zapatos", "sandalias", "tacon", "cuadrado", "nude", "dorado", "mujer"],
  },
  {
    id: "zm-cuna-yute",
    title: "Cuñas de yute",
    category: "zapatos-mujer",
    style: ["boho", "tropical"],
    summary: "Cuñas tipo alpargata con tiras de lazo al tobillo: altura con comodidad para bailar toda la tarde.",
    pieces: ["Cuña de yute con tiras atadas al tobillo"],
    combine: ["Ideales con vestidos boho o tropicales.", "Elige tiras en rosa palo, terracota o nude.", "Cómodas de 10 a.m. a 5 p.m."],
    pairsWith: ["m-boho-azul", "m-tropical-hojas"],
    keywords: ["zapatos", "cuñas", "cuna", "yute", "alpargatas", "comodos", "bailar", "mujer"],
  },
  {
    id: "zm-bailarinas-doradas",
    title: "Bailarinas doradas",
    category: "zapatos-mujer",
    style: ["moderno"],
    summary: "Flats metalizados dorados: el par de repuesto perfecto para la pista abierta.",
    pieces: ["Bailarinas o sandalias planas doradas"],
    combine: ["Guárdalas en el bolso para la pista abierta.", "Con enterizo o slip dress son un look completo.", "El dorado combina con toda la paleta."],
    pairsWith: ["m-jumpsuit-salvia", "m-satin-terracota"],
    keywords: ["zapatos", "planos", "flats", "bailarinas", "dorado", "repuesto", "bailar", "mujer"],
  },
  // ---------------- Accesorios y peinados
  {
    id: "ac-mujer-mimbre",
    title: "Bolso de mimbre y dorados",
    category: "accesorios",
    style: ["boho", "clasico", "tropical"],
    summary: "Clutch de mimbre, argollas doradas y un abanico: los básicos de una invitada de día.",
    pieces: ["Clutch de mimbre o rafia", "Argollas o aretes dorados", "Abanico", "Pulsera fina"],
    combine: ["Un solo protagonista: o aretes grandes o collar, no ambos.", "El abanico es práctico y fotogénico.", "Dorado mejor que plateado con esta paleta."],
    pairsWith: ["m-midi-salvia", "m-boho-azul", "m-tropical-hojas"],
    keywords: ["accesorios", "bolso", "cartera", "mimbre", "aretes", "abanico", "dorado", "mujer"],
  },
  {
    id: "ac-hombre",
    title: "Accesorios para él",
    category: "accesorios",
    style: ["clasico", "moderno"],
    summary: "Correa de cuero café, reloj sencillo, pañuelo de bolsillo terracota y lentes de sol.",
    pieces: ["Correa de cuero café", "Reloj de correa de cuero", "Pañuelo de bolsillo terracota o salvia", "Lentes de sol"],
    combine: ["Correa del mismo tono que los zapatos.", "El pañuelo solo si llevas blazer.", "Lentes de sol para las fotos de la tarde."],
    pairsWith: ["h-traje-lino-arena", "h-guayabera-salvia", "h-blazer-salvia"],
    keywords: ["accesorios", "correa", "cinturon", "reloj", "pañuelo", "lentes", "hombre"],
  },
  {
    id: "ac-tocado-floral",
    title: "Tocado floral",
    category: "accesorios",
    style: ["boho"],
    summary: "Pinza o peineta con flores secas en rosa palo y salvia: el detalle romántico para el cabello.",
    pieces: ["Peineta o pinzas con flores secas"],
    combine: ["En un recogido bajo o a un lado de la trenza.", "Elige flores en tonos de la paleta.", "Nada de velos ni coronas blancas."],
    pairsWith: ["m-boho-azul", "pe-trenza-suelta", "pe-recogido-flores"],
    keywords: ["tocado", "flores", "peineta", "pinza", "cabello", "boho", "mujer"],
  },
  {
    id: "pe-recogido-flores",
    title: "Recogido bajo romántico",
    category: "peinado",
    style: ["clasico", "boho"],
    summary: "Moño bajo con mechones sueltos y pequeñas flores: fresco para el calor y perfecto para la foto.",
    pieces: ["Moño bajo despeinado", "Mechones sueltos al frente", "Flores pequeñas o pinzas doradas"],
    combine: ["Ideal con escotes en V o vestidos midi.", "Laca ligera para que dure hasta las 5 p.m.", "Aretes medianos para enmarcar el rostro."],
    pairsWith: ["m-midi-salvia", "m-plisada-rosa", "ac-tocado-floral"],
    keywords: ["peinado", "recogido", "moño", "cabello", "pelo", "flores", "mujer"],
  },
  {
    id: "pe-trenza-suelta",
    title: "Trenza suelta boho",
    category: "peinado",
    style: ["boho", "tropical"],
    summary: "Trenza lateral holgada con textura: relajada, romántica y aguanta el baile.",
    pieces: ["Trenza lateral holgada", "Spray texturizador", "Pinzas con flores opcionales"],
    combine: ["Con vestidos boho o tropicales.", "Suma flores secas para un toque especial.", "Funciona con cabello largo o medio."],
    pairsWith: ["m-boho-azul", "m-tropical-hojas", "ac-tocado-floral"],
    keywords: ["peinado", "trenza", "cabello", "pelo", "boho", "mujer"],
  },
  {
    id: "pe-mono-pulido",
    title: "Moño alto pulido",
    category: "peinado",
    style: ["moderno"],
    summary: "Moño alto liso y pulido: moderno, fresco para el calor y deja lucir aretes escultóricos.",
    pieces: ["Moño alto liso", "Gel o cera de acabado", "Aretes protagonistas"],
    combine: ["Con slip dress, enterizo o conjunto de lino.", "Aretes grandes dorados.", "Maquillaje luminoso y labios terracota."],
    pairsWith: ["m-satin-terracota", "m-jumpsuit-salvia", "m-palazzo-azul"],
    keywords: ["peinado", "moño", "alto", "liso", "cabello", "pelo", "moderno", "mujer"],
  },
];

export const LOOK_BY_ID = new Map(LOOKS.map((l) => [l.id, l]));

export const lookImage = (id: string) => `/lookbook/${id}.jpg`;
export const lookThumb = (id: string) => `/lookbook/thumb/${id}.jpg`;

/** Catálogo compacto para el prompt del modelo. */
export function lookbookForPrompt() {
  return LOOKS.map((l) => `${l.id} | ${l.title} | ${CATEGORY_LABEL[l.category]} | ${l.style.map((s) => STYLE_LABEL[s]).join(", ")}`).join("\n");
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Respaldo cuando el modelo no sugiere looks: coincidencia por palabras clave. */
export function matchLooks(text: string, limit = 4): string[] {
  const t = norm(text);
  const wantsMan = /\b(hombre|caballero|el\b|novio|guayabera|traje|corbata)/.test(t);
  const wantsWoman = /\b(mujer|dama|vestido|falda|tacon|ella)/.test(t);
  const scored = LOOKS.map((l) => {
    let score = 0;
    for (const k of l.keywords) if (t.includes(norm(k))) score += k.length > 5 ? 2 : 1;
    const male = l.category === "hombre" || l.category === "zapatos-hombre" || l.id === "ac-hombre";
    const female = l.category === "mujer" || l.category === "zapatos-mujer" || l.category === "peinado" || l.id === "ac-mujer-mimbre" || l.id === "ac-tocado-floral";
    if (wantsMan && !wantsWoman && female) score -= 3;
    if (wantsWoman && !wantsMan && male) score -= 3;
    return { id: l.id, score };
  });
  return scored
    .filter((s) => s.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.id);
}
