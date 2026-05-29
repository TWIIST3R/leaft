/** Types partagés transparence salariale — sans import serveur (safe client). */

export type SalaryDisclosureMode = "department_average" | "exact";

export function parseSalaryDisclosureMode(value: unknown): SalaryDisclosureMode {
  return value === "exact" ? "exact" : "department_average";
}

export type DepartmentSalaryAverage = {
  department_id: string;
  department_name: string;
  average_annual_brut: number;
  employee_count: number;
};

export type OrgSalaryTransparencySettings = {
  enabled: boolean;
  mode: SalaryDisclosureMode;
};

export function resolveOrgSalaryTransparency(
  enabled: boolean | null | undefined,
  mode: unknown,
): OrgSalaryTransparencySettings {
  return {
    enabled: !!enabled,
    mode: parseSalaryDisclosureMode(mode),
  };
}
