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

  // Use admin client to bypass RLS for organization lookup
  // This ensures we can find the organization even if orgId is undefined
  const supabase = supabaseAdmin();

  let organization;

  // If orgId is provided in session, use it directly
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

  // If organization not found by orgId (or orgId not in session),
  // try to find it via user_organizations table
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

  // Get employees count
  const { count: employeesCount } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id);

  // Get departments count
  const { count: departmentsCount } = await supabase
    .from("departments")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id);

  // Get paliers count (levels linked to org via departments)
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

  const { data: allEmployees } = await supabase
    .from("employees")
    .select("annual_salary_brut, gender, hire_date, first_name, last_name")
    .eq("organization_id", organization.id)
    .order("hire_date", { ascending: false });

  const emps = allEmployees ?? [];
  const salaries = emps.map((e) => Number(e.annual_salary_brut)).filter((s) => s > 0);
  const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0;
  const genderF = emps.filter((e) => e.gender === "F").length;
  const genderH = emps.filter((e) => e.gender === "H").length;
  const newestHire = emps.length > 0 ? emps[0] : null;

  return {
    organization,
    employeesCount: employeesCount ?? 0,
    departmentsCount: departmentsCount ?? 0,
    paliersCount: paliersCount ?? 0,
    avgSalary,
    genderF,
    genderH,
    newestHire: newestHire ? { name: `${newestHire.first_name} ${newestHire.last_name}`, date: newestHire.hire_date } : null,
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
