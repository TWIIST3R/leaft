import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SimulateurClient } from "./simulateur-client";

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

  const { data: employee } = await supabase
    .from("employees")
    .select("id, first_name, last_name, current_level_id, current_department_id, current_management_id, current_anciennete_id, salary_adjustment, annual_salary_brut")
    .eq("organization_id", organizationId)
    .eq("clerk_user_id", userId)
    .single();

  if (!employee) return null;

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("name");

  const deptIds = (departments ?? []).map((d) => d.id);
  const { data: allLevels } = deptIds.length > 0
    ? await supabase.from("levels").select("id, name, department_id, montant_annuel, mid_salary").in("department_id", deptIds).order("order")
    : { data: [] };

  const { data: grilleExtra } = await supabase
    .from("grille_extra")
    .select("id, name, type, montant_annuel")
    .eq("organization_id", organizationId)
    .order("order");

  const extras = grilleExtra ?? [];

  return {
    employee,
    departments: departments ?? [],
    levels: allLevels ?? [],
    managementLevels: extras.filter((e) => e.type === "management"),
    ancienneteLevels: extras.filter((e) => e.type === "anciennete"),
  };
}

export default async function SimulateurPage() {
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

  return <SimulateurClient data={data} />;
}
