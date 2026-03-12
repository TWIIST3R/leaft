"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dept = { id: string; name: string };
type Level = { id: string; name: string; department_id: string; montant_annuel: number | null };
type Emp = { id: string; first_name: string; last_name: string };
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
  manager_id: string | null;
  location: string | null;
  annual_salary_brut: number;
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
}: {
  employee: Employee;
  departments: Dept[];
  levels: Level[];
  employees: Emp[];
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
  const [managerId, setManagerId] = useState(employee.manager_id ?? "");
  const [loc, setLoc] = useState(employee.location ?? "");
  const [hireDate, setHireDate] = useState(employee.hire_date);
  const [salary, setSalary] = useState(String(employee.annual_salary_brut));

  const filteredLevels = departmentId ? levels.filter((l) => l.department_id === departmentId) : [];
  const deptName = departments.find((d) => d.id === employee.current_department_id)?.name;
  const levelName = levels.find((l) => l.id === employee.current_level_id)?.name;
  const managerEmp = employees.find((e) => e.id === employee.manager_id);

  function resetForm() {
    setFirstName(employee.first_name);
    setLastName(employee.last_name);
    setEmail(employee.email);
    setGender(employee.gender ?? "");
    setBirthDate(employee.birth_date ?? "");
    setJobTitle(employee.current_job_title);
    setDepartmentId(employee.current_department_id ?? "");
    setLevelId(employee.current_level_id ?? "");
    setManagerId(employee.manager_id ?? "");
    setLoc(employee.location ?? "");
    setHireDate(employee.hire_date);
    setSalary(String(employee.annual_salary_brut));
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
          manager_id: managerId || null,
          location: loc.trim() || null,
          hire_date: hireDate,
          annual_salary_brut: Number(salary),
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

  const inputCls = "w-full rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 disabled:opacity-50";
  const labelCls = "block text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/talents" className="text-sm font-medium text-[var(--brand)] hover:underline">
            ← Retour aux talents
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">
            {employee.first_name} {employee.last_name}
          </h1>
          <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
            {employee.current_job_title}
            {deptName && <> · <span className="text-[var(--brand)]">{deptName}</span></>}
          </p>
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
              <div><label className={labelCls}>Genre</label><select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls} disabled={loading}>{GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
              <div><label className={labelCls}>Date de naissance</label><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputCls} disabled={loading} /></div>
              <div><label className={labelCls}>Localisation</label><input type="text" value={loc} onChange={(e) => setLoc(e.target.value)} className={inputCls} disabled={loading} /></div>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--brand)]/30 bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
            <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Poste & rémunération</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div><label className={labelCls}>Poste *</label><input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputCls} required disabled={loading} /></div>
              <div><label className={labelCls}>Date d&apos;entrée *</label><input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} className={inputCls} required disabled={loading} /></div>
              <div><label className={labelCls}>Département</label><select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setLevelId(""); }} className={inputCls} disabled={loading}><option value="">— Aucun —</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div><label className={labelCls}>Niveau / Palier</label><select value={levelId} onChange={(e) => setLevelId(e.target.value)} className={inputCls} disabled={loading || !departmentId}><option value="">— Aucun —</option>{filteredLevels.map((l) => <option key={l.id} value={l.id}>{l.name}{l.montant_annuel != null ? ` (${Number(l.montant_annuel).toLocaleString("fr-FR")} €)` : ""}</option>)}</select></div>
              <div><label className={labelCls}>Salaire annuel brut (€) *</label><input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} min={0} step={100} className={inputCls} required disabled={loading} /></div>
              <div><label className={labelCls}>Manager</label><select value={managerId} onChange={(e) => setManagerId(e.target.value)} className={inputCls} disabled={loading}><option value="">— Aucun —</option>{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}</select></div>
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
                  {levelName ? <span className="rounded-lg bg-[var(--brand)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">{levelName}</span> : "—"}
                </dd>
              </div>
              <div>
                <dt className={labelCls}>Salaire annuel brut</dt>
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
            <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Entretiens annuels</h2>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
              Historique et prochain entretien. Bientôt disponible depuis cette fiche.
            </p>
            <div className="mt-4 rounded-xl border border-dashed border-[#e2e7e2] bg-[#f8faf8] p-6 text-center text-sm text-[color:rgba(11,11,11,0.6)]">
              Suivi des entretiens à venir.
            </div>
          </section>
        </>
      )}
    </div>
  );
}
