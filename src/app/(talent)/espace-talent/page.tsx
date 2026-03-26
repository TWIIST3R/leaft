import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { EspaceTalentClient } from "./espace-talent-client";

async function getData(userId: string, orgId: string | null, userEmail: string | null) {
  const supabase = supabaseAdmin();
  let organizationId: string | null = null;

  if (orgId) {
    const { data } = await supabase.from("organizations").select("id, name, salary_transparency_enabled").eq("clerk_organization_id", orgId).single();
    if (data) organizationId = data.id;
  }
  if (!organizationId) {
    const { data: userOrg } = await supabase.from("user_organizations").select("organization_id").eq("clerk_user_id", userId).maybeSingle();
    organizationId = userOrg?.organization_id ?? null;
  }
  if (!organizationId) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("name, salary_transparency_enabled")
    .eq("id", organizationId)
    .single();

  let { data: employee } = await supabase
    .from("employees")
    .select(`
      id, first_name, last_name, email, gender, birth_date, hire_date,
      current_job_title, current_level_id, current_department_id,
      current_management_id, current_anciennete_id, salary_adjustment,
      location, annual_salary_brut, avatar_url, manager_id
    `)
    .eq("organization_id", organizationId)
    .eq("clerk_user_id", userId)
    .single();

  if (!employee && userEmail) {
    const { data: employeeByEmail } = await supabase
      .from("employees")
      .select(`
        id, first_name, last_name, email, gender, birth_date, hire_date,
        current_job_title, current_level_id, current_department_id,
        current_management_id, current_anciennete_id, salary_adjustment,
        location, annual_salary_brut, avatar_url, manager_id
      `)
      .eq("organization_id", organizationId)
      .ilike("email", userEmail.trim())
      .maybeSingle();
    if (employeeByEmail) {
      await supabase
        .from("employees")
        .update({ clerk_user_id: userId })
        .eq("id", employeeByEmail.id);
      employee = employeeByEmail;
    }
  }

  if (!employee) return { orgName: org?.name ?? "", employee: null, department: null, level: null, manager: null, salaryVisible: false };

  const [deptResult, levelResult, managerResult] = await Promise.all([
    employee.current_department_id
      ? supabase.from("departments").select("name").eq("id", employee.current_department_id).single()
      : { data: null },
    employee.current_level_id
      ? supabase.from("levels").select("name, montant_annuel, mid_salary, min_salary, max_salary").eq("id", employee.current_level_id).single()
      : { data: null },
    employee.manager_id
      ? supabase.from("employees").select("first_name, last_name").eq("id", employee.manager_id).single()
      : { data: null },
  ]);

  let mgmtName: string | null = null;
  let ancName: string | null = null;
  if (employee.current_management_id) {
    const { data } = await supabase.from("grille_extra").select("name, montant_annuel").eq("id", employee.current_management_id).single();
    mgmtName = data?.name ?? null;
  }
  if (employee.current_anciennete_id) {
    const { data } = await supabase.from("grille_extra").select("name, montant_annuel").eq("id", employee.current_anciennete_id).single();
    ancName = data?.name ?? null;
  }

  const { data: interviews } = await supabase
    .from("interviews")
    .select("id, interview_date, type, notes, justification, salary_adjustment")
    .eq("employee_id", employee.id)
    .eq("organization_id", organizationId)
    .order("interview_date", { ascending: false });

  const { data: deptLevels } = employee.current_department_id
    ? await supabase
        .from("levels")
        .select("id, name, montant_annuel, mid_salary")
        .eq("department_id", employee.current_department_id)
        .order("order")
    : { data: [] };

  const { data: positionHistory } = await supabase
    .from("employee_position_history")
    .select("id, start_date, end_date, job_title, annual_salary_brut, level_id, department_id, effective_date, annual_salary, reason")
    .eq("employee_id", employee.id)
    .order("effective_date", { ascending: true });

  const { data: benchmarks } = await supabase
    .from("salary_benchmarks")
    .select("p25, p50, p75, source, updated_at, level_id")
    .eq("level_id", employee.current_level_id ?? "")
    .limit(1)
    .maybeSingle()
    .then((r) => ({ data: r.data }));

  const currentLevel = levelResult?.data;
  const midSalary = currentLevel?.mid_salary ? Number(currentLevel.mid_salary) : null;
  const salary = employee.annual_salary_brut != null ? Number(employee.annual_salary_brut) : null;
  const compaRatio = salary && midSalary && midSalary > 0 ? Math.round((salary / midSalary) * 100) : null;

  return {
    orgName: org?.name ?? "",
    employee,
    department: deptResult?.data?.name ?? null,
    level: currentLevel?.name ?? null,
    levelRange: currentLevel ? {
      min: currentLevel.min_salary ? Number(currentLevel.min_salary) : null,
      mid: midSalary,
      max: currentLevel.max_salary ? Number(currentLevel.max_salary) : null,
    } : null,
    manager: managerResult?.data ? `${managerResult.data.first_name} ${managerResult.data.last_name}` : null,
    managementLevel: mgmtName,
    ancienneteLevel: ancName,
    salaryVisible: org?.salary_transparency_enabled ?? false,
    interviews: interviews ?? [],
    compaRatio,
    deptLevels: (deptLevels ?? []).map((l) => ({ id: l.id, name: l.name, montant_annuel: l.montant_annuel ? Number(l.montant_annuel) : 0, mid_salary: l.mid_salary ? Number(l.mid_salary) : null })),
    benchmark: benchmarks ? { p25: Number(benchmarks.p25), p50: Number(benchmarks.p50), p75: Number(benchmarks.p75), source: benchmarks.source, updated_at: benchmarks.updated_at } : null,
    positionHistory: (positionHistory ?? [])
      .map((p) => ({
        id: p.id,
        startDate: (p as { effective_date?: string }).effective_date ?? p.start_date,
        endDate: p.end_date,
        jobTitle: p.job_title,
        salary: (p as { annual_salary?: number }).annual_salary != null ? Number((p as { annual_salary?: number }).annual_salary) : (p.annual_salary_brut ? Number(p.annual_salary_brut) : null),
        levelId: p.level_id,
        departmentId: p.department_id,
      }))
      .sort((a, b) => (a.startDate && b.startDate ? new Date(a.startDate).getTime() - new Date(b.startDate).getTime() : 0)),
  };
}

export default async function TalentSpacePage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? null;

  const data = await getData(userId, orgId ?? null, userEmail);
  if (!data) redirect("/sign-in");

  if (!data.employee) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-[#e2e7e2] bg-white p-8 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
          <h1 className="text-2xl font-semibold text-[var(--text)]">Bienvenue sur Leaft</h1>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            Votre profil n&apos;a pas encore été configuré par votre administrateur.
            Contactez votre responsable RH pour finaliser votre fiche.
          </p>
        </section>
      </div>
    );
  }

  return <EspaceTalentClient data={data as NonNullable<typeof data> & { employee: NonNullable<(typeof data)["employee"]> }} />;
}
