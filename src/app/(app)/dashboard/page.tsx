import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

async function getOrganizationData() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = supabaseAdmin();

  let organization;

  if (orgId) {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("clerk_organization_id", orgId)
      .single();

    if (!error && data) {
      organization = data;
    }
  }

  if (!organization) {
    const { data: userOrg, error: userOrgError } = await supabase
      .from("user_organizations")
      .select("organization_id, organizations(id, name)")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (!userOrgError && userOrg?.organizations) {
      organization = Array.isArray(userOrg.organizations) ? userOrg.organizations[0] : userOrg.organizations;
    }
  }

  if (!organization) {
    redirect("/onboarding");
  }

  const { count: departmentsCount } = await supabase
    .from("departments")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id);

  const { data: deptIds } = await supabase
    .from("departments")
    .select("id")
    .eq("organization_id", organization.id);
  const ids = (deptIds ?? []).map((d) => d.id);
  const { count: paliersCount } =
    ids.length > 0
      ? await supabase
          .from("levels")
          .select("*", { count: "exact", head: true })
          .in("department_id", ids)
      : { count: 0 };

  const [{ data: allEmployees }, { data: deptRows }, { data: upcomingRaw }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, annual_salary_brut, gender, hire_date, first_name, last_name, current_department_id")
      .eq("organization_id", organization.id)
      .order("hire_date", { ascending: false }),
    supabase.from("departments").select("id, name").eq("organization_id", organization.id),
    supabase
      .from("interviews")
      .select("id, interview_date, type, employee_id")
      .eq("organization_id", organization.id)
      .gte("interview_date", new Date().toISOString().slice(0, 10))
      .order("interview_date", { ascending: true })
      .limit(5),
  ]);

  const emps = allEmployees ?? [];
  const depts = deptRows ?? [];
  const deptMap = new Map(depts.map((d) => [d.id, d.name]));
  const empMap = new Map(emps.map((e) => [e.id, e]));

  const salaries = emps.map((e) => Number(e.annual_salary_brut)).filter((s) => s > 0);
  const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0;
  const totalSalaryMass = salaries.reduce((a, b) => a + b, 0);
  const genderF = emps.filter((e) => e.gender === "F").length;
  const genderH = emps.filter((e) => e.gender === "H").length;
  const genderOther = emps.length - genderF - genderH;
  const newestHire = emps.length > 0 ? emps[0] : null;

  const deptDistribution = Object.entries(
    emps.reduce<Record<string, number>>((acc, e) => {
      const name = e.current_department_id ? deptMap.get(e.current_department_id) || "Autre" : "Non assigné";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  const upcomingInterviews = (upcomingRaw ?? []).map((iv) => {
    const emp = empMap.get(iv.employee_id);
    return {
      id: iv.id,
      date: iv.interview_date,
      type: iv.type,
      employeeName: emp ? `${emp.first_name} ${emp.last_name}` : "—",
    };
  });

  return {
    organization,
    employeesCount: emps.length,
    departmentsCount: departmentsCount ?? 0,
    paliersCount: paliersCount ?? 0,
    avgSalary,
    totalSalaryMass,
    genderF,
    genderH,
    genderOther,
    newestHire: newestHire ? { name: `${newestHire.first_name} ${newestHire.last_name}`, date: newestHire.hire_date } : null,
    deptDistribution,
    upcomingInterviews,
  };
}

export default async function DashboardPage() {
  const data = await getOrganizationData();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--brand)]/20"></div>
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[var(--brand)]"></div>
            </div>
            <p className="text-sm font-medium text-[color:rgba(11,11,11,0.7)]">Chargement...</p>
          </div>
        </div>
      }
    >
      <DashboardClient initialData={data} />
    </Suspense>
  );
}
