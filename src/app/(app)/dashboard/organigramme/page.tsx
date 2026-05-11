import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { OrganigrammeFlow } from "@/components/organigramme/organigramme-flow";

async function getData() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = supabaseAdmin();
  let organizationId: string | null = null;

  if (orgId) {
    const { data } = await supabase.from("organizations").select("id").eq("clerk_organization_id", orgId).single();
    if (data) organizationId = data.id;
  }
  if (!organizationId) {
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("organization_id")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    organizationId = userOrg?.organization_id ?? null;
  }
  if (!organizationId) redirect("/onboarding");

  const [{ data: employees }, { data: departments }, { data: org }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, first_name, last_name, current_job_title, current_department_id, manager_id, avatar_url, annual_salary_brut")
      .eq("organization_id", organizationId)
      .order("last_name"),
    supabase.from("departments").select("id, name").eq("organization_id", organizationId),
    supabase.from("organizations").select("logo_url").eq("id", organizationId).single(),
  ]);

  return {
    employees: employees ?? [],
    departments: departments ?? [],
    companyLogoUrl: org?.logo_url ?? null,
  };
}

export default async function OrganigrammePage() {
  const data = await getData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Organigramme</h1>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Vue hiérarchique de votre organisation, construite à partir des liens managériaux.
        </p>
      </div>
      <OrganigrammeFlow
        employees={data.employees}
        departments={data.departments}
        salaryVisible
        companyLogoUrl={data.companyLogoUrl}
      />
    </div>
  );
}
