"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Department = { id: string; name: string; created_at: string };
type Criteria = { objectives?: string[]; competencies?: string[]; min_tenure_months?: number | null; notes?: string } | null;
type Palier = {
  id: string;
  department_id: string;
  name: string;
  order: number;
  montant_annuel: number | null;
  criteria: Criteria;
  expectations: string | null;
};
type DepartmentWithPaliers = Department & { paliers: Palier[] };

function PalierForm({
  onAdd,
  loading,
}: {
  onAdd: (data: { name: string; montant_annuel?: number; criteria?: Criteria }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [montant, setMontant] = useState("");
  const [objectives, setObjectives] = useState("");
  const [competencies, setCompetencies] = useState("");
  const [minTenure, setMinTenure] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const objList = objectives.trim() ? objectives.split("\n").map((s) => s.trim()).filter(Boolean) : undefined;
    const compList = competencies.trim() ? competencies.split("\n").map((s) => s.trim()).filter(Boolean) : undefined;
    onAdd({
      name: n,
      montant_annuel: montant ? Number(montant) : undefined,
      criteria: {
        objectives: objList ?? [],
        competencies: compList ?? [],
        min_tenure_months: minTenure ? Number(minTenure) : null,
        notes: notes.trim() || undefined,
      },
    });
    setName("");
    setMontant("");
    setObjectives("");
    setCompetencies("");
    setMinTenure("");
    setNotes("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du palier (ex: Junior, Senior)"
          className="rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/20 w-44"
          disabled={loading}
        />
        <input
          type="number"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          placeholder="Rémunération annuelle brute (€)"
          min={0}
          step={100}
          className="rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm w-48 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/20"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          Ajouter palier
        </button>
      </div>
      <details className="rounded-lg border border-[#e2e7e2] bg-[#f8faf8] px-3 py-2 text-sm">
        <summary className="cursor-pointer font-medium text-[var(--text)]">
          Critères pour passer au palier suivant (optionnels)
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-[color:rgba(11,11,11,0.65)]">Objectifs mesurables (un par ligne)</label>
            <textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              rows={2}
              placeholder="Ex: Livrer 3 projets majeurs"
              className="mt-1 w-full rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[color:rgba(11,11,11,0.65)]">Compétences requises (une par ligne)</label>
            <textarea
              value={competencies}
              onChange={(e) => setCompetencies(e.target.value)}
              rows={2}
              placeholder="Ex: Leadership"
              className="mt-1 w-full rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[color:rgba(11,11,11,0.65)]">Ancienneté min. (mois)</label>
            <input
              type="number"
              value={minTenure}
              onChange={(e) => setMinTenure(e.target.value)}
              min={0}
              placeholder="Ex: 12"
              className="mt-1 w-24 rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[color:rgba(11,11,11,0.65)]">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Autres critères..."
              className="mt-1 w-full rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm"
              disabled={loading}
            />
          </div>
        </div>
      </details>
    </form>
  );
}

export function GrillesClient({ initialDepartmentsWithPaliers }: { initialDepartmentsWithPaliers: DepartmentWithPaliers[] }) {
  const router = useRouter();
  const [deptsWithPaliers, setDeptsWithPaliers] = useState(initialDepartmentsWithPaliers);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [paliersError, setPaliersError] = useState<string | null>(null);
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(initialDepartmentsWithPaliers[0]?.id ?? null);

  const departments = deptsWithPaliers.map(({ paliers, ...d }) => d);

  async function handleCreateDept(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setDeptsWithPaliers((prev) => [...prev, { ...data, paliers: [] }]);
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateDept(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setDeptsWithPaliers((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...data } : d))
      );
      setEditingId(null);
      setEditName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDept(id: string) {
    if (!confirm("Supprimer ce département ? Les paliers et talents rattachés seront concernés.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setDeptsWithPaliers((prev) => prev.filter((d) => d.id !== id));
      if (expandedDeptId === id) setExpandedDeptId(null);
      if (editingId === id) setEditingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(d: Department) {
    setEditingId(d.id);
    setEditName(d.name);
    setError(null);
  }

  async function handleCreatePalier(departmentId: string, palierData: { name: string; montant_annuel?: number; criteria?: Criteria }) {
    setLoading(true);
    setPaliersError(null);
    try {
      const dept = deptsWithPaliers.find((d) => d.id === departmentId);
      const order = dept?.paliers?.length ?? 0;
      const res = await fetch("/api/levels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department_id: departmentId,
          name: palierData.name.trim(),
          order,
          montant_annuel: palierData.montant_annuel ?? null,
          criteria: palierData.criteria ?? { objectives: [], competencies: [], min_tenure_months: null, notes: "" },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setDeptsWithPaliers((prev) =>
        prev.map((d) =>
          d.id === departmentId ? { ...d, paliers: [...(d.paliers ?? []), data] } : d
        )
      );
      router.refresh();
    } catch (err) {
      setPaliersError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePalier(departmentId: string, palierId: string) {
    if (!confirm("Supprimer ce palier ?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/levels/${palierId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setDeptsWithPaliers((prev) =>
        prev.map((d) =>
          d.id === departmentId ? { ...d, paliers: (d.paliers ?? []).filter((p) => p.id !== palierId) } : d
        )
      );
      router.refresh();
    } catch (err) {
      setPaliersError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Départements */}
      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">Départements & paliers</h2>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Ajoutez des départements, puis définissez pour chacun des paliers avec rémunération annuelle brute fixe et critères pour passer au palier suivant.
        </p>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <form onSubmit={handleCreateDept} className="space-y-4">
              {error && !editingId && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
              <div>
                <label htmlFor="dept-name" className="block text-sm font-medium text-[var(--text)]">
                  Nouveau département
                </label>
                <input
                  id="dept-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Engineering, Commercial"
                  className="mt-2 w-full rounded-xl border border-[#e2e7e2] bg-white px-4 py-3 text-[var(--text)] transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex cursor-pointer items-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "Création..." : "Ajouter département"}
              </button>
            </form>
          </div>
          <div>
            {departments.length === 0 ? (
              <p className="text-sm text-[color:rgba(11,11,11,0.65)]">Aucun département. Créez-en un ci-contre.</p>
            ) : (
              <ul className="space-y-2">
                {departments.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[#e2e7e2] bg-[#f8faf8] px-4 py-3"
                  >
                    {editingId === d.id ? (
                      <>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/20"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateDept(d.id)}
                          disabled={loading}
                          className="rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
                        >
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditName("");
                            setError(null);
                          }}
                          className="rounded-full border border-[#e2e7e2] px-3 py-1.5 text-xs font-medium hover:bg-[#f2f5f2]"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-[var(--text)]">{d.name}</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(d)}
                            disabled={loading}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--brand)] hover:bg-[var(--brand)]/10 disabled:opacity-50"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDept(d.id)}
                            disabled={loading}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Paliers par département */}
      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">Paliers par département</h2>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Cliquez sur un département pour gérer ses paliers : nom, rémunération annuelle brute, et critères (objectifs, compétences, ancienneté).
        </p>
        {paliersError && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{paliersError}</p>
        )}
        <div className="mt-6 space-y-3">
          {deptsWithPaliers.length === 0 ? (
            <p className="text-sm text-[color:rgba(11,11,11,0.65)]">Aucun département. Créez-en un dans la section ci-dessus.</p>
          ) : (
            deptsWithPaliers.map((dept) => (
              <div
                key={dept.id}
                className="overflow-hidden rounded-xl border border-[#e2e7e2] bg-[#f8faf8]"
              >
                <button
                  type="button"
                  onClick={() => setExpandedDeptId(expandedDeptId === dept.id ? null : dept.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#f2f5f2]"
                >
                  <span className="font-semibold text-[var(--text)]">{dept.name}</span>
                  <span className="text-xs text-[color:rgba(11,11,11,0.5)]">
                    {dept.paliers?.length ?? 0} palier{(dept.paliers?.length ?? 0) > 1 ? "s" : ""}
                  </span>
                </button>
                {expandedDeptId === dept.id && (
                  <div className="border-t border-[#e2e7e2] bg-white p-4">
                    <PalierForm onAdd={(data) => handleCreatePalier(dept.id, data)} loading={loading} />
                    <div className="mt-4 space-y-2">
                      {(dept.paliers ?? []).map((p) => (
                        <div
                          key={p.id}
                          className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-[#e2e7e2] bg-[#f8faf8] px-4 py-2 text-sm"
                        >
                          <div className="flex flex-wrap gap-4">
                            <span className="font-medium text-[var(--text)]">{p.name}</span>
                            <span className="text-[color:rgba(11,11,11,0.65)]">
                              {p.montant_annuel != null ? `${Number(p.montant_annuel).toLocaleString("fr-FR")} € brut / an` : "—"}
                            </span>
                            {p.criteria && (
                              <span className="text-xs text-[color:rgba(11,11,11,0.55)]">
                                {[
                                  (p.criteria.objectives?.length ?? 0) > 0 && `${p.criteria.objectives.length} objectif(s)`,
                                  (p.criteria.competencies?.length ?? 0) > 0 && `${p.criteria.competencies.length} compétence(s)`,
                                  p.criteria.min_tenure_months != null && `≥ ${p.criteria.min_tenure_months} mois`,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeletePalier(dept.id, p.id)}
                            disabled={loading}
                            className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Supprimer
                          </button>
                        </div>
                      ))}
                      {(!dept.paliers || dept.paliers.length === 0) && (
                        <p className="text-sm text-[color:rgba(11,11,11,0.5)]">Aucun palier. Ajoutez-en un avec le formulaire ci-dessus.</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDept(dept.id)}
                      disabled={loading}
                      className="mt-4 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      Supprimer ce département
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
