 "use client";

import { useState } from "react";
import { Hero } from "@/components/marketing/hero";

type BillingCycle = "monthly" | "annual";

type Plan = {
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

const plans: Plan[] = [
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
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  return (
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

        <div className="flex justify-center">
          <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-4 py-2 transition ${
                billing === "monthly" ? "bg-white text-[var(--brand)]" : "text-white/80 hover:text-white"
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={`rounded-full px-4 py-2 transition ${
                billing === "annual" ? "bg-white text-[var(--brand)]" : "text-white/80 hover:text-white"
              }`}
            >
              Annuel
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => {
            const data = plan[billing];
            return (
              <article
                key={plan.range}
                className="flex h-full flex-col rounded-[40px] border border-white/20 bg-white p-8 text-left text-[var(--text)] shadow-[0_20px_60px_rgba(9,82,40,0.25)]"
              >
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:rgba(9,82,40,0.75)]">
                  {plan.range}
                </h2>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold text-[var(--brand)]">{data.perSeat}</span>
                  <span className="text-sm font-medium text-[color:rgba(11,11,11,0.65)]">{data.suffix}</span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">{data.fixed}</p>
                <button
                  type="button"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  {data.ctaLabel}
                </button>
                <div className="mt-6 space-y-3 text-sm text-[color:rgba(11,11,11,0.7)]">
                  <p className="font-semibold">Est inclus :</p>
                  <ul className="space-y-2">
                    {data.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] text-white">
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>

        <div className="rounded-[var(--radius)] border border-white/20 bg-white/10 p-8 text-sm text-white">
          Facturation annuelle : forfait mensuel ×10 + (Nombre de talents × Prix/talent mensuel ×10). Pour un plan
          supérieur à 200 talents ou des besoins avancés (multi-entités, intégrations SIRH), contactez-nous pour un
          accompagnement dédié.
        </div>
      </section>
    </main>
  );
}

