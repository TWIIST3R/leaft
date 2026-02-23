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

type Avantage = {
  id: string;
  name: string;
  montant_annuel_brut: number;
  department_ids: string[];
  created_at: string;
};

type GrilleExtraItem = {
  id: string;
  department_id: string | null;
  name: string;
  details: string | null;
  montant_annuel: number | null;
  order: number;
  created_at: string;
};

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

  const [criteriaError, setCriteriaError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCriteriaError(null);
    const n = name.trim();
    if (!n) return;
    const objList = objectives.trim() ? objectives.split("\n").map((s) => s.trim()).filter(Boolean) : [];
    const compList = competencies.trim() ? competencies.split("\n").map((s) => s.trim()).filter(Boolean) : [];
    const tenure = minTenure ? Number(minTenure) : null;
    const notesVal = notes.trim() || undefined;
    const hasCriteria = objList.length > 0 || compList.length > 0 || tenure != null || notesVal;
    if (!hasCriteria) {
      setCriteriaError("Au moins un critère est requis (objectifs, compétences, ancienneté ou notes)");
      return;
    }
    onAdd({
      name: n,
      montant_annuel: montant ? Number(montant) : undefined,
      criteria: {
        objectives: objList,
        competencies: compList,
        min_tenure_months: tenure,
        notes: notesVal,
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
          className="cursor-pointer rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          Ajouter palier
        </button>
      </div>
      <div className="rounded-lg border border-[#e2e7e2] bg-[#f8faf8] px-3 py-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-[var(--text)]">Critères du palier (obligatoires)</span>
          <span className="text-xs text-[color:rgba(11,11,11,0.5)]">Aide IA à venir</span>
        </div>
        {criteriaError && (
          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{criteriaError}</p>
        )}
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
      </div>
    </form>
  );
}

function PalierEditForm({
  palier,
  onSave,
  onCancel,
  loading,
}: {
  palier: Palier;
  onSave: (data: { name: string; montant_annuel: number | null; criteria: NonNullable<Criteria> }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(palier.name);
  const [montant, setMontant] = useState(palier.montant_annuel != null ? String(palier.montant_annuel) : "");
  const [objectives, setObjectives] = useState((palier.criteria?.objectives ?? []).join("\n"));
  const [competencies, setCompetencies] = useState((palier.criteria?.competencies ?? []).join("\n"));
  const [minTenure, setMinTenure] = useState(palier.criteria?.min_tenure_months != null ? String(palier.criteria.min_tenure_months) : "");
  const [notes, setNotes] = useState(palier.criteria?.notes ?? "");
  const [criteriaError, setCriteriaError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCriteriaError(null);
    const n = name.trim();
    if (!n) return;
    const objList = objectives.trim() ? objectives.split("\n").map((s) => s.trim()).filter(Boolean) : [];
    const compList = competencies.trim() ? competencies.split("\n").map((s) => s.trim()).filter(Boolean) : [];
    const tenure = minTenure ? Number(minTenure) : null;
    const notesVal = notes.trim() || undefined;
    const hasCriteria = objList.length > 0 || compList.length > 0 || tenure != null || notesVal;
    if (!hasCriteria) {
      setCriteriaError("Au moins un critère est requis");
      return;
    }
    onSave({
      name: n,
      montant_annuel: montant ? Number(montant) : null,
      criteria: { objectives: objList, competencies: compList, min_tenure_months: tenure, notes: notesVal },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-[var(--brand)]/30 bg-[#f8faf8] p-4">
      <div className="flex flex-wrap items-end gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du palier"
          className="rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm w-44"
          disabled={loading}
          required
        />
        <input
          type="number"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          placeholder="Montant annuel brut (€)"
          min={0}
          step={100}
          className="rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm w-40"
          disabled={loading}
        />
        <button type="submit" disabled={loading} className="cursor-pointer rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50">
          Enregistrer
        </button>
        <button type="button" onClick={onCancel} disabled={loading} className="cursor-pointer rounded-full border border-[#e2e7e2] px-4 py-2 text-xs font-medium hover:bg-[#f2f5f2]">
          Annuler
        </button>
      </div>
      {criteriaError && <p className="text-xs text-red-600">{criteriaError}</p>}
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-[color:rgba(11,11,11,0.65)]">Objectifs (un par ligne)</label>
          <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm" disabled={loading} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[color:rgba(11,11,11,0.65)]">Compétences (une par ligne)</label>
          <textarea value={competencies} onChange={(e) => setCompetencies(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm" disabled={loading} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[color:rgba(11,11,11,0.65)]">Ancienneté min. (mois)</label>
          <input type="number" value={minTenure} onChange={(e) => setMinTenure(e.target.value)} min={0} className="mt-1 w-24 rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm" disabled={loading} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[color:rgba(11,11,11,0.65)]">Notes</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm" disabled={loading} />
        </div>
      </div>
    </form>
  );
}

function GrilleExtraSection({
  type,
  title,
  description,
  items,
  departments,
  loading,
  error,
  onAdd,
  onUpdate,
  onDelete,
  editingId,
  editingType,
  setEditing,
}: {
  type: "management" | "anciennete";
  title: string;
  description: string;
  items: GrilleExtraItem[];
  departments: Department[];
  loading: boolean;
  error: string | null;
  onAdd: (data: { name: string; details?: string; montant_annuel?: number; department_id?: string | null }) => void;
  onUpdate: (id: string, data: { name: string; details?: string | null; montant_annuel?: number | null; department_id?: string | null }) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  editingType: "management" | "anciennete";
  setEditing: (id: string | null, t: "management" | "anciennete") => void;
}) {
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [montant, setMontant] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      details: details.trim() || undefined,
      montant_annuel: montant ? Number(montant) : undefined,
      department_id: null,
    });
    setName("");
    setDetails("");
    setMontant("");
  };

  return (
    <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
      <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">{title}</h2>
      <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">{description}</p>
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <details className="mt-4 rounded-lg border border-[#e2e7e2] bg-[#f8faf8]">
        <summary className="cursor-pointer px-4 py-3 font-medium text-[var(--text)] hover:bg-[#f2f5f2]">+ Ajouter un palier</summary>
        <form onSubmit={handleSubmit} className="space-y-3 border-t border-[#e2e7e2] p-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom (ex. 1 à 3 personnes)" className="w-full rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm" disabled={loading} required />
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Détails" rows={2} className="w-full rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm" disabled={loading} />
          <input type="number" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="Montant annuel (€)" min={0} step={100} className="w-40 rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm" disabled={loading} />
          <button type="submit" disabled={loading} className="cursor-pointer rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50">Ajouter</button>
        </form>
      </details>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-[color:rgba(11,11,11,0.5)]">Aucun palier.</p>
        ) : (
          items.map((item) =>
            editingId === item.id && editingType === type ? (
              <GrilleExtraEditForm
                key={item.id}
                item={item}
                onSave={(data) => onUpdate(item.id, data)}
                onCancel={() => setEditing(null, type)}
                loading={loading}
              />
            ) : (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e2e7e2] bg-[#f8faf8] px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium text-[var(--text)]">{item.name}</span>
                  {item.details && <span className="text-sm text-[color:rgba(11,11,11,0.65)]">{item.details}</span>}
                  {item.montant_annuel != null && (
                    <span className="rounded-lg bg-[var(--brand)]/15 px-2.5 py-1 text-sm font-semibold text-[var(--brand)]">
                      {Number(item.montant_annuel).toLocaleString("fr-FR")} € / an
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setEditing(item.id, type)} disabled={loading} className="cursor-pointer rounded px-2 py-1 text-xs font-medium text-[var(--brand)] hover:bg-[var(--brand)]/10">Modifier</button>
                  <button type="button" onClick={() => onDelete(item.id)} disabled={loading} className="cursor-pointer rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Supprimer</button>
                </div>
              </div>
            )
          )
        )}
      </div>
    </section>
  );
}

function GrilleExtraEditForm({
  item,
  onSave,
  onCancel,
  loading,
}: {
  item: GrilleExtraItem;
  onSave: (data: { name: string; details?: string | null; montant_annuel?: number | null; department_id?: string | null }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(item.name);
  const [details, setDetails] = useState(item.details ?? "");
  const [montant, setMontant] = useState(item.montant_annuel != null ? String(item.montant_annuel) : "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({
          name: name.trim(),
          details: details.trim() || null,
          montant_annuel: montant ? Number(montant) : null,
          department_id: null,
        });
      }}
      className="space-y-3 rounded-xl border-2 border-[var(--brand)]/40 bg-[#f8faf8] p-4"
    >
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" className="w-full rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm" disabled={loading} required />
      <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Détails" rows={2} className="w-full rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm" disabled={loading} />
      <input type="number" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="Montant (€)" min={0} step={100} className="w-40 rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm" disabled={loading} />
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="cursor-pointer rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50">Enregistrer</button>
        <button type="button" onClick={onCancel} disabled={loading} className="cursor-pointer rounded-full border border-[#e2e7e2] px-4 py-2 text-xs font-medium hover:bg-[#f2f5f2]">Annuler</button>
      </div>
    </form>
  );
}

function AvantageEditRow({
  avantage,
  departments,
  onSave,
  onCancel,
  loading,
}: {
  avantage: Avantage;
  departments: Department[];
  onSave: (data: { name: string; montant_annuel_brut: number; department_ids: string[] }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(avantage.name);
  const [montant, setMontant] = useState(String(avantage.montant_annuel_brut));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(avantage.department_ids ?? []));

  const toggleDept = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = Number(montant);
    if (!name.trim() || isNaN(m) || m < 0) return;
    onSave({ name: name.trim(), montant_annuel_brut: m, department_ids: Array.from(selectedIds) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border-2 border-[var(--brand)]/40 bg-[#f8faf8] px-4 py-3">
      <div className="flex flex-wrap items-end gap-3">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" className="rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm w-44" disabled={loading} required />
        <input type="number" value={montant} onChange={(e) => setMontant(e.target.value)} min={0} step={100} className="w-32 rounded-lg border border-[#e2e7e2] px-3 py-2 text-sm" disabled={loading} required />
        <button type="submit" disabled={loading} className="cursor-pointer rounded-full bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50">Enregistrer</button>
        <button type="button" onClick={onCancel} disabled={loading} className="cursor-pointer rounded-full border border-[#e2e7e2] px-3 py-2 text-xs font-medium hover:bg-[#f2f5f2]">Annuler</button>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-[color:rgba(11,11,11,0.65)]">Départements concernés (cocher)</p>
        <div className="flex flex-wrap gap-3">
          {departments.map((d) => (
            <label key={d.id} className="flex cursor-pointer items-center gap-2 rounded-full border border-[#e2e7e2] bg-white px-3 py-1.5 text-sm hover:bg-[#f8faf8]">
              <input type="checkbox" checked={selectedIds.has(d.id)} onChange={() => toggleDept(d.id)} className="h-4 w-4 rounded border-[#e2e7e2] text-[var(--brand)]" />
              <span>{d.name}</span>
            </label>
          ))}
        </div>
      </div>
    </form>
  );
}

export function GrillesClient({
  initialDepartmentsWithPaliers,
  initialAvantages,
  initialManagement,
  initialAnciennete,
}: {
  initialDepartmentsWithPaliers: DepartmentWithPaliers[];
  initialAvantages: Avantage[];
  initialManagement: GrilleExtraItem[];
  initialAnciennete: GrilleExtraItem[];
}) {
  const router = useRouter();
  const [deptsWithPaliers, setDeptsWithPaliers] = useState(initialDepartmentsWithPaliers);
  const [avantages, setAvantages] = useState(initialAvantages);
  const [managementItems, setManagementItems] = useState(initialManagement);
  const [ancienneteItems, setAncienneteItems] = useState(initialAnciennete);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [paliersError, setPaliersError] = useState<string | null>(null);
  const [avantagesError, setAvantagesError] = useState<string | null>(null);
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(initialDepartmentsWithPaliers[0]?.id ?? null);
  const [avantageName, setAvantageName] = useState("");
  const [avantageMontant, setAvantageMontant] = useState("");
  const [avantageDepartmentIds, setAvantageDepartmentIds] = useState<string[]>([]);
  const [editingGrilleExtraId, setEditingGrilleExtraId] = useState<string | null>(null);
  const [editingGrilleExtraType, setEditingGrilleExtraType] = useState<"management" | "anciennete">("management");
  const [grilleExtraError, setGrilleExtraError] = useState<string | null>(null);
  const [expandedPalierKey, setExpandedPalierKey] = useState<string | null>(null);
  const [editingPalierId, setEditingPalierId] = useState<string | null>(null);
  const [editingAvantageId, setEditingAvantageId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"grilles" | "simulateur">("grilles");
  const [selectedPalierIds, setSelectedPalierIds] = useState<Set<string>>(new Set());
  const [selectedAvantageIds, setSelectedAvantageIds] = useState<Set<string>>(new Set());

  const departments = deptsWithPaliers.map(({ paliers, ...d }) => d);

  async function handleCreateGrilleExtra(type: "management" | "anciennete", data: { name: string; details?: string; montant_annuel?: number; department_id?: string | null }) {
    setLoading(true);
    setGrilleExtraError(null);
    try {
      const res = await fetch("/api/grille-extra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...data }),
      });
      const item = await res.json();
      if (!res.ok) throw new Error(item.error || "Erreur");
      if (type === "management") setManagementItems((prev) => [...prev, item]);
      else setAncienneteItems((prev) => [...prev, item]);
      router.refresh();
    } catch (err) {
      setGrilleExtraError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateGrilleExtra(id: string, data: { name: string; details?: string | null; montant_annuel?: number | null; department_id?: string | null }) {
    setLoading(true);
    setGrilleExtraError(null);
    try {
      const res = await fetch(`/api/grille-extra/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Erreur");
      setManagementItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setAncienneteItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setEditingGrilleExtraId(null);
      router.refresh();
    } catch (err) {
      setGrilleExtraError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteGrilleExtra(id: string) {
    if (!confirm("Supprimer cet élément ?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/grille-extra/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur");
      setManagementItems((prev) => prev.filter((i) => i.id !== id));
      setAncienneteItems((prev) => prev.filter((i) => i.id !== id));
      setEditingGrilleExtraId(null);
      router.refresh();
    } catch (err) {
      setGrilleExtraError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

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

  async function handleCreateAvantage(e: React.FormEvent) {
    e.preventDefault();
    setAvantagesError(null);
    const trimmed = avantageName.trim();
    if (!trimmed) return;
    const montant = Number(avantageMontant);
    if (isNaN(montant) || montant < 0) {
      setAvantagesError("Montant invalide");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/avantages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          montant_annuel_brut: montant,
          department_ids: avantageDepartmentIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setAvantages((prev) => [...prev, data]);
      setAvantageName("");
      setAvantageMontant("");
      setAvantageDepartmentIds([]);
      router.refresh();
    } catch (err) {
      setAvantagesError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAvantage(id: string) {
    if (!confirm("Supprimer cet avantage ?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/avantages/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setAvantages((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    } catch (err) {
      setAvantagesError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePalier(
    departmentId: string,
    palierId: string,
    data: { name: string; montant_annuel: number | null; criteria: NonNullable<Criteria> }
  ) {
    setLoading(true);
    setPaliersError(null);
    try {
      const res = await fetch(`/api/levels/${palierId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          montant_annuel: data.montant_annuel,
          criteria: data.criteria,
        }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Erreur");
      setDeptsWithPaliers((prev) =>
        prev.map((d) =>
          d.id === departmentId
            ? { ...d, paliers: (d.paliers ?? []).map((p) => (p.id === palierId ? { ...p, ...updated } : p)) }
            : d
        )
      );
      setEditingPalierId(null);
      router.refresh();
    } catch (err) {
      setPaliersError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateAvantage(id: string, data: { name: string; montant_annuel_brut: number; department_ids: string[] }) {
    setLoading(true);
    setAvantagesError(null);
    try {
      const res = await fetch(`/api/avantages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Erreur");
      setAvantages((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setEditingAvantageId(null);
      router.refresh();
    } catch (err) {
      setAvantagesError(err instanceof Error ? err.message : "Erreur");
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
      setExpandedPalierKey(null);
      setEditingPalierId(null);
      setSelectedPalierIds((s) => {
        const next = new Set(s);
        next.delete(palierId);
        return next;
      });
      router.refresh();
    } catch (err) {
      setPaliersError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  const allPaliers = deptsWithPaliers.flatMap((d) => (d.paliers ?? []).map((p) => ({ ...p, deptName: d.name })));
  const selectedPaliers = allPaliers.filter((p) => selectedPalierIds.has(p.id));
  const totalPaliersByDept = (() => {
    const byDept = new Map<string, number>();
    for (const p of selectedPaliers) {
      const current = byDept.get(p.department_id) ?? 0;
      const montant = p.montant_annuel ?? 0;
      if (montant > current) byDept.set(p.department_id, montant);
    }
    return Array.from(byDept.values()).reduce((s, m) => s + m, 0);
  })();
  const totalSimu =
    totalPaliersByDept +
    avantages.filter((a) => selectedAvantageIds.has(a.id)).reduce((s, a) => s + Number(a.montant_annuel_brut), 0);

  return (
    <div className="space-y-8">
      {/* Onglets */}
      <div className="flex gap-2 rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("grilles")}
          className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === "grilles" ? "bg-white text-[var(--text)] shadow" : "text-[color:rgba(11,11,11,0.65)] hover:bg-white/50"}`}
        >
          Grilles
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("simulateur")}
          className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === "simulateur" ? "bg-white text-[var(--text)] shadow" : "text-[color:rgba(11,11,11,0.65)] hover:bg-white/50"}`}
        >
          Simulateur
        </button>
      </div>

      {activeTab === "simulateur" ? (
        <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
          <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Simulateur de rémunération annuelle brute</h2>
          <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
            Cochez les paliers et avantages pour calculer le montant total annuel brut.
          </p>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">Paliers</h3>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {allPaliers.length === 0 ? (
                  <p className="text-sm text-[color:rgba(11,11,11,0.5)]">Aucun palier.</p>
                ) : (
                  allPaliers.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#e2e7e2] px-3 py-2 hover:bg-[#f8faf8]">
                      <input
                        type="checkbox"
                        checked={selectedPalierIds.has(p.id)}
                        onChange={(e) =>
                          setSelectedPalierIds((prev) => {
                            const next = new Set(prev);
                            const amount = p.montant_annuel ?? 0;
                            if (e.target.checked) {
                              allPaliers
                                .filter((q) => q.department_id === p.department_id && (q.montant_annuel ?? 0) <= amount)
                                .forEach((q) => next.add(q.id));
                            } else {
                              allPaliers
                                .filter((q) => q.department_id === p.department_id && (q.montant_annuel ?? 0) >= amount)
                                .forEach((q) => next.delete(q.id));
                            }
                            return next;
                          })
                        }
                        className="rounded border-[#e2e7e2]"
                      />
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-xs text-[color:rgba(11,11,11,0.65)]">({p.deptName})</span>
                      <span className="ml-auto text-sm text-[var(--brand)]">
                        {p.montant_annuel != null ? `${Number(p.montant_annuel).toLocaleString("fr-FR")} €` : "—"}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">Avantages en nature</h3>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {avantages.length === 0 ? (
                  <p className="text-sm text-[color:rgba(11,11,11,0.5)]">Aucun avantage.</p>
                ) : (
                  avantages.map((a) => (
                    <label key={a.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#e2e7e2] px-3 py-2 hover:bg-[#f8faf8]">
                      <input
                        type="checkbox"
                        checked={selectedAvantageIds.has(a.id)}
                        onChange={(e) =>
                          setSelectedAvantageIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(a.id);
                            else next.delete(a.id);
                            return next;
                          })
                        }
                        className="rounded border-[#e2e7e2]"
                      />
                      <span className="text-sm font-medium">{a.name}</span>
                      <span className="ml-auto text-sm text-[var(--brand)]">
                        {Number(a.montant_annuel_brut).toLocaleString("fr-FR")} €
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-xl border-2 border-[var(--brand)] bg-[var(--brand)]/10 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand)]">Total rémunération annuelle brute</p>
            <p className="mt-2 text-3xl font-bold text-[var(--text)]">{totalSimu.toLocaleString("fr-FR")} €</p>
          </div>
        </section>
      ) : (
        <>
      {/* Départements */}
      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Départements & paliers</h2>
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
                          className="cursor-pointer rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
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
                          className="cursor-pointer rounded-full border border-[#e2e7e2] px-3 py-1.5 text-xs font-medium hover:bg-[#f2f5f2]"
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
                            className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-[var(--brand)] hover:bg-[var(--brand)]/10 disabled:opacity-50"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDept(d.id)}
                            disabled={loading}
                            className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
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
        <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Paliers par département</h2>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Cliquez sur un département pour gérer ses paliers. Chaque palier requiert des critères (objectifs, compétences, ancienneté) pour définir les conditions d&apos;accès.
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
                  className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left hover:bg-[#f2f5f2]"
                >
                  <span className="font-semibold text-[var(--text)]">{dept.name}</span>
                  <span className="text-xs text-[color:rgba(11,11,11,0.5)]">
                    {dept.paliers?.length ?? 0} palier{(dept.paliers?.length ?? 0) > 1 ? "s" : ""}
                  </span>
                </button>
                {expandedDeptId === dept.id && (
                  <div className="border-t border-[#e2e7e2] bg-white p-4">
                    <div className="space-y-2">
                      {(dept.paliers ?? []).length === 0 ? (
                        <p className="text-sm text-[color:rgba(11,11,11,0.5)]">Aucun palier.</p>
                      ) : (
                        (dept.paliers ?? []).map((p) => {
                          const key = `${dept.id}_${p.id}`;
                          const isExpanded = expandedPalierKey === key;
                          const isEditing = editingPalierId === p.id;
                          return (
                            <div key={p.id} className="overflow-hidden rounded-lg border border-[#e2e7e2] bg-[#f8faf8]">
                              {isEditing ? (
                                <PalierEditForm
                                  palier={p}
                                  onSave={(data) => handleUpdatePalier(dept.id, p.id, data)}
                                  onCancel={() => setEditingPalierId(null)}
                                  loading={loading}
                                />
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedPalierKey(isExpanded ? null : key)}
                                    className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-[#f2f5f2]"
                                  >
                                    <div className="flex flex-wrap items-center gap-3">
                                      <span className="font-semibold text-[var(--text)]">{p.name}</span>
                                      <span className="rounded-lg bg-[var(--brand)]/15 px-2.5 py-1 text-sm font-semibold text-[var(--brand)]">
                                        {p.montant_annuel != null ? `${Number(p.montant_annuel).toLocaleString("fr-FR")} € brut / an` : "—"}
                                      </span>
                                      {p.criteria && (
                                        <span className="text-xs text-[color:rgba(11,11,11,0.55)]">
                                          {[
                                            (p.criteria.objectives?.length ?? 0) > 0 && `${p.criteria.objectives?.length ?? 0} objectif(s)`,
                                            (p.criteria.competencies?.length ?? 0) > 0 && `${p.criteria.competencies?.length ?? 0} compétence(s)`,
                                            p.criteria.min_tenure_months != null && `≥ ${p.criteria.min_tenure_months} mois`,
                                          ].filter(Boolean).join(" · ")}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-[color:rgba(11,11,11,0.5)]">{isExpanded ? "▼" : "▶"}</span>
                                  </button>
                                  {isExpanded && (
                                    <div className="border-t border-[#e2e7e2] bg-[#fafbfa] px-4 py-3 text-sm">
                                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Détails des critères</p>
                                      <div className="grid gap-2 sm:grid-cols-2">
                                        {(p.criteria?.objectives?.length ?? 0) > 0 && (
                                          <div>
                                            <span className="font-medium text-[color:rgba(11,11,11,0.65)]">Objectifs :</span>
                                            <ul className="mt-1 list-inside list-disc text-[var(--text)]">
                                              {p.criteria?.objectives?.map((o, i) => (
                                                <li key={i}>{o}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        {(p.criteria?.competencies?.length ?? 0) > 0 && (
                                          <div>
                                            <span className="font-medium text-[color:rgba(11,11,11,0.65)]">Compétences :</span>
                                            <ul className="mt-1 list-inside list-disc text-[var(--text)]">
                                              {p.criteria?.competencies?.map((c, i) => (
                                                <li key={i}>{c}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        {p.criteria?.min_tenure_months != null && (
                                          <p><span className="font-medium text-[color:rgba(11,11,11,0.65)]">Ancienneté min. :</span> {p.criteria.min_tenure_months} mois</p>
                                        )}
                                        {p.criteria?.notes && (
                                          <p><span className="font-medium text-[color:rgba(11,11,11,0.65)]">Notes :</span> {p.criteria.notes}</p>
                                        )}
                                      </div>
                                      <div className="mt-3 flex gap-2">
                                        <button type="button" onClick={() => setEditingPalierId(p.id)} disabled={loading} className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-[var(--brand)] hover:bg-[var(--brand)]/10">
                                          Modifier
                                        </button>
                                        <button type="button" onClick={() => handleDeletePalier(dept.id, p.id)} disabled={loading} className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                                          Supprimer
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <details className="mt-4 rounded-lg border border-[#e2e7e2] bg-[#f8faf8]">
                      <summary className="cursor-pointer px-4 py-3 font-medium text-[var(--text)] hover:bg-[#f2f5f2]">+ Ajouter un palier</summary>
                      <div className="border-t border-[#e2e7e2] p-4">
                        <PalierForm onAdd={(data) => handleCreatePalier(dept.id, data)} loading={loading} />
                      </div>
                    </details>
                    <button type="button" onClick={() => handleDeleteDept(dept.id)} disabled={loading} className="cursor-pointer mt-4 text-xs font-medium text-red-600 hover:underline disabled:opacity-50">
                      Supprimer ce département
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Avantages en nature */}
      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Avantages en nature</h2>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Voiture de fonction, ticket resto, abonnement gym, etc. Chaque avantage a un montant annuel brut et peut être rattaché à un ou plusieurs départements (cases à cocher).
        </p>
        {avantagesError && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{avantagesError}</p>
        )}
        <form onSubmit={handleCreateAvantage} className="mt-4 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <input
              type="text"
              value={avantageName}
              onChange={(e) => setAvantageName(e.target.value)}
              placeholder="Ex: Voiture de fonction"
              className="rounded-xl border border-[#e2e7e2] px-4 py-2.5 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
              disabled={loading}
              required
            />
            <input
              type="number"
              value={avantageMontant}
              onChange={(e) => setAvantageMontant(e.target.value)}
              placeholder="Montant annuel brut (€)"
              min={0}
              step={100}
              className="w-40 rounded-xl border border-[#e2e7e2] px-4 py-2.5 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
              disabled={loading}
              required
            />
            <button type="submit" disabled={loading} className="cursor-pointer rounded-full bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50">
              Ajouter
            </button>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-[color:rgba(11,11,11,0.65)]">Départements concernés (cocher, vide = tous)</p>
            <div className="flex flex-wrap gap-2">
              {departments.map((d) => (
                <label key={d.id} className="flex cursor-pointer items-center gap-2 rounded-full border border-[#e2e7e2] bg-white px-3 py-1.5 text-sm hover:bg-[#f8faf8]">
                  <input
                    type="checkbox"
                    checked={avantageDepartmentIds.includes(d.id)}
                    onChange={(e) => setAvantageDepartmentIds((prev) => (e.target.checked ? [...prev, d.id] : prev.filter((id) => id !== d.id)))}
                    className="h-4 w-4 rounded border-[#e2e7e2] text-[var(--brand)]"
                  />
                  <span>{d.name}</span>
                </label>
              ))}
            </div>
          </div>
        </form>
        <div className="mt-6 space-y-2">
          {avantages.length === 0 ? (
            <p className="text-sm text-[color:rgba(11,11,11,0.65)]">Aucun avantage en nature. Ajoutez-en un ci-dessus.</p>
          ) : (
            avantages.map((a) =>
              editingAvantageId === a.id ? (
                <AvantageEditRow
                  key={a.id}
                  avantage={a}
                  departments={departments}
                  onSave={(data) => handleUpdateAvantage(a.id, data)}
                  onCancel={() => setEditingAvantageId(null)}
                  loading={loading}
                />
              ) : (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e2e7e2] bg-[#f8faf8] px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-medium text-[var(--text)]">{a.name}</span>
                    <span className="rounded-lg bg-[var(--brand)]/15 px-2.5 py-1 text-sm font-semibold text-[var(--brand)]">
                      {Number(a.montant_annuel_brut).toLocaleString("fr-FR")} € brut / an
                    </span>
                    {(a.department_ids ?? []).length > 0 ? (
                      (a.department_ids ?? []).map((deptId) => (
                        <span key={deptId} className="rounded-full bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                          {departments.find((d) => d.id === deptId)?.name ?? deptId}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[color:rgba(11,11,11,0.5)]">Tous les départements</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setEditingAvantageId(a.id)} disabled={loading} className="cursor-pointer rounded px-2 py-1 text-xs font-medium text-[var(--brand)] hover:bg-[var(--brand)]/10">
                      Modifier
                    </button>
                    <button type="button" onClick={() => handleDeleteAvantage(a.id)} disabled={loading} className="cursor-pointer rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                      Supprimer
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </section>

      {/* Management */}
      <GrilleExtraSection
        type="management"
        title="Management"
        description="Paliers liés au management (ex. : manage 1 à 3 personnes). Nom, détails et rémunération par département."
        items={managementItems}
        departments={departments}
        loading={loading}
        error={grilleExtraError}
        onAdd={(data) => handleCreateGrilleExtra("management", data)}
        onUpdate={handleUpdateGrilleExtra}
        onDelete={handleDeleteGrilleExtra}
        editingId={editingGrilleExtraId}
        editingType={editingGrilleExtraType}
        setEditing={(id, type) => { setEditingGrilleExtraId(id); setEditingGrilleExtraType(type ?? "management"); }}
      />

      {/* Ancienneté */}
      <GrilleExtraSection
        type="anciennete"
        title="Ancienneté"
        description="Paliers liés à l'ancienneté (ex. : 0-2 ans, 2-5 ans) avec détails et rémunération par département."
        items={ancienneteItems}
        departments={departments}
        loading={loading}
        error={grilleExtraError}
        onAdd={(data) => handleCreateGrilleExtra("anciennete", data)}
        onUpdate={handleUpdateGrilleExtra}
        onDelete={handleDeleteGrilleExtra}
        editingId={editingGrilleExtraId}
        editingType={editingGrilleExtraType}
        setEditing={(id, type) => { setEditingGrilleExtraId(id); setEditingGrilleExtraType(type ?? "anciennete"); }}
      />
        </>
      )}
    </div>
  );
}
