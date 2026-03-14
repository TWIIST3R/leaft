import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { previewAddSeats } from "@/lib/stripe/subscriptions";

async function getOrganizationId(userId: string, orgId: string | null) {
  const supabase = supabaseAdmin();
  if (orgId) {
    const { data } = await supabase.from("organizations").select("id").eq("clerk_organization_id", orgId).single();
    if (data) return data.id;
  }
  const { data: userOrg } = await supabase.from("user_organizations").select("organization_id").eq("clerk_user_id", userId).maybeSingle();
  return userOrg?.organization_id ?? null;
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
    } catch {
      return { rows: [], error: "Fichier Excel invalide." };
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
      return NextResponse.json({ error: "Format non supporté." }, { status: 400 });
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

    let validCount = 0;
    const errors: { row: number; message: string }[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r].map(normalizeCell);
      const first_name = get(row, "Prénom");
      const last_name = get(row, "Nom");
      const email = get(row, "Email");
      const current_job_title = get(row, "Poste");
      const hire_date = get(row, "Date d'entrée") || null;

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
      validCount++;
    }

    let billingPreview: {
      previousSeatCount: number;
      newSeatCount: number;
      prorationAmountCents: number;
      newMonthlyAmountCents: number;
      newAnnualAmountCents: number;
      planType: "monthly" | "annual";
      nextBillingDate: string | null;
    } | null = null;
    if (validCount > 0) {
      billingPreview = await previewAddSeats(organizationId, validCount);
    }

    return NextResponse.json({
      validCount,
      totalRows: rows.length - 1,
      errors,
      billingPreview,
    });
  } catch (e) {
    console.error("Bulk preview:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
