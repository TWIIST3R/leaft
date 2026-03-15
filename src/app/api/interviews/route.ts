import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, generateICS } from "@/lib/resend";

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
  const { employee_id, interview_date, type, email_subject, notes, justification, salary_adjustment } = body;

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
      status: "en_cours",
      created_by: userId,
    })
    .select(INTERVIEW_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const { data: emp } = await supabase
      .from("employees")
      .select("email, first_name, last_name")
      .eq("id", employee_id)
      .single();

    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .single();

    if (emp?.email) {
      const dtStart = new Date(`${interview_date}T09:00:00`);
      const dtEnd = new Date(`${interview_date}T10:00:00`);
      const subject = email_subject || type;
      const orgName = org?.name || "Leaft";

      const icsContent = generateICS({
        summary: subject,
        description: `${type} - ${orgName}${notes ? `\n\n${notes}` : ""}`,
        dtStart,
        dtEnd,
        organizerEmail: "info@leaft.io",
        attendeeEmail: emp.email,
      });

      await sendEmail({
        to: emp.email,
        subject: `${subject} – ${orgName}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:520px;">
            <h2 style="color:#095228;">${subject}</h2>
            <p>Bonjour ${emp.first_name},</p>
            <p>Un entretien a été programmé :</p>
            <ul>
              <li><strong>Type :</strong> ${type}</li>
              <li><strong>Date :</strong> ${new Date(interview_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</li>
              <li><strong>Organisation :</strong> ${orgName}</li>
            </ul>
            ${notes ? `<p><strong>Notes :</strong> ${notes}</p>` : ""}
            <p>Veuillez trouver ci-joint l'invitation calendrier.</p>
            <p style="color:#666;font-size:12px;">— L'équipe Leaft</p>
          </div>
        `,
        attachments: [{ filename: "invite.ics", content: icsContent }],
      });
    }
  } catch (emailErr) {
    console.error("Calendar email error (non-blocking):", emailErr);
  }

  return NextResponse.json(data, { status: 201 });
}
