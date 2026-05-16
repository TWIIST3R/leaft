"use client";

import type { TalentMarketBenchmarkRow } from "@/lib/talent/refresh-talent-market-benchmark";
import { parseSearchKeywordsUsed } from "@/lib/talent/refresh-talent-market-benchmark";
import { MarketOffersTeamRail, type MarketTeamPeer } from "@/components/talent/market-offers-team-rail";
import { SearchKeywordsInfo } from "@/components/talent/search-keywords-info";

export function TalentMarketOffersCard({
  annualSalaryBrut,
  hasdataConfigured,
  talentMarketBenchmark,
  salaryVisible,
  currentEmployeeId,
  marketTeamPeers,
}: {
  annualSalaryBrut: number | null;
  hasdataConfigured: boolean;
  talentMarketBenchmark: TalentMarketBenchmarkRow | null;
  salaryVisible: boolean;
  currentEmployeeId: string;
  marketTeamPeers: MarketTeamPeer[];
}) {
  const salary = annualSalaryBrut != null ? Number(annualSalaryBrut) : null;
  const m = talentMarketBenchmark;
  const p25 = m?.p25_annual != null ? Number(m.p25_annual) : null;
  const p50 = m?.p50_annual != null ? Number(m.p50_annual) : null;
  const p75 = m?.p75_annual != null ? Number(m.p75_annual) : null;
  const showOffersRail = m != null && m.sample_size > 0 && p25 != null && p50 != null && p75 != null;
  const keywordsUsed = parseSearchKeywordsUsed(m?.search_keywords_used ?? null);

  return (
    <div className="rounded-3xl border border-[#c8d4c8] bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
            Comparatif marché (offres d&apos;emploi)
          </p>
          <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.6)]">
            Estimation à partir des annonces publiées sur <strong>Indeed</strong> et <strong>Glassdoor</strong> en France.
          </p>
        </div>
        {hasdataConfigured && m && (
          <SearchKeywordsInfo
            keywords={keywordsUsed}
            referenceTitle={m.search_keyword}
            location={m.search_location}
            fetchedAt={m.fetched_at}
          />
        )}
      </div>
      {!hasdataConfigured && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Le comparatif marché n&apos;est pas disponible pour le moment.
        </p>
      )}
      {hasdataConfigured && !m && salary != null && (
        <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.55)]">
          Mise à jour en cours… Rechargez la page dans quelques instants si besoin.
        </p>
      )}
      {hasdataConfigured && m?.fetch_error && m.sample_size === 0 && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {m.fetch_error}
        </p>
      )}
      {hasdataConfigured && m?.fetch_error && m.sample_size > 0 && (
        <p className="mt-2 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
          {m.fetch_error}
        </p>
      )}

      {showOffersRail && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-3">
              <p className="text-[10px] font-semibold uppercase text-[color:rgba(11,11,11,0.45)]">Fourchette basse</p>
              <p className="mt-1 text-base font-semibold text-[var(--text)]">{Math.round(p25!).toLocaleString("fr-FR")} €</p>
              <p className="mt-0.5 text-[10px] text-[color:rgba(11,11,11,0.45)]">brut annuel</p>
            </div>
            <div className="rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/8 p-3">
              <p className="text-[10px] font-semibold uppercase text-[color:rgba(11,11,11,0.45)]">Médiane du marché</p>
              <p className="mt-1 text-base font-semibold text-[var(--text)]">{Math.round(p50!).toLocaleString("fr-FR")} €</p>
              <p className="mt-0.5 text-[10px] text-[color:rgba(11,11,11,0.45)]">brut annuel</p>
            </div>
            <div className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-3">
              <p className="text-[10px] font-semibold uppercase text-[color:rgba(11,11,11,0.45)]">Fourchette haute</p>
              <p className="mt-1 text-base font-semibold text-[var(--text)]">{Math.round(p75!).toLocaleString("fr-FR")} €</p>
              <p className="mt-0.5 text-[10px] text-[color:rgba(11,11,11,0.45)]">brut annuel</p>
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
        <div className="mt-4 rounded-xl border border-[#e2e7e2] bg-[#f8faf8] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Par rapport au marché</p>
          <p className="mt-1 text-2xl font-bold text-[var(--brand)]">{m.market_compa_pct} %</p>
          <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.6)]">
            Votre salaire brut annuel comparé à la médiane observée sur les offres agrégées.
            {m.position_vs_market ? ` Vous êtes ${m.position_vs_market}.` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
