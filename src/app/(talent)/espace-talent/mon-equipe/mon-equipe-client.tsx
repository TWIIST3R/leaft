"use client";

import { useRef, useEffect, useMemo } from "react";
import gsap from "gsap";
import { Avatar } from "@/components/ui/avatar";
import { PieChart } from "@/components/charts/pie-chart";

type TeamMember = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  current_job_title: string;
  current_department_id: string | null;
  current_level_id: string | null;
  annual_salary_brut: number | null;
  avatar_url: string | null;
  hire_date: string | null;
};

type Interview = {
  id: string;
  employee_id: string;
  interview_date: string;
  type: string;
  notes: string | null;
  salary_adjustment: number | null;
};

type Dept = { id: string; name: string };
type Level = { id: string; name: string; department_id: string };
type PositionHistory = {
  id: string;
  employee_id: string;
  annual_salary: number | null;
  effective_date: string;
  reason: string | null;
};

type Props = {
  data: {
    teamMembers: TeamMember[];
    interviews: Interview[];
    departments: Dept[];
    levels: Level[];
    positionHistory: PositionHistory[];
  };
};

const CARD = "rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]";

export function MonEquipeClient({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { teamMembers, interviews, departments, levels, positionHistory } = data;

  useEffect(() => {
    if (!containerRef.current) return;
    const sections = containerRef.current.querySelectorAll("[data-section]");
    gsap.fromTo(sections, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power3.out" });
  }, []);

  const deptMap = new Map(departments.map((d) => [d.id, d.name]));
  const levelMap = new Map(levels.map((l) => [l.id, l.name]));

  const totalSalary = useMemo(() => {
    return teamMembers.reduce((sum, m) => sum + (m.annual_salary_brut ? Number(m.annual_salary_brut) : 0), 0);
  }, [teamMembers]);

  const avgSalary = teamMembers.length > 0 ? totalSalary / teamMembers.length : 0;

  const deptDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    teamMembers.forEach((m) => {
      const name = m.current_department_id ? (deptMap.get(m.current_department_id) ?? "Autre") : "Non assigné";
      counts[name] = (counts[name] || 0) + 1;
    });
    const COLORS = ["var(--brand)", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#10b981"];
    return Object.entries(counts).map(([label, value], i) => ({ label, value, color: COLORS[i % COLORS.length] }));
  }, [teamMembers, deptMap]);

  const upcomingInterviews = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return interviews
      .filter((iv) => iv.interview_date >= today)
      .sort((a, b) => a.interview_date.localeCompare(b.interview_date))
      .slice(0, 5);
  }, [interviews]);

  const recentInterviews = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return interviews
      .filter((iv) => iv.interview_date < today)
      .slice(0, 10);
  }, [interviews]);

  const empNameMap = new Map(teamMembers.map((m) => [m.id, `${m.first_name} ${m.last_name}`]));

  return (
    <div ref={containerRef} className="space-y-8">
      <div data-section>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Mon equipe</h1>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          {teamMembers.length} membre{teamMembers.length > 1 ? "s" : ""} dans votre equipe
        </p>
      </div>

      <div data-section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={CARD}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Effectif</p>
          <p className="mt-2 text-3xl font-bold text-[var(--text)]">{teamMembers.length}</p>
        </div>
        <div className={CARD}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Masse salariale</p>
          <p className="mt-2 text-3xl font-bold text-[var(--text)]">{totalSalary.toLocaleString("fr-FR")} €</p>
        </div>
        <div className={CARD}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Salaire moyen</p>
          <p className="mt-2 text-3xl font-bold text-[var(--text)]">{Math.round(avgSalary).toLocaleString("fr-FR")} €</p>
        </div>
        <div className={CARD}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Entretiens à venir</p>
          <p className="mt-2 text-3xl font-bold text-[var(--brand)]">{upcomingInterviews.length}</p>
        </div>
      </div>

      {deptDistribution.length > 1 && (
        <section data-section className={CARD}>
          <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Répartition par département</h2>
          <div className="mt-4">
            <PieChart items={deptDistribution} />
          </div>
        </section>
      )}

      <section data-section className={CARD}>
        <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Membres de l&apos;equipe</h2>
        <div className="mt-4 space-y-3">
          {teamMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-4 rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-4 transition hover:shadow-sm">
              <Avatar firstName={m.first_name} lastName={m.last_name} avatarUrl={m.avatar_url} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text)]">{m.first_name} {m.last_name}</p>
                <p className="text-xs text-[color:rgba(11,11,11,0.6)]">
                  {m.current_job_title}
                  {m.current_department_id && <> · {deptMap.get(m.current_department_id)}</>}
                </p>
              </div>
              <div className="text-right">
                {m.current_level_id && (
                  <span className="rounded-lg bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                    {levelMap.get(m.current_level_id) ?? "—"}
                  </span>
                )}
                {m.annual_salary_brut != null && (
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">{Number(m.annual_salary_brut).toLocaleString("fr-FR")} €</p>
                )}
              </div>
            </div>
          ))}
          {teamMembers.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#e2e7e2] p-6 text-center text-sm text-[color:rgba(11,11,11,0.5)]">
              Aucun membre dans votre equipe.
            </div>
          )}
        </div>
      </section>

      {upcomingInterviews.length > 0 && (
        <section data-section className={CARD}>
          <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Entretiens à venir</h2>
          <div className="mt-4 space-y-3">
            {upcomingInterviews.map((iv) => (
              <div key={iv.id} className="flex items-center justify-between rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-4">
                <div>
                  <p className="font-medium text-[var(--text)]">{empNameMap.get(iv.employee_id) ?? "—"}</p>
                  <p className="text-xs text-[color:rgba(11,11,11,0.6)]">{iv.type}</p>
                </div>
                <span className="rounded-lg bg-[var(--brand)]/10 px-3 py-1 text-sm font-medium text-[var(--brand)]">
                  {new Date(iv.interview_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {recentInterviews.length > 0 && (
        <section data-section className={CARD}>
          <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Historique des entretiens</h2>
          <div className="mt-4 space-y-2">
            {recentInterviews.map((iv) => (
              <div key={iv.id} className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[var(--text)]">{empNameMap.get(iv.employee_id) ?? "—"}</span>
                    <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{iv.type}</span>
                  </div>
                  <span className="text-xs text-[color:rgba(11,11,11,0.5)]">
                    {new Date(iv.interview_date).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                {iv.notes && <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">{iv.notes}</p>}
                {iv.salary_adjustment != null && Number(iv.salary_adjustment) !== 0 && (
                  <p className="mt-1 text-sm font-medium text-[var(--brand)]">
                    Ajustement : {Number(iv.salary_adjustment) > 0 ? "+" : ""}{Number(iv.salary_adjustment).toLocaleString("fr-FR")} €
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
