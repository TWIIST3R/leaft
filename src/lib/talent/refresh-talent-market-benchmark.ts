import { optionalEnv } from "@/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  extractAnnualSalariesFromPayload,
  fetchGlassdoorListing,
  fetchIndeedListing,
  mergeMarketStats,
} from "@/lib/hasdata/job-market";

export type TalentMarketBenchmarkRow = {
  employee_id: string;
  organization_id: string;
  search_keyword: string;
  search_location: string;
  salary_at_fetch: number | null;
  p25_annual: number | null;
  p50_annual: number | null;
  p75_annual: number | null;
  sample_size: number;
  indeed_ok: boolean;
  glassdoor_ok: boolean;
  indeed_count: number;
  glassdoor_count: number;
  market_compa_pct: number | null;
  position_vs_market: string | null;
  fetch_error: string | null;
  fetched_at: string;
};

function positionLabel(
  salary: number,
  p25: number | null,
  p50: number | null,
  p75: number | null,
): string | null {
  if (p25 == null || p50 == null || p75 == null) return null;
  if (salary < p25) return "sous le quartile bas des offres agrégées";
  if (salary < p50) return "entre le 1er quartile et la médiane marché (offres)";
  if (salary <= p75) return "entre la médiane et le 3e quartile marché (offres)";
  return "au-dessus du 3e quartile des offres agrégées";
}

export function deriveMarketSearchParams(employee: {
  current_job_title: string | null;
  location: string | null;
}): { keyword: string; location: string } {
  const keyword = (employee.current_job_title || "emploi").trim().slice(0, 120) || "emploi";
  const location = (employee.location && employee.location.trim().length > 1 ? employee.location.trim() : "France").slice(0, 120);
  return { keyword, location };
}

export function isTalentMarketBenchmarkStale(
  row: TalentMarketBenchmarkRow | null,
  salary: number | null,
  keyword: string,
  location: string,
): boolean {
  if (!row) return true;
  if (row.search_keyword !== keyword || row.search_location !== location) return true;
  const stored = row.salary_at_fetch != null ? Number(row.salary_at_fetch) : null;
  const cur = salary != null ? Number(salary) : null;
  if (stored !== cur) return true;
  return false;
}

/** Supprime le cache comparatif pour forcer un nouvel appel HasData au prochain chargement utile. */
export async function invalidateTalentMarketBenchmark(
  supabase: ReturnType<typeof supabaseAdmin>,
  employeeId: string,
): Promise<void> {
  await supabase.from("talent_market_benchmarks").delete().eq("employee_id", employeeId);
}

/**
 * Appelle HasData et enregistre le résultat (y compris en cas d’erreur partielle, pour ne pas boucler à chaque hit).
 */
export async function refreshTalentMarketBenchmark(
  supabase: ReturnType<typeof supabaseAdmin>,
  params: {
    employeeId: string;
    organizationId: string;
    keyword: string;
    location: string;
    annualSalaryBrut: number | null;
  },
): Promise<TalentMarketBenchmarkRow | null> {
  const apiKey = optionalEnv.HASDATA_API_KEY;
  const salary = params.annualSalaryBrut != null ? Number(params.annualSalaryBrut) : null;

  const baseRow = {
    employee_id: params.employeeId,
    organization_id: params.organizationId,
    search_keyword: params.keyword,
    search_location: params.location,
    salary_at_fetch: salary,
    fetched_at: new Date().toISOString(),
  };

  if (!apiKey) {
    return null;
  }

  let fetchError: string | null = null;
  let indeed = { ok: false, status: 0, count: 0 };
  let glassdoor = { ok: false, status: 0, count: 0 };
  let p25: number | null = null;
  let p50: number | null = null;
  let p75: number | null = null;
  let sampleSize = 0;

  try {
    const [indeedRes, glassdoorRes] = await Promise.all([
      fetchIndeedListing({ apiKey, keyword: params.keyword, location: params.location }),
      fetchGlassdoorListing({ apiKey, keyword: params.keyword, location: params.location }),
    ]);
    indeed = {
      ok: indeedRes.ok,
      status: indeedRes.status,
      count: indeedRes.ok ? extractAnnualSalariesFromPayload(indeedRes.payload).length : 0,
    };
    glassdoor = {
      ok: glassdoorRes.ok,
      status: glassdoorRes.status,
      count: glassdoorRes.ok ? extractAnnualSalariesFromPayload(glassdoorRes.payload).length : 0,
    };
    const indeedVals = indeedRes.ok ? extractAnnualSalariesFromPayload(indeedRes.payload) : [];
    const glassdoorVals = glassdoorRes.ok ? extractAnnualSalariesFromPayload(glassdoorRes.payload) : [];
    const merged = mergeMarketStats(indeedVals, glassdoorVals);
    p25 = merged.p25;
    p50 = merged.p50;
    p75 = merged.p75;
    sampleSize = merged.n;
    if (!indeedRes.ok && !glassdoorRes.ok) {
      fetchError = `Indeed ${indeedRes.status} / Glassdoor ${glassdoorRes.status}`;
    } else if (sampleSize === 0) {
      fetchError = "Aucun salaire exploitable dans les résultats";
    }
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Erreur HasData";
  }

  const marketCompaPct =
    salary != null && p50 != null && p50 > 0 ? Math.round((salary / p50) * 100) : null;
  const positionVsMarket =
    salary != null ? positionLabel(salary, p25, p50, p75) : null;

  const { data, error } = await supabase
    .from("talent_market_benchmarks")
    .upsert(
      {
        ...baseRow,
        p25_annual: p25,
        p50_annual: p50,
        p75_annual: p75,
        sample_size: sampleSize,
        indeed_ok: indeed.ok,
        glassdoor_ok: glassdoor.ok,
        indeed_count: indeed.count,
        glassdoor_count: glassdoor.count,
        market_compa_pct: marketCompaPct,
        position_vs_market: positionVsMarket,
        fetch_error: fetchError,
      },
      { onConflict: "employee_id" },
    )
    .select()
    .single();

  if (error) {
    console.error("[talent_market_benchmarks] upsert", error);
    const { data: prev } = await supabase
      .from("talent_market_benchmarks")
      .select("*")
      .eq("employee_id", params.employeeId)
      .maybeSingle();
    return (prev as TalentMarketBenchmarkRow | null) ?? null;
  }
  return data as TalentMarketBenchmarkRow;
}
