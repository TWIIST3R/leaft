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

        <div className="rounded-[var(--radius)] border border-white/20 bg-white/10 p-8 text-sm text-white">
          Facturation annuelle : Nombre de talents × Prix/talent annuel (économisez 2 mois par rapport à la facturation mensuelle). Pour un plan
          supérieur à 200 talents ou des besoins avancés (multi-entités, intégrations SIRH), contactez-nous pour un
          accompagnement dédié.
        </div>
      </section>
    </main>
  );
}

