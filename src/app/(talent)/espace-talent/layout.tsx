import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { TalentNav } from "./talent-nav";

async function getEmployeeInfo(userId: string, orgId: string | null, userEmail: string | null) {
  const supabase = supabaseAdmin();
  let organizationId: string | null = null;
  let orgName = "";
  let orgLogo: string | null = null;

  if (orgId) {
    const { data } = await supabase.from("organizations").select("id, name, logo_url").eq("clerk_organization_id", orgId).single();
    if (data) {
      organizationId = data.id;
      orgName = data.name;
      orgLogo = data.logo_url;
    }
  }
  if (!organizationId) {
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("organization_id, organizations(name, logo_url)")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    if (userOrg?.organization_id) {
      organizationId = userOrg.organization_id;
      const org = userOrg.organizations as { name?: string; logo_url?: string } | null;
      orgName = org?.name ?? "";
      orgLogo = org?.logo_url ?? null;
    }
  }

  if (!organizationId) return { orgName: "", orgLogo: null, employee: null };

  let { data: emp } = await supabase
    .from("employees")
    .select("id, first_name, last_name, current_job_title, email, is_manager")
    .eq("organization_id", organizationId)
    .eq("clerk_user_id", userId)
    .single();

  if (!emp && userEmail) {
    const { data: empByEmail } = await supabase
      .from("employees")
      .select("id, first_name, last_name, current_job_title, email, is_manager")
      .eq("organization_id", organizationId)
      .ilike("email", userEmail.trim())
      .maybeSingle();
    if (empByEmail) {
      await supabase.from("employees").update({ clerk_user_id: userId }).eq("id", empByEmail.id);
      emp = empByEmail;
    }
  }

  return { orgName, orgLogo, employee: emp };
}

export default async function TalentSpaceLayout({ children }: { children: ReactNode }) {
  const { userId, orgId } = await auth();
  const user = await currentUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const info = userId ? await getEmployeeInfo(userId, orgId ?? null, userEmail) : { orgName: "", orgLogo: null, employee: null };

  return (
    <div className="flex min-h-screen bg-[#f7f9f7] text-[var(--text)]">
      <aside className="hidden w-64 border-r border-[#e2e7e2] bg-white/90 px-6 py-8 lg:flex lg:flex-col lg:backdrop-blur">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/brand/logo-dark.png" width={100} height={40} alt="Leaft" />
        </Link>

        {info.orgName && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#e2e7e2] bg-[#f8faf8] px-3 py-2.5">
            {info.orgLogo ? (
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                <Image src={info.orgLogo} alt={info.orgName} fill className="object-contain" unoptimized />
              </div>
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/15 text-sm font-bold text-[var(--brand)]">
                {info.orgName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate text-sm font-semibold text-[var(--text)]">{info.orgName}</span>
          </div>
        )}

        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.4)]">Mon espace</p>
          <TalentNav isManager={info.employee?.is_manager ?? false} />
        </div>

        {info.employee && (
          <div className="mt-auto rounded-2xl border border-[var(--brand)]/15 bg-[var(--brand)]/8 p-4 text-xs text-[color:rgba(11,11,11,0.6)]">
            <p className="font-semibold text-[var(--brand)]">{info.employee.first_name} {info.employee.last_name}</p>
            <p className="mt-1">{info.employee.current_job_title}</p>
          </div>
        )}
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-[#e2e7e2] bg-white/85 px-4 py-4 backdrop-blur sm:px-6">
          <DashboardTopbar mode="talent" />
          <div className="mt-3 border-t border-[#e2e7e2] pt-3 lg:hidden">
            <TalentNav isManager={info.employee?.is_manager ?? false} />
          </div>
        </header>
        <main className="flex-1 px-3 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
