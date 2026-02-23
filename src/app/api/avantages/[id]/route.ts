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
    const supabase = supabaseAdmin();

    const updates: { name?: string; montant_annuel_brut?: number } = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (body.montant_annuel_brut !== undefined) {
      const m = Number(body.montant_annuel_brut);
      if (m < 0) return NextResponse.json({ error: "Le montant doit être ≥ 0" }, { status: 400 });
      updates.montant_annuel_brut = m;
    }

    if (Object.keys(updates).length > 0) {
      const { error: errUpdate } = await supabase
        .from("avantages_en_nature")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (errUpdate) return NextResponse.json({ error: errUpdate.message }, { status: 500 });
    }

    if (body.department_ids !== undefined) {
      const departmentIds = Array.isArray(body.department_ids) ? body.department_ids.filter((id: unknown) => typeof id === "string") : [];
      if (departmentIds.length > 0) {
        const { data: depts } = await supabase
          .from("departments")
          .select("id")
          .eq("organization_id", organizationId)
          .in("id", departmentIds);
        if ((depts?.length ?? 0) !== departmentIds.length) return NextResponse.json({ error: "Un ou plusieurs départements introuvables" }, { status: 404 });
      }
      await supabase.from("avantage_departments").delete().eq("avantage_id", id);
      if (departmentIds.length > 0) {
        await supabase.from("avantage_departments").insert(departmentIds.map((department_id: string) => ({ avantage_id: id, department_id })));
      }
    }

    const { data: avantage } = await supabase
      .from("avantages_en_nature")
      .select("id, name, montant_annuel_brut, created_at")
      .eq("id", id)
      .single();
    if (!avantage) return NextResponse.json({ error: "Avantage introuvable" }, { status: 404 });

    const { data: links } = await supabase.from("avantage_departments").select("department_id").eq("avantage_id", id);
    const department_ids = (links ?? []).map((r) => r.department_id);
    return NextResponse.json({ ...avantage, department_ids });
  } catch (e) {
    console.error("Avantages PATCH:", e);
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
      .from("avantages_en_nature")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Avantages DELETE:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
