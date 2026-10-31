import { submitMessage } from "@/lib/invitations";

const ERRORS: Record<string, string> = {
  "Falta el mensaje": "Escribe tu mensaje.",
  "Falta el nombre": "Escribe tu nombre.",
  "Invitación no encontrada": "No encontramos tu invitación.",
};

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  try {
    await submitMessage({ code: str(body.code), name: str(body.name), message: str(body.message) });
    return Response.json({ ok: true });
  } catch (e) {
    const reason = e instanceof Error ? e.message : "";
    return Response.json({ error: ERRORS[reason] ?? "No pudimos enviar tu mensaje." }, { status: 400 });
  }
}
