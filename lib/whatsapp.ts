import { waNumber } from "./format";

export function invitationMessage(name: string, seats: number, url: string) {
  return [
    `Hola ${name} 💛`,
    "",
    "Con mucha alegría te invitamos a nuestra boda el 27 de diciembre de 2026.",
    "",
    "Aquí está tu invitación (ábrela y toca el sobre ✉️):",
    url,
    // Sin cupo (0): la invitación es para compartir la noticia, no se pide confirmar.
    ...(seats > 0
      ? ["", `Cupo${seats === 1 ? "" : "s"} asignado${seats === 1 ? "" : "s"}: ${seats}`, "Por favor confírmanos tu asistencia desde la invitación."]
      : []),
    "",
    "Con cariño,",
    "Norida & Agustín",
  ].join("\n");
}

/** Tarjeta de participación: se comparte la noticia, sin cupos ni confirmación; pueden escribirles un mensaje. */
export function participationMessage(name: string, url: string) {
  return [
    `Hola ${name} 💛`,
    "",
    "Con mucha alegría queremos compartir contigo que nos casamos el 27 de diciembre de 2026.",
    "",
    "Aquí está nuestra participación de matrimonio (ábrela y toca el sobre ✉️):",
    url,
    "",
    "Si quieres, desde ahí puedes dejarnos un mensaje.",
    "",
    "Con cariño,",
    "Norida & Agustín",
  ].join("\n");
}

export function whatsappHref(phone: string | null | undefined, text: string) {
  const n = waNumber(phone);
  const t = encodeURIComponent(text);
  return n ? `https://wa.me/${n}?text=${t}` : `https://wa.me/?text=${t}`;
}
