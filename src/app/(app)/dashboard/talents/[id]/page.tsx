import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { TalentDetailClient } from "./talent-detail-client";

async function getData(id: string) {
  const { userId, orgId } = await auth();
  if (!userId) return null;

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
  if (!organizationId) return null;

  const { data: employee } = await supabase
    .from("employees")
    .select(`
      id, first_name, last_name, email, gender, birth_date, hire_date,
      current_job_title, current_level_id, current_department_id, manager_id,
      current_management_id, current_anciennete_id, salary_adjustment,
      location, annual_salary_brut, created_at, updated_at
    `)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!employee) return null;

  const [{ data: departments }, { data: allEmployees }, { data: grilleExtra }] = await Promise.all([
    supabase.from("departments").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase.from("employees").select("id, first_name, last_name").eq("organization_id", organizationId).order("last_name"),
    supabase.from("grille_extra").select("id, name, type, montant_annuel").eq("organization_id", organizationId).order("order"),
  ]);

  const deptIds = (departments ?? []).map((d) => d.id);
  const { data: levels } = deptIds.length > 0
    ? await supabase.from("levels").select("id, name, department_id, montant_annuel").in("department_id", deptIds).order("order")
    : { data: [] };

  const { data: interviews } = await supabase
    .from("interviews")
    .select("id, interview_date, type, notes, justification, salary_adjustment, created_at")
    .eq("employee_id", id)
    .eq("organization_id", organizationId)
    .order("interview_date", { ascending: false });

  const extras = grilleExtra ?? [];
  return {
    employee,
    departments: departments ?? [],
    levels: levels ?? [],
    employees: (allEmployees ?? []).filter((e) => e.id !== id),
    managementLevels: extras.filter((e) => e.type === "management"),
    ancienneteLevels: extras.filter((e) => e.type === "anciennete"),
    interviews: interviews ?? [],
  };
}

export default async function TalentFichePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();

  return (
    <TalentDetailClient
      employee={data.employee}
      departments={data.departments}
      levels={data.levels}
      employees={data.employees}
      managementLevels={data.managementLevels}
      ancienneteLevels={data.ancienneteLevels}
      interviews={data.interviews}
    />
  );
}
