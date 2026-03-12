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

export async function GET(request: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const organizationId = await getOrganizationId(userId, orgId ?? null);
  if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

  const supabase = supabaseAdmin();
  const url = new URL(request.url);
  const employeeId = url.searchParams.get("employee_id");

  let query = supabase
    .from("interviews")
    .select(INTERVIEW_SELECT)
    .eq("organization_id", organizationId)
    .order("interview_date", { ascending: false });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const organizationId = await getOrganizationId(userId, orgId ?? null);
  if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

  const body = await request.json();
  const { employee_id, interview_date, type, notes, justification, salary_adjustment } = body;

  if (!employee_id || !interview_date || !type) {
    return NextResponse.json({ error: "employee_id, interview_date et type sont requis" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("interviews")
    .insert({
      employee_id,
      organization_id: organizationId,
      interview_date,
      type,
      notes: notes || null,
      justification: justification || null,
      salary_adjustment: salary_adjustment ? Number(salary_adjustment) : null,
      created_by: userId,
    })
    .select(INTERVIEW_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
