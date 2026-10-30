import Link from "next/link";
import "./invitation.css";

export default function NotFound() {
  return (
    <div className="inv-root">
      <div className="inv-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <div className="script" style={{ fontSize: 44, color: "#4B5A2F" }}>
            Norida &amp; Agustín
          </div>
          <p className="serif" style={{ fontSize: 18, color: "#3A3F2E", fontStyle: "italic" }}>
            No encontramos esta invitación. Revisa el enlace que te enviamos.
          </p>
          <Link href="/" className="inv-btn-solid">
            Ver la invitación
          </Link>
        </div>
      </div>
    </div>
  );
}
