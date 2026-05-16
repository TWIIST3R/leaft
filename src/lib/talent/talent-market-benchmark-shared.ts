/**
 * Types et helpers partagés — sans import @/env (safe pour composants client).
 */

export const MARKET_SEARCH_LOCATION_FRANCE = "France";

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
