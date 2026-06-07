import Link from "next/link";
import { Hero } from "@/components/marketing/hero";
import { HeroSimulator } from "@/components/marketing/hero-simulator";
import { SalaryGridDemo, OrgChartDemo, EquityDemo } from "@/components/marketing/feature-demos";
import { CalendlyEmbed } from "@/components/marketing/calendly-embed";
import { Reveal } from "@/components/marketing/reveal";

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
      <>
        <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="M7 21h10" />
        <path d="M12 3v18" />
        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
      </>
    ),
  },
  {
    title: "Une progression visible pour chacun",
    description:
      "Entretiens, augmentations, évolutions : tout est historisé. Vos collaborateurs voient leur trajectoire et se projettent dans l'entreprise.",
    icon: (
      <>
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </>
    ),
  },
  {
    title: "La confiance comme culture",
    description:
      "La transparence n'est plus un risque mais un atout : elle renforce l'engagement, réduit les départs et attire les meilleurs talents.",
    icon: (
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    ),
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

const checkIcon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export default function Home() {
  return (
    <main className="bg-white">
      {/* HERO — une seule feature : projeter une augmentation vs marché */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[color:rgba(9,82,40,0.1)] via-white to-muted" />
        <div className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-[color:rgba(9,82,40,0.12)] blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-16 sm:px-10 lg:grid-cols-2 lg:gap-12 lg:px-16 lg:pb-24 lg:pt-24">
          <Hero
            eyebrow="Rémunération équitable & transparente"
            title="Des salaires justes. Une équipe qui progresse."
            description="Leaft aide les dirigeants à construire des grilles de salaires équitables, à suivre la progression de chacun et à instaurer une vraie transparence — sans tableur ni casse-tête."
            ctas={[
              { href: "/contact", label: "Demander une démo", variant: "primary" },
              { href: "/pricing", label: "Voir les tarifs", variant: "secondary" },
            ]}
          />
          <Reveal delay={120} className="lg:pl-4">
            <HeroSimulator />
            <p className="mt-3 text-center text-xs text-[color:rgba(11,11,11,0.5)]">
              Exemple interactif — projetez une augmentation et voyez l'impact en direct.
            </p>
          </Reveal>
        </div>
      </section>

      {/* BANDEAU CONFIANCE */}
      <section className="border-y border-border bg-[var(--text)] text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-10 text-center sm:px-10 lg:flex-row lg:justify-between lg:px-16 lg:text-left">
          <p className="max-w-md text-sm font-medium text-white/70">
            Pensé pour les PME et scale-ups qui veulent gérer la carrière de leurs équipes avec éthique.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              { value: "100%", label: "des salaires lisibles" },
              { value: "−1 outil", label: "fini les tableurs" },
              { value: "3 espaces", label: "RH, managers, employés" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-semibold text-[#7fce9e]">{s.value}</p>
                <p className="text-xs uppercase tracking-wide text-white/55">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFICES */}
      <section className="bg-muted">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 lg:px-16">
          <Reveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-semibold text-[var(--text)] sm:text-4xl">
                Gérez la rémunération avec éthique
              </h2>
              <p className="mt-4 text-lg text-[color:rgba(11,11,11,0.7)]">
                Trois piliers pour transformer les salaires en levier de confiance.
              </p>
            </div>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((b, i) => (
              <Reveal key={b.title} delay={i * 90} className="h-full">
                <article className="h-full rounded-[20px] border border-border bg-white p-7 shadow-[var(--shadow)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(9,82,40,0.12)]">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)] text-white">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {b.icon}
                    </svg>
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-[var(--text)]">{b.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[color:rgba(11,11,11,0.7)]">{b.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE 1 — GRILLE (fond blanc) */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 sm:px-10 lg:grid-cols-2 lg:px-16">
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1 text-sm font-medium text-[color:var(--brand)]">
                Grilles de salaires
              </span>
              <h2 className="mt-5 text-3xl font-semibold text-[var(--text)] sm:text-4xl">
                Chaque salaire, à sa juste place
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-[color:rgba(11,11,11,0.7)]">
                Visualisez en un coup d'œil le positionnement de chaque collaborateur dans sa fourchette. Repérez
                instantanément qui est sous la cible, dans la cible ou au-dessus, et décidez sur des bases claires.
              </p>
              <ul className="mt-6 space-y-3">
                {["Fourchettes min – cible – max par niveau", "Compa-ratio calculé automatiquement", "Écarts à corriger mis en évidence"].map(
                  (t) => (
                    <li key={t} className="flex items-center gap-3 text-sm text-[color:rgba(11,11,11,0.78)]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:rgba(9,82,40,0.12)] text-[var(--brand)]">
                        {checkIcon}
                      </span>
                      {t}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <SalaryGridDemo />
          </Reveal>
        </div>
      </section>

      {/* FEATURE 2 — ORGANIGRAMME (fond sombre, fort contraste) */}
      <section className="bg-[var(--brand)] text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 sm:px-10 lg:grid-cols-2 lg:px-16">
          <Reveal className="lg:order-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-sm font-medium text-white">
                Organigramme
              </span>
              <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">Toute votre organisation, en un regard</h2>
              <p className="mt-4 text-lg leading-relaxed text-white/85">
                L'organigramme se construit tout seul à partir des liens managériaux. Vos équipes visualisent leur
                place, leur chaîne managériale et la structure globale — sans aucune saisie manuelle.
              </p>
              <ul className="mt-6 space-y-3">
                {["Construit automatiquement", "Visible par les managers et les employés", "Exportable en image"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-sm text-white/90">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">{checkIcon}</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120} className="lg:order-1">
            <OrgChartDemo />
          </Reveal>
        </div>
      </section>

      {/* FEATURE 3 — ÉQUITÉ (fond muted) */}
      <section className="bg-muted">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 sm:px-10 lg:grid-cols-2 lg:px-16">
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1 text-sm font-medium text-[color:var(--brand)]">
                Équité & statistiques
              </span>
              <h2 className="mt-5 text-3xl font-semibold text-[var(--text)] sm:text-4xl">
                Mesurez l'équité, prouvez vos engagements
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-[color:rgba(11,11,11,0.7)]">
                Parité, masse salariale, salaire médian, répartition par département : suivez les indicateurs qui
                comptent et transformez vos bonnes intentions en résultats mesurables.
              </p>
              <ul className="mt-6 space-y-3">
                {["Parité et démographie suivies en continu", "Masse salariale et salaires par département", "Des données prêtes à partager"].map(
                  (t) => (
                    <li key={t} className="flex items-center gap-3 text-sm text-[color:rgba(11,11,11,0.78)]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:rgba(9,82,40,0.12)] text-[var(--brand)]">
                        {checkIcon}
                      </span>
                      {t}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <EquityDemo />
          </Reveal>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 lg:px-16">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold text-[var(--text)] sm:text-4xl">Simple à mettre en place</h2>
              <p className="mt-4 text-lg text-[color:rgba(11,11,11,0.7)]">
                En quelques étapes, vous passez d'un tableur opaque à une gestion claire et partagée.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 90} className="h-full">
                <div className="h-full rounded-[20px] border border-border bg-muted p-7">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-white">
                    {s.n}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-[var(--text)]">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[color:rgba(11,11,11,0.7)]">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CITATION / EQUITE */}
      <section className="bg-[var(--text)] text-white">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:px-10 lg:px-16">
          <Reveal>
            <p className="text-2xl font-medium leading-relaxed sm:text-3xl">
              « La transparence salariale n'est pas un risque. C'est le moyen le plus efficace de gagner la confiance de
              son équipe et de retenir ses meilleurs talents. »
            </p>
            <p className="mt-6 text-sm font-medium text-white/60">Notre conviction chez Leaft</p>
          </Reveal>
        </div>
      </section>

      {/* CALENDLY */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:px-10 lg:px-16">
          <Reveal>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1 text-sm font-medium text-[color:var(--brand)]">
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
          </Reveal>
          <CalendlyEmbed />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-muted">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:px-10 lg:px-16">
          <Reveal>
            <div className="rounded-[24px] bg-[var(--brand)] p-10 text-center text-white shadow-[0_24px_60px_rgba(9,82,40,0.25)]">
              <h2 className="text-3xl font-semibold sm:text-4xl">Prêt à offrir plus de clarté à votre équipe ?</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
                Rejoignez les entreprises qui font de l'équité salariale un avantage compétitif.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-[var(--brand)] transition hover:bg-white/90"
                >
                  Découvrir les tarifs
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Parler à un expert
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
