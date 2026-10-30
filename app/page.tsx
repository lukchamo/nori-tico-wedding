import type { Metadata } from "next";
import { InvitationPage } from "@/components/invitation/InvitationPage";
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
  const sp = await searchParams;
  const nombre = typeof sp.nombre === "string" ? sp.nombre.trim().slice(0, 80) || null : null;
  const cuposRaw = typeof sp.cupos === "string" ? parseInt(sp.cupos, 10) : NaN;
  const cupos = Number.isFinite(cuposRaw) && cuposRaw > 0 ? Math.min(cuposRaw, 20) : null;
  return <InvitationPage mode="invitacion" legacyName={nombre} legacySeats={cupos} />;
}
