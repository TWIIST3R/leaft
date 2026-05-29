/** Types rail comparatif marché — sans dépendance serveur. */

export type MarketTeamPeer = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  annual_salary_brut: number | null;
  current_job_title?: string | null;
  department_name?: string | null;
  /** Marqueur « moyenne département » (pas un individu). */
  is_department_average?: boolean;
};
