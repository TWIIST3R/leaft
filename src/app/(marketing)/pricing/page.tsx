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

const STARTER_FEATURES = [
  "Grilles de salaires par métier et niveau",
  "Positionnement de chacun (compa-ratio)",
  "Suivi des entretiens et augmentations",
  "Organigramme automatique",
  "Espace personnel pour chaque collaborateur",
  "Repères marché et support par email",
];

const GROWTH_FEATURES = [
  "Tout ce qui est inclus dans l'offre précédente",
  "Statistiques d'équité (parité, écarts, niveaux)",
  "Comptes RH et managers illimités",
  "Exports CSV & PDF de vos données",
  "Accompagnement à la prise en main",
];

const SCALE_FEATURES = [
  "Tout ce qui est inclus dans l'offre précédente",
  "Tableaux de bord adaptés à votre organisation",
  "Gestion fine des rôles et permissions",
  "Interlocuteur dédié à vos côtés",
  "Support prioritaire",
];

const ENTERPRISE_FEATURES = [
  "Tout ce qui est inclus dans l'offre précédente",
  "Gouvernance multi-entités",
  "Plan de déploiement sur mesure",
  "Accompagnement dédié au lancement",
  "Support prioritaire renforcé",
];

const plans: PricingPlan[] = [
  {
    range: "1 à 5 talents",
    annualDiscountPercent: 17, // 9€/mois × 12 = 108€, 90€/an → économie 17%
    monthly: { perSeat: "9€", suffix: "/mois / talent", ctaLabel: "Choisir ce plan", features: STARTER_FEATURES },
    annual: { perSeat: "90€", suffix: "/an / talent", ctaLabel: "Choisir ce plan", features: STARTER_FEATURES },
  },
  {
    range: "6 à 19 talents",
    annualDiscountPercent: 17,
    monthly: { perSeat: "8€", suffix: "/mois / talent", ctaLabel: "Choisir ce plan", features: GROWTH_FEATURES },
    annual: { perSeat: "80€", suffix: "/an / talent", ctaLabel: "Choisir ce plan", features: GROWTH_FEATURES },
  },
  {
    range: "20 à 99 talents",
    annualDiscountPercent: 17,
    monthly: { perSeat: "7€", suffix: "/mois / talent", ctaLabel: "Choisir ce plan", features: SCALE_FEATURES },
    annual: { perSeat: "70€", suffix: "/an / talent", ctaLabel: "Choisir ce plan", features: SCALE_FEATURES },
  },
  {
    range: "100+ talents",
    annualDiscountPercent: 17,
    monthly: { perSeat: "6€", suffix: "/mois / talent", ctaLabel: "Choisir ce plan", features: ENTERPRISE_FEATURES },
    annual: { perSeat: "60€", suffix: "/an / talent", ctaLabel: "Choisir ce plan", features: ENTERPRISE_FEATURES },
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

