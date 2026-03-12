"use client";

import { useEffect, useRef, useMemo } from "react";
import gsap from "gsap";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  gender: string | null;
  birth_date: string | null;
  hire_date: string | null;
  current_department_id: string | null;
  current_level_id: string | null;
  annual_salary_brut: number | null;
  location: string | null;
};
type Dept = { id: string; name: string };
type Level = {
  id: string;
  name: string;
  department_id: string | null;
  montant_annuel: number | null;
  mid_salary: number | null;
  min_salary: number | null;
  max_salary: number | null;
};

const CARD = "rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]";
const LABEL = "text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]";
const BIG = "mt-3 text-3xl font-semibold text-[var(--text)]";

function HBar({ items, color }: { items: { label: string; value: number; pct: number }[]; color: string }) {
  const barsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!barsRef.current) return;
    const bars = barsRef.current.querySelectorAll("[data-bar]");
    gsap.fromTo(bars, { scaleX: 0 }, { scaleX: 1, duration: 0.7, stagger: 0.08, ease: "power2.out" });
  }, []);

  return (
    <div ref={barsRef} className="mt-4 space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text)]">{item.label}</span>
            <span className="font-medium text-[var(--text)]">{item.value} <span className="text-xs text-[color:rgba(11,11,11,0.5)]">({item.pct}%)</span></span>
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-[#f0f2f0]">
            <div data-bar className="h-full rounded-full origin-left" style={{ width: `${item.pct}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function BarChart({ items, formatValue }: { items: { label: string; value: number }[]; formatValue?: (v: number) => string }) {
  const barsRef = useRef<HTMLDivElement>(null);
  const max = Math.max(...items.map((i) => i.value), 1);
  const fmt = formatValue ?? ((v: number) => v.toLocaleString("fr-FR"));

  useEffect(() => {
    if (!barsRef.current) return;
    const bars = barsRef.current.querySelectorAll("[data-vbar]");
    gsap.fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 0.7, stagger: 0.06, ease: "power2.out" });
  }, []);

  return (
    <div ref={barsRef} className="mt-4 flex items-end gap-2" style={{ height: 180 }}>
      {items.map((item) => {
        const pct = Math.max((item.value / max) * 100, 4);
        return (
          <div key={item.label} className="flex flex-1 flex-col items-center justify-end gap-1.5" style={{ height: "100%" }}>
            <span className="text-xs font-medium text-[var(--text)]">{fmt(item.value)}</span>
            <div
              data-vbar
              className="w-full rounded-t-lg origin-bottom"
              style={{ height: `${pct}%`, backgroundColor: "var(--brand)", opacity: 0.75 }}
            />
            <span className="text-[10px] text-[color:rgba(11,11,11,0.5)] text-center leading-tight truncate max-w-full">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function StatistiquesClient({
  employees,
  departments,
  levels,
}: {
  employees: Employee[];
  departments: Dept[];
  levels: Level[];
}) {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mainRef.current) return;
    const cards = mainRef.current.querySelectorAll("[data-card]");
    gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" });
  }, []);

  const total = employees.length;
  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);
  const levelMap = useMemo(() => new Map(levels.map((l) => [l.id, l])), [levels]);

  const genderData = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach((e) => { const g = e.gender || "Non renseigné"; counts[g] = (counts[g] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value, pct: total > 0 ? Math.round((value / total) * 100) : 0 }));
  }, [employees, total]);

  const ageData = useMemo(() => {
    const brackets: Record<string, number> = { "< 25": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55+": 0 };
    const now = new Date();
    employees.forEach((e) => {
      if (!e.birth_date) return;
      const age = Math.floor((now.getTime() - new Date(e.birth_date).getTime()) / (365.25 * 86400000));
      if (age < 25) brackets["< 25"]++;
      else if (age < 35) brackets["25-34"]++;
      else if (age < 45) brackets["35-44"]++;
      else if (age < 55) brackets["45-54"]++;
      else brackets["55+"]++;
    });
    return Object.entries(brackets).map(([label, value]) => ({ label, value }));
  }, [employees]);

  const deptHeadcount = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach((e) => {
      const name = e.current_department_id ? deptMap.get(e.current_department_id) || "Inconnu" : "Non assigné";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  }, [employees, deptMap]);

  const salaryByDept = useMemo(() => {
    const acc: Record<string, number[]> = {};
    employees.forEach((e) => {
      if (e.annual_salary_brut == null) return;
      const name = e.current_department_id ? deptMap.get(e.current_department_id) || "Inconnu" : "Non assigné";
      if (!acc[name]) acc[name] = [];
      acc[name].push(Number(e.annual_salary_brut));
    });
    return Object.entries(acc)
      .map(([label, salaries]) => ({
        label,
        value: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
      }))
      .sort((a, b) => b.value - a.value);
  }, [employees, deptMap]);

  const genderPayGap = useMemo(() => {
    const byGender: Record<string, number[]> = {};
    employees.forEach((e) => {
      if (e.annual_salary_brut == null || !e.gender) return;
      if (!byGender[e.gender]) byGender[e.gender] = [];
      byGender[e.gender].push(Number(e.annual_salary_brut));
    });
    const avg = (arr: number[]) => (arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
    return Object.entries(byGender).map(([gender, salaries]) => ({
      label: gender,
      value: avg(salaries),
    }));
  }, [employees]);

  const compaRatios = useMemo(() => {
    const ratios: { name: string; ratio: number }[] = [];
    employees.forEach((e) => {
      if (e.annual_salary_brut == null || !e.current_level_id) return;
      const level = levelMap.get(e.current_level_id);
      if (!level?.mid_salary || Number(level.mid_salary) === 0) return;
      ratios.push({
        name: `${e.first_name} ${e.last_name.charAt(0)}.`,
        ratio: Math.round((Number(e.annual_salary_brut) / Number(level.mid_salary)) * 100),
      });
    });
    return ratios.sort((a, b) => a.ratio - b.ratio);
  }, [employees, levelMap]);

  const salaries = employees.map((e) => Number(e.annual_salary_brut)).filter((s) => s > 0);
  const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0;
  const medianSalary = salaries.length > 0 ? (() => { const s = [...salaries].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); })() : 0;

  if (total === 0) {
    return (
      <div className={CARD}>
        <p className="text-center text-sm text-[color:rgba(11,11,11,0.65)]">
          Aucun talent dans l&apos;organisation. Ajoutez des collaborateurs pour voir les statistiques.
        </p>
      </div>
    );
  }

  return (
    <div ref={mainRef} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        <div data-card className={CARD}>
          <p className={LABEL}>Effectif total</p>
          <p className={BIG}>{total}</p>
        </div>
        <div data-card className={CARD}>
          <p className={LABEL}>Départements</p>
          <p className={BIG}>{departments.length}</p>
        </div>
        <div data-card className={CARD}>
          <p className={LABEL}>Salaire moyen</p>
          <p className={BIG}>{avgSalary > 0 ? `${avgSalary.toLocaleString("fr-FR")} €` : "—"}</p>
        </div>
        <div data-card className={CARD}>
          <p className={LABEL}>Salaire médian</p>
          <p className={BIG}>{medianSalary > 0 ? `${medianSalary.toLocaleString("fr-FR")} €` : "—"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div data-card className={CARD}>
          <h3 className="text-sm font-semibold text-[var(--text)]">Répartition par genre</h3>
          <HBar items={genderData} color="var(--brand)" />
        </div>
        <div data-card className={CARD}>
          <h3 className="text-sm font-semibold text-[var(--text)]">Pyramide des âges</h3>
          <BarChart items={ageData} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div data-card className={CARD}>
          <h3 className="text-sm font-semibold text-[var(--text)]">Effectif par département</h3>
          <BarChart items={deptHeadcount} />
        </div>
        <div data-card className={CARD}>
          <h3 className="text-sm font-semibold text-[var(--text)]">Salaire moyen par département</h3>
          <BarChart items={salaryByDept} formatValue={(v) => `${(v / 1000).toFixed(0)}k €`} />
        </div>
      </div>

      {genderPayGap.length > 1 && (
        <div data-card className={CARD}>
          <h3 className="text-sm font-semibold text-[var(--text)]">Équité salariale par genre</h3>
          <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.5)]">Salaire annuel brut moyen par genre</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {genderPayGap.map((g) => (
              <div key={g.label} className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4">
                <p className="text-xs font-medium text-[color:rgba(11,11,11,0.6)]">{g.label}</p>
                <p className="mt-1 text-xl font-semibold text-[var(--text)]">{g.value.toLocaleString("fr-FR")} €</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {compaRatios.length > 0 && (
        <div data-card className={CARD}>
          <h3 className="text-sm font-semibold text-[var(--text)]">Compa-ratio</h3>
          <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.5)]">
            Salaire réel ÷ midpoint du niveau. 100% = aligné au midpoint.
          </p>
          <div className="mt-4 space-y-2.5">
            {compaRatios.map((cr) => (
              <div key={cr.name} className="flex items-center gap-3">
                <span className="w-28 truncate text-sm text-[var(--text)]">{cr.name}</span>
                <div className="flex-1 h-2.5 overflow-hidden rounded-full bg-[#f0f2f0] relative">
                  <div
                    className="absolute left-1/2 top-0 h-full w-px bg-[color:rgba(11,11,11,0.15)]"
                    title="100%"
                  />
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(cr.ratio, 150)}%`,
                      maxWidth: "100%",
                      backgroundColor: cr.ratio < 90 ? "#ef4444" : cr.ratio > 110 ? "#f59e0b" : "var(--brand)",
                    }}
                  />
                </div>
                <span className="w-14 text-right text-sm font-medium text-[var(--text)]">{cr.ratio}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
