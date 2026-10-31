import type { Metadata } from "next";
import { StoryPage } from "@/components/historia/StoryPage";
import { legacyInvite } from "@/lib/format";
import { getPublicInvitation, type PublicInvitation } from "@/lib/invitations";
import { ogMetadata } from "@/lib/og";
import "../invitation.css";
import "./historia.css";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

const codeOf = (v: string | string[] | undefined) => (typeof v === "string" && /^[\w-]{1,64}$/.test(v) ? v : null);

async function load(code: string | null): Promise<PublicInvitation | null> {
  if (!code) return null;
  try {
    return await getPublicInvitation(code);
  } catch {
    return null;
  }
}

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const sp = await searchParams;
  const code = codeOf(sp.i);
  const inv = await load(code);
  const name = inv?.name ?? legacyInvite(sp).name;
  return ogMetadata("invitacion", {
    path: inv ? `/historia?i=${inv.code}` : "/historia",
    pageTitle: name ? `${name} · Nuestra historia — Norida & Agustín` : "Nuestra historia — Norida & Agustín",
    title: name ? `${name}, recorre nuestra historia — Norida & Agustín` : "Dos caminos, una sola historia — Norida & Agustín",
    description: "Diez años, dos caminos y una historia que apenas está comenzando. Recórrela con nosotros y confirma tu asistencia. 27 de diciembre de 2026.",
  });
}

/**
 * Versión 2 de la invitación: la historia de Norida y Agustín contada con scroll.
 * `?i=código` la personaliza con la invitación registrada; sin código acepta, como la clásica,
 * `?nombre=…&cupos=…` (o nada: enlace general, el cupo se confirma al responder).
 */
export default async function Historia({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const invitation = await load(codeOf(sp.i));
  const legacy = invitation ? { name: null, seats: null } : legacyInvite(sp);
  return <StoryPage invitation={invitation} legacyName={legacy.name} legacySeats={legacy.seats} preview={sp.preview === "1"} />;
}
