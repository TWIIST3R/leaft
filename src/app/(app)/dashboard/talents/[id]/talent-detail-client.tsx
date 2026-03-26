"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { LineChart } from "@/components/charts/line-chart";

type Dept = { id: string; name: string };
type Level = { id: string; name: string; department_id: string; montant_annuel: number | null };
type Emp = { id: string; first_name: string; last_name: string; is_manager?: boolean };
type ExtraLevel = { id: string; name: string; type: string; montant_annuel: number | null };
type Interview = {
  id: string;
  interview_date: string;
  type: string;
  notes: string | null;
  justification: string | null;
  salary_adjustment: number | null;
  previous_salary_applied?: number | null;
  created_at: string;
};
type SalaryHistoryEntry = {
  id: string;
  effective_date: string;
  reason: string | null;
  annual_salary: number | null;
  previous_annual_salary?: number | null;
};
type Employee = {
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
  manager_id: string | null;
  location: string | null;
  annual_salary_brut: number;
  avatar_url: string | null;
  is_manager: boolean;
  created_at: string;
  updated_at: string;
};

const GENDER_OPTIONS = [
  { value: "", label: "— Non renseigné —" },
  { value: "F", label: "Femme" },
  { value: "H", label: "Homme" },
  { value: "Autre", label: "Autre" },
  { value: "Préfère ne pas dire", label: "Préfère ne pas dire" },
];

export function TalentDetailClient({
  employee: initialEmployee,
  departments,
  levels,
  employees,
  managers,
  managementLevels,
  ancienneteLevels,
  interviews,
  salaryHistory = [],
}: {
  employee: Employee;
  departments: Dept[];
  levels: Level[];
  employees: Emp[];
  managers: Emp[];
  managementLevels: ExtraLevel[];
  ancienneteLevels: ExtraLevel[];
  interviews: Interview[];
  salaryHistory?: SalaryHistoryEntry[];
}) {
  const router = useRouter();
  const [employee, setEmployee] = useState(initialEmployee);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [firstName, setFirstName] = useState(employee.first_name);
  const [lastName, setLastName] = useState(employee.last_name);
  const [email, setEmail] = useState(employee.email);
  const [gender, setGender] = useState(employee.gender ?? "");
  const [birthDate, setBirthDate] = useState(employee.birth_date ?? "");
  const [jobTitle, setJobTitle] = useState(employee.current_job_title);
  const [departmentId, setDepartmentId] = useState(employee.current_department_id ?? "");
  const [levelId, setLevelId] = useState(employee.current_level_id ?? "");
  const [managementId, setManagementId] = useState(employee.current_management_id ?? "");
  const [ancienneteId, setAncienneteId] = useState(employee.current_anciennete_id ?? "");
  const [adjustment, setAdjustment] = useState(String(employee.salary_adjustment ?? 0));
  const [managerId, setManagerId] = useState(employee.manager_id ?? "");
  const [isManager, setIsManager] = useState(employee.is_manager ?? false);
  const [loc, setLoc] = useState(employee.location ?? "");
  const [hireDate, setHireDate] = useState(employee.hire_date);

  const filteredLevels = departmentId ? levels.filter((l) => l.department_id === departmentId) : [];
  const deptName = departments.find((d) => d.id === employee.current_department_id)?.name;
  const levelObj = levels.find((l) => l.id === employee.current_level_id);
  const mgmtObj = managementLevels.find((m) => m.id === employee.current_management_id);
  const ancObj = ancienneteLevels.find((a) => a.id === employee.current_anciennete_id);
  const managerEmp = employees.find((e) => e.id === employee.manager_id);

  const editLevel = levels.find((l) => l.id === levelId);
  const editMgmt = managementLevels.find((m) => m.id === managementId);
  const editAnc = ancienneteLevels.find((a) => a.id === ancienneteId);
  const adj = Number(adjustment) || 0;

  const computedSalary = useMemo(() => {
    let total = 0;
    if (editLevel?.montant_annuel) total += Number(editLevel.montant_annuel);
    if (editMgmt?.montant_annuel) total += Number(editMgmt.montant_annuel);
    if (editAnc?.montant_annuel) total += Number(editAnc.montant_annuel);
    total += adj;
    return total;
  }, [editLevel, editMgmt, editAnc, adj]);

  const progressionData = useMemo(() => {
    const sorted = [...salaryHistory]
      .filter((h) => h.effective_date && h.annual_salary != null)
      .sort((a, b) => new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime());
    const points: { label: string; value: number }[] = [];
    const firstPrev = sorted[0]?.previous_annual_salary != null ? Number(sorted[0].previous_annual_salary) : null;
    if (firstPrev != null && employee.hire_date) {
      points.push({
        label: new Date(employee.hire_date).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        value: firstPrev,
      });
    }
    sorted.forEach((h) => {
      points.push({
        label: new Date(h.effective_date).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        value: Number(h.annual_salary),
      });
    });
    if (points.length === 1 && employee.annual_salary_brut != null) {
      points.push({ label: "Aujourd'hui", value: Number(employee.annual_salary_brut) });
    }
    return points;
  }, [salaryHistory, employee.hire_date, employee.annual_salary_brut]);

  const augmentations = useMemo(() => {
    const sorted = [...salaryHistory]
      .filter((h) => h.effective_date && h.annual_salary != null)
      .sort((a, b) => new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime());
    return sorted
      .map((h) => {
        const prev = h.previous_annual_salary != null ? Number(h.previous_annual_salary) : null;
        const curr = h.annual_salary != null ? Number(h.annual_salary) : null;
        if (curr == null) return null;
        const diff = prev != null ? curr - prev : 0;
        const pct = prev != null && prev > 0 ? Math.round((diff / prev) * 100) : 0;
        return {
          id: h.id,
          date: h.effective_date,
          title: h.reason || "Changement de rémunération",
          newSalary: curr,
          diff,
          pct,
        };
      })
      .filter((a): a is { id: string; date: string; title: string; newSalary: number; diff: number; pct: number } => a != null)
      .reverse();
  }, [salaryHistory]);

  function resetForm() {
    setFirstName(employee.first_name);
    setLastName(employee.last_name);
    setEmail(employee.email);
    setGender(employee.gender ?? "");
    setBirthDate(employee.birth_date ?? "");
    setJobTitle(employee.current_job_title);
    setDepartmentId(employee.current_department_id ?? "");
    setLevelId(employee.current_level_id ?? "");
    setManagementId(employee.current_management_id ?? "");
    setAncienneteId(employee.current_anciennete_id ?? "");
    setAdjustment(String(employee.salary_adjustment ?? 0));
    setManagerId(employee.manager_id ?? "");
    setIsManager(employee.is_manager ?? false);
    setLoc(employee.location ?? "");
    setHireDate(employee.hire_date);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          gender: gender || null,
          birth_date: birthDate || null,
          current_job_title: jobTitle.trim(),
          current_department_id: departmentId || null,
          current_level_id: levelId || null,
          current_management_id: managementId || null,
          current_anciennete_id: ancienneteId || null,
          salary_adjustment: adj,
          manager_id: managerId || null,
          is_manager: isManager,
          location: loc.trim() || null,
          hire_date: hireDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setEmployee(data);
      setEditing(false);
      setSuccessMsg("Modifications enregistrées.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  function openDeleteModal() {
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    setDeleteModalOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      router.push("/dashboard/talents");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setLoading(false);
    }
  }

  function fmtEuro(n: number | null | undefined) {
    if (n == null) return "";
    return ` (${Number(n).toLocaleString("fr-FR")} €)`;
  }

  const inputCls = "w-full cursor-text rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] shadow-sm transition-all duration-200 hover:border-[var(--brand)]/40 hover:shadow-md focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:shadow-md disabled:cursor-not-allowed disabled:opacity-50";
  const selectCls = "w-full cursor-pointer rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] shadow-sm transition-all duration-200 hover:border-[var(--brand)]/40 hover:shadow-md focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:shadow-md disabled:cursor-not-allowed disabled:opacity-50";
  const labelCls = "mb-1 block cursor-pointer text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/talents" className="text-sm font-medium text-[var(--brand)] hover:underline">
            ← Retour aux talents
          </Link>
          <div className="mt-2 flex items-center gap-4">
            <Avatar firstName={employee.first_name} lastName={employee.last_name} avatarUrl={employee.avatar_url} size="xl" />
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text)]">
                {employee.first_name} {employee.last_name}
              </h1>
              <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
                {employee.current_job_title}
                {deptName && <> · <span className="text-[var(--brand)]">{deptName}</span></>}
              </p>
            </div>
          </div>
        </div>
        {!editing && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(true)} className="cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110">
              Modifier
            </button>
            <button type="button" onClick={openDeleteModal} disabled={loading} className="cursor-pointer rounded-full border border-red-200 px-5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50">
              Supprimer
            </button>
          </div>
        )}
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {successMsg && <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{successMsg}</p>}

      {editing ? (
        <form onSubmit={handleSave} className="space-y-8">
          <section className="rounded-3xl border border-[var(--brand)]/30 bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
            <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Identité</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div><label className={labelCls}>Prénom *</label><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} required disabled={loading} /></div>
              <div><label className={labelCls}>Nom *</label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} required disabled={loading} /></div>
              <div><label className={labelCls}>Email *</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required disabled={loading} /></div>
              <div><label className={labelCls}>Genre</label><select value={gender} onChange={(e) => setGender(e.target.value)} className={selectCls} disabled={loading}>{GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
              <div><label className={labelCls}>Date de naissance</label><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={`${inputCls} cursor-pointer`} disabled={loading} /></div>
              <div><label className={labelCls}>Localisation</label><input type="text" value={loc} onChange={(e) => setLoc(e.target.value)} className={inputCls} disabled={loading} /></div>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--brand)]/30 bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
            <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Poste & rémunération</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div><label className={labelCls}>Poste *</label><input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputCls} required disabled={loading} /></div>
              <div><label className={labelCls}>Date d&apos;entrée *</label><input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} className={`${inputCls} cursor-pointer`} required disabled={loading} /></div>
              <div><label className={labelCls}>Département</label><select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setLevelId(""); }} className={selectCls} disabled={loading}><option value="">— Aucun —</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div><label className={labelCls}>Niveau / Palier</label><select value={levelId} onChange={(e) => setLevelId(e.target.value)} className={selectCls} disabled={loading || !departmentId}><option value="">— Aucun —</option>{filteredLevels.map((l) => <option key={l.id} value={l.id}>{l.name}{fmtEuro(l.montant_annuel)}</option>)}</select></div>
              <div><label className={labelCls}>Niveau Management</label><select value={managementId} onChange={(e) => setManagementId(e.target.value)} className={selectCls} disabled={loading}><option value="">— Aucun —</option>{managementLevels.map((m) => <option key={m.id} value={m.id}>{m.name}{fmtEuro(m.montant_annuel)}</option>)}</select></div>
              <div><label className={labelCls}>Niveau Ancienneté</label><select value={ancienneteId} onChange={(e) => setAncienneteId(e.target.value)} className={selectCls} disabled={loading}><option value="">— Aucun —</option>{ancienneteLevels.map((a) => <option key={a.id} value={a.id}>{a.name}{fmtEuro(a.montant_annuel)}</option>)}</select></div>
              <div><label className={labelCls}>Ajustement annuel brut (€)</label><input type="number" value={adjustment} onChange={(e) => setAdjustment(e.target.value)} step={100} className={inputCls} disabled={loading} /></div>
              <div><label className={labelCls}>Manager</label><select value={managerId} onChange={(e) => setManagerId(e.target.value)} className={selectCls} disabled={loading}><option value="">— Aucun —</option>{managers.map((emp) => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}</select></div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <button type="button" role="switch" aria-checked={isManager} onClick={() => setIsManager(!isManager)} disabled={loading} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${isManager ? "bg-[var(--brand)]" : "bg-gray-200"} disabled:cursor-not-allowed disabled:opacity-50`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${isManager ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <label className="cursor-pointer text-sm font-medium text-[var(--text)]" onClick={() => !loading && setIsManager(!isManager)}>Ce talent est un manager</label>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Rémunération totale calculée</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--text)]">
                {computedSalary > 0 ? `${computedSalary.toLocaleString("fr-FR")} €` : "—"}
              </p>
              <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.5)]">
                = Palier{editLevel ? ` (${Number(editLevel.montant_annuel ?? 0).toLocaleString("fr-FR")} €)` : " (—)"}
                {" + "}Management{editMgmt ? ` (${Number(editMgmt.montant_annuel ?? 0).toLocaleString("fr-FR")} €)` : " (—)"}
                {" + "}Ancienneté{editAnc ? ` (${Number(editAnc.montant_annuel ?? 0).toLocaleString("fr-FR")} €)` : " (—)"}
                {" + "}Ajustement ({adj.toLocaleString("fr-FR")} €)
              </p>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading} className="cursor-pointer rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50">
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button type="button" onClick={() => { setEditing(false); resetForm(); setError(null); }} disabled={loading} className="cursor-pointer rounded-full border border-[#e2e7e2] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition hover:bg-[#f8faf8]">
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <>
          <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
            <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Informations</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className={labelCls}>Poste</dt>
                <dd className="mt-1 text-sm text-[var(--text)]">{employee.current_job_title || "—"}</dd>
              </div>
              <div>
                <dt className={labelCls}>Email</dt>
                <dd className="mt-1 text-sm text-[var(--text)]">{employee.email}</dd>
              </div>
              <div>
                <dt className={labelCls}>Département</dt>
                <dd className="mt-1 text-sm text-[var(--text)]">
                  {deptName ? <span className="rounded-lg bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">{deptName}</span> : "—"}
                </dd>
              </div>
              <div>
                <dt className={labelCls}>Niveau / Palier</dt>
                <dd className="mt-1 text-sm text-[var(--text)]">
                  {levelObj ? <span className="rounded-lg bg-[var(--brand)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">{levelObj.name}{fmtEuro(levelObj.montant_annuel)}</span> : "—"}
                </dd>
              </div>
              <div>
                <dt className={labelCls}>Niveau Management</dt>
                <dd className="mt-1 text-sm text-[var(--text)]">
                  {mgmtObj ? <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{mgmtObj.name}{fmtEuro(mgmtObj.montant_annuel)}</span> : "—"}
                </dd>
              </div>
              <div>
                <dt className={labelCls}>Niveau Ancienneté</dt>
                <dd className="mt-1 text-sm text-[var(--text)]">
                  {ancObj ? <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">{ancObj.name}{fmtEuro(ancObj.montant_annuel)}</span> : "—"}
                </dd>
              </div>
              <div>
                <dt className={labelCls}>Ajustement annuel</dt>
                <dd className="mt-1 text-sm text-[var(--text)]">
                  {employee.salary_adjustment ? `${Number(employee.salary_adjustment).toLocaleString("fr-FR")} €` : "—"}
                </dd>
              </div>
              <div>
                <dt className={labelCls}>Rémunération totale</dt>
                <dd className="mt-1 text-sm font-semibold text-[var(--text)]">
                  {employee.annual_salary_brut != null ? `${Number(employee.annual_salary_brut).toLocaleString("fr-FR")} €` : "—"}
                </dd>
              </div>
              <div>
                <dt className={labelCls}>Manager</dt>
                <dd className="mt-1 text-sm text-[var(--text)]">
                  {managerEmp ? (
                    <Link href={`/dashboard/talents/${managerEmp.id}`} className="text-[var(--brand)] hover:underline">
                      {managerEmp.first_name} {managerEmp.last_name}
                    </Link>
                  ) : "—"}
                </dd>
              </div>
              <div>
                <dt className={labelCls}>Rôle</dt>
                <dd className="mt-1 text-sm text-[var(--text)]">
                  {employee.is_manager ? (
                    <span className="rounded-lg bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">Manager</span>
                  ) : (
                    <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Collaborateur</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className={labelCls}>Date d&apos;entrée</dt>
                <dd className="mt-1 text-sm text-[var(--text)]">{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString("fr-FR") : "—"}</dd>
              </div>
              <div>
                <dt className={labelCls}>Genre</dt>
                <dd className="mt-1 text-sm text-[var(--text)]">{employee.gender || "—"}</dd>
              </div>
              <div>
                <dt className={labelCls}>Date de naissance</dt>
                <dd className="mt-1 text-sm text-[var(--text)]">{employee.birth_date ? new Date(employee.birth_date).toLocaleDateString("fr-FR") : "—"}</dd>
              </div>
              <div>
                <dt className={labelCls}>Localisation</dt>
                <dd className="mt-1 text-sm text-[var(--text)]">{employee.location || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
            <div className="flex items-center justify-between">
              <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Entretiens</h2>
              <Link href="/dashboard/entretiens" className="text-xs font-medium text-[var(--brand)] hover:underline">
                Voir tous les entretiens
              </Link>
            </div>
            {interviews.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-[#e2e7e2] bg-[#f8faf8] p-6 text-center text-sm text-[color:rgba(11,11,11,0.6)]">
                Aucun entretien enregistré pour ce talent.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {interviews.map((iv) => {
                  const typeColor = iv.type.includes("annuel") ? "bg-[var(--brand)]/10 text-[var(--brand)]" : iv.type.includes("semestriel") ? "bg-blue-100 text-blue-800" : iv.type.includes("mensuel") ? "bg-violet-100 text-violet-800" : iv.type.includes("performance") ? "bg-rose-100 text-rose-800" : iv.type.includes("ponctuel") ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800";
                  return (
                    <Link
                      key={iv.id}
                      href={`/dashboard/entretiens?edit=${iv.id}`}
                      className="block rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-4 transition hover:border-[var(--brand)]/40 hover:bg-[var(--brand)]/5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${typeColor}`}>
                            {iv.type.charAt(0).toUpperCase() + iv.type.slice(1)}
                          </span>
                          <span className="text-sm text-[color:rgba(11,11,11,0.65)]">
                            {new Date(iv.interview_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>
                        {iv.salary_adjustment != null && (
                          <span className="text-sm font-medium text-[var(--text)]">
                            {(() => {
                              const prev = Number(iv.previous_salary_applied);
                              const curr = Number(iv.salary_adjustment);
                              const pct = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;
                              return (
                                <>
                                  {pct != null && (
                                    <span className={`mr-2 text-xs font-semibold ${curr >= prev ? "text-green-600" : "text-red-600"}`}>
                                      {pct >= 0 ? "+" : ""}{pct} %
                                    </span>
                                  )}
                                  {curr.toLocaleString("fr-FR")} €
                                </>
                              );
                            })()}
                          </span>
                        )}
                      </div>
                      {iv.notes && <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.7)]">{iv.notes}</p>}
                      {iv.justification && <p className="mt-1 text-xs italic text-[color:rgba(11,11,11,0.5)]">{iv.justification}</p>}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {salaryHistory.length > 0 && (
            <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
              <div className="flex items-center gap-3">
                <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Ma progression</h2>
                <span className="rounded-full bg-[var(--brand)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--brand)]">
                  {progressionData.length} étapes
                </span>
              </div>
              <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">Évolution de la rémunération dans le temps.</p>
              {progressionData.length >= 2 && (
                <div className="mt-4">
                  <LineChart
                    data={progressionData}
                    height={200}
                    color="var(--brand)"
                    formatValue={(v) => `${Math.round(v).toLocaleString("fr-FR")} €`}
                  />
                </div>
              )}
              {employee.annual_salary_brut != null && progressionData.length > 0 && (
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
                    <p className="text-sm font-semibold text-[var(--brand)]">{Number(employee.annual_salary_brut).toLocaleString("fr-FR")} €</p>
                  </div>
                  {progressionData[0].value > 0 && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                      +{Math.round(((Number(employee.annual_salary_brut) - progressionData[0].value) / progressionData[0].value) * 100)}% total
                    </span>
                  )}
                </div>
              )}

              {augmentations.length > 0 && (
                <>
                  <h3 className="mt-7 border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Historique d&apos;augmentations</h3>
                  <div className="relative mt-5">
                    <div className="absolute bottom-0 left-4 top-0 w-0.5 bg-[#e2e7e2]" />
                    <div className="space-y-5">
                      {augmentations.map((aug) => (
                        <div key={aug.id} className="relative pl-10">
                          <div className={`absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 ${
                            aug.diff > 0 ? "border-[var(--brand)] bg-[var(--brand)]/20" : aug.diff < 0 ? "border-red-400 bg-red-100" : "border-gray-300 bg-gray-100"
                          }`} />
                          <div className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium text-[var(--text)]">{aug.title}</p>
                              <span className="text-xs text-[color:rgba(11,11,11,0.5)]">
                                {new Date(aug.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <span className="text-sm font-semibold text-[var(--text)]">{aug.newSalary.toLocaleString("fr-FR")} €</span>
                              {aug.diff !== 0 && (
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${aug.diff > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                  {aug.diff > 0 ? "+" : ""}{aug.diff.toLocaleString("fr-FR")} € ({aug.pct > 0 ? "+" : ""}{aug.pct}%)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Supprimer ce talent"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="cursor-pointer rounded-full border border-[#e2e7e2] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition hover:bg-[#f8faf8]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={loading}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
              {loading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />}
              {loading ? "Suppression..." : "Supprimer"}
            </button>
          </>
        }
      >
        <p className="text-[var(--text)]">
          Souhaitez-vous vraiment supprimer <strong>{employee.first_name} {employee.last_name}</strong> ?
        </p>
        <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
          Cette action est irréversible. Votre abonnement sera ajusté et un crédit au prorata sera appliqué sur votre prochaine facture. Un email récapitulatif vous sera envoyé.
        </p>
      </Modal>
    </div>
  );
}
