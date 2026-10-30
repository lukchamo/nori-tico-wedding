import { trackOpen } from "@/lib/invitations";

export async function POST(req: Request) {
  try {
    const { code, event } = (await req.json()) as { code?: unknown; event?: unknown };
    if (typeof code === "string" && code.length <= 64 && (event === "view" || event === "envelope")) {
      await trackOpen(code, event);
    }
  } catch {}
  return new Response(null, { status: 204 });
}
