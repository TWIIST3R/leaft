import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ParametresClient } from "./parametres-client";

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
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("organization_id")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    organizationId = userOrg?.organization_id ?? null;
  }
  if (!organizationId) redirect("/onboarding");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, salary_transparency_enabled")
    .eq("id", organizationId)
    .single();

  return {
    name: org?.name ?? "",
    salary_transparency_enabled: org?.salary_transparency_enabled ?? false,
  };
}

export default async function ParametresPage() {
  const data = await getData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Paramétrage</h1>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Branding de votre entreprise et options de transparence salariale (conformité loi française).
        </p>
      </div>

      <ParametresClient initialSettings={data} />
    </div>
  );
}
