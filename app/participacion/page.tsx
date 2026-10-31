import type { Metadata } from "next";
import { InvitationPage } from "@/components/invitation/InvitationPage";
import { getPublicInvitation, type PublicInvitation } from "@/lib/invitations";
import { ogMetadata } from "@/lib/og";
import "../invitation.css";

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
  const inv = await load(codeOf((await searchParams).i));
  return ogMetadata("participacion", {
    path: inv ? `/participacion?i=${inv.code}` : "/participacion",
    pageTitle: inv ? `${inv.name} · Participación de matrimonio — Norida & Agustín` : undefined,
    title: inv ? `${inv.name}, nos casamos — Norida & Agustín` : undefined,
  });
}

/** Tarjeta de participación: informa la boda, sin itinerario ni confirmación; solo deja enviar un mensaje. `?i=código` la personaliza. */
export default async function Participacion({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const invitation = await load(codeOf(sp.i));
  return <InvitationPage mode="participacion" invitation={invitation} preview={sp.preview === "1"} />;
}
