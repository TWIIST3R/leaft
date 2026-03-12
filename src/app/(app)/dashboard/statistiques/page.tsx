import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { StatistiquesClient } from "./statistiques-client";

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

  const [{ data: employees }, { data: departments }, { data: levels }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, first_name, last_name, gender, birth_date, hire_date, current_department_id, current_level_id, annual_salary_brut, location")
      .eq("organization_id", organizationId),
    supabase.from("departments").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase.from("levels").select("id, name, department_id, montant_annuel, mid_salary, min_salary, max_salary"),
  ]);

  return {
    employees: employees ?? [],
    departments: departments ?? [],
    levels: levels ?? [],
  };
}

export default async function StatistiquesPage() {
  const data = await getData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Statistiques</h1>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Vue d&apos;ensemble démographique, salariale et d&apos;équité de votre organisation.
        </p>
      </div>
      <StatistiquesClient
        employees={data.employees}
        departments={data.departments}
        levels={data.levels}
      />
    </div>
  );
}
