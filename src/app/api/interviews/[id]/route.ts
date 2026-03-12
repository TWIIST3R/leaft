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

  if (Object.keys(updates).length === 0 && !body.apply_salary_changes) {
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

  if (body.apply_salary_changes && data.employee_id) {
    try {
      const empUpdates: Record<string, unknown> = {};
      if (body.new_level_id !== undefined) empUpdates.current_level_id = body.new_level_id || null;
      if (body.new_management_id !== undefined) empUpdates.current_management_id = body.new_management_id || null;
      if (body.new_anciennete_id !== undefined) empUpdates.current_anciennete_id = body.new_anciennete_id || null;

      if (Object.keys(empUpdates).length > 0) {
        const { data: currentEmp } = await supabase
          .from("employees")
          .select("current_level_id, current_management_id, current_anciennete_id, salary_adjustment, annual_salary_brut")
          .eq("id", data.employee_id)
          .single();

        if (currentEmp) {
          const levelId = body.new_level_id !== undefined ? (body.new_level_id || null) : currentEmp.current_level_id;
          const mgmtId = body.new_management_id !== undefined ? (body.new_management_id || null) : currentEmp.current_management_id;
          const ancId = body.new_anciennete_id !== undefined ? (body.new_anciennete_id || null) : currentEmp.current_anciennete_id;
          const adj = currentEmp.salary_adjustment ?? 0;

          let total = Number(adj) || 0;
          if (levelId) {
            const { data: lv } = await supabase.from("levels").select("montant_annuel").eq("id", levelId).single();
            if (lv?.montant_annuel) total += Number(lv.montant_annuel);
          }
          if (mgmtId) {
            const { data: mg } = await supabase.from("grille_extra").select("montant_annuel").eq("id", mgmtId).single();
            if (mg?.montant_annuel) total += Number(mg.montant_annuel);
          }
          if (ancId) {
            const { data: an } = await supabase.from("grille_extra").select("montant_annuel").eq("id", ancId).single();
            if (an?.montant_annuel) total += Number(an.montant_annuel);
          }

          empUpdates.annual_salary_brut = total;
          await supabase.from("employees").update(empUpdates).eq("id", data.employee_id);

          await supabase.from("employee_position_history").insert({
            employee_id: data.employee_id,
            organization_id: organizationId,
            level_id: levelId,
            management_id: mgmtId,
            anciennete_id: ancId,
            salary_adjustment: Number(adj),
            annual_salary: total,
            effective_date: data.interview_date || new Date().toISOString().split("T")[0],
            reason: `Suite à ${data.type || "entretien"}`,
          });
        }
      }
    } catch (empErr) {
      console.error("Error updating employee from interview:", empErr);
    }
  }

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
