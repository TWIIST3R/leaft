import type { DepartmentSalaryAverage } from "@/lib/organization/salary-transparency-shared";

type Row = {
  current_department_id: string | null;
  annual_salary_brut: number | null;
};

/**
 * Moyennes SAB par département (employés avec salaire renseigné).
 */
export function computeDepartmentSalaryAverages(
  employees: Row[],
  departmentNames: Map<string, string>,
): DepartmentSalaryAverage[] {
  const buckets = new Map<string, number[]>();

  for (const e of employees) {
    const deptId = e.current_department_id;
    const sal = e.annual_salary_brut != null ? Number(e.annual_salary_brut) : null;
    if (!deptId || sal == null || sal <= 0) continue;
    if (!buckets.has(deptId)) buckets.set(deptId, []);
    buckets.get(deptId)!.push(sal);
  }

  const out: DepartmentSalaryAverage[] = [];
  for (const [department_id, salaries] of buckets) {
    const sum = salaries.reduce((a, b) => a + b, 0);
    out.push({
      department_id,
      department_name: departmentNames.get(department_id) ?? "Département",
      average_annual_brut: Math.round(sum / salaries.length),
      employee_count: salaries.length,
    });
  }
  return out.sort((a, b) => a.department_name.localeCompare(b.department_name, "fr"));
}

export function getDepartmentAverageForEmployee(
  departmentId: string | null,
  averages: DepartmentSalaryAverage[],
): DepartmentSalaryAverage | null {
  if (!departmentId) return null;
  return averages.find((a) => a.department_id === departmentId) ?? null;
}
