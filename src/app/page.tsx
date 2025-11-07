import Link from "next/link";

const features = [
  {
    title: "Grilles & compa-ratio",
    description:
      "Structurez vos familles de métiers, visualisez les fourchettes min–mid–max et mesurez en un coup d'œil les compa-ratios.",
  },
  {
    title: "Suivi des parcours",
    description:
      "Historisez les entretiens, préparez les ajustements et offrez un espace collaborateur clair et actionnable.",
  },
  {
    title: "Benchmarks marché",
    description:
      "Croisez vos données internes avec HasData / Indeed (p25, p50, p75) et pilotez vos politiques salariales.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen bg-muted">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-white to-muted" />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-20 px-6 pb-24 pt-24 sm:px-10 lg:px-16">
        <header className="max-w-3xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1 text-sm font-medium text-[color:var(--brand)] shadow-[var(--shadow)]">
            Transparence & équité salariale
          </span>
          <h1 className="text-balance text-4xl font-semibold leading-tight text-[var(--text)] sm:text-5xl">
            Pilotez vos grilles salariales, vos augmentations et le parcours de chaque collaborateur.
          </h1>
          <p className="text-pretty text-lg text-[color:rgba(11,11,11,0.72)]">
            Leaft centralise vos rémunérations, automatise l’organigramme et offre à chaque employé un espace personnel avec simulateur, benchmarks marché et historique de progression.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-base font-semibold text-white transition hover:brightness-110"
            >
              Démarrer avec Leaft
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-border bg-white px-6 py-3 text-base font-semibold text-[var(--text)] transition hover:bg-muted"
            >
              Demander une démo
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[var(--radius)] border border-border bg-white p-6 shadow-[var(--shadow)]"
            >
              <h2 className="text-lg font-semibold text-[var(--text)]">
                {feature.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[color:rgba(11,11,11,0.7)]">
                {feature.description}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
