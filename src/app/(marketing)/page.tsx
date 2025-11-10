import Link from "next/link";
import { Hero } from "@/components/marketing/hero";

const features = [
  {
    title: "Grilles & compa-ratio",
    description:
      "Structurez vos familles de métiers, visualisez les fourchettes min–mid–max et mesurez en un coup d'œil les compa-ratios.",
  },
  {
    title: "Suivi des parcours",
    description:
      "Historisez les entretiens, éclairez les décisions d’augmentation et assurez à chacun une trajectoire de progression lisible.",
  },
  {
    title: "Transparence marché",
    description:
      "Croisez vos données internes avec les repères Indeed (p25, p50, p75) actualisés et faites évoluer vos politiques salariales en confiance.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen bg-muted">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-white to-muted" />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-24 px-6 pb-32 pt-24 sm:px-10 lg:px-16">
        <Hero
          eyebrow="Transparence & équité salariale"
          title="Pilotez vos grilles salariales, vos augmentations et le parcours de chaque collaborateur."
          description="Leaft centralise vos rémunérations, automatise l’organigramme et offre à chaque employé un espace personnel avec simulateur, benchmarks marché et historique de progression."
          ctas={[
            { href: "/pricing", label: "Démarrer avec Leaft", variant: "primary" },
            { href: "/contact", label: "Demander une démo", variant: "secondary" },
          ]}
        />

        <section className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[var(--radius)] border border-border bg-white p-6 shadow-[var(--shadow)]"
            >
              <h2 className="text-lg font-semibold text-[var(--text)]">{feature.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[color:rgba(11,11,11,0.7)]">{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 rounded-[var(--radius)] border border-border bg-white p-8 shadow-[var(--shadow)] lg:grid-cols-2">
          <div className="space-y-5">
            <h2 className="text-3xl font-semibold text-[var(--text)]">La transparence comme levier d’équité salariale</h2>
            <p className="text-sm leading-relaxed text-[color:rgba(11,11,11,0.7)]">
              Grâce à Supabase, Leaft agrège salaires, bonus et évolutions dans une base unique. Les compa-ratios sont
              recalculés en temps réel pour chaque talent, et partagés en toute transparence avec vos managers.
            </p>
            <ul className="space-y-3 text-sm text-[color:rgba(11,11,11,0.75)]">
              <li>• Repères marché Indeed actualisés pour valider vos fourchettes.</li>
              <li>• Organigramme dynamique construit depuis le manager direct.</li>
              <li>• Historique d’entretiens et décisions accessible pour suivre chaque talent.</li>
            </ul>
          </div>
          <div className="grid gap-4 rounded-[var(--radius)] border border-dashed border-[color:rgba(9,82,40,0.25)] bg-muted p-6">
            <div className="rounded-[var(--radius)] bg-white p-5 shadow-[var(--shadow)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--brand)]">KPI People</p>
              <p className="mt-4 text-2xl font-semibold text-[var(--text)]">+12 %</p>
              <p className="text-xs text-[color:rgba(11,11,11,0.6)]">
                d’augmentation moyenne alignée avec vos repères de marché.
              </p>
            </div>
            <div className="rounded-[var(--radius)] bg-white p-5 shadow-[var(--shadow)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--brand)]">Organigramme</p>
              <p className="mt-4 text-sm text-[color:rgba(11,11,11,0.7)]">
                Chaque collaborateur visualise sa chaîne managériale, les promotions en cours et les opportunités de
                progression.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius)] border border-border bg-white p-8 text-center shadow-[var(--shadow)]">
          <p className="text-sm font-medium uppercase tracking-wide text-[color:rgba(11,11,11,0.6)]">
            Déjà en place chez nos clients pilotes
          </p>
          <div className="mt-6 flex flex-col gap-6 text-sm text-[color:rgba(11,11,11,0.7)] sm:flex-row sm:justify-center">
            <div className="rounded-[var(--radius)] bg-muted px-6 py-4">
              <p className="text-lg font-semibold text-[var(--text)]">+40%</p>
              <p className="text-xs uppercase tracking-wide text-[color:rgba(11,11,11,0.6)]">transparence perçue</p>
            </div>
            <div className="rounded-[var(--radius)] bg-muted px-6 py-4">
              <p className="text-lg font-semibold text-[var(--text)]">3 semaines</p>
              <p className="text-xs uppercase tracking-wide text-[color:rgba(11,11,11,0.6)]">pour déployer Leaft</p>
            </div>
            <div className="rounded-[var(--radius)] bg-muted px-6 py-4">
              <p className="text-lg font-semibold text-[var(--text)]">1 seul outil</p>
              <p className="text-xs uppercase tracking-wide text-[color:rgba(11,11,11,0.6)]">pour RH, managers et employés</p>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius)] border border-dashed border-[color:rgba(9,82,40,0.25)] bg-white p-8 shadow-[var(--shadow)]">
          <h2 className="text-2xl font-semibold text-[var(--text)]">Prêt à basculer sur Leaft ?</h2>
          <p className="mt-3 text-sm leading-relaxed text-[color:rgba(11,11,11,0.7)]">
            Nous déployons la plateforme directement sur votre production grâce à Render, et assurons la migration de vos
            grilles de salaires existantes.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Planifier une session découverte
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-muted"
            >
              Voir les tarifs
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

