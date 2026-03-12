import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendInterviewReminderEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const now = new Date();

  const target7 = new Date(now);
  target7.setDate(target7.getDate() + 7);
  const date7 = target7.toISOString().split("T")[0];

  const target1 = new Date(now);
  target1.setDate(target1.getDate() + 1);
  const date1 = target1.toISOString().split("T")[0];

  const { data: interviews } = await supabase
    .from("interviews")
    .select("id, employee_id, organization_id, interview_date, type")
    .in("interview_date", [date7, date1]);

  if (!interviews || interviews.length === 0) {
    return NextResponse.json({ sent: 0, message: "No upcoming interviews" });
  }

  let sentCount = 0;

  for (const iv of interviews) {
    const daysUntil = iv.interview_date === date1 ? 1 : 7;

    const { data: emp } = await supabase
      .from("employees")
      .select("id, first_name, last_name, email, manager_id")
      .eq("id", iv.employee_id)
      .single();

    if (!emp) continue;

    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", iv.organization_id)
      .single();

    const orgName = org?.name ?? "Votre organisation";
    const talentName = `${emp.first_name} ${emp.last_name}`;
    const formattedDate = new Date(iv.interview_date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const recipients: string[] = [];

    if (emp.email) recipients.push(emp.email);

    if (emp.manager_id) {
      const { data: manager } = await supabase
        .from("employees")
        .select("email")
        .eq("id", emp.manager_id)
        .single();
      if (manager?.email) recipients.push(manager.email);
    }

    const { data: admins } = await supabase
      .from("user_organizations")
      .select("clerk_user_id")
      .eq("organization_id", iv.organization_id)
      .in("role", ["Owner", "RH", "admin"]);

    if (admins) {
      for (const admin of admins) {
        const { data: adminEmp } = await supabase
          .from("employees")
          .select("email")
          .eq("organization_id", iv.organization_id)
          .limit(1);
        if (adminEmp?.[0]?.email && !recipients.includes(adminEmp[0].email)) {
          recipients.push(adminEmp[0].email);
        }
      }
    }

    const uniqueRecipients = [...new Set(recipients)];

    for (const to of uniqueRecipients) {
      await sendInterviewReminderEmail({
        to,
        talentName,
        interviewType: iv.type,
        interviewDate: formattedDate,
        organizationName: orgName,
        daysUntil,
      });
      sentCount++;
    }
  }

  return NextResponse.json({ sent: sentCount, interviews: interviews.length });
}
