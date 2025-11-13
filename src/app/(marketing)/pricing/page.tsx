import { Hero } from "@/components/marketing/hero";
import { PricingPageClient } from "./pricing-client";

export type PricingPlan = {
  range: string;
  monthly: {
    perSeat: string;
    suffix: string;
    fixed: string;
    ctaLabel: string;
    features: string[];
  };
  annual: {
    perSeat: string;
    suffix: string;
    fixed: string;
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
    monthly: {
      perSeat: "9€",
      suffix: "/mois / talent",
      fixed: "+ 49 € d’abonnement mensuel",
      ctaLabel: "Essai gratuit",
      features: [
        "Grilles salariales et compa-ratio",
        "Jusqu’à 3 comptes utilisateurs",
        "Suivi des entretiens & exports CSV",
        "Benchmarks HasData/Indeed",
        "Support email",
      ],
    },
    annual: {
      perSeat: "90€",
      suffix: "/an / talent",
      fixed: "+ 490 € d’abonnement annuel",
      ctaLabel: "Essai gratuit",
      features: [
        "Grilles salariales et compa-ratio",
        "Jusqu’à 3 comptes utilisateurs",
        "Suivi des entretiens & exports CSV",
        "Benchmarks HasData/Indeed",
        "Support email",
      ],
    },
  },
  {
    range: "6 à 19 talents",
    monthly: {
      perSeat: "8€",
      suffix: "/mois / talent",
      fixed: "+ 79 € d’abonnement mensuel",
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
      fixed: "+ 790 € d’abonnement annuel",
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
    monthly: {
      perSeat: "7€",
      suffix: "/mois / talent",
      fixed: "+ 99 € d’abonnement mensuel",
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
      fixed: "+ 990 € d’abonnement annuel",
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
    monthly: {
      perSeat: "6€",
      suffix: "/mois / talent",
      fixed: "+ 119 € d’abonnement mensuel",
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
      fixed: "+ 1 190 € d’abonnement annuel",
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
  return <PricingPageClient plans={plans} />;
}

