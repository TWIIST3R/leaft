"use client";

import { useEffect, useState } from "react";
import type { SalaryDisclosureMode } from "@/lib/organization/salary-transparency-shared";

type Step = "law" | "choose" | "exact_warning" | "disable_confirm";

export function SalaryTransparencyModal({
  open,
  intent,
  initialMode,
  onClose,
  onConfirm,
}: {
  open: boolean;
  /** enable = première activation ; change_mode = modifier le mode ; disable = désactiver */
  intent: "enable" | "change_mode" | "disable";
  initialMode: SalaryDisclosureMode;
  onClose: () => void;
  onConfirm: (payload: { enabled: boolean; mode: SalaryDisclosureMode }) => Promise<void>;
}) {
  const [step, setStep] = useState<Step>("law");
  const [mode, setMode] = useState<SalaryDisclosureMode>(initialMode);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    if (intent === "disable") setStep("disable_confirm");
    else if (intent === "change_mode") setStep("choose");
    else setStep("law");
  }, [open, intent, initialMode]);

  if (!open) return null;

  async function submit(enabled: boolean, disclosureMode: SalaryDisclosureMode) {
    setLoading(true);
    try {
      await onConfirm({ enabled, mode: disclosureMode });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/45 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-xl sm:p-8">
        {step === "law" && (
          <>
            <h2 className="text-lg font-semibold text-[var(--text)]">Transparence salariale</h2>
            <p className="mt-3 text-sm text-[color:rgba(11,11,11,0.7)]">
              En France, les entreprises de <strong>50 salariés et plus</strong> doivent publier des indicateurs et des critères de rémunération.
              Les collaborateurs ont droit à des <strong>informations sur leur rémunération</strong> et sur les écarts constatés.
            </p>
            <p className="mt-3 text-sm text-[color:rgba(11,11,11,0.7)]">
              Vous n&apos;êtes <strong>pas obligé</strong> d&apos;afficher le salaire exact de chaque collègue : une{" "}
              <strong>moyenne par département</strong> est en général suffisante pour l&apos;espace talent (comparatif, organigramme).
            </p>
            <p className="mt-3 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 px-3 py-2 text-sm text-[var(--brand)]">
              En activant cette option, les managers et talents verront des données de rémunération selon le mode que vous choisirez à l&apos;étape suivante.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep("choose")}
                className="cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
              >
                Continuer
              </button>
              <button type="button" onClick={onClose} className="cursor-pointer rounded-full px-4 py-2.5 text-sm text-[color:rgba(11,11,11,0.6)] hover:bg-[#f8faf8]">
                Annuler
              </button>
            </div>
          </>
        )}

        {step === "choose" && (
          <>
            <h2 className="text-lg font-semibold text-[var(--text)]">Mode de partage</h2>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">Choisissez ce que les talents et managers pourront voir.</p>
            <div className="mt-4 space-y-3">
              <label className={`flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition ${mode === "department_average" ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-[#e2e7e2]"}`}>
                <input
                  type="radio"
                  name="disclosure"
                  className="mt-1"
                  checked={mode === "department_average"}
                  onChange={() => setMode("department_average")}
                />
                <div>
                  <p className="font-semibold text-[var(--text)]">Moyenne du département (recommandé)</p>
                  <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.6)]">
                    Sur l&apos;organigramme et le comparatif marché : salaire personnel + moyenne du département, sans afficher les salaires individuels des collègues.
                  </p>
                </div>
              </label>
              <label className={`flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition ${mode === "exact" ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-[#e2e7e2]"}`}>
                <input
                  type="radio"
                  name="disclosure"
                  className="mt-1"
                  checked={mode === "exact"}
                  onChange={() => setMode("exact")}
                />
                <div>
                  <p className="font-semibold text-[var(--text)]">Salaires exacts (optionnel)</p>
                  <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.6)]">
                    Chaque collaborateur visible avec son salaire brut annuel. Non requis par la loi — à réserver si votre culture RH le justifie.
                  </p>
                </div>
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => (mode === "exact" ? setStep("exact_warning") : submit(true, mode))}
                className="cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
              >
                {mode === "exact" ? "Suivant" : intent === "change_mode" ? "Enregistrer" : "Activer"}
              </button>
              <button type="button" onClick={onClose} className="cursor-pointer rounded-full px-4 py-2.5 text-sm text-[color:rgba(11,11,11,0.6)]">
                Annuler
              </button>
            </div>
          </>
        )}

        {step === "exact_warning" && (
          <>
            <h2 className="text-lg font-semibold text-[var(--text)]">Confirmer les salaires exacts</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[color:rgba(11,11,11,0.7)]">
              <li>Ce choix <strong>n&apos;est pas obligatoire</strong> pour respecter la loi.</li>
              <li>Les talents verront le <strong>salaire brut annuel</strong> de chaque personne sur l&apos;organigramme et sur le rail comparatif marché.</li>
              <li>Assurez-vous que les données saisies dans Leaft sont à jour et cohérentes avec votre politique RH.</li>
            </ul>
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              Vous pourrez repasser en mode « moyenne du département » à tout moment dans le paramétrage.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => submit(true, "exact")}
                className="cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "Enregistrement…" : "Confirmer et activer"}
              </button>
              <button type="button" onClick={() => setStep("choose")} className="cursor-pointer rounded-full px-4 py-2.5 text-sm text-[color:rgba(11,11,11,0.6)]">
                Retour
              </button>
            </div>
          </>
        )}

        {step === "disable_confirm" && (
          <>
            <h2 className="text-lg font-semibold text-[var(--text)]">Désactiver la transparence ?</h2>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
              Les managers et talents ne verront plus les rémunérations sur l&apos;organigramme ni les comparatifs d&apos;équipe.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => submit(false, mode)}
                className="cursor-pointer rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
              >
                Désactiver
              </button>
              <button type="button" onClick={onClose} className="cursor-pointer rounded-full px-4 py-2.5 text-sm">
                Annuler
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
