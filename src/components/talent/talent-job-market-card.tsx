"use client";

import { nextBucketThresholdPct } from "@/lib/talent/fr-salary-game";
import type { TalentMarketBenchmarkRow } from "@/lib/talent/refresh-talent-market-benchmark";
import { InseeSalaryCurveChart } from "@/components/talent/insee-salary-curve-chart";
import { MarketOffersTeamRail, type MarketTeamPeer } from "@/components/talent/market-offers-team-rail";

export type InseeSalaryGameUi = {
  netMonthlyEstimated: number;
  inseeMedianNetMonthly: number;
  pctVsMedian: number;
  approximatePercentile: number;
  game: { bucket: number; title: string; emoji: string; blurb: string };
};

export function TalentJobMarketCard({
  annualSalaryBrut,
  hasdataConfigured,
  talentMarketBenchmark,
  inseeSalaryGame,
  salaryVisible,
  currentEmployeeId,
  marketTeamPeers,
  firstName,
  lastName,
  avatarUrl,
}: {
  annualSalaryBrut: number | null;
  hasdataConfigured: boolean;
  talentMarketBenchmark: TalentMarketBenchmarkRow | null;
  inseeSalaryGame: InseeSalaryGameUi | null;
  salaryVisible: boolean;
  currentEmployeeId: string;
  marketTeamPeers: MarketTeamPeer[];
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}) {
  const salary = annualSalaryBrut != null ? Number(annualSalaryBrut) : null;
  const m = talentMarketBenchmark;
  const game = inseeSalaryGame?.game;
  const nextPct = game ? nextBucketThresholdPct(game.bucket) : null;

  const p25 = m?.p25_annual != null ? Number(m.p25_annual) : null;
  const p50 = m?.p50_annual != null ? Number(m.p50_annual) : null;
  const p75 = m?.p75_annual != null ? Number(m.p75_annual) : null;
  const showOffersRail = m != null && m.sample_size > 0 && p25 != null && p50 != null && p75 != null;

  return (
    <div className="mt-4 space-y-6">
      <div className="rounded-2xl border border-[#c8d4c8] bg-[#fbfcfb] p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">Marché emploi (offres — HasData)</p>
        <p className="mt-1 text-[11px] text-[color:rgba(11,11,11,0.55)]">
          P25, P50 et P75 sont calculés sur les <strong>salaires annuels extraits des annonces</strong> (Indeed + Glassdoor), mis en cache côté serveur. Ce bloc ne reprend pas les données Insee.
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
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            {m.fetch_error}
          </p>
        )}
        {hasdataConfigured && m?.fetch_error && m.sample_size > 0 && (
          <p className="mt-2 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-950">
            Alerte : {m.fetch_error} — les percentiles ci-dessous utilisent toutefois l&apos;échantillon disponible.
          </p>
        )}
        {m && (m.search_keyword || m.search_location) && (
          <p className="mt-2 text-[11px] text-[color:rgba(11,11,11,0.5)]">
            Dernière recherche : « {m.search_keyword} » — {m.search_location}
            {m.fetched_at ? ` · ${new Date(m.fetched_at).toLocaleDateString("fr-FR")}` : ""}
          </p>
        )}
        {m && (m.indeed_count > 0 || m.glassdoor_count > 0) && (
          <p className="mt-1 text-[11px] text-[color:rgba(11,11,11,0.45)]">
            Offres analysées : Indeed {m.indeed_count} · Glassdoor {m.glassdoor_count} — salaires retenus : {m.sample_size}
          </p>
        )}

        {showOffersRail && (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#e2e7e2] bg-white p-3">
                <p className="text-[10px] font-semibold uppercase text-[color:rgba(11,11,11,0.45)]">P25 offres</p>
                <p className="mt-1 text-base font-semibold text-[var(--text)]">{Math.round(p25!).toLocaleString("fr-FR")} €</p>
                <p className="mt-0.5 text-[10px] text-[color:rgba(11,11,11,0.45)]">Quartile bas annonces</p>
              </div>
              <div className="rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/8 p-3">
                <p className="text-[10px] font-semibold uppercase text-[color:rgba(11,11,11,0.45)]">P50 offres (médiane)</p>
                <p className="mt-1 text-base font-semibold text-[var(--text)]">{Math.round(p50!).toLocaleString("fr-FR")} €</p>
                <p className="mt-0.5 text-[10px] text-[color:rgba(11,11,11,0.45)]">Référence marché offres</p>
              </div>
              <div className="rounded-xl border border-[#e2e7e2] bg-white p-3">
                <p className="text-[10px] font-semibold uppercase text-[color:rgba(11,11,11,0.45)]">P75 offres</p>
                <p className="mt-1 text-base font-semibold text-[var(--text)]">{Math.round(p75!).toLocaleString("fr-FR")} €</p>
                <p className="mt-0.5 text-[10px] text-[color:rgba(11,11,11,0.45)]">Quartile haut annonces</p>
              </div>
            </div>
            <MarketOffersTeamRail
              p25={p25!}
              p50={p50!}
              p75={p75!}
              currentEmployeeId={currentEmployeeId}
              teamPeers={marketTeamPeers}
              salaryVisible={salaryVisible}
            />
          </>
        )}

        {salary != null && m?.market_compa_pct != null && m.sample_size > 0 && (
          <div className="mt-4 rounded-xl border border-[#e2e7e2] bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Compa-ratio vs médiane offres (P50)</p>
            <p className="mt-1 text-2xl font-bold text-[var(--brand)]">{m.market_compa_pct} %</p>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.6)]">
              Ton salaire annuel brut par rapport à la médiane (P50) des salaires annuels observés dans les offres agrégées.
              {m.position_vs_market ? ` Tu es ${m.position_vs_market}.` : ""}
            </p>
          </div>
        )}
      </div>

      {salary != null && inseeSalaryGame && (
        <div className="rounded-2xl border border-[#dfe6df] bg-gradient-to-br from-white to-[#f4f7f4] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.55)]">
            Référence France (Insee — hors offres / hors HasData)
          </p>
          <p className="mt-1 text-[11px] text-[color:rgba(11,11,11,0.52)]">
            Courbe indicative (secteur privé, net mensuel). Ta photo se place sur cette distribution à partir de ton brut estimé en net.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
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
            Net mensuel estimé : {inseeSalaryGame.netMonthlyEstimated.toLocaleString("fr-FR")} € — position indicative : ~{inseeSalaryGame.approximatePercentile}e percentile (approximation).
          </p>
          {nextPct != null && inseeSalaryGame.pctVsMedian < nextPct && (
            <p className="mt-1 text-[11px] text-[color:rgba(11,11,11,0.5)]">
              Prochain palier de titre vers environ +{nextPct} % vs médiane (encore ~{nextPct - inseeSalaryGame.pctVsMedian} points).
            </p>
          )}
          <InseeSalaryCurveChart
            netMonthlyEstimated={inseeSalaryGame.netMonthlyEstimated}
            firstName={firstName}
            lastName={lastName}
            avatarUrl={avatarUrl}
          />
          <p className="mt-2 text-[10px] text-[color:rgba(11,11,11,0.45)]">
            Estimation net à partir du brut (coefficient indicatif). Forme de courbe : illustration stylisée d&apos;après les ordres de grandeur publics Insee (secteur privé, 2024) — non confondre avec le marché offres ci-dessus.
          </p>
        </div>
      )}
    </div>
  );
}
