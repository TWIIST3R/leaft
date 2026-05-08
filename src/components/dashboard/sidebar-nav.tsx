"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const navigation = [
  { label: "Accueil", href: "/dashboard" },
  { label: "Talents", href: "/dashboard/talents" },
  { label: "Grilles de salaire", href: "/dashboard/grilles" },
  { label: "Entretiens", href: "/dashboard/entretiens" },
  { label: "Statistiques", href: "/dashboard/statistiques" },
  { label: "Organigramme", href: "/dashboard/organigramme" },
  { label: "Facturation", href: "/dashboard/parametres#facturation" },
  { label: "Paramétrage", href: "/dashboard/parametres" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [pendingRdvCount, setPendingRdvCount] = useState<number>(0);

  useEffect(() => {
    fetch("/api/meeting-requests?admin=true")
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d)) return;
        // Group by group_id to avoid counting RH+Manager parts twice
        const grouped = new Map<string, { status: string }>();
        d.forEach((row: any) => {
          const gid = row.group_id || row.id;
          if (!grouped.has(gid)) grouped.set(gid, { status: row.status });
          else {
            // pending dominates unless any declined exists
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
            {item.href === "/dashboard/entretiens" && pendingRdvCount > 0 && (
              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-900">
                {pendingRdvCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
