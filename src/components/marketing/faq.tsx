"use client";

import { useState } from "react";

export type FaqItem = { q: string; a: string };

export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-border overflow-hidden rounded-[20px] border border-border bg-white shadow-[var(--shadow)]">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-muted"
              aria-expanded={isOpen}
            >
              <span className="text-base font-semibold text-[var(--text)]">{item.q}</span>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:rgba(9,82,40,0.1)] text-[var(--brand)] transition-transform duration-200 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </button>
            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="min-h-0 overflow-hidden">
                <p className="px-6 pb-5 text-sm leading-relaxed text-[color:rgba(11,11,11,0.7)]">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
