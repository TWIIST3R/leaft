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

const INTERVIEW_SELECT = `
  id, employee_id, organization_id, interview_date, type,
  notes, justification, salary_adjustment, created_by,
  created_at, updated_at
`;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const organizationId = await getOrganizationId(userId, orgId ?? null);
  if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("interviews")
    .select(INTERVIEW_SELECT)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const organizationId = await getOrganizationId(userId, orgId ?? null);
  if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.interview_date !== undefined) updates.interview_date = body.interview_date;
  if (body.type !== undefined) updates.type = body.type;
  if (body.notes !== undefined) updates.notes = body.notes || null;
  if (body.justification !== undefined) updates.justification = body.justification || null;
  if (body.salary_adjustment !== undefined) updates.salary_adjustment = body.salary_adjustment ? Number(body.salary_adjustment) : null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("interviews")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select(INTERVIEW_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const organizationId = await getOrganizationId(userId, orgId ?? null);
  if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("interviews")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
