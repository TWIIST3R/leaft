"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "@/components/navigation/nav-link";

const BASE_LINKS = [
  { href: "/espace-talent", label: "Mon profil", exact: true, tourId: "talent-nav-profil" },
  { href: "/espace-talent/comparatif", label: "Comparatif", exact: false, tourId: "talent-nav-comparatif" },
  { href: "/espace-talent/simulateur", label: "Simulateur", exact: false, tourId: "talent-nav-simulateur" },
  { href: "/espace-talent/organigramme", label: "Organigramme", exact: false, tourId: "talent-nav-organigramme" },
];

export function TalentNav({ isManager = false }: { isManager?: boolean }) {
  const pathname = usePathname();

  const links = isManager
    ? [...BASE_LINKS, { href: "/espace-talent/mon-equipe", label: "Mon equipe", exact: false, tourId: undefined }]
    : BASE_LINKS;

  return (
    <nav className="mt-3 space-y-1">
      {links.map((link) => {
        const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <NavLink
            key={link.href}
            href={link.href}
            data-tour={link.tourId}
            className={`flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                : "text-[color:rgba(11,11,11,0.6)] hover:bg-[#f8faf8] hover:text-[var(--text)]"
            }`}
          >
            {link.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
