import type { Metadata } from "next";
import { AdvisorsChat } from "@/components/advisors/AdvisorsChat";
import { getPublicInvitation } from "@/lib/invitations";
import { ogMetadata } from "@/lib/og";
import "../invitation.css";
import "./chat.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = ogMetadata("asesoras", { path: "/asesoras" });

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function Asesoras({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const code = typeof sp.i === "string" ? sp.i : null;
  const inv = code ? await getPublicInvitation(code) : null;
  return (
    <AdvisorsChat
      code={inv?.code ?? null}
      guestName={inv?.name ?? null}
      backHref={inv ? `/i/${inv.code}` : "/"}
    />
  );
}
