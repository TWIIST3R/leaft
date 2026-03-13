import { NextRequest, NextResponse } from "next/server";

const BOM = "\uFEFF";
const HEADERS = [
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
const EXAMPLE_ROW = [
  "Marie",
  "Dupont",
  "marie.dupont@entreprise.com",
  "Designer",
  "2025-01-15",
  "F",
  "1990-05-20",
  "Paris",
  "Design",
  "Senior",
  "",
  "",
  "0",
  "",
  "Non",
];

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format")?.toLowerCase();

  if (format === "xlsx") {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([HEADERS, EXAMPLE_ROW]);
      XLSX.utils.book_append_sheet(wb, ws, "Talents");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="modele_import_talents.xlsx"',
        },
      });
    } catch {
      // Fallback: return CSV if xlsx not available
    }
  }

  const headerLine = HEADERS.map(escapeCsvCell).join(";");
  const exampleLine = EXAMPLE_ROW.map(escapeCsvCell).join(";");
  const csv = BOM + headerLine + "\n" + exampleLine + "\n";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="modele_import_talents.csv"',
    },
  });
}
