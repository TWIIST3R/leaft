import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NewTalentClient } from "./new-talent-client";

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

  const [{ data: departments }, { data: employees }, { data: grilleExtra }] = await Promise.all([
    supabase.from("departments").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase.from("employees").select("id, first_name, last_name, is_manager").eq("organization_id", organizationId).order("last_name"),
    supabase.from("grille_extra").select("id, name, type, montant_annuel").eq("organization_id", organizationId).order("order"),
  ]);

  const deptIds = (departments ?? []).map((d) => d.id);
  const { data: levels } = deptIds.length > 0
    ? await supabase.from("levels").select("id, name, department_id, montant_annuel").in("department_id", deptIds).order("order")
    : { data: [] };

  const extras = grilleExtra ?? [];
  const allEmps = employees ?? [];
  return {
    departments: departments ?? [],
    levels: levels ?? [],
    employees: allEmps,
    managers: allEmps.filter((e) => e.is_manager),
    managementLevels: extras.filter((e) => e.type === "management"),
    ancienneteLevels: extras.filter((e) => e.type === "anciennete"),
  };
}

export default async function NewTalentPage() {
  const data = await getData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Ajouter un ou plusieurs talents</h1>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Ajoutez un talent via le formulaire ou importez plusieurs talents en déposant un fichier CSV (modèle fourni).
        </p>
      </div>
      <NewTalentClient
        departments={data.departments}
        levels={data.levels}
        employees={data.employees}
        managers={data.managers}
        managementLevels={data.managementLevels}
        ancienneteLevels={data.ancienneteLevels}
      />
    </div>
  );
}
