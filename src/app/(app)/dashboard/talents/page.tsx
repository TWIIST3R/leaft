import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { TalentsClient } from "./talents-client";

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
    const { data: userOrg } = await supabase.from("user_organizations").select("organization_id").eq("clerk_user_id", userId).maybeSingle();
    organizationId = userOrg?.organization_id ?? null;
  }
  if (!organizationId) redirect("/onboarding");

  const [{ data: employees }, { data: departments }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, first_name, last_name, email, current_job_title, annual_salary_brut, hire_date, current_department_id, current_level_id")
      .eq("organization_id", organizationId)
      .order("last_name"),
    supabase.from("departments").select("id, name").eq("organization_id", organizationId).order("name"),
  ]);

  const deptIds = (departments ?? []).map((d) => d.id);
  const { data: levels } = deptIds.length > 0
    ? await supabase.from("levels").select("id, name, department_id").in("department_id", deptIds).order("order")
    : { data: [] };

  return {
    employees: employees ?? [],
    departments: departments ?? [],
    levels: levels ?? [],
  };
}

export default async function TalentsPage() {
  const data = await getData();

  return (
    <TalentsClient
      employees={data.employees}
      departments={data.departments}
      levels={data.levels}
    />
  );
}
