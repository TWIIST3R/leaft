"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Accueil", href: "/dashboard" },
  { label: "Talents", href: "/dashboard/talents" },
  { label: "Grilles de salaire", href: "/dashboard/grilles" },
  { label: "Paramétrage", href: "/dashboard/parametres" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-3 space-y-1">
      {navigation.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                : "text-[color:rgba(11,11,11,0.75)] hover:bg-[var(--brand)]/5 hover:text-[var(--brand)]"
            }`}
          >
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
