"use client";

import type { TalentComparatifData } from "@/lib/talent/talent-comparatif-types";
import { TalentMarketOffersCard } from "@/components/talent/talent-market-offers-card";
import { TalentFranceReferenceCard } from "@/components/talent/talent-france-reference-card";

export function ComparatifClient({ data }: { data: TalentComparatifData }) {
  const { employee } = data;

  if (!data.salaryVisible) {
    return (
      <div className="rounded-3xl border border-[#e2e7e2] bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--text)]">Comparatif</h1>
        <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
          La transparence salariale n&apos;est pas activée pour votre organisation. Contactez votre RH pour accéder aux comparatifs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 px-4 py-4 sm:px-6">
        <h1 className="text-2xl font-semibold text-[var(--brand)]">Comparatif</h1>
        <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.7)]">
          Marché des offres, référence France et positionnement par rapport à votre équipe.
        </p>
      </section>

      <section data-tour="talent-marche-emploi">
        <TalentMarketOffersCard
          annualSalaryBrut={employee.annual_salary_brut}
          hasdataConfigured={data.hasdataConfigured}
          talentMarketBenchmark={data.talentMarketBenchmark}
          salaryVisible={data.salaryVisible}
          disclosureMode={data.salaryDisclosureMode}
          currentEmployeeId={employee.id}
          marketTeamPeers={data.marketTeamPeers}
        />
      </section>

      {data.inseeSalaryGame && (
        <section data-tour="talent-reference-france">
          <TalentFranceReferenceCard
            inseeSalaryGame={data.inseeSalaryGame}
            firstName={employee.first_name}
            lastName={employee.last_name}
            avatarUrl={employee.avatar_url}
          />
        </section>
      )}
    </div>
  );
}
