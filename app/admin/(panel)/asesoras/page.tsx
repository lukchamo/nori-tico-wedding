import { ChatTranscript } from "@/components/admin/ChatTranscript";
import Link from "next/link";
import { fmtDateTime, fmtRelative } from "@/lib/format";
import { getChatSessions } from "@/lib/invitations";

export default async function AsesorasAdmin() {
  const sessions = await getChatSessions();
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Asesoras IA</h1>
          <p>Conversaciones de los invitados con “Gabriela y Valentina, asesoras de outfits” (Workers AI).</p>
        </div>
        <a className="adm-btn" href="/asesoras" target="_blank" rel="noopener">
          Probar el chat
        </a>
      </div>
      {sessions.length ? (
        <div className="adm-grid">
          {sessions.map((s) => (
            <section key={s.sessionId} className="adm-card">
              <details className="adm-details">
                <summary className="adm-card-title" style={{ marginBottom: 0 }}>
                  <div>
                    <h2>
                      {s.invitationId ? (
                        <Link href={`/admin/invitados/${s.invitationId}`}>{s.invitationName ?? "Invitado"}</Link>
                      ) : (
                        "Visitante sin enlace personal"
                      )}
                    </h2>
                    <div className="adm-subtle" style={{ marginTop: 2 }}>
                      “{s.transcript.find((m) => m.role === "user")?.content.slice(0, 120)}”
                    </div>
                  </div>
                  <span className="adm-subtle" title={fmtDateTime(s.lastAt)} style={{ whiteSpace: "nowrap" }}>
                    {Math.ceil(Number(s.messages) / 2)} preguntas · {fmtRelative(Number(s.lastAt))}
                  </span>
                </summary>
                <div style={{ marginTop: 12 }}>
<ChatTranscript messages={s.transcript} />
</div>
              </details>
            </section>
          ))}
        </div>
      ) : (
        <section className="adm-card">
          <div className="adm-empty">Aún nadie ha conversado con las asesoras.</div>
        </section>
      )}
    </>
  );
}
