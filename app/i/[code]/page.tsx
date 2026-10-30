import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationPage } from "@/components/invitation/InvitationPage";
import { getPublicInvitation } from "@/lib/invitations";
import { ogMetadata } from "@/lib/og";
import "../../invitation.css";

export const dynamic = "force-dynamic";

type Params = Promise<{ code: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { code } = await params;
  const inv = await getPublicInvitation(code);
  return ogMetadata("invitacion", {
    path: `/i/${code}`,
    pageTitle: inv ? `${inv.name} · Invitación de boda — Norida & Agustín` : "Invitación de boda — Norida & Agustín",
    title: inv ? `${inv.name}, nos casamos — Norida & Agustín` : undefined,
  });
}

export default async function PersonalInvitation({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { code } = await params;
  const sp = await searchParams;
  const inv = await getPublicInvitation(code);
  if (!inv) notFound();
  return <InvitationPage mode="invitacion" invitation={inv} preview={sp.preview === "1"} />;
}
