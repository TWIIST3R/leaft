"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export const TALENT_TOUR_STORAGE_KEY = "leaft_talent_guided_tour_v4_done";

type TourStep =
  | "intro"
  | "hero"
  | "remuneration"
  | "comparatif"
  | "entretiens"
  | "progression"
  | "rdv_hint"
  | "rdv_modal"
  | "outro";

type Props = {
  firstName: string;
  salaryVisible: boolean;
  hasProgression: boolean;
  subscriptionActive: boolean | null;
  rdvModalOpen: boolean;
  onTourOpenRdv: () => void;
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
    window.localStorage.removeItem("leaft_talent_guided_tour_v2_done");
    window.localStorage.removeItem("leaft_talent_guided_tour_v3_done");
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

const STEP_SELECTOR: Record<string, string> = {
  hero: '[data-tour="talent-welcome"]',
  remuneration: '[data-tour="talent-remuneration-stats"]',
  comparatif: '[data-tour="talent-nav-comparatif"]',
  entretiens: '[data-tour="talent-entretiens"]',
  progression: '[data-tour="talent-progression"]',
};

function scrollToStep(step: TourStep) {
  const sel = STEP_SELECTOR[step];
  if (sel) document.querySelector(sel)?.scrollIntoView({ behavior: "smooth", block: "center" });
  if (step === "rdv_hint") {
    document.querySelector('[data-tour="talent-entretiens"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function Popover({
  stepLabel,
  title,
  body,
  onNext,
  onSkip,
  nextLabel = "Suivant",
  showNext = true,
}: {
  stepLabel: string;
  title: string;
  body: string;
  onNext?: () => void;
  onSkip: () => void;
  nextLabel?: string;
  showNext?: boolean;
}) {
  return (
    <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-[#e2e7e2] bg-white p-5 shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">{stepLabel}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--text)]">{title}</p>
      <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">{body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {showNext && onNext && (
          <button
            type="button"
            onClick={onNext}
            className="cursor-pointer rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {nextLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onSkip}
          className="cursor-pointer rounded-full border border-[#e2e7e2] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[#f8faf8]"
        >
          Passer le tutoriel
        </button>
      </div>
    </div>
  );
}

export function TalentOnboarding({
  firstName,
  salaryVisible,
  hasProgression,
  subscriptionActive,
  rdvModalOpen,
  onTourOpenRdv,
}: Props) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState<TourStep>("intro");
  const [hole, setHole] = useState<Rect | null>(null);
  const rdvModalWasOpenedRef = useRef(false);

  const totalSteps = salaryVisible ? (hasProgression ? 7 : 6) : hasProgression ? 5 : 4;

  const stepIndex = (() => {
    const order: TourStep[] = salaryVisible
      ? hasProgression
        ? ["intro", "hero", "remuneration", "comparatif", "entretiens", "progression", "rdv_hint", "outro"]
        : ["intro", "hero", "remuneration", "comparatif", "entretiens", "rdv_hint", "outro"]
      : hasProgression
        ? ["intro", "hero", "entretiens", "progression", "rdv_hint", "outro"]
        : ["intro", "hero", "entretiens", "rdv_hint", "outro"];
    const i = order.indexOf(step === "rdv_modal" ? "rdv_hint" : step);
    return Math.max(1, i);
  })();

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
    requestAnimationFrame(() => scrollToStep(s));
  }, []);

  const afterHero = useCallback(() => {
    goStep(salaryVisible ? "remuneration" : "entretiens");
  }, [salaryVisible, goStep]);

  const afterRemuneration = useCallback(() => goStep("comparatif"), [goStep]);
  const afterComparatif = useCallback(() => goStep("entretiens"), [goStep]);

  const afterEntretiens = useCallback(() => {
    goStep(hasProgression ? "progression" : "rdv_hint");
  }, [hasProgression, goStep]);

  const afterProgression = useCallback(() => goStep("rdv_hint"), [goStep]);

  useLayoutEffect(() => {
    if (!active) return;

    const update = () => {
      if (step === "intro" || step === "outro") {
        setHole(null);
        return;
      }
      if (step === "rdv_hint") {
        setHole(measure("#talent-tour-rdv-btn"));
        return;
      }
      if (step === "rdv_modal") {
        setHole(measure("#talent-tour-rdv-panel") || measure("#talent-tour-rdv-cancel"));
        return;
      }
      const sel = STEP_SELECTOR[step];
      setHole(sel ? measure(sel) : null);
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const id = window.setInterval(update, 350);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      window.clearInterval(id);
    };
  }, [active, step]);

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
    const btn = document.getElementById("talent-tour-rdv-btn");
    if (!btn) return;
    if (active && step === "rdv_hint") {
      btn.style.position = "relative";
      btn.style.zIndex = "99";
    } else {
      btn.style.position = "";
      btn.style.zIndex = "";
    }
  }, [active, step]);

  useEffect(() => {
    if (!active || step !== "rdv_hint" || subscriptionActive === false) return;
    const btn = document.getElementById("talent-tour-rdv-btn");
    if (!btn) return;
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      onTourOpenRdv();
      goStep("rdv_modal");
    };
    btn.addEventListener("click", handler, true);
    return () => btn.removeEventListener("click", handler, true);
  }, [active, step, subscriptionActive, onTourOpenRdv, goStep]);

  useEffect(() => {
    if (!active || step !== "rdv_modal") return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("#talent-tour-rdv-cancel")) goStep("outro");
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
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

  const showBlockout = hole && step !== "intro" && step !== "outro" && step !== "rdv_hint" && step !== "rdv_modal";
  const showRing = hole && step !== "intro" && step !== "outro";
  const label = (n: number) => `Étape ${n} / ${totalSteps}`;

  return (
    <div className="fixed inset-0 z-[95]" aria-live="polite">
      {showBlockout && hole && <BlockoutExcept rect={hole} pad={pad} />}

      {showRing && ringStyle && (
        <div
          className="pointer-events-none fixed z-[96] transition-[top,left,width,height] duration-300 ease-out"
          style={ringStyle}
        />
      )}

      {step === "intro" && (
        <div
          className="absolute inset-0 z-[97] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-xl font-semibold text-[var(--text)]">Bienvenue, {firstName}</h2>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
              Un court parcours vous montre votre profil, votre rémunération, la page Comparatif, vos entretiens et comment demander un rendez-vous.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => goStep("hero")}
                className="cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Commencer
              </button>
              <button type="button" onClick={dismissAll} className="cursor-pointer text-sm text-[color:rgba(11,11,11,0.55)] underline">
                Passer le tutoriel
              </button>
            </div>
          </div>
        </div>
      )}

      {["hero", "remuneration", "comparatif", "entretiens", "progression"].includes(step) && (
        <div className="pointer-events-none absolute inset-0 z-[97] flex items-end justify-center p-4 pb-[min(20vh,160px)] sm:items-center sm:pb-8">
          {step === "hero" && (
            <Popover
              stepLabel={label(stepIndex)}
              title="Votre profil"
              body="Votre poste, équipe, manager et photo : tout est ici. Survolez l’avatar pour la modifier."
              onNext={afterHero}
              onSkip={dismissAll}
            />
          )}
          {step === "remuneration" && (
            <Popover
              stepLabel={label(stepIndex)}
              title="Votre rémunération"
              body="Salaire annuel brut et position par rapport à la grille interne de l’entreprise."
              onNext={afterRemuneration}
              onSkip={dismissAll}
            />
          )}
          {step === "comparatif" && (
            <Popover
              stepLabel={label(stepIndex)}
              title="Page Comparatif"
              body="Marché des offres (Indeed & Glassdoor), référence France et positionnement par rapport à votre équipe — accessible depuis ce menu."
              onNext={afterComparatif}
              onSkip={dismissAll}
            />
          )}
          {step === "entretiens" && (
            <Popover
              stepLabel={label(stepIndex)}
              title="Mes entretiens"
              body="Historique, prochains entretiens et demandes de rendez-vous avec votre manager ou les RH."
              onNext={afterEntretiens}
              onSkip={dismissAll}
            />
          )}
          {step === "progression" && (
            <Popover
              stepLabel={label(stepIndex)}
              title="Ma progression"
              body="L’évolution de votre rémunération et de votre parcours dans l’entreprise."
              onNext={afterProgression}
              onSkip={dismissAll}
            />
          )}
        </div>
      )}

      {step === "rdv_hint" && (
        <div className="pointer-events-none absolute inset-0 z-[97] flex items-end justify-center p-4 pb-[min(24vh,180px)] sm:items-center sm:pb-8">
          <Popover
            stepLabel={label(stepIndex)}
            title="Demander un rendez-vous"
            body={
              subscriptionActive === false
                ? "L’abonnement de votre organisation n’est pas actif : le bouton est désactivé. Passez à la suite."
                : "Cliquez sur le bouton « Demander un RDV » mis en évidence pour ouvrir le formulaire, puis fermez-le avec « Annuler » pour continuer."
            }
            onNext={subscriptionActive === false ? () => goStep("outro") : undefined}
            onSkip={dismissAll}
            nextLabel="Passer cette étape"
            showNext={subscriptionActive === false}
          />
        </div>
      )}

      {step === "rdv_modal" && rdvModalOpen && (
        <div className="pointer-events-auto fixed right-4 top-20 z-[98] w-[min(100%-2rem,22rem)] rounded-2xl border border-[var(--brand)]/25 bg-white p-4 shadow-xl sm:right-8">
          <p className="text-xs font-semibold uppercase text-[var(--brand)]">{label(stepIndex)} — formulaire</p>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.75)]">
            Parcourez le formulaire si vous le souhaitez. Cliquez sur <strong>Annuler</strong> pour fermer sans envoyer.
          </p>
          <button type="button" onClick={dismissAll} className="mt-3 text-sm underline text-[color:rgba(11,11,11,0.5)]">
            Passer le tutoriel
          </button>
        </div>
      )}

      {step === "outro" && (
        <div className="absolute inset-0 z-[97] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-semibold text-[var(--text)]">{label(totalSteps)} — Menu</h2>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
              Utilisez le menu <strong>Comparatif</strong>, le <strong>Simulateur</strong> d’augmentation et l’<strong>Organigramme</strong>.
            </p>
            <button
              type="button"
              onClick={dismissAll}
              className="mt-6 cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Terminer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
