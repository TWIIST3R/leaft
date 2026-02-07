"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Settings = { name: string; salary_transparency_enabled: boolean };

export function ParametresClient({ initialSettings }: { initialSettings: Settings }) {
  const router = useRouter();
  const [salaryTransparency, setSalaryTransparency] = useState(initialSettings.salary_transparency_enabled);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleTransparencyToggle(checked: boolean) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/organization/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salary_transparency_enabled: checked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setSalaryTransparency(checked);
      setMessage({
        type: "ok",
        text: checked
          ? "Transparence salariale activée : les managers et talents pourront consulter les rémunérations."
          : "Transparence salariale désactivée.",
      });
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Transparence salariale */}
      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">Transparence salariale</h2>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Conformité avec la loi sur la transparence des rémunérations en France. Lorsque cette option est activée, les comptes <strong>Manager</strong> et <strong>Talent</strong> (employé) peuvent consulter l’ensemble des salaires de l’entreprise.
        </p>
        {message && (
          <p
            className={`mt-4 rounded-xl px-4 py-2 text-sm ${
              message.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={salaryTransparency}
            disabled={loading}
            onClick={() => handleTransparencyToggle(!salaryTransparency)}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:ring-offset-2 disabled:opacity-50 ${
              salaryTransparency ? "bg-[var(--brand)]" : "bg-[#e2e7e2]"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                salaryTransparency ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm font-medium text-[var(--text)]">
            {salaryTransparency ? "Transparence activée" : "Transparence désactivée"}
          </span>
        </div>
      </section>

      {/* Branding (à venir) */}
      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">Branding entreprise</h2>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Logo, couleurs et personnalisation de l’espace pour vos collaborateurs. Bientôt disponible.
        </p>
        <div className="mt-4 rounded-xl border border-dashed border-[#e2e7e2] bg-[#f8faf8] p-8 text-center text-sm text-[color:rgba(11,11,11,0.6)]">
          Upload logo et couleurs à venir.
        </div>
      </section>
    </div>
  );
}
