"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** Nouvelle clé = nouveau parcours (les anciens `leaft_talent_onboarding_v1_done` ne bloquent plus). */
export const TALENT_TOUR_STORAGE_KEY = "leaft_talent_guided_tour_v2_done";

type TourStep = "intro" | "hero" | "feature" | "rdv_hint" | "rdv_modal" | "outro";

type Props = {
  firstName: string;
  salaryVisible: boolean;
  /** null = chargement ; false = pas d’abonnement (on adapte l’étape RDV). */
  subscriptionActive: boolean | null;
  rdvModalOpen: boolean;
};

function readTourDone(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage.getItem(TALENT_TOUR_STORAGE_KEY);
  } catch {
    return false;
  }
}

function setTourDone() {
  try {
    window.localStorage.setItem(TALENT_TOUR_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

function clearTourDone() {
  try {
    window.localStorage.removeItem(TALENT_TOUR_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function stripReplayQuery() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.get("tour") === "replay" || url.searchParams.get("tour") === "1") {
    url.searchParams.delete("tour");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }
}

type Rect = { top: number; left: number; width: number; height: number };

function measure(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 && r.height < 2) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/** Masque autour d’un rectangle : clics bloqués sauf sur la zone mise en avant. */
function BlockoutExcept({ rect, pad }: { rect: Rect; pad: number }) {
  const t = rect.top - pad;
  const l = rect.left - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;
  const bg = "rgba(0,0,0,0.5)";
  return (
    <>
      <div className="pointer-events-auto fixed inset-x-0 top-0 z-[94]" style={{ height: Math.max(0, t), background: bg }} />
      <div className="pointer-events-auto fixed left-0 z-[94]" style={{ top: t, width: Math.max(0, l), height: h, background: bg }} />
      <div className="pointer-events-auto fixed z-[94]" style={{ top: t, left: l + w, right: 0, height: h, background: bg }} />
      <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-[94]" style={{ top: t + h, background: bg }} />
    </>
  );
}

export function TalentOnboarding({ firstName, salaryVisible, subscriptionActive, rdvModalOpen }: Props) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState<TourStep>("intro");
  const [hole, setHole] = useState<Rect | null>(null);
  const rdvModalWasOpenedRef = useRef(false);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const force = url.searchParams.get("tour") === "replay" || url.searchParams.get("tour") === "1";
      if (force) {
        clearTourDone();
        stripReplayQuery();
        setActive(true);
        setStep("intro");
        return;
      }
      if (!readTourDone()) setActive(true);
    } catch {
      setActive(true);
    }
  }, []);

  const dismissAll = useCallback(() => {
    setTourDone();
    setActive(false);
  }, []);

  const goStep = useCallback((s: TourStep) => {
    setStep(s);
    requestAnimationFrame(() => {
      if (s === "hero") {
        document.querySelector('[data-tour="talent-welcome"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (s === "feature") {
        const sel = salaryVisible ? '[data-tour="talent-remuneration"]' : '[data-tour="talent-entretiens"]';
        document.querySelector(sel)?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (s === "rdv_hint") {
        document.querySelector('[data-tour="talent-entretiens"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }, [salaryVisible]);

  useLayoutEffect(() => {
    if (!active) return;

    const updateHole = () => {
      if (step === "intro" || step === "outro") {
        setHole(null);
        return;
      }
      if (step === "hero") {
        setHole(measure('[data-tour="talent-welcome"]'));
        return;
      }
      if (step === "feature") {
        const sel = salaryVisible ? '[data-tour="talent-remuneration"]' : '[data-tour="talent-entretiens"]';
        setHole(measure(sel));
        return;
      }
      if (step === "rdv_hint") {
        setHole(measure("#talent-tour-rdv-btn") || measure('[data-tour="talent-entretiens"]'));
        return;
      }
      if (step === "rdv_modal") {
        setHole(measure("#talent-tour-rdv-panel") || measure("#talent-tour-rdv-cancel"));
        return;
      }
      setHole(null);
    };

    updateHole();
    window.addEventListener("scroll", updateHole, true);
    window.addEventListener("resize", updateHole);
    const id = window.setInterval(updateHole, 400);
    return () => {
      window.removeEventListener("scroll", updateHole, true);
      window.removeEventListener("resize", updateHole);
      window.clearInterval(id);
    };
  }, [active, step, salaryVisible, rdvModalOpen]);

  useEffect(() => {
    if (step !== "rdv_modal") {
      rdvModalWasOpenedRef.current = false;
      return;
    }
    if (rdvModalOpen) rdvModalWasOpenedRef.current = true;
  }, [step, rdvModalOpen]);

  useEffect(() => {
    if (!active || step !== "rdv_modal") return;
    if (rdvModalWasOpenedRef.current && !rdvModalOpen) goStep("outro");
  }, [active, step, rdvModalOpen, goStep]);

  useEffect(() => {
    if (!active || step !== "rdv_hint") return;
    if (subscriptionActive === false) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("#talent-tour-rdv-btn")) {
        goStep("rdv_modal");
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active, step, subscriptionActive, goStep]);

  useEffect(() => {
    if (!active || step !== "rdv_modal") return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("#talent-tour-rdv-cancel")) {
        goStep("outro");
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active, step, goStep]);

  if (!active) return null;

  const pad = 10;
  const ringStyle = hole
    ? {
        top: hole.top - pad,
        left: hole.left - pad,
        width: hole.width + pad * 2,
        height: hole.height + pad * 2,
        borderRadius: 16,
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.52)",
      }
    : null;

  const showBlockout = hole && (step === "hero" || step === "feature" || step === "rdv_hint");

  return (
    <div className="fixed inset-0 z-[95]" aria-live="polite">
      {showBlockout && hole && <BlockoutExcept rect={hole} pad={pad} />}

      {step !== "intro" && step !== "outro" && ringStyle && (
        <div
          className="pointer-events-none fixed z-[96] transition-[top,left,width,height] duration-300 ease-out"
          style={ringStyle}
        />
      )}

      {step === "intro" && (
        <div className="absolute inset-0 z-[97] flex items-end justify-center bg-black/45 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="talent-tour-intro-title">
          <div className="relative w-full max-w-md rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-8">
            <h2 id="talent-tour-intro-title" className="text-xl font-semibold text-[var(--text)]">
              Bienvenue sur ton espace, {firstName}
            </h2>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
              En 4 étapes rapides, on te montre où retrouver l’essentiel : ton profil, ta rémunération / entretiens, comment demander un rendez-vous, et où aller ensuite.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => goStep("hero")}
                className="cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Commencer le parcours
              </button>
              <button type="button" onClick={dismissAll} className="cursor-pointer text-sm font-medium text-[color:rgba(11,11,11,0.55)] underline decoration-[#cfcfcf] underline-offset-2 hover:text-[var(--text)]">
                Passer le tutoriel
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "hero" && (
        <div className="pointer-events-none absolute inset-0 z-[97] flex flex-col items-center justify-end p-4 pb-[min(22vh,180px)] sm:justify-center sm:pb-8">
          <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-[#e2e7e2] bg-white p-5 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">Étape 1 / 4</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text)]">Ton tableau de bord personnel</p>
            <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
              Poste, département, niveau, manager, localisation : tout est regroupé ici. Tu peux aussi mettre à jour ta photo (survole l’avatar puis clique sur le crayon).
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => goStep("feature")} className="cursor-pointer rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
                Suivant
              </button>
              <button type="button" onClick={dismissAll} className="cursor-pointer rounded-full border border-[#e2e7e2] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[#f8faf8]">
                Passer le tutoriel
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "feature" && (
        <div className="pointer-events-none absolute inset-0 z-[97] flex flex-col items-center justify-end p-4 pb-[min(22vh,180px)] sm:justify-center sm:pb-8">
          <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-[#e2e7e2] bg-white p-5 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">Étape 2 / 4</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text)]">
              {salaryVisible ? "Rémunération & comparatifs" : "Mes entretiens"}
            </p>
            <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
              {salaryVisible
                ? "Salaire, compa interne, marché offres (HasData) et repère Insee : tout est dans ce bloc. Si ton entreprise masque les salaires, tu ne verras pas cette section."
                : "Historique des entretiens, raccourcis vers le dernier / le prochain, et demandes de rendez-vous : c’est le cœur du suivi RH côté talent."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => goStep("rdv_hint")} className="cursor-pointer rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
                Suivant
              </button>
              <button type="button" onClick={dismissAll} className="cursor-pointer rounded-full border border-[#e2e7e2] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[#f8faf8]">
                Passer le tutoriel
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "rdv_hint" && (
        <div className="pointer-events-none absolute inset-0 z-[97] flex flex-col items-center justify-end p-4 pb-[min(26vh,200px)] sm:justify-center sm:pb-8">
          <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-[#e2e7e2] bg-white p-5 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">Étape 3 / 4</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text)]">Demander un rendez-vous</p>
            {subscriptionActive === false ? (
              <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
                L’abonnement de ton organisation n’est pas actif : le bouton de demande de RDV est désactivé. Tu peux passer à la dernière étape.
              </p>
            ) : (
              <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
                <strong className="text-[var(--text)]">Clique sur le bouton « Demander un RDV »</strong> ci-dessus (encadré vert). Le formulaire s’ouvre : tu pourras le fermer avec « Annuler » sans rien envoyer.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {subscriptionActive === false && (
                <button type="button" onClick={() => goStep("outro")} className="cursor-pointer rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
                  Suivant
                </button>
              )}
              <button type="button" onClick={dismissAll} className="cursor-pointer rounded-full border border-[#e2e7e2] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[#f8faf8]">
                Passer le tutoriel
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "rdv_modal" && rdvModalOpen && (
        <>
          <div className="pointer-events-none fixed inset-0 z-[96] bg-black/25" aria-hidden />
          <div className="pointer-events-auto fixed right-4 top-20 z-[98] w-[min(100%-2rem,22rem)] rounded-2xl border border-[var(--brand)]/25 bg-white p-4 shadow-xl sm:right-8 sm:top-24 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">Étape 3 / 4 — formulaire</p>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.75)]">
              Tu peux parcourir le formulaire. Pour continuer le tutoriel, <strong>clique sur « Annuler »</strong> pour fermer sans envoyer ta demande.
            </p>
            <button type="button" onClick={dismissAll} className="mt-3 text-sm font-medium text-[color:rgba(11,11,11,0.5)] underline">
              Passer le tutoriel
            </button>
          </div>
        </>
      )}

      {step === "outro" && (
        <div className="absolute inset-0 z-[97] flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="talent-tour-outro-title">
          <div className="relative w-full max-w-md rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-8">
            <h2 id="talent-tour-outro-title" className="text-lg font-semibold text-[var(--text)]">
              Étape 4 / 4 — Pour aller plus loin
            </h2>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
              Dans le menu (à gauche sur grand écran, sous l’en-tête sur mobile), ouvre le <strong>Simulateur</strong> pour projeter une évolution de salaire, et l’<strong>Organigramme</strong> pour visualiser la structure.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={dismissAll} className="cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
                Terminer le tutoriel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
