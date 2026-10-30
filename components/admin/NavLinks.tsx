"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/invitados", label: "Invitados" },
  { href: "/admin/actividad", label: "Actividad y comentarios" },
  { href: "/admin/asesoras", label: "Asesoras IA" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="adm-nav">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
