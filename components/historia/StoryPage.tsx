import { CountdownBoxes } from "@/components/invitation/Countdown";
import { DressCodeSwatches } from "@/components/invitation/DressCode";
import { FxLink } from "@/components/invitation/FxLink";
import { GiftEnvelope } from "@/components/invitation/Gift";
import { Rsvp } from "@/components/invitation/Rsvp";
import { WEDDING } from "@/lib/config";
import type { PublicInvitation } from "@/lib/invitations";
import { REDUCE_MOTION_BOOT } from "@/lib/story-motion";
import { BeachScene, DaySilhouette, FlightRoute, HeartRule, HeroScene, HomeScene, RingScene, STAMPS, StampArt } from "./scenes";
import { MotionToggle, TrackView, TravelControls } from "./StoryBits";
import { StoryMotion } from "./StoryMotion";

type Props = {
  invitation: PublicInvitation | null;
  /** Vista previa desde el backoffice: no cuenta como apertura. */
  preview?: boolean;
};

const ITINERARY_ICONS = [
  "/assets/icono-iglesia.png",
  null,
  "/assets/icono-entrada-novios.png",
  "/assets/icono-primer-baile.png",
  "/assets/icono-brindis.png",
  "/assets/icono-almuerzo.png",
  null,
  "/assets/icono-pista-abierta.png",
  null,
];

function splitTime(t: string) {
  const [time, ...rest] = t.split(" ");
  return { time, meridiem: rest.join(" ") };
}

export function StoryPage({ invitation, preview }: Props) {
  const name = invitation?.name ?? null;
  const advisorsHref = invitation ? `/asesoras?i=${encodeURIComponent(invitation.code)}` : "/asesoras";
  const classicHref = invitation ? `/i/${encodeURIComponent(invitation.code)}` : "/";
  const first = splitTime(WEDDING.itinerary[0].time);

  return (
    <div className="hs-root">
      <script dangerouslySetInnerHTML={{ __html: REDUCE_MOTION_BOOT }} />
      <a className="hs-skip" href="#confirmar">
        Ir a confirmar asistencia
      </a>

      <header className="hs-bar">
        <a className="hs-bar-mono" href="#inicio">
          <span className="script" aria-hidden="true">N</span>
          <span className="display" aria-hidden="true">&amp;</span>
          <span className="script" aria-hidden="true">A</span>
          <span className="sr-only">Norida y Agustín: volver al inicio</span>
        </a>
        <div className="hs-bar-year" aria-hidden="true">
          <small>Nuestra historia</small>
          <span className="hs-year display" data-year="2026">
            2026
          </span>
        </div>
        <div className="hs-bar-actions">
          <FxLink fx="notes" className="hs-bar-icon" href={WEDDING.spotifyUrl} target="_blank" rel="noopener" aria-label="Escuchar nuestra canción en Spotify">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
            </svg>
          </FxLink>
          <a className="hs-btn hs-btn-solid hs-bar-cta" href="#confirmar">
            Confirmar
          </a>
          <MotionToggle />
        </div>
        <div className="hs-bar-progress" aria-hidden="true">
          <i />
        </div>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <div className="hs-hero-pin">
          <section className="hs-hero" id="inicio" data-year="2026" aria-labelledby="hs-title">
            <HeroScene />
            <div className="hs-hero-copy">
              <p className="hs-kicker">Con la bendición de Dios y nuestros padres</p>
              <h1 id="hs-title" className="hs-names script">
                Norida <span className="hs-amp">&amp;</span> Agustín
              </h1>
              <HeartRule />
              <p className="hs-hero-date display">
                Nos casamos <span aria-hidden="true">·</span> 27 · 12 · 2026
              </p>
              <p className="hs-hero-lede serif">
                {name ? `${name}, diez` : "Diez"} años, dos caminos y una historia que apenas está comenzando. Recórrela con nosotros: el próximo capítulo lo escribimos juntos.
              </p>
              <div className="hs-hero-actions">
                <a className="hs-btn hs-btn-solid" href="#confirmar">
                  Confirmar asistencia
                </a>
                <a className="hs-btn hs-btn-ghost" href="#historia">
                  Conocer nuestra historia
                  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                    <path d="M8 2v11M3 8.5 8 13.5l5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
            <p className="hs-hero-statement serif">
              Todo empezó con dos caminos que no sabían que iban al <em className="script">mismo lugar</em>.
            </p>
          </section>
        </div>

        {/* ---------- Capítulo 1 · La playa ---------- */}
        <section className="hs-beach" id="historia" data-year="2016" aria-labelledby="hs-c1">
          <div className="hs-beach-scene">
            <BeachScene />
          </div>
          <div className="hs-beach-copy hs-paper">
            <p className="hs-kicker">Capítulo 01 · 2016 · La playa</p>
            <h2 id="hs-c1" data-split>
              En la playa se <em className="script">cruzaron</em> nuestros caminos
            </h2>
            <p className="serif">Un paseo a la playa, dos caminos que se cruzan… y ninguno de los dos sabía en lo que se estaba metiendo.</p>
            <ul className="hs-legend">
              <li>
                <i className="hs-dot hs-dot-a" /> Agustín
              </li>
              <li>
                <i className="hs-dot hs-dot-n" /> Norida
              </li>
            </ul>
          </div>
          <figure className="hs-polaroid">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/historia/playa-720.webp" srcSet="/historia/playa-720.webp 720w, /historia/playa.webp 896w" sizes="(max-width: 760px) 48vw, 300px" width={896} height={1193} loading="lazy" decoding="async" alt="Norida y Agustín caminan de la mano por la arena, frente al mar" />
            <figcaption className="script">Y desde entonces, juntos</figcaption>
          </figure>
        </section>

        {/* ---------- Capítulo 2 · La aventura ---------- */}
        <section className="hs-travel" id="aventura" data-year="2016" aria-labelledby="hs-c2">
          <div className="hs-travel-head">
            <p className="hs-kicker">Capítulo 02 · La aventura</p>
            <h2 id="hs-c2" data-split>
              Y ahí mismo empezó la <em className="script">aventura</em>
            </h2>
            <p className="serif">Maletas siempre listas: Santa Marta, Cartagena, el Tayrona, Medellín, San Andrés, Pereira, Quindío… parapente, cable vuelo, montañas rusas y lo que se atravesara.</p>
          </div>
          <FlightRoute />
          <div className="hs-track" id="hs-track" role="region" aria-label="Galería de viajes: desliza horizontalmente" tabIndex={0}>
            <ol className="hs-track-inner">
              {STAMPS.map((s, i) => (
                <li key={s.id} className={`hs-stamp hs-stamp-${i % 5}`}>
                  <StampArt id={s.id} />
                  <div className="hs-stamp-body">
                    <span className="hs-stamp-n display">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="display">{s.title}</h3>
                    <p className="serif">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <TravelControls total={STAMPS.length} />
        </section>

        {/* ---------- Frase ---------- */}
        <section className="hs-phrase" data-year="2016" aria-label="Cómo lo cuentan ellos">
          <p className="hs-phrase-text serif" data-light>
            Desde el primer momento, él ya sabía que ella sería su esposa. Ella tardó un poquito más en darse cuenta… pero llegó.
          </p>
          <HeartRule className="hs-heart-rule hs-heart-rule-light" />
        </section>

        {/* ---------- Capítulo 3 · El sí ---------- */}
        <section className="hs-ring" id="el-si" data-year="2019" aria-labelledby="hs-c3">
          <div className="hs-ring-art">
            <RingScene />
          </div>
          <div className="hs-ring-copy">
            <p className="hs-kicker">Capítulo 03 · 2019 · El sí</p>
            <h2 id="hs-c3" data-split>
              Nos <em className="script">comprometimos</em>
            </h2>
            <p className="serif">…y empezamos a planear la boda. Pero la vida ya tenía otros planes para nosotros: meses después, quedamos embarazados.</p>
          </div>
        </section>

        {/* ---------- Capítulo 4 · El hogar ---------- */}
        <section className="hs-home" id="hogar" data-year="2020" aria-labelledby="hs-c4">
          <div className="hs-home-copy">
            <p className="hs-kicker">Capítulo 04 · 2020 – 2022 · El hogar</p>
            <h2 id="hs-c4" data-split>
              El amor no se divide, se <em className="script">multiplica</em>
            </h2>
            <p className="hs-home-count display">
              <span className="sr-only">Un hogar para cuatro</span>
              <span aria-hidden="true">Hogar para</span>
              <span className="hs-roll" aria-hidden="true">
                <span className="hs-roll-strip">
                  <b>2</b>
                  <b>3</b>
                  <b>4</b>
                </span>
              </span>
            </p>
            <ol className="hs-steps serif">
              <li data-year="2020">
                <b>2020.</b> En plena pandemia nació nuestra <strong>Gabriela Lucía</strong>. El amor definitivamente no se puso en cuarentena.
              </li>
              <li data-year="2021">Empezamos a construir un hogar para tres y, entre pañales, retomamos (otra vez) los planes de boda…</li>
              <li data-year="2022">
                <b>2022.</b> ¡Upssss! Quedamos embarazados… otra vez. Y así llegó nuestra pequeña <strong>Valentina Sofía</strong>.
              </li>
            </ol>
          </div>
          <div className="hs-home-art">
            <HomeScene />
            <ul className="hs-legend hs-legend-family">
              <li>
                <i className="hs-dot hs-dot-a" /> Agustín
              </li>
              <li>
                <i className="hs-dot hs-dot-n" /> Norida
              </li>
              <li>
                <i className="hs-dot hs-dot-g" /> Gabriela Lucía
              </li>
              <li>
                <i className="hs-dot hs-dot-v" /> Valentina Sofía
              </li>
            </ul>
          </div>
        </section>

        {/* ---------- Capítulo 5 · La fe ---------- */}
        <section className="hs-faith" id="fe" data-year="2024" aria-labelledby="hs-c5">
          <div className="hs-rays" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="hs-faith-copy">
            <p className="hs-kicker">Capítulo 05 · 2024 · La fe</p>
            <h2 id="hs-c5" data-split>
              Llegó lo más importante de nuestro hogar: <em className="script">Dios</em>
            </h2>
            <p className="serif">Ahí supimos que teníamos una cita pendiente con Él.</p>
          </div>
        </section>

        {/* ---------- Momento wow · Lo que Dios juntó ---------- */}
        <section className="hs-wow" data-year="2024" aria-label="Mateo 19, 6">
          <div className="hs-wow-stage">
            <figure className="hs-wow-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/historia/arco-720.webp" srcSet="/historia/arco-720.webp 720w, /historia/arco.webp 1045w" sizes="(max-width: 760px) 100vw, 70vw" width={1045} height={1400} loading="lazy" decoding="async" alt="Norida y Agustín se besan bajo un arco, con el mar al fondo" />
            </figure>
            <svg className="hs-wow-arch" aria-hidden="true" focusable="false">
              <path className="hs-arch-half" pathLength={1} stroke="#C9A961" />
              <path className="hs-arch-half" pathLength={1} stroke="#E5D5B1" />
            </svg>
            <blockquote className="hs-wow-verse serif">
              <p>
                <span>Así que no son ya más dos,</span> <span>sino una sola carne;</span> <span>por tanto, lo que Dios juntó,</span> <span>no lo separe el hombre.</span>
              </p>
              <cite>Mateo 19, 6</cite>
            </blockquote>
          </div>
        </section>

        {/* ---------- Capítulo 6 · El día ---------- */}
        <section className="hs-day" id="el-dia" data-year="2026" aria-labelledby="hs-c6">
          <div className="hs-day-sky" aria-hidden="true">
            <i className="hs-sky hs-sky-1" />
            <i className="hs-sky hs-sky-2" />
            <i className="hs-sky hs-sky-3" />
            <i className="hs-sky hs-sky-4" />
            <i className="hs-day-sun" />
            <DaySilhouette />
            <div className="hs-day-clock display">
              <span className="hs-day-clock-t">{first.time}</span>
              <span className="hs-day-clock-m">{first.meridiem}</span>
            </div>
          </div>
          <div className="hs-day-content">
            <div className="hs-day-head">
              <p className="hs-kicker">Capítulo 06 · Domingo 27 de diciembre de 2026</p>
              <h2 id="hs-c6" data-split>
                Hoy la estamos <em className="script">cumpliendo</em>
              </h2>
              <p className="serif">El día en que serás parte de nuestra mayor muestra de amor: la Bendición de nuestro hogar.</p>
            </div>
            <ol className="hs-day-list">
              {WEDDING.itinerary.map((step, i) => {
                const icon = ITINERARY_ICONS[i];
                const ceremony = i === 0;
                const reception = i === 1;
                return (
                  <li key={step.time} className={`hs-moment${ceremony || reception ? " is-place" : ""}`} data-time={step.time}>
                    <div className="hs-moment-head">
                      {icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={icon} width={44} height={44} alt="" loading="lazy" decoding="async" />
                      ) : (
                        <span className="hs-moment-dot" aria-hidden="true" />
                      )}
                      <div>
                        <p className="hs-moment-time display">{step.time}</p>
                        <h3 className="serif">{step.label}</h3>
                      </div>
                    </div>
                    {ceremony ? (
                      <div className="hs-moment-place">
                        <p className="script">{WEDDING.ceremony.place}</p>
                        <p className="serif">Ceremonia católica, íntima entre familia y amigos cercanos. Tu compañía en este momento es lo más importante para nosotros.</p>
                        <FxLink className="hs-btn hs-btn-solid hs-btn-sm" href={WEDDING.ceremony.mapsUrl} target="_blank" rel="noopener">
                          Cómo llegar a la iglesia
                        </FxLink>
                      </div>
                    ) : null}
                    {reception ? (
                      <div className="hs-moment-place">
                        <p className="script">{WEDDING.reception.place}</p>
                        <p className="serif">La recepción empieza a la 1:00 p. m. Te esperamos para celebrar toda la tarde.</p>
                        <FxLink className="hs-btn hs-btn-solid hs-btn-sm" href={WEDDING.reception.mapsUrl} target="_blank" rel="noopener">
                          Cómo llegar al salón
                        </FxLink>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            <p className="hs-day-thanks script">Gracias por acompañarnos cada minuto de este día</p>
          </div>
        </section>

        {/* ---------- Capítulo 7 · Contigo ---------- */}
        <section className="hs-you" id="confirmar" data-year="2026" aria-labelledby="hs-c7">
          <div className="hs-you-head">
            <p className="hs-kicker">Capítulo 07 · Contigo</p>
            <h2 id="hs-c7" data-split>
              El próximo capítulo lo escribimos <em className="script">contigo</em>
            </h2>
            <p className="serif">{name ? `${name}, nos` : "Nos"} encantaría contar contigo en un día tan especial para nosotros.</p>
          </div>

          <div className="hs-bento">
            <div className="hs-card hs-card-rsvp">
              <h3 className="script">Confirma tu asistencia</h3>
              <Rsvp invitation={invitation} />
            </div>

            <div className="hs-card hs-card-dark hs-card-count">
              <h3 className="script">Falta poco</h3>
              <p className="hs-card-sub">para celebrar nuestro amor</p>
              <CountdownBoxes />
              <div className="hs-card-links">
                <FxLink href={WEDDING.calendarUrl} target="_blank" rel="noopener" className="hs-link-light">
                  Agendar en Google Calendar
                </FxLink>
                <FxLink fx="notes" href={WEDDING.spotifyUrl} target="_blank" rel="noopener" className="hs-link-light">
                  Escuchar nuestra canción
                </FxLink>
              </div>
            </div>

            <div className="hs-card hs-card-dark hs-card-dress">
              <h3 className="script">{WEDDING.dressCode}</h3>
              <p className="hs-card-sub">Código de vestimenta</p>
              <p className="serif hs-card-note">Es una boda de día: te sugerimos colores frescos y luminosos.</p>
              <DressCodeSwatches advisorsHref={advisorsHref} />
              <p className="serif hs-card-note">Nos reservamos el blanco y el marfil.</p>
            </div>

            <div className="hs-card hs-card-gift">
              <h3 className="script">Lluvia de sobres</h3>
              <p className="serif hs-card-note">Tu presencia es el mejor regalo, pero si deseas hacernos un detalle para nuestro nuevo hogar y luna de miel, aquí puedes contribuir.</p>
              <GiftEnvelope />
            </div>
          </div>
        </section>
      </main>

      <footer className="hs-footer" data-year="2026">
        <HeartRule className="hs-heart-rule hs-heart-rule-light" />
        <p className="hs-footer-line script">Porque apenas estamos comenzando…</p>
        <p className="hs-footer-love serif">Con todo nuestro amor,</p>
        <p className="hs-footer-names display">Norida &amp; Agustín</p>
        <p className="hs-footer-date">27 de diciembre de 2026</p>
        <nav className="hs-footer-nav" aria-label="Más de la boda">
          <a href={classicHref}>Ver la invitación clásica</a>
          <a href={advisorsHref}>Asesoras de outfits</a>
        </nav>
        <p className="hs-footer-credit">Invitación interactiva hecha con cariño por CooWeb</p>
      </footer>

      <StoryMotion />
      {invitation && !preview ? <TrackView code={invitation.code} /> : null}
    </div>
  );
}
