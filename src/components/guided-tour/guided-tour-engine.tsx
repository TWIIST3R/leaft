"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  computePopoverPlacement,
  measureSelector,
  TourBlockout,
  TourHighlightRing,
  TourPopover,
  useTourTargetElevate,
  type PopoverPlacement,
  type TourRect,
} from "@/components/guided-tour/guided-tour-overlay";

export type GuidedTourStep = {
  id: string;
  /** Étape plein écran (intro / outro) */
  kind: "modal" | "highlight" | "navigate";
  title: string;
  body: string;
  /** Sélecteur de l’élément à mettre en avant */
  selector?: string;
  /** Chemin requis pour afficher l’étape (ex. /espace-talent/comparatif) */
  pathname?: string;
  /** Pour kind navigate : lien menu à cliquer */
  navSelector?: string;
  /** Route attendue après le clic (déclenche l’étape suivante) */
  waitPathname?: string;
  nextLabel?: string;
  showNext?: boolean;
};

const STEP_STORAGE_KEY = "leaft_guided_tour_current_step";

export const GUIDED_TOUR_GO_STEP_EVENT = "leaft-guided-tour-go-step";

export function goToGuidedTourStep(stepId: string) {
  window.dispatchEvent(new CustomEvent(GUIDED_TOUR_GO_STEP_EVENT, { detail: { stepId } }));
}

function pathMatches(pathname: string, expected: string): boolean {
  if (expected === "/espace-talent") return pathname === "/espace-talent";
  if (expected === "/dashboard") return pathname === "/dashboard";
  return pathname === expected || pathname.startsWith(`${expected}/`);
}

export function GuidedTourEngine({
  steps,
  storageDoneKey,
  firstName,
  onStepChange,
  onComplete,
}: {
  steps: GuidedTourStep[];
  storageDoneKey: string;
  firstName?: string;
  onStepChange?: (stepId: string) => void;
  onComplete?: () => void;
}) {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hole, setHole] = useState<TourRect | null>(null);
  const [popoverPlacement, setPopoverPlacement] = useState<PopoverPlacement | null>(null);

  const step = steps[stepIndex];
  const totalSteps = steps.filter((s) => s.kind !== "modal" || s.id !== "intro").length;

  const elevateSelector =
    active && step && (step.kind === "navigate" ? step.navSelector : step.selector)
      ? step.kind === "navigate"
        ? step.navSelector!
        : step.selector!
      : null;

  useTourTargetElevate(elevateSelector, !!elevateSelector);

  const readDone = useCallback(() => {
    try {
      return !!localStorage.getItem(storageDoneKey);
    } catch {
      return false;
    }
  }, [storageDoneKey]);

  const setDone = useCallback(() => {
    try {
      localStorage.setItem(storageDoneKey, "1");
      sessionStorage.removeItem(STEP_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [storageDoneKey]);

  const clearDone = useCallback(() => {
    try {
      localStorage.removeItem(storageDoneKey);
    } catch {
      /* ignore */
    }
  }, [storageDoneKey]);

  const dismiss = useCallback(() => {
    setDone();
    setActive(false);
    onComplete?.();
  }, [setDone, onComplete]);

  const goToIndex = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(index, steps.length - 1));
      setStepIndex(next);
      try {
        sessionStorage.setItem(STEP_STORAGE_KEY, steps[next]!.id);
      } catch {
        /* ignore */
      }
      onStepChange?.(steps[next]!.id);
    },
    [steps, onStepChange],
  );

  const advance = useCallback(() => {
    if (stepIndex < steps.length - 1) goToIndex(stepIndex + 1);
    else dismiss();
  }, [stepIndex, steps.length, goToIndex, dismiss]);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const force = url.searchParams.get("tour") === "replay" || url.searchParams.get("tour") === "1";
      if (force) {
        clearDone();
        url.searchParams.delete("tour");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
        setActive(true);
        goToIndex(0);
        return;
      }
      const savedStep = sessionStorage.getItem(STEP_STORAGE_KEY);
      if (!readDone()) {
        setActive(true);
        const idx = savedStep ? steps.findIndex((s) => s.id === savedStep) : 0;
        goToIndex(idx >= 0 ? idx : 0);
      }
    } catch {
      setActive(true);
    }
  }, [clearDone, readDone, goToIndex, steps]);

  useEffect(() => {
    const handler = (e: Event) => {
      const stepId = (e as CustomEvent<{ stepId: string }>).detail?.stepId;
      if (!stepId) return;
      const idx = steps.findIndex((s) => s.id === stepId);
      if (idx >= 0) goToIndex(idx);
    };
    window.addEventListener(GUIDED_TOUR_GO_STEP_EVENT, handler);
    return () => window.removeEventListener(GUIDED_TOUR_GO_STEP_EVENT, handler);
  }, [goToIndex, steps]);

  useEffect(() => {
    if (!active || !step || step.kind !== "navigate" || !step.waitPathname) return;
    if (pathMatches(pathname, step.waitPathname)) {
      const t = window.setTimeout(() => advance(), 400);
      return () => window.clearTimeout(t);
    }
  }, [active, step, pathname, advance]);

  useEffect(() => {
    if (!active || !step?.pathname) return;
    if (!pathMatches(pathname, step.pathname)) {
      const t = window.setTimeout(() => {
        if (step.pathname && !pathMatches(pathname, step.pathname)) {
          /* attendre navigation ou contenu */
        }
      }, 100);
      return () => window.clearTimeout(t);
    }
  }, [active, step, pathname]);

  useLayoutEffect(() => {
    if (!active || !step) {
      setHole(null);
      setPopoverPlacement(null);
      return;
    }
    if (step.kind === "modal") {
      setHole(null);
      setPopoverPlacement(null);
      return;
    }

    const update = () => {
      const sel =
        step.kind === "navigate" ? step.navSelector : step.selector;
      if (!sel) {
        setHole(null);
        setPopoverPlacement(null);
        return;
      }
      if (step.pathname && !pathMatches(pathname, step.pathname)) {
        setHole(null);
        setPopoverPlacement(null);
        return;
      }
      const nextHole = measureSelector(sel);
      setHole(nextHole);
      setPopoverPlacement(nextHole ? computePopoverPlacement(nextHole) : null);
    };

    update();
    const id = window.setInterval(update, 300);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [active, step, pathname]);

  useEffect(() => {
    if (!active || !step?.selector || step.kind !== "highlight") return;
    const nodes = document.querySelectorAll(step.selector);
    for (const el of nodes) {
      const r = el.getBoundingClientRect();
      if (r.width >= 2 && r.height >= 2) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
      }
    }
  }, [active, step, stepIndex, pathname]);

  const displayIndex = useMemo(() => {
    const visible = steps.slice(0, stepIndex + 1).filter((s) => s.id !== "intro").length;
    return Math.max(1, visible);
  }, [steps, stepIndex]);

  if (!active || !step) return null;

  const label = `Étape ${displayIndex} / ${totalSteps}`;
  const showHole = hole && step.kind !== "modal";
  const isNavigate = step.kind === "navigate";

  return (
    <div className="pointer-events-none fixed inset-0 z-[9997]" aria-live="polite">
      {showHole && hole && <TourBlockout rect={hole} />}
      {showHole && hole && <TourHighlightRing rect={hole} />}

      {step.kind === "modal" && step.id === "intro" && (
        <div className="pointer-events-auto absolute inset-0 z-[10000] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-xl font-semibold text-[var(--text)]">
              Bienvenue{firstName ? `, ${firstName}` : ""}
            </h2>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">{step.body}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => advance()}
                className="cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Commencer
              </button>
              <button type="button" onClick={dismiss} className="cursor-pointer text-sm underline text-[color:rgba(11,11,11,0.55)]">
                Passer
              </button>
            </div>
          </div>
        </div>
      )}

      {step.kind === "modal" && step.id === "outro" && (
        <div className="pointer-events-auto absolute inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-semibold text-[var(--text)]">{step.title}</h2>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">{step.body}</p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-6 cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Terminer
            </button>
          </div>
        </div>
      )}

      {(step.kind === "highlight" || step.kind === "navigate") && (
        <TourPopover
          stepLabel={label}
          title={step.title}
          body={step.body}
          onNext={isNavigate ? undefined : advance}
          onSkip={dismiss}
          nextLabel={step.nextLabel ?? "Suivant"}
          showNext={step.showNext !== false && !isNavigate}
          placement={popoverPlacement}
        />
      )}
    </div>
  );
}
