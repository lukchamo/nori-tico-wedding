import { headers } from "next/headers";
import { FALLBACK_SITE_URL } from "./config";

/** URL pública del sitio según el host de la petición (sirve igual en workers.dev o en un dominio propio). */
export async function siteUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host && !host.startsWith("localhost") && !host.startsWith("127.")) {
      const proto = h.get("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`;
    }
    if (host) return `http://${host}`;
  } catch {}
  return process.env.SITE_URL || FALLBACK_SITE_URL;
}
