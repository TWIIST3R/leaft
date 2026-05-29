import type { SalaryDisclosureMode } from "@/lib/organization/salary-transparency-shared";
import type { DepartmentSalaryAverage } from "@/lib/organization/salary-transparency-shared";
import { getDepartmentAverageForEmployee } from "@/lib/organization/department-salary-averages";
import type { MarketTeamPeer } from "@/lib/talent/market-team-peer-types";

type EmployeeRow = {
  id: string;
  first_name: string;
  last_name: string;
  current_job_title: string | null;
  current_department_id: string | null;
  avatar_url: string | null;
  annual_salary_brut: number | null;
};

export function buildMarketTeamPeersForRail(
  employee: EmployeeRow,
  disclosureMode: SalaryDisclosureMode,
  departmentNames: Map<string, string>,
  departmentAverages: DepartmentSalaryAverage[],
  teamRows: EmployeeRow[],
): MarketTeamPeer[] {
  const deptName = employee.current_department_id
    ? departmentNames.get(employee.current_department_id) ?? null
    : null;

  const self: MarketTeamPeer = {
    id: employee.id,
    first_name: employee.first_name,
    last_name: employee.last_name,
    avatar_url: employee.avatar_url,
    annual_salary_brut: employee.annual_salary_brut,
    current_job_title: employee.current_job_title,
    department_name: deptName,
  };

  if (disclosureMode === "department_average") {
    const deptAvg = getDepartmentAverageForEmployee(employee.current_department_id, departmentAverages);
    if (!deptAvg) return [self];
    return [
      self,
      {
        id: `dept-avg-${deptAvg.department_id}`,
        first_name: "Moyenne",
        last_name: deptAvg.department_name,
        avatar_url: null,
        annual_salary_brut: deptAvg.average_annual_brut,
        department_name: deptAvg.department_name,
        is_department_average: true,
      },
    ];
  }

  const byId = new Map<string, MarketTeamPeer>();
  byId.set(self.id, self);
  for (const p of teamRows) {
    if (p.id === employee.id) continue;
    const sal = p.annual_salary_brut != null ? Number(p.annual_salary_brut) : null;
    if (sal == null || sal <= 0) continue;
    byId.set(p.id, {
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      avatar_url: p.avatar_url,
      annual_salary_brut: p.annual_salary_brut,
      current_job_title: p.current_job_title,
      department_name: p.current_department_id
        ? departmentNames.get(p.current_department_id) ?? null
        : null,
    });
  }
  return [...byId.values()];
}
