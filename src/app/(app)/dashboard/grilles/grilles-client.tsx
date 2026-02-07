"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Department = { id: string; name: string; created_at: string };

export function GrillesClient({ initialDepartments }: { initialDepartments: Department[] }) {
  const router = useRouter();
  const [departments, setDepartments] = useState(initialDepartments);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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

      {/* Grilles par famille de métiers / niveau (à venir) */}
      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">Grilles par famille de métiers</h2>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Définissez les niveaux et fourchettes salariales (min / mid / max) par famille de métiers et par département. Bientôt disponible.
        </p>
        <div className="mt-4 rounded-xl border border-dashed border-[#e2e7e2] bg-[#f8faf8] p-8 text-center text-sm text-[color:rgba(11,11,11,0.6)]">
          Création des grilles salariales (familles de métiers, niveaux, fourchettes) à venir.
        </div>
      </section>
    </div>
  );
}
