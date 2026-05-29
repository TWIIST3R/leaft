import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { OrganigrammeFlow } from "@/components/organigramme/organigramme-flow";
import { loadOrganigrammeForOrganization } from "@/lib/organization/load-organigramme-data";

async function getOrganizationId(userId: string, orgId: string | null) {
  const supabase = supabaseAdmin();
  if (orgId) {
    const { data } = await supabase.from("organizations").select("id").eq("clerk_organization_id", orgId).single();
    if (data) return data.id;
  }
  const { data: userOrg } = await supabase
    .from("user_organizations")
    .select("organization_id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  return userOrg?.organization_id ?? null;
}

export default async function TalentOrganigrammePage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");

  const organizationId = await getOrganizationId(userId, orgId ?? null);
  if (!organizationId) {
    return (
      <div className="rounded-3xl border border-[#e2e7e2] bg-white p-8 text-center shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <p className="text-sm text-[color:rgba(11,11,11,0.65)]">Profil non configuré.</p>
      </div>
    );
  }

  const supabase = supabaseAdmin();
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("clerk_user_id", userId)
    .single();

  const data = await loadOrganigrammeForOrganization(organizationId);

  return (
    <div className="space-y-8">
      <div data-tour="talent-organigramme-header">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Organigramme</h1>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Vue hiérarchique de votre organisation — filtres équipe et chaîne managériale disponibles.
        </p>
      </div>
      <div>
        <OrganigrammeFlow
          employees={data.employees}
          departments={data.departments}
          currentEmployeeId={employee?.id ?? null}
          salaryVisible={data.salaryVisible}
          salaryDisclosureMode={data.salaryDisclosureMode}
          departmentAverages={data.departmentAverages}
          companyLogoUrl={data.companyLogoUrl}
        />
      </div>
    </div>
  );
}
