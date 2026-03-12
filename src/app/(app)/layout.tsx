import Link from "next/link";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { checkSubscriptionAccess } from "@/lib/subscription-check";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function getOrgName(orgId?: string | null, userId?: string | null): Promise<string> {
  if (!userId) return "";
  const supabase = supabaseAdmin();
  if (orgId) {
    const { data } = await supabase
      .from("organizations")
      .select("name")
      .eq("clerk_organization_id", orgId)
      .single();
    if (data?.name) return data.name;
  }
  const { data: userOrg } = await supabase
    .from("user_organizations")
    .select("organizations(name)")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  return (userOrg as { organizations?: { name?: string } })?.organizations?.name ?? "";
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { userId, orgId } = await auth();
  const subscriptionCheck = await checkSubscriptionAccess(userId ?? undefined, orgId ?? undefined);

  if (!subscriptionCheck.hasAccess && subscriptionCheck.reason === "not_authenticated") {
    redirect("/sign-in");
  }

  if (!subscriptionCheck.hasAccess && subscriptionCheck.reason === "organization_not_found") {
    redirect("/onboarding");
  }

  if (!subscriptionCheck.hasAccess && subscriptionCheck.reason === "no_subscription") {
    redirect("/onboarding");
  }

  const orgName = await getOrgName(orgId, userId);

  return (
    <div className="flex min-h-screen bg-[#f7f9f7] text-[var(--text)]">
      <aside className="hidden w-64 border-r border-[#e2e7e2] bg-white/90 px-6 py-8 lg:flex lg:flex-col lg:backdrop-blur">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-white">
            L
          </span>
          <span className="text-xs font-medium text-[color:rgba(11,11,11,0.45)]">Leaft</span>
        </Link>
        {orgName && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#e2e7e2] bg-[#f8faf8] px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/15 text-sm font-bold text-[var(--brand)]">
              {orgName.charAt(0).toUpperCase()}
            </span>
            <span className="truncate text-sm font-semibold text-[var(--text)]">{orgName}</span>
          </div>
        )}
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.4)]">Navigation</p>
          <SidebarNav />
        </div>
        <div className="mt-auto space-y-3 rounded-2xl border border-[var(--brand)]/15 bg-[var(--brand)]/8 p-4 text-xs text-[color:rgba(11,11,11,0.6)]">
          <p className="font-semibold text-[var(--brand)]">Transparence salariale</p>
          <p>Conformité avec la loi : activez l&apos;option dans Paramétrage pour que les managers et talents puissent consulter les rémunérations.</p>
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
