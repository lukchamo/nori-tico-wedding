import type { Metadata } from "next";

const OG = {
  invitacion: {
    title: "Nos casamos — Norida & Agustín",
    description:
      "Con mucha alegría te invitamos a nuestra boda. Toca para ver la invitación completa, el itinerario y confirmar tu asistencia. 27 de diciembre de 2026.",
    image: "/og/invitacion.jpg",
  },
  participacion: {
    title: "Participación de matrimonio — Norida & Agustín",
    description:
      "¡Nos casamos! Con la bendición de Dios y nuestros padres, queremos compartir contigo la alegría de este día. 27 de diciembre de 2026.",
    image: "/og/participacion.jpg",
  },
  asesoras: {
    title: "Gabriela y Valentina, asesoras de outfits — Boda Norida & Agustín",
    description: "¿No sabes qué ponerte para la boda? Pregúntale a nuestras asesoras de outfits.",
    image: "/og/invitacion.jpg",
  },
} as const;

/** Metadatos Open Graph / Twitter para la vista previa de WhatsApp. */
export function ogMetadata(kind: keyof typeof OG, opts: { path: string; title?: string; description?: string; pageTitle?: string }): Metadata {
  const o = OG[kind];
  const title = opts.title ?? o.title;
  const description = opts.description ?? o.description;
  const image = { url: o.image, width: 1200, height: 630, alt: "Norida & Agustín — 27 de diciembre de 2026", type: "image/jpeg" };
  return {
    title: opts.pageTitle ?? title,
    description,
    alternates: { canonical: opts.path },
    openGraph: {
      type: "website",
      locale: "es_CO",
      siteName: "Boda Norida & Agustín",
      url: opts.path,
      title,
      description,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [o.image] },
  };
}
