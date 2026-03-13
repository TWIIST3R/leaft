"use client";

import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative z-10 w-full max-w-lg rounded-3xl border border-[#e2e7e2] bg-white shadow-2xl"
      >
        <div className="border-b border-[#e2e7e2] px-6 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-[var(--text)]">
            {title}
          </h2>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5 text-sm text-[var(--text)]">
          {children}
        </div>
        {footer != null && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#e2e7e2] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
