"use client";

import { useEffect } from "react";

export type TourRect = { top: number; left: number; width: number; height: number };

export type PopoverPlacement = { top: number; left: number; maxWidth: number };

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

export function allVisibleElements(selector: string): HTMLElement[] {
  const out: HTMLElement[] = [];
  document.querySelectorAll(selector).forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width >= 2 && r.height >= 2) out.push(el as HTMLElement);
  });
  return out;
}

function firstVisibleElement(selector: string): HTMLElement | null {
  return allVisibleElements(selector)[0] ?? null;
}

/** Positionne la modale à côté de la cible, sans la recouvrir. */
export function computePopoverPlacement(rect: TourRect): PopoverPlacement {
  const margin = 16;
  const popoverW = Math.min(384, window.innerWidth - margin * 2);
  const popoverH = 200;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cy = rect.top + rect.height / 2;

  const clampTop = (top: number) => Math.max(margin, Math.min(vh - popoverH - margin, top));
  const clampLeft = (left: number) => Math.max(margin, Math.min(vw - popoverW - margin, left));

  // Menu latéral (lien étroit à gauche)
  if (rect.left < vw * 0.32 && rect.width < 280) {
    const left = rect.left + rect.width + margin;
    if (left + popoverW <= vw - margin) {
      return { top: clampTop(cy - popoverH / 2), left, maxWidth: popoverW };
    }
    return { top: clampTop(rect.top + rect.height + margin), left: clampLeft(rect.left), maxWidth: popoverW };
  }

  // Grande zone (tableau de bord, carte pleine largeur)
  if (rect.width > vw * 0.5) {
    if (rect.top > vh * 0.25) {
      return { top: margin, left: clampLeft((vw - popoverW) / 2), maxWidth: popoverW };
    }
    const below = rect.top + rect.height + margin;
    if (below + popoverH <= vh - margin) {
      return { top: below, left: clampLeft(rect.left), maxWidth: popoverW };
    }
    return { top: clampTop(rect.top - popoverH - margin), left: clampLeft(rect.left), maxWidth: popoverW };
  }

  // Cible à droite : modale à gauche
  if (rect.left + rect.width > vw * 0.65) {
    const left = rect.left - popoverW - margin;
    if (left >= margin) {
      return { top: clampTop(cy - popoverH / 2), left, maxWidth: popoverW };
    }
  }

  // Par défaut : sous la cible, sinon au-dessus
  const below = rect.top + rect.height + margin;
  if (below + popoverH <= vh - margin) {
    return { top: below, left: clampLeft(rect.left), maxWidth: popoverW };
  }
  return { top: clampTop(rect.top - popoverH - margin), left: clampLeft(rect.left), maxWidth: popoverW };
}

/** Met toutes les cibles visibles au-dessus de l’overlay pour recevoir les clics. */
export function useTourTargetElevate(selector: string | null, active: boolean) {
  useEffect(() => {
    if (!active || !selector) return;
    const elements = allVisibleElements(selector);
    if (!elements.length) return;

    const snapshots = elements.map((el) => ({
      el,
      prev: {
        position: el.style.position,
        zIndex: el.style.zIndex,
        pointerEvents: el.style.pointerEvents,
      },
    }));

    for (const { el } of snapshots) {
      el.style.position = "relative";
      el.style.zIndex = "10001";
      el.style.pointerEvents = "auto";
    }

    return () => {
      for (const { el, prev } of snapshots) {
        el.style.position = prev.position;
        el.style.zIndex = prev.zIndex;
        el.style.pointerEvents = prev.pointerEvents;
      }
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
  placement,
}: {
  stepLabel: string;
  title: string;
  body: string;
  onNext?: () => void;
  onSkip: () => void;
  nextLabel?: string;
  showNext?: boolean;
  placement?: PopoverPlacement | null;
}) {
  const style = placement
    ? { top: placement.top, left: placement.left, maxWidth: placement.maxWidth, width: placement.maxWidth }
    : undefined;

  return (
    <div
      className={`pointer-events-auto z-[10002] w-full max-w-md rounded-2xl border border-[#e2e7e2] bg-white p-5 shadow-xl ${
        placement ? "fixed" : ""
      }`}
      style={style}
    >
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
