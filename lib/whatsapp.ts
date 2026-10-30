import { waNumber } from "./format";

export function invitationMessage(name: string, seats: number, url: string) {
  return [
    `Hola ${name} 💛`,
    "",
    "Con mucha alegría te invitamos a nuestra boda el 27 de diciembre de 2026.",
    "",
    "Aquí está tu invitación (ábrela y toca el sobre ✉️):",
    url,
    "",
    `Cupo${seats === 1 ? "" : "s"} asignado${seats === 1 ? "" : "s"}: ${seats}`,
    "Por favor confírmanos tu asistencia desde la invitación.",
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
