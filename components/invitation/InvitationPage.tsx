import { WEDDING } from "@/lib/config";
import type { PublicInvitation } from "@/lib/invitations";
import { CountdownBoxes, StickyDays } from "./Countdown";
import { Cover } from "./Cover";
import { DressCodeSwatches } from "./DressCode";
import { FxLink } from "./FxLink";
import { GiftEnvelope } from "./Gift";
import { MessageBox } from "./MessageBox";
import { MusicButton } from "./Music";
import { GiftIcon, HeartDot, HeartOutline, SmallSprig, Sprig } from "./Ornaments";
import { Rsvp } from "./Rsvp";

type Props = {
  mode: "invitacion" | "participacion";
  invitation?: PublicInvitation | null;
  legacyName?: string | null;
  legacySeats?: number | null;
  /** Vista previa desde el backoffice: no cuenta como apertura. */
  preview?: boolean;
};

export function InvitationPage({ mode, invitation = null, legacyName, legacySeats, preview }: Props) {
  const full = mode === "invitacion";
  const guestName = invitation?.name ?? legacyName ?? null;
  const advisorsHref = invitation ? `/asesoras?i=${encodeURIComponent(invitation.code)}` : "/asesoras";

  return (
    <div className="inv-root">
      <DesktopAside mode={mode} guestName={guestName} />
      <div className="inv-card">
        <MusicButton />
        <Cover mode={mode} guestName={guestName} trackCode={invitation && !preview ? invitation.code : null} />

        <div className="inv-content">
          <Hero mode={mode} />
          <Quote />
          <Story />

          <div className="inv-countdown-wrap" id="ceremonia">
            <div className="inv-countdown">
              <Sprig variant="dark" />
              <div className="script inv-countdown-title">Falta poco</div>
              <div className="inv-countdown-sub">para celebrar nuestro amor</div>
              <CountdownBoxes />
            </div>
            <StickyDays />
            <Ceremony withDirections={full} />
          </div>

          {full ? (
            <>
              <Reception />
              <Itinerary />
              <div className="inv-screen inv-dress" id="vestimenta">
                <Sprig variant="dark" />
                <div className="inv-dress-eyebrow">Código de vestimenta</div>
                <div className="script inv-dress-title">{WEDDING.dressCode}</div>
                <div className="inv-dress-note">Es una boda de día: te sugerimos colores frescos y luminosos, ideales para celebrar en el día.</div>
                <DressCodeSwatches advisorsHref={advisorsHref} />
                <div className="inv-dress-reserve">Nos reservamos el blanco y el marfil.</div>
              </div>

              <div className="inv-confirm" id="confirmar">
                <Sprig />
                <div className="script inv-confirm-title">Confirma tu asistencia</div>
                <div className="inv-confirm-lead">
                  {guestName ? `${guestName}, nos` : "Nos"} encantaría contar contigo en un día tan especial para nosotros.
                </div>
                <Rsvp invitation={invitation} legacyName={legacyName} legacySeats={legacySeats} />
                <Calendar />
                <FxLink href={WEDDING.calendarUrl} target="_blank" rel="noopener" className="inv-gcal">
                  Agendar en Google Calendar
                </FxLink>
                <SmallSprig />
              </div>

              <div className="inv-screen inv-gift" id="regalo">
                <div className="inv-gift-inner">
                  <Sprig />
                  <GiftIcon />
                  <div className="inv-eyebrow" style={{ marginTop: 4 }}>
                    Regalo
                  </div>
                  <div className="script inv-gift-title">Lluvia de sobres</div>
                  <div className="serif inv-gift-lead">
                    Tu presencia es el mejor regalo, pero si deseas hacernos un detalle para nuestro nuevo hogar y luna de miel, aquí puedes contribuir con nuestra lluvia de sobres.
                  </div>
                  <GiftEnvelope />
                  <SmallSprig />
                </div>
              </div>
            </>
          ) : (
            // Participación: sin itinerario ni confirmación; solo un mensaje para los novios.
            <div className="inv-confirm" id="mensaje">
              <Sprig />
              <div className="script inv-confirm-title">Un mensaje para los novios</div>
              <div className="inv-confirm-lead">{guestName ? `${guestName}, si` : "Si"} quieres, escríbenos unas palabras: nos encantará leerlas.</div>
              <MessageBox invitation={invitation} />
              <SmallSprig />
            </div>
          )}

          <Footer />
        </div>
      </div>
    </div>
  );
}

const ASIDE_LINKS = {
  invitacion: [
    ["#historia", "Nuestra historia"],
    ["#ceremonia", "Ceremonia"],
    ["#recepcion", "Recepción"],
    ["#itinerario", "Itinerario"],
    ["#vestimenta", "Vestimenta"],
    ["#regalo", "Regalo"],
  ],
  participacion: [
    ["#historia", "Nuestra historia"],
    ["#ceremonia", "Ceremonia"],
    ["#mensaje", "Mensaje para los novios"],
  ],
} as const;

/** Panel fijo de la vista de escritorio (oculto en móvil). */
function DesktopAside({ mode, guestName }: { mode: Props["mode"]; guestName: string | null }) {
  const eyebrow =
    mode === "participacion"
      ? guestName
        ? `Participación para ${guestName}`
        : "Participación de matrimonio"
      : guestName
        ? `Invitación para ${guestName}`
        : "Nos casamos";
  return (
    <aside className="inv-aside" aria-label="Resumen de la boda">
      <div className="inv-aside-bg" />
      <div className="inv-aside-inner">
        <Sprig variant="photo" className="inv-aside-sprig" />
        <div className="display inv-aside-eyebrow">{eyebrow}</div>
        <div className="script inv-aside-names">Norida &amp; Agustín</div>
        <div className="inv-heart-rule">
          <div />
          <HeartOutline size={18} />
          <div />
        </div>
        <div className="display inv-aside-date">27 · 12 · 2026</div>
        <div className="serif inv-aside-place">
          Domingo 27 de diciembre · {WEDDING.ceremony.time}
          <br />
          {WEDDING.ceremony.place}
        </div>
        <CountdownBoxes className="inv-count-boxes inv-aside-count" />
        <nav className="inv-aside-nav serif" aria-label="Secciones de la invitación">
          {ASIDE_LINKS[mode].map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        {mode === "invitacion" ? (
          <FxLink href="#confirmar" className="inv-aside-cta">
            Confirmar asistencia
          </FxLink>
        ) : (
          <FxLink href="#mensaje" className="inv-aside-cta">
            Enviar un mensaje
          </FxLink>
        )}
        <div className="serif inv-aside-hint">Desliza la tarjeta para ver toda la invitación →</div>
      </div>
    </aside>
  );
}

function Hero({ mode }: { mode: Props["mode"] }) {
  return (
    <div className="inv-screen inv-hero serif">
      <Sprig />
      {mode === "participacion" ? <div className="inv-badge display">Tarjeta de Participación</div> : null}
      <div className="inv-hero-blessing" style={mode === "participacion" ? { marginTop: 4 } : undefined}>
        Con la bendición de Dios y nuestros padres
      </div>
      <h1 className="script inv-hero-names" style={{ fontWeight: 400, marginBottom: 0 }}>
        Norida &amp; Agustín
      </h1>
      <div className="inv-heart-rule">
        <div />
        <HeartOutline />
        <div />
      </div>
      <div className="inv-hero-lead">
        {mode === "participacion"
          ? "¡Nos casamos y queremos compartir contigo la alegría de este día!"
          : "¡Nos casamos y queremos celebrarlo junto a quienes más amamos!"}
      </div>
      <div className="script inv-save">Save the date</div>
      <div className="inv-date-boxes display">
        <div>27</div>
        <div>12</div>
        <div>2026</div>
      </div>
      <SmallSprig />
    </div>
  );
}

function Quote() {
  return (
    <div className="inv-screen inv-quote">
      <div className="inv-quote-bg" />
      <div className="inv-quote-shade" />
      <div className="inv-quote-inner">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Sprig variant="photo" />
          <div style={{ marginTop: 16 }}>
            <div className="script inv-quote-mark">“</div>
            <div className="serif inv-quote-text">Así que no son ya más dos, sino una sola carne; por tanto, lo que Dios juntó, no lo separe el hombre.</div>
          </div>
        </div>
        <div className="inv-quote-ref">Mateo 19, 6</div>
      </div>
    </div>
  );
}

function Year({ children }: { children: string }) {
  return <span className="inv-year">{children}</span>;
}

function Divider({ margin }: { margin?: string }) {
  return (
    <div className="inv-divider" style={margin ? { margin } : undefined}>
      <div />
      <span>❈</span>
      <div />
    </div>
  );
}

function Story() {
  return (
    <div className="inv-story" id="historia">
      <Sprig className="inv-sprig" />
      <div className="inv-eyebrow" style={{ marginTop: 14 }}>
        Nuestra historia
      </div>
      <div className="script inv-story-title">Así empezó todo</div>

      <div className="inv-story-card">
        <div className="script inv-story-mark">“</div>
        <div className="serif inv-story-p">
          <Year>2016</Year> — 🏖️ En un paseo a la playa se cruzaron nuestros caminos. Ninguno de los dos sabía en lo que se estaba metiendo.
          <br />
          <br />
          ✈️ Y ahí mismo empezó la aventura: Santa Marta, Cartagena, el Tayrona, Medellín, San Andrés, Pereira, Quindío… parapente, cable vuelo, montañas rusas y lo que se atravesara. Maletas siempre listas.
          <br />
          <br />
          💭 Desde el primer momento, él ya sabía que ella sería su esposa. Ella tardó un poquito más en darse cuenta… pero llegó.
        </div>

        <Divider margin="16px 0" />

        <div className="serif inv-story-p">
          <Year>2019</Year> — 💍 Nos comprometimos y empezamos a planear la boda… pero la vida ya tenía otros planes para nosotros. 🤰 Meses después, quedamos embarazados, y en <Year>2020</Year> nació, en plena pandemia, nuestra Gabriela Lucía.
        </div>

        <div className="script inv-story-line" style={{ fontSize: 21, margin: "18px 0 0" }}>
          El amor definitivamente no se puso en cuarentena.
        </div>

        <Divider />

        <div className="serif inv-story-p">
          🏡 Empezamos a construir un hogar para tres, y entre pañales retomamos (otra vez) los planes de boda… pero en <Year>2022</Year>, ¡upssss!! quedamos embarazados… otra vez. Y así llegó nuestra pequeña Valentina Sofía.
        </div>

        <div className="script inv-story-line" style={{ fontSize: 20, margin: "18px 0" }}>
          El amor no se divide, se multiplica.
        </div>

        <div className="serif inv-story-p">
          🙏 En <Year>2024</Year> llegó lo más importante de nuestro hogar: Dios. Ahí supimos que teníamos una cita pendiente con Él.
        </div>

        <Divider margin="18px 0 16px" />

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#C9A961", fontWeight: 700 }}>2026 · Hoy la estamos cumpliendo</div>
          <div className="serif" style={{ fontSize: 14, color: "#3A3F2E", lineHeight: 1.5, marginTop: 8 }}>
            💒 El día en que serás parte de nuestra mayor muestra de amor: la Bendición de nuestro hogar.
          </div>
          <div className="script" style={{ fontSize: 24, color: "#4B5A2F", marginTop: 10 }}>
            Porque apenas estamos comenzando...
          </div>
        </div>
      </div>
    </div>
  );
}

function Ceremony({ withDirections }: { withDirections: boolean }) {
  return (
    <div className="inv-ceremony">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FBF9F2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v4M9 6h6M6 21V10l6-4 6 4v11M6 21h12M10 21v-5h4v5" />
      </svg>
      <div className="inv-ceremony-eyebrow">Ceremonia religiosa</div>
      <div className="script inv-ceremony-place">{WEDDING.ceremony.place}</div>
      <div className="serif inv-ceremony-time">{WEDDING.ceremony.time}</div>
      <div className="inv-ceremony-note">Ceremonia católica, íntima entre familia y amigos cercanos. Tu compañía en este momento es lo más importante para nosotros.</div>
      {withDirections ? (
        <FxLink href={WEDDING.ceremony.mapsUrl} target="_blank" rel="noopener" className="inv-btn-outline-light">
          Cómo llegar
        </FxLink>
      ) : null}
    </div>
  );
}

function Reception() {
  return (
    <div className="inv-screen inv-reception" id="recepcion">
      <Sprig />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/icono-brindis.png" width={30} height={30} alt="Recepción" style={{ display: "block" }} />
      <div className="inv-eyebrow" style={{ marginTop: 4 }}>
        Recepción
      </div>
      <div className="script inv-reception-place">{WEDDING.reception.place}</div>
      <div className="serif inv-reception-time">{WEDDING.reception.time}</div>

      <a href={WEDDING.reception.mapsUrl} target="_blank" rel="noopener" className="inv-map-card">
        <div className="inv-map-art">
          <svg width="100%" height="100%" viewBox="0 0 280 130" preserveAspectRatio="none" style={{ display: "block" }} aria-hidden="true">
            <rect width="280" height="130" fill="#F2EEDD" />
            <path d="M-20 150 L300 -20" stroke="#6E7C4D" strokeWidth="9" opacity="0.18" />
            <path d="M-20 90 L180 -20" stroke="#6E7C4D" strokeWidth="5" opacity="0.14" />
            <path d="M60 150 L320 30" stroke="#6E7C4D" strokeWidth="5" opacity="0.14" />
          </svg>
          <div className="inv-map-pin">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#4B5A2F" aria-hidden="true">
              <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
              <circle cx="12" cy="9" r="3" fill="#FBF9F2" />
            </svg>
          </div>
        </div>
        <div className="inv-map-foot">
          <div>
            <div className="display">{WEDDING.reception.place}</div>
            <small>Ver ubicación en Google Maps</small>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4B5A2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </a>

      <FxLink href={WEDDING.reception.mapsUrl} target="_blank" rel="noopener" className="inv-btn-solid">
        Cómo llegar
      </FxLink>
      <SmallSprig />
    </div>
  );
}

const ICON_STROKE = { fill: "none", stroke: "#4B5A2F", strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ITINERARY_ICONS: React.ReactNode[] = [
  // eslint-disable-next-line @next/next/no-img-element
  <img key="i" src="/assets/icono-iglesia.png" width={42} height={42} alt="" style={{ display: "block" }} />,
  <svg key="p" width="42" height="42" viewBox="0 0 24 24" {...ICON_STROKE} aria-hidden="true">
    <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
    <circle cx="12" cy="9" r="2.3" />
  </svg>,
  // eslint-disable-next-line @next/next/no-img-element
  <img key="e" src="/assets/icono-entrada-novios.png" width={42} height={42} alt="" style={{ display: "block" }} />,
  // eslint-disable-next-line @next/next/no-img-element
  <img key="b" src="/assets/icono-primer-baile.png" width={42} height={42} alt="" style={{ display: "block" }} />,
  // eslint-disable-next-line @next/next/no-img-element
  <img key="br" src="/assets/icono-brindis.png" width={42} height={42} alt="" style={{ display: "block" }} />,
  // eslint-disable-next-line @next/next/no-img-element
  <img key="a" src="/assets/icono-almuerzo.png" width={42} height={42} alt="" style={{ display: "block" }} />,
  <svg key="f" width="42" height="42" viewBox="0 0 24 24" {...ICON_STROKE} aria-hidden="true">
    <path d="M4 8h3l2-2h6l2 2h3v11H4z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </svg>,
  // eslint-disable-next-line @next/next/no-img-element
  <img key="pa" src="/assets/icono-pista-abierta.png" width={42} height={42} alt="" style={{ display: "block" }} />,
  <svg key="h" width="42" height="42" viewBox="0 0 24 24" {...ICON_STROKE} aria-hidden="true">
    <path d="M12 21s-8-4.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-8 11-8 11z" />
  </svg>,
];

function Itinerary() {
  return (
    <div className="inv-itinerary" id="itinerario">
      <Sprig />
      <div className="script inv-itinerary-title">Itinerario</div>
      <div className="inv-timeline">
        <div className="inv-timeline-line" />
        {WEDDING.itinerary.map((step, i) => {
          const text = (
            <div className={i % 2 === 0 ? "inv-step-text-r" : "inv-step-text-l"}>
              <div className="serif inv-step-time">{step.time}</div>
              <div className="inv-step-label">{step.label}</div>
            </div>
          );
          const icon = <div className={i % 2 === 0 ? "inv-step-icon-l" : "inv-step-icon-r"}>{ITINERARY_ICONS[i]}</div>;
          return (
            <div key={step.time} className="inv-step">
              {i % 2 === 0 ? icon : text}
              <div className="inv-step-dot">
                <HeartDot />
              </div>
              {i % 2 === 0 ? text : icon}
            </div>
          );
        })}
      </div>
      <div className="inv-itinerary-thanks">Gracias por acompañarnos cada minuto de este día</div>
    </div>
  );
}

function Calendar() {
  const days: (number | null)[] = [null, ...Array.from({ length: 31 }, (_, i) => i + 1), null, null];
  return (
    <div className="inv-calendar">
      <div className="script inv-calendar-title">Diciembre 2026</div>
      <div className="inv-calendar-dow">
        {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="inv-calendar-days">
        {days.map((d, i) => (d === 27 ? <div key={i} className="inv-calendar-mark">27</div> : <div key={i}>{d ?? ""}</div>))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="inv-screen inv-footer">
      <Sprig variant="dark" />
      <div className="inv-monogram">
        <span className="script">N</span>
        <span className="display">&amp;</span>
        <span className="script">A</span>
      </div>
      <div className="serif inv-footer-love">Con todo nuestro amor,</div>
      <div className="display inv-footer-names">Norida &amp; Agustín</div>
      <div className="inv-footer-date">27 DE DICIEMBRE DE 2026</div>
    </div>
  );
}
