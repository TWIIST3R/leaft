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
    const { data: level } = await supabase.from("levels").select("id, department_id").eq("id", id).single();
    if (!level || !level.department_id) return NextResponse.json({ error: "Niveau introuvable" }, { status: 404 });

    const { data: dept } = await supabase
      .from("departments")
      .select("organization_id")
      .eq("id", level.department_id)
      .single();
    if (!dept || dept.organization_id !== organizationId) {
      return NextResponse.json({ error: "Niveau introuvable" }, { status: 404 });
    }

    const body = await request.json();
    const updates: {
      name?: string;
      order?: number;
      montant_annuel?: number | null;
      criteria?: { objectives?: string[]; competencies?: string[]; min_tenure_months?: number | null; notes?: string };
      expectations?: string | null;
    } = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.order === "number") updates.order = body.order;
    if (body.montant_annuel !== undefined) updates.montant_annuel = body.montant_annuel == null ? null : Number(body.montant_annuel);
    if (body.criteria !== undefined && typeof body.criteria === "object") updates.criteria = body.criteria;
    if (body.expectations !== undefined) updates.expectations = typeof body.expectations === "string" ? body.expectations.trim() || null : null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("levels")
      .update(updates)
      .eq("id", id)
      .select("id, department_id, name, \"order\", montant_annuel, criteria, expectations")
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
    const { data: level } = await supabase.from("levels").select("id, department_id").eq("id", id).single();
    if (!level || !level.department_id) return NextResponse.json({ error: "Niveau introuvable" }, { status: 404 });

    const { data: dept } = await supabase
      .from("departments")
      .select("organization_id")
      .eq("id", level.department_id)
      .single();
    if (!dept || dept.organization_id !== organizationId) {
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
