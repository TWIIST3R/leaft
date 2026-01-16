import Link from "next/link";
import { ReactNode } from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";

const navigation = [
  { label: "Rémunération", href: "/dashboard", badge: "En cours" },
  { label: "Campagnes", href: "/dashboard/campaigns" },
  { label: "Compétences", href: "/dashboard/skills" },
  { label: "Entretiens", href: "/dashboard/reviews" },
  { label: "Objectifs", href: "/dashboard/objectives" },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Note: The middleware already handles subscription checks for dashboard routes
  // We don't need to check again here to avoid conflicts and double redirects
  // If the middleware allowed access, we can trust it

  return (
    <div className="flex min-h-screen bg-[#f7f9f7] text-[var(--text)]">
      <aside className="hidden w-64 border-r border-[#e2e7e2] bg-white/90 px-6 py-8 lg:flex lg:flex-col lg:backdrop-blur">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-[var(--text)]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-white">
            L
          </span>
          Leaft Dashboard
        </Link>
        <div className="mt-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.4)]">Navigation</p>
          <nav className="mt-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-[color:rgba(11,11,11,0.75)] transition hover:bg-[var(--brand)]/10 hover:text-[var(--brand)]"
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto space-y-3 rounded-2xl border border-[var(--brand)]/15 bg-[var(--brand)]/8 p-4 text-xs text-[color:rgba(11,11,11,0.6)]">
          <p className="font-semibold text-[var(--brand)]">Campagne Q1</p>
          <p>Suivez la complétion des revues salariales et invitez vos managers à valider leurs propositions.</p>
          <Link
            href="/dashboard/campaigns"
            className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
          >
            Ouvrir la campagne
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-[#e2e7e2] bg-white/85 px-6 py-4 backdrop-blur">
          <DashboardTopbar />
        </header>
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

