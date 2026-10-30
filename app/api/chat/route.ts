import { getCloudflareContext } from "@opennextjs/cloudflare";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { advisorsSystemPrompt } from "@/lib/advisors";
import { readAiStream } from "@/lib/sse";

type Msg = { role: "user" | "assistant"; content: string };

const MAX_HISTORY = 12;
const MAX_CHARS = 600;
// Mistral Small 3.1: entiende texto e imágenes, buen español y respeta el formato de marcadores.
const DEFAULT_MODEL = "@cf/mistralai/mistral-small-3.1-24b-instruct";
// La foto llega ya optimizada desde el navegador (JPEG ~1024 px); este es el tope del data URL.
const MAX_IMAGE_CHARS = 1_600_000;

export async function POST(req: Request) {
  let body: { messages?: unknown; sessionId?: unknown; code?: unknown; image?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const messages: Msg[] = Array.isArray(body.messages)
    ? body.messages
        .filter(
          (m): m is Msg =>
            !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0,
        )
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS * 3) }))
    : [];
  const last = messages.at(-1);
  if (!last || last.role !== "user") return Response.json({ error: "Escribe tu pregunta" }, { status: 400 });
  last.content = last.content.slice(0, MAX_CHARS);

  let image: string | null = null;
  if (typeof body.image === "string" && body.image) {
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(body.image) || body.image.length > MAX_IMAGE_CHARS) {
      return Response.json({ error: "La foto no es válida o es muy pesada. Intenta con otra." }, { status: 400 });
    }
    image = body.image;
  }

  const sessionId = typeof body.sessionId === "string" && /^[a-z0-9-]{8,64}$/i.test(body.sessionId) ? body.sessionId : null;
  const code = typeof body.code === "string" && body.code.length <= 64 ? body.code : null;

  const { env, ctx } = await getCloudflareContext({ async: true });
  const db = drizzle(env.DB, { schema });
  const invitation = code ? await db.query.invitations.findFirst({ where: eq(schema.invitations.code, code) }) : undefined;

  const history = messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
  const userTurn = image
    ? { role: "user", content: [{ type: "text", text: last.content }, { type: "image_url", image_url: { url: image } }] }
    : { role: "user", content: last.content };

  const ai = env.AI as unknown as { run(model: string, input: unknown): Promise<unknown> };
  let stream: ReadableStream<Uint8Array>;
  try {
    stream = (await ai.run(env.AI_MODEL || DEFAULT_MODEL, {
      messages: [{ role: "system", content: advisorsSystemPrompt(invitation?.name, !!image) }, ...history, userTurn],
      stream: true,
      max_tokens: 700,
      temperature: 0.6,
    })) as ReadableStream<Uint8Array>;
  } catch (e) {
    console.error("workers-ai", e);
    return Response.json({ error: "Las asesoras están ocupadas, intenta en un momento." }, { status: 503 });
  }

  const [toClient, toLog] = stream.tee();

  if (sessionId) {
    // La foto no se guarda: solo queda constancia en el texto de la conversación.
    const logged = image ? `📷 [Foto de outfit] ${last.content}` : last.content;
    ctx.waitUntil(
      (async () => {
        let answer = "";
        await readAiStream(toLog, (t) => (answer += t));
        const [{ n }] = await db.select({ n: count() }).from(schema.chatMessages).where(eq(schema.chatMessages.sessionId, sessionId));
        await db.insert(schema.chatMessages).values([
          { sessionId, invitationId: invitation?.id ?? null, role: "user", content: logged },
          { sessionId, invitationId: invitation?.id ?? null, role: "assistant", content: answer.trim() || "(sin respuesta)" },
        ]);
        if (n === 0 && invitation) {
          await db.insert(schema.activities).values({
            invitationId: invitation.id,
            type: "chat",
            author: invitation.name,
            body: `Consultó a las asesoras de outfits: “${logged.slice(0, 160)}”`,
          });
        }
      })().catch((e) => console.error("chat-log", e)),
    );
  } else {
    ctx.waitUntil(toLog.cancel());
  }

  return new Response(toClient, {
    headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform" },
  });
}
