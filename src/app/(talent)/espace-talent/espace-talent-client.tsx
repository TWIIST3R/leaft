"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import gsap from "gsap";
import { Avatar } from "@/components/ui/avatar";
import { LineChart } from "@/components/charts/line-chart";
import { TalentOnboarding } from "@/components/talent/talent-onboarding";
import { TalentJobMarketCard, type InseeSalaryGameUi } from "@/components/talent/talent-job-market-card";
import type { TalentMarketBenchmarkRow } from "@/lib/talent/refresh-talent-market-benchmark";

type Interview = {
  id: string;
  interview_date: string;
  type: string;
  notes: string | null;
  justification: string | null;
  salary_adjustment: number | null;
};

const INTERVIEW_TYPES = [
  { value: "Entretien annuel", label: "Entretien annuel" },
  { value: "Entretien semestriel", label: "Entretien semestriel" },
  { value: "Entretien ponctuel", label: "Entretien ponctuel" },
] as const;

type DeptLevel = { id: string; name: string; montant_annuel: number; mid_salary: number | null };

type PositionEntry = {
  id: string;
  startDate: string;
  endDate: string | null;
  jobTitle: string | null;
  salary: number | null;
  levelId: string | null;
  departmentId: string | null;
};

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
    avatar_url: string | null;
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
  positionHistory: PositionEntry[];
  hasdataConfigured: boolean;
  talentMarketBenchmark: TalentMarketBenchmarkRow | null;
  inseeSalaryGame: InseeSalaryGameUi | null;
  marketTeamPeers: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    annual_salary_brut: number | null;
  }[];
};

const CARD = "rounded-3xl border border-[#e2e7e2] bg-white p-4 shadow-[0_24px_60px_rgba(17,27,24,0.06)] sm:p-6";
const LABEL = "text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]";

export function EspaceTalentClient({ data }: { data: TalentData }) {
  const { employee, orgName } = data;
  const mainRef = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(employee.avatar_url);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [subscriptionActive, setSubscriptionActive] = useState<boolean | null>(null);

  const [showRdvModal, setShowRdvModal] = useState(false);
  const [rdvTo, setRdvTo] = useState<{ manager: boolean; rh: boolean }>({ manager: true, rh: false });
  const [rdvInterviewType, setRdvInterviewType] = useState<(typeof INTERVIEW_TYPES)[number]["value"]>(INTERVIEW_TYPES[0].value);
  const [rdvSlots, setRdvSlots] = useState<{ date: string; time: string; durationMin: number }[]>([
    { date: "", time: "", durationMin: 45 },
    { date: "", time: "", durationMin: 45 },
    { date: "", time: "", durationMin: 45 },
  ]);
  const [rdvNote, setRdvNote] = useState("");
  const [rdvLoading, setRdvLoading] = useState(false);
  const [rdvSuccess, setRdvSuccess] = useState<string | null>(null);
  const [rdvRequests, setRdvRequests] = useState<{
    id: string;
    requested_to: string;
    requested_tos?: string[];
    note: string | null;
    status: string;
    state?: string | null;
    group_id?: string | null;
    confirmed_slot_id?: string | null;
    slots?: { id: string; starts_at: string; ends_at: string; proposed_by: string; status: string }[];
    interview_type?: string | null;
    created_at: string;
    parts?: { id: string; requested_to: string; status: string }[];
  }[]>([]);
  const [rdvActionLoading, setRdvActionLoading] = useState<string | null>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/employees/${employee.id}/avatar`, { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok && json.avatar_url) setAvatarUrl(json.avatar_url);
    } catch { /* ignore */ } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleAvatarDelete() {
    if (!avatarUrl) return;
    setDeletingAvatar(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}/avatar`, { method: "DELETE" });
      if (res.ok) {
        setAvatarUrl(null);
      }
    } catch {
      // ignore
    } finally {
      setDeletingAvatar(false);
    }
  }

  useEffect(() => {
    if (!mainRef.current) return;
    const sections = mainRef.current.querySelectorAll("[data-section]");
    gsap.fromTo(sections, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" });
  }, []);

  useEffect(() => {
    fetch(`/api/meeting-requests?employee_id=${employee.id}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRdvRequests(d); })
      .catch(() => {});
  }, [employee.id]);

  useEffect(() => {
    fetch("/api/onboarding/check")
      .then((r) => r.json())
      .then((d) => setSubscriptionActive(!!d?.hasSubscription))
      .catch(() => setSubscriptionActive(null));
  }, []);

  async function handleRdvSubmit() {
    if (subscriptionActive === false) {
      setRdvSuccess("Abonnement inactif : demande de RDV indisponible.");
      setShowRdvModal(false);
      return;
    }
    setRdvLoading(true);
    setRdvSuccess(null);
    try {
      const targets = Object.entries(rdvTo).filter(([, v]) => v).map(([k]) => k);
      if (targets.length === 0) {
        setRdvLoading(false);
        return;
      }

      const computedSlots = rdvSlots
        .filter((s) => s.date && s.time)
        .slice(0, 3)
        .map((s) => {
          const startLocal = new Date(`${s.date}T${s.time}:00`);
          const endLocal = new Date(startLocal.getTime() + Math.max(15, Number(s.durationMin) || 45) * 60_000);
          return { starts_at: startLocal.toISOString(), ends_at: endLocal.toISOString() };
        });

      const res = await fetch("/api/meeting-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requested_to: targets,
          note: rdvNote,
          interview_type: rdvInterviewType,
          slots: computedSlots,
        }),
      });
      if (res.ok) {
        await res.json();
        // Re-fetch to get grouped status for "both"
        fetch(`/api/meeting-requests?employee_id=${employee.id}`)
          .then((r) => r.json())
          .then((d) => { if (Array.isArray(d)) setRdvRequests(d); })
          .catch(() => {});
        setRdvSuccess("Votre demande de rendez-vous a été envoyée.");
        setShowRdvModal(false);
        setRdvNote("");
        setRdvSlots([{ date: "", time: "", durationMin: 45 }, { date: "", time: "", durationMin: 45 }, { date: "", time: "", durationMin: 45 }]);
      }
    } catch { /* ignore */ }
    finally { setRdvLoading(false); }
  }

  async function refreshRdvRequests() {
    fetch(`/api/meeting-requests?employee_id=${employee.id}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRdvRequests(d); })
      .catch(() => {});
  }

  async function handleTalentAccept(groupId: string, slotId?: string) {
    setRdvActionLoading(groupId);
    try {
      const res = await fetch("/api/meeting-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId, action: "talent_accept", slot_id: slotId }),
      });
      if (res.ok) await refreshRdvRequests();
    } finally {
      setRdvActionLoading(null);
    }
  }

  async function handleTalentDecline(groupId: string) {
    setRdvActionLoading(groupId);
    try {
      const res = await fetch("/api/meeting-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId, action: "talent_decline" }),
      });
      if (res.ok) await refreshRdvRequests();
    } finally {
      setRdvActionLoading(null);
    }
  }

  const salary = employee.annual_salary_brut != null ? Number(employee.annual_salary_brut) : null;

  const typeColors: Record<string, string> = {
    annuel: "bg-[var(--brand)]/10 text-[var(--brand)]",
    semestriel: "bg-blue-100 text-blue-800",
    ponctuel: "bg-amber-100 text-amber-800",
  };

  const typeBadge = (type: string) => {
    if (type.includes("annuel")) return "bg-[var(--brand)]/10 text-[var(--brand)]";
    if (type.includes("semestriel")) return "bg-blue-100 text-blue-800";
    if (type.includes("mensuel")) return "bg-violet-100 text-violet-800";
    if (type.includes("performance")) return "bg-rose-100 text-rose-800";
    if (type.includes("ponctuel")) return "bg-amber-100 text-amber-800";
    return typeColors[type] || "bg-gray-100 text-gray-800";
  };

  const progressionData = useMemo(() => {
    return data.positionHistory
      .filter((p) => p.salary != null)
      .map((p) => ({
        label: new Date(p.startDate).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        value: p.salary!,
      }));
  }, [data.positionHistory]);

  const augmentations = useMemo(() => {
    const hist = data.positionHistory.filter((p) => p.salary != null);
    if (hist.length < 2) return [];
    return hist.slice(1).map((entry, i) => {
      const prev = hist[i];
      const diff = entry.salary! - (prev.salary ?? 0);
      return {
        id: entry.id,
        date: entry.startDate,
        title: entry.jobTitle ?? "Changement de poste",
        newSalary: entry.salary!,
        diff,
        pct: prev.salary && prev.salary > 0 ? Math.round((diff / prev.salary) * 100) : 0,
      };
    }).reverse();
  }, [data.positionHistory]);

  // Tenure kept for potential future UX, but no longer surfaced prominently.

  const interviewRecap = useMemo(() => {
    const today = new Date();
    const past = data.interviews
      .map((iv) => ({ ...iv, d: new Date(iv.interview_date) }))
      .filter((iv) => !Number.isNaN(iv.d.getTime()))
      .filter((iv) => iv.d.getTime() <= today.getTime())
      .sort((a, b) => b.d.getTime() - a.d.getTime());
    const future = data.interviews
      .map((iv) => ({ ...iv, d: new Date(iv.interview_date) }))
      .filter((iv) => !Number.isNaN(iv.d.getTime()))
      .filter((iv) => iv.d.getTime() > today.getTime())
      .sort((a, b) => a.d.getTime() - b.d.getTime());

    const last = past[0] ?? null;
    const next = future[0] ?? null;

    const diffDays = (a: Date, b: Date) => Math.ceil((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
    const lastDays = last ? Math.abs(diffDays(today, last.d)) : null;
    const nextDays = next ? diffDays(next.d, today) : null;

    return { last, next, lastDays, nextDays };
  }, [data.interviews]);

  return (
    <div ref={mainRef} className="space-y-6 sm:space-y-8">
      <TalentOnboarding
        firstName={employee.first_name}
        salaryVisible={data.salaryVisible}
        subscriptionActive={subscriptionActive}
        rdvModalOpen={showRdvModal}
      />
      <section data-section data-tour="talent-welcome" className={`${CARD} !p-5 sm:!p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-[var(--text)]">
              Bonjour, {employee.first_name} 👋
            </h1>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
              Bienvenue dans votre espace personnel au sein de {orgName}.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              {employee.current_job_title && (
                <span className="rounded-full border border-[#e2e7e2] bg-white px-3 py-1 font-medium text-[color:rgba(11,11,11,0.65)]">
                  {employee.current_job_title}
                </span>
              )}
              {data.department && (
                <span className="rounded-full bg-[var(--brand)]/10 px-3 py-1 font-semibold text-[var(--brand)]">
                  {data.department}
                </span>
              )}
              {data.level && (
                <span className="rounded-full bg-[var(--brand)]/15 px-3 py-1 font-semibold text-[var(--brand)]">
                  {data.level}
                </span>
              )}
              {data.manager && (
                <span className="rounded-full border border-[#e2e7e2] bg-[#f8faf8] px-3 py-1 font-medium text-[color:rgba(11,11,11,0.65)]">
                  Manager : {data.manager}
                </span>
              )}
              {employee.location && (
                <span className="rounded-full border border-[#e2e7e2] bg-[#f8faf8] px-3 py-1 font-medium text-[color:rgba(11,11,11,0.65)]">
                  {employee.location}
                </span>
              )}
            </div>
          </div>
          <div className="group relative shrink-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="relative cursor-pointer"
              title="Modifier la photo"
            >
              <Avatar firstName={employee.first_name} lastName={employee.last_name} avatarUrl={avatarUrl} size="xl" />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
                {uploadingAvatar ? (
                  <span className="text-xs font-medium">...</span>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 013.182 3.182L8.25 18.463 3 21l2.537-5.25L16.862 3.487z" />
                  </svg>
                )}
              </span>
            </button>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleAvatarDelete}
                disabled={deletingAvatar}
                className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-red-200 bg-white text-red-600 opacity-0 shadow-sm transition hover:bg-red-50 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                title="Supprimer la photo"
              >
                {deletingAvatar ? "..." : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12m-10 0v12a2 2 0 002 2h4a2 2 0 002-2V7m-6-3h4a1 1 0 011 1v2H9V5a1 1 0 011-1z" />
                  </svg>
                )}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarUpload} />
        </div>
      </section>

      <section data-section className="grid items-start gap-4 sm:gap-6 lg:grid-cols-5">
        {data.salaryVisible && (
          <div data-tour="talent-remuneration" className="rounded-3xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-4 shadow-[0_24px_60px_rgba(17,27,24,0.06)] sm:p-6 lg:col-span-2">
            <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Rémunération</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-6">
              <div>
                <p className={LABEL}>Salaire annuel brut</p>
                <p className="mt-1 text-3xl font-semibold text-[var(--text)]">
                  {salary != null ? `${salary.toLocaleString("fr-FR")} €` : "—"}
                </p>
              </div>
              <div>
                <p className={LABEL}>Compa-ratio interne</p>
                {data.compaRatio != null ? (
                  <>
                    <p className="mt-1 text-3xl font-semibold text-[var(--text)]">{data.compaRatio} %</p>
                    <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.55)]">
                      Salaire par rapport au midpoint de ton niveau dans la grille entreprise.
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.55)]">Non calculable (midpoint ou salaire manquant).</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <TalentJobMarketCard
                  annualSalaryBrut={employee.annual_salary_brut}
                  hasdataConfigured={data.hasdataConfigured}
                  talentMarketBenchmark={data.talentMarketBenchmark}
                  inseeSalaryGame={data.inseeSalaryGame}
                  salaryVisible={data.salaryVisible}
                  currentEmployeeId={employee.id}
                  marketTeamPeers={data.marketTeamPeers}
                  firstName={employee.first_name}
                  lastName={employee.last_name}
                  avatarUrl={avatarUrl ?? employee.avatar_url}
                />
              </div>
              {data.levelRange && data.levelRange.min != null && data.levelRange.max != null && (
                <div className="sm:col-span-2">
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
          </div>
        )}

        <div data-tour="talent-entretiens" className={`${CARD} flex flex-col ${data.salaryVisible ? "lg:col-span-3" : "lg:col-span-5"}`} id="talent-mes-entretiens">
          <div className="flex items-center justify-between gap-2">
            <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Mes entretiens</h2>
            <span className="rounded-full bg-[var(--brand)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--brand)]">
              {data.interviews.length}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {interviewRecap.last && interviewRecap.lastDays != null && (
              <button
                type="button"
                onClick={() => document.getElementById(`talent-iv-${interviewRecap.last!.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="cursor-pointer rounded-full border border-[#e2e7e2] bg-[#f8faf8] px-3 py-1 text-left text-xs font-medium text-[color:rgba(11,11,11,0.65)] transition hover:border-[var(--brand)]/30 hover:bg-[var(--brand)]/5"
              >
                Dernier entretien : il y a {interviewRecap.lastDays} jour{interviewRecap.lastDays > 1 ? "s" : ""} — voir
              </button>
            )}
            {interviewRecap.next && interviewRecap.nextDays != null && (
              <button
                type="button"
                onClick={() => document.getElementById(`talent-iv-${interviewRecap.next!.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="cursor-pointer rounded-full border border-[#e2e7e2] bg-[#f8faf8] px-3 py-1 text-left text-xs font-medium text-[color:rgba(11,11,11,0.65)] transition hover:border-[var(--brand)]/30 hover:bg-[var(--brand)]/5"
              >
                Prochain entretien : dans {interviewRecap.nextDays} jour{interviewRecap.nextDays > 1 ? "s" : ""} — voir
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              id="talent-tour-rdv-btn"
              type="button"
              onClick={() => setShowRdvModal(true)}
              disabled={subscriptionActive === false}
              className="cursor-pointer rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Demander un RDV
            </button>
            {rdvSuccess && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                Envoyé
              </span>
            )}
          </div>
          {subscriptionActive === false && (
            <p className="mt-2 text-xs text-[color:rgba(11,11,11,0.55)]">
              Votre entreprise n’a pas d’abonnement actif. Contactez votre administrateur pour réactiver l’accès.
            </p>
          )}

          {showRdvModal && (
            <div id="talent-tour-rdv-panel" className="mt-4 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Type d&apos;entretien</label>
                  <select
                    value={rdvInterviewType}
                    onChange={(e) => setRdvInterviewType(e.target.value as (typeof INTERVIEW_TYPES)[number]["value"])}
                    className="w-full cursor-pointer rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] transition hover:border-[var(--brand)]/40 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                  >
                    {INTERVIEW_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Proposer des créneaux (2–3)</label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {rdvSlots.map((s, idx) => (
                      <div key={idx} className="rounded-2xl border border-[#e2e7e2] bg-white p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.45)]">
                          Créneau {idx + 1}
                        </p>
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
                  <p className="mt-2 text-xs text-[color:rgba(11,11,11,0.55)]">
                    Sélectionne une date, une heure de début, puis une durée. Tu peux laisser des créneaux vides.
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Destinataire(s)</label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setRdvTo((s) => ({ ...s, manager: !s.manager }))}
                      className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                        rdvTo.manager
                          ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                          : "border-[#e2e7e2] bg-white text-[var(--text)] hover:border-[var(--brand)]/30"
                      }`}
                    >
                      Mon manager
                    </button>
                    <button
                      type="button"
                      onClick={() => setRdvTo((s) => ({ ...s, rh: !s.rh }))}
                      className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                        rdvTo.rh
                          ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                          : "border-[#e2e7e2] bg-white text-[var(--text)] hover:border-[var(--brand)]/30"
                      }`}
                    >
                      Ressources Humaines
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-[color:rgba(11,11,11,0.55)]">
                    Si vous sélectionnez les deux, la demande sera acceptée uniquement lorsque <strong>les deux</strong> auront validé.
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Note (optionnel)</label>
                  <textarea
                    rows={3}
                    value={rdvNote}
                    onChange={(e) => setRdvNote(e.target.value)}
                    className="w-full cursor-text rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] transition hover:border-[var(--brand)]/40 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                    placeholder="Précisez le motif de votre demande..."
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleRdvSubmit}
                    disabled={rdvLoading}
                    className="cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                  >
                    {rdvLoading ? "Envoi..." : "Envoyer la demande"}
                  </button>
                  <button
                    id="talent-tour-rdv-cancel"
                    type="button"
                    onClick={() => { setShowRdvModal(false); setRdvNote(""); setRdvSlots([{ date: "", time: "", durationMin: 45 }, { date: "", time: "", durationMin: 45 }, { date: "", time: "", durationMin: 45 }]); }}
                    className="cursor-pointer rounded-full border border-[#e2e7e2] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[#f8faf8]"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {data.interviews.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[#e2e7e2] bg-[#f8faf8] p-6 text-center text-sm text-[color:rgba(11,11,11,0.6)]">
              Aucun entretien enregistré pour le moment.
            </div>
          ) : (
            <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {data.interviews.map((iv) => (
                <div key={iv.id} id={`talent-iv-${iv.id}`} className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-3 sm:p-4 scroll-mt-24">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${typeBadge(iv.type)}`}>
                        {iv.type.charAt(0).toUpperCase() + iv.type.slice(1)}
                      </span>
                      <span className="text-sm text-[color:rgba(11,11,11,0.65)]">
                        {new Date(iv.interview_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                    {iv.salary_adjustment != null && Number(iv.salary_adjustment) !== 0 && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        Number(iv.salary_adjustment) > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {Number(iv.salary_adjustment) > 0 ? "+" : ""}{Number(iv.salary_adjustment).toLocaleString("fr-FR")} €
                      </span>
                    )}
                  </div>
                  {iv.notes && (
                    <div className="mt-3 rounded-lg bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.4)]">Notes</p>
                      <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.7)]">{iv.notes}</p>
                    </div>
                  )}
                  {iv.justification && (
                    <div className="mt-2 rounded-lg bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.4)]">Justification</p>
                      <p className="mt-1 text-sm italic text-[color:rgba(11,11,11,0.6)]">{iv.justification}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {rdvRequests.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Mes demandes de RDV</p>
              {rdvRequests.map((req) => (
                <div key={req.id} className="flex flex-col gap-2 rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {req.requested_to === "both"
                          ? "Manager + RH"
                          : req.requested_to === "manager"
                            ? "Manager"
                            : "RH"}
                      </span>
                      <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                        req.status === "pending" ? "bg-amber-100 text-amber-800" :
                        req.status === "accepted" ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {req.status === "pending" ? "En attente" : req.status === "accepted" ? "Accepté" : "Décliné"}
                      </span>
                      {req.requested_to === "both" && req.parts && (
                        <span className="text-xs text-[color:rgba(11,11,11,0.55)]">
                          ({req.parts.map((p) => `${p.requested_to === "manager" ? "Manager" : "RH"}: ${p.status === "pending" ? "⏳" : p.status === "accepted" ? "✅" : "❌"}`).join(" · ")})
                        </span>
                      )}
                    </div>
                    {req.interview_type && (
                      <p className="mt-1 text-xs font-medium text-[color:rgba(11,11,11,0.55)]">
                        Type : {req.interview_type}
                      </p>
                    )}
                    {req.note && <p className="mt-1 truncate text-sm text-[color:rgba(11,11,11,0.65)]">{req.note}</p>}

                    {(req.slots?.length ?? 0) > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.45)]">
                          Créneaux proposés
                        </p>
                        <div className="space-y-2">
                          {(req.slots ?? []).map((s) => {
                            const start = new Date(s.starts_at);
                            const end = new Date(s.ends_at);
                            const label = `${start.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · ${start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}–${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
                            const groupId = (req.group_id || req.id) as string;
                            const canAct = req.state === "awaiting_talent_confirmation"
                              && (s.status === "chosen" || (s.proposed_by === "admin" && s.status === "proposed"));
                            return (
                              <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e2e7e2] bg-white px-3 py-2">
                                <span className="text-sm text-[color:rgba(11,11,11,0.75)]">{label}</span>
                                <span className="ml-auto text-xs font-medium text-[color:rgba(11,11,11,0.55)]">
                                  {s.proposed_by === "talent" ? "proposé par vous" : "proposé par votre interlocuteur"}
                                </span>
                                {s.status === "chosen" && (
                                  <span className="rounded-full bg-[var(--brand)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
                                    Créneau retenu
                                  </span>
                                )}
                                {canAct && (
                                  <button
                                    type="button"
                                    onClick={() => handleTalentAccept(groupId, s.id)}
                                    disabled={rdvActionLoading === groupId}
                                    className="cursor-pointer rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                                  >
                                    {rdvActionLoading === groupId ? "..." : "Accepter"}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {(req.state === "awaiting_talent_confirmation") && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => handleTalentDecline((req.group_id || req.id) as string)}
                              disabled={rdvActionLoading === (req.group_id || req.id)}
                              className="cursor-pointer rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              Refuser
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-[color:rgba(11,11,11,0.5)]">
                    {new Date(req.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {progressionData.length >= 2 && (
        <section data-section className={CARD}>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Ma progression</h2>
            <span className="rounded-full bg-[var(--brand)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--brand)]">
              {progressionData.length} étapes
            </span>
          </div>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            Évolution de votre rémunération dans le temps.
          </p>
          <div className="mt-4">
            <LineChart
              data={progressionData}
              height={200}
              color="var(--brand)"
              formatValue={(v) => `${v.toLocaleString("fr-FR")} €`}
            />
          </div>
          {salary != null && progressionData.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="rounded-xl bg-[var(--brand)]/5 px-4 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.4)]">Départ</p>
                <p className="text-sm font-semibold text-[var(--text)]">{progressionData[0].value.toLocaleString("fr-FR")} €</p>
              </div>
              <svg className="h-4 w-6 text-[var(--brand)]" fill="none" viewBox="0 0 24 16" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 8h20m-6-5 5 5-5 5" />
              </svg>
              <div className="rounded-xl bg-[var(--brand)]/10 px-4 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.4)]">Actuel</p>
                <p className="text-sm font-semibold text-[var(--brand)]">{salary.toLocaleString("fr-FR")} €</p>
              </div>
              {progressionData[0].value > 0 && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  +{Math.round(((salary - progressionData[0].value) / progressionData[0].value) * 100)}% total
                </span>
              )}
            </div>
          )}
        </section>
      )}

      {augmentations.length > 0 && (
        <section data-section className={CARD}>
          <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Historique d&apos;augmentations</h2>
          <div className="relative mt-5">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#e2e7e2]" />
            <div className="space-y-5">
              {augmentations.map((aug) => (
                <div key={aug.id} className="relative pl-8 sm:pl-10">
                  <div className={`absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 ${
                    aug.diff > 0 ? "border-[var(--brand)] bg-[var(--brand)]/20" : aug.diff < 0 ? "border-red-400 bg-red-100" : "border-gray-300 bg-gray-100"
                  }`} />
                  <div className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--text)]">{aug.title}</p>
                      <span className="text-xs text-[color:rgba(11,11,11,0.5)]">
                        {new Date(aug.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--text)]">{aug.newSalary.toLocaleString("fr-FR")} €</span>
                      {aug.diff !== 0 && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          aug.diff > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {aug.diff > 0 ? "+" : ""}{aug.diff.toLocaleString("fr-FR")} € ({aug.pct > 0 ? "+" : ""}{aug.pct}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

      {/* RDV card removed: RDV is handled inside "Mes entretiens" */}
    </div>
  );
}
