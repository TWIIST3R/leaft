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
    <div className="rounded-3xl border border-[#dfe6df] bg-gradient-to-br from-white to-[#f4f7f4] p-4 shadow-sm sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.55)]">
        Référence salariale en France
      </p>
      <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.6)]">
        Position indicative par rapport aux salaires nets du secteur privé (données publiques, hors offres d&apos;emploi).
      </p>

      <div className="mt-4 flex flex-wrap gap-6 border-l-4 border-[var(--brand)] pl-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.45)]">Votre position</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--brand)]">{pctLabel}</p>
          <p className="mt-0.5 text-xs text-[color:rgba(11,11,11,0.55)]">
            vs médiane nationale (~{inseeSalaryGame.inseeMedianNetMonthly.toLocaleString("fr-FR")} € net / mois)
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.45)]">Net mensuel estimé</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--text)]">
            {inseeSalaryGame.netMonthlyEstimated.toLocaleString("fr-FR")} €
          </p>
          <p className="mt-0.5 text-xs text-[color:rgba(11,11,11,0.55)]">
            ~{Math.round(inseeSalaryGame.approximatePercentile)}e percentile
          </p>
        </div>
      </div>

      <InseeSalaryCurveChart
        netMonthlyEstimated={inseeSalaryGame.netMonthlyEstimated}
        inseeMedianNetMonthly={inseeSalaryGame.inseeMedianNetMonthly}
        firstName={firstName}
        lastName={lastName}
        avatarUrl={avatarUrl}
      />
    </div>
  );
}
