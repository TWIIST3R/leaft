import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { TalentOrganigrammeClient } from "./talent-organigramme-client";

async function getData(userId: string, orgId: string | null) {
  const supabase = supabaseAdmin();
  let organizationId: string | null = null;
  let salaryVisible = false;

  if (orgId) {
    const { data } = await supabase
      .from("organizations")
      .select("id, salary_transparency_enabled")
      .eq("clerk_organization_id", orgId)
      .single();
    if (data) {
      organizationId = data.id;
      salaryVisible = data.salary_transparency_enabled ?? false;
    }
  }
  if (!organizationId) {
    const { data: userOrg } = await supabase.from("user_organizations").select("organization_id").eq("clerk_user_id", userId).maybeSingle();
    organizationId = userOrg?.organization_id ?? null;
  }
  if (!organizationId) return null;
  if (!orgId) {
    const { data: org } = await supabase
      .from("organizations")
      .select("salary_transparency_enabled")
      .eq("id", organizationId)
      .single();
    salaryVisible = org?.salary_transparency_enabled ?? false;
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("clerk_user_id", userId)
    .single();

  const [{ data: employees }, { data: departments }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, first_name, last_name, current_job_title, current_department_id, manager_id, avatar_url, annual_salary_brut")
      .eq("organization_id", organizationId)
      .order("last_name"),
    supabase.from("departments").select("id, name").eq("organization_id", organizationId),
  ]);

  return {
    employees: employees ?? [],
    departments: departments ?? [],
    currentEmployeeId: employee?.id ?? null,
    salaryVisible,
  };
}

export default async function TalentOrganigrammePage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");

  const data = await getData(userId, orgId ?? null);
  if (!data) {
    return (
      <div className="rounded-3xl border border-[#e2e7e2] bg-white p-8 text-center shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <p className="text-sm text-[color:rgba(11,11,11,0.65)]">Profil non configuré.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Organigramme</h1>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Vue hiérarchique de votre organisation.
        </p>
      </div>
      <TalentOrganigrammeClient
        employees={data.employees}
        departments={data.departments}
        currentEmployeeId={data.currentEmployeeId}
        salaryVisible={data.salaryVisible}
      />
    </div>
  );
}
