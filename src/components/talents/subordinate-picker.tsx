"use client";

import { useMemo, useState } from "react";

export type SubordinateCandidate = {
  id: string;
  first_name: string;
  last_name: string;
  current_job_title?: string | null;
};

export function SubordinatePicker({
  candidates,
  selectedIds,
  onChange,
  disabled = false,
}: {
  candidates: SubordinateCandidate[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) =>
      `${c.first_name} ${c.last_name} ${c.current_job_title ?? ""}`.toLowerCase().includes(q)
    );
  }, [candidates, search]);

  function toggle(id: string) {
    if (disabled) return;
    if (selected.has(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Talents managés</p>
          <p className="mt-0.5 text-xs text-[color:rgba(11,11,11,0.55)]">
            Cochez les talents dont ce manager est responsable.
          </p>
        </div>
        <span className="rounded-full bg-[var(--brand)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--brand)]">
          {selectedIds.length} sélectionné{selectedIds.length > 1 ? "s" : ""}
        </span>
      </div>

      {candidates.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-[#e2e7e2] bg-white px-3 py-4 text-center text-xs text-[color:rgba(11,11,11,0.55)]">
          Aucun talent disponible. Seuls les talents sans manager peuvent être rattachés ici.
        </p>
      ) : (
        <>
          {candidates.length > 6 && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={disabled}
              placeholder="Rechercher un talent…"
              className="mt-3 w-full cursor-text rounded-xl border border-[#e2e7e2] bg-white px-3 py-2 text-sm text-[var(--text)] shadow-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 disabled:opacity-50"
            />
          )}
          <div className="mt-3 grid max-h-60 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
            {filtered.map((c) => {
              const isChecked = selected.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  disabled={disabled}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isChecked
                      ? "border-[var(--brand)] bg-[var(--brand)]/10"
                      : "border-[#e2e7e2] bg-white hover:border-[var(--brand)]/40 hover:bg-[var(--brand)]/[0.04]"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition ${
                      isChecked ? "border-[var(--brand)] bg-[var(--brand)]" : "border-[#cfcfcf] bg-white"
                    }`}
                  >
                    {isChecked && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[var(--text)]">
                      {c.first_name} {c.last_name}
                    </span>
                    {c.current_job_title && (
                      <span className="block truncate text-[11px] text-[color:rgba(11,11,11,0.5)]">
                        {c.current_job_title}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-full py-3 text-center text-xs text-[color:rgba(11,11,11,0.5)]">
                Aucun résultat pour « {search} ».
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
