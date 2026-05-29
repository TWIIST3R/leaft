"use client";

import { useEffect } from "react";

export type TourRect = { top: number; left: number; width: number; height: number };

function visibleRect(el: Element): TourRect | null {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/** Retourne le premier élément correspondant visible (utile si le sélecteur existe en desktop + mobile). */
export function measureSelector(selector: string): TourRect | null {
  const nodes = document.querySelectorAll(selector);
  for (const el of nodes) {
    const rect = visibleRect(el);
    if (rect) return rect;
  }
  return null;
}

function firstVisibleElement(selector: string): HTMLElement | null {
  const nodes = document.querySelectorAll(selector);
  for (const el of nodes) {
    const r = el.getBoundingClientRect();
    if (r.width >= 2 && r.height >= 2) return el as HTMLElement;
  }
  return null;
}

/** Met la cible au-dessus de l’overlay pour recevoir les clics. */
export function useTourTargetElevate(selector: string | null, active: boolean) {
  useEffect(() => {
    if (!active || !selector) return;
    const el = firstVisibleElement(selector);
    if (!el) return;

    const prev = {
      position: el.style.position,
      zIndex: el.style.zIndex,
      pointerEvents: el.style.pointerEvents,
    };
    el.style.position = "relative";
    el.style.zIndex = "10001";
    el.style.pointerEvents = "auto";

    return () => {
      el.style.position = prev.position;
      el.style.zIndex = prev.zIndex;
      el.style.pointerEvents = prev.pointerEvents;
    };
  }, [selector, active]);
}

export function TourBlockout({ rect, pad = 10 }: { rect: TourRect; pad?: number }) {
  const t = rect.top - pad;
  const l = rect.left - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;
  const bg = "rgba(0,0,0,0.52)";
  return (
    <>
      <div className="pointer-events-auto fixed inset-x-0 top-0 z-[9998]" style={{ height: Math.max(0, t), background: bg }} />
      <div className="pointer-events-auto fixed left-0 z-[9998]" style={{ top: t, width: Math.max(0, l), height: h, background: bg }} />
      <div className="pointer-events-auto fixed z-[9998]" style={{ top: t, left: l + w, right: 0, height: h, background: bg }} />
      <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-[9998]" style={{ top: t + h, background: bg }} />
    </>
  );
}

export function TourHighlightRing({ rect, pad = 10 }: { rect: TourRect; pad?: number }) {
  return (
    <div
      className="pointer-events-none fixed z-[9999] rounded-2xl ring-2 ring-[var(--brand)] ring-offset-2 ring-offset-transparent transition-all duration-300"
      style={{
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }}
    />
  );
}

export function TourPopover({
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
