"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";

const INTERVIEW_TYPES = [
  { value: "Entretien annuel", label: "Entretien annuel" },
  { value: "Entretien semestriel", label: "Entretien semestriel" },
  { value: "Entretien ponctuel", label: "Entretien ponctuel" },
  { value: "Rémunération & avantages", label: "Rémunération & avantages" },
  { value: "Évolution de carrière", label: "Évolution de carrière" },
  { value: "Performance & objectifs", label: "Performance & objectifs" },
] as const;

type Emp = {
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
  location: string | null;
  gender: string | null;
  manager_id: string | null;
};

type Interview = {
  id: string;
  interview_date: string;
  type: string;
  notes: string | null;
  salary_adjustment: number | null;
  status: string;
};

type Dept = { id: string; name: string };
type Level = { id: string; name: string; department_id: string };

type Props = {
  data: {
    currentEmployeeId: string;
    employee: Emp;
    interviews: Interview[];
    departments: Dept[];
    levels: Level[];
    salaryVisible: boolean;
  };
};

const CARD = "rounded-3xl border border-[#e2e7e2] bg-white p-4 shadow-[0_24px_60px_rgba(17,27,24,0.06)] sm:p-6";

export function FicheTalentClient({ data }: Props) {
  const { employee: emp, interviews, departments, levels, salaryVisible } = data;

  const deptMap = new Map(departments.map((d) => [d.id, d.name]));
  const levelMap = new Map(levels.map((l) => [l.id, l.name]));

  const [showRdvModal, setShowRdvModal] = useState(false);
  const [rdvType, setRdvType] = useState<string>(INTERVIEW_TYPES[0].value);
  const [rdvSlots, setRdvSlots] = useState([
    { date: "", time: "", durationMin: 45 },
    { date: "", time: "", durationMin: 45 },
    { date: "", time: "", durationMin: 45 },
  ]);
  const [rdvNote, setRdvNote] = useState("");
  const [rdvLoading, setRdvLoading] = useState(false);
  const [rdvSuccess, setRdvSuccess] = useState<string | null>(null);
  const [rdvError, setRdvError] = useState<string | null>(null);

  const upcomingInterviews = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return interviews.filter((iv) => iv.interview_date >= today).sort((a, b) => a.interview_date.localeCompare(b.interview_date));
  }, [interviews]);

  const pastInterviews = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return interviews.filter((iv) => iv.interview_date < today);
  }, [interviews]);

  async function handleRdvSubmit() {
    setRdvLoading(true);
    setRdvError(null);
    try {
      const filledSlots = rdvSlots
        .filter((s) => s.date && s.time)
        .map((s) => {
          const start = new Date(`${s.date}T${s.time}`);
          const end = new Date(start.getTime() + s.durationMin * 60_000);
          return { starts_at: start.toISOString(), ends_at: end.toISOString() };
        });

      const res = await fetch("/api/meeting-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requested_to: [`talent:${emp.id}`],
          interview_type: rdvType,
          note: rdvNote || null,
          slots: filledSlots,
          target_employee_id: emp.id,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Erreur lors de l'envoi");
      }

      setRdvSuccess("Demande envoyée !");
      setRdvSlots([
        { date: "", time: "", durationMin: 45 },
        { date: "", time: "", durationMin: 45 },
        { date: "", time: "", durationMin: 45 },
      ]);
      setRdvNote("");
      setTimeout(() => {
        setShowRdvModal(false);
        setRdvSuccess(null);
      }, 1500);
    } catch (e: any) {
      setRdvError(e.message || "Erreur inconnue");
    } finally {
      setRdvLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-[color:rgba(11,11,11,0.55)]">
        <Link href="/espace-talent/mon-equipe" className="hover:text-[var(--brand)] transition">
          Mon équipe
        </Link>
        <span>/</span>
        <span className="text-[var(--text)] font-medium">{emp.first_name} {emp.last_name}</span>
      </div>

      <section className={CARD}>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Avatar firstName={emp.first_name} lastName={emp.last_name} avatarUrl={emp.avatar_url} size="xl" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-semibold text-[var(--text)]">{emp.first_name} {emp.last_name}</h1>
            <p className="mt-0.5 text-sm text-[color:rgba(11,11,11,0.65)]">{emp.current_job_title}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              {emp.current_department_id && (
                <span className="rounded-lg bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                  {deptMap.get(emp.current_department_id) ?? "—"}
                </span>
              )}
              {emp.current_level_id && (
                <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {levelMap.get(emp.current_level_id) ?? "—"}
                </span>
              )}
              {emp.location && (
                <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {emp.location}
                </span>
              )}
              {emp.hire_date && (
                <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  Depuis {new Date(emp.hire_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                </span>
              )}
            </div>
            {salaryVisible && emp.annual_salary_brut != null && (
              <p className="mt-2 text-lg font-bold text-[var(--text)]">
                {Number(emp.annual_salary_brut).toLocaleString("fr-FR")} € <span className="text-xs font-normal text-[color:rgba(11,11,11,0.5)]">brut annuel</span>
              </p>
            )}
          </div>
          <button
            onClick={() => setShowRdvModal(true)}
            className="cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Demander un RDV
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {upcomingInterviews.length > 0 && (
          <section className={CARD}>
            <h2 className="border-l-4 border-[var(--brand)] pl-3 text-base font-semibold text-[var(--text)]">Entretiens à venir</h2>
            <div className="mt-4 space-y-2">
              {upcomingInterviews.map((iv) => (
                <div key={iv.id} className="flex items-center justify-between rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{iv.type}</p>
                    {iv.notes && <p className="mt-0.5 text-xs text-[color:rgba(11,11,11,0.55)] line-clamp-1">{iv.notes}</p>}
                  </div>
                  <span className="shrink-0 rounded-lg bg-[var(--brand)]/10 px-2.5 py-1 text-xs font-medium text-[var(--brand)]">
                    {new Date(iv.interview_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className={CARD}>
          <h2 className="border-l-4 border-[var(--brand)] pl-3 text-base font-semibold text-[var(--text)]">Historique des entretiens</h2>
          {pastInterviews.length === 0 ? (
            <p className="mt-4 text-sm text-[color:rgba(11,11,11,0.5)]">Aucun entretien passé.</p>
          ) : (
            <div className="mt-4 max-h-[400px] space-y-2 overflow-auto pr-1">
              {pastInterviews.map((iv) => (
                <div key={iv.id} className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text)]">{iv.type}</span>
                      <span className={`rounded-lg px-1.5 py-0.5 text-[10px] font-semibold ${
                        iv.status === "termine" ? "bg-gray-100 text-gray-500" : "bg-green-50 text-green-700"
                      }`}>
                        {iv.status === "termine" ? "Terminé" : "En cours"}
                      </span>
                    </div>
                    <span className="text-xs text-[color:rgba(11,11,11,0.5)]">
                      {new Date(iv.interview_date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {iv.notes && <p className="mt-1.5 text-xs text-[color:rgba(11,11,11,0.6)] line-clamp-2">{iv.notes}</p>}
                  {iv.salary_adjustment != null && Number(iv.salary_adjustment) !== 0 && (
                    <p className="mt-1 text-xs font-medium text-[var(--brand)]">
                      Ajustement : {Number(iv.salary_adjustment) > 0 ? "+" : ""}{Number(iv.salary_adjustment).toLocaleString("fr-FR")} €
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={showRdvModal}
        onClose={() => { setShowRdvModal(false); setRdvError(null); setRdvSuccess(null); }}
        title={`Demander un RDV avec ${emp.first_name}`}
      >
          {rdvSuccess ? (
            <div className="mt-4 rounded-xl bg-green-50 p-4 text-center text-sm font-medium text-green-700">{rdvSuccess}</div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">Type d&apos;entretien</label>
                <select
                  value={rdvType}
                  onChange={(e) => setRdvType(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-[#e2e7e2] bg-white px-3 py-2.5 text-sm"
                >
                  {INTERVIEW_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">Proposer des créneaux (2–3)</label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {rdvSlots.map((s, idx) => (
                    <div key={idx} className="rounded-2xl border border-[#e2e7e2] bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.45)]">Créneau {idx + 1}</p>
                      <div className="mt-2 grid gap-2">
                        <input
                          type="date"
                          value={s.date}
                          onChange={(e) => setRdvSlots((prev) => prev.map((p, i) => i === idx ? { ...p, date: e.target.value } : p))}
                          className="w-full rounded-xl border border-[#e2e7e2] bg-white px-3 py-2 text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="time"
                            value={s.time}
                            onChange={(e) => setRdvSlots((prev) => prev.map((p, i) => i === idx ? { ...p, time: e.target.value } : p))}
                            className="w-full rounded-xl border border-[#e2e7e2] bg-white px-3 py-2 text-sm"
                          />
                          <select
                            value={s.durationMin}
                            onChange={(e) => setRdvSlots((prev) => prev.map((p, i) => i === idx ? { ...p, durationMin: Number(e.target.value) } : p))}
                            className="w-full cursor-pointer rounded-xl border border-[#e2e7e2] bg-white px-3 py-2 text-sm"
                          >
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>60 min</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">Note (optionnel)</label>
                <textarea
                  value={rdvNote}
                  onChange={(e) => setRdvNote(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-[#e2e7e2] bg-white px-3 py-2.5 text-sm"
                  placeholder="Contexte ou objectif du rendez-vous..."
                />
              </div>

              {rdvError && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{rdvError}</div>
              )}

              <button
                onClick={handleRdvSubmit}
                disabled={rdvLoading || rdvSlots.filter((s) => s.date && s.time).length === 0}
                className="w-full cursor-pointer rounded-full bg-[var(--brand)] py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {rdvLoading ? "Envoi…" : "Envoyer la demande"}
              </button>
            </div>
          )}
      </Modal>
    </div>
  );
}
