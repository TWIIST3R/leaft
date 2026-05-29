"use client";

import { useEffect, useRef, useState } from "react";

export function SearchKeywordsInfo({
  keywords,
  referenceTitle,
  location,
  fetchedAt,
  onDarkHeader = false,
}: {
  keywords: string[];
  referenceTitle?: string | null;
  location?: string | null;
  fetchedAt?: string | null;
  onDarkHeader?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const list = keywords.length > 0 ? keywords : referenceTitle ? [referenceTitle] : [];

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border text-xs font-bold shadow-sm transition ${
          onDarkHeader
            ? "border-white/40 bg-white/15 text-white hover:bg-white/25"
            : "border-[#c5ccc5] bg-white text-[var(--brand)] hover:border-[var(--brand)]/40 hover:bg-[var(--brand)]/5"
        }`}
        aria-label="Intitulés de recherche utilisés"
        title="Intitulés de recherche utilisés"
      >
        i
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-[#e2e7e2] bg-white p-3 shadow-lg sm:left-auto sm:right-0">
          <p className="text-xs font-semibold text-[var(--text)]">Intitulés recherchés (Indeed & Glassdoor)</p>
          <p className="mt-1 text-[11px] text-[color:rgba(11,11,11,0.55)]">
            Zone : {location || "France"}
            {fetchedAt ? ` · ${new Date(fetchedAt).toLocaleDateString("fr-FR")}` : ""}
          </p>
          {list.length === 0 ? (
            <p className="mt-2 text-xs text-[color:rgba(11,11,11,0.5)]">
              Aucun intitulé enregistré pour cette mise à jour. Rechargez la page après la prochaine synchronisation.
            </p>
          ) : (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-[var(--text)]">
              {list.map((kw) => (
                <li key={kw} className="rounded-lg bg-[#f8faf8] px-2 py-1.5">
                  « {kw} »
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
