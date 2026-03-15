"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import gsap from "gsap";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  current_job_title: string;
  current_department_id: string | null;
  current_level_id?: string | null;
  current_management_id?: string | null;
  current_anciennete_id?: string | null;
  salary_adjustment?: number | null;
  annual_salary_brut?: number | null;
};
type Dept = { id: string; name: string };
type Level = { id: string; name: string; department_id: string; montant_annuel: number | null };
type ExtraLevel = { id: string; name: string; type: string; montant_annuel: number | null };
type Interview = {
  id: string;
  employee_id: string;
  interview_date: string;
  type: string;
  notes: string | null;
  justification: string | null;
  salary_adjustment: number | null;
  status: string | null;
  created_by: string;
  created_at: string;
};

const TYPES = [
  { value: "Entretien annuel", label: "Entretien annuel" },
  { value: "Entretien semestriel", label: "Entretien semestriel" },
  { value: "Entretien de suivi mensuel", label: "Entretien de suivi mensuel" },
  { value: "Entretien de performance", label: "Entretien de performance" },
  { value: "Entretien ponctuel", label: "Entretien ponctuel" },
];

const CARD = "rounded-3xl border border-[#e2e7e2] bg-white shadow-[0_24px_60px_rgba(17,27,24,0.06)]";
const INPUT = "w-full rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] cursor-text transition hover:border-[color:rgba(9,82,40,0.3)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20";
const LABEL = "block text-sm font-medium text-[var(--text)] cursor-pointer";
const BTN_PRIMARY = "inline-flex cursor-pointer items-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]";
const BTN_SECONDARY = "inline-flex cursor-pointer items-center rounded-full border border-[#e2e7e2] bg-white px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[#f8faf8]";

export function EntretiensClient({
  initialInterviews,
  employees,
  departments,
  levels,
  managementLevels,
  ancienneteLevels,
}: {
  initialInterviews: Interview[];
  employees: Employee[];
  departments: Dept[];
  levels: Level[];
  managementLevels: ExtraLevel[];
  ancienneteLevels: ExtraLevel[];
}) {
  const searchParams = useSearchParams();
  const editIdFromUrl = searchParams.get("edit");

  const [interviews, setInterviews] = useState(initialInterviews);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterEmployeeId, setFilterEmployeeId] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(false);

  const hasOpenedEditRef = useRef(false);
  useEffect(() => {
    if (!editIdFromUrl || interviews.length === 0 || hasOpenedEditRef.current) return;
    const interview = interviews.find((i) => i.id === editIdFromUrl);
    if (interview) {
      hasOpenedEditRef.current = true;
      handleEdit(interview);
    }
  }, [editIdFromUrl, interviews]);

  type MeetingRequest = {
    id: string;
    employee_id: string;
    requested_to: string;
    note: string | null;
    status: string;
    created_at: string;
    employee?: { id: string; first_name: string; last_name: string; email: string } | null;
  };
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);

  const [form, setForm] = useState({
    employee_id: "",
    interview_date: new Date().toISOString().split("T")[0],
    type: "Entretien annuel",
    email_subject: "Entretien annuel",
    notes: "",
    justification: "",
    status: "en_cours",
  });

  const [salaryForm, setSalaryForm] = useState({
    apply_salary_changes: false,
    new_level_id: "",
    new_management_id: "",
    new_anciennete_id: "",
    new_salary_adjustment: "",
  });

  const tableRef = useRef<HTMLTableSectionElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const selectedEmp = empMap.get(form.employee_id);
  const empDeptLevels = selectedEmp?.current_department_id
    ? levels.filter((l) => l.department_id === selectedEmp.current_department_id)
    : [];

  const currentLevelObj = selectedEmp?.current_level_id ? levels.find((l) => l.id === selectedEmp.current_level_id) : null;
  const currentMgmtObj = selectedEmp?.current_management_id ? managementLevels.find((m) => m.id === selectedEmp.current_management_id) : null;
  const currentAncObj = selectedEmp?.current_anciennete_id ? ancienneteLevels.find((a) => a.id === selectedEmp.current_anciennete_id) : null;
  const currentAdj = selectedEmp?.salary_adjustment ?? 0;
  const currentTotal =
    (currentLevelObj?.montant_annuel ?? 0) +
    (currentMgmtObj?.montant_annuel ?? 0) +
    (currentAncObj?.montant_annuel ?? 0) +
    Number(currentAdj);

  function fmtEuro(n: number | null | undefined) {
    if (n == null) return "";
    return ` (${Number(n).toLocaleString("fr-FR")} €)`;
  }

  useEffect(() => {
    fetch("/api/meeting-requests?admin=true")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setMeetingRequests(d); })
      .catch(() => {});
  }, []);

  async function handleMeetingRequestAction(id: string, status: "accepted" | "declined") {
    const res = await fetch("/api/meeting-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setMeetingRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    }
  }

  useEffect(() => {
    if (!tableRef.current) return;
    const rows = tableRef.current.querySelectorAll("tr");
    gsap.fromTo(rows, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: "power2.out" });
  }, [interviews.length, filterEmployeeId, filterType]);

  useEffect(() => {
    if (showForm && formRef.current) {
      gsap.fromTo(formRef.current, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
    }
  }, [showForm]);

  const filtered = interviews.filter((i) => {
    if (filterEmployeeId && i.employee_id !== filterEmployeeId) return false;
    if (filterType && i.type !== filterType) return false;
    return true;
  });

  const resetForm = useCallback(() => {
    setForm({ employee_id: "", interview_date: new Date().toISOString().split("T")[0], type: "Entretien annuel", email_subject: "Entretien annuel", notes: "", justification: "", status: "en_cours" });
    setSalaryForm({ apply_salary_changes: false, new_level_id: "", new_management_id: "", new_anciennete_id: "", new_salary_adjustment: "" });
    setEditingId(null);
    setShowForm(false);
  }, []);

  const handleSubmit = async () => {
    if (!form.employee_id || !form.interview_date || !form.type) return;
    setLoading(true);

    try {
      if (editingId) {
        const payload = {
          ...form,
          status: form.status,
          ...(salaryForm.apply_salary_changes
            ? {
                apply_salary_changes: true,
                new_level_id: salaryForm.new_level_id || undefined,
                new_management_id: salaryForm.new_management_id || undefined,
                new_anciennete_id: salaryForm.new_anciennete_id || undefined,
                new_salary_adjustment: salaryForm.new_salary_adjustment !== "" ? Number(salaryForm.new_salary_adjustment) : undefined,
              }
            : {}),
        };
        const res = await fetch(`/api/interviews/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setInterviews((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
          resetForm();
        }
      } else {
        const res = await fetch("/api/interviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const created = await res.json();
          setInterviews((prev) => [created, ...prev]);
          resetForm();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (interview: Interview) => {
    const emp = empMap.get(interview.employee_id);
    setForm({
      employee_id: interview.employee_id,
      interview_date: interview.interview_date,
      type: interview.type,
      email_subject: interview.type,
      notes: interview.notes || "",
      justification: interview.justification || "",
      status: interview.status === "termine" ? "termine" : "en_cours",
    });
    setSalaryForm({
      apply_salary_changes: false,
      new_level_id: emp?.current_level_id ?? "",
      new_management_id: emp?.current_management_id ?? "",
      new_anciennete_id: emp?.current_anciennete_id ?? "",
      new_salary_adjustment: emp?.salary_adjustment != null ? String(emp.salary_adjustment) : "",
    });
    setEditingId(interview.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet entretien ?")) return;
    const res = await fetch(`/api/interviews/${id}`, { method: "DELETE" });
    if (res.ok) {
      setInterviews((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const typeBadge = (type: string) => {
    if (type.includes("annuel")) return "bg-[var(--brand)]/10 text-[var(--brand)]";
    if (type.includes("semestriel")) return "bg-blue-100 text-blue-800";
    if (type.includes("mensuel")) return "bg-violet-100 text-violet-800";
    if (type.includes("performance")) return "bg-rose-100 text-rose-800";
    if (type.includes("ponctuel")) return "bg-amber-100 text-amber-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterEmployeeId}
            onChange={(e) => setFilterEmployeeId(e.target.value)}
            className="rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] cursor-pointer transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          >
            <option value="">Tous les collaborateurs</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] cursor-pointer transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          >
            <option value="">Tous les types</option>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className={BTN_PRIMARY}>
          Nouvel entretien
        </button>
      </div>

      {showForm && (
        <div ref={formRef} className={`${CARD} p-6`}>
          <h3 className="text-lg font-semibold text-[var(--text)]">
            {editingId ? "Modifier l\u2019entretien" : "Nouvel entretien"}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="iv-emp" className={LABEL}>Collaborateur</label>
              <select
                id="iv-emp"
                value={form.employee_id}
                onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
                className={`${INPUT} cursor-pointer`}
              >
                <option value="">Sélectionner...</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="iv-date" className={LABEL}>Date</label>
              <input
                id="iv-date"
                type="date"
                value={form.interview_date}
                onChange={(e) => setForm((f) => ({ ...f, interview_date: e.target.value }))}
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="iv-type" className={LABEL}>Type</label>
              <select
                id="iv-type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, email_subject: e.target.value }))}
                className={`${INPUT} cursor-pointer`}
              >
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="iv-subject" className={LABEL}>Objet de l&apos;email d&apos;invitation</label>
              <input
                id="iv-subject"
                type="text"
                value={form.email_subject}
                onChange={(e) => setForm((f) => ({ ...f, email_subject: e.target.value }))}
                className={INPUT}
                placeholder="Ex: Entretien annuel 2026"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="iv-notes" className={LABEL}>Notes</label>
              <textarea
                id="iv-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className={INPUT}
                placeholder="Observations, points abordés..."
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="iv-justif" className={LABEL}>Justification</label>
              <textarea
                id="iv-justif"
                rows={2}
                value={form.justification}
                onChange={(e) => setForm((f) => ({ ...f, justification: e.target.value }))}
                className={INPUT}
                placeholder="Justification (si applicable)..."
              />
            </div>
            {editingId && (
              <div>
                <label htmlFor="iv-status" className={LABEL}>Statut de l&apos;entretien</label>
                <select
                  id="iv-status"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className={`${INPUT} cursor-pointer`}
                >
                  <option value="en_cours">En cours</option>
                  <option value="termine">Terminé</option>
                </select>
              </div>
            )}
          </div>

          {editingId && selectedEmp && (
            <>
              <div className="mt-5 rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Rémunération actuelle du talent</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[var(--text)]">
                  <span>Palier : <strong>{currentLevelObj ? `${currentLevelObj.name}${fmtEuro(currentLevelObj.montant_annuel)}` : "—"}</strong></span>
                  <span>·</span>
                  <span>Management : <strong>{currentMgmtObj ? `${currentMgmtObj.name}${fmtEuro(currentMgmtObj.montant_annuel)}` : "—"}</strong></span>
                  <span>·</span>
                  <span>Ancienneté : <strong>{currentAncObj ? `${currentAncObj.name}${fmtEuro(currentAncObj.montant_annuel)}` : "—"}</strong></span>
                  <span>·</span>
                  <span>Ajustement : <strong>{currentAdj !== 0 ? `${Number(currentAdj).toLocaleString("fr-FR")} €` : "—"}</strong></span>
                </div>
                <p className="mt-2 text-base font-semibold text-[var(--brand)]">
                  Total annuel brut : {currentTotal > 0 ? `${currentTotal.toLocaleString("fr-FR")} €` : "—"}
                </p>
              </div>

              <div className="mt-5 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={salaryForm.apply_salary_changes}
                    onClick={() => setSalaryForm((s) => ({ ...s, apply_salary_changes: !s.apply_salary_changes }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${salaryForm.apply_salary_changes ? "bg-[var(--brand)]" : "bg-gray-200"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${salaryForm.apply_salary_changes ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className="text-sm font-medium text-[var(--text)] cursor-pointer" onClick={() => setSalaryForm((s) => ({ ...s, apply_salary_changes: !s.apply_salary_changes }))}>
                    Appliquer des changements de rémunération
                  </span>
                </div>

                {salaryForm.apply_salary_changes && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className={LABEL}>Nouveau palier</label>
                      <select
                        value={salaryForm.new_level_id}
                        onChange={(e) => setSalaryForm((s) => ({ ...s, new_level_id: e.target.value }))}
                        className={`${INPUT} cursor-pointer`}
                      >
                        <option value="">— Inchangé —</option>
                        {empDeptLevels.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}{fmtEuro(l.montant_annuel)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Nouveau management</label>
                      <select
                        value={salaryForm.new_management_id}
                        onChange={(e) => setSalaryForm((s) => ({ ...s, new_management_id: e.target.value }))}
                        className={`${INPUT} cursor-pointer`}
                      >
                        <option value="">— Inchangé —</option>
                        {managementLevels.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}{fmtEuro(m.montant_annuel)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Nouvelle ancienneté</label>
                      <select
                        value={salaryForm.new_anciennete_id}
                        onChange={(e) => setSalaryForm((s) => ({ ...s, new_anciennete_id: e.target.value }))}
                        className={`${INPUT} cursor-pointer`}
                      >
                        <option value="">— Inchangé —</option>
                        {ancienneteLevels.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}{fmtEuro(a.montant_annuel)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Ajustement hors grille (€/an)</label>
                      <input
                        type="number"
                        value={salaryForm.new_salary_adjustment}
                        onChange={(e) => setSalaryForm((s) => ({ ...s, new_salary_adjustment: e.target.value }))}
                        className={INPUT}
                        placeholder="0"
                        step={100}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          <div className="mt-5 flex items-center gap-3">
            <button onClick={handleSubmit} disabled={loading || !form.employee_id} className={BTN_PRIMARY}>
              {loading ? "Enregistrement..." : editingId ? "Mettre à jour" : "Créer l\u2019entretien"}
            </button>
            <button onClick={resetForm} className={BTN_SECONDARY}>Annuler</button>
          </div>
        </div>
      )}

      {meetingRequests.length > 0 && (
        <section className={CARD + " p-6"}>
          <h3 className="border-l-4 border-purple-500 pl-4 text-lg font-semibold text-[var(--text)]">
            Demandes de rendez-vous ({meetingRequests.filter((r) => r.status === "pending").length} en attente)
          </h3>
          <div className="mt-4 space-y-3">
            {meetingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[var(--text)]">
                      {req.employee ? `${req.employee.first_name} ${req.employee.last_name}` : "—"}
                    </span>
                    <span className="rounded-lg bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
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
                  <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.45)]">
                    {new Date(req.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMeetingRequestAction(req.id, "accepted")}
                      className="cursor-pointer rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleMeetingRequestAction(req.id, "declined")}
                      className="cursor-pointer rounded-full border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Décliner
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={CARD}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[color:rgba(11,11,11,0.65)]">
              {interviews.length === 0 ? "Aucun entretien enregistré." : "Aucun résultat pour ces filtres."}
            </p>
            {interviews.length === 0 && (
              <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.5)]">
                Créez votre premier entretien pour commencer le suivi.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e2e7e2] bg-[#f8faf8]">
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Collaborateur</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Date</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Type</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Statut</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Notes</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Changement rémunération</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody ref={tableRef}>
                {filtered.map((iv) => {
                  const emp = empMap.get(iv.employee_id);
                  return (
                    <tr
                      key={iv.id}
                      onClick={() => handleEdit(iv)}
                      className="cursor-pointer border-b border-[#e2e7e2] transition hover:bg-[#f8faf8]"
                    >
                      <td className="px-6 py-4 font-medium text-[var(--text)]">
                        {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                      </td>
                      <td className="px-6 py-4 text-[color:rgba(11,11,11,0.75)]">
                        {new Date(iv.interview_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${typeBadge(iv.type)}`}>
                          {TYPES.find((t) => t.value === iv.type)?.label || iv.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${iv.status === "termine" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                          {iv.status === "termine" ? "Terminé" : "En cours"}
                        </span>
                      </td>
                      <td className="max-w-[240px] truncate px-6 py-4 text-[color:rgba(11,11,11,0.65)]">
                        {iv.notes || "—"}
                      </td>
                      <td className="px-6 py-4 text-[color:rgba(11,11,11,0.75)]">
                        {iv.salary_adjustment != null
                          ? `${Number(iv.salary_adjustment).toLocaleString("fr-FR")} €`
                          : "—"}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => handleEdit(iv)} className="text-xs font-medium text-[var(--brand)] hover:underline cursor-pointer">
                            Modifier
                          </button>
                          <button type="button" onClick={() => handleDelete(iv.id)} className="text-xs font-medium text-red-600 hover:underline cursor-pointer">
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
