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
    const departmentId = body.department_id;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!departmentId || !name) {
      return NextResponse.json({ error: "department_id et name sont requis" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: dept } = await supabase
      .from("departments")
      .select("id")
      .eq("id", departmentId)
      .eq("organization_id", organizationId)
      .single();
    if (!dept) return NextResponse.json({ error: "Département introuvable" }, { status: 404 });

    const order = typeof body.order === "number" ? body.order : 0;
    const montantAnnuel = body.montant_annuel != null ? Number(body.montant_annuel) : null;
    const expectations = typeof body.expectations === "string" ? body.expectations.trim() || null : null;
    const criteria =
      body.criteria != null && typeof body.criteria === "object"
        ? body.criteria
        : { objectives: [], competencies: [], min_tenure_months: null, notes: "" };

    const { data, error } = await supabase
      .from("levels")
      .insert({
        department_id: departmentId,
        name,
        order,
        montant_annuel: montantAnnuel,
        criteria,
        expectations: expectations || null,
      })
      .select("id, department_id, name, \"order\", montant_annuel, criteria, expectations")
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
