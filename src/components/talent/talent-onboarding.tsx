"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "leaft_talent_onboarding_v1_done";

type Props = {
  firstName: string;
};

export function TalentOnboarding({ firstName }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && !window.localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch { /* ignore */ }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="talent-onb-title">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Fermer" onClick={dismiss} />
      <div className="relative z-[81] w-full max-w-lg rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.15)] sm:p-8">
        <h2 id="talent-onb-title" className="text-xl font-semibold text-[var(--text)]">
          Bienvenue, {firstName}
        </h2>
        <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
          Voici un rapide repère pour t’orienter dans ton espace.
        </p>
        <ul className="mt-5 space-y-3 text-sm text-[var(--text)]">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/15 text-xs font-bold text-[var(--brand)]">1</span>
            <span>
              <strong>Rémunération & marché</strong> — ton salaire, le compa interne, et une estimation marché (Indeed / Glassdoor via HasData) avec une jauge de progression.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/15 text-xs font-bold text-[var(--brand)]">2</span>
            <span>
              <strong>Mes entretiens</strong> — historique, délais depuis le dernier / avant le prochain, et demandes de RDV.
              {" "}
              <button
                type="button"
                className="font-semibold text-[var(--brand)] underline decoration-[var(--brand)]/30 hover:decoration-[var(--brand)]"
                onClick={() => {
                  dismiss();
                  requestAnimationFrame(() => document.getElementById("talent-mes-entretiens")?.scrollIntoView({ behavior: "smooth", block: "start" }));
                }}
              >
                Aller à la section
              </button>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/15 text-xs font-bold text-[var(--brand)]">3</span>
            <span>
              <strong>Organigramme</strong> — vue complète, ton équipe ou ta chaîne hiérarchique.
              {" "}
              <Link href="/espace-talent/organigramme" className="font-semibold text-[var(--brand)] underline decoration-[var(--brand)]/30" onClick={dismiss}>
                Ouvrir l’organigramme
              </Link>
            </span>
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            C’est noté
          </button>
          <button type="button" onClick={dismiss} className="cursor-pointer rounded-full border border-[#e2e7e2] px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[#f8faf8]">
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
