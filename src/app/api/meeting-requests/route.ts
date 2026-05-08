import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, generateICS } from "@/lib/resend";
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
      .select("id, employee_id, requested_to, note, status, created_at, updated_at, group_id, interview_type, state, confirmed_slot_id")
      .eq("organization_id", organizationId)
      .neq("state", "closed")
      .order("created_at", { ascending: false });

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rowsWithMeta = (data ?? []) as {
      id: string;
      employee_id: string;
      requested_to: string;
      note: string | null;
      status: string;
      created_at: string;
      updated_at: string | null;
      group_id: string | null;
      interview_type?: string | null;
      state?: string | null;
      confirmed_slot_id?: string | null;
    }[];

    const groupIds = Array.from(new Set(rowsWithMeta.map((r) => r.group_id).filter(Boolean))) as string[];
    const slotMap = new Map<string, { id: string; starts_at: string; ends_at: string; proposed_by: string; status: string }[]>();

    if (groupIds.length > 0) {
      const { data: slots } = await supabase
        .from("meeting_request_slots")
        .select("id, group_id, starts_at, ends_at, proposed_by, status")
        .eq("organization_id", organizationId)
        .in("group_id", groupIds)
        .order("starts_at", { ascending: true });

      (slots ?? []).forEach((s) => {
        const gid = (s as { group_id: string }).group_id;
        slotMap.set(gid, [...(slotMap.get(gid) ?? []), s as any]);
      });
    }

    if (forAdmin) {
      const empIds = [...new Set(rowsWithMeta.map((r) => r.employee_id))];
      if (empIds.length > 0) {
        const { data: emps } = await supabase
          .from("employees")
          .select("id, first_name, last_name, email")
          .in("id", empIds);
        const empMap = new Map((emps ?? []).map((e) => [e.id, e]));
        const enriched = rowsWithMeta.map((r) => ({
          ...r,
          employee: empMap.get(r.employee_id) ?? null,
          slots: r.group_id ? (slotMap.get(r.group_id) ?? []) : [],
        }));
        return NextResponse.json(enriched);
      }
    }

    // Talent view: group multi-recipient requests (manager+rh) into one entry
    if (!forAdmin && employeeId) {
      const rows = rowsWithMeta;

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
          const state = items.find((i) => i.state)?.state ?? null;
          const confirmedSlotId = items.find((i) => i.confirmed_slot_id)?.confirmed_slot_id ?? null;
          return {
            id: groupId,
            group_id: groupId,
            employee_id: items[0]!.employee_id,
            requested_to: "both",
            requested_tos: requestedTos,
            note: items[0]!.note,
            interview_type: items[0]!.interview_type ?? null,
            status: combinedStatus,
            state,
            confirmed_slot_id: confirmedSlotId,
            created_at: items[0]!.created_at,
            updated_at: items.reduce<string | null>((acc, it) => (it.updated_at && (!acc || it.updated_at > acc) ? it.updated_at : acc), null),
            parts: items.map((i) => ({ id: i.id, requested_to: i.requested_to, status: i.status })),
            slots: slotMap.get(groupId) ?? [],
          };
        }),
        ...singles.map((r) => ({
          ...r,
          parts: [{ id: r.id, requested_to: r.requested_to, status: r.status }],
          requested_tos: [r.requested_to],
          slots: r.group_id ? (slotMap.get(r.group_id) ?? []) : [],
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return NextResponse.json(result);
    }

    return NextResponse.json(
      rowsWithMeta.map((r) => ({
        ...r,
        slots: r.group_id ? (slotMap.get(r.group_id) ?? []) : [],
      }))
    );
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
    const { requested_to, note, interview_type, slots } = body as {
      requested_to: string | string[];
      note?: string | null;
      interview_type?: string | null;
      slots?: { starts_at: string; ends_at: string }[];
    };

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

    const groupId = crypto.randomUUID();
    const inserts = unique.map((to) => ({
      employee_id: employee.id,
      organization_id: organizationId,
      requested_to: to,
      note: note || null,
      group_id: groupId,
      interview_type: typeof interview_type === "string" && interview_type.trim() ? interview_type.trim() : null,
      state: "awaiting_admin_choice",
    }));

    const { data: createdRows, error } = await supabase
      .from("meeting_requests")
      .insert(inserts)
      .select("id, employee_id, requested_to, note, status, created_at, updated_at, group_id, interview_type");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const normalizedSlots = Array.isArray(slots) ? slots : [];
    if (normalizedSlots.length > 0) {
      const cleanedSlots = normalizedSlots
        .slice(0, 3)
        .map((s) => ({
          starts_at: String(s.starts_at),
          ends_at: String(s.ends_at),
        }))
        .filter((s) => s.starts_at && s.ends_at);

      const toInsert = cleanedSlots.map((s) => ({
        organization_id: organizationId,
        group_id: groupId,
        proposed_by: "talent",
        starts_at: s.starts_at,
        ends_at: s.ends_at,
        status: "proposed",
      }));

      if (toInsert.length > 0) {
        await supabase.from("meeting_request_slots").insert(toInsert);
      }
    }

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
      const slotRows = Array.isArray(slots) ? slots.slice(0, 3) : [];
      const slotsHtml = slotRows.length > 0
        ? `<ul style="margin:0 0 10px;font-size:14px;padding-left:18px;">
            ${slotRows.map((s) => {
              const start = new Date(s.starts_at);
              const end = new Date(s.ends_at);
              const label = `${start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} • ${start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}–${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
              return `<li>${label}</li>`;
            }).join("")}
          </ul>`
        : "";
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
              ${slotRows.length > 0 ? `<p style="margin:0 0 6px;font-size:14px;"><strong>Créneaux proposés :</strong></p>${slotsHtml}` : ""}
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
    const supabase = supabaseAdmin();

    // Backward compatible payload: { id, status }
    if (body?.id && body?.status && ["accepted", "declined"].includes(body.status)) {
      const { id, status } = body as { id: string; status: "accepted" | "declined" };

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
    }

    // New scheduling payload: { group_id, action, ... }
    const { group_id, action } = body as { group_id?: string; action?: string };
    if (!group_id || !action) {
      return NextResponse.json({ error: "group_id et action requis" }, { status: 400 });
    }

    const { data: reqRows, error: reqErr } = await supabase
      .from("meeting_requests")
      .select("id, employee_id, requested_to, note, status, created_at, updated_at, group_id, interview_type, state, confirmed_slot_id")
      .eq("organization_id", organizationId)
      .eq("group_id", group_id);

    if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });
    if (!reqRows || reqRows.length === 0) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });

    const employeeId = (reqRows[0] as any).employee_id as string;
    const requestedTos = Array.from(new Set(reqRows.map((r: any) => r.requested_to).filter(Boolean))) as string[];
    const interviewType = (reqRows[0] as any).interview_type as string | null | undefined;

    const { data: employee } = await supabase
      .from("employees")
      .select("id, first_name, last_name, email, clerk_user_id, manager_id")
      .eq("id", employeeId)
      .single();

    const talentName = employee ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() : "Le talent";
    let talentEmail = employee?.email ?? null;
    if (employee?.clerk_user_id) {
      try {
        const clerk = await clerkClient();
        const u = await clerk.users.getUser(employee.clerk_user_id);
        talentEmail =
          u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress
          ?? u.emailAddresses?.[0]?.emailAddress
          ?? talentEmail;
      } catch {
        // keep fallback
      }
    }

    // Resolve admin/manager emails (best-effort)
    const recipientEmails = new Set<string>();
    const recipientClerkUserIds = new Set<string>();

    if (requestedTos.includes("manager") && employee?.manager_id) {
      const { data: manager } = await supabase
        .from("employees")
        .select("email, clerk_user_id")
        .eq("id", employee.manager_id)
        .single();
      if (manager?.clerk_user_id) recipientClerkUserIds.add(manager.clerk_user_id);
      else if (manager?.email) recipientEmails.add(manager.email);
    }

    if (requestedTos.includes("rh")) {
      const { data: adminUsers } = await supabase
        .from("user_organizations")
        .select("clerk_user_id")
        .eq("organization_id", organizationId)
        .in("role", ["Owner", "RH", "Admin", "admin"])
        .limit(10);
      (adminUsers ?? []).map((u: any) => u.clerk_user_id).filter(Boolean).forEach((id: string) => recipientClerkUserIds.add(id));
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
      } catch {
        // ignore
      }
    }

    const formatSlotsList = (slots: { starts_at: string; ends_at: string }[]) => {
      if (!slots.length) return "";
      return `<ul style="margin:0 0 10px;font-size:14px;padding-left:18px;">
        ${slots.map((s) => {
          const start = new Date(s.starts_at);
          const end = new Date(s.ends_at);
          const label = `${start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} • ${start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}–${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
          return `<li>${label}</li>`;
        }).join("")}
      </ul>`;
    };

    if (action === "choose_slot") {
      const { slot_id } = body as { slot_id?: string };
      if (!slot_id) return NextResponse.json({ error: "slot_id requis" }, { status: 400 });

      await supabase
        .from("meeting_request_slots")
        .update({ status: "superseded" })
        .eq("organization_id", organizationId)
        .eq("group_id", group_id)
        .neq("id", slot_id);
      await supabase
        .from("meeting_request_slots")
        .update({ status: "chosen" })
        .eq("organization_id", organizationId)
        .eq("id", slot_id);

      const { data: chosenSlot, error: chosenSlotErr } = await supabase
        .from("meeting_request_slots")
        .select("starts_at, ends_at, proposed_by")
        .eq("organization_id", organizationId)
        .eq("id", slot_id)
        .maybeSingle();

      if (chosenSlotErr) return NextResponse.json({ error: chosenSlotErr.message }, { status: 500 });
      if (!chosenSlot) return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });

      // If RH chooses among talent-proposed slots, it is considered confirmed immediately (no Talent action required).
      if (chosenSlot.proposed_by === "talent") {
        await supabase
          .from("meeting_requests")
          .update({
            state: "confirmed",
            status: "accepted",
            confirmed_slot_id: slot_id,
            updated_at: new Date().toISOString(),
          })
          .eq("organization_id", organizationId)
          .eq("group_id", group_id);

        const startsAt = new Date(chosenSlot.starts_at);
        const endsAt = new Date(chosenSlot.ends_at);
        const interviewDate = startsAt.toISOString().slice(0, 10);
        const type = interviewType?.trim() || "Entretien";
        const note = (reqRows[0] as any).note as string | null;
        const timeLabel = `${startsAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}–${endsAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
        const dateLabel = startsAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

        const { data: createdInterview, error: interviewErr } = await supabase
          .from("interviews")
          .insert({
            organization_id: organizationId,
            employee_id: employeeId,
            interview_date: interviewDate,
            type,
            notes: note ? `Créneau validé: ${dateLabel} • ${timeLabel}\n\n${note}` : `Créneau validé: ${dateLabel} • ${timeLabel}`,
            status: "en_cours",
            created_by: userId,
          })
          .select("id, interview_date, type")
          .single();

        if (interviewErr) return NextResponse.json({ error: interviewErr.message }, { status: 500 });

        await supabase
          .from("meeting_requests")
          .update({ state: "closed", updated_at: new Date().toISOString() })
          .eq("organization_id", organizationId)
          .eq("group_id", group_id);

        const attendees = new Set<string>();
        if (talentEmail) attendees.add(talentEmail);
        recipientEmails.forEach((e) => attendees.add(e));

        const subject = `${type} – ${dateLabel} ${timeLabel}`;
        const description = `${type} - ${talentName}${note ? `\n\n${note}` : ""}`;

        await Promise.all(
          Array.from(attendees).map(async (to) => {
            const icsContent = generateICS({
              summary: type,
              description,
              dtStart: startsAt,
              dtEnd: endsAt,
              organizerEmail: "info@leaft.io",
              attendeeEmail: to,
            });

            const ctaTalent = `${clientEnv.NEXT_PUBLIC_APP_URL}/espace-talent`;
            const ctaRh = `${clientEnv.NEXT_PUBLIC_APP_URL}/dashboard`;

            return sendEmail({
              to,
              subject,
              html: emailLayout("", `
                <h2 style="margin:0 0 12px;font-size:18px;color:#0B0B0B;">Rendez-vous confirmé</h2>
                <p style="margin:0 0 10px;font-size:14px;color:rgba(11,11,11,0.75);">
                  Un rendez-vous a été confirmé.
                </p>
                <ul style="margin:0 0 14px;padding-left:18px;font-size:14px;">
                  <li><strong>Type :</strong> ${type}</li>
                  <li><strong>Date :</strong> ${dateLabel}</li>
                  <li><strong>Heure :</strong> ${timeLabel}</li>
                  <li><strong>Talent :</strong> ${talentName}</li>
                </ul>
                <p style="margin:0 0 10px;font-size:14px;">Invitation calendrier en pièce jointe.</p>
                <div style="margin:18px 0 0;">
                  <a href="${ctaRh}" style="display:inline-block;padding:10px 14px;border-radius:999px;background:#095228;color:#ffffff;text-decoration:none;font-weight:600;margin-right:8px;">
                    Ouvrir Leaft (RH)
                  </a>
                  <a href="${ctaTalent}" style="display:inline-block;padding:10px 14px;border-radius:999px;border:1px solid rgba(9,82,40,0.25);color:#095228;text-decoration:none;font-weight:600;">
                    Ouvrir Leaft (Talent)
                  </a>
                </div>
              `),
              attachments: [{ filename: "invite.ics", content: icsContent }],
            });
          })
        );

        return NextResponse.json({ ok: true, state: "closed", interview: createdInterview });
      }

      // Otherwise (admin-proposed slots), this is a proposal that requires Talent confirmation.
      await supabase
        .from("meeting_requests")
        .update({ state: "awaiting_talent_confirmation", confirmed_slot_id: slot_id, updated_at: new Date().toISOString() })
        .eq("organization_id", organizationId)
        .eq("group_id", group_id);

      if (talentEmail) {
        await sendEmail({
          to: talentEmail,
          subject: `Créneau proposé pour votre entretien${interviewType ? ` (${interviewType})` : ""}`,
          html: emailLayout("", `
            <h2 style="margin:0 0 12px;font-size:18px;color:#0B0B0B;">Proposition de créneau</h2>
            <p style="margin:0 0 10px;font-size:14px;color:rgba(11,11,11,0.75);">
              ${recipientEmails.size > 0 ? "Un" : "Votre"} interlocuteur a sélectionné un créneau pour votre rendez-vous.
            </p>
            <p style="margin:0 0 6px;font-size:14px;"><strong>Créneau sélectionné :</strong></p>
            ${formatSlotsList([{ starts_at: chosenSlot.starts_at, ends_at: chosenSlot.ends_at }])}
            <p style="margin:0 0 10px;font-size:14px;">Merci de confirmer (ou refuser) depuis votre espace Talent.</p>
          `),
        });
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "counter_propose") {
      const { slots } = body as { slots?: { starts_at: string; ends_at: string }[] };
      const slotRows = Array.isArray(slots) ? slots.slice(0, 3) : [];
      if (slotRows.length === 0) return NextResponse.json({ error: "slots requis (2-3 créneaux)" }, { status: 400 });

      await supabase
        .from("meeting_request_slots")
        .update({ status: "superseded" })
        .eq("organization_id", organizationId)
        .eq("group_id", group_id)
        .in("status", ["proposed", "chosen"]);

      await supabase
        .from("meeting_request_slots")
        .insert(
          slotRows.map((s) => ({
            organization_id: organizationId,
            group_id,
            proposed_by: "admin",
            starts_at: s.starts_at,
            ends_at: s.ends_at,
            status: "proposed",
          }))
        );

      await supabase
        .from("meeting_requests")
        .update({ state: "awaiting_talent_confirmation", confirmed_slot_id: null, updated_at: new Date().toISOString() })
        .eq("organization_id", organizationId)
        .eq("group_id", group_id);

      if (talentEmail) {
        await sendEmail({
          to: talentEmail,
          subject: `Contre-proposition de créneaux${interviewType ? ` (${interviewType})` : ""}`,
          html: emailLayout("", `
            <h2 style="margin:0 0 12px;font-size:18px;color:#0B0B0B;">Contre-proposition</h2>
            <p style="margin:0 0 10px;font-size:14px;color:rgba(11,11,11,0.75);">
              Votre interlocuteur vous propose de nouveaux créneaux pour votre rendez-vous.
            </p>
            <p style="margin:0 0 6px;font-size:14px;"><strong>Créneaux proposés :</strong></p>
            ${formatSlotsList(slotRows)}
            <p style="margin:0 0 10px;font-size:14px;">Choisissez un créneau depuis votre espace Talent.</p>
          `),
        });
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "talent_accept") {
      const { slot_id } = body as { slot_id?: string };
      const finalSlotId = slot_id || (reqRows[0] as any).confirmed_slot_id;
      if (!finalSlotId) return NextResponse.json({ error: "slot_id requis" }, { status: 400 });

      await supabase
        .from("meeting_request_slots")
        .update({ status: "chosen" })
        .eq("organization_id", organizationId)
        .eq("id", finalSlotId);

      await supabase
        .from("meeting_requests")
        .update({
          state: "confirmed",
          status: "accepted",
          confirmed_slot_id: finalSlotId,
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", organizationId)
        .eq("group_id", group_id);

      const { data: chosenSlot, error: chosenSlotErr } = await supabase
        .from("meeting_request_slots")
        .select("starts_at, ends_at")
        .eq("organization_id", organizationId)
        .eq("id", finalSlotId)
        .maybeSingle();

      if (chosenSlotErr) return NextResponse.json({ error: chosenSlotErr.message }, { status: 500 });
      if (!chosenSlot) return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });

      const startsAt = new Date(chosenSlot.starts_at);
      const endsAt = new Date(chosenSlot.ends_at);
      const interviewDate = startsAt.toISOString().slice(0, 10);
      const type = interviewType?.trim() || "Entretien";
      const note = (reqRows[0] as any).note as string | null;
      const timeLabel = `${startsAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}–${endsAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
      const dateLabel = startsAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

      const { data: createdInterview, error: interviewErr } = await supabase
        .from("interviews")
        .insert({
          organization_id: organizationId,
          employee_id: employeeId,
          interview_date: interviewDate,
          type,
          notes: note ? `Créneau validé: ${dateLabel} • ${timeLabel}\n\n${note}` : `Créneau validé: ${dateLabel} • ${timeLabel}`,
          status: "en_cours",
          created_by: userId,
        })
        .select("id, interview_date, type")
        .single();

      if (interviewErr) return NextResponse.json({ error: interviewErr.message }, { status: 500 });

      // Close the RDV request so it disappears from lists
      await supabase
        .from("meeting_requests")
        .update({ state: "closed", updated_at: new Date().toISOString() })
        .eq("organization_id", organizationId)
        .eq("group_id", group_id);

      // Send confirmation + ICS to all concerned parties
      const attendees = new Set<string>();
      if (talentEmail) attendees.add(talentEmail);
      recipientEmails.forEach((e) => attendees.add(e));

      const subject = `${type} – ${dateLabel} ${timeLabel}`;
      const description = `${type} - ${talentName}${note ? `\n\n${note}` : ""}`;

      await Promise.all(
        Array.from(attendees).map(async (to) => {
          const icsContent = generateICS({
            summary: type,
            description,
            dtStart: startsAt,
            dtEnd: endsAt,
            organizerEmail: "info@leaft.io",
            attendeeEmail: to,
          });

          const ctaTalent = `${clientEnv.NEXT_PUBLIC_APP_URL}/espace-talent`;
          const ctaRh = `${clientEnv.NEXT_PUBLIC_APP_URL}/dashboard`;

          return sendEmail({
            to,
            subject,
            html: emailLayout("", `
              <h2 style="margin:0 0 12px;font-size:18px;color:#0B0B0B;">Rendez-vous confirmé</h2>
              <p style="margin:0 0 10px;font-size:14px;color:rgba(11,11,11,0.75);">
                Un rendez-vous a été confirmé.
              </p>
              <ul style="margin:0 0 14px;padding-left:18px;font-size:14px;">
                <li><strong>Type :</strong> ${type}</li>
                <li><strong>Date :</strong> ${dateLabel}</li>
                <li><strong>Heure :</strong> ${timeLabel}</li>
                <li><strong>Talent :</strong> ${talentName}</li>
              </ul>
              <p style="margin:0 0 10px;font-size:14px;">Invitation calendrier en pièce jointe.</p>
              <div style="margin:18px 0 0;">
                <a href="${ctaRh}" style="display:inline-block;padding:10px 14px;border-radius:999px;background:#095228;color:#ffffff;text-decoration:none;font-weight:600;margin-right:8px;">
                  Ouvrir Leaft (RH)
                </a>
                <a href="${ctaTalent}" style="display:inline-block;padding:10px 14px;border-radius:999px;border:1px solid rgba(9,82,40,0.25);color:#095228;text-decoration:none;font-weight:600;">
                  Ouvrir Leaft (Talent)
                </a>
              </div>
            `),
            attachments: [{ filename: "invite.ics", content: icsContent }],
          });
        })
      );

      return NextResponse.json({ ok: true, state: "closed", interview: createdInterview });
    }

    if (action === "talent_decline") {
      await supabase
        .from("meeting_requests")
        .update({ state: "awaiting_admin_choice", confirmed_slot_id: null, updated_at: new Date().toISOString() })
        .eq("organization_id", organizationId)
        .eq("group_id", group_id);

      if (recipientEmails.size > 0) {
        await Promise.all(
          Array.from(recipientEmails).map((to) =>
            sendEmail({
              to,
              subject: `Créneau refusé par ${talentName}${interviewType ? ` (${interviewType})` : ""}`,
              html: emailLayout("", `
                <h2 style="margin:0 0 12px;font-size:18px;color:#0B0B0B;">Créneau refusé</h2>
                <p style="margin:0 0 10px;font-size:14px;color:rgba(11,11,11,0.75);">
                  <strong>${talentName}</strong> a refusé le créneau proposé. Vous pouvez contre-proposer de nouveaux créneaux.
                </p>
              `),
            })
          )
        );
      }

      return NextResponse.json({ ok: true, state: "awaiting_admin_choice" });
    }

    return NextResponse.json({ error: "action inconnue" }, { status: 400 });
  } catch (e) {
    console.error("MeetingRequests PATCH:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
