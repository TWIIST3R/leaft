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

const EMPLOYEE_SELECT = `
  id, first_name, last_name, email, gender, birth_date, hire_date,
  current_job_title, current_level_id, current_department_id, manager_id,
  location, annual_salary_brut, created_at, updated_at
`;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const organizationId = await getOrganizationId(userId, orgId ?? null);
    if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

    const { id } = await params;
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("employees")
      .select(EMPLOYEE_SELECT)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Talent introuvable" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("Employee GET:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const organizationId = await getOrganizationId(userId, orgId ?? null);
    if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (typeof body.first_name === "string" && body.first_name.trim()) updates.first_name = body.first_name.trim();
    if (typeof body.last_name === "string" && body.last_name.trim()) updates.last_name = body.last_name.trim();
    if (typeof body.email === "string" && body.email.trim()) updates.email = body.email.trim();
    if (typeof body.current_job_title === "string") updates.current_job_title = body.current_job_title.trim();
    if (body.hire_date !== undefined) updates.hire_date = body.hire_date;
    if (body.annual_salary_brut !== undefined) updates.annual_salary_brut = body.annual_salary_brut;
    if (body.gender !== undefined) updates.gender = body.gender || null;
    if (body.birth_date !== undefined) updates.birth_date = body.birth_date || null;
    if (body.current_department_id !== undefined) updates.current_department_id = body.current_department_id || null;
    if (body.current_level_id !== undefined) updates.current_level_id = body.current_level_id || null;
    if (body.manager_id !== undefined) updates.manager_id = body.manager_id || null;
    if (body.location !== undefined) updates.location = typeof body.location === "string" ? body.location.trim() || null : null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select(EMPLOYEE_SELECT)
      .single();

    if (error) {
      console.error("Error updating employee:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "Talent introuvable" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("Employee PATCH:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const organizationId = await getOrganizationId(userId, orgId ?? null);
    if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

    const { id } = await params;
    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error deleting employee:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Employee DELETE:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
