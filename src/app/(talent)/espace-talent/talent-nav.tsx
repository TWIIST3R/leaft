"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/espace-talent", label: "Mon profil", exact: true },
  { href: "/espace-talent/simulateur", label: "Simulateur", exact: false },
  { href: "/espace-talent/organigramme", label: "Organigramme", exact: false },
];

export function TalentNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-3 space-y-1">
      {LINKS.map((link) => {
        const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                : "text-[color:rgba(11,11,11,0.6)] hover:bg-[#f8faf8] hover:text-[var(--text)]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
