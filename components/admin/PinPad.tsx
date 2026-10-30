"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { loginAction } from "@/app/admin/actions";

export function PinPad() {
  const [pin, setPin] = useState("");
  const [state, action, pending] = useActionState(loginAction, null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!state?.error) return;
    setPin("");
    setShake(true);
    const t = setTimeout(() => setShake(false), 450);
    return () => clearTimeout(t);
  }, [state]);

  useEffect(() => {
    if (pin.length !== 4) return;
    const fd = new FormData();
    fd.set("pin", pin);
    startTransition(() => action(fd));
  }, [pin, action]);

  const press = (d: string) => {
    if (pending) return;
    setPin((p) => (p.length < 4 ? p + d : p));
  };
  const back = () => setPin((p) => p.slice(0, -1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div>
      <div className={`adm-dots${shake ? " shake" : ""}`} aria-label={`${pin.length} de 4 dígitos`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < pin.length ? "on" : undefined} />
        ))}
      </div>
      <div className="adm-login-error" role="alert">
        {pending ? "Verificando…" : (state?.error ?? "")}
      </div>
      <div className="adm-keys">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" onClick={() => press(d)}>
            {d}
          </button>
        ))}
        <button type="button" className="ghost" onClick={() => setPin("")}>
          Borrar
        </button>
        <button type="button" onClick={() => press("0")}>
          0
        </button>
        <button type="button" className="ghost" onClick={back} aria-label="Borrar último dígito">
          ⌫
        </button>
      </div>
    </div>
  );
}
