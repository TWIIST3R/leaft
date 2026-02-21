import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function getOrganizationId(userId: string, orgId: string | null) {
  const supabase = supabaseAdmin();
  if (orgId) {
    const { data } = await supabase
      .from("organizations")
      .select("id")
      .eq("clerk_organization_id", orgId)
      .single();
    if (data) return data.id;
  }
  const { data: userOrg } = await supabase
    .from("user_organizations")
    .select("organization_id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  return userOrg?.organization_id ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const organizationId = await getOrganizationId(userId, orgId ?? null);
    if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

    const body = await request.json();
    const jobFamilyId = body.job_family_id;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!jobFamilyId || !name) {
      return NextResponse.json({ error: "job_family_id et name sont requis" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: jf } = await supabase
      .from("job_families")
      .select("id")
      .eq("id", jobFamilyId)
      .eq("organization_id", organizationId)
      .single();
    if (!jf) return NextResponse.json({ error: "Famille de métiers introuvable" }, { status: 404 });

    const order = typeof body.order === "number" ? body.order : 0;
    const minSalary = body.min_salary != null ? Number(body.min_salary) : null;
    const midSalary = body.mid_salary != null ? Number(body.mid_salary) : null;
    const maxSalary = body.max_salary != null ? Number(body.max_salary) : null;
    const expectations = typeof body.expectations === "string" ? body.expectations.trim() || null : null;

    const { data, error } = await supabase
      .from("levels")
      .insert({
        job_family_id: jobFamilyId,
        name,
        order,
        min_salary: minSalary,
        mid_salary: midSalary,
        max_salary: maxSalary,
        expectations: expectations || null,
      })
      .select("id, job_family_id, name, \"order\", min_salary, mid_salary, max_salary, expectations")
      .single();

    if (error) {
      console.error("Error creating level:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("Levels POST:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
