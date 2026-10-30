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
    description:
      "¿No sabes qué ponerte para la boda? Mira el lookbook, pide ideas para combinar zapatos y accesorios o envía una foto de tu outfit y te decimos cómo se ve.",
    image: "/og/asesoras.jpg",
    alt: "Gabriela y Valentina, asesoras de outfits: lookbook y análisis de tu outfit",
  },
  backoffice: {
    title: "Backoffice de invitados — Boda Norida & Agustín",
    description: "Gestión privada de invitados: confirmaciones, envíos por WhatsApp y comentarios. Acceso con PIN.",
    image: "/og/backoffice.jpg",
    alt: "Backoffice de invitados de la boda de Norida & Agustín",
  },
} as const satisfies Record<string, { title: string; description: string; image: string; alt?: string }>;

/** Metadatos Open Graph / Twitter para la vista previa de WhatsApp. */
export function ogMetadata(kind: keyof typeof OG, opts: { path: string; title?: string; description?: string; pageTitle?: string }): Metadata {
  const o = OG[kind];
  const title = opts.title ?? o.title;
  const description = opts.description ?? o.description;
  const alt = "alt" in o ? o.alt : "Norida & Agustín — 27 de diciembre de 2026";
  const image = { url: o.image, width: 1200, height: 630, alt, type: "image/jpeg" };
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
