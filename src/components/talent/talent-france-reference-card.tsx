"use client";

import { nextBucketThresholdPct } from "@/lib/talent/fr-salary-game";
import { InseeSalaryCurveChart } from "@/components/talent/insee-salary-curve-chart";

export type InseeSalaryGameUi = {
  netMonthlyEstimated: number;
  inseeMedianNetMonthly: number;
  pctVsMedian: number;
  approximatePercentile: number;
  game: { bucket: number; title: string; emoji: string; blurb: string };
};

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
  const game = inseeSalaryGame.game;
  const nextPct = nextBucketThresholdPct(game.bucket);

  return (
    <div className="rounded-3xl border border-[#dfe6df] bg-gradient-to-br from-white to-[#f4f7f4] p-4 shadow-sm sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.55)]">
        Référence salariale en France
      </p>
      <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.6)]">
        Position indicative par rapport aux salaires nets du secteur privé (données publiques, hors offres d&apos;emploi).
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-2xl">{game.emoji}</span>
        <div>
          <p className="text-sm font-bold text-[var(--text)]">{game.title}</p>
          <p className="text-xs text-[color:rgba(11,11,11,0.6)]">{game.blurb}</p>
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold text-[var(--text)]">
        {inseeSalaryGame.pctVsMedian >= 0 ? "+" : ""}
        {inseeSalaryGame.pctVsMedian} % par rapport à la médiane nationale estimée (
        {inseeSalaryGame.inseeMedianNetMonthly.toLocaleString("fr-FR")} € net / mois)
      </p>
      <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.55)]">
        Net mensuel estimé : {inseeSalaryGame.netMonthlyEstimated.toLocaleString("fr-FR")} € — environ au{" "}
        {Math.round(inseeSalaryGame.approximatePercentile)}e percentile (estimation).
      </p>
      {nextPct != null && inseeSalaryGame.pctVsMedian < nextPct && (
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.5)]">
          Prochain palier de titre vers environ +{nextPct} % par rapport à la médiane (encore ~{nextPct - inseeSalaryGame.pctVsMedian} points).
        </p>
      )}
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
