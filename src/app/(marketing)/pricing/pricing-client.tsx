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
          eyebrow="Tarifs simples et transparents"
          title="Un prix par collaborateur. Tout est inclus."
          description={
            onboarding
              ? "Choisissez votre plan pour commencer à utiliser Leaft."
              : subscriptionRequired
                ? "Un abonnement actif est requis pour accéder au dashboard."
                : "Vous payez uniquement pour les talents que vous suivez. Pas de frais cachés, et plus c'est grand, moins c'est cher."
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
            <li>• <strong>Économisez 17 %</strong> : l'équivalent de 2 mois offerts par rapport au mensuel</li>
            <li>• Même prix au talent, facturé une fois par an</li>
            <li>• Idéal pour anticiper votre budget et simplifier la gestion</li>
          </ul>
          <p className="mt-4 text-white/80">
            Facturation annuelle : nombre de talents × prix annuel par talent. Pour une grande organisation
            (multi-entités) ou des besoins spécifiques, contactez-nous pour un accompagnement dédié.
          </p>
        </div>

        {/* FAQ */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              q: "Y a-t-il un engagement ?",
              a: "Non. Vous pouvez arrêter quand vous le souhaitez. L'abonnement mensuel est sans engagement, l'annuel vous fait économiser 17 %.",
            },
            {
              q: "Que se passe-t-il si mon équipe grandit ?",
              a: "Vous ajoutez des talents à tout moment. La facturation s'ajuste automatiquement au prorata, sans démarche compliquée.",
            },
            {
              q: "Mes données sont-elles en sécurité ?",
              a: "Vos données sont hébergées en Europe et protégées. Les salaires ne sont visibles que par les personnes autorisées (RH et managers).",
            },
            {
              q: "Les employés voient-ils les salaires des autres ?",
              a: "Non. Chaque collaborateur voit uniquement sa propre situation, sa fourchette et sa progression — jamais les salaires de ses collègues.",
            },
          ].map((item) => (
            <div key={item.q} className="rounded-2xl border border-white/25 bg-white/10 p-6">
              <p className="font-semibold text-white">{item.q}</p>
              <p className="mt-2 text-white/85">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

