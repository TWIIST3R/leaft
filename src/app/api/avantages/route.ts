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

    const supabase = supabaseAdmin();
    const { data: list, error } = await supabase
      .from("avantages_en_nature")
      .select("id, name, montant_annuel_brut, created_at")
      .eq("organization_id", organizationId)
      .order("name");

    if (error) {
      console.error("Error fetching avantages:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const avantages = list ?? [];
    const ids = avantages.map((a) => a.id);
    const { data: links } =
      ids.length > 0
        ? await supabase.from("avantage_departments").select("avantage_id, department_id").in("avantage_id", ids)
        : { data: [] as { avantage_id: string; department_id: string }[] };
    const linksList = links ?? [];
    const byAvantage = linksList.reduce<Record<string, string[]>>((acc, row) => {
      if (!acc[row.avantage_id]) acc[row.avantage_id] = [];
      acc[row.avantage_id].push(row.department_id);
      return acc;
    }, {});

    const result = avantages.map((a) => ({
      ...a,
      department_ids: byAvantage[a.id] ?? [],
    }));
    return NextResponse.json(result);
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
    const departmentIds = Array.isArray(body.department_ids) ? body.department_ids.filter((id: unknown) => typeof id === "string") : [];

    if (!name) return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    if (montant == null || montant < 0) return NextResponse.json({ error: "Le montant annuel brut est requis et doit être ≥ 0" }, { status: 400 });

    const supabase = supabaseAdmin();
    if (departmentIds.length > 0) {
      const { data: depts } = await supabase
        .from("departments")
        .select("id")
        .eq("organization_id", organizationId)
        .in("id", departmentIds);
      if ((depts?.length ?? 0) !== departmentIds.length) return NextResponse.json({ error: "Un ou plusieurs départements introuvables" }, { status: 404 });
    }

    const { data: avantage, error: errInsert } = await supabase
      .from("avantages_en_nature")
      .insert({
        organization_id: organizationId,
        name,
        montant_annuel_brut: montant,
        department_id: null,
      })
      .select("id, name, montant_annuel_brut, created_at")
      .single();

    if (errInsert) {
      console.error("Error creating avantage:", errInsert);
      return NextResponse.json({ error: errInsert.message }, { status: 500 });
    }

    if (departmentIds.length > 0) {
      await supabase.from("avantage_departments").insert(departmentIds.map((department_id: string) => ({ avantage_id: avantage.id, department_id })));
    }

    return NextResponse.json({ ...avantage, department_ids: departmentIds });
  } catch (e) {
    console.error("Avantages POST:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
