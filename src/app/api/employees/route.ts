import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
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

async function getClerkOrgId(organizationId: string): Promise<string | null> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("organizations")
    .select("clerk_organization_id")
    .eq("id", organizationId)
    .single();
  return data?.clerk_organization_id ?? null;
}

const EMPLOYEE_SELECT = `
  id, first_name, last_name, email, gender, birth_date, hire_date,
  current_job_title, current_level_id, current_department_id, manager_id,
  current_management_id, current_anciennete_id, salary_adjustment,
  location, annual_salary_brut, created_at, updated_at
`;

async function computeSalary(
  supabase: ReturnType<typeof supabaseAdmin>,
  levelId: string | null,
  managementId: string | null,
  ancienneteId: string | null,
  adjustment: number
): Promise<number> {
  let total = adjustment || 0;

  if (levelId) {
    const { data } = await supabase.from("levels").select("montant_annuel").eq("id", levelId).single();
    if (data?.montant_annuel) total += Number(data.montant_annuel);
  }
  if (managementId) {
    const { data } = await supabase.from("grille_extra").select("montant_annuel").eq("id", managementId).single();
    if (data?.montant_annuel) total += Number(data.montant_annuel);
  }
  if (ancienneteId) {
    const { data } = await supabase.from("grille_extra").select("montant_annuel").eq("id", ancienneteId).single();
    if (data?.montant_annuel) total += Number(data.montant_annuel);
  }

  return total;
}

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const organizationId = await getOrganizationId(userId, orgId ?? null);
    if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("employees")
      .select(EMPLOYEE_SELECT)
      .eq("organization_id", organizationId)
      .order("last_name");

    if (error) {
      console.error("Error fetching employees:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("Employees GET:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const organizationId = await getOrganizationId(userId, orgId ?? null);
    if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

    const body = await request.json();

    const first_name = typeof body.first_name === "string" ? body.first_name.trim() : "";
    const last_name = typeof body.last_name === "string" ? body.last_name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const current_job_title = typeof body.current_job_title === "string" ? body.current_job_title.trim() : "";
    const hire_date = body.hire_date || null;

    if (!first_name || !last_name) return NextResponse.json({ error: "Nom et prénom requis" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });
    if (!current_job_title) return NextResponse.json({ error: "Poste requis" }, { status: 400 });
    if (!hire_date) return NextResponse.json({ error: "Date d'entrée requise" }, { status: 400 });

    const current_level_id = body.current_level_id || null;
    const current_management_id = body.current_management_id || null;
    const current_anciennete_id = body.current_anciennete_id || null;
    const salary_adjustment = body.salary_adjustment != null ? Number(body.salary_adjustment) : 0;

    const supabase = supabaseAdmin();
    const annual_salary_brut = await computeSalary(supabase, current_level_id, current_management_id, current_anciennete_id, salary_adjustment);

    const insert: Record<string, unknown> = {
      organization_id: organizationId,
      first_name,
      last_name,
      email,
      current_job_title,
      hire_date,
      annual_salary_brut,
      salary_adjustment,
    };

    if (body.gender) insert.gender = body.gender;
    if (body.birth_date) insert.birth_date = body.birth_date;
    if (body.current_department_id) insert.current_department_id = body.current_department_id;
    if (current_level_id) insert.current_level_id = current_level_id;
    if (current_management_id) insert.current_management_id = current_management_id;
    if (current_anciennete_id) insert.current_anciennete_id = current_anciennete_id;
    if (body.manager_id) insert.manager_id = body.manager_id;
    if (body.location) insert.location = typeof body.location === "string" ? body.location.trim() : null;

    const { data, error } = await supabase
      .from("employees")
      .insert(insert)
      .select(EMPLOYEE_SELECT)
      .single();

    if (error) {
      console.error("Error creating employee:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const clerkOrgId = orgId ?? await getClerkOrgId(organizationId);
    if (clerkOrgId && email) {
      try {
        const clerk = await clerkClient();
        await clerk.organizations.createOrganizationInvitation({
          organizationId: clerkOrgId,
          emailAddress: email,
          inviterUserId: userId,
          role: "org:member",
        });
      } catch (inviteErr) {
        console.error("Clerk invitation error (non-blocking):", inviteErr);
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Employees POST:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
