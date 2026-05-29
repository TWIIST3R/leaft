"use client";

import {
  parseSearchKeywordsUsed,
  type TalentMarketBenchmarkRow,
} from "@/lib/talent/talent-market-benchmark-shared";
import type { SalaryDisclosureMode } from "@/lib/organization/salary-transparency-shared";
import type { MarketTeamPeer } from "@/lib/talent/market-team-peer-types";
import { MarketOffersTeamRail } from "@/components/talent/market-offers-team-rail";
import { SearchKeywordsInfo } from "@/components/talent/search-keywords-info";

export function TalentMarketOffersCard({
  annualSalaryBrut,
  hasdataConfigured,
  talentMarketBenchmark,
  salaryVisible,
  disclosureMode,
  currentEmployeeId,
  marketTeamPeers,
}: {
  annualSalaryBrut: number | null;
  hasdataConfigured: boolean;
  talentMarketBenchmark: TalentMarketBenchmarkRow | null;
  salaryVisible: boolean;
  disclosureMode: SalaryDisclosureMode;
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
    <div className="overflow-hidden rounded-3xl border border-[#063d1f]/20 bg-white shadow-[0_20px_50px_rgba(9,82,40,0.12)]">
      <div className="border-b border-[#063d1f]/10 bg-[var(--brand)] px-4 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/85">
              Comparatif marché (offres d&apos;emploi)
            </p>
            <p className="mt-1 text-sm text-white/80">
              Estimation à partir des annonces <strong className="text-white">Indeed</strong> et{" "}
              <strong className="text-white">Glassdoor</strong> en France.
            </p>
          </div>
          {hasdataConfigured && m && (
            <SearchKeywordsInfo
              keywords={keywordsUsed}
              referenceTitle={m.search_keyword}
              location={m.search_location}
              fetchedAt={m.fetched_at}
              onDarkHeader
            />
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {!hasdataConfigured && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Le comparatif marché n&apos;est pas disponible pour le moment.
          </p>
        )}
        {hasdataConfigured && !m && salary != null && (
          <p className="text-sm text-[color:rgba(11,11,11,0.55)]">
            Mise à jour en cours… Rechargez la page dans quelques instants si besoin.
          </p>
        )}
        {hasdataConfigured && m?.fetch_error && m.sample_size === 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {m.fetch_error}
          </p>
        )}
        {hasdataConfigured && m?.fetch_error && m.sample_size > 0 && (
          <p className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
            {m.fetch_error}
          </p>
        )}

        {showOffersRail && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-3">
                <p className="text-[10px] font-semibold uppercase text-[color:rgba(11,11,11,0.45)]">Fourchette basse</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-[var(--text)]">{Math.round(p25!).toLocaleString("fr-FR")} €</p>
                <p className="mt-0.5 text-[10px] text-[color:rgba(11,11,11,0.45)]">brut annuel</p>
              </div>
              <div className="rounded-xl border-2 border-[var(--brand)] bg-[var(--brand)] p-3 text-white shadow-md">
                <p className="text-[10px] font-semibold uppercase text-white/80">Médiane du marché</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{Math.round(p50!).toLocaleString("fr-FR")} €</p>
                <p className="mt-0.5 text-[10px] text-white/75">brut annuel</p>
              </div>
              <div className="rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-3">
                <p className="text-[10px] font-semibold uppercase text-[color:rgba(11,11,11,0.45)]">Fourchette haute</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-[var(--text)]">{Math.round(p75!).toLocaleString("fr-FR")} €</p>
                <p className="mt-0.5 text-[10px] text-[color:rgba(11,11,11,0.45)]">brut annuel</p>
              </div>
            </div>

            {salary != null && m?.market_compa_pct != null && (
              <div className="mt-4 rounded-xl border border-[var(--brand)]/25 bg-[var(--brand)]/8 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">Par rapport au marché</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--brand)]">{m.market_compa_pct} %</p>
                <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
                  Votre salaire brut annuel vs la médiane des offres agrégées.
                  {m.position_vs_market ? ` Vous êtes ${m.position_vs_market}.` : ""}
                </p>
              </div>
            )}

            <div className="mt-4 rounded-2xl bg-[var(--brand)] p-4">
              <MarketOffersTeamRail
                p25={p25!}
                p50={p50!}
                p75={p75!}
                currentEmployeeId={currentEmployeeId}
                teamPeers={marketTeamPeers}
                salaryVisible={salaryVisible}
                disclosureMode={disclosureMode}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
