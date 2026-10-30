import type { Metadata } from "next";
import "./video.css";

const VIDEO = "/media/cooweb/reel-norida-agustin.mp4";
const VIDEO_WA = "/media/cooweb/reel-norida-agustin-whatsapp.mp4";

export const metadata: Metadata = {
  title: "Un regalo de CooWeb para Norida & Agustín",
  description: "¡Muchas felicitaciones! Un video con todo lo que pueden hacer con su invitación digital. Con mucho cariño, CooWeb 💛",
  alternates: { canonical: "/de-cooweb" },
  openGraph: {
    type: "video.other",
    locale: "es_CO",
    siteName: "Boda Norida & Agustín",
    url: "/de-cooweb",
    title: "Un regalo de CooWeb para Norida & Agustín 💛",
    description: "¡Muchas felicitaciones! Mira todo lo que pueden hacer con su invitación digital.",
    images: [{ url: "/og/de-cooweb.jpg", width: 1200, height: 630, alt: "Video de felicitación de CooWeb para Norida & Agustín", type: "image/jpeg" }],
    videos: [{ url: VIDEO, type: "video/mp4", width: 1080, height: 1920 }],
  },
  twitter: { card: "summary_large_image", images: ["/og/de-cooweb.jpg"] },
};

export default function DeCooWeb() {
  return (
    <main className="dc-root">
      <div className="dc-card">
        <div className="dc-kicker">Un regalo de CooWeb 💛</div>
        <h1 className="dc-title">Para Norida &amp; Agustín</h1>
        <p className="dc-lead">¡Muchas felicitaciones! Les preparamos este video con todo lo que pueden hacer con su invitación digital.</p>
        <div className="dc-player">
          <video src={VIDEO} poster="/og/de-cooweb-poster.jpg" controls playsInline preload="metadata" />
        </div>
        <div className="dc-actions">
          <a className="dc-btn primary" href={`${VIDEO_WA}?descargar`}>
            Descargar para WhatsApp
          </a>
          <a className="dc-btn" href={`${VIDEO}?descargar`}>
            Descargar en alta calidad
          </a>
        </div>
        <a className="dc-link" href="/">
          Ver la invitación →
        </a>
        <p className="dc-foot">
          Con mucho cariño, el equipo de <b>CooWeb</b>
        </p>
      </div>
    </main>
  );
}
