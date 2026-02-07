import { Suspense } from "react";
import { Hero } from "@/components/marketing/hero";
import { PricingPageClient } from "./pricing-client";

export type PricingPlan = {
  range: string;
  /** Discount when choosing annual (e.g. 17 for 17%) */
  annualDiscountPercent: number;
  monthly: {
    perSeat: string;
    suffix: string;
    ctaLabel: string;
    features: string[];
  };
  annual: {
    perSeat: string;
    suffix: string;
    ctaLabel: string;
    features: string[];
  };
};

export const metadata = {
  title: "Leaft – Tarifs",
  description:
    "Découvrez la tarification Leaft : formules mensuelles et annuelles pour structurer vos politiques salariales.",
};

const plans: PricingPlan[] = [
  {
    range: "1 à 5 talents",
    annualDiscountPercent: 17, // 9€/mois × 12 = 108€, 90€/an → économie 17%
    monthly: {
      perSeat: "9€",
      suffix: "/mois / talent",
      ctaLabel: "Essai gratuit",
      features: [
        "Grilles salariales et compa-ratio",
        "Jusqu'à 3 comptes utilisateurs",
        "Suivi des entretiens & exports CSV",
        "Benchmarks HasData/Indeed",
        "Support email",
      ],
    },
    annual: {
      perSeat: "90€",
      suffix: "/an / talent",
      ctaLabel: "Essai gratuit",
      features: [
        "Grilles salariales et compa-ratio",
        "Jusqu'à 3 comptes utilisateurs",
        "Suivi des entretiens & exports CSV",
        "Benchmarks HasData/Indeed",
        "Support email",
      ],
    },
  },
  {
    range: "6 à 19 talents",
    annualDiscountPercent: 17,
    monthly: {
      perSeat: "8€",
      suffix: "/mois / talent",
      ctaLabel: "Essai gratuit",
      features: [
        "Toutes les fonctionnalités Starter",
        "Analytics People avancés",
        "Utilisateurs illimités",
        "Support multi-devises",
        "Documentation API",
      ],
    },
    annual: {
      perSeat: "80€",
      suffix: "/an / talent",
      ctaLabel: "Essai gratuit",
      features: [
        "Toutes les fonctionnalités Starter",
        "Analytics People avancés",
        "Utilisateurs illimités",
        "Support multi-devises",
        "Documentation API",
      ],
    },
  },
  {
    range: "20 à 99 talents",
    annualDiscountPercent: 17,
    monthly: {
      perSeat: "7€",
      suffix: "/mois / talent",
      ctaLabel: "Essai gratuit",
      features: [
        "Toutes les fonctionnalités Growth",
        "Automatisation organigramme & promotions",
        "Tableaux de bord personnalisables",
        "Intégration API workflows",
        "Customer Success dédié",
      ],
    },
    annual: {
      perSeat: "70€",
      suffix: "/an / talent",
      ctaLabel: "Essai gratuit",
      features: [
        "Toutes les fonctionnalités Growth",
        "Automatisation organigramme & promotions",
        "Tableaux de bord personnalisables",
        "Intégration API workflows",
        "Customer Success dédié",
      ],
    },
  },
  {
    range: "100+ talents",
    annualDiscountPercent: 17,
    monthly: {
      perSeat: "6€",
      suffix: "/mois / talent",
      ctaLabel: "Essai gratuit",
      features: [
        "Toutes les fonctionnalités Pro",
        "Gouvernance multi-organisations",
        "Plan de déploiement dédié",
        "SLA & support prioritaire",
        "Intégrations personnalisées",
      ],
    },
    annual: {
      perSeat: "60€",
      suffix: "/an / talent",
      ctaLabel: "Essai gratuit",
      features: [
        "Toutes les fonctionnalités Pro",
        "Gouvernance multi-organisations",
        "Plan de déploiement dédié",
        "SLA & support prioritaire",
        "Intégrations personnalisées",
      ],
    },
  },
];

export default function PricingPage() {
  return (
    <Suspense fallback={
      <main className="bg-[var(--brand)] text-white">
        <section className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-20 sm:px-10 lg:px-16">
          <Hero
            eyebrow="Tarification Leaft"
            title="Des plans transparents pour accompagner la croissance de votre entreprise."
            description="Des tarifs accessibles pour accompagner vos talents, sans compromis sur la qualité."
            ctas={[{ href: "/contact", label: "Parler à un expert", variant: "primary" }]}
            align="center"
            tone="dark"
          />
        </section>
      </main>
    }>
      <PricingPageClient plans={plans} />
    </Suspense>
  );
}

