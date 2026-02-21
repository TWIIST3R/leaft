"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Department = { id: string; name: string; created_at: string };
type Level = { id: string; job_family_id: string; name: string; order: number; min_salary: number | null; mid_salary: number | null; max_salary: number | null; expectations: string | null };
type JobFamily = { id: string; name: string; created_at: string; levels: Level[] };

function LevelForm({
  onAdd,
  loading,
}: {
  onAdd: (data: { name: string; min_salary?: number; mid_salary?: number; max_salary?: number }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [midSalary, setMidSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    onAdd({
      name: n,
      min_salary: minSalary ? Number(minSalary) : undefined,
      mid_salary: midSalary ? Number(midSalary) : undefined,
      max_salary: maxSalary ? Number(maxSalary) : undefined,
    });
    setName("");
    setMinSalary("");
    setMidSalary("");
    setMaxSalary("");
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom du niveau (ex: Junior, Senior)"
        className="rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/20 w-44"
        disabled={loading}
      />
      <input
        type="number"
        value={minSalary}
        onChange={(e) => setMinSalary(e.target.value)}
        placeholder="Min (€)"
        min={0}
        step={100}
        className="rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm w-24 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/20"
        disabled={loading}
      />
      <input
        type="number"
        value={midSalary}
        onChange={(e) => setMidSalary(e.target.value)}
        placeholder="Mid (€)"
        min={0}
        step={100}
        className="rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm w-24 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/20"
        disabled={loading}
      />
      <input
        type="number"
        value={maxSalary}
        onChange={(e) => setMaxSalary(e.target.value)}
        placeholder="Max (€)"
        min={0}
        step={100}
        className="rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm w-24 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/20"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
      >
        Ajouter niveau
      </button>
    </form>
  );
}

export function GrillesClient({ initialDepartments, initialJobFamilies }: { initialDepartments: Department[]; initialJobFamilies: JobFamily[] }) {
  const router = useRouter();
  const [departments, setDepartments] = useState(initialDepartments);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [jobFamilies, setJobFamilies] = useState(initialJobFamilies);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [familyError, setFamilyError] = useState<string | null>(null);
  const [expandedFamily, setExpandedFamily] = useState<string | null>(initialJobFamilies[0]?.id ?? null);

  async function handleCreate(e: React.FormEvent) {
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
      setDepartments((prev) => [...prev, data]);
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(id: string) {
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
      setDepartments((prev) => prev.map((d) => (d.id === id ? data : d)));
      setEditingId(null);
      setEditName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce département ? Les talents rattachés devront être réaffectés.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setDepartments((prev) => prev.filter((d) => d.id !== id));
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

  async function handleCreateFamily(e: React.FormEvent) {
    e.preventDefault();
    setFamilyError(null);
    const trimmed = newFamilyName.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await fetch("/api/job-families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setJobFamilies((prev) => [...prev, data]);
      setNewFamilyName("");
      setExpandedFamily(data.id);
      router.refresh();
    } catch (err) {
      setFamilyError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteFamily(id: string) {
    if (!confirm("Supprimer cette famille de métiers et tous ses niveaux ?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/job-families/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setJobFamilies((prev) => prev.filter((f) => f.id !== id));
      if (expandedFamily === id) setExpandedFamily(null);
      router.refresh();
    } catch (err) {
      setFamilyError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLevel(jobFamilyId: string, levelData: { name: string; min_salary?: number; mid_salary?: number; max_salary?: number }) {
    setLoading(true);
    setFamilyError(null);
    try {
      const res = await fetch("/api/levels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_family_id: jobFamilyId,
          name: levelData.name.trim(),
          order: jobFamilies.find((f) => f.id === jobFamilyId)?.levels?.length ?? 0,
          min_salary: levelData.min_salary ?? null,
          mid_salary: levelData.mid_salary ?? null,
          max_salary: levelData.max_salary ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setJobFamilies((prev) =>
        prev.map((f) => (f.id === jobFamilyId ? { ...f, levels: [...(f.levels ?? []), data] } : f))
      );
      router.refresh();
    } catch (err) {
      setFamilyError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteLevel(jobFamilyId: string, levelId: string) {
    if (!confirm("Supprimer ce niveau ?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/levels/${levelId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setJobFamilies((prev) =>
        prev.map((f) => (f.id === jobFamilyId ? { ...f, levels: (f.levels ?? []).filter((l) => l.id !== levelId) } : f))
      );
      router.refresh();
    } catch (err) {
      setFamilyError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Départements */}
      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">Départements</h2>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Ajoutez, modifiez ou supprimez les départements. Ils servent à organiser les grilles et les talents.
        </p>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <form onSubmit={handleCreate} className="space-y-4">
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
                  placeholder="Ex: Engineering"
                  className="mt-2 w-full rounded-xl border border-[#e2e7e2] bg-white px-4 py-3 text-[var(--text)] transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex cursor-pointer items-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "Création..." : "Ajouter"}
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
                          onClick={() => handleUpdate(d.id)}
                          disabled={loading}
                          className="rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
                        >
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingId(null); setEditName(""); setError(null); }}
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
                            onClick={() => handleDelete(d.id)}
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

      {/* Grilles par famille de métiers */}
      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">Grilles par famille de métiers</h2>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Créez des familles de métiers (ex: Ingénierie, Commercial) puis définissez les niveaux avec leurs fourchettes salariales (min / mid / max).
        </p>
        {familyError && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{familyError}</p>
        )}
        <form onSubmit={handleCreateFamily} className="mt-4 flex flex-wrap gap-3">
          <input
            type="text"
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
            placeholder="Ex: Ingénierie"
            className="rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex cursor-pointer items-center rounded-full bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            Ajouter une famille
          </button>
        </form>
        <div className="mt-6 space-y-3">
          {jobFamilies.length === 0 ? (
            <p className="text-sm text-[color:rgba(11,11,11,0.65)]">Aucune famille de métiers. Créez-en une ci-dessus.</p>
          ) : (
            jobFamilies.map((family) => (
              <div
                key={family.id}
                className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFamily(expandedFamily === family.id ? null : family.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#f2f5f2]"
                >
                  <span className="font-semibold text-[var(--text)]">{family.name}</span>
                  <span className="text-xs text-[color:rgba(11,11,11,0.5)]">
                    {family.levels?.length ?? 0} niveau{(family.levels?.length ?? 0) > 1 ? "x" : ""}
                  </span>
                </button>
                {expandedFamily === family.id && (
                  <div className="border-t border-[#e2e7e2] bg-white p-4">
                    <LevelForm onAdd={(data) => handleCreateLevel(family.id, data)} loading={loading} />
                    <div className="mt-4 space-y-2">
                      {(family.levels ?? []).map((l) => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between rounded-lg border border-[#e2e7e2] bg-[#f8faf8] px-4 py-2 text-sm"
                        >
                          <div className="flex flex-wrap gap-4">
                            <span className="font-medium text-[var(--text)]">{l.name}</span>
                            <span className="text-[color:rgba(11,11,11,0.65)]">
                              Min {l.min_salary != null ? `${Number(l.min_salary).toLocaleString("fr-FR")} €` : "—"} / Mid{" "}
                              {l.mid_salary != null ? `${Number(l.mid_salary).toLocaleString("fr-FR")} €` : "—"} / Max{" "}
                              {l.max_salary != null ? `${Number(l.max_salary).toLocaleString("fr-FR")} €` : "—"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteLevel(family.id, l.id)}
                            disabled={loading}
                            className="text-xs font-medium text-red-600 hover:bg-red-50 rounded px-2 py-1 disabled:opacity-50"
                          >
                            Supprimer
                          </button>
                        </div>
                      ))}
                      {(!family.levels || family.levels.length === 0) && (
                        <p className="text-sm text-[color:rgba(11,11,11,0.5)]">Aucun niveau. Ajoutez-en un avec le formulaire ci-dessus.</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFamily(family.id)}
                      disabled={loading}
                      className="mt-4 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      Supprimer cette famille de métiers
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
