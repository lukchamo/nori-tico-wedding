import type { Metadata } from "next";
import Link from "next/link";
import { NavLinks } from "@/components/admin/NavLinks";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";
import "../admin.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Backoffice · Norida & Agustín" };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-top-inner">
          <Link href="/admin" className="adm-brand">
            <span className="mono">N&amp;A</span>
            <small>Backoffice</small>
          </Link>
          <NavLinks />
          <form action={logoutAction}>
            <button type="submit">Salir</button>
          </form>
        </div>
      </header>
      <main className="adm-main">{children}</main>
    </div>
  );
}
