import Link from "next/link";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { checkSubscriptionAccess } from "@/lib/subscription-check";

// Structure dashboard admin : Accueil, Talents, Grilles de salaire (départements + grilles), Paramétrage
const navigation = [
  { label: "Accueil", href: "/dashboard" },
  { label: "Talents", href: "/dashboard/talents" },
  { label: "Grilles de salaire", href: "/dashboard/grilles" },
  { label: "Paramétrage", href: "/dashboard/parametres" },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Check subscription access
  // Get userId and orgId from auth (convert null to undefined)
  const { userId, orgId } = await auth();
  const subscriptionCheck = await checkSubscriptionAccess(userId ?? undefined, orgId ?? undefined);

  // If not authenticated, redirect to sign-in (middleware should handle this, but just in case)
  if (!subscriptionCheck.hasAccess && subscriptionCheck.reason === "not_authenticated") {
    redirect("/sign-in");
  }

  // If organization not found, redirect to onboarding
  if (!subscriptionCheck.hasAccess && subscriptionCheck.reason === "organization_not_found") {
    redirect("/onboarding");
  }

  // If no subscription, redirect to onboarding (user needs to complete setup)
  if (!subscriptionCheck.hasAccess && subscriptionCheck.reason === "no_subscription") {
    redirect("/onboarding");
  }

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
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto space-y-3 rounded-2xl border border-[var(--brand)]/15 bg-[var(--brand)]/8 p-4 text-xs text-[color:rgba(11,11,11,0.6)]">
          <p className="font-semibold text-[var(--brand)]">Transparence salariale</p>
          <p>Conformité avec la loi : activez l’option dans Paramétrage pour que les managers et talents puissent consulter les rémunérations.</p>
          <Link
            href="/dashboard/parametres"
            className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
          >
            Paramétrage
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

