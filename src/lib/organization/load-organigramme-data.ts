import { supabaseAdmin } from "@/lib/supabase/admin";
import type { OrgEmployee, OrgDept } from "@/components/organigramme/organigramme-flow";
import { computeDepartmentSalaryAverages } from "@/lib/organization/department-salary-averages";
import { parseSalaryDisclosureMode } from "@/lib/organization/salary-transparency-shared";

export async function loadOrganigrammeForOrganization(organizationId: string) {
  const supabase = supabaseAdmin();
  const [{ data: employees }, { data: departments }, { data: org }] = await Promise.all([
    supabase
      .from("employees")
      .select(
        "id, first_name, last_name, current_job_title, current_department_id, manager_id, avatar_url, annual_salary_brut",
      )
      .eq("organization_id", organizationId)
      .order("last_name"),
    supabase.from("departments").select("id, name").eq("organization_id", organizationId),
    supabase
      .from("organizations")
      .select("salary_transparency_enabled, salary_disclosure_mode, logo_url")
      .eq("id", organizationId)
      .single(),
  ]);

  const deptNameMap = new Map((departments ?? []).map((d) => [d.id, d.name]));
  const departmentAverages = computeDepartmentSalaryAverages(employees ?? [], deptNameMap);

  return {
    employees: (employees ?? []) as OrgEmployee[],
    departments: (departments ?? []) as OrgDept[],
    salaryVisible: org?.salary_transparency_enabled ?? false,
    salaryDisclosureMode: parseSalaryDisclosureMode(org?.salary_disclosure_mode),
    departmentAverages,
    companyLogoUrl: org?.logo_url ?? null,
  };
}
