"use client";

import { useState } from "react";

export function BillingCta() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenBillingPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || "Impossible d'ouvrir la facturation");
      window.location.href = data.url as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleOpenBillingPortal}
        disabled={loading}
        className="cursor-pointer rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Ouverture..." : "Ouvrir la facturation"}
      </button>
      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
      <p className="mt-3 text-xs text-[color:rgba(11,11,11,0.55)]">
        Une fois le paiement régularisé, l’accès au dashboard sera rétabli automatiquement.
      </p>
    </div>
  );
}

