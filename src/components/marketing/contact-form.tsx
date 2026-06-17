"use client";

import Link from "next/link";
import { useState } from "react";
import { trackContactFormSubmit } from "@/lib/analytics/data-layer";

const COMPANY_SIZES = ["1 – 5", "6 – 19", "20 – 99", "100+"];

const inputClass =
  "rounded-[var(--radius)] border border-border bg-muted px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]";

export function ContactForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companySize: COMPANY_SIZES[0],
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue. Merci de réessayer.");
        setStatus("error");
        return;
      }
      await trackContactFormSubmit({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        companySize: form.companySize,
      });
      setStatus("success");
    } catch {
      setError("Impossible d'envoyer votre demande pour le moment. Merci de réessayer.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[var(--radius)] border border-border bg-white p-10 text-center shadow-[var(--shadow)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:rgba(9,82,40,0.1)] text-[var(--brand)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[var(--text)]">Demande envoyée, merci !</h3>
        <p className="max-w-md text-sm text-[color:rgba(11,11,11,0.65)]">
          Nous revenons vers vous sous 24h ouvrées. Un email de confirmation vient de vous être envoyé. Vous pouvez
          aussi réserver directement un créneau ci-dessous.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-[var(--radius)] border border-border bg-white p-6 shadow-[var(--shadow)] sm:grid-cols-2"
    >
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Prénom</label>
        <input type="text" required value={form.firstName} onChange={update("firstName")} className={inputClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Nom</label>
        <input type="text" required value={form.lastName} onChange={update("lastName")} className={inputClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Email professionnel</label>
        <input type="email" required value={form.email} onChange={update("email")} className={inputClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Téléphone</label>
        <input
          type="tel"
          required
          value={form.phone}
          onChange={update("phone")}
          className={inputClass}
          placeholder="06 12 34 56 78"
          autoComplete="tel"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Taille de l'entreprise</label>
        <select value={form.companySize} onChange={update("companySize")} className={inputClass}>
          {COMPANY_SIZES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <label className="text-sm font-medium">Message</label>
        <textarea
          rows={4}
          value={form.message}
          onChange={update("message")}
          className={inputClass}
          placeholder="Parlez-nous de votre équipe et de ce que vous aimeriez améliorer."
        />
      </div>

      {error && (
        <p className="sm:col-span-2 rounded-[var(--radius)] bg-[#fde7e7] px-4 py-3 text-sm text-[#b3261e]">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="sm:col-span-2 inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Envoi en cours..." : "Envoyer ma demande"}
      </button>
      <p className="sm:col-span-2 text-xs text-[color:rgba(11,11,11,0.6)]">
        En soumettant ce formulaire vous acceptez notre{" "}
        <Link href="/privacy" className="font-medium text-[var(--text)] underline">
          politique de confidentialité
        </Link>
        .
      </p>
    </form>
  );
}
