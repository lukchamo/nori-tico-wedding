import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { loginAttempts } from "@/db/schema";
import { getDb, getEnv } from "./db";

const COOKIE = "nt_admin";
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

async function sessionToken(pin: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(`nt-admin:${pin}`), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("nori-tico-backoffice-v1"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function configuredPin(): Promise<string | null> {
  const env = await getEnv();
  return env.ADMIN_PASSWORD?.trim() || null;
}

export async function isAdmin(): Promise<boolean> {
  const pin = await configuredPin();
  if (!pin) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  return !!value && safeEqual(value, await sessionToken(pin));
}

/** Para páginas y server actions del backoffice. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

async function clientIp() {
  const h = await headers();
  return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginWithPin(input: string): Promise<LoginResult> {
  const pin = await configuredPin();
  if (!pin) return { ok: false, error: "El PIN del backoffice no está configurado." };

  const db = await getDb();
  const ip = await clientIp();
  const now = Date.now();
  const row = await db.query.loginAttempts.findFirst({ where: eq(loginAttempts.ip, ip) });
  if (row?.lockedUntil && row.lockedUntil > now) {
    const min = Math.ceil((row.lockedUntil - now) / 60000);
    return { ok: false, error: `Demasiados intentos. Intenta de nuevo en ${min} min.` };
  }

  if (safeEqual(input.trim(), pin)) {
    if (row) await db.delete(loginAttempts).where(eq(loginAttempts.ip, ip));
    (await cookies()).set(COOKIE, await sessionToken(pin), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return { ok: true };
  }

  const fresh = !row || now - row.windowStart > WINDOW_MS;
  const fails = fresh ? 1 : row.fails + 1;
  const lockedUntil = fails >= MAX_FAILS ? now + LOCK_MS : null;
  await db
    .insert(loginAttempts)
    .values({ ip, fails, windowStart: fresh ? now : row!.windowStart, lockedUntil })
    .onConflictDoUpdate({
      target: loginAttempts.ip,
      set: { fails, windowStart: fresh ? now : row!.windowStart, lockedUntil },
    });
  const left = MAX_FAILS - fails;
  return {
    ok: false,
    error: lockedUntil ? "Demasiados intentos. Espera 15 minutos." : `PIN incorrecto. Te quedan ${left} intento(s).`,
  };
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}
