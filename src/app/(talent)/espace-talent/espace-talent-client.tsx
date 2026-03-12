"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import gsap from "gsap";

type Interview = {
  id: string;
  interview_date: string;
  type: string;
  notes: string | null;
  justification: string | null;
  salary_adjustment: number | null;
};

type DeptLevel = { id: string; name: string; montant_annuel: number; mid_salary: number | null };

type TalentData = {
  orgName: string;
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    gender: string | null;
    birth_date: string | null;
    hire_date: string;
    current_job_title: string;
    current_level_id: string | null;
    current_department_id: string | null;
    current_management_id: string | null;
    current_anciennete_id: string | null;
    salary_adjustment: number | null;
    location: string | null;
    annual_salary_brut: number | null;
    manager_id: string | null;
  };
  department: string | null;
  level: string | null;
  levelRange: { min: number | null; mid: number | null; max: number | null } | null;
  manager: string | null;
  managementLevel: string | null;
  ancienneteLevel: string | null;
  salaryVisible: boolean;
  interviews: Interview[];
  compaRatio: number | null;
  deptLevels: DeptLevel[];
  benchmark: { p25: number; p50: number; p75: number; source: string; updated_at: string } | null;
};

const CARD = "rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]";
const LABEL = "text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]";

export function EspaceTalentClient({ data }: { data: TalentData }) {
  const { employee, orgName } = data;
  const mainRef = useRef<HTMLDivElement>(null);
  const [simLevelId, setSimLevelId] = useState("");

  useEffect(() => {
    if (!mainRef.current) return;
    const sections = mainRef.current.querySelectorAll("[data-section]");
    gsap.fromTo(sections, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" });
  }, []);

  const simLevel = useMemo(() => data.deptLevels.find((l) => l.id === simLevelId), [data.deptLevels, simLevelId]);
  const simSalary = useMemo(() => {
    if (!simLevel) return null;
    let total = simLevel.montant_annuel;
    if (employee.salary_adjustment) total += Number(employee.salary_adjustment);
    return total;
  }, [simLevel, employee.salary_adjustment]);
  const simCompa = useMemo(() => {
    if (!simLevel?.mid_salary || !simSalary) return null;
    return Math.round((simSalary / simLevel.mid_salary) * 100);
  }, [simLevel, simSalary]);

  const salary = employee.annual_salary_brut != null ? Number(employee.annual_salary_brut) : null;

  const typeColors: Record<string, string> = {
    annuel: "bg-[var(--brand)]/10 text-[var(--brand)]",
    semestriel: "bg-blue-100 text-blue-800",
    ponctuel: "bg-amber-100 text-amber-800",
  };

  return (
    <div ref={mainRef} className="space-y-8">
      <section data-section className={`${CARD} !p-8`}>
        <h1 className="text-2xl font-semibold text-[var(--text)]">
          Bonjour, {employee.first_name} 👋
        </h1>
        <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
          Bienvenue dans votre espace personnel au sein de {orgName}.
        </p>
      </section>

      <section data-section className={CARD}>
        <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Mon profil</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className={LABEL}>Nom complet</dt><dd className="mt-1 text-sm text-[var(--text)]">{employee.first_name} {employee.last_name}</dd></div>
          <div><dt className={LABEL}>Email</dt><dd className="mt-1 text-sm text-[var(--text)]">{employee.email}</dd></div>
          <div><dt className={LABEL}>Poste</dt><dd className="mt-1 text-sm text-[var(--text)]">{employee.current_job_title || "—"}</dd></div>
          <div>
            <dt className={LABEL}>Département</dt>
            <dd className="mt-1 text-sm text-[var(--text)]">
              {data.department ? <span className="rounded-lg bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">{data.department}</span> : "—"}
            </dd>
          </div>
          <div>
            <dt className={LABEL}>Niveau</dt>
            <dd className="mt-1 text-sm text-[var(--text)]">
              {data.level ? <span className="rounded-lg bg-[var(--brand)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">{data.level}</span> : "—"}
            </dd>
          </div>
          {data.managementLevel && (
            <div><dt className={LABEL}>Niveau Management</dt><dd className="mt-1 text-sm"><span className="rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{data.managementLevel}</span></dd></div>
          )}
          {data.ancienneteLevel && (
            <div><dt className={LABEL}>Ancienneté</dt><dd className="mt-1 text-sm"><span className="rounded-lg bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">{data.ancienneteLevel}</span></dd></div>
          )}
          <div><dt className={LABEL}>Manager</dt><dd className="mt-1 text-sm text-[var(--text)]">{data.manager || "—"}</dd></div>
          <div><dt className={LABEL}>Date d&apos;entrée</dt><dd className="mt-1 text-sm text-[var(--text)]">{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}</dd></div>
          <div><dt className={LABEL}>Localisation</dt><dd className="mt-1 text-sm text-[var(--text)]">{employee.location || "—"}</dd></div>
        </dl>
      </section>

      {data.salaryVisible && (
        <section data-section className="rounded-3xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-6">
          <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Rémunération</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className={LABEL}>Salaire annuel brut</p>
              <p className="mt-1 text-3xl font-semibold text-[var(--text)]">
                {salary != null ? `${salary.toLocaleString("fr-FR")} €` : "—"}
              </p>
            </div>
            {data.compaRatio != null && (
              <div>
                <p className={LABEL}>Compa-ratio</p>
                <p className="mt-1 text-3xl font-semibold text-[var(--text)]">{data.compaRatio}%</p>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/60">
                  <div className="relative h-full">
                    <div className="absolute left-1/2 top-0 h-full w-px bg-[color:rgba(11,11,11,0.2)]" title="100%" />
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(data.compaRatio, 150) / 1.5}%`,
                        backgroundColor: data.compaRatio < 90 ? "#ef4444" : data.compaRatio > 110 ? "#f59e0b" : "var(--brand)",
                      }}
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.5)]">100% = aligné au midpoint du niveau</p>
              </div>
            )}
            {data.levelRange && data.levelRange.min != null && data.levelRange.max != null && (
              <div>
                <p className={LABEL}>Fourchette du niveau</p>
                <p className="mt-1 text-sm text-[var(--text)]">
                  {data.levelRange.min.toLocaleString("fr-FR")} € — {data.levelRange.max.toLocaleString("fr-FR")} €
                </p>
                {data.levelRange.mid != null && (
                  <p className="mt-0.5 text-xs text-[color:rgba(11,11,11,0.5)]">Midpoint : {data.levelRange.mid.toLocaleString("fr-FR")} €</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {data.salaryVisible && data.deptLevels.length > 1 && (
        <section data-section className={CARD}>
          <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Simulateur</h2>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            Simulez votre rémunération en sélectionnant un autre niveau de votre département.
          </p>
          <div className="mt-4">
            <select
              value={simLevelId}
              onChange={(e) => setSimLevelId(e.target.value)}
              className="w-full max-w-sm cursor-pointer rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            >
              <option value="">Sélectionner un niveau...</option>
              {data.deptLevels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.montant_annuel.toLocaleString("fr-FR")} €)
                </option>
              ))}
            </select>
          </div>
          {simLevel && simSalary != null && (
            <div className="mt-4 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 px-5 py-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className={LABEL}>Niveau simulé</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">{simLevel.name}</p>
                </div>
                <div>
                  <p className={LABEL}>Rémunération projetée</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--text)]">{simSalary.toLocaleString("fr-FR")} €</p>
                  {salary != null && (
                    <p className="mt-0.5 text-xs text-[color:rgba(11,11,11,0.5)]">
                      {simSalary > salary ? "+" : ""}{(simSalary - salary).toLocaleString("fr-FR")} € vs actuel
                    </p>
                  )}
                </div>
                {simCompa != null && (
                  <div>
                    <p className={LABEL}>Compa-ratio projeté</p>
                    <p className="mt-1 text-xl font-semibold text-[var(--text)]">{simCompa}%</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {data.salaryVisible && data.benchmark && (
        <section data-section className={CARD}>
          <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Benchmark marché</h2>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            Données de marché pour votre niveau. Source : {data.benchmark.source}.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-4">
              <p className="text-xs font-medium text-[color:rgba(11,11,11,0.5)]">P25</p>
              <p className="mt-1 text-lg font-semibold text-[var(--text)]">{data.benchmark.p25.toLocaleString("fr-FR")} €</p>
            </div>
            <div className="rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-4">
              <p className="text-xs font-medium text-[color:rgba(11,11,11,0.5)]">P50 (médiane)</p>
              <p className="mt-1 text-lg font-semibold text-[var(--text)]">{data.benchmark.p50.toLocaleString("fr-FR")} €</p>
            </div>
            <div className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-4">
              <p className="text-xs font-medium text-[color:rgba(11,11,11,0.5)]">P75</p>
              <p className="mt-1 text-lg font-semibold text-[var(--text)]">{data.benchmark.p75.toLocaleString("fr-FR")} €</p>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-[color:rgba(11,11,11,0.4)]">
            Dernière mise à jour : {new Date(data.benchmark.updated_at).toLocaleDateString("fr-FR")}
          </p>
        </section>
      )}

      <section data-section className={CARD}>
        <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Mes entretiens</h2>
        {data.interviews.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#e2e7e2] bg-[#f8faf8] p-6 text-center text-sm text-[color:rgba(11,11,11,0.6)]">
            Aucun entretien enregistré pour le moment.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {data.interviews.map((iv) => (
              <div key={iv.id} className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${typeColors[iv.type] || "bg-gray-100 text-gray-800"}`}>
                      {iv.type.charAt(0).toUpperCase() + iv.type.slice(1)}
                    </span>
                    <span className="text-sm text-[color:rgba(11,11,11,0.65)]">
                      {new Date(iv.interview_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  {iv.salary_adjustment != null && Number(iv.salary_adjustment) !== 0 && (
                    <span className="text-sm font-medium text-[var(--text)]">
                      {Number(iv.salary_adjustment) > 0 ? "+" : ""}{Number(iv.salary_adjustment).toLocaleString("fr-FR")} €
                    </span>
                  )}
                </div>
                {iv.notes && <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.7)]">{iv.notes}</p>}
                {iv.justification && <p className="mt-1 text-xs italic text-[color:rgba(11,11,11,0.5)]">{iv.justification}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
