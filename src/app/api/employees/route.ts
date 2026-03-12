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

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const organizationId = await getOrganizationId(userId, orgId ?? null);
    if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("employees")
      .select(`
        id, first_name, last_name, email, gender, birth_date, hire_date,
        current_job_title, current_level_id, current_department_id, manager_id,
        location, annual_salary_brut, created_at, updated_at
      `)
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
    const annual_salary_brut = body.annual_salary_brut != null ? Number(body.annual_salary_brut) : null;

    if (!first_name || !last_name) return NextResponse.json({ error: "Nom et prénom requis" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });
    if (!current_job_title) return NextResponse.json({ error: "Poste requis" }, { status: 400 });
    if (!hire_date) return NextResponse.json({ error: "Date d'entrée requise" }, { status: 400 });
    if (annual_salary_brut == null || isNaN(annual_salary_brut)) return NextResponse.json({ error: "Salaire annuel brut requis" }, { status: 400 });

    const insert: Record<string, unknown> = {
      organization_id: organizationId,
      first_name,
      last_name,
      email,
      current_job_title,
      hire_date,
      annual_salary_brut,
    };

    if (body.gender) insert.gender = body.gender;
    if (body.birth_date) insert.birth_date = body.birth_date;
    if (body.current_department_id) insert.current_department_id = body.current_department_id;
    if (body.current_level_id) insert.current_level_id = body.current_level_id;
    if (body.manager_id) insert.manager_id = body.manager_id;
    if (body.location) insert.location = typeof body.location === "string" ? body.location.trim() : null;

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("employees")
      .insert(insert)
      .select(`
        id, first_name, last_name, email, gender, birth_date, hire_date,
        current_job_title, current_level_id, current_department_id, manager_id,
        location, annual_salary_brut, created_at, updated_at
      `)
      .single();

    if (error) {
      console.error("Error creating employee:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Employees POST:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
