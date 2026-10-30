import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  poweredByHeader: false,
  async redirects() {
    // Un solo dominio canónico: www y la URL de workers.dev llevan a noridayagustin.com.
    return ["www.noridayagustin.com", "nori-tico-wedding.lc-45e.workers.dev"].map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://noridayagustin.com/:path*",
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        // Sitio privado: nada se indexa en buscadores.
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" }],
      },
    ];
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
