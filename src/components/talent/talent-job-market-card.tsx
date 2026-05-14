"use client";

import { nextBucketThresholdPct } from "@/lib/talent/fr-salary-game";
import type { TalentMarketBenchmarkRow } from "@/lib/talent/refresh-talent-market-benchmark";

export type InseeSalaryGameUi = {
  netMonthlyEstimated: number;
  inseeMedianNetMonthly: number;
  pctVsMedian: number;
  approximatePercentile: number;
  game: { bucket: number; title: string; emoji: string; blurb: string };
};

function FrProgressBar({ netMonthly, inseeMedian }: { netMonthly: number; inseeMedian: number }) {
  const minR = 0.55;
  const maxR = 1.45;
  const ratio = netMonthly / inseeMedian;
  const t = Math.max(0, Math.min(1, (ratio - minR) / (maxR - minR)));
  const steps = 19;
  const ticks = Array.from({ length: steps }, (_, i) => i);

  return (
    <div className="mt-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.45)]">
        Progression vs médiane Insee (net / mois, paliers ~5 %)
      </p>
      <div className="relative mt-2 h-14 rounded-2xl border border-[#e2e7e2] bg-gradient-to-r from-amber-50 via-[#f0f7f0] to-[var(--brand)]/25 px-2 pt-5 pb-1">
        <div className="absolute inset-x-2 top-2 flex justify-between text-[9px] font-medium text-[color:rgba(11,11,11,0.45)]">
          <span>-45 %</span>
          <span>médiane</span>
          <span>+45 %</span>
        </div>
        <div className="relative h-3 w-full rounded-full bg-white/80 shadow-inner">
          {ticks.map((i) => (
            <div
              key={i}
              className="absolute top-0 h-full w-px bg-[#e2e7e2]"
              style={{ left: `${(i / (steps - 1)) * 100}%` }}
            />
          ))}
          <div
            className="absolute top-1/2 z-[1] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--brand)] shadow-md"
            style={{ left: `${t * 100}%` }}
            title={`${Math.round(ratio * 100)} % de la médiane Insee`}
          />
        </div>
      </div>
      <p className="mt-1.5 text-[10px] text-[color:rgba(11,11,11,0.45)]">
        Net mensuel estimé à partir de ton brut annuel (coefficient indicatif). Répartition salariale : Insee, secteur privé, base « Tous salariés » 2024 (médiane nette mensuelle indicative).
      </p>
    </div>
  );
}

export function TalentJobMarketCard({
  annualSalaryBrut,
  hasdataConfigured,
  talentMarketBenchmark,
  inseeSalaryGame,
}: {
  annualSalaryBrut: number | null;
  hasdataConfigured: boolean;
  talentMarketBenchmark: TalentMarketBenchmarkRow | null;
  inseeSalaryGame: InseeSalaryGameUi | null;
}) {
  const salary = annualSalaryBrut != null ? Number(annualSalaryBrut) : null;
  const m = talentMarketBenchmark;
  const game = inseeSalaryGame?.game;
  const nextPct = game ? nextBucketThresholdPct(game.bucket) : null;

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-[var(--brand)]/15 bg-white/90 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Comparatif marché emploi (HasData)</p>
        <p className="mt-1 text-[11px] text-[color:rgba(11,11,11,0.55)]">
          Données issues des offres (Indeed FR + Glassdoor FR), mises en cache côté serveur. Nouvel appel uniquement si ton salaire, ton poste ou ta zone de recherche change.
        </p>
        {!hasdataConfigured && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            HasData n&apos;est pas configuré : le comparatif offres n&apos;est pas disponible.
          </p>
        )}
        {hasdataConfigured && !m && salary != null && (
          <p className="mt-2 text-xs text-[color:rgba(11,11,11,0.55)]">
            Comparatif en cours d&apos;enregistrement. Recharge la page dans quelques instants si besoin.
          </p>
        )}
        {hasdataConfigured && m?.fetch_error && m.sample_size === 0 && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Dernière mise à jour : {m.fetch_error}
          </p>
        )}
        {m && (m.search_keyword || m.search_location) && (
          <p className="mt-2 text-[11px] text-[color:rgba(11,11,11,0.5)]">
            Dernière recherche : « {m.search_keyword} » — {m.search_location}
            {m.fetched_at ? ` · ${new Date(m.fetched_at).toLocaleDateString("fr-FR")}` : ""}
          </p>
        )}
      </div>

      {m && m.sample_size > 0 && m.p50_annual != null && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-3">
            <p className="text-[10px] font-semibold uppercase text-[color:rgba(11,11,11,0.45)]">P25 offres</p>
            <p className="mt-1 text-base font-semibold text-[var(--text)]">
              {m.p25_annual != null ? `${Math.round(Number(m.p25_annual)).toLocaleString("fr-FR")} €` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--brand)]/25 bg-[var(--brand)]/5 p-3">
            <p className="text-[10px] font-semibold uppercase text-[color:rgba(11,11,11,0.45)]">P50 offres</p>
            <p className="mt-1 text-base font-semibold text-[var(--text)]">{Math.round(Number(m.p50_annual)).toLocaleString("fr-FR")} €</p>
          </div>
          <div className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-3">
            <p className="text-[10px] font-semibold uppercase text-[color:rgba(11,11,11,0.45)]">P75 offres</p>
            <p className="mt-1 text-base font-semibold text-[var(--text)]">
              {m.p75_annual != null ? `${Math.round(Number(m.p75_annual)).toLocaleString("fr-FR")} €` : "—"}
            </p>
          </div>
        </div>
      )}

      {salary != null && m?.market_compa_pct != null && (
        <div className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Compa-ratio marché</p>
          <p className="mt-1 text-2xl font-bold text-[var(--brand)]">{m.market_compa_pct} %</p>
          <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.6)]">
            Ton salaire annuel brut par rapport à la médiane (P50) des salaires annuels observés dans les offres agrégées.
            {m.position_vs_market ? ` Tu es ${m.position_vs_market}.` : ""}
          </p>
        </div>
      )}

      {salary != null && inseeSalaryGame && (
        <div className="rounded-2xl border border-[#e2e7e2] bg-gradient-to-br from-white to-[var(--brand)]/5 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl">{inseeSalaryGame.game.emoji}</span>
            <div>
              <p className="text-sm font-bold text-[var(--text)]">{inseeSalaryGame.game.title}</p>
              <p className="text-xs text-[color:rgba(11,11,11,0.6)]">{inseeSalaryGame.game.blurb}</p>
            </div>
          </div>
          <p className="mt-2 text-sm font-semibold text-[var(--text)]">
            {inseeSalaryGame.pctVsMedian >= 0 ? "+" : ""}
            {inseeSalaryGame.pctVsMedian} % vs médiane Insee ({inseeSalaryGame.inseeMedianNetMonthly.toLocaleString("fr-FR")} € net / mois)
          </p>
          <p className="mt-1 text-[11px] text-[color:rgba(11,11,11,0.5)]">
            Net mensuel estimé : {inseeSalaryGame.netMonthlyEstimated.toLocaleString("fr-FR")} € — position indicative sur la courbe salariale : ~{inseeSalaryGame.approximatePercentile}e percentile (approximation).
          </p>
          {nextPct != null && inseeSalaryGame.pctVsMedian < nextPct && (
            <p className="mt-1 text-[11px] text-[color:rgba(11,11,11,0.5)]">
              Prochain palier de titre vers environ +{nextPct} % vs médiane (encore ~{nextPct - inseeSalaryGame.pctVsMedian} points).
            </p>
          )}
          <FrProgressBar netMonthly={inseeSalaryGame.netMonthlyEstimated} inseeMedian={inseeSalaryGame.inseeMedianNetMonthly} />
        </div>
      )}
    </div>
  );
}
