import type { InseeSalaryGameUi } from "@/lib/talent/insee-salary-game-ui";
import type { TalentMarketBenchmarkRow } from "@/lib/talent/talent-market-benchmark-shared";

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
  compaRatio: number | null;
  hasdataConfigured: boolean;
  talentMarketBenchmark: TalentMarketBenchmarkRow | null;
  inseeSalaryGame: InseeSalaryGameUi | null;
  marketTeamPeers: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    annual_salary_brut: number | null;
  }[];
};
