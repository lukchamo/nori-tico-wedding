/** Datos fijos de la boda: una sola fuente para la tarjeta, el OG, la IA y el backoffice. */
export const WEDDING = {
  couple: "Norida & Agustín",
  bride: "Norida",
  groom: "Agustín",
  dateLabel: "27 de diciembre de 2026",
  dateISO: "2026-12-27T10:00:00-05:00",
  ceremony: {
    place: "Iglesia Nuestra Señora de la Caridad del Cobre",
    time: "10:00 a. m.",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Iglesia%20Nuestra%20Se%C3%B1ora%20de%20la%20Caridad%20del%20Cobre",
  },
  reception: {
    place: "Salón de Eventos Le Grand",
    time: "1:00 p. m.",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Le%20Grand",
  },
  spotifyUrl: "https://open.spotify.com/track/5fF0fb0VFihGDHFshDLi2Z?si=-EKuKqRlQU6GJk_LniLdEw",
  calendarUrl:
    "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Boda%20de%20Norida%20%26%20Agust%C3%ADn&dates=20261227T150000Z/20261227T230000Z&details=Ceremonia%20cat%C3%B3lica%2C%20%C3%ADntima%20entre%20familia%20y%20amigos%20cercanos.&location=Iglesia%20Nuestra%20Se%C3%B1ora%20de%20la%20Caridad%20del%20Cobre",
  gift: {
    bank: "Nu Bank · Ahorros",
    account: "74605247",
    holder: "Agustín Flórez Arrieta",
    key: "@afa066",
  },
  dressCode: "Semiformal · Casual",
  colors: [
    { id: "sage", name: "Verde salvia", hex: "#8A9A6B" },
    { id: "terracota", name: "Terracota", hex: "#BF7E5A" },
    { id: "azul", name: "Azul cielo", hex: "#9FB4C7" },
    { id: "rosa", name: "Rosa palo", hex: "#D3A8A0" },
  ],
  itinerary: [
    { time: "10:00 a. m.", label: "Eucaristía · Ceremonia Religiosa" },
    { time: "1:00 p. m.", label: "Llegada de invitados" },
    { time: "1:15 p. m.", label: "Entrada de los novios" },
    { time: "1:20 p. m.", label: "Primer baile de los esposos" },
    { time: "1:40 p. m.", label: "Brindis y palabras · padrinos, familiares y esposos" },
    { time: "2:00 p. m.", label: "Almuerzo" },
    { time: "2:30 p. m.", label: "Fotos" },
    { time: "3:00 p. m.", label: "Pista abierta" },
    { time: "5:00 p. m.", label: "Cierre de la celebración" },
  ],
} as const;

/** Costo estimado por plato (hoja "Invitados Matrimonio"), en COP. */
export const PLATE_COST = { adult: 85_000, child: 50_000 } as const;

export const FALLBACK_SITE_URL = "https://noridayagustin.com";
