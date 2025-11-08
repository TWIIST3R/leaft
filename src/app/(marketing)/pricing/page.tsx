import { Hero } from "@/components/marketing/hero";

export const metadata = {
  title: "Leaft – Tarifs",
  description:
    "Découvrez la tarification Leaft : formules mensuelles et annuelles pour structurer vos politiques salariales.",
};

const plans = [
  {
    name: "1 – 5 collaborateurs",
    price: "9 € / employé / mois",
    fixed: "49 € / mois",
    details: "Idéal pour démarrer la structuration des grilles et suivre les entretiens.",
  },
  {
    name: "6 – 19 collaborateurs",
    price: "8 € / employé / mois",
    fixed: "79 € / mois",
    details: "Balance parfaite entre visibilité rémunération et pilotage People.",
  },
  {
    name: "20 – 99 collaborateurs",
    price: "7 € / employé / mois",
    fixed: "99 € / mois",
    details: "Process complets, données marché et organigramme automatique.",
  },
  {
    name: "100+ collaborateurs",
    price: "6 € / employé / mois",
    fixed: "119 € / mois",
    details: "Accompagnement dédié, exports avancés et gouvernance multi-organisations.",
  },
];

export default function PricingPage() {
  return (
    <main className="bg-muted">
      <section className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-20 sm:px-10 lg:px-16">
        <Hero
          eyebrow="Tarification Leaft"
          title="Des plans transparents pour accompagner la croissance de votre entreprise."
          description={
            <>
              Choisissez la facturation mensuelle ou annuelle (2 mois offerts) et gardez une vision claire des coûts :
              <strong> Total = Forfait + (Employés × Prix/emp)</strong>.
            </>
          }
          ctas={[
            { href: "/contact", label: "Demander un devis", variant: "primary" },
            { href: "/contact", label: "Discuter avec nous", variant: "secondary" },
          ]}
        />

        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-[var(--radius)] border border-border bg-white p-6 shadow-[var(--shadow)]">
              <h2 className="text-xl font-semibold text-[var(--text)]">{plan.name}</h2>
              <p className="mt-2 text-sm font-medium uppercase tracking-wide text-[color:rgba(11,11,11,0.64)]">{plan.price}</p>
              <p className="text-sm text-[color:rgba(11,11,11,0.64)]">+ {plan.fixed}</p>
              <p className="mt-4 text-sm leading-relaxed text-[color:rgba(11,11,11,0.7)]">{plan.details}</p>
              <p className="mt-4 text-sm font-medium text-[color:rgba(11,11,11,0.76)]">
                Annuel : Forfait mensuel ×10 + (Employés × Prix/emp mensuel ×10)
              </p>
            </article>
          ))}
        </div>

        <div className="rounded-[var(--radius)] border border-dashed border-[color:rgba(9,82,40,0.25)] bg-white/70 p-6 text-sm text-[color:rgba(11,11,11,0.72)]">
          Vous avez des besoins spécifiques (multi-entités, politiques pays, intégrations SIRH) ?
          <br />
          Contactez-nous pour un accompagnement dédié et un devis personnalisé.
        </div>
      </section>
    </main>
  );
}

