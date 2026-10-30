import type { Metadata } from "next";
import { InvitationPage } from "@/components/invitation/InvitationPage";
import { ogMetadata } from "@/lib/og";
import "../invitation.css";

export const metadata: Metadata = ogMetadata("participacion", { path: "/participacion" });

export default function Participacion() {
  return <InvitationPage mode="participacion" />;
}
