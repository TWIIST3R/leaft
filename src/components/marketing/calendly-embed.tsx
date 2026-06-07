"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * Lien Calendly configurable sans toucher au code : définir
 * NEXT_PUBLIC_CALENDLY_URL (ex: https://calendly.com/contact-leaft/30min).
 * Tant que la variable n'est pas définie, on affiche un repli élégant
 * qui renvoie vers le formulaire de contact.
 */
const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;

declare global {
  interface Window {
    Calendly?: unknown;
  }
}

export function CalendlyEmbed({ minHeight = 680 }: { minHeight?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!CALENDLY_URL) return;

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://assets.calendly.com/assets/external/widget.js"]',
    );
    if (existing) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  if (!CALENDLY_URL) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius)] border border-dashed border-[color:rgba(9,82,40,0.25)] bg-muted p-10 text-center"
        style={{ minHeight }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:rgba(9,82,40,0.1)] text-[var(--brand)]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-[var(--text)]">Réservez un échange de 30 minutes</p>
          <p className="mx-auto max-w-md text-sm text-[color:rgba(11,11,11,0.65)]">
            On vous montre Leaft en conditions réelles et on répond à toutes vos questions, sans engagement.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Choisir un créneau
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="calendly-inline-widget overflow-hidden rounded-[var(--radius)] border border-border bg-white shadow-[var(--shadow)]"
      data-url={CALENDLY_URL}
      style={{ minWidth: "320px", height: minHeight }}
    />
  );
}
