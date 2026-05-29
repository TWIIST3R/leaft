"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "@/components/navigation/nav-link";
import { useEffect, useMemo, useState } from "react";

const navigation = [
  { label: "Accueil", href: "/dashboard", tourId: null as string | null },
  { label: "Talents", href: "/dashboard/talents", tourId: "rh-nav-talents" },
  { label: "Grilles de salaire", href: "/dashboard/grilles", tourId: "rh-nav-grilles" },
  { label: "Entretiens", href: "/dashboard/entretiens", tourId: "rh-nav-entretiens" },
  { label: "Statistiques", href: "/dashboard/statistiques", tourId: null },
  { label: "Organigramme", href: "/dashboard/organigramme", tourId: "rh-nav-organigramme" },
  { label: "Facturation", href: "/dashboard/parametres#facturation", tourId: null },
  { label: "Paramétrage", href: "/dashboard/parametres", tourId: "rh-nav-parametres" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [pendingRdvCount, setPendingRdvCount] = useState<number>(0);

  const navItems = useMemo(() => navigation, []);

  useEffect(() => {
    fetch("/api/meeting-requests?admin=true")
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d)) return;
        const grouped = new Map<string, { status: string }>();
        d.forEach((row: { group_id?: string; id: string; status: string }) => {
          const gid = row.group_id || row.id;
          if (!grouped.has(gid)) grouped.set(gid, { status: row.status });
          else {
            const current = grouped.get(gid)!;
            if (row.status === "declined") current.status = "declined";
            else if (row.status === "pending" && current.status !== "declined") current.status = "pending";
          }
        });
        const count = Array.from(grouped.values()).filter((x) => x.status === "pending").length;
        setPendingRdvCount(count);
      })
      .catch(() => {});
  }, []);

  return (
    <nav className="mt-3 space-y-1">
      {navItems.map((item) => {
        const pathOnly = item.href.split("#")[0]!;
        const isActive =
          pathOnly === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(pathOnly);

        return (
          <NavLink
            key={item.href}
            href={item.href}
            data-tour={item.tourId ?? undefined}
            className={`flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                : "text-[color:rgba(11,11,11,0.75)] hover:bg-[var(--brand)]/5 hover:text-[var(--brand)]"
            }`}
          >
            <span>{item.label}</span>
            {pathOnly === "/dashboard/entretiens" && pendingRdvCount > 0 && (
              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-900">
                {pendingRdvCount}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
