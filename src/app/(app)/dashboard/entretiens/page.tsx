import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { EntretiensClient } from "./entretiens-client";

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

  const [{ data: interviews }, { data: employees }] = await Promise.all([
    supabase
      .from("interviews")
      .select("id, employee_id, interview_date, type, notes, justification, salary_adjustment, created_by, created_at")
      .eq("organization_id", organizationId)
      .order("interview_date", { ascending: false }),
    supabase
      .from("employees")
      .select("id, first_name, last_name, email, current_job_title")
      .eq("organization_id", organizationId)
      .order("last_name"),
  ]);

  return {
    interviews: interviews ?? [],
    employees: employees ?? [],
  };
}

export default async function EntretiensPage() {
  const data = await getData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Entretiens</h1>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Gérez les entretiens annuels, semestriels et ponctuels de vos collaborateurs.
        </p>
      </div>
      <EntretiensClient
        initialInterviews={data.interviews}
        employees={data.employees}
      />
    </div>
  );
}
