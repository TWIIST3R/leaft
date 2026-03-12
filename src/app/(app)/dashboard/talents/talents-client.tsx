"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";

type Dept = { id: string; name: string };
type Level = { id: string; name: string; department_id: string };
type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  current_job_title: string;
  annual_salary_brut: number | null;
  hire_date: string | null;
  current_department_id: string | null;
  current_level_id: string | null;
};

export function TalentsClient({
  employees,
  departments,
  levels,
}: {
  employees: Employee[];
  departments: Dept[];
  levels: Level[];
}) {
  const [search, setSearch] = useState("");
  const [filterDeptId, setFilterDeptId] = useState("");
  const tableRef = useRef<HTMLTableSectionElement>(null);

  const deptMap = new Map(departments.map((d) => [d.id, d.name]));
  const levelMap = new Map(levels.map((l) => [l.id, l.name]));

  const filtered = employees.filter((emp) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (emp.current_job_title ?? "").toLowerCase().includes(q);
    const matchesDept = !filterDeptId || emp.current_department_id === filterDeptId;
    return matchesSearch && matchesDept;
  });

  useEffect(() => {
    if (!tableRef.current) return;
    const rows = tableRef.current.querySelectorAll("tr");
    gsap.fromTo(rows, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: "power2.out" });
  }, [filtered.length, filterDeptId, search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Talents</h1>
          <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
            {employees.length} collaborateur{employees.length > 1 ? "s" : ""} dans votre organisation.
          </p>
        </div>
        <Link
          href="/dashboard/talents/new"
          className="inline-flex cursor-pointer items-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Ajouter un talent
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email, poste..."
          className="w-72 rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
        />
        {departments.length > 0 && (
          <select
            value={filterDeptId}
            onChange={(e) => setFilterDeptId(e.target.value)}
            className="rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          >
            <option value="">Tous les départements</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      <section className="rounded-3xl border border-[#e2e7e2] bg-white shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[color:rgba(11,11,11,0.65)]">
              {employees.length === 0 ? "Aucun talent pour le moment." : "Aucun résultat."}
            </p>
            {employees.length === 0 && (
              <>
                <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.5)]">
                  Ajoutez vos premiers collaborateurs pour gérer les rémunérations et les entretiens.
                </p>
                <Link
                  href="/dashboard/talents/new"
                  className="mt-4 inline-flex cursor-pointer items-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Ajouter un talent
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e2e7e2] bg-[#f8faf8]">
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Nom</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Poste</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Département</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Niveau</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Rémunération</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Entrée</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody ref={tableRef}>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="border-b border-[#e2e7e2] transition hover:bg-[#f8faf8]">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/talents/${emp.id}`} className="font-medium text-[var(--brand)] hover:underline">
                        {emp.first_name} {emp.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-[color:rgba(11,11,11,0.75)]">{emp.current_job_title || "—"}</td>
                    <td className="px-6 py-4">
                      {emp.current_department_id ? (
                        <span className="rounded-lg bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                          {deptMap.get(emp.current_department_id) ?? "—"}
                        </span>
                      ) : <span className="text-[color:rgba(11,11,11,0.4)]">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {emp.current_level_id ? (
                        <span className="text-xs font-medium text-[color:rgba(11,11,11,0.75)]">
                          {levelMap.get(emp.current_level_id) ?? "—"}
                        </span>
                      ) : <span className="text-[color:rgba(11,11,11,0.4)]">—</span>}
                    </td>
                    <td className="px-6 py-4 text-[color:rgba(11,11,11,0.75)]">
                      {emp.annual_salary_brut != null ? `${Number(emp.annual_salary_brut).toLocaleString("fr-FR")} €` : "—"}
                    </td>
                    <td className="px-6 py-4 text-[color:rgba(11,11,11,0.75)]">
                      {emp.hire_date ? new Date(emp.hire_date).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/talents/${emp.id}`} className="text-xs font-medium text-[var(--brand)] hover:underline">
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
