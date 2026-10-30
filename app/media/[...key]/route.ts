import { getCloudflareContext } from "@opennextjs/cloudflare";

// Archivos pesados (videos) servidos desde R2 con soporte de Range para adelantar y retroceder.
type Params = Promise<{ key: string[] }>;

async function serve(req: Request, params: Params, head = false) {
  const { key } = await params;
  const name = key.join("/");
  if (!/^[a-z0-9][a-z0-9._/-]*$/i.test(name) || name.includes("..")) return new Response("No encontrado", { status: 404 });
  const { env } = await getCloudflareContext({ async: true });
  const download = new URL(req.url).searchParams.has("descargar");

  const meta = await env.MEDIA.head(name);
  if (!meta) return new Response("No encontrado", { status: 404 });
  const size = meta.size;

  const headers = new Headers();
  meta.writeHttpMetadata(headers);
  headers.set("accept-ranges", "bytes");
  headers.set("etag", meta.httpEtag);
  headers.set("cache-control", "public, max-age=86400");
  headers.set("x-robots-tag", "noindex, nofollow");
  if (download) headers.set("content-disposition", `attachment; filename="${name.split("/").pop()}"`);

  const range = req.headers.get("range");
  const m = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (m && (m[1] || m[2])) {
    let start = m[1] ? Number(m[1]) : size - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    headers.set("content-range", `bytes ${start}-${end}/${size}`);
    headers.set("content-length", String(end - start + 1));
    if (head) return new Response(null, { status: 206, headers });
    const obj = await env.MEDIA.get(name, { range: { offset: start, length: end - start + 1 } });
    return new Response(obj?.body ?? null, { status: 206, headers });
  }

  headers.set("content-length", String(size));
  if (head) return new Response(null, { status: 200, headers });
  const obj = await env.MEDIA.get(name);
  return new Response(obj?.body ?? null, { status: 200, headers });
}

export async function GET(req: Request, { params }: { params: Params }) {
  return serve(req, params);
}

export async function HEAD(req: Request, { params }: { params: Params }) {
  return serve(req, params, true);
}
