"use client";

import { useEffect } from "react";
import { COMPACT_QUERY, LOW_QUERY, afterFirstFrame, idleQueue, onMotion, pauseOffscreen, reduced, splitWords } from "@/lib/story-motion";
import { setRoute } from "./StoryBits";

type Gsap = typeof import("gsap").gsap;
type ST = typeof import("gsap/ScrollTrigger").ScrollTrigger;

// Solo querySelector/All: los tipos de Workers redefinen Element.append y chocan con ParentNode completo.
type Root = Pick<ParentNode, "querySelector" | "querySelectorAll">;
const $ = <T extends Element = HTMLElement>(sel: string, root: Root = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: Root = document) => Array.from(root.querySelectorAll<T>(sel));
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* ---------- Siempre activos (no son animaciones autónomas): progreso, año y reloj del día ---------- */

function setYear(year: string) {
  const el = $(".hs-year");
  if (!el || el.dataset.year === year) return;
  el.dataset.year = year;
  el.textContent = year;
  if (!reduced()) el.animate([{ transform: "translateY(60%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, easing: "cubic-bezier(.16,1,.3,1)" });
}

function watchYears() {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setYear((e.target as HTMLElement).dataset.year ?? "2026")),
    { rootMargin: "-50% 0px -50% 0px" },
  );
  $$("main [data-year], .hs-footer").forEach((el) => {
    if (!el.closest(".hs-steps")) io.observe(el);
  });
  return () => io.disconnect();
}

/** Barra de progreso, reloj y cielo del capítulo "El día" (un solo listener de scroll). */
function watchScroll() {
  const bar = $(".hs-bar-progress i");
  const day = $(".hs-day");
  const layers = $$(".hs-sky-2, .hs-sky-3, .hs-sky-4");
  const sun = $(".hs-day-sun");
  const clockT = $(".hs-day-clock-t");
  const clockM = $(".hs-day-clock-m");
  const moments = $$(".hs-moment");
  const compact = matchMedia(COMPACT_QUERY);
  let raf = 0;
  let now = -1;

  const paint = () => {
    raf = 0;
    const doc = document.documentElement;
    const max = doc.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? clamp01(scrollY / max).toFixed(4) : 0})`;
    if (!day) return;
    const r = day.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = clamp01(-r.top / Math.max(1, r.height - innerHeight));
    if (!reduced()) {
      layers.forEach((l, i) => (l.style.opacity = clamp01(p * 3 - i).toFixed(3)));
      if (sun) {
        const w = innerWidth, h = innerHeight;
        const x = w * (0.1 + 0.8 * p) - 60;
        const y = h * (0.62 - Math.sin(Math.PI * p) * 0.48) - 60;
        sun.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      }
    }
    // El momento activo es el más cercano al centro de la pantalla.
    let best = 0, dist = Infinity;
    moments.forEach((m, i) => {
      const b = m.getBoundingClientRect();
      const d = Math.abs(b.top + b.height / 2 - innerHeight / 2);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    const [t, ...m] = (moments[best]?.dataset.time ?? "").split(" ");
    if (best !== now) {
      moments[now]?.classList.remove("is-now");
      moments[best]?.classList.add("is-now");
      now = best;
      if (clockT) clockT.textContent = t;
      if (clockM) clockM.textContent = m.join(" ");
    }
    // En celular el reloj del cielo quedaría tapado por las tarjetas: la hora va en la barra, donde va el año.
    if (compact.matches && t && r.top < innerHeight / 2 && r.bottom > innerHeight / 2) setYear(t);
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(paint);
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  paint();
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener("scroll", onScroll);
    removeEventListener("resize", onScroll);
  };
}

/* ---------- Arco del momento wow: geometría en píxeles según el escenario ---------- */

function archInset(compact: boolean) {
  return compact ? { t: 3, x: 4 } : { t: 5, x: 16 };
}

function layoutArch(compact: boolean) {
  const media = $(".hs-wow-media");
  const svg = $<SVGSVGElement>(".hs-wow-arch");
  if (!media || !svg) return;
  const W = media.clientWidth, H = media.clientHeight;
  const { t, x } = archInset(compact);
  const L = (W * x) / 100, R = W - L, T = (H * t) / 100, B = H;
  const r = Math.min((R - L) / 2, B - T);
  const cx = W / 2;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const [a, b] = $$<SVGPathElement>(".hs-arch-half", svg);
  a?.setAttribute("d", `M${L} ${B} L${L} ${T + r} A${r} ${r} 0 0 1 ${cx} ${T}`);
  b?.setAttribute("d", `M${R} ${B} L${R} ${T + r} A${r} ${r} 0 0 0 ${cx} ${T}`);
}

/* ---------- Coreografía con GSAP ---------- */

function choreography(gsap: Gsap, ScrollTrigger: ST, compact: boolean, low: boolean) {
  const fits = (el: Element | null) => !!el && (el as HTMLElement).offsetHeight <= innerHeight + 2 && !low;
  const undo: (() => void)[] = [];

  /* 1 · Hero: el texto sale y la frase sube al centro mientras el sol amanece. */
  const hero = $(".hs-hero");
  if (fits(hero)) {
    const stmt = $(".hs-hero-statement")!;
    // offsetTop ignora transformaciones: la medida es la misma aunque el pin se recalcule a mitad del recorrido.
    const dy = () => hero!.clientHeight * 0.46 - ((stmt.offsetParent as HTMLElement).offsetTop + stmt.offsetTop + stmt.offsetHeight / 2);
    gsap
      .timeline({
        scrollTrigger: { trigger: hero, start: "top top", end: "+=110%", pin: true, pinSpacer: $(".hs-hero-pin"), scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true },
      })
      .to(".hs-sun", { y: () => -hero!.clientHeight * 0.3, ease: "none", duration: 1 }, 0)
      .to(".hs-hero-copy", { yPercent: -12, opacity: 0, ease: "power2.in", duration: 0.4 }, 0.04)
      .to(stmt, { y: dy, scale: compact ? 1.12 : 1.28, ease: "power2.out", duration: 0.46 }, 0.46)
      .to({}, { duration: 0.1 });
  }

  const chapters: (() => void)[] = [];
  const reveal = (sel: string) => {
    $$(sel).forEach((h) => {
      const words = splitWords(h);
      gsap.from(words, { yPercent: 40, rotate: 2, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.05, scrollTrigger: { trigger: h, start: "top 96%", once: true } });
    });
  };
  const drawOnce = (root: Element | null) => {
    if (!root) return;
    gsap.fromTo($$(".hs-draw", root), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", stagger: 0.15, scrollTrigger: { trigger: root, start: "top 88%", once: true } });
  };

  /* 2 · La playa: dos rastros de huellas que se encuentran y siguen juntos. */
  chapters.push(() => {
    const sec = $(".hs-beach");
    if (!sec) return;
    reveal(".hs-beach h2");
    const svg = $$<SVGSVGElement>(".hs-beach-svg", sec).find((s) => getComputedStyle(s).display !== "none");
    if (!svg) return;
    const pin = fits(sec);
    const tl = gsap.timeline({
      scrollTrigger: pin
        ? { trigger: sec, start: "top top", end: "+=160%", pin: true, scrub: 0.6, anticipatePin: 1 }
        : { trigger: sec, start: "top 75%", end: "bottom 65%", scrub: 0.6 },
    });
    const own = (who: string) => $$(`.hs-prints-${who} .hs-print-own`, svg);
    const shared = (who: string) => $$(`.hs-prints-${who} .hs-print-shared`, svg);
    tl.from(own("him"), { opacity: 0, duration: 0.12, stagger: 0.06 }, 0)
      .from(own("her"), { opacity: 0, duration: 0.12, stagger: 0.06 }, 0)
      .from(shared("him"), { opacity: 0, duration: 0.12, stagger: 0.06 }, ">-0.05")
      .from(shared("her"), { opacity: 0, duration: 0.12, stagger: 0.06 }, "<")
      .from(".hs-polaroid", { y: 90, rotate: -14, opacity: 0, duration: 0.5, ease: "power2.out" }, ">-0.1")
      .to({}, { duration: 0.15 });
  });

  /* 3 · La aventura: galería horizontal fijada (o carrusel nativo en compacto). */
  chapters.push(() => {
    reveal(".hs-travel h2");
    const sec = $(".hs-travel");
    const track = $("#hs-track");
    const inner = $(".hs-track-inner");
    if (!sec || !track || !inner || compact || low) return;
    sec.classList.add("is-pinned");
    // Solo se fija si cabe completa; si no, queda el carrusel nativo.
    if (sec.scrollHeight > innerHeight + 2) {
      sec.classList.remove("is-pinned");
      return;
    }
    undo.push(() => sec.classList.remove("is-pinned"));
    const dist = () => Math.max(0, inner.scrollWidth - track.clientWidth);
    gsap.to(inner, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: sec,
        start: "top top",
        end: () => "+=" + dist(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: (s) => setRoute(s.progress),
      },
    });
  });

  /* 4 · La frase se ilumina palabra a palabra (una idea que se instala). */
  chapters.push(() => {
    const p = $(".hs-phrase-text");
    if (!p) return;
    if (!p.dataset.words) {
      p.innerHTML = (p.textContent ?? "").trim().split(/\s+/).map((w) => `<span class="sw">${w}</span>`).join(" ");
      p.dataset.words = "1";
    }
    gsap.fromTo($$(".sw", p), { opacity: 0.6 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: p, start: "top 80%", end: "bottom 45%", scrub: true } });
    drawOnce($(".hs-phrase .hs-heart-rule"));
  });

  /* 5 · El sí: dos hilos que se cierran en un anillo. */
  chapters.push(() => {
    reveal(".hs-ring h2");
    const sec = $(".hs-ring");
    if (!sec) return;
    gsap
      .timeline({ scrollTrigger: { trigger: sec, start: "top 78%", end: "center 45%", scrub: 0.6 } })
      .fromTo($$(".hs-ring-half", sec), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: "none" }, 0)
      .from(".hs-ring-band", { opacity: 0, duration: 0.35 }, 0.85)
      .from(".hs-gem", { scale: 0, transformOrigin: "50% 100%", duration: 0.3, ease: "back.out(2)" }, 1)
      .from(".hs-spark", { opacity: 0, scale: 0, transformOrigin: "50% 50%", stagger: 0.05, duration: 0.2 }, 1.1);
  });

  /* 6 · El hogar: se dibuja la casa y la familia (y los corazones) se multiplican. */
  chapters.push(() => {
    reveal(".hs-home h2");
    const sec = $(".hs-home");
    if (!sec) return;
    const steps = $$(".hs-steps li", sec);
    const hearts = (from: number, to: number) => $$(".hs-heart", sec).slice(from, to);
    const pop = { scale: 0, opacity: 0, transformOrigin: "50% 50%", duration: 0.18, stagger: 0.05, ease: "back.out(2)" };
    const rise = { y: 36, opacity: 0, duration: 0.28, ease: "power2.out" };
    const pin = fits(sec);
    const tl = gsap.timeline({
      scrollTrigger: pin
        ? {
            trigger: sec,
            start: "top top",
            end: "+=200%",
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            onUpdate: (s) => {
              const t = s.progress * tl.duration();
              setYear(t < tl.labels.y2021 ? "2020" : t < tl.labels.y2022 ? "2021" : "2022");
            },
          }
        : { trigger: sec, start: "top 65%", end: "bottom 90%", scrub: 0.6 },
    });
    tl.fromTo($$(".hs-house", sec).slice(0, 2), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: "none" }, 0)
      .fromTo($$(".hs-house", sec)[2], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: "none" }, 0.2)
      .from(".hs-house-window", { scale: 0, transformOrigin: "50% 50%", duration: 0.2 }, 0.5)
      .from([".hs-fig-a", ".hs-fig-n"], { ...rise, stagger: 0.1 }, 0.55)
      .from(hearts(0, 1), pop, 0.8)
      .addLabel("y2020", 0.95)
      .from(steps[0], rise, "y2020")
      .from(".hs-fig-g", rise, "y2020+=0.05")
      .fromTo(".hs-roll-strip", { y: 0, yPercent: 0 }, { yPercent: -100 / 3, duration: 0.2 }, "y2020+=0.05")
      .from(hearts(1, 2), pop, "y2020+=0.2")
      .addLabel("y2021", 1.4)
      .from(steps[1], rise, "y2021")
      .addLabel("y2022", 1.8)
      .from(steps[2], rise, "y2022")
      .from(".hs-fig-v", rise, "y2022+=0.05")
      .to(".hs-roll-strip", { yPercent: (-100 * 2) / 3, duration: 0.2 }, "y2022+=0.05")
      .from(hearts(2, 4), pop, "y2022+=0.2")
      .from(hearts(4, 8), pop, "y2022+=0.45")
      .to({}, { duration: 0.2 });
  });

  /* 7 · La fe: la luz baja sobre el capítulo. */
  chapters.push(() => {
    reveal(".hs-faith h2");
    const sec = $(".hs-faith");
    if (!sec) return;
    gsap.fromTo($$(".hs-rays i", sec), { scaleY: 0.25, opacity: 0.1 }, { scaleY: 1, opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: sec, start: "top 85%", end: "bottom 45%", scrub: true } });
  });

  /* 8 · Momento wow: el arco se abre, dos líneas suben y se unen en la cima, aparece Mateo 19, 6. */
  chapters.push(() => {
    const stage = $(".hs-wow-stage");
    const media = $(".hs-wow-media");
    if (!stage || !media) return;
    const { t, x } = archInset(compact);
    const start = compact ? "inset(34% 32% 12% 32% round 999px 999px 0px 0px)" : "inset(34% 41% 10% 41% round 999px 999px 0px 0px)";
    const end = `inset(${t}% ${x}% 0% ${x}% round 999px 999px 0px 0px)`;
    const pin = fits(stage);
    const onRefresh = () => layoutArch(compact);
    ScrollTrigger.addEventListener("refresh", onRefresh);
    undo.push(() => ScrollTrigger.removeEventListener("refresh", onRefresh));
    gsap
      .timeline({
        scrollTrigger: pin
          ? { trigger: stage, start: "top top", end: "+=180%", pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true }
          : { trigger: stage, start: "top 80%", end: "bottom 80%", scrub: 0.6 },
      })
      .fromTo(media, { clipPath: start }, { clipPath: end, ease: "power2.inOut", duration: 1 }, 0)
      .fromTo($("img", media), { scale: 1.35 }, { scale: 1, ease: "power2.out", duration: 1 }, 0)
      .fromTo($$(".hs-arch-half", stage), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: "none" }, 0.9)
      .from(".hs-wow-verse span", { opacity: 0, y: 24, stagger: 0.18, duration: 0.3 }, 1.2)
      .from(".hs-wow-verse cite", { opacity: 0, duration: 0.2 }, ">")
      .to({}, { duration: 0.25 });
  });

  /* 9 · El día y el cierre: titulares, tarjetas y el corazón del pie. */
  chapters.push(() => {
    reveal(".hs-day h2, .hs-you h2");
    const cards = $$(".hs-card");
    gsap.set(cards, { y: 40, opacity: 0 });
    ScrollTrigger.batch(cards, { start: "top 92%", once: true, onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.1 }) });
    drawOnce($(".hs-footer .hs-heart-rule"));
  });

  chapters.push(() => ScrollTrigger.refresh());
  return { undo, chapters };
}

export function StoryMotion() {
  useEffect(() => {
    let disposed = false;
    const offs: (() => void)[] = [watchYears(), watchScroll()];

    // Las capas en loop (olas) se pausan fuera de pantalla.
    const io = pauseOffscreen($$(".hs-hero"));
    offs.push(() => io.disconnect());

    const COMPACT = matchMedia(COMPACT_QUERY);
    const LOW = matchMedia(LOW_QUERY);
    layoutArch(COMPACT.matches);

    offs.push(
      afterFirstFrame(async () => {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.config({ ignoreMobileResize: true });

        let ctx: ReturnType<Gsap["context"]> | null = null;
        let rest: ReturnType<typeof idleQueue> | null = null;
        let undo: (() => void)[] = [];

        const build = () => {
          rest?.cancel();
          ctx?.revert();
          undo.forEach((f) => f());
          undo = [];
          ctx = null;
          layoutArch(COMPACT.matches);
          if (reduced()) {
            ScrollTrigger.refresh();
            return;
          }
          ctx = gsap.context(() => {
            const plan = choreography(gsap, ScrollTrigger, COMPACT.matches, LOW.matches);
            undo = plan.undo;
            // Lo que está bajo el pliegue se arma en tiempo ocioso.
            rest = idleQueue(plan.chapters.map((fn) => () => ctx?.add(fn)));
          });
        };

        let lastW = innerWidth;
        let timer = 0;
        const onResize = () => {
          if (innerWidth === lastW) return;
          lastW = innerWidth;
          clearTimeout(timer);
          timer = window.setTimeout(build, 220);
        };
        const offMotion = onMotion(build);
        COMPACT.addEventListener("change", build);
        LOW.addEventListener("change", build);
        addEventListener("resize", onResize);
        document.fonts?.ready.then(() => !disposed && ScrollTrigger.refresh());
        build();

        offs.push(() => {
          offMotion();
          COMPACT.removeEventListener("change", build);
          LOW.removeEventListener("change", build);
          removeEventListener("resize", onResize);
          clearTimeout(timer);
          rest?.cancel();
          ctx?.revert();
          undo.forEach((f) => f());
        });
      }),
    );

    return () => {
      disposed = true;
      offs.forEach((f) => f());
    };
  }, []);

  return null;
}
