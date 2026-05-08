import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import crypto from "crypto";
import { clientEnv } from "@/env";
import { emailLayout } from "@/lib/email";

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
      .select("id, employee_id, requested_to, note, status, created_at, updated_at, group_id, interview_type")
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

    // Talent view: group multi-recipient requests (manager+rh) into one entry
    if (!forAdmin && employeeId) {
      const rows = (data ?? []) as {
        id: string;
        employee_id: string;
        requested_to: string;
        note: string | null;
        status: string;
        created_at: string;
        updated_at: string | null;
        group_id: string | null;
        interview_type?: string | null;
      }[];

      const grouped = new Map<string, typeof rows>();
      const singles: typeof rows = [];

      rows.forEach((r) => {
        if (r.group_id) {
          const key = r.group_id;
          grouped.set(key, [...(grouped.get(key) ?? []), r]);
        } else {
          singles.push(r);
        }
      });

      const result = [
        ...Array.from(grouped.entries()).map(([groupId, items]) => {
          const statuses = items.map((i) => i.status);
          const requestedTos = items.map((i) => i.requested_to);
          const combinedStatus = statuses.includes("declined")
            ? "declined"
            : statuses.every((s) => s === "accepted")
              ? "accepted"
              : "pending";
          return {
            id: groupId,
            group_id: groupId,
            employee_id: items[0]!.employee_id,
            requested_to: "both",
            requested_tos: requestedTos,
            note: items[0]!.note,
            interview_type: items[0]!.interview_type ?? null,
            status: combinedStatus,
            created_at: items[0]!.created_at,
            updated_at: items.reduce<string | null>((acc, it) => (it.updated_at && (!acc || it.updated_at > acc) ? it.updated_at : acc), null),
            parts: items.map((i) => ({ id: i.id, requested_to: i.requested_to, status: i.status })),
          };
        }),
        ...singles.map((r) => ({
          ...r,
          parts: [{ id: r.id, requested_to: r.requested_to, status: r.status }],
          requested_tos: [r.requested_to],
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return NextResponse.json(result);
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
    const { requested_to, note, interview_type } = body;

    const requestedList: string[] = Array.isArray(requested_to) ? requested_to : [requested_to];
    const cleaned = requestedList.filter(Boolean).map((s) => String(s).trim()).filter((s) => s.length > 0);
    const unique = Array.from(new Set(cleaned));
    const allowed = new Set(["manager", "rh"]);
    if (unique.length === 0 || unique.some((x) => !allowed.has(x))) {
      return NextResponse.json({ error: "requested_to doit être 'manager', 'rh' ou ['manager','rh']" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { data: employee } = await supabase
      .from("employees")
      .select("id, first_name, last_name, manager_id")
      .eq("organization_id", organizationId)
      .eq("clerk_user_id", userId)
      .single();

    if (!employee) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

    const groupId = unique.length > 1 ? crypto.randomUUID() : null;
    const inserts = unique.map((to) => ({
      employee_id: employee.id,
      organization_id: organizationId,
      requested_to: to,
      note: note || null,
      group_id: groupId,
      interview_type: typeof interview_type === "string" && interview_type.trim() ? interview_type.trim() : null,
    }));

    const { data: createdRows, error } = await supabase
      .from("meeting_requests")
      .insert(inserts)
      .select("id, employee_id, requested_to, note, status, created_at, updated_at, group_id, interview_type");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const recipientEmails = new Set<string>();
    const recipientClerkUserIds = new Set<string>();

    if (unique.includes("manager") && employee.manager_id) {
      const { data: manager } = await supabase
        .from("employees")
        .select("email, clerk_user_id")
        .eq("id", employee.manager_id)
        .single();
      if (manager?.clerk_user_id) recipientClerkUserIds.add(manager.clerk_user_id);
      else if (manager?.email) recipientEmails.add(manager.email);
    }

    if (unique.includes("rh")) {
      const { data: adminUsers } = await supabase
        .from("user_organizations")
        .select("clerk_user_id")
        .eq("organization_id", organizationId)
        .in("role", ["Owner", "RH", "Admin", "admin"])
        .limit(10);

      if (adminUsers && adminUsers.length > 0) {
        adminUsers.map((u) => u.clerk_user_id).filter(Boolean).forEach((id) => recipientClerkUserIds.add(id));
      }
    }

    if (recipientClerkUserIds.size > 0) {
      try {
        const clerk = await clerkClient();
        const users = await Promise.all(
          Array.from(recipientClerkUserIds).map(async (id) => {
            try {
              return await clerk.users.getUser(id);
            } catch {
              return null;
            }
          })
        );
        users
          .filter((u): u is NonNullable<typeof u> => !!u)
          .forEach((u) => {
            const email =
              u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress
              ?? u.emailAddresses?.[0]?.emailAddress;
            if (email) recipientEmails.add(email);
          });
      } catch (e) {
        console.warn("Clerk email resolution failed (non-blocking):", e);
      }
    }

    if (recipientEmails.size > 0) {
      const talentName = `${employee.first_name} ${employee.last_name}`;
      const targetLabel =
        unique.length > 1 ? "son manager et les RH" : unique[0] === "manager" ? "son manager" : "les RH";
      const typeLabel = typeof interview_type === "string" && interview_type.trim() ? interview_type.trim() : null;
      const ctaUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/dashboard/entretiens#demandes-rdv`;
      await Promise.all(
        Array.from(recipientEmails).map((to) =>
          sendEmail({
            to,
            subject: `Demande d'entretien${typeLabel ? ` (${typeLabel})` : ""} de ${talentName}`,
            html: emailLayout("", `
              <h2 style="margin:0 0 12px;font-size:18px;color:#0B0B0B;">Nouvelle demande de rendez-vous</h2>
              <p style="margin:0 0 10px;font-size:14px;color:rgba(11,11,11,0.75);">
                <strong>${talentName}</strong> souhaite un rendez-vous avec ${targetLabel}.
              </p>
              ${typeLabel ? `<p style="margin:0 0 10px;font-size:14px;"><strong>Type d'entretien :</strong> ${typeLabel}</p>` : ""}
              ${note ? `<p style="margin:0 0 10px;font-size:14px;"><strong>Note :</strong> ${note}</p>` : ""}
              <div style="margin:18px 0 0;">
                <a href="${ctaUrl}" style="display:inline-block;padding:10px 14px;border-radius:999px;background:#095228;color:#ffffff;text-decoration:none;font-weight:600;">
                  Voir la demande dans Leaft
                </a>
              </div>
              <p style="margin:10px 0 0;color:rgba(11,11,11,0.6);font-size:12px;">Ou copiez-collez : ${ctaUrl}</p>
            `),
          })
        )
      );
    }

    return NextResponse.json({ created: createdRows ?? [], group_id: groupId }, { status: 201 });
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
      .select("id, employee_id, requested_to, note, status, created_at, updated_at, group_id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (data) {
      const { data: emp } = await supabase
        .from("employees")
        .select("email, first_name, last_name, clerk_user_id")
        .eq("id", data.employee_id)
        .single();

      let talentEmail = emp?.email ?? null;
      const talentFirstName = emp?.first_name?.trim() || "";
      if (emp?.clerk_user_id) {
        try {
          const clerk = await clerkClient();
          const u = await clerk.users.getUser(emp.clerk_user_id);
          talentEmail =
            u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress
            ?? u.emailAddresses?.[0]?.emailAddress
            ?? talentEmail;
        } catch {
          // keep fallback
        }
      }

      if (talentEmail) {
        await sendEmail({
          to: talentEmail,
          subject: `Votre demande de RDV a été ${status === "accepted" ? "acceptée" : "déclinée"}`,
          html: emailLayout(
            "",
            `
              <h2 style="margin:0 0 14px;">Demande de rendez-vous ${status === "accepted" ? "acceptée" : "déclinée"}</h2>
              <p style="margin:0 0 14px;">Bonjour${talentFirstName ? ` ${talentFirstName}` : ""},</p>
              <p style="margin:0 0 14px;">Votre demande de rendez-vous a été <strong>${status === "accepted" ? "acceptée" : "déclinée"}</strong>.</p>
              ${status === "accepted" ? "<p style=\"margin:0 0 14px;\">Vous serez contacté(e) prochainement pour fixer une date.</p>" : ""}
            `,
          ),
        });
      }
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("MeetingRequests PATCH:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
