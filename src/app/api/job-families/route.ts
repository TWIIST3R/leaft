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
    const { data: families, error } = await supabase
      .from("job_families")
      .select("id, name, created_at")
      .eq("organization_id", organizationId)
      .order("name");

    if (error) {
      console.error("Error fetching job families:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: levels } = await supabase
      .from("levels")
      .select("id, job_family_id, name, \"order\", min_salary, mid_salary, max_salary, expectations")
      .in("job_family_id", (families ?? []).map((f) => f.id))
      .order("\"order\"");

    const levelsByFamily = (levels ?? []).reduce<Record<string, typeof levels>>((acc, l) => {
      const k = l.job_family_id;
      if (!acc[k]) acc[k] = [];
      acc[k].push(l);
      return acc;
    }, {});

    const result = (families ?? []).map((f) => ({
      ...f,
      levels: (levelsByFamily[f.id] ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }));

    return NextResponse.json(result);
  } catch (e) {
    console.error("Job families GET:", e);
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
    if (!name) return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("job_families")
      .insert({ organization_id: organizationId, name })
      .select("id, name, created_at")
      .single();

    if (error) {
      console.error("Error creating job family:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ...data, levels: [] });
  } catch (e) {
    console.error("Job families POST:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
