import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { GrillesClient } from "./grilles-client";

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

  const { data: families } = await supabase
    .from("job_families")
    .select("id, name, created_at")
    .eq("organization_id", organization.id)
    .order("name");

  const familyIds = (families ?? []).map((f) => f.id);
  const levelsResult = familyIds.length
    ? await supabase
        .from("levels")
        .select("id, job_family_id, name, \"order\", min_salary, mid_salary, max_salary, expectations")
        .in("job_family_id", familyIds)
        .order("\"order\"")
    : { data: [] as { id: string; job_family_id: string; name: string; order: number; min_salary: number | null; mid_salary: number | null; max_salary: number | null; expectations: string | null }[] };
  const levelsList = levelsResult.data ?? [];

  const levelsByFamily = levelsList.reduce<Record<string, typeof levelsList>>((acc, l) => {
    const k = l.job_family_id;
    if (!acc[k]) acc[k] = [];
    acc[k].push(l);
    return acc;
  }, {});

  const jobFamilies = (families ?? []).map((f) => ({
    ...f,
    levels: (levelsByFamily[f.id] ?? []).sort((a, b) => ((a as { order?: number }).order ?? 0) - ((b as { order?: number }).order ?? 0)),
  }));

  return { organization, departments: departments ?? [], jobFamilies };
}

export default async function GrillesPage() {
  const data = await getData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Grilles de salaire</h1>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Gérez vos départements et les grilles salariales par famille de métiers et niveau.
        </p>
      </div>

      <GrillesClient initialDepartments={data.departments} initialJobFamilies={data.jobFamilies} />
    </div>
  );
}
