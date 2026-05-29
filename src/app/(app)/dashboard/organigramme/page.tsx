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

export default async function OrganigrammePage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");

  const organizationId = await getOrganizationId(userId, orgId ?? null);
  if (!organizationId) redirect("/onboarding");

  const data = await loadOrganigrammeForOrganization(organizationId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Organigramme</h1>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Vue hiérarchique de votre organisation, construite à partir des liens managériaux.
          {data.salaryVisible && data.salaryDisclosureMode === "department_average" && (
            <span className="mt-1 block text-[var(--brand)]">
              Rémunérations affichées en moyenne par département (mode transparence actif).
            </span>
          )}
        </p>
      </div>
      <OrganigrammeFlow
        employees={data.employees}
        departments={data.departments}
        salaryVisible={data.salaryVisible}
        salaryDisclosureMode={data.salaryDisclosureMode}
        departmentAverages={data.departmentAverages}
        companyLogoUrl={data.companyLogoUrl}
      />
    </div>
  );
}
