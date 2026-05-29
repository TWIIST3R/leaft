import type { InseeSalaryGameUi } from "@/lib/talent/insee-salary-game-ui";
import type { SalaryDisclosureMode } from "@/lib/organization/salary-transparency-shared";
import type { TalentMarketBenchmarkRow } from "@/lib/talent/talent-market-benchmark-shared";
import type { MarketTeamPeer } from "@/lib/talent/market-team-peer-types";

/** Props sérialisées page Comparatif (serveur → client). */
export type TalentComparatifData = {
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    current_job_title: string;
    annual_salary_brut: number | null;
    avatar_url: string | null;
    manager_id: string | null;
    current_department_id: string | null;
  };
  salaryVisible: boolean;
  salaryDisclosureMode: SalaryDisclosureMode;
  compaRatio: number | null;
  hasdataConfigured: boolean;
  talentMarketBenchmark: TalentMarketBenchmarkRow | null;
  inseeSalaryGame: InseeSalaryGameUi | null;
  marketTeamPeers: MarketTeamPeer[];
};
