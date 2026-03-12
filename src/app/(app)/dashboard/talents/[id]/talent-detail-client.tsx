"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

type Dept = { id: string; name: string };
type Level = { id: string; name: string; department_id: string; montant_annuel: number | null };
type Emp = { id: string; first_name: string; last_name: string };
type ExtraLevel = { id: string; name: string; type: string; montant_annuel: number | null };
type Interview = {
  id: string;
  interview_date: string;
  type: string;
  notes: string | null;
  justification: string | null;
  salary_adjustment: number | null;
  created_at: string;
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
  managementLevels,
  ancienneteLevels,
  interviews,
}: {
  employee: Employee;
  departments: Dept[];
  levels: Level[];
  employees: Emp[];
  managementLevels: ExtraLevel[];
  ancienneteLevels: ExtraLevel[];
  interviews: Interview[];
}) {
  const router = useRouter();
  const [employee, setEmployee] = useState(initialEmployee);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  async function handleDelete() {
    if (!confirm(`Supprimer ${employee.first_name} ${employee.last_name} ? Cette action est irréversible.`)) return;
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
            <button type="button" onClick={handleDelete} disabled={loading} className="cursor-pointer rounded-full border border-red-200 px-5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50">
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
              <div><label className={labelCls}>Manager</label><select value={managerId} onChange={(e) => setManagerId(e.target.value)} className={selectCls} disabled={loading}><option value="">— Aucun —</option>{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}</select></div>
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
                  const typeColors: Record<string, string> = { annuel: "bg-[var(--brand)]/10 text-[var(--brand)]", semestriel: "bg-blue-100 text-blue-800", ponctuel: "bg-amber-100 text-amber-800" };
                  return (
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
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
