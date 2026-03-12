import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";

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

    const employeeId = request.nextUrl.searchParams.get("employee_id");
    const forAdmin = request.nextUrl.searchParams.get("admin") === "true";

    let query = supabase
      .from("meeting_requests")
      .select("id, employee_id, requested_to, note, status, created_at, updated_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (forAdmin) {
      const empIds = [...new Set((data ?? []).map((r) => r.employee_id))];
      if (empIds.length > 0) {
        const { data: emps } = await supabase
          .from("employees")
          .select("id, first_name, last_name, email")
          .in("id", empIds);
        const empMap = new Map((emps ?? []).map((e) => [e.id, e]));
        const enriched = (data ?? []).map((r) => ({
          ...r,
          employee: empMap.get(r.employee_id) ?? null,
        }));
        return NextResponse.json(enriched);
      }
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("MeetingRequests GET:", e);
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
    const { requested_to, note } = body;

    if (!requested_to || !["manager", "rh"].includes(requested_to)) {
      return NextResponse.json({ error: "requested_to doit être 'manager' ou 'rh'" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { data: employee } = await supabase
      .from("employees")
      .select("id, first_name, last_name, manager_id")
      .eq("organization_id", organizationId)
      .eq("clerk_user_id", userId)
      .single();

    if (!employee) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

    const { data: created, error } = await supabase
      .from("meeting_requests")
      .insert({
        employee_id: employee.id,
        organization_id: organizationId,
        requested_to,
        note: note || null,
      })
      .select("id, employee_id, requested_to, note, status, created_at, updated_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let recipientEmail: string | null = null;
    if (requested_to === "manager" && employee.manager_id) {
      const { data: manager } = await supabase.from("employees").select("email").eq("id", employee.manager_id).single();
      recipientEmail = manager?.email ?? null;
    }

    if (requested_to === "rh" || !recipientEmail) {
      const { data: adminUsers } = await supabase
        .from("user_organizations")
        .select("clerk_user_id")
        .eq("organization_id", organizationId)
        .in("role", ["Owner", "admin", "RH"])
        .limit(1);

      if (adminUsers?.[0]) {
        const { data: adminEmp } = await supabase
          .from("employees")
          .select("email")
          .eq("clerk_user_id", adminUsers[0].clerk_user_id)
          .limit(1)
          .maybeSingle();
        recipientEmail = adminEmp?.email ?? null;
      }
    }

    if (recipientEmail) {
      const talentName = `${employee.first_name} ${employee.last_name}`;
      await sendEmail({
        to: recipientEmail,
        subject: `Demande de RDV de ${talentName}`,
        html: `
          <h2>Nouvelle demande de rendez-vous</h2>
          <p><strong>${talentName}</strong> souhaite un rendez-vous avec ${requested_to === "manager" ? "son manager" : "les RH"}.</p>
          ${note ? `<p><strong>Note :</strong> ${note}</p>` : ""}
          <p>Connectez-vous à Leaft pour répondre à cette demande.</p>
        `,
      });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("MeetingRequests POST:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const organizationId = await getOrganizationId(userId, orgId ?? null);
    if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status || !["accepted", "declined"].includes(status)) {
      return NextResponse.json({ error: "id et status (accepted/declined) requis" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("meeting_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select("id, employee_id, requested_to, note, status, created_at, updated_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (data) {
      const { data: emp } = await supabase.from("employees").select("email, first_name, last_name").eq("id", data.employee_id).single();
      if (emp?.email) {
        await sendEmail({
          to: emp.email,
          subject: `Votre demande de RDV a été ${status === "accepted" ? "acceptée" : "déclinée"}`,
          html: `
            <h2>Demande de rendez-vous ${status === "accepted" ? "acceptée" : "déclinée"}</h2>
            <p>Bonjour ${emp.first_name},</p>
            <p>Votre demande de rendez-vous a été <strong>${status === "accepted" ? "acceptée" : "déclinée"}</strong>.</p>
            ${status === "accepted" ? "<p>Vous serez contacté(e) prochainement pour fixer une date.</p>" : ""}
          `,
        });
      }
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("MeetingRequests PATCH:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
