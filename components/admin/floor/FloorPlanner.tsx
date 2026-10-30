"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveFloorPlanAction } from "@/app/admin/actions";
import {
  CATEGORY_COLOR,
  CHAIR_R,
  KIND_INFO,
  addTablesFor,
  categoryColor,
  chairPositions,
  initials,
  isSeatable,
  isTable,
  itemSize,
  newId,
  proposeSeating,
  sanitizePlan,
  snap,
  suggestedLayout,
  type DecorKind,
  type FloorItem,
  type FloorKind,
  type FloorPlan,
  type ProposalOptions,
  type ProposalStats,
  type SeatRef,
  type SeatingGuest,
} from "@/lib/floor";

type Props = { initialPlan: FloorPlan; initialVersion: number; guests: SeatingGuest[] };
type View = { x: number; y: number; w: number; h: number };
type SaveState = { status: "saved" | "dirty" | "saving" | "error"; message?: string };
type Proposal = { seats: Record<string, SeatRef>; stats: ProposalStats; options: ProposalOptions; n: number };
type GuestDrag = { ids: number[]; label: string; x: number; y: number; startX: number; startY: number; active: boolean; from: "list" | "seat" };

const DECOR: DecorKind[] = ["dance", "dj", "bar", "buffet", "cake", "photo", "gifts", "entrance", "plant"];
const DECOR_FILL: Record<DecorKind, string> = {
  dance: "url(#fp-dance)",
  dj: "#2F3A1C",
  bar: "#BF7E5A",
  buffet: "#C9A961",
  cake: "#D3A8A0",
  photo: "#9FB4C7",
  gifts: "#E5D5B1",
  entrance: "#8A8676",
  plant: "#8A9A6B",
};

const tableNumber = (label: string) => Number(label.match(/\d+/)?.[0] ?? 999);

export function FloorPlanner({ initialPlan, initialVersion, guests }: Props) {
  const guestIds = useMemo(() => new Set(guests.map((g) => g.id)), [guests]);
  const guestById = useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);

  const [plan, setPlan] = useState<FloorPlan>(() => sanitizePlan(initialPlan, guestIds));
  const [selected, setSelected] = useState<string | null>(null);
  const [picked, setPicked] = useState<number[] | null>(null);
  const [view, setView] = useState<View>({ x: -40, y: -40, w: initialPlan.width + 80, h: initialPlan.height + 80 });
  const [tab, setTab] = useState<"plano" | "lista">("plano");
  const [filter, setFilter] = useState<"sin" | "todos" | "ubicados">("sin");
  const [search, setSearch] = useState("");
  const [onlyConfirmed, setOnlyConfirmed] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [proposalOpts, setProposalOpts] = useState<Omit<ProposalOptions, "seed">>({ keepExisting: true, onlyConfirmed: false, mode: "grupos" });
  const [showProposalPanel, setShowProposalPanel] = useState(false);
  const [menu, setMenu] = useState(false);
  const [save, setSave] = useState<SaveState>({ status: "saved" });
  const [toast, setToast] = useState<string | null>(null);
  const [guestDrag, setGuestDrag] = useState<GuestDrag | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"invitados" | "detalle">("invitados");

  const svgRef = useRef<SVGSVGElement>(null);
  const versionRef = useRef(initialVersion);
  const past = useRef<FloorPlan[]>([]);
  const future = useRef<FloorPlan[]>([]);
  const lastCoalesce = useRef<{ key: string; at: number } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const planRef = useRef(plan);
  planRef.current = plan;
  const [, forceHistory] = useState(0);

  // ---------------------------------------------------------------- guardado + historial
  const scheduleSave = useCallback(() => {
    setSave({ status: "dirty" });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSave({ status: "saving" });
      const res = await saveFloorPlanAction(JSON.stringify(planRef.current), versionRef.current).catch(() => ({
        ok: false as const,
        error: "Sin conexión: reintentaremos al próximo cambio.",
      }));
      if (res.ok) {
        versionRef.current = res.version;
        setSave({ status: "saved" });
      } else setSave({ status: "error", message: res.error });
    }, 900);
  }, []);

  const commit = useCallback(
    (next: FloorPlan, opts: { coalesce?: string; base?: FloorPlan } = {}) => {
      const now = Date.now();
      const same = opts.coalesce && lastCoalesce.current?.key === opts.coalesce && now - lastCoalesce.current.at < 1500;
      if (!same) {
        past.current.push(opts.base ?? planRef.current);
        if (past.current.length > 60) past.current.shift();
        future.current = [];
      }
      lastCoalesce.current = opts.coalesce ? { key: opts.coalesce, at: now } : null;
      const clean = sanitizePlan(next, guestIds);
      planRef.current = clean;
      setPlan(clean);
      forceHistory((n) => n + 1);
      scheduleSave();
    },
    [guestIds, scheduleSave],
  );

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(planRef.current);
    planRef.current = prev;
    setPlan(prev);
    lastCoalesce.current = null;
    forceHistory((n) => n + 1);
    scheduleSave();
  }, [scheduleSave]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(planRef.current);
    planRef.current = next;
    setPlan(next);
    lastCoalesce.current = null;
    forceHistory((n) => n + 1);
    scheduleSave();
  }, [scheduleSave]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  };

  // ---------------------------------------------------------------- derivados
  const activeSeats = proposal ? proposal.seats : plan.seats;
  const seatMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const [gid, s] of Object.entries(activeSeats)) m.set(`${s.table}:${s.seat}`, Number(gid));
    return m;
  }, [activeSeats]);
  const tables = useMemo(() => plan.items.filter((i) => isTable(i.kind)).sort((a, b) => tableNumber(a.label) - tableNumber(b.label)), [plan.items]);
  const tableById = useMemo(() => new Map(tables.map((t) => [t.id, t])), [tables]);
  const selectedItem = plan.items.find((i) => i.id === selected) ?? null;

  const seatable = guests.filter((g) => isSeatable(g, onlyConfirmed));
  const totalSeats = tables.reduce((s, t) => s + t.seats, 0);
  const seatedCount = Object.keys(plan.seats).filter((gid) => guestById.has(Number(gid))).length;
  const unseated = seatable.filter((g) => !plan.seats[String(g.id)]);

  // ---------------------------------------------------------------- operaciones de mesas
  const centerOfView = () => ({ x: snap(view.x + view.w / 2), y: snap(view.y + view.h / 2) });

  function freeSpot(near: { x: number; y: number }, size: { w: number; h: number }) {
    for (let r = 0; r < 1600; r += 60) {
      for (let a = 0; a < 360; a += r === 0 ? 360 : 30) {
        const x = snap(near.x + r * Math.cos((a * Math.PI) / 180));
        const y = snap(near.y + r * Math.sin((a * Math.PI) / 180));
        const hit = planRef.current.items.some((i) => {
          const s = itemSize(i);
          return Math.abs(i.x - x) < (s.w + size.w) / 2 + 70 && Math.abs(i.y - y) < (s.h + size.h) / 2 + 70;
        });
        if (!hit && x > 0 && y > 0 && x < plan.width && y < plan.height) return { x, y };
      }
    }
    return near;
  }

  function addItem(kind: FloorKind) {
    setMenu(false);
    const info = KIND_INFO[kind];
    const seats = kind === "round" ? 8 : kind === "rect" ? 8 : kind === "head" ? 2 : 0;
    const n = plan.items.filter((i) => i.kind === "round" || i.kind === "rect").length + 1;
    const draft: FloorItem = {
      id: newId(kind[0]),
      kind,
      label: kind === "round" || kind === "rect" ? `Mesa ${n}` : info.label,
      x: 0,
      y: 0,
      w: info.w,
      h: info.h,
      r: 0,
      seats,
    };
    const pos = freeSpot(centerOfView(), itemSize(draft));
    const item = { ...draft, ...pos };
    commit({ ...plan, items: [...plan.items, item] });
    setSelected(item.id);
    setMobilePanel("detalle");
  }

  function updateItem(id: string, patch: Partial<FloorItem>, coalesce?: string) {
    commit({ ...planRef.current, items: planRef.current.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }, { coalesce });
  }

  function changeSeats(item: FloorItem, delta: number) {
    const seats = Math.max(1, Math.min(24, item.seats + delta));
    if (seats === item.seats) return;
    const lost = Object.entries(planRef.current.seats).filter(([, s]) => s.table === item.id && s.seat >= seats);
    updateItem(item.id, { seats }, `seats-${item.id}`);
    if (lost.length) flash(`${lost.map(([gid]) => guestById.get(Number(gid))?.name).join(", ")} quedó sin silla`);
  }

  function removeItem(id: string) {
    const seated = Object.values(planRef.current.seats).filter((s) => s.table === id).length;
    if (seated && !window.confirm(`Esta mesa tiene ${seated} invitado(s). ¿Eliminarla? Quedarán sin mesa.`)) return;
    commit({ ...planRef.current, items: planRef.current.items.filter((i) => i.id !== id) });
    setSelected(null);
  }

  function duplicateItem(item: FloorItem) {
    const n = plan.items.filter((i) => i.kind === "round" || i.kind === "rect").length + 1;
    const copy = {
      ...item,
      id: newId(item.kind[0]),
      label: item.kind === "round" || item.kind === "rect" ? `Mesa ${n}` : item.label,
      ...freeSpot({ x: item.x + 60, y: item.y }, itemSize(item)),
    };
    commit({ ...planRef.current, items: [...planRef.current.items, copy] });
    setSelected(copy.id);
  }

  function clearTable(id: string) {
    const seats = Object.fromEntries(Object.entries(planRef.current.seats).filter(([, s]) => s.table !== id));
    commit({ ...planRef.current, seats });
  }

  // ---------------------------------------------------------------- ubicar invitados
  function assign(ids: number[], target: { table: string; seat?: number }) {
    const base = planRef.current;
    const table = base.items.find((i) => i.id === target.table);
    if (!table || !isTable(table.kind)) return;
    const seats = { ...base.seats };
    const occupant = (seat: number) => Object.entries(seats).find(([, s]) => s.table === table.id && s.seat === seat)?.[0];

    if (ids.length === 1 && target.seat !== undefined) {
      const gid = String(ids[0]);
      const prev = seats[gid];
      const other = occupant(target.seat);
      if (other && other !== gid) {
        // Intercambio: la otra persona pasa a la silla anterior (o queda sin mesa).
        if (prev) seats[other] = prev;
        else delete seats[other];
      }
      seats[gid] = { table: table.id, seat: target.seat };
      commit({ ...base, seats });
      return;
    }

    for (const id of ids) delete seats[String(id)];
    const used = new Set(Object.values(seats).filter((s) => s.table === table.id).map((s) => s.seat));
    const freeList: number[] = [];
    const start = target.seat ?? 0;
    for (let k = 0; k < table.seats; k++) {
      const i = (start + k) % table.seats;
      if (!used.has(i)) freeList.push(i);
    }
    const fit = ids.slice(0, freeList.length);
    fit.forEach((id, k) => (seats[String(id)] = { table: table.id, seat: freeList[k] }));
    commit({ ...base, seats });
    if (fit.length < ids.length) flash(`No caben todos en ${table.label}: faltan ${ids.length - fit.length} silla(s). Usa “+ Silla”.`);
    else flash(`${ids.length === 1 ? guestById.get(ids[0])?.name : `${ids.length} invitados`} → ${table.label}`);
  }

  function unassign(ids: number[]) {
    const seats = { ...planRef.current.seats };
    for (const id of ids) delete seats[String(id)];
    commit({ ...planRef.current, seats });
  }

  // Arrastre de invitados (lista o silla) con eventos de puntero: funciona con mouse y con el dedo.
  // Los listeners se registran en el mismo pointerdown para no perder toques rápidos.
  const guestDragRef = useRef<GuestDrag | null>(null);
  function startGuestDrag(e: React.PointerEvent, ids: number[], label: string, from: GuestDrag["from"]) {
    if (e.button !== 0 || proposal) return;
    e.stopPropagation();
    const first: GuestDrag = { ids, label, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, active: false, from };
    guestDragRef.current = first;
    setGuestDrag(first);

    const move = (ev: PointerEvent) => {
      const cur = guestDragRef.current;
      if (!cur) return;
      const active = cur.active || Math.hypot(ev.clientX - cur.startX, ev.clientY - cur.startY) > 6;
      guestDragRef.current = { ...cur, x: ev.clientX, y: ev.clientY, active };
      setGuestDrag(guestDragRef.current);
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
    const cancel = () => {
      cleanup();
      guestDragRef.current = null;
      setGuestDrag(null);
    };
    const up = (ev: PointerEvent) => {
      cleanup();
      const d = guestDragRef.current;
      guestDragRef.current = null;
      setGuestDrag(null);
      if (!d) return;
      const moved = d.active || Math.hypot(ev.clientX - d.startX, ev.clientY - d.startY) > 6;
      if (!moved) {
        // Toque: seleccionar para ubicar con el siguiente toque.
        setPicked((p) => (p && p.join() === d.ids.join() ? null : d.ids));
        return;
      }
      const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-seat],[data-table],[data-unassign]");
      if (!el) return;
      if (el.hasAttribute("data-unassign")) return unassign(d.ids);
      const table = el.getAttribute("data-table");
      const seat = el.getAttribute("data-seat");
      if (table) assign(d.ids, { table, seat: seat !== null ? Number(seat) : undefined });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
  }

  // ---------------------------------------------------------------- lienzo: mover, paneo, zoom
  const drag = useRef<
    | { type: "item"; id: string; ox: number; oy: number; base: FloorPlan; moved: boolean; seat: number | null; sx: number; sy: number }
    | { type: "pan"; cx: number; cy: number; view: View; moved: boolean }
    | null
  >(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; view: View } | null>(null);

  const toSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return { x: 0, y: 0 };
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  function itemPointerDown(e: React.PointerEvent, item: FloorItem) {
    if (e.button !== 0) return;
    e.stopPropagation();
    const seatAttr = (e.target as Element).closest("[data-seat]")?.getAttribute("data-seat");
    const p = toSvg(e.clientX, e.clientY);
    drag.current = { type: "item", id: item.id, ox: p.x - item.x, oy: p.y - item.y, base: planRef.current, moved: false, seat: seatAttr != null ? Number(seatAttr) : null, sx: e.clientX, sy: e.clientY };
    svgRef.current?.setPointerCapture(e.pointerId);
  }

  function bgPointerDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    svgRef.current?.setPointerCapture(e.pointerId);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), view };
      drag.current = null;
      return;
    }
    drag.current = { type: "pan", cx: e.clientX, cy: e.clientY, view, moved: false };
  }

  function svgPointerMove(e: React.PointerEvent) {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const factor = pinch.current.dist / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y));
      zoomTo(pinch.current.view, factor);
      return;
    }
    const d = drag.current;
    if (!d) return;
    if (d.type === "item") {
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5) return;
      d.moved = true;
      const p = toSvg(e.clientX, e.clientY);
      const x = Math.max(0, Math.min(plan.width, snap(p.x - d.ox)));
      const y = Math.max(0, Math.min(plan.height, snap(p.y - d.oy)));
      const next = { ...planRef.current, items: planRef.current.items.map((i) => (i.id === d.id ? { ...i, x, y } : i)) };
      planRef.current = next;
      setPlan(next);
    } else {
      const rect = svgRef.current!.getBoundingClientRect();
      const k = d.view.w / rect.width;
      if (Math.hypot(e.clientX - d.cx, e.clientY - d.cy) > 4) d.moved = true;
      setView({ ...d.view, x: d.view.x - (e.clientX - d.cx) * k, y: d.view.y - (e.clientY - d.cy) * k });
    }
  }

  function svgPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.type === "item") {
      if (d.moved) {
        commit(planRef.current, { base: d.base });
        return;
      }
      const item = plan.items.find((i) => i.id === d.id);
      if (picked && item && isTable(item.kind)) {
        assign(picked, { table: item.id, seat: d.seat ?? undefined });
        setPicked(null);
        return;
      }
      setSelected(d.id);
      setMobilePanel("detalle");
    } else if (!d.moved) {
      // En pantallas táctiles el navegador puede "ajustar" el toque al fondo: se busca qué hay bajo el dedo.
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-item]");
      const id = el?.getAttribute("data-item");
      const item = id ? planRef.current.items.find((i) => i.id === id) : undefined;
      if (!item) {
        setSelected(null);
        return;
      }
      if (picked && isTable(item.kind)) {
        const seatEl = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-seat]");
        assign(picked, { table: item.id, seat: seatEl ? Number(seatEl.getAttribute("data-seat")) : undefined });
        setPicked(null);
        return;
      }
      setSelected(item.id);
      setMobilePanel("detalle");
    }
  }

  function zoomTo(base: View, factor: number, center?: { x: number; y: number }) {
    const w = Math.max(400, Math.min(plan.width * 2.5, base.w * factor));
    const h = (base.h / base.w) * w;
    const c = center ?? { x: base.x + base.w / 2, y: base.y + base.h / 2 };
    const rx = (c.x - base.x) / base.w;
    const ry = (c.y - base.y) / base.h;
    setView({ x: c.x - rx * w, y: c.y - ry * h, w, h });
  }

  const fit = useCallback(() => {
    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    const aspect = rect && rect.width > 0 ? rect.height / rect.width : plan.height / plan.width;
    const w = Math.max(plan.width + 80, (plan.height + 80) / aspect);
    const h = w * aspect;
    setView({ x: plan.width / 2 - w / 2, y: plan.height / 2 - h / 2, w, h });
  }, [plan.width, plan.height]);

  useEffect(() => {
    fit();
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = toSvg(e.clientX, e.clientY);
      setView((v) => {
        const factor = Math.exp(e.deltaY * 0.0015);
        const w = Math.max(400, Math.min(plan.width * 2.5, v.w * factor));
        const h = (v.h / v.w) * w;
        const rx = (p.x - v.x) / v.w;
        const ry = (p.y - v.y) / v.h;
        return { x: p.x - rx * w, y: p.y - ry * h, w, h };
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    const ro = new ResizeObserver(() => fit());
    ro.observe(svg);
    return () => {
      svg.removeEventListener("wheel", onWheel);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, plan.items.length > 0]);

  // Teclado: deshacer/rehacer, borrar, mover y rotar el elemento seleccionado.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === "Escape") {
        setPicked(null);
        setSelected(null);
        setMenu(false);
      }
      const item = planRef.current.items.find((i) => i.id === selected);
      if (!item) return;
      const step = e.shiftKey ? 50 : 10;
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[e.key]) {
        e.preventDefault();
        updateItem(item.id, { x: item.x + moves[e.key][0], y: item.y + moves[e.key][1] }, `move-${item.id}`);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeItem(item.id);
      } else if (e.key.toLowerCase() === "r") {
        updateItem(item.id, { r: (item.r + 45) % 360 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---------------------------------------------------------------- propuestas
  function generate(seed = Math.floor(Math.random() * 1e9), n = (proposal?.n ?? 0) + 1) {
    const options = { ...proposalOpts, seed };
    const r = proposeSeating(planRef.current, guests, options);
    setProposal({ ...r, options, n });
    setSelected(null);
    setShowProposalPanel(false);
  }

  function applyProposal() {
    if (!proposal) return;
    commit({ ...planRef.current, seats: proposal.seats });
    flash(`Propuesta #${proposal.n} aplicada · ${proposal.stats.placed} invitados ubicados`);
    setProposal(null);
  }

  function addMissingTables() {
    if (!proposal) return;
    const grown = addTablesFor(planRef.current, proposal.stats.unplaced);
    commit(grown);
    const r = proposeSeating(grown, guests, proposal.options);
    setProposal({ ...r, options: proposal.options, n: proposal.n });
  }

  function startSuggested() {
    const layout = suggestedLayout(seatable.length);
    commit(layout);
    setTimeout(fit, 0);
    flash(`Plano sugerido: ${layout.items.filter((i) => i.kind === "round").length} mesas de 10 para ${seatable.length} invitados`);
  }

  // ---------------------------------------------------------------- lista de invitados
  const q = search
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const listGuests = seatable.filter((g) => {
    const seated = !!plan.seats[String(g.id)];
    if (filter === "sin" && seated) return false;
    if (filter === "ubicados" && !seated) return false;
    if (!q) return true;
    const hay = `${g.name} ${g.invitationName}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    return hay.includes(q);
  });
  const groups = useMemo(() => {
    const m = new Map<number, SeatingGuest[]>();
    for (const g of listGuests) m.set(g.invitationId, [...(m.get(g.invitationId) ?? []), g]);
    return [...m.values()];
  }, [listGuests]);
  const declined = guests.length - guests.filter((g) => isSeatable(g, false)).length;

  const seatLabel = (gid: number) => {
    const s = plan.seats[String(gid)];
    const t = s && tableById.get(s.table);
    if (!t) return null;
    const n = t.label.match(/^Mesa\s+(\d+)$/i)?.[1];
    const short = n ? `M${n}` : t.kind === "head" ? "Novios" : t.label.slice(0, 10);
    return `${short}·${s.seat + 1}`;
  };

  // ---------------------------------------------------------------- render
  const pickedLabel = picked ? (picked.length === 1 ? guestById.get(picked[0])?.name : `${picked.length} invitados`) : null;

  return (
    <div className={`floor-app${guestDrag?.active ? " is-dragging" : ""}`}>
      <div className="floor-head">
        <div>
          <h1>Organización de mesas</h1>
          <p>
            {tables.length} mesas · {totalSeats} sillas · {seatedCount} ubicados · <b>{unseated.length}</b> sin mesa
            {totalSeats < seatable.length ? <span className="floor-warn"> · faltan {seatable.length - totalSeats} sillas</span> : null}
          </p>
        </div>
        <div className="floor-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "plano"} onClick={() => setTab("plano")}>
            Plano 2D
          </button>
          <button type="button" role="tab" aria-selected={tab === "lista"} onClick={() => setTab("lista")}>
            Por mesa
          </button>
        </div>
      </div>

      <div className="floor-toolbar">
        <button type="button" className="adm-btn" onClick={() => addItem("round")}>
          ◯ + Mesa redonda
        </button>
        <button type="button" className="adm-btn" onClick={() => addItem("rect")}>
          ▭ + Mesa rectangular
        </button>
        <div className="floor-menu">
          <button type="button" className="adm-btn" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
            ✨ + Elemento ▾
          </button>
          {menu ? (
            <div className="floor-menu-list" role="menu">
              {(["head", ...DECOR] as FloorKind[]).map((k) => (
                <button key={k} type="button" role="menuitem" onClick={() => addItem(k)}>
                  <span>{KIND_INFO[k].icon}</span>
                  {KIND_INFO[k].label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button type="button" className="adm-btn primary" onClick={() => setShowProposalPanel((s) => !s)} disabled={!tables.length}>
          🔀 Propuesta de ubicación
        </button>
        <span className="floor-spacer" />
        <button type="button" className="adm-btn sm" onClick={undo} disabled={!past.current.length} title="Deshacer (Ctrl+Z)">
          ↶
        </button>
        <button type="button" className="adm-btn sm" onClick={redo} disabled={!future.current.length} title="Rehacer (Ctrl+Shift+Z)">
          ↷
        </button>
        {tab === "plano" ? (
          <>
            <button type="button" className="adm-btn sm" onClick={() => zoomTo(view, 0.8)} aria-label="Acercar">
              ＋
            </button>
            <button type="button" className="adm-btn sm" onClick={() => zoomTo(view, 1.25)} aria-label="Alejar">
              －
            </button>
            <button type="button" className="adm-btn sm" onClick={fit}>
              Ajustar
            </button>
          </>
        ) : (
          <button type="button" className="adm-btn sm" onClick={() => window.print()}>
            🖨 Imprimir
          </button>
        )}
        <span className={`floor-save ${save.status}`} title={save.message}>
          {save.status === "saved" ? "✓ Guardado" : save.status === "saving" ? "Guardando…" : save.status === "dirty" ? "Cambios sin guardar" : "⚠ No se guardó"}
        </span>
      </div>

      {showProposalPanel ? (
        <div className="floor-proposal-panel">
          <div>
            <b>Propuestas aleatorias de ubicación</b>
            <p>Generamos una distribución al azar manteniendo juntos a los grupos de cada invitación. La mesa de novios no se usa. Puedes pedir otra hasta que te guste.</p>
          </div>
          <label className="adm-check">
            <input type="checkbox" checked={proposalOpts.keepExisting} onChange={(e) => setProposalOpts((o) => ({ ...o, keepExisting: e.target.checked }))} />
            Respetar a quienes ya ubicaste
          </label>
          <label className="adm-check">
            <input type="checkbox" checked={proposalOpts.onlyConfirmed} onChange={(e) => setProposalOpts((o) => ({ ...o, onlyConfirmed: e.target.checked }))} />
            Solo confirmados
          </label>
          <div className="adm-seg" role="group" aria-label="Criterio">
            <button type="button" aria-pressed={proposalOpts.mode === "grupos"} className="unk" onClick={() => setProposalOpts((o) => ({ ...o, mode: "grupos" }))}>
              Por grupos y categoría
            </button>
            <button type="button" aria-pressed={proposalOpts.mode === "azar"} className="unk" onClick={() => setProposalOpts((o) => ({ ...o, mode: "azar" }))}>
              Totalmente al azar
            </button>
          </div>
          <button type="button" className="adm-btn primary" onClick={() => generate()}>
            Generar propuesta
          </button>
        </div>
      ) : null}

      <div className="floor-body">
        {/* ------------------------------------------------ invitados */}
        <aside className={`floor-side${mobilePanel === "invitados" ? " is-mobile-open" : ""}`} data-unassign>
          <div className="floor-side-head">
            <input className="adm-input" placeholder="Buscar invitado…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="floor-filter">
              {(
                [
                  ["sin", `Sin mesa (${unseated.length})`],
                  ["ubicados", "Ubicados"],
                  ["todos", "Todos"],
                ] as const
              ).map(([k, l]) => (
                <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>
                  {l}
                </button>
              ))}
            </div>
            <label className="adm-check">
              <input type="checkbox" checked={onlyConfirmed} onChange={(e) => setOnlyConfirmed(e.target.checked)} /> Solo confirmados
            </label>
          </div>
          <div className="floor-guests">
            {groups.length ? (
              groups.map((grp) => {
                const g0 = grp[0];
                const ids = grp.map((g) => g.id);
                return (
                  <div key={g0.invitationId} className="floor-group">
                    <div
                      className={`floor-group-head${picked && picked.join() === ids.join() ? " is-picked" : ""}`}
                      onPointerDown={(e) => startGuestDrag(e, ids, `${g0.invitationName} (${grp.length})`, "list")}
                      title="Arrastra el grupo completo a una mesa"
                    >
                      <span className="grip">⠿</span>
                      <i style={{ background: categoryColor(g0.category) }} />
                      <b>{g0.invitationName}</b>
                      <small>{grp.length}</small>
                    </div>
                    {grp.map((g) => {
                      const label = seatLabel(g.id);
                      return (
                        <div
                          key={g.id}
                          className={`floor-guest${picked?.length === 1 && picked[0] === g.id ? " is-picked" : ""}`}
                          onPointerDown={(e) => startGuestDrag(e, [g.id], g.name, "list")}
                        >
                          <span className="dot" style={{ borderColor: categoryColor(g.category), background: g.rsvp === "yes" ? categoryColor(g.category) : "#fff" }} />
                          <span className="name">{g.name}</span>
                          {g.isChild ? <small className="kid">niño/a</small> : null}
                          {label ? <small className="seat">{label}</small> : null}
                          {label ? (
                            <button type="button" className="adm-icon-btn" onPointerDown={(e) => e.stopPropagation()} onClick={() => unassign([g.id])} title="Quitar de la mesa">
                              ✕
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            ) : (
              <div className="adm-empty">{filter === "sin" ? "¡Todos tienen mesa! 🎉" : "Sin resultados."}</div>
            )}
          </div>
          <div className="floor-side-foot">
            <span>
              <i className="dot solid" /> confirmado
            </span>
            <span>
              <i className="dot" /> pendiente
            </span>
            {declined ? <span>{declined} no asisten (ocultos)</span> : null}
          </div>
        </aside>

        {/* ------------------------------------------------ plano / lista */}
        <section className="floor-stage">
          {picked ? (
            <div className="floor-banner">
              Toca una mesa o una silla para ubicar a <b>{pickedLabel}</b>
              <button type="button" onClick={() => setPicked(null)}>
                Cancelar
              </button>
            </div>
          ) : null}
          {proposal ? (
            <div className="floor-banner proposal">
              <div>
                <b>Propuesta #{proposal.n}</b> · {proposal.stats.placed} ubicados · grupos separados: {proposal.stats.splitGroups} · mesas mixtas: {proposal.stats.mixedTables} ·
                sillas libres: {proposal.stats.freeSeats}
                {proposal.stats.unplaced ? <span className="floor-warn"> · {proposal.stats.unplaced} sin silla</span> : null}
              </div>
              <div className="adm-row-actions">
                {proposal.stats.unplaced ? (
                  <button type="button" className="adm-btn sm" onClick={addMissingTables}>
                    + Agregar mesas que faltan
                  </button>
                ) : null}
                <button type="button" className="adm-btn sm" onClick={() => generate()}>
                  🔀 Otra propuesta
                </button>
                <button type="button" className="adm-btn sm primary" onClick={applyProposal}>
                  ✓ Aplicar
                </button>
                <button type="button" className="adm-btn sm" onClick={() => setProposal(null)}>
                  Descartar
                </button>
              </div>
            </div>
          ) : null}

          {tab === "plano" ? (
            plan.items.length ? (
              <svg
                ref={svgRef}
                className="floor-svg"
                viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
                onPointerDown={bgPointerDown}
                onPointerMove={svgPointerMove}
                onPointerUp={svgPointerUp}
                onPointerCancel={svgPointerUp}
                role="img"
                aria-label="Plano del salón"
              >
                <defs>
                  <pattern id="fp-grid" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path d="M100 0H0V100" fill="none" stroke="#E6E1CF" strokeWidth="2" />
                  </pattern>
                  <pattern id="fp-dance" width="80" height="80" patternUnits="userSpaceOnUse">
                    <rect width="80" height="80" fill="#F4EBD3" />
                    <rect width="40" height="40" fill="#E9DDBD" />
                    <rect x="40" y="40" width="40" height="40" fill="#E9DDBD" />
                  </pattern>
                </defs>
                <rect x={0} y={0} width={plan.width} height={plan.height} rx={24} fill="#FBF9F2" />
                <rect x={0} y={0} width={plan.width} height={plan.height} rx={24} fill="url(#fp-grid)" stroke="#D8D1B8" strokeWidth={4} />

                {[...plan.items]
                  .sort((a, b) => Number(isTable(a.kind)) - Number(isTable(b.kind)))
                  .map((item) =>
                    isTable(item.kind) ? (
                      <TableShape
                        key={item.id}
                        item={item}
                        selected={selected === item.id}
                        targetable={!!picked || !!guestDrag?.active}
                        seatMap={seatMap}
                        guestById={guestById}
                        preview={!!proposal}
                        onPointerDown={(e) => itemPointerDown(e, item)}
                        onSeatPointerDown={(e, gid) => startGuestDrag(e, [gid], guestById.get(gid)?.name ?? "", "seat")}
                      />
                    ) : (
                      <DecorShape key={item.id} item={item} selected={selected === item.id} onPointerDown={(e) => itemPointerDown(e, item)} />
                    ),
                  )}
              </svg>
            ) : (
              <div className="floor-empty">
                <div className="floor-empty-icon">🪑</div>
                <h2>Diseña el salón</h2>
                <p>
                  Empieza con un plano sugerido para <b>{seatable.length} invitados</b> (mesa de novios, pista, DJ, bar, buffet y mesas de 10) o arma el tuyo desde cero con los
                  botones de arriba.
                </p>
                <div className="adm-row-actions" style={{ justifyContent: "center" }}>
                  <button type="button" className="adm-btn primary" onClick={startSuggested}>
                    ✨ Crear plano sugerido
                  </button>
                  <button type="button" className="adm-btn" onClick={() => addItem("round")}>
                    Empezar con una mesa
                  </button>
                </div>
              </div>
            )
          ) : (
            <TableList
              tables={tables}
              seatMap={seatMap}
              guestById={guestById}
              unseated={unseated}
              picked={picked}
              onStartDrag={startGuestDrag}
              onUnassign={unassign}
              onSelect={(id) => {
                setSelected(id);
                setMobilePanel("detalle");
              }}
              onPlace={(table, seat) => {
                if (!picked) return;
                assign(picked, { table, seat });
                setPicked(null);
              }}
            />
          )}
          <div className="floor-hint">
            {tab === "plano"
              ? "Arrastra mesas para moverlas · arrastra invitados a una silla · toca un invitado y luego una mesa · rueda o pellizca para zoom"
              : "Arrastra a una persona a otra mesa o silla para reorganizar · suéltala en la lista para dejarla sin mesa"}
          </div>
        </section>

        {/* ------------------------------------------------ detalle */}
        <aside className={`floor-inspector${mobilePanel === "detalle" ? " is-mobile-open" : ""}`}>
          {selectedItem ? (
            isTable(selectedItem.kind) ? (
              <TableInspector
                item={selectedItem}
                seatMap={seatMap}
                guestById={guestById}
                picked={picked}
                onChange={(patch, key) => updateItem(selectedItem.id, patch, key)}
                onSeats={(d) => changeSeats(selectedItem, d)}
                onRemove={() => removeItem(selectedItem.id)}
                onDuplicate={() => duplicateItem(selectedItem)}
                onClear={() => clearTable(selectedItem.id)}
                onUnassign={(gid) => unassign([gid])}
                onSeatClick={(seat) => {
                  if (picked) {
                    assign(picked, { table: selectedItem.id, seat });
                    setPicked(null);
                  }
                }}
              />
            ) : (
              <DecorInspector
                item={selectedItem}
                onChange={(patch, key) => updateItem(selectedItem.id, patch, key)}
                onRemove={() => removeItem(selectedItem.id)}
                onDuplicate={() => duplicateItem(selectedItem)}
              />
            )
          ) : (
            <Summary tables={tables} seatMap={seatMap} guestById={guestById} seatable={seatable.length} totalSeats={totalSeats} unseated={unseated.length} onSuggest={startSuggested} hasItems={plan.items.length > 0} />
          )}
        </aside>
      </div>

      <div className="floor-mobile-tabs">
        <button type="button" aria-pressed={mobilePanel === "invitados"} onClick={() => setMobilePanel("invitados")}>
          Invitados ({unseated.length} sin mesa)
        </button>
        <button type="button" aria-pressed={mobilePanel === "detalle"} onClick={() => setMobilePanel("detalle")}>
          {selectedItem ? selectedItem.label : "Resumen"}
        </button>
      </div>

      {guestDrag?.active ? (
        <div className="floor-ghost" style={{ left: guestDrag.x, top: guestDrag.y }}>
          🪑 {guestDrag.label}
        </div>
      ) : null}
      {toast ? <div className="floor-toast">{toast}</div> : null}
      {save.status === "error" ? (
        <div className="floor-toast error">
          {save.message}{" "}
          <button type="button" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- formas SVG

function TableShape({
  item,
  selected,
  targetable,
  seatMap,
  guestById,
  preview,
  onPointerDown,
  onSeatPointerDown,
}: {
  item: FloorItem;
  selected: boolean;
  targetable: boolean;
  seatMap: Map<string, number>;
  guestById: Map<number, SeatingGuest>;
  preview: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onSeatPointerDown: (e: React.PointerEvent, gid: number) => void;
}) {
  const { w, h } = itemSize(item);
  const chairs = chairPositions(item);
  const occupied = chairs.filter((_, i) => seatMap.has(`${item.id}:${i}`)).length;
  const full = occupied === item.seats;
  const fill = item.kind === "head" ? "#F3E9CF" : "#FFFFFF";
  return (
    <g
      transform={`translate(${item.x} ${item.y}) rotate(${item.r})`}
      className={`fp-table${selected ? " is-selected" : ""}${targetable ? " is-target" : ""}`}
      data-table={item.id}
      data-item={item.id}
      onPointerDown={onPointerDown}
    >
      {item.kind === "round" ? (
        <circle r={w / 2} fill={fill} className="fp-table-top" />
      ) : (
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill={fill} className="fp-table-top" />
      )}
      {chairs.map((p, i) => {
        const gid = seatMap.get(`${item.id}:${i}`);
        const g = gid !== undefined ? guestById.get(gid) : undefined;
        const color = g ? categoryColor(g.category) : "";
        return (
          <g
            key={i}
            transform={`translate(${p.x} ${p.y}) rotate(${-item.r})`}
            data-table={item.id}
            data-seat={i}
            className={`fp-chair${g ? " is-taken" : ""}${preview && g ? " is-preview" : ""}`}
            onPointerDown={g ? (e) => onSeatPointerDown(e, g.id) : undefined}
          >
            <circle r={CHAIR_R} fill={g ? color : "#FFFFFF"} stroke={g ? color : "#C9C2A8"} strokeWidth={g && g.rsvp !== "yes" ? 3 : 2} strokeDasharray={g && g.rsvp !== "yes" ? "5 4" : undefined} fillOpacity={g && g.rsvp !== "yes" ? 0.7 : 1} />
            {g ? (
              <text textAnchor="middle" dominantBaseline="central" className="fp-initials">
                {initials(g.name)}
              </text>
            ) : (
              <text textAnchor="middle" dominantBaseline="central" className="fp-seatnum">
                {i + 1}
              </text>
            )}
            <title>{g ? `${g.name} · ${g.invitationName}${g.isChild ? " · niño/a" : ""}` : `Silla ${i + 1} libre`}</title>
          </g>
        );
      })}
      <g transform={`rotate(${-item.r})`} pointerEvents="none">
        <text textAnchor="middle" y={item.kind === "round" ? -6 : -4} className="fp-label">
          {item.label}
        </text>
        <text textAnchor="middle" y={item.kind === "round" ? 22 : 22} className={`fp-count${full ? " full" : ""}`}>
          {occupied}/{item.seats}
        </text>
      </g>
    </g>
  );
}

function DecorShape({ item, selected, onPointerDown }: { item: FloorItem; selected: boolean; onPointerDown: (e: React.PointerEvent) => void }) {
  const kind = item.kind as DecorKind;
  const dark = kind === "dj" || kind === "bar" || kind === "entrance";
  const round = kind === "cake" || kind === "plant";
  return (
    <g transform={`translate(${item.x} ${item.y}) rotate(${item.r})`} className={`fp-decor${selected ? " is-selected" : ""}`} data-item={item.id} onPointerDown={onPointerDown}>
      {round ? (
        <circle r={Math.min(item.w, item.h) / 2} fill={DECOR_FILL[kind]} className="fp-decor-shape" />
      ) : (
        <rect x={-item.w / 2} y={-item.h / 2} width={item.w} height={item.h} rx={kind === "dance" ? 18 : 12} fill={DECOR_FILL[kind]} className="fp-decor-shape" />
      )}
      <g transform={`rotate(${-item.r})`} pointerEvents="none">
        <text textAnchor="middle" y={Math.min(item.h, item.w) > 120 ? -8 : -2} className="fp-decor-icon">
          {KIND_INFO[kind].icon}
        </text>
        {Math.min(item.w, item.h) >= 80 || kind === "dance" ? (
          <text textAnchor="middle" y={Math.min(item.h, item.w) > 120 ? 34 : 30} className={`fp-decor-label${dark ? " light" : ""}`}>
            {item.label}
          </text>
        ) : null}
      </g>
    </g>
  );
}

// ---------------------------------------------------------------- paneles

function Stepper({ label, value, onMinus, onPlus, big }: { label: string; value: number | string; onMinus: () => void; onPlus: () => void; big?: boolean }) {
  return (
    <div className={`floor-stepper${big ? " big" : ""}`}>
      <button type="button" onClick={onMinus} aria-label={`Menos ${label}`}>
        −
      </button>
      <div>
        <b>{value}</b>
        <small>{label}</small>
      </div>
      <button type="button" onClick={onPlus} aria-label={`Más ${label}`}>
        +
      </button>
    </div>
  );
}

function TableInspector({
  item,
  seatMap,
  guestById,
  picked,
  onChange,
  onSeats,
  onRemove,
  onDuplicate,
  onClear,
  onUnassign,
  onSeatClick,
}: {
  item: FloorItem;
  seatMap: Map<string, number>;
  guestById: Map<number, SeatingGuest>;
  picked: number[] | null;
  onChange: (patch: Partial<FloorItem>, key?: string) => void;
  onSeats: (delta: number) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onClear: () => void;
  onUnassign: (gid: number) => void;
  onSeatClick: (seat: number) => void;
}) {
  return (
    <div className="floor-panel">
      <div className="floor-panel-title">
        <span>{KIND_INFO[item.kind].icon}</span> {KIND_INFO[item.kind].label}
      </div>
      <input className="adm-input" value={item.label} onChange={(e) => onChange({ label: e.target.value }, `label-${item.id}`)} aria-label="Nombre de la mesa" />
      <Stepper big label="sillas" value={item.seats} onMinus={() => onSeats(-1)} onPlus={() => onSeats(1)} />
      {item.kind !== "head" ? (
        <div className="adm-seg" role="group" aria-label="Forma">
          <button type="button" className="unk" aria-pressed={item.kind === "round"} onClick={() => onChange({ kind: "round" })}>
            ◯ Redonda
          </button>
          <button type="button" className="unk" aria-pressed={item.kind === "rect"} onClick={() => onChange({ kind: "rect" })}>
            ▭ Rectangular
          </button>
        </div>
      ) : null}
      <div className="floor-seat-list">
        {Array.from({ length: item.seats }, (_, i) => {
          const gid = seatMap.get(`${item.id}:${i}`);
          const g = gid !== undefined ? guestById.get(gid) : undefined;
          return (
            <div key={i} className={`floor-seat-row${g ? "" : " free"}${picked && !g ? " targetable" : ""}`} data-table={item.id} data-seat={i} onClick={() => onSeatClick(i)}>
              <span className="n">{i + 1}</span>
              {g ? (
                <>
                  <i style={{ background: categoryColor(g.category) }} />
                  <span className="who">
                    {g.name}
                    {g.invitationName !== g.name ? <small>con {g.invitationName}</small> : null}
                  </span>
                  <button type="button" className="adm-icon-btn" onClick={() => onUnassign(g.id)} title="Quitar de la mesa">
                    ✕
                  </button>
                </>
              ) : (
                <span className="who muted">{picked ? "Tocar para ubicar aquí" : "Libre"}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="adm-row-actions">
        <button type="button" className="adm-btn sm" onClick={() => onChange({ r: (item.r + 45) % 360 })}>
          ⟳ Rotar
        </button>
        <button type="button" className="adm-btn sm" onClick={onDuplicate}>
          Duplicar
        </button>
        <button type="button" className="adm-btn sm" onClick={onClear}>
          Vaciar
        </button>
        <button type="button" className="adm-btn sm danger" onClick={onRemove}>
          Eliminar
        </button>
      </div>
    </div>
  );
}

function DecorInspector({
  item,
  onChange,
  onRemove,
  onDuplicate,
}: {
  item: FloorItem;
  onChange: (patch: Partial<FloorItem>, key?: string) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div className="floor-panel">
      <div className="floor-panel-title">
        <span>{KIND_INFO[item.kind].icon}</span> {KIND_INFO[item.kind].label}
      </div>
      <input className="adm-input" value={item.label} onChange={(e) => onChange({ label: e.target.value }, `label-${item.id}`)} aria-label="Nombre" />
      <Stepper label="ancho (cm)" value={item.w} onMinus={() => onChange({ w: Math.max(40, item.w - 20) }, `w-${item.id}`)} onPlus={() => onChange({ w: item.w + 20 }, `w-${item.id}`)} />
      <Stepper label="fondo (cm)" value={item.h} onMinus={() => onChange({ h: Math.max(40, item.h - 20) }, `h-${item.id}`)} onPlus={() => onChange({ h: item.h + 20 }, `h-${item.id}`)} />
      <div className="adm-row-actions">
        <button type="button" className="adm-btn sm" onClick={() => onChange({ r: (item.r + 45) % 360 })}>
          ⟳ Rotar
        </button>
        <button type="button" className="adm-btn sm" onClick={onDuplicate}>
          Duplicar
        </button>
        <button type="button" className="adm-btn sm danger" onClick={onRemove}>
          Eliminar
        </button>
      </div>
    </div>
  );
}

function Summary({
  tables,
  seatMap,
  guestById,
  seatable,
  totalSeats,
  unseated,
  onSuggest,
  hasItems,
}: {
  tables: FloorItem[];
  seatMap: Map<string, number>;
  guestById: Map<number, SeatingGuest>;
  seatable: number;
  totalSeats: number;
  unseated: number;
  onSuggest: () => void;
  hasItems: boolean;
}) {
  const byCat = new Map<string, number>();
  const mixed = tables.filter((t) => {
    const cats = new Set<string>();
    for (let i = 0; i < t.seats; i++) {
      const g = guestById.get(seatMap.get(`${t.id}:${i}`) ?? -1);
      if (g) {
        cats.add(g.category);
        byCat.set(g.category, (byCat.get(g.category) ?? 0) + 1);
      }
    }
    return cats.size > 1;
  }).length;
  return (
    <div className="floor-panel">
      <div className="floor-panel-title">Resumen</div>
      <div className="floor-kpis">
        <div>
          <b>{tables.length}</b>
          <small>mesas</small>
        </div>
        <div>
          <b>{totalSeats}</b>
          <small>sillas</small>
        </div>
        <div>
          <b>{seatable - unseated}</b>
          <small>ubicados</small>
        </div>
        <div className={unseated ? "warn" : "ok"}>
          <b>{unseated}</b>
          <small>sin mesa</small>
        </div>
      </div>
      {totalSeats < seatable ? <p className="floor-warn">Faltan {seatable - totalSeats} sillas para todos los invitados. Agrega mesas o usa “+ Silla”.</p> : null}
      {mixed ? <p className="adm-subtle">{mixed} mesa(s) mezclan categorías.</p> : null}
      <div className="floor-legend">
        {Object.entries(CATEGORY_COLOR).map(([c, col]) => (
          <span key={c}>
            <i style={{ background: col }} />
            {c}
            {byCat.get(c) ? ` · ${byCat.get(c)}` : ""}
          </span>
        ))}
        <span>
          <i className="dashed" />
          Pendiente de confirmar
        </span>
      </div>
      <div className="floor-tips">
        <b>Cómo usarlo</b>
        <ul>
          <li>Toca una mesa para cambiar su nombre, forma y sillas (+ / −).</li>
          <li>Arrastra invitados o grupos completos desde la lista a una mesa o silla.</li>
          <li>Arrastra a alguien sentado a otra silla para intercambiar lugares.</li>
          <li>“Propuesta de ubicación” genera distribuciones al azar que respetan los grupos.</li>
          <li>Ctrl+Z deshace · flechas mueven · R rota · Supr elimina.</li>
        </ul>
      </div>
      {!hasItems ? (
        <button type="button" className="adm-btn primary" onClick={onSuggest}>
          ✨ Crear plano sugerido
        </button>
      ) : null}
    </div>
  );
}

function TableList({
  tables,
  seatMap,
  guestById,
  unseated,
  picked,
  onStartDrag,
  onUnassign,
  onSelect,
  onPlace,
}: {
  tables: FloorItem[];
  seatMap: Map<string, number>;
  guestById: Map<number, SeatingGuest>;
  unseated: SeatingGuest[];
  picked: number[] | null;
  onStartDrag: (e: React.PointerEvent, ids: number[], label: string, from: "list" | "seat") => void;
  onUnassign: (ids: number[]) => void;
  onSelect: (id: string) => void;
  onPlace: (table: string, seat?: number) => void;
}) {
  return (
    <div className="floor-list">
      {tables.map((t) => {
        const occupied = Array.from({ length: t.seats }, (_, i) => seatMap.get(`${t.id}:${i}`)).filter((x) => x !== undefined).length;
        return (
          <div key={t.id} className={`floor-list-card${picked ? " is-target" : ""}`} data-table={t.id} onClick={() => (picked ? onPlace(t.id) : onSelect(t.id))}>
            <div className="floor-list-head">
              <b>{t.label}</b>
              <small className={occupied === t.seats ? "full" : ""}>
                {occupied}/{t.seats}
              </small>
            </div>
            {Array.from({ length: t.seats }, (_, i) => {
              const gid = seatMap.get(`${t.id}:${i}`);
              const g = gid !== undefined ? guestById.get(gid) : undefined;
              return (
                <div
                  key={i}
                  className={`floor-list-row${g ? "" : " free"}`}
                  data-table={t.id}
                  data-seat={i}
                  onPointerDown={g ? (e) => onStartDrag(e, [g.id], g.name, "seat") : undefined}
                  onClick={(e) => {
                    if (!picked) return;
                    e.stopPropagation();
                    onPlace(t.id, i);
                  }}
                >
                  <span className="n">{i + 1}</span>
                  {g ? (
                    <>
                      <i style={{ background: categoryColor(g.category) }} />
                      <span className="who">{g.name}</span>
                      {g.isChild ? <small className="kid">niño/a</small> : null}
                      <button
                        type="button"
                        className="adm-icon-btn no-print"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnassign([g.id]);
                        }}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span className="who muted">—</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
      {unseated.length ? (
        <div className="floor-list-card unseated no-print" data-unassign>
          <div className="floor-list-head">
            <b>Sin mesa</b>
            <small>{unseated.length}</small>
          </div>
          {unseated.map((g) => (
            <div key={g.id} className="floor-list-row" onPointerDown={(e) => onStartDrag(e, [g.id], g.name, "list")}>
              <i style={{ background: categoryColor(g.category) }} />
              <span className="who">{g.name}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
