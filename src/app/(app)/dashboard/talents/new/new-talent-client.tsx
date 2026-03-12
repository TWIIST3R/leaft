"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dept = { id: string; name: string };
type Level = { id: string; name: string; department_id: string; montant_annuel: number | null };
type Employee = { id: string; first_name: string; last_name: string };

const GENDER_OPTIONS = [
  { value: "", label: "— Non renseigné —" },
  { value: "F", label: "Femme" },
  { value: "H", label: "Homme" },
  { value: "Autre", label: "Autre" },
  { value: "Préfère ne pas dire", label: "Préfère ne pas dire" },
];

export function NewTalentClient({
  departments,
  levels,
  employees,
}: {
  departments: Dept[];
  levels: Level[];
  employees: Employee[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [location, setLocation] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [salary, setSalary] = useState("");

  const filteredLevels = departmentId ? levels.filter((l) => l.department_id === departmentId) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
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
          location: location.trim() || null,
          hire_date: hireDate,
          annual_salary_brut: Number(salary),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création");
      router.push(`/dashboard/talents/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 disabled:opacity-50";
  const labelCls = "block text-sm font-medium text-[var(--text)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Identité</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Prénom *</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} required disabled={loading} placeholder="Ex: Marie" />
          </div>
          <div>
            <label className={labelCls}>Nom *</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} required disabled={loading} placeholder="Ex: Dupont" />
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required disabled={loading} placeholder="marie.dupont@entreprise.com" />
          </div>
          <div>
            <label className={labelCls}>Genre</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls} disabled={loading}>
              {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Date de naissance</label>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputCls} disabled={loading} />
          </div>
          <div>
            <label className={labelCls}>Localisation</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} disabled={loading} placeholder="Ex: Paris, France" />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Poste & rémunération</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Poste *</label>
            <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputCls} required disabled={loading} placeholder="Ex: Product Designer" />
          </div>
          <div>
            <label className={labelCls}>Date d&apos;entrée *</label>
            <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} className={inputCls} required disabled={loading} />
          </div>
          <div>
            <label className={labelCls}>Département</label>
            <select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setLevelId(""); }} className={inputCls} disabled={loading}>
              <option value="">— Aucun —</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Niveau / Palier</label>
            <select value={levelId} onChange={(e) => setLevelId(e.target.value)} className={inputCls} disabled={loading || !departmentId}>
              <option value="">— Aucun —</option>
              {filteredLevels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}{l.montant_annuel != null ? ` (${Number(l.montant_annuel).toLocaleString("fr-FR")} €)` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Salaire annuel brut (€) *</label>
            <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} min={0} step={100} className={inputCls} required disabled={loading} placeholder="Ex: 45000" />
          </div>
          <div>
            <label className={labelCls}>Manager</label>
            <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className={inputCls} disabled={loading}>
              <option value="">— Aucun —</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
            </select>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="cursor-pointer rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50">
          {loading ? "Création..." : "Ajouter le talent"}
        </button>
        <Link href="/dashboard/talents" className="rounded-full border border-[#e2e7e2] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition hover:bg-[#f8faf8]">
          Annuler
        </Link>
      </div>
    </form>
  );
}
