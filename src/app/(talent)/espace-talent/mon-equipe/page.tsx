import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MonEquipeClient } from "./mon-equipe-client";

async function getData(userId: string, orgId: string | null) {
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

  const { data: currentEmp } = await supabase
    .from("employees")
    .select("id, is_manager")
    .eq("organization_id", organizationId)
    .eq("clerk_user_id", userId)
    .single();

  if (!currentEmp?.is_manager) return null;

  const { data: teamMembers } = await supabase
    .from("employees")
    .select(`
      id, first_name, last_name, email, current_job_title,
      current_department_id, current_level_id, annual_salary_brut,
      avatar_url, hire_date
    `)
    .eq("organization_id", organizationId)
    .eq("manager_id", currentEmp.id)
    .order("last_name");

  const teamIds = (teamMembers ?? []).map((m) => m.id);

  const { data: interviews } = teamIds.length > 0
    ? await supabase
        .from("interviews")
        .select("id, employee_id, interview_date, type, notes, salary_adjustment")
        .in("employee_id", teamIds)
        .order("interview_date", { ascending: false })
        .limit(20)
    : { data: [] };

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("organization_id", organizationId);

  const { data: levels } = await supabase
    .from("levels")
    .select("id, name, department_id")
    .in("department_id", (departments ?? []).map((d) => d.id));

  const { data: positionHistory } = teamIds.length > 0
    ? await supabase
        .from("employee_position_history")
        .select("id, employee_id, annual_salary, effective_date, reason")
        .in("employee_id", teamIds)
        .order("effective_date", { ascending: true })
    : { data: [] };

  return {
    teamMembers: teamMembers ?? [],
    interviews: interviews ?? [],
    departments: departments ?? [],
    levels: levels ?? [],
    positionHistory: positionHistory ?? [],
  };
}

export default async function MonEquipePage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");

  const data = await getData(userId, orgId ?? null);
  if (!data) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-[#e2e7e2] bg-white p-8 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
          <h1 className="text-2xl font-semibold text-[var(--text)]">Mon equipe</h1>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            Vous n&apos;avez pas accès à cette page. Seuls les managers peuvent voir leur equipe.
          </p>
        </section>
      </div>
    );
  }

  return <MonEquipeClient data={data} />;
}
