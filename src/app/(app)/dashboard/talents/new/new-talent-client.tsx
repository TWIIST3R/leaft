"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { Modal } from "@/components/ui/modal";

type Dept = { id: string; name: string };
type Level = { id: string; name: string; department_id: string; montant_annuel: number | null };
type Employee = { id: string; first_name: string; last_name: string; is_manager?: boolean };
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
  managers,
  managementLevels,
  ancienneteLevels,
}: {
  departments: Dept[];
  levels: Level[];
  employees: Employee[];
  managers: Employee[];
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
  const [isManager, setIsManager] = useState(false);
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

  type BillingInfo = { previousSeats: number; newSeats: number; prorationCents: number; newMonthlyCents: number };
  type BillingPreview = { previousSeatCount: number; newSeatCount: number; prorationAmountCents: number; newMonthlyAmountCents: number; nextBillingDate?: string | null };

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [billingPreview, setBillingPreview] = useState<BillingPreview | null>(null);
  const [billingResult, setBillingResult] = useState<BillingInfo | null>(null);
  const [pendingSuccessId, setPendingSuccessId] = useState<string | null>(null);

  async function openConfirmModal() {
    setError(null);
    try {
      const res = await fetch("/api/subscription/preview-add-seat");
      if (res.ok) {
        const data = await res.json();
        setBillingPreview(data);
      } else {
        setBillingPreview(null);
      }
    } catch {
      setBillingPreview(null);
    }
    setConfirmModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await openConfirmModal();
  }

  async function confirmAddTalent() {
    setConfirmModalOpen(false);
    setLoading(true);
    setError(null);
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
          is_manager: isManager,
          location: location.trim() || null,
          hire_date: hireDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création");
      if (data.billingInfo) {
        setBillingResult({
          previousSeats: data.billingInfo.previousSeats,
          newSeats: data.billingInfo.newSeats,
          prorationCents: data.billingInfo.prorationCents,
          newMonthlyCents: data.billingInfo.newMonthlyCents,
        });
      }
      setPendingSuccessId(data.id);
      setSuccessModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  function closeSuccessModal() {
    setSuccessModalOpen(false);
    if (pendingSuccessId) {
      router.push(`/dashboard/talents/${pendingSuccessId}`);
      router.refresh();
    }
    setPendingSuccessId(null);
    setBillingResult(null);
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
              {managers.map((emp) => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
            </select>
            {managers.length === 0 && (
              <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.45)]">Aucun manager défini. Créez d&apos;abord un talent avec le rôle manager.</p>
            )}
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="button"
              role="switch"
              aria-checked={isManager}
              onClick={() => setIsManager(!isManager)}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${isManager ? "bg-[var(--brand)]" : "bg-gray-200"} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${isManager ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <label className="cursor-pointer text-sm font-medium text-[var(--text)]" onClick={() => !loading && setIsManager(!isManager)}>
              Ce talent est un manager
            </label>
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

      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirmer l'ajout du talent"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmModalOpen(false)}
              className="cursor-pointer rounded-full border border-[#e2e7e2] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition hover:bg-[#f8faf8]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmAddTalent}
              disabled={loading}
              className="cursor-pointer rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Création..." : "Confirmer l'ajout"}
            </button>
          </>
        }
      >
        <p className="text-[var(--text)]">
          L'ajout de ce talent va faire évoluer votre abonnement Leaft.
        </p>
        {billingPreview ? (
          <div className="mt-4 space-y-2 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-4">
            <p className="font-medium text-[var(--text)]">Détail de l'ajustement :</p>
            <ul className="list-inside list-disc space-y-1 text-[color:rgba(11,11,11,0.8)]">
              <li>Nombre de talents actuel : <strong>{billingPreview.previousSeatCount}</strong></li>
              <li>Après ajout : <strong>{billingPreview.newSeatCount}</strong> talent{billingPreview.newSeatCount > 1 ? "s" : ""}</li>
              <li>Nouveau montant mensuel de l'abonnement : <strong>{(billingPreview.newMonthlyAmountCents / 100).toFixed(2).replace(".", ",")} €</strong></li>
              <li>Montant au prorata (facturé dès maintenant) : <strong>{(billingPreview.prorationAmountCents / 100).toFixed(2).replace(".", ",")} €</strong></li>
            </ul>
            <p className="mt-2 text-xs text-[color:rgba(11,11,11,0.6)]">
              Un email récapitulatif vous sera envoyé après validation.
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            Le montant sera ajusté au prorata. Un email récapitulatif vous sera envoyé.
          </p>
        )}
      </Modal>

      <Modal
        open={successModalOpen}
        onClose={closeSuccessModal}
        title="Talent ajouté"
        footer={
          <button
            type="button"
            onClick={closeSuccessModal}
            className="cursor-pointer rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            OK
          </button>
        }
      >
        <p className="text-[var(--text)]">Le talent a été créé et une invitation par email lui a été envoyée.</p>
        {billingResult && (
          <div className="mt-4 space-y-2 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-4">
            <p className="font-medium text-[var(--text)]">Votre abonnement a été mis à jour :</p>
            <ul className="list-inside list-disc space-y-1 text-[color:rgba(11,11,11,0.8)]">
              <li>Ancien nombre de talents : <strong>{billingResult.previousSeats}</strong></li>
              <li>Nouveau total : <strong>{billingResult.newSeats}</strong> talent{billingResult.newSeats > 1 ? "s" : ""}</li>
              <li>Nouveau montant mensuel : <strong>{(billingResult.newMonthlyCents / 100).toFixed(2).replace(".", ",")} €</strong></li>
              <li>Montant au prorata facturé : <strong>{(billingResult.prorationCents / 100).toFixed(2).replace(".", ",")} €</strong></li>
            </ul>
            <p className="mt-2 text-sm font-medium text-[var(--brand)]">Un email récapitulatif vous a été envoyé.</p>
          </div>
        )}
      </Modal>
    </form>
  );
}
