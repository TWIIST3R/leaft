"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";

type Employee = { id: string; first_name: string; last_name: string; email: string; current_job_title: string };
type Interview = {
  id: string;
  employee_id: string;
  interview_date: string;
  type: string;
  notes: string | null;
  justification: string | null;
  salary_adjustment: number | null;
  created_by: string;
  created_at: string;
};

const TYPES = [
  { value: "annuel", label: "Annuel" },
  { value: "semestriel", label: "Semestriel" },
  { value: "ponctuel", label: "Ponctuel" },
];

const CARD = "rounded-3xl border border-[#e2e7e2] bg-white shadow-[0_24px_60px_rgba(17,27,24,0.06)]";
const INPUT = "w-full rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] cursor-text transition hover:border-[color:rgba(9,82,40,0.3)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20";
const LABEL = "block text-sm font-medium text-[var(--text)] cursor-pointer";
const BTN_PRIMARY = "inline-flex cursor-pointer items-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]";
const BTN_SECONDARY = "inline-flex cursor-pointer items-center rounded-full border border-[#e2e7e2] bg-white px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[#f8faf8]";

export function EntretiensClient({
  initialInterviews,
  employees,
}: {
  initialInterviews: Interview[];
  employees: Employee[];
}) {
  const [interviews, setInterviews] = useState(initialInterviews);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterEmployeeId, setFilterEmployeeId] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    employee_id: "",
    interview_date: new Date().toISOString().split("T")[0],
    type: "annuel",
    notes: "",
    justification: "",
    salary_adjustment: "",
  });

  const tableRef = useRef<HTMLTableSectionElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const empMap = new Map(employees.map((e) => [e.id, e]));

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
    setForm({ employee_id: "", interview_date: new Date().toISOString().split("T")[0], type: "annuel", notes: "", justification: "", salary_adjustment: "" });
    setEditingId(null);
    setShowForm(false);
  }, []);

  const handleSubmit = async () => {
    if (!form.employee_id || !form.interview_date || !form.type) return;
    setLoading(true);

    try {
      if (editingId) {
        const res = await fetch(`/api/interviews/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
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
    setForm({
      employee_id: interview.employee_id,
      interview_date: interview.interview_date,
      type: interview.type,
      notes: interview.notes || "",
      justification: interview.justification || "",
      salary_adjustment: interview.salary_adjustment?.toString() || "",
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
    const colors: Record<string, string> = {
      annuel: "bg-[var(--brand)]/10 text-[var(--brand)]",
      semestriel: "bg-blue-100 text-blue-800",
      ponctuel: "bg-amber-100 text-amber-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
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
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className={`${INPUT} cursor-pointer`}
              >
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
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
            <div className="sm:col-span-2">
              <label htmlFor="iv-justif" className={LABEL}>Justification</label>
              <textarea
                id="iv-justif"
                rows={2}
                value={form.justification}
                onChange={(e) => setForm((f) => ({ ...f, justification: e.target.value }))}
                className={INPUT}
                placeholder="Justification de l'ajustement (si applicable)..."
              />
            </div>
            <div>
              <label htmlFor="iv-adj" className={LABEL}>Ajustement salarial (€)</label>
              <input
                id="iv-adj"
                type="number"
                value={form.salary_adjustment}
                onChange={(e) => setForm((f) => ({ ...f, salary_adjustment: e.target.value }))}
                className={INPUT}
                placeholder="0"
              />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button onClick={handleSubmit} disabled={loading || !form.employee_id} className={BTN_PRIMARY}>
              {loading ? "Enregistrement..." : editingId ? "Mettre à jour" : "Créer l\u2019entretien"}
            </button>
            <button onClick={resetForm} className={BTN_SECONDARY}>Annuler</button>
          </div>
        </div>
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
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Notes</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Ajustement</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody ref={tableRef}>
                {filtered.map((iv) => {
                  const emp = empMap.get(iv.employee_id);
                  return (
                    <tr key={iv.id} className="border-b border-[#e2e7e2] transition hover:bg-[#f8faf8]">
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
                      <td className="max-w-[240px] truncate px-6 py-4 text-[color:rgba(11,11,11,0.65)]">
                        {iv.notes || "—"}
                      </td>
                      <td className="px-6 py-4 text-[color:rgba(11,11,11,0.75)]">
                        {iv.salary_adjustment != null && Number(iv.salary_adjustment) !== 0
                          ? `${Number(iv.salary_adjustment) > 0 ? "+" : ""}${Number(iv.salary_adjustment).toLocaleString("fr-FR")} €`
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(iv)} className="text-xs font-medium text-[var(--brand)] hover:underline cursor-pointer">
                            Modifier
                          </button>
                          <button onClick={() => handleDelete(iv.id)} className="text-xs font-medium text-red-600 hover:underline cursor-pointer">
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
