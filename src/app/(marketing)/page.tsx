import Link from "next/link";
import { Hero } from "@/components/marketing/hero";
import { ProductShowcase } from "@/components/marketing/product-showcase";
import { CalendlyEmbed } from "@/components/marketing/calendly-embed";

export const metadata = {
  title: "Leaft – Des salaires justes, une équipe qui progresse",
  description:
    "Leaft aide les dirigeants à construire des salaires équitables, suivre la progression de chaque collaborateur et instaurer une vraie transparence. Sans tableur, sans casse-tête.",
};

const benefits = [
  {
    title: "Des salaires justes, sans favoritisme",
    description:
      "Définissez des fourchettes claires par métier et par niveau. Chacun sait où il se situe et pourquoi. Fini les décisions au feeling.",
    icon: (
      <path d="M12 3v18M5 8h14M7 12h10M9 16h6" />
    ),
  },
  {
    title: "Une progression visible pour chacun",
    description:
      "Entretiens, augmentations, évolutions : tout est historisé. Vos collaborateurs voient leur trajectoire et se projettent dans l'entreprise.",
    icon: <path d="M4 19l5-5 4 4 7-7M14 7h6v6" />,
  },
  {
    title: "La confiance comme culture",
    description:
      "La transparence n'est plus un risque mais un atout : elle renforce l'engagement, réduit les départs et attire les meilleurs talents.",
    icon: <path d="M12 21s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 11c0 5.5-7 10-7 10z" />,
  },
];

const steps = [
  {
    n: "1",
    title: "Importez votre équipe",
    text: "Ajoutez vos collaborateurs et leurs postes. L'organigramme et les niveaux se construisent automatiquement.",
  },
  {
    n: "2",
    title: "Structurez vos grilles",
    text: "Définissez vos fourchettes de salaire par niveau, comparez-les au marché et repérez les écarts à corriger.",
  },
  {
    n: "3",
    title: "Pilotez en confiance",
    text: "Préparez vos entretiens, décidez des augmentations sur des bases claires et donnez à chacun de la visibilité.",
  },
];

export default function Home() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[color:rgba(9,82,40,0.06)] via-white to-muted" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-16 sm:px-10 lg:grid-cols-2 lg:gap-10 lg:px-16 lg:pb-24 lg:pt-24">
          <Hero
            eyebrow="Rémunération équitable & transparente"
            title="Des salaires justes. Une équipe qui progresse."
            description="Leaft aide les dirigeants à construire des grilles de salaires équitables, à suivre la progression de chacun et à instaurer une vraie transparence — sans tableur ni casse-tête."
            ctas={[
              { href: "/contact", label: "Demander une démo", variant: "primary" },
              { href: "/pricing", label: "Voir les tarifs", variant: "secondary" },
            ]}
          />
          <div className="lg:pl-4">
            <ProductShowcase />
          </div>
        </div>
      </section>

      {/* BANDEAU CONFIANCE */}
      <section className="border-y border-border bg-muted">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-10 text-center sm:px-10 lg:flex-row lg:justify-between lg:px-16 lg:text-left">
          <p className="max-w-md text-sm font-medium text-[color:rgba(11,11,11,0.6)]">
            Pensé pour les PME et scale-ups qui veulent gérer la carrière de leurs équipes avec éthique.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              { value: "100%", label: "des salaires lisibles" },
              { value: "−1 outil", label: "fini les tableurs" },
              { value: "3 espaces", label: "RH, managers, employés" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-semibold text-[var(--brand)]">{s.value}</p>
                <p className="text-xs uppercase tracking-wide text-[color:rgba(11,11,11,0.55)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APERCU PRODUIT (texte) */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1 text-sm font-medium text-[color:var(--brand)] shadow-[var(--shadow)]">
            Un aperçu de votre futur outil
          </span>
          <h2 className="mt-5 text-3xl font-semibold text-[var(--text)] sm:text-4xl">
            Tout ce dont vous avez besoin, au même endroit
          </h2>
          <p className="mt-4 text-pretty text-lg text-[color:rgba(11,11,11,0.7)]">
            Cliquez sur les onglets de l'aperçu ci-dessus : grilles de salaires, simulateur d'augmentation,
            organigramme et repères marché. C'est exactement ce que vous retrouverez dans votre espace.
          </p>
        </div>
      </section>

      {/* BENEFICES */}
      <section className="bg-muted">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 lg:px-16">
          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((b) => (
              <article key={b.title} className="rounded-[var(--radius)] border border-border bg-white p-7 shadow-[var(--shadow)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:rgba(9,82,40,0.1)] text-[var(--brand)]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {b.icon}
                  </svg>
                </span>
                <h3 className="mt-5 text-lg font-semibold text-[var(--text)]">{b.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[color:rgba(11,11,11,0.7)]">{b.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-[var(--text)] sm:text-4xl">Simple à mettre en place</h2>
          <p className="mt-4 text-lg text-[color:rgba(11,11,11,0.7)]">
            En quelques étapes, vous passez d'un tableur opaque à une gestion claire et partagée.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-[var(--radius)] border border-border bg-white p-7 shadow-[var(--shadow)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-white">
                {s.n}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-[var(--text)]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:rgba(11,11,11,0.7)]">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CITATION / EQUITE */}
      <section className="bg-[var(--brand)] text-white">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:px-10 lg:px-16">
          <p className="text-2xl font-medium leading-relaxed sm:text-3xl">
            « La transparence salariale n'est pas un risque. C'est le moyen le plus efficace de gagner la confiance de
            son équipe et de retenir ses meilleurs talents. »
          </p>
          <p className="mt-6 text-sm font-medium text-white/70">Notre conviction chez Leaft</p>
        </div>
      </section>

      {/* CALENDLY */}
      <section className="mx-auto max-w-5xl px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1 text-sm font-medium text-[color:var(--brand)] shadow-[var(--shadow)]">
            Démo personnalisée
          </span>
          <h2 className="mt-5 text-3xl font-semibold text-[var(--text)] sm:text-4xl">
            Réservez votre démo en 30 minutes
          </h2>
          <p className="mt-4 text-lg text-[color:rgba(11,11,11,0.7)]">
            Choisissez le créneau qui vous arrange. On vous montre l'outil en conditions réelles, adapté à votre
            contexte.
          </p>
        </div>
        <CalendlyEmbed />
      </section>

      {/* CTA FINAL */}
      <section className="bg-muted">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:px-10 lg:px-16">
          <div className="rounded-[24px] border border-border bg-white p-10 text-center shadow-[var(--shadow)]">
            <h2 className="text-3xl font-semibold text-[var(--text)] sm:text-4xl">
              Prêt à offrir plus de clarté à votre équipe ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[color:rgba(11,11,11,0.7)]">
              Rejoignez les entreprises qui font de l'équité salariale un avantage compétitif.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-base font-semibold text-white transition hover:brightness-110"
              >
                Découvrir les tarifs
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-border bg-white px-6 py-3 text-base font-semibold text-[var(--text)] transition hover:bg-muted"
              >
                Parler à un expert
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
