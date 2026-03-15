import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendSalaryChangeEmail } from "@/lib/email";

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
  notes, justification, salary_adjustment, status, created_by,
  created_at, updated_at,
  pending_level_id, pending_management_id, pending_anciennete_id, pending_salary_adjustment
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
  const supabase = supabaseAdmin();

  const updates: Record<string, unknown> = {};
  if (body.interview_date !== undefined) updates.interview_date = body.interview_date;
  if (body.type !== undefined) updates.type = body.type;
  if (body.notes !== undefined) updates.notes = body.notes || null;
  if (body.justification !== undefined) updates.justification = body.justification || null;
  if (body.status !== undefined && body.status !== "termine") updates.status = "en_cours";

  if (body.apply_salary_changes === true) {
    updates.pending_level_id = body.new_level_id || null;
    updates.pending_management_id = body.new_management_id || null;
    updates.pending_anciennete_id = body.new_anciennete_id || null;
    updates.pending_salary_adjustment = body.new_salary_adjustment != null && body.new_salary_adjustment !== "" ? Number(body.new_salary_adjustment) : null;
  } else if (body.apply_salary_changes === false) {
    updates.pending_level_id = null;
    updates.pending_management_id = null;
    updates.pending_anciennete_id = null;
    updates.pending_salary_adjustment = null;
  }

  if (body.status === "termine") {
    const { data: currentRow } = await supabase
      .from("interviews")
      .select("employee_id, interview_date, type, pending_level_id, pending_management_id, pending_anciennete_id, pending_salary_adjustment")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (currentRow?.employee_id) {
      const hasPending =
        currentRow.pending_level_id != null ||
        currentRow.pending_management_id != null ||
        currentRow.pending_anciennete_id != null ||
        (currentRow.pending_salary_adjustment != null && Number(currentRow.pending_salary_adjustment) !== 0);

      if (hasPending) {
        const { data: currentEmp } = await supabase
          .from("employees")
          .select("current_level_id, current_management_id, current_anciennete_id, current_department_id, current_job_title, salary_adjustment, first_name, last_name, email")
          .eq("id", currentRow.employee_id)
          .single();

        if (currentEmp) {
          const levelId = currentRow.pending_level_id ?? currentEmp.current_level_id;
          const mgmtId = currentRow.pending_management_id ?? currentEmp.current_management_id;
          const ancId = currentRow.pending_anciennete_id ?? currentEmp.current_anciennete_id;
          const adj = currentRow.pending_salary_adjustment != null ? Number(currentRow.pending_salary_adjustment) : (Number(currentEmp.salary_adjustment) || 0);

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

          const empUpdates: Record<string, unknown> = {
            annual_salary_brut: total,
            current_level_id: levelId,
            current_management_id: mgmtId,
            current_anciennete_id: ancId,
            salary_adjustment: adj,
          };
          await supabase.from("employees").update(empUpdates).eq("id", currentRow.employee_id);

          const effectiveDate = currentRow.interview_date || new Date().toISOString().split("T")[0];
          const reason = `Suite à ${currentRow.type || "entretien"}`;
          const { error: histErr } = await supabase.from("employee_position_history").insert({
            employee_id: currentRow.employee_id,
            organization_id: organizationId,
            job_title: currentEmp.current_job_title ?? "",
            department_id: currentEmp.current_department_id ?? null,
            level_id: levelId,
            management_id: mgmtId,
            anciennete_id: ancId,
            salary_adjustment: adj,
            start_date: effectiveDate,
            annual_salary_brut: total,
            annual_salary: total,
            effective_date: effectiveDate,
            reason,
          });
          if (histErr) {
            console.error("employee_position_history insert error:", histErr);
            return NextResponse.json({ error: "Impossible d'enregistrer l'évolution de la rémunération. " + histErr.message }, { status: 500 });
          }

          if (currentEmp.email) {
            const { data: org } = await supabase.from("organizations").select("name").eq("id", organizationId).single();
            await sendSalaryChangeEmail({
              to: currentEmp.email,
              talentFirstName: currentEmp.first_name ?? "",
              talentLastName: currentEmp.last_name ?? "",
              organizationName: org?.name ?? "",
              effectiveDate,
              newAnnualSalaryEur: total,
              reason,
            });
          }

          updates.status = "termine";
          updates.salary_adjustment = total;
          updates.pending_level_id = null;
          updates.pending_management_id = null;
          updates.pending_anciennete_id = null;
          updates.pending_salary_adjustment = null;
        }
      } else {
        updates.status = "termine";
      }
    } else {
      updates.status = "termine";
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 });
  }

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
