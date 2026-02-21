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

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const organizationId = await getOrganizationId(userId, orgId ?? null);
    if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("department_id");

    const supabase = supabaseAdmin();
    let query = supabase
      .from("avantages_en_nature")
      .select("id, name, montant_annuel_brut, department_id, created_at")
      .eq("organization_id", organizationId)
      .order("name");

    if (departmentId) {
      query = query.or(`department_id.eq.${departmentId},department_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching avantages:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("Avantages GET:", e);
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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const montant = body.montant_annuel_brut != null ? Number(body.montant_annuel_brut) : null;
    const departmentId = body.department_id || null;

    if (!name) return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    if (montant == null || montant < 0) return NextResponse.json({ error: "Le montant annuel brut est requis et doit être ≥ 0" }, { status: 400 });

    const supabase = supabaseAdmin();
    if (departmentId) {
      const { data: dept } = await supabase
        .from("departments")
        .select("id")
        .eq("id", departmentId)
        .eq("organization_id", organizationId)
        .single();
      if (!dept) return NextResponse.json({ error: "Département introuvable" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("avantages_en_nature")
      .insert({
        organization_id: organizationId,
        name,
        montant_annuel_brut: montant,
        department_id: departmentId,
      })
      .select("id, name, montant_annuel_brut, department_id, created_at")
      .single();

    if (error) {
      console.error("Error creating avantage:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("Avantages POST:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
