"use client";

import { InseeSalaryCurveChart } from "@/components/talent/insee-salary-curve-chart";
import type { InseeSalaryGameUi } from "@/lib/talent/insee-salary-game-ui";

export type { InseeSalaryGameUi };

export function TalentFranceReferenceCard({
  inseeSalaryGame,
  firstName,
  lastName,
  avatarUrl,
}: {
  inseeSalaryGame: InseeSalaryGameUi;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}) {
  const pctLabel =
    inseeSalaryGame.pctVsMedian >= 0
      ? `+${inseeSalaryGame.pctVsMedian} %`
      : `${inseeSalaryGame.pctVsMedian} %`;

  return (
    <div className="overflow-hidden rounded-3xl border border-[#063d1f]/25 bg-white shadow-sm">
      <div className="bg-[var(--brand)] px-4 py-4 sm:px-6 sm:py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Référence salariale en France</p>
        <p className="mt-2 text-sm text-white/90">
          Où vous vous situez par rapport aux salaires nets du secteur privé (données publiques indicatives).
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase text-white/70">Votre position</p>
            <p className="text-3xl font-bold tabular-nums text-white">{pctLabel}</p>
            <p className="text-xs text-white/75">vs médiane nationale (~{inseeSalaryGame.inseeMedianNetMonthly.toLocaleString("fr-FR")} € net / mois)</p>
          </div>
          <div className="rounded-xl bg-white/15 px-3 py-2">
            <p className="text-[10px] uppercase text-white/70">Net mensuel estimé</p>
            <p className="text-lg font-semibold tabular-nums text-white">
              {inseeSalaryGame.netMonthlyEstimated.toLocaleString("fr-FR")} €
            </p>
            <p className="text-[10px] text-white/70">~{Math.round(inseeSalaryGame.approximatePercentile)}e percentile</p>
          </div>
        </div>
      </div>
      <div className="bg-[#f8faf8] px-2 pb-2 pt-1 sm:px-4">
        <InseeSalaryCurveChart
          netMonthlyEstimated={inseeSalaryGame.netMonthlyEstimated}
          inseeMedianNetMonthly={inseeSalaryGame.inseeMedianNetMonthly}
          firstName={firstName}
          lastName={lastName}
          avatarUrl={avatarUrl}
        />
      </div>
    </div>
  );
}
