"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import gsap from "gsap";

type Level = { id: string; name: string; department_id: string; montant_annuel: number | null; mid_salary: number | null };
type Dept = { id: string; name: string };
type ExtraLevel = { id: string; name: string; type: string; montant_annuel: number | null };
type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  current_level_id: string | null;
  current_department_id: string | null;
  current_management_id: string | null;
  current_anciennete_id: string | null;
  salary_adjustment: number | null;
  annual_salary_brut: number | null;
};

type SimData = {
  employee: Employee;
  departments: Dept[];
  levels: Level[];
  managementLevels: ExtraLevel[];
  ancienneteLevels: ExtraLevel[];
};

const CARD = "rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]";
const LABEL = "text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]";
const SELECT = "w-full max-w-sm cursor-pointer rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20";

export function SimulateurClient({ data }: { data: SimData }) {
  const { employee, departments, levels, managementLevels, ancienneteLevels } = data;
  const mainRef = useRef<HTMLDivElement>(null);

  const [deptId, setDeptId] = useState(employee.current_department_id ?? "");
  const [levelId, setLevelId] = useState(employee.current_level_id ?? "");
  const [mgmtId, setMgmtId] = useState(employee.current_management_id ?? "");
  const [ancId, setAncId] = useState(employee.current_anciennete_id ?? "");

  useEffect(() => {
    if (!mainRef.current) return;
    const sections = mainRef.current.querySelectorAll("[data-section]");
    gsap.fromTo(sections, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" });
  }, []);

  const filteredLevels = useMemo(() => levels.filter((l) => l.department_id === deptId), [levels, deptId]);
  const selectedLevel = useMemo(() => levels.find((l) => l.id === levelId), [levels, levelId]);
  const selectedMgmt = useMemo(() => managementLevels.find((m) => m.id === mgmtId), [managementLevels, mgmtId]);
  const selectedAnc = useMemo(() => ancienneteLevels.find((a) => a.id === ancId), [ancienneteLevels, ancId]);

  const adj = Number(employee.salary_adjustment ?? 0);
  const currentSalary = employee.annual_salary_brut != null ? Number(employee.annual_salary_brut) : null;

  const simSalary = useMemo(() => {
    let total = adj;
    if (selectedLevel?.montant_annuel) total += Number(selectedLevel.montant_annuel);
    if (selectedMgmt?.montant_annuel) total += Number(selectedMgmt.montant_annuel);
    if (selectedAnc?.montant_annuel) total += Number(selectedAnc.montant_annuel);
    return total > 0 ? total : null;
  }, [selectedLevel, selectedMgmt, selectedAnc, adj]);

  const simCompa = useMemo(() => {
    if (!selectedLevel?.mid_salary || !simSalary) return null;
    return Math.round((simSalary / Number(selectedLevel.mid_salary)) * 100);
  }, [selectedLevel, simSalary]);

  const diff = simSalary != null && currentSalary != null ? simSalary - currentSalary : null;

  return (
    <div ref={mainRef} className="space-y-8">
      <section data-section>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Simulateur de rémunération</h1>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Simulez votre rémunération en modifiant le département, le niveau, le management ou l&apos;ancienneté.
        </p>
      </section>

      <section data-section className={CARD}>
        <h2 className="text-lg font-semibold text-[var(--text)]">Paramètres de simulation</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Département</label>
            <select value={deptId} onChange={(e) => { setDeptId(e.target.value); setLevelId(""); }} className={`mt-1 ${SELECT}`}>
              <option value="">Sélectionner...</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Niveau / Palier</label>
            <select value={levelId} onChange={(e) => setLevelId(e.target.value)} className={`mt-1 ${SELECT}`} disabled={!deptId}>
              <option value="">Sélectionner...</option>
              {filteredLevels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({Number(l.montant_annuel ?? 0).toLocaleString("fr-FR")} €)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Niveau Management</label>
            <select value={mgmtId} onChange={(e) => setMgmtId(e.target.value)} className={`mt-1 ${SELECT}`}>
              <option value="">— Aucun —</option>
              {managementLevels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({Number(m.montant_annuel ?? 0).toLocaleString("fr-FR")} €)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Niveau Ancienneté</label>
            <select value={ancId} onChange={(e) => setAncId(e.target.value)} className={`mt-1 ${SELECT}`}>
              <option value="">— Aucun —</option>
              {ancienneteLevels.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({Number(a.montant_annuel ?? 0).toLocaleString("fr-FR")} €)
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {simSalary != null && (
        <section data-section className="rounded-3xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-6">
          <h2 className="text-lg font-semibold text-[var(--text)]">Résultat de la simulation</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className={LABEL}>Rémunération projetée</p>
              <p className="mt-1 text-3xl font-semibold text-[var(--text)]">{simSalary.toLocaleString("fr-FR")} €</p>
            </div>
            {diff != null && (
              <div>
                <p className={LABEL}>Différence vs actuel</p>
                <p className={`mt-1 text-2xl font-semibold ${diff >= 0 ? "text-[var(--brand)]" : "text-red-600"}`}>
                  {diff >= 0 ? "+" : ""}{diff.toLocaleString("fr-FR")} €
                </p>
              </div>
            )}
            {simCompa != null && (
              <div>
                <p className={LABEL}>Compa-ratio projeté</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--text)]">{simCompa}%</p>
                <div className="mt-2 h-3 w-full max-w-xs overflow-hidden rounded-full bg-white/60">
                  <div className="relative h-full">
                    <div className="absolute left-1/2 top-0 h-full w-px bg-[color:rgba(11,11,11,0.2)]" />
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(simCompa, 150) / 1.5}%`,
                        backgroundColor: simCompa < 90 ? "#ef4444" : simCompa > 110 ? "#f59e0b" : "var(--brand)",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            {currentSalary != null && (
              <div>
                <p className={LABEL}>Rémunération actuelle</p>
                <p className="mt-1 text-xl font-medium text-[color:rgba(11,11,11,0.6)]">{currentSalary.toLocaleString("fr-FR")} €</p>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-[var(--brand)]/15 bg-white/50 px-4 py-3 text-xs text-[color:rgba(11,11,11,0.55)]">
            = Palier ({selectedLevel ? `${Number(selectedLevel.montant_annuel ?? 0).toLocaleString("fr-FR")} €` : "—"})
            {" + "}Management ({selectedMgmt ? `${Number(selectedMgmt.montant_annuel ?? 0).toLocaleString("fr-FR")} €` : "—"})
            {" + "}Ancienneté ({selectedAnc ? `${Number(selectedAnc.montant_annuel ?? 0).toLocaleString("fr-FR")} €` : "—"})
            {" + "}Ajustement ({adj.toLocaleString("fr-FR")} €)
          </div>
        </section>
      )}
    </div>
  );
}
