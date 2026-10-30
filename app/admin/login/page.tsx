import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PinPad } from "@/components/admin/PinPad";
import { isAdmin } from "@/lib/auth";
import "../admin.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Backoffice · Norida & Agustín" };

export default async function Login() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="adm">
      <div className="adm-login">
        <div className="adm-login-card">
          <div className="mono">N&amp;A</div>
          <h1 className="adm-serif" style={{ fontSize: 20, fontWeight: 500, marginTop: 8 }}>
            Backoffice de invitados
          </h1>
          <p>Ingresa el PIN de 4 dígitos</p>
          <PinPad />
        </div>
      </div>
    </div>
  );
}
