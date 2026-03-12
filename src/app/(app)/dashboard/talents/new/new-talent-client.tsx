"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";

type Dept = { id: string; name: string };
type Level = { id: string; name: string; department_id: string; montant_annuel: number | null };
type Employee = { id: string; first_name: string; last_name: string };
type ExtraLevel = { id: string; name: string; type: string; montant_annuel: number | null };

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
  managementLevels,
  ancienneteLevels,
}: {
  departments: Dept[];
  levels: Level[];
  employees: Employee[];
  managementLevels: ExtraLevel[];
  ancienneteLevels: ExtraLevel[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
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
  const [managementId, setManagementId] = useState("");
  const [ancienneteId, setAncienneteId] = useState("");
  const [adjustment, setAdjustment] = useState("");
  const [managerId, setManagerId] = useState("");
  const [location, setLocation] = useState("");
  const [hireDate, setHireDate] = useState("");

  useEffect(() => {
    if (!formRef.current) return;
    const sections = formRef.current.querySelectorAll("[data-form-section]");
    gsap.fromTo(
      sections,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "power3.out" }
    );
  }, []);

  const filteredLevels = departmentId ? levels.filter((l) => l.department_id === departmentId) : [];

  const selectedLevel = levels.find((l) => l.id === levelId);
  const selectedMgmt = managementLevels.find((m) => m.id === managementId);
  const selectedAnc = ancienneteLevels.find((a) => a.id === ancienneteId);
  const adj = Number(adjustment) || 0;

  const computedSalary = useMemo(() => {
    let total = 0;
    if (selectedLevel?.montant_annuel) total += Number(selectedLevel.montant_annuel);
    if (selectedMgmt?.montant_annuel) total += Number(selectedMgmt.montant_annuel);
    if (selectedAnc?.montant_annuel) total += Number(selectedAnc.montant_annuel);
    total += adj;
    return total;
  }, [selectedLevel, selectedMgmt, selectedAnc, adj]);

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
          current_management_id: managementId || null,
          current_anciennete_id: ancienneteId || null,
          salary_adjustment: adj,
          manager_id: managerId || null,
          location: location.trim() || null,
          hire_date: hireDate,
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

  const inputCls =
    "w-full cursor-text rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] shadow-sm transition-all duration-200 hover:border-[var(--brand)]/40 hover:shadow-md focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:shadow-md disabled:cursor-not-allowed disabled:opacity-50";
  const selectCls =
    "w-full cursor-pointer rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] shadow-sm transition-all duration-200 hover:border-[var(--brand)]/40 hover:shadow-md focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:shadow-md disabled:cursor-not-allowed disabled:opacity-50";
  const labelCls = "mb-1.5 block cursor-pointer text-sm font-medium text-[var(--text)]";

  function fmtEuro(n: number | null | undefined) {
    if (n == null) return "";
    return ` (${Number(n).toLocaleString("fr-FR")} €)`;
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <section data-form-section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)] transition-shadow duration-300 hover:shadow-[0_24px_60px_rgba(17,27,24,0.10)]">
        <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Identité</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="fn" className={labelCls}>Prénom *</label>
            <input id="fn" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} required disabled={loading} placeholder="Ex: Marie" />
          </div>
          <div>
            <label htmlFor="ln" className={labelCls}>Nom *</label>
            <input id="ln" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} required disabled={loading} placeholder="Ex: Dupont" />
          </div>
          <div>
            <label htmlFor="em" className={labelCls}>Email *</label>
            <input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required disabled={loading} placeholder="marie.dupont@entreprise.com" />
          </div>
          <div>
            <label htmlFor="ge" className={labelCls}>Genre</label>
            <select id="ge" value={gender} onChange={(e) => setGender(e.target.value)} className={selectCls} disabled={loading}>
              {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="bd" className={labelCls}>Date de naissance</label>
            <input id="bd" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={`${inputCls} cursor-pointer`} disabled={loading} />
          </div>
          <div>
            <label htmlFor="loc" className={labelCls}>Localisation</label>
            <input id="loc" type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} disabled={loading} placeholder="Ex: Paris, France" />
          </div>
        </div>
      </section>

      <section data-form-section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)] transition-shadow duration-300 hover:shadow-[0_24px_60px_rgba(17,27,24,0.10)]">
        <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Poste & rémunération</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="jt" className={labelCls}>Poste *</label>
            <input id="jt" type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputCls} required disabled={loading} placeholder="Ex: Product Designer" />
          </div>
          <div>
            <label htmlFor="hd" className={labelCls}>Date d&apos;entrée *</label>
            <input id="hd" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} className={`${inputCls} cursor-pointer`} required disabled={loading} />
          </div>
          <div>
            <label htmlFor="dept" className={labelCls}>Département</label>
            <select id="dept" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setLevelId(""); }} className={selectCls} disabled={loading}>
              <option value="">— Aucun —</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="lvl" className={labelCls}>Niveau / Palier</label>
            <select id="lvl" value={levelId} onChange={(e) => setLevelId(e.target.value)} className={selectCls} disabled={loading || !departmentId}>
              <option value="">— Aucun —</option>
              {filteredLevels.map((l) => (
                <option key={l.id} value={l.id}>{l.name}{fmtEuro(l.montant_annuel)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="mgmt" className={labelCls}>Niveau Management</label>
            <select id="mgmt" value={managementId} onChange={(e) => setManagementId(e.target.value)} className={selectCls} disabled={loading}>
              <option value="">— Aucun —</option>
              {managementLevels.map((m) => (
                <option key={m.id} value={m.id}>{m.name}{fmtEuro(m.montant_annuel)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="anc" className={labelCls}>Niveau Ancienneté</label>
            <select id="anc" value={ancienneteId} onChange={(e) => setAncienneteId(e.target.value)} className={selectCls} disabled={loading}>
              <option value="">— Aucun —</option>
              {ancienneteLevels.map((a) => (
                <option key={a.id} value={a.id}>{a.name}{fmtEuro(a.montant_annuel)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="adj" className={labelCls}>Ajustement annuel brut (€)</label>
            <input id="adj" type="number" value={adjustment} onChange={(e) => setAdjustment(e.target.value)} step={100} className={inputCls} disabled={loading} placeholder="Ex: 2000" />
          </div>
          <div>
            <label htmlFor="mgr" className={labelCls}>Manager</label>
            <select id="mgr" value={managerId} onChange={(e) => setManagerId(e.target.value)} className={selectCls} disabled={loading}>
              <option value="">— Aucun —</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">
            Salaire annuel brut calculé
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text)]">
            {computedSalary > 0 ? `${computedSalary.toLocaleString("fr-FR")} €` : "—"}
          </p>
          <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.5)]">
            = Palier{selectedLevel ? ` (${Number(selectedLevel.montant_annuel ?? 0).toLocaleString("fr-FR")} €)` : " (—)"}
            {" + "}Management{selectedMgmt ? ` (${Number(selectedMgmt.montant_annuel ?? 0).toLocaleString("fr-FR")} €)` : " (—)"}
            {" + "}Ancienneté{selectedAnc ? ` (${Number(selectedAnc.montant_annuel ?? 0).toLocaleString("fr-FR")} €)` : " (—)"}
            {" + "}Ajustement ({adj.toLocaleString("fr-FR")} €)
          </p>
        </div>
      </section>

      <section data-form-section className="rounded-3xl border border-[var(--brand)]/15 bg-[var(--brand)]/3 p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/15 text-sm text-[var(--brand)]">✉</span>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Invitation par email</p>
            <p className="mt-0.5 text-xs text-[color:rgba(11,11,11,0.6)]">
              Le talent recevra un email d&apos;invitation pour créer son compte Leaft et accéder à son espace personnel au sein de votre organisation.
            </p>
          </div>
        </div>
      </section>

      <div data-form-section className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="cursor-pointer rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:brightness-110 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Création & envoi de l'invitation..." : "Ajouter le talent"}
        </button>
        <Link href="/dashboard/talents" className="cursor-pointer rounded-full border border-[#e2e7e2] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition-all duration-200 hover:bg-[#f8faf8] hover:shadow-sm">
          Annuler
        </Link>
      </div>
    </form>
  );
}
