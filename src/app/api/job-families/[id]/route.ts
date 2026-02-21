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
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const departmentId = body.department_id !== undefined ? (body.department_id || null) : undefined;
    if (!name && departmentId === undefined) return NextResponse.json({ error: "Aucune modification" }, { status: 400 });

    const supabase = supabaseAdmin();
    const updates: { name?: string; department_id?: string | null } = {};
    if (name) updates.name = name;
    if (departmentId !== undefined) {
      if (departmentId) {
        const { data: dept } = await supabase
          .from("departments")
          .select("id")
          .eq("id", departmentId)
          .eq("organization_id", organizationId)
          .single();
        if (!dept) return NextResponse.json({ error: "Département introuvable" }, { status: 404 });
      }
      updates.department_id = departmentId;
    }

    const { data, error } = await supabase
      .from("job_families")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select("id, name, department_id, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Famille de métiers introuvable" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("Job families PATCH:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
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
      .from("job_families")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Job families DELETE:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
