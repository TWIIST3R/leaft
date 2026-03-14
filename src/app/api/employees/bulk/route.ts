import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { updateSubscriptionSeats } from "@/lib/stripe/subscriptions";
import { sendAddTalentsEmail } from "@/lib/email";

async function getOrganizationId(userId: string, orgId: string | null) {
  const supabase = supabaseAdmin();
  if (orgId) {
    const { data } = await supabase.from("organizations").select("id").eq("clerk_organization_id", orgId).single();
    if (data) return data.id;
  }
  const { data: userOrg } = await supabase.from("user_organizations").select("organization_id").eq("clerk_user_id", userId).maybeSingle();
  return userOrg?.organization_id ?? null;
}

async function getClerkOrgId(organizationId: string): Promise<string | null> {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("organizations").select("clerk_organization_id").eq("id", organizationId).single();
  return data?.clerk_organization_id ?? null;
}

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

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if ((c === ";" || c === ",") && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  out.push(cur.trim());
  return out;
}

const COLUMNS = [
  "Prénom",
  "Nom",
  "Email",
  "Poste",
  "Date d'entrée",
  "Genre",
  "Date de naissance",
  "Localisation",
  "Département",
  "Niveau",
  "Management",
  "Ancienneté",
  "Ajustement annuel",
  "Manager",
  "Est manager",
];

function normalizeCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return String(value);
  return String(value).trim();
}

async function parseUploadToRows(file: File): Promise<{ rows: string[][]; error?: string }> {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const firstSheet = wb.SheetNames[0] ? wb.Sheets[wb.SheetNames[0]] : null;
      if (!firstSheet) return { rows: [], error: "Feuille Excel vide" };
      const data = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, defval: "" });
      const rows = data.map((row) => (Array.isArray(row) ? row.map(normalizeCell) : [normalizeCell(row)]));
      return { rows };
    } catch (e) {
      return { rows: [], error: "Fichier Excel invalide. Utilisez un fichier .xlsx ou importez en CSV." };
    }
  }
  const text = await file.text();
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim());
  const rows = lines.map((line) => parseCsvLine(line));
  return { rows };
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const organizationId = await getOrganizationId(userId, orgId ?? null);
    if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

    const name = (file.name || "").toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      return NextResponse.json({ error: "Format non supporté. Utilisez un fichier CSV ou Excel (.xlsx, .xls)." }, { status: 400 });
    }

    const { rows, error: parseError } = await parseUploadToRows(file);
    if (parseError) return NextResponse.json({ error: parseError }, { status: 400 });
    if (rows.length < 2) return NextResponse.json({ error: "Le fichier doit contenir une ligne d'en-tête et au moins une ligne de données" }, { status: 400 });

    const headerLine = rows[0].map((h) => normalizeCell(h));
    const colIndex: Record<string, number> = {};
    COLUMNS.forEach((colName) => {
      const i = headerLine.findIndex((h) => h.replace(/\s+/g, " ").trim().toLowerCase() === colName.toLowerCase());
      if (i >= 0) colIndex[colName] = i;
    });

    const get = (row: string[], key: string) => (colIndex[key] !== undefined ? normalizeCell(row[colIndex[key]]) : "");

    const supabase = supabaseAdmin();
    const { data: departments } = await supabase.from("departments").select("id, name").eq("organization_id", organizationId);
    const { data: levels } = await supabase.from("levels").select("id, name, department_id").in("department_id", (departments ?? []).map((d) => d.id));
    const { data: grilleExtra } = await supabase.from("grille_extra").select("id, name, type").eq("organization_id", organizationId);
    const { data: allEmployees } = await supabase.from("employees").select("id, first_name, last_name, email, is_manager").eq("organization_id", organizationId);

    const managementLevels = (grilleExtra ?? []).filter((g) => g.type === "management");
    const ancienneteLevels = (grilleExtra ?? []).filter((g) => g.type === "anciennete");
    const managers = (allEmployees ?? []).filter((e) => e.is_manager);

    const created: string[] = [];
    const errors: { row: number; message: string }[] = [];

    const clerkOrgId = orgId ?? await getClerkOrgId(organizationId);

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r].map(normalizeCell);
      const first_name = get(row, "Prénom");
      const last_name = get(row, "Nom");
      const email = get(row, "Email");
      const current_job_title = get(row, "Poste");
      const hire_date = get(row, "Date d'entrée") || null;
      const genre = get(row, "Genre") || null;
      const birth_date = get(row, "Date de naissance") || null;
      const location = get(row, "Localisation") || null;
      const deptName = get(row, "Département");
      const levelName = get(row, "Niveau");
      const mgmtName = get(row, "Management");
      const ancName = get(row, "Ancienneté");
      const adjustmentStr = get(row, "Ajustement annuel");
      const managerRef = get(row, "Manager");
      const isManagerStr = get(row, "Est manager");

      if (!first_name || !last_name) {
        errors.push({ row: r + 1, message: "Prénom et Nom requis" });
        continue;
      }
      if (!email) {
        errors.push({ row: r + 1, message: "Email requis" });
        continue;
      }
      if (!current_job_title) {
        errors.push({ row: r + 1, message: "Poste requis" });
        continue;
      }
      if (!hire_date) {
        errors.push({ row: r + 1, message: "Date d'entrée requise (format AAAA-MM-JJ)" });
        continue;
      }

      let current_department_id: string | null = null;
      if (deptName) {
        const dept = (departments ?? []).find((d) => d.name.trim().toLowerCase() === deptName.toLowerCase());
        if (dept) current_department_id = dept.id;
      }

      let current_level_id: string | null = null;
      if (levelName && current_department_id) {
        const lv = (levels ?? []).find((l) => l.department_id === current_department_id && l.name.trim().toLowerCase() === levelName.toLowerCase());
        if (lv) current_level_id = lv.id;
      } else if (levelName) {
        const lv = (levels ?? []).find((l) => l.name.trim().toLowerCase() === levelName.toLowerCase());
        if (lv) current_level_id = lv.id;
      }

      let current_management_id: string | null = null;
      if (mgmtName) {
        const m = managementLevels.find((x) => x.name.trim().toLowerCase() === mgmtName.toLowerCase());
        if (m) current_management_id = m.id;
      }

      let current_anciennete_id: string | null = null;
      if (ancName) {
        const a = ancienneteLevels.find((x) => x.name.trim().toLowerCase() === ancName.toLowerCase());
        if (a) current_anciennete_id = a.id;
      }

      const salary_adjustment = adjustmentStr ? Number(adjustmentStr) || 0 : 0;
      let manager_id: string | null = null;
      if (managerRef) {
        const parts = managerRef.split(/\s+/).filter(Boolean);
        const match = managers.find((e) => {
          const full = `${e.first_name} ${e.last_name}`.toLowerCase();
          const rev = `${e.last_name} ${e.first_name}`.toLowerCase();
          const ref = managerRef.toLowerCase();
          return full === ref || rev === ref || full.includes(ref) || ref.includes(full) || e.email?.toLowerCase() === ref;
        });
        if (match) manager_id = match.id;
      }

      const is_manager = /^(1|oui|yes|true|o|y)$/i.test(isManagerStr);

      const annual_salary_brut = await computeSalary(supabase, current_level_id, current_management_id, current_anciennete_id, salary_adjustment);

      const insert: Record<string, unknown> = {
        organization_id: organizationId,
        first_name,
        last_name,
        email,
        current_job_title,
        hire_date,
        annual_salary_brut,
        salary_adjustment,
        is_manager,
      };
      if (genre) insert.gender = genre;
      if (birth_date) insert.birth_date = birth_date;
      if (location) insert.location = location;
      if (current_department_id) insert.current_department_id = current_department_id;
      if (current_level_id) insert.current_level_id = current_level_id;
      if (current_management_id) insert.current_management_id = current_management_id;
      if (current_anciennete_id) insert.current_anciennete_id = current_anciennete_id;
      if (manager_id) insert.manager_id = manager_id;

      const { data: inserted, error } = await supabase.from("employees").insert(insert).select("id").single();

      if (error) {
        errors.push({ row: r + 1, message: error.message });
        continue;
      }
      if (inserted?.id) created.push(inserted.id);

      if (clerkOrgId && email) {
        try {
          const clerk = await clerkClient();
          await clerk.organizations.createOrganizationInvitation({
            organizationId: clerkOrgId,
            emailAddress: email,
            inviterUserId: userId,
            role: "org:member",
          });
        } catch {
          /* non-blocking */
        }
      }
    }

    let billingInfo: { previousSeats: number; newSeats: number; prorationCents: number; newMonthlyCents: number; newAnnualCents: number; planType: "monthly" | "annual" } | null = null;
    if (created.length > 0) {
      try {
        const { data: subRow } = await supabase
          .from("subscriptions")
          .select("seat_count")
          .eq("organization_id", organizationId)
          .eq("status", "active")
          .maybeSingle();
        if (subRow) {
          const currentSeats = subRow.seat_count ?? 0;
          const newSeats = currentSeats + created.length;
          const result = await updateSubscriptionSeats(organizationId, newSeats);
          billingInfo = {
            previousSeats: result.previousSeatCount,
            newSeats: result.newSeatCount,
            prorationCents: result.prorationAmountCents,
            newMonthlyCents: result.newMonthlyAmountCents,
            newAnnualCents: result.newAnnualAmountCents,
            planType: result.planType,
          };
          const user = await currentUser();
          const adminEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";
          if (adminEmail) {
            const { data: orgData } = await supabase.from("organizations").select("name").eq("id", organizationId).single();
            const subAny = result.subscription as { current_period_end?: number };
            const nextBillingDate = subAny?.current_period_end
              ? new Date(subAny.current_period_end * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
              : undefined;
            await sendAddTalentsEmail({
              to: adminEmail,
              organizationName: orgData?.name ?? "Votre organisation",
              previousSeatCount: result.previousSeatCount,
              newSeatCount: result.newSeatCount,
              addCount: created.length,
              planType: result.planType,
              newAmountEur: (result.planType === "annual" ? result.newAnnualAmountCents : result.newMonthlyAmountCents) / 100,
              prorationAmountEur: (result.prorationAmountCents / 100).toFixed(2).replace(".", ","),
              nextBillingDate,
            });
          }
        }
      } catch (billingErr) {
        console.error("Stripe bulk billing:", billingErr);
      }
    }

    return NextResponse.json({
      created: created.length,
      errors,
      billingInfo,
    });
  } catch (e) {
    console.error("Employees bulk POST:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
