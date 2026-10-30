import { submitRsvp } from "@/lib/invitations";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const status = body.status === "yes" || body.status === "no" ? body.status : null;
  if (!status) return Response.json({ error: "Respuesta inválida" }, { status: 400 });
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  const guestIds = Array.isArray(body.guestIds) ? body.guestIds.filter((n): n is number => Number.isInteger(n)).slice(0, 20) : null;
  try {
    const result = await submitRsvp({
      code: str(body.code),
      name: str(body.name),
      phone: str(body.phone),
      status,
      attending: typeof body.attending === "number" ? Math.round(body.attending) : null,
      guestIds,
      message: str(body.message),
    });
    return Response.json({ ok: true, attending: result.attending });
  } catch (e) {
    const msg = e instanceof Error && e.message === "Falta el nombre" ? "Escribe tu nombre." : "No pudimos guardar tu respuesta.";
    return Response.json({ error: msg }, { status: 400 });
  }
}
