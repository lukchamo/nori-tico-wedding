import type { ChatMessage } from "@/db/schema";
import { parseAdvisorReply } from "@/lib/advisors";
import { LOOK_BY_ID } from "@/lib/lookbook";

/** Conversación con las asesoras: texto limpio y los looks que se mostraron en el carrusel. */
export function ChatTranscript({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="adm-chat">
      {messages.map((m) => {
        if (m.role === "user") {
          return (
            <div key={m.id} className="m user">
              {m.content}
            </div>
          );
        }
        const { text, looks } = parseAdvisorReply(m.content);
        const titles = looks.map((id) => LOOK_BY_ID.get(id)?.title).filter(Boolean);
        return (
          <div key={m.id} className="m assistant">
            {text}
            {titles.length ? (
              <div style={{ marginTop: 6 }}>
                {titles.map((t) => (
                  <span key={t} className="adm-tag">
                    👗 {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
