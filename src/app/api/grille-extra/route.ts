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
    const type = searchParams.get("type");
    if (type !== "management" && type !== "anciennete") return NextResponse.json({ error: "type requis: management ou anciennete" }, { status: 400 });

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("grille_extra")
      .select("id, department_id, name, details, montant_annuel, \"order\", created_at")
      .eq("organization_id", organizationId)
      .eq("type", type)
      .order("\"order\"", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("Grille-extra GET:", e);
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
    const type = body.type === "anciennete" ? "anciennete" : "management";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const details = typeof body.details === "string" ? body.details.trim() || null : null;
    const montantAnnuel = body.montant_annuel != null ? Number(body.montant_annuel) : null;
    const departmentId = body.department_id || null;

    if (!name) return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });

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

    const { data: maxOrder } = await supabase
      .from("grille_extra")
      .select("\"order\"")
      .eq("organization_id", organizationId)
      .eq("type", type)
      .order("\"order\"", { ascending: false })
      .limit(1)
      .maybeSingle();

    const order = (maxOrder?.order ?? -1) + 1;

    const { data, error } = await supabase
      .from("grille_extra")
      .insert({
        organization_id: organizationId,
        department_id: departmentId,
        type,
        name,
        details,
        montant_annuel: montantAnnuel,
        order,
      })
      .select("id, department_id, name, details, montant_annuel, \"order\", created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("Grille-extra POST:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
