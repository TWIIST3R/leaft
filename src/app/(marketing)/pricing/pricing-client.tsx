"use client";

import { useSearchParams } from "next/navigation";
import { Hero } from "@/components/marketing/hero";
import { PricingTable } from "./pricing-table";
import type { PricingPlan } from "./page";

export function PricingPageClient({ plans }: { plans: PricingPlan[] }) {
  const searchParams = useSearchParams();
  const onboarding = searchParams.get("onboarding") === "true";
  const subscriptionRequired = searchParams.get("subscription_required") === "true";

  return (
    <main className="bg-[var(--brand)] text-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-20 sm:px-10 lg:px-16">
        <Hero
          eyebrow="Tarification Leaft"
          title="Des plans transparents pour accompagner la croissance de votre entreprise."
          description={
            onboarding
              ? "Choisissez votre plan pour commencer à utiliser Leaft."
              : subscriptionRequired
                ? "Un abonnement actif est requis pour accéder au dashboard."
                : "Des tarifs accessibles pour accompagner vos talents, sans compromis sur la qualité."
          }
          ctas={onboarding || subscriptionRequired ? [] : [{ href: "/contact", label: "Parler à un expert", variant: "primary" }]}
          align="center"
          tone="dark"
        />

        {onboarding && (
          <div className="rounded-[var(--radius)] border border-white/30 bg-white/10 p-4 text-sm text-white">
            <p className="font-semibold">Bienvenue !</p>
            <p className="mt-1 text-white/90">
              Sélectionnez votre plan d'abonnement pour accéder à votre dashboard Leaft.
            </p>
          </div>
        )}

        <PricingTable plans={plans} />

        <div className="rounded-2xl border border-white/25 bg-white/15 p-8 text-sm text-white shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          <p className="font-semibold text-white">Pourquoi choisir l'abonnement annuel ?</p>
          <ul className="mt-3 space-y-1.5 text-white/95">
            <li>• <strong>Économisez 17%</strong> : équivalent à 2 mois offerts par rapport au mensuel</li>
            <li>• Même prix au talent, facturé une fois par an</li>
            <li>• Idéal pour anticiper vos coûts et simplifier la gestion</li>
          </ul>
          <p className="mt-4 text-white/80">
            Facturation annuelle : nombre de talents × prix/talent annuel. Pour un plan supérieur à 200 talents ou des besoins avancés (multi-entités, intégrations SIRH), contactez-nous pour un accompagnement dédié.
          </p>
        </div>
      </section>
    </main>
  );
}

