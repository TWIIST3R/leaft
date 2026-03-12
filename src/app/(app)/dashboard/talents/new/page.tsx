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

  const [{ data: departments }, { data: employees }] = await Promise.all([
    supabase.from("departments").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase.from("employees").select("id, first_name, last_name").eq("organization_id", organizationId).order("last_name"),
  ]);

  const deptIds = (departments ?? []).map((d) => d.id);
  const { data: levels } = deptIds.length > 0
    ? await supabase.from("levels").select("id, name, department_id, montant_annuel").in("department_id", deptIds).order("order")
    : { data: [] };

  return {
    departments: departments ?? [],
    levels: levels ?? [],
    employees: employees ?? [],
  };
}

export default async function NewTalentPage() {
  const data = await getData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Ajouter un talent</h1>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Renseignez les informations du collaborateur. Les champs marqués d&apos;un * sont obligatoires.
        </p>
      </div>
      <NewTalentClient
        departments={data.departments}
        levels={data.levels}
        employees={data.employees}
      />
    </div>
  );
}
