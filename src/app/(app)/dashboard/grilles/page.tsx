import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { GrillesClient } from "./grilles-client";

type Palier = {
  id: string;
  department_id: string;
  name: string;
  order: number;
  montant_annuel: number | null;
  criteria: { objectives?: string[]; competencies?: string[]; min_tenure_months?: number | null; notes?: string } | null;
  expectations: string | null;
};

type DepartmentWithPaliers = {
  id: string;
  name: string;
  created_at: string;
  paliers: Palier[];
};

async function getData() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = supabaseAdmin();
  let organization: { id: string; name: string } | null = null;

  if (orgId) {
    const { data } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("clerk_organization_id", orgId)
      .single();
    if (data) organization = data;
  }
  if (!organization) {
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("organization_id, organizations(id, name)")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    const org = userOrg?.organizations;
    if (org) organization = Array.isArray(org) ? org[0] : org;
  }

  if (!organization) redirect("/onboarding");

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, created_at")
    .eq("organization_id", organization.id)
    .order("name");

  const deptIds = (departments ?? []).map((d) => d.id);
  const levelsResult =
    deptIds.length > 0
      ? await supabase
          .from("levels")
          .select("id, department_id, name, \"order\", montant_annuel, criteria, expectations")
          .in("department_id", deptIds)
          .order("\"order\"")
      : { data: [] as Palier[] };
  const paliersList = levelsResult.data ?? [];

  const paliersByDept = paliersList.reduce<Record<string, Palier[]>>((acc, p) => {
    const k = p.department_id;
    if (!acc[k]) acc[k] = [];
    acc[k].push(p);
    return acc;
  }, {});

  const departmentsWithPaliers: DepartmentWithPaliers[] = (departments ?? []).map((d) => ({
    ...d,
    paliers: (paliersByDept[d.id] ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  }));

  const { data: avantages } = await supabase
    .from("avantages_en_nature")
    .select("id, name, montant_annuel_brut, department_id, created_at")
    .eq("organization_id", organization.id)
    .order("name");

  return { organization, departmentsWithPaliers, departments: departments ?? [], avantages: avantages ?? [] };
}

export default async function GrillesPage() {
  const data = await getData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Grilles de salaire</h1>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Chaque département a ses paliers : rémunération annuelle brute fixe et critères pour passer au palier suivant.
        </p>
      </div>

      <GrillesClient initialDepartmentsWithPaliers={data.departmentsWithPaliers} initialAvantages={data.avantages} />
    </div>
  );
}
