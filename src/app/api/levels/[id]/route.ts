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
    const supabase = supabaseAdmin();
    const { data: level } = await supabase.from("levels").select("id, job_family_id").eq("id", id).single();
    if (!level) return NextResponse.json({ error: "Niveau introuvable" }, { status: 404 });

    const { data: jf } = await supabase
      .from("job_families")
      .select("organization_id")
      .eq("id", level.job_family_id)
      .single();
    if (!jf || jf.organization_id !== organizationId) {
      return NextResponse.json({ error: "Niveau introuvable" }, { status: 404 });
    }

    const body = await request.json();
    const updates: { name?: string; order?: number; min_salary?: number | null; mid_salary?: number | null; max_salary?: number | null; expectations?: string | null } = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.order === "number") updates.order = body.order;
    if (body.min_salary !== undefined) updates.min_salary = body.min_salary == null ? null : Number(body.min_salary);
    if (body.mid_salary !== undefined) updates.mid_salary = body.mid_salary == null ? null : Number(body.mid_salary);
    if (body.max_salary !== undefined) updates.max_salary = body.max_salary == null ? null : Number(body.max_salary);
    if (body.expectations !== undefined) updates.expectations = typeof body.expectations === "string" ? body.expectations.trim() || null : null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("levels")
      .update(updates)
      .eq("id", id)
      .select("id, job_family_id, name, \"order\", min_salary, mid_salary, max_salary, expectations")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("Levels PATCH:", e);
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
    const { data: level } = await supabase.from("levels").select("id, job_family_id").eq("id", id).single();
    if (!level) return NextResponse.json({ error: "Niveau introuvable" }, { status: 404 });

    const { data: jf } = await supabase
      .from("job_families")
      .select("organization_id")
      .eq("id", level.job_family_id)
      .single();
    if (!jf || jf.organization_id !== organizationId) {
      return NextResponse.json({ error: "Niveau introuvable" }, { status: 404 });
    }

    const { error } = await supabase.from("levels").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Levels DELETE:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
