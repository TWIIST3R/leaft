"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import gsap from "gsap";
import { Avatar } from "@/components/ui/avatar";
import { LineChart } from "@/components/charts/line-chart";

type Interview = {
  id: string;
  interview_date: string;
  type: string;
  notes: string | null;
  justification: string | null;
  salary_adjustment: number | null;
};

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
};

const CARD = "rounded-3xl border border-[#e2e7e2] bg-white p-4 shadow-[0_24px_60px_rgba(17,27,24,0.06)] sm:p-6";
const LABEL = "text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]";

export function EspaceTalentClient({ data }: { data: TalentData }) {
  const { employee, orgName } = data;
  const mainRef = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(employee.avatar_url);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [showRdvModal, setShowRdvModal] = useState(false);
  const [rdvTo, setRdvTo] = useState<"manager" | "rh">("manager");
  const [rdvNote, setRdvNote] = useState("");
  const [rdvLoading, setRdvLoading] = useState(false);
  const [rdvSuccess, setRdvSuccess] = useState<string | null>(null);
  const [rdvRequests, setRdvRequests] = useState<{ id: string; requested_to: string; note: string | null; status: string; created_at: string }[]>([]);

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

  async function handleRdvSubmit() {
    setRdvLoading(true);
    setRdvSuccess(null);
    try {
      const res = await fetch("/api/meeting-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requested_to: rdvTo, note: rdvNote }),
      });
      if (res.ok) {
        const created = await res.json();
        setRdvRequests((prev) => [created, ...prev]);
        setRdvSuccess("Votre demande de rendez-vous a été envoyée.");
        setShowRdvModal(false);
        setRdvNote("");
      }
    } catch { /* ignore */ }
    finally { setRdvLoading(false); }
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

  const hireDate = new Date(employee.hire_date);
  const now = new Date();
  const tenureMonths = Math.max(0, (now.getFullYear() - hireDate.getFullYear()) * 12 + now.getMonth() - hireDate.getMonth());
  const tenureYears = Math.floor(tenureMonths / 12);
  const tenureRemaining = tenureMonths % 12;

  return (
    <div ref={mainRef} className="space-y-6 sm:space-y-8">
      <section data-section className={`${CARD} !p-5 sm:!p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">
              Bonjour, {employee.first_name} 👋
            </h1>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
              Bienvenue dans votre espace personnel au sein de {orgName}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            className="group relative cursor-pointer"
          >
            <Avatar firstName={employee.first_name} lastName={employee.last_name} avatarUrl={avatarUrl} size="xl" />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
              {uploadingAvatar ? "..." : "Photo"}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarUpload} />
        </div>
      </section>

      <section data-section className="grid gap-4 sm:gap-6 xl:grid-cols-5">
        <div className={`${CARD} xl:col-span-3`}>
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
          <div>
            <dt className={LABEL}>Date d&apos;entrée</dt>
            <dd className="mt-1 text-sm text-[var(--text)]">
              {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
            </dd>
          </div>
          <div>
            <dt className={LABEL}>Ancienneté dans l&apos;entreprise</dt>
            <dd className="mt-1 text-sm text-[var(--text)]">
              {tenureYears > 0 ? `${tenureYears} an${tenureYears > 1 ? "s" : ""}` : ""}
              {tenureYears > 0 && tenureRemaining > 0 ? " et " : ""}
              {tenureRemaining > 0 ? `${tenureRemaining} mois` : ""}
              {tenureYears === 0 && tenureRemaining === 0 ? "< 1 mois" : ""}
            </dd>
          </div>
          <div><dt className={LABEL}>Localisation</dt><dd className="mt-1 text-sm text-[var(--text)]">{employee.location || "—"}</dd></div>
          </dl>
        </div>

        <div className={`${CARD} xl:col-span-2`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Mes entretiens</h2>
            <span className="rounded-full bg-[var(--brand)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--brand)]">
              {data.interviews.length}
            </span>
          </div>
          {data.interviews.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[#e2e7e2] bg-[#f8faf8] p-6 text-center text-sm text-[color:rgba(11,11,11,0.6)]">
              Aucun entretien enregistré pour le moment.
            </div>
          ) : (
            <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {data.interviews.map((iv) => (
                <div key={iv.id} className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-3 sm:p-4">
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
        </div>
      </section>

      {data.salaryVisible && (
        <section data-section className="rounded-3xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-4 sm:p-6">
          <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Rémunération</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
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

      <section data-section className={CARD}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Demander un rendez-vous</h2>
          <button
            onClick={() => setShowRdvModal(true)}
            className="cursor-pointer rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] sm:px-5"
          >
            Nouveau RDV
          </button>
        </div>

        {rdvSuccess && (
          <p className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{rdvSuccess}</p>
        )}

        {showRdvModal && (
          <div className="mt-4 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-5">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Destinataire</label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setRdvTo("manager")}
                    className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      rdvTo === "manager"
                        ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                        : "border-[#e2e7e2] bg-white text-[var(--text)] hover:border-[var(--brand)]/30"
                    }`}
                  >
                    Mon manager
                  </button>
                  <button
                    type="button"
                    onClick={() => setRdvTo("rh")}
                    className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      rdvTo === "rh"
                        ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                        : "border-[#e2e7e2] bg-white text-[var(--text)] hover:border-[var(--brand)]/30"
                    }`}
                  >
                    Ressources Humaines
                  </button>
                </div>
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
                  onClick={() => { setShowRdvModal(false); setRdvNote(""); }}
                  className="cursor-pointer rounded-full border border-[#e2e7e2] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[#f8faf8]"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {rdvRequests.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Mes demandes</p>
            {rdvRequests.map((req) => (
              <div key={req.id} className="flex flex-col gap-2 rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {req.requested_to === "manager" ? "Manager" : "RH"}
                    </span>
                    <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                      req.status === "pending" ? "bg-amber-100 text-amber-800" :
                      req.status === "accepted" ? "bg-green-100 text-green-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {req.status === "pending" ? "En attente" : req.status === "accepted" ? "Accepté" : "Décliné"}
                    </span>
                  </div>
                  {req.note && <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">{req.note}</p>}
                </div>
                <span className="text-xs text-[color:rgba(11,11,11,0.5)]">
                  {new Date(req.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
