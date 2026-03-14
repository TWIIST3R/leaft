import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { updateSubscriptionSeats } from "@/lib/stripe/subscriptions";
import { sendRemoveTalentEmail } from "@/lib/email";

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

const EMPLOYEE_SELECT = `
  id, first_name, last_name, email, gender, birth_date, hire_date,
  current_job_title, current_level_id, current_department_id, manager_id,
  current_management_id, current_anciennete_id, salary_adjustment,
  location, annual_salary_brut, avatar_url, is_manager, created_at, updated_at
`;

async function computeSalary(
  supabase: ReturnType<typeof supabaseAdmin>,
  levelId: string | null,
  managementId: string | null,
  ancienneteId: string | null,
  adjustment: number
): Promise<number> {
  let total = adjustment || 0;

  if (levelId) {
    const { data } = await supabase.from("levels").select("montant_annuel").eq("id", levelId).single();
    if (data?.montant_annuel) total += Number(data.montant_annuel);
  }
  if (managementId) {
    const { data } = await supabase.from("grille_extra").select("montant_annuel").eq("id", managementId).single();
    if (data?.montant_annuel) total += Number(data.montant_annuel);
  }
  if (ancienneteId) {
    const { data } = await supabase.from("grille_extra").select("montant_annuel").eq("id", ancienneteId).single();
    if (data?.montant_annuel) total += Number(data.montant_annuel);
  }

  return total;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const organizationId = await getOrganizationId(userId, orgId ?? null);
    if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

    const { id } = await params;
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("employees")
      .select(EMPLOYEE_SELECT)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Talent introuvable" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("Employee GET:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
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

    const updates: Record<string, unknown> = {};
    if (typeof body.first_name === "string" && body.first_name.trim()) updates.first_name = body.first_name.trim();
    if (typeof body.last_name === "string" && body.last_name.trim()) updates.last_name = body.last_name.trim();
    if (typeof body.email === "string" && body.email.trim()) updates.email = body.email.trim();
    if (typeof body.current_job_title === "string") updates.current_job_title = body.current_job_title.trim();
    if (body.hire_date !== undefined) updates.hire_date = body.hire_date;
    if (body.gender !== undefined) updates.gender = body.gender || null;
    if (body.birth_date !== undefined) updates.birth_date = body.birth_date || null;
    if (body.current_department_id !== undefined) updates.current_department_id = body.current_department_id || null;
    if (body.current_level_id !== undefined) updates.current_level_id = body.current_level_id || null;
    if (body.current_management_id !== undefined) updates.current_management_id = body.current_management_id || null;
    if (body.current_anciennete_id !== undefined) updates.current_anciennete_id = body.current_anciennete_id || null;
    if (body.salary_adjustment !== undefined) updates.salary_adjustment = body.salary_adjustment ?? 0;
    if (body.manager_id !== undefined) updates.manager_id = body.manager_id || null;
    if (body.location !== undefined) updates.location = typeof body.location === "string" ? body.location.trim() || null : null;
    if (body.is_manager !== undefined) updates.is_manager = !!body.is_manager;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const needsRecompute = body.current_level_id !== undefined ||
      body.current_management_id !== undefined ||
      body.current_anciennete_id !== undefined ||
      body.salary_adjustment !== undefined;

    if (needsRecompute) {
      const { data: current } = await supabase.from("employees").select("current_level_id, current_management_id, current_anciennete_id, salary_adjustment").eq("id", id).single();
      if (current) {
        const levelId = body.current_level_id !== undefined ? (body.current_level_id || null) : current.current_level_id;
        const mgmtId = body.current_management_id !== undefined ? (body.current_management_id || null) : current.current_management_id;
        const ancId = body.current_anciennete_id !== undefined ? (body.current_anciennete_id || null) : current.current_anciennete_id;
        const adj = body.salary_adjustment !== undefined ? (body.salary_adjustment ?? 0) : (current.salary_adjustment ?? 0);
        updates.annual_salary_brut = await computeSalary(supabase, levelId, mgmtId, ancId, Number(adj));
      }
    }

    const { data, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select(EMPLOYEE_SELECT)
      .single();

    if (error) {
      console.error("Error updating employee:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "Talent introuvable" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("Employee PATCH:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const organizationId = await getOrganizationId(userId, orgId ?? null);
    if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

    const { id } = await params;
    const supabase = supabaseAdmin();

    const { data: empData } = await supabase
      .from("employees")
      .select("first_name, last_name")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error deleting employee:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let billingInfo: { previousSeats: number; newSeats: number; creditCents: number; newMonthlyCents: number; newAnnualCents: number; planType: "monthly" | "annual" } | null = null;
    try {
      const { data: subRow } = await supabase
        .from("subscriptions")
        .select("seat_count")
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .maybeSingle();

      if (subRow) {
        const currentSeats = subRow.seat_count ?? 0;
        const newSeats = Math.max(1, currentSeats - 1);
        if (newSeats < currentSeats) {
          const result = await updateSubscriptionSeats(organizationId, newSeats);
          billingInfo = {
            previousSeats: result.previousSeatCount,
            newSeats: result.newSeatCount,
            creditCents: result.prorationAmountCents,
            newMonthlyCents: result.newMonthlyAmountCents,
            newAnnualCents: result.newAnnualAmountCents,
            planType: result.planType,
          };

          const user = await currentUser();
          const adminEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";
          if (adminEmail) {
            const { data: orgData } = await supabase.from("organizations").select("name").eq("id", organizationId).single();
            await sendRemoveTalentEmail({
              to: adminEmail,
              organizationName: orgData?.name ?? "Votre organisation",
              removedTalentName: empData ? `${empData.first_name} ${empData.last_name}` : "Talent",
              previousSeatCount: result.previousSeatCount,
              newSeatCount: result.newSeatCount,
              planType: result.planType,
              newAmountEur: (result.planType === "annual" ? result.newAnnualAmountCents : result.newMonthlyAmountCents) / 100,
              creditAmountEur: (Math.abs(result.prorationAmountCents) / 100).toFixed(2).replace(".", ","),
            });
          }
        }
      }
    } catch (billingErr) {
      console.error("Stripe billing update on delete (non-blocking):", billingErr);
    }

    return NextResponse.json({ success: true, billingInfo });
  } catch (e) {
    console.error("Employee DELETE:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
