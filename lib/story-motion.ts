/**
 * Utilidades de movimiento para la versión "historia" (port del kit storytelling de CooWeb).
 * Sin dependencias: GSAP se carga aparte, solo en el cliente.
 */

const KEY = "story-reduce-motion";

/** Script en línea que se ejecuta antes del primer pintado: aplica .reduce-motion sin parpadeo. */
export const REDUCE_MOTION_BOOT = `(function(){try{var s=localStorage.getItem('${KEY}');var r=s===null?matchMedia('(prefers-reduced-motion: reduce)').matches:s==='1';document.documentElement.classList.toggle('reduce-motion',r);}catch(e){}})();`;

type MotionListener = (reduced: boolean) => void;
const listeners = new Set<MotionListener>();

export function reduced(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("reduce-motion");
}

/** Alterna la preferencia (botón "Pausar animaciones") y la guarda. */
export function toggleMotion() {
  const next = !reduced();
  try {
    localStorage.setItem(KEY, next ? "1" : "0");
  } catch {}
  document.documentElement.classList.toggle("reduce-motion", next);
  listeners.forEach((fn) => fn(next));
}

export function onMotion(fn: MotionListener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Ejecuta fn tras el primer frame pintado: no bloquea el LCP. */
export function afterFirstFrame(fn: () => void) {
  let t = 0;
  const raf = requestAnimationFrame(() => {
    t = window.setTimeout(fn, 0);
  });
  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(t);
  };
}

/** Corre tareas en tiempo ocioso; si la persona hace scroll, las completa de inmediato. */
export function idleQueue(tasks: (() => void)[]) {
  let q = tasks.slice();
  let id = 0;
  const hasIdle = typeof window.requestIdleCallback === "function";
  const idle = (f: () => void) => (hasIdle ? window.requestIdleCallback(f, { timeout: 700 }) : window.setTimeout(f, 40));
  const cancel = (n: number) => (hasIdle ? window.cancelIdleCallback(n) : clearTimeout(n));
  const flush = () => {
    cancel(id);
    window.removeEventListener("scroll", flush);
    while (q.length) q.shift()!();
  };
  const step = () => {
    q.shift()?.();
    if (q.length) id = idle(step);
    else window.removeEventListener("scroll", flush);
  };
  window.addEventListener("scroll", flush, { passive: true });
  id = idle(step);
  return {
    flush,
    cancel() {
      cancel(id);
      q = [];
      window.removeEventListener("scroll", flush);
    },
  };
}

/** Marca .is-off fuera de pantalla (pausa animaciones CSS) y avisa a cb. */
export function pauseOffscreen(els: (Element | null)[], cb?: (el: Element, visible: boolean) => void) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        e.target.classList.toggle("is-off", !e.isIntersecting);
        cb?.(e.target, e.isIntersecting);
      }),
    { rootMargin: "80px 0px" },
  );
  els.forEach((el) => el && io.observe(el));
  return io;
}

/** Divide un titular en palabras animables; el lector de pantalla sigue leyendo el texto completo. */
export function splitWords(el: HTMLElement): HTMLElement[] {
  if (el.dataset.split === "done") return Array.from(el.querySelectorAll<HTMLElement>(".wi"));
  const label = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  const vis = document.createElement("span");
  vis.setAttribute("aria-hidden", "true");
  const walk = (node: Node, wrap: Element | null) => {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        (n.textContent ?? "").split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) {
            vis.appendChild(document.createTextNode(" "));
            return;
          }
          const o = document.createElement("span");
          o.className = "w";
          const i = document.createElement("span");
          i.className = "wi";
          i.textContent = w;
          o.appendChild(i);
          if (wrap) {
            const c = wrap.cloneNode(false) as Element;
            c.appendChild(o);
            vis.appendChild(c);
          } else vis.appendChild(o);
        });
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        if ((n as Element).tagName === "BR") vis.appendChild(document.createElement("br"));
        else walk(n, n as Element);
      }
    });
  };
  walk(el, null);
  const sr = document.createElement("span");
  sr.className = "sr-only";
  sr.textContent = label;
  el.textContent = "";
  el.appendChild(sr);
  el.appendChild(vis);
  el.dataset.split = "done";
  return Array.from(vis.querySelectorAll<HTMLElement>(".wi"));
}

export function finePointer() {
  return matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/** Pantallas compactas (celular vertical) o bajas (celular en horizontal): cambia la coreografía. */
export const COMPACT_QUERY = "(max-width: 760px), (max-height: 500px)";
export const LOW_QUERY = "(max-height: 500px)";
