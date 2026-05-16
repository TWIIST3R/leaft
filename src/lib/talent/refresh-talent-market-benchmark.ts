import { optionalEnv } from "@/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  extractAnnualSalariesFromPayload,
  fetchGlassdoorListing,
  fetchIndeedListing,
  mergeMarketStats,
} from "@/lib/hasdata/job-market";
import { expandJobSearchKeywords } from "@/lib/talent/market-job-keywords";

export const MARKET_SEARCH_LOCATION_FRANCE = "France";

/**
 * Snapshot persisté en base (`talent_market_benchmarks`) après chaque appel HasData réussi ou partiel.
 * Réutilisable côté espace talent et fiches RH (lecture par `employee_id` / `organization_id`).
 */
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
  search_keywords_used: string[] | null;
};

export function parseSearchKeywordsUsed(row: unknown): string[] {
  if (!row || !Array.isArray(row)) return [];
  return row.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function positionLabel(
  salary: number,
  p25: number | null,
  p50: number | null,
  p75: number | null,
): string | null {
  if (p25 == null || p50 == null || p75 == null) return null;
  if (salary < p25) return "en dessous de la fourchette basse observée sur les offres";
  if (salary < p50) return "dans la moitié basse du marché (offres)";
  if (salary <= p75) return "dans la moitié haute du marché (offres)";
  return "au-dessus de la fourchette haute observée sur les offres";
}

export function deriveMarketSearchParams(employee: {
  current_job_title: string | null;
  location: string | null;
}): { keyword: string; location: string } {
  const keyword = (employee.current_job_title || "emploi").trim().slice(0, 120) || "emploi";
  return { keyword, location: MARKET_SEARCH_LOCATION_FRANCE };
}

function describeHttp(source: string, status: number): string {
  if (status === 429) return `${source} : trop de requêtes, réessaie plus tard.`;
  if (status === 401 || status === 403) return `${source} : accès refusé.`;
  if (status === 400) return `${source} : recherche non acceptée.`;
  if (status >= 500) return `${source} : service indisponible.`;
  return `${source} : erreur (${status}).`;
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

export async function invalidateTalentMarketBenchmark(
  supabase: ReturnType<typeof supabaseAdmin>,
  employeeId: string,
): Promise<void> {
  await supabase.from("talent_market_benchmarks").delete().eq("employee_id", employeeId);
}

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
  const location = MARKET_SEARCH_LOCATION_FRANCE;

  const baseRow = {
    employee_id: params.employeeId,
    organization_id: params.organizationId,
    search_keyword: params.keyword,
    search_location: location,
    salary_at_fetch: salary,
    fetched_at: new Date().toISOString(),
  };

  if (!apiKey) {
    return null;
  }

  let fetchError: string | null = null;
  let indeedOk = false;
  let glassdoorOk = false;
  let indeedCount = 0;
  let glassdoorCount = 0;
  let p25: number | null = null;
  let p50: number | null = null;
  let p75: number | null = null;
  let sampleSize = 0;
  let lastIndeedStatus = 0;
  let lastGlassdoorStatus = 0;
  let keywordsUsed: string[] = [];

  try {
    const keywords = await expandJobSearchKeywords(params.keyword);
    keywordsUsed = keywords;
    const allIndeed: number[] = [];
    const allGlassdoor: number[] = [];

    for (let i = 0; i < keywords.length; i++) {
      const kw = keywords[i]!;
      if (i > 0) await new Promise((r) => setTimeout(r, 800));

      const indeedRes = await fetchIndeedListing({ apiKey, keyword: kw, location });
      lastIndeedStatus = indeedRes.status;
      if (indeedRes.ok) {
        indeedOk = true;
        const vals = extractAnnualSalariesFromPayload(indeedRes.payload);
        indeedCount += vals.length;
        allIndeed.push(...vals);
      }

      await new Promise((r) => setTimeout(r, 750));

      let glassdoorRes = await fetchGlassdoorListing({ apiKey, keyword: kw, location });
      lastGlassdoorStatus = glassdoorRes.status;
      if (!glassdoorRes.ok && glassdoorRes.status === 400) {
        await new Promise((r) => setTimeout(r, 500));
        glassdoorRes = await fetchGlassdoorListing({
          apiKey,
          keyword: kw,
          location,
          domain: "www.glassdoor.com",
        });
        lastGlassdoorStatus = glassdoorRes.status;
      }
      if (glassdoorRes.ok) {
        glassdoorOk = true;
        const vals = extractAnnualSalariesFromPayload(glassdoorRes.payload);
        glassdoorCount += vals.length;
        allGlassdoor.push(...vals);
      }

      const mergedSoFar = mergeMarketStats(allIndeed, allGlassdoor);
      if (mergedSoFar.n >= 12) break;
    }

    const merged = mergeMarketStats(allIndeed, allGlassdoor);
    p25 = merged.p25;
    p50 = merged.p50;
    p75 = merged.p75;
    sampleSize = merged.n;

    if (!indeedOk && !glassdoorOk) {
      fetchError = `${describeHttp("Indeed", lastIndeedStatus)} ${describeHttp("Glassdoor", lastGlassdoorStatus)}`.trim();
    } else if (!indeedOk) {
      fetchError = describeHttp("Indeed", lastIndeedStatus);
    } else if (!glassdoorOk) {
      fetchError = describeHttp("Glassdoor", lastGlassdoorStatus);
    } else if (sampleSize === 0) {
      fetchError =
        "Peu d’offres avec un salaire indiqué pour des postes proches du vôtre en France. Les résultats seront mis à jour lors de prochaines synchronisations.";
    }
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Impossible de récupérer les offres pour le moment.";
  }

  const marketCompaPct =
    salary != null && p50 != null && p50 > 0 ? Math.round((salary / p50) * 100) : null;
  const positionVsMarket = salary != null ? positionLabel(salary, p25, p50, p75) : null;

  const { data, error } = await supabase
    .from("talent_market_benchmarks")
    .upsert(
      {
        ...baseRow,
        p25_annual: p25,
        p50_annual: p50,
        p75_annual: p75,
        sample_size: sampleSize,
        indeed_ok: indeedOk,
        glassdoor_ok: glassdoorOk,
        indeed_count: indeedCount,
        glassdoor_count: glassdoorCount,
        market_compa_pct: marketCompaPct,
        position_vs_market: positionVsMarket,
        fetch_error: fetchError,
        search_keywords_used: keywordsUsed,
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
  const row = data as TalentMarketBenchmarkRow;
  return {
    ...row,
    search_keywords_used: parseSearchKeywordsUsed(row.search_keywords_used),
  };
}
