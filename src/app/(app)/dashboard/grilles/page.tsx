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

  return { organization, departments: departments ?? [] };
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

      <GrillesClient initialDepartments={data.departments} />
    </div>
  );
}
