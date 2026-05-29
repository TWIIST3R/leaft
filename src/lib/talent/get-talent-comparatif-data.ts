import { optionalEnv } from "@/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  estimateNetMonthlyFromAnnualBrut,
  approximatePrivateNetPercentile2024,
  pctVsInseeMedianNetMonthly,
  readInseeMedianNetMonthly,
} from "@/lib/talent/insee-fr-distribution";
import { frSalaryGameBucket, frSalaryGameTitle } from "@/lib/talent/fr-salary-game";
import {
  deriveMarketSearchParams,
  isTalentMarketBenchmarkStale,
  refreshTalentMarketBenchmark,
} from "@/lib/talent/refresh-talent-market-benchmark";
import {
  parseSearchKeywordsUsed,
  type TalentMarketBenchmarkRow,
} from "@/lib/talent/talent-market-benchmark-shared";
import type { InseeSalaryGameUi } from "@/lib/talent/insee-salary-game-ui";
import type { TalentComparatifData } from "@/lib/talent/talent-comparatif-types";
import { parseSalaryDisclosureMode } from "@/lib/organization/salary-transparency-shared";
import { computeDepartmentSalaryAverages } from "@/lib/organization/department-salary-averages";
import { buildMarketTeamPeersForRail } from "@/lib/talent/build-market-team-peers";

export type { TalentComparatifData };

function normalizeBenchmarkRow(row: Record<string, unknown> | null): TalentMarketBenchmarkRow | null {
  if (!row) return null;
  return {
    ...(row as TalentMarketBenchmarkRow),
    search_keywords_used: parseSearchKeywordsUsed(row.search_keywords_used),
  };
}

export async function getTalentComparatifData(
  userId: string,
  orgId: string | null,
  userEmail: string | null,
): Promise<TalentComparatifData | null> {
  const supabase = supabaseAdmin();
  let organizationId: string | null = null;

  if (orgId) {
    const { data } = await supabase
      .from("organizations")
      .select("id, salary_transparency_enabled")
      .eq("clerk_organization_id", orgId)
      .single();
    if (data) organizationId = data.id;
  }
  if (!organizationId) {
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("organization_id")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    organizationId = userOrg?.organization_id ?? null;
  }
  if (!organizationId) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("salary_transparency_enabled, salary_disclosure_mode")
    .eq("id", organizationId)
    .single();

  const salaryDisclosureMode = parseSalaryDisclosureMode(org?.salary_disclosure_mode);

  let { data: employee } = await supabase
    .from("employees")
    .select(
      "id, first_name, last_name, current_job_title, current_level_id, current_department_id, location, annual_salary_brut, avatar_url, manager_id",
    )
    .eq("organization_id", organizationId)
    .eq("clerk_user_id", userId)
    .single();

  if (!employee && userEmail) {
    const { data: employeeByEmail } = await supabase
      .from("employees")
      .select(
        "id, first_name, last_name, current_job_title, current_level_id, current_department_id, location, annual_salary_brut, avatar_url, manager_id",
      )
      .eq("organization_id", organizationId)
      .ilike("email", userEmail.trim())
      .maybeSingle();
    if (employeeByEmail) {
      await supabase.from("employees").update({ clerk_user_id: userId }).eq("id", employeeByEmail.id);
      employee = employeeByEmail;
    }
  }

  if (!employee) return null;

  const salaryVisible = org?.salary_transparency_enabled ?? false;
  const [{ data: allEmployees }, { data: departments }] = await Promise.all([
    supabase
      .from("employees")
      .select(
        "id, first_name, last_name, current_job_title, current_department_id, avatar_url, annual_salary_brut, manager_id",
      )
      .eq("organization_id", organizationId),
    supabase.from("departments").select("id, name").eq("organization_id", organizationId),
  ]);

  const deptNameMap = new Map((departments ?? []).map((d) => [d.id, d.name]));
  const deptAverages = computeDepartmentSalaryAverages(allEmployees ?? [], deptNameMap);

  let teamRows = (allEmployees ?? []).filter((e) => e.manager_id === employee.manager_id);
  if (teamRows.length < 2 && employee.current_department_id) {
    teamRows = (allEmployees ?? []).filter((e) => e.current_department_id === employee.current_department_id);
  }

  const marketTeamPeers = salaryVisible
    ? buildMarketTeamPeersForRail(
        employee,
        salaryDisclosureMode,
        deptNameMap,
        deptAverages,
        teamRows,
      )
    : buildMarketTeamPeersForRail(employee, "department_average", deptNameMap, deptAverages, []);

  if (!salaryVisible) {
    return {
      employee,
      salaryVisible: false,
      salaryDisclosureMode,
      compaRatio: null,
      hasdataConfigured: !!optionalEnv.HASDATA_API_KEY,
      talentMarketBenchmark: null,
      inseeSalaryGame: null,
      marketTeamPeers,
    };
  }

  let compaRatio: number | null = null;
  if (employee.current_level_id) {
    const { data: level } = await supabase
      .from("levels")
      .select("mid_salary")
      .eq("id", employee.current_level_id)
      .single();
    const mid = level?.mid_salary ? Number(level.mid_salary) : null;
    const salary = employee.annual_salary_brut != null ? Number(employee.annual_salary_brut) : null;
    if (salary != null && mid != null && mid > 0) compaRatio = Math.round((salary / mid) * 100);
  }

  const { data: tmbRow, error: tmbErr } = await supabase
    .from("talent_market_benchmarks")
    .select("*")
    .eq("employee_id", employee.id)
    .maybeSingle();

  const { keyword: marketKeyword, location: marketLocation } = deriveMarketSearchParams({
    current_job_title: employee.current_job_title,
    location: employee.location,
  });

  const salary = employee.annual_salary_brut != null ? Number(employee.annual_salary_brut) : null;
  let talentMarketBenchmark = normalizeBenchmarkRow(
    !tmbErr && tmbRow ? (tmbRow as Record<string, unknown>) : null,
  );

  const hasdataConfigured = !!optionalEnv.HASDATA_API_KEY;
  if (
    salary != null &&
    hasdataConfigured &&
    isTalentMarketBenchmarkStale(talentMarketBenchmark, salary, marketKeyword, marketLocation)
  ) {
    try {
      const updated = await refreshTalentMarketBenchmark(supabase, {
        employeeId: employee.id,
        organizationId,
        keyword: marketKeyword,
        location: marketLocation,
        annualSalaryBrut: salary,
      });
      if (updated) talentMarketBenchmark = updated;
    } catch (e) {
      console.error("[comparatif] refresh talent market benchmark", e);
    }
  }

  let inseeSalaryGame: InseeSalaryGameUi | null = null;
  if (salary != null) {
    const netMonthly = estimateNetMonthlyFromAnnualBrut(salary);
    const pctVsMedian = pctVsInseeMedianNetMonthly(netMonthly);
    const bucket = frSalaryGameBucket(pctVsMedian);
    inseeSalaryGame = {
      netMonthlyEstimated: Math.round(netMonthly),
      inseeMedianNetMonthly: readInseeMedianNetMonthly(),
      pctVsMedian,
      approximatePercentile: Math.round(approximatePrivateNetPercentile2024(netMonthly) * 10) / 10,
      game: { bucket, ...frSalaryGameTitle(bucket) },
    };
  }

  return {
    employee,
    salaryVisible: true,
    salaryDisclosureMode,
    compaRatio,
    hasdataConfigured,
    talentMarketBenchmark,
    inseeSalaryGame,
    marketTeamPeers,
  };
}
