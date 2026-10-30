import type { Metadata } from "next";
import { StoryPage } from "@/components/historia/StoryPage";
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
  const code = codeOf((await searchParams).i);
  const inv = await load(code);
  return ogMetadata("invitacion", {
    path: code ? `/historia?i=${code}` : "/historia",
    pageTitle: inv ? `${inv.name} · Nuestra historia — Norida & Agustín` : "Nuestra historia — Norida & Agustín",
    title: inv ? `${inv.name}, recorre nuestra historia — Norida & Agustín` : "Dos caminos, una sola historia — Norida & Agustín",
    description: "Diez años, dos caminos y una historia que apenas está comenzando. Recórrela con nosotros y confirma tu asistencia. 27 de diciembre de 2026.",
  });
}

/** Versión 2 de la invitación: la historia de Norida y Agustín contada con scroll. `?i=código` la personaliza. */
export default async function Historia({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const invitation = await load(codeOf(sp.i));
  return <StoryPage invitation={invitation} preview={sp.preview === "1"} />;
}
