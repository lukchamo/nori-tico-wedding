import type { Metadata } from "next";
import { InvitationPage } from "@/components/invitation/InvitationPage";
import { legacyInvite } from "@/lib/format";
import { ogMetadata } from "@/lib/og";
import "./invitation.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = ogMetadata("invitacion", {
  path: "/",
  pageTitle: "Invitación de boda — Norida & Agustín",
});

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({ searchParams }: { searchParams: Search }) {
  // Compatibilidad con los enlaces antiguos: ?nombre=...&cupos=...
  const { name, seats } = legacyInvite(await searchParams);
  return <InvitationPage mode="invitacion" legacyName={name} legacySeats={seats} />;
}
