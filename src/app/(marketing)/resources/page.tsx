export const metadata = {
  title: "Leaft – Ressources",
  description:
    "Guides, modèles et bonnes pratiques pour construire des grilles salariales transparentes et équitables.",
};

const resources = [
  {
    title: "Guide de la transparence salariale",
    description: "Mettre en place une politique de rémunération claire et partagée.",
    badge: "Guide",
  },
  {
    title: "Modèle de grille salariale",
    description: "Structurez familles de métiers et niveaux dans un template prêt à l’emploi.",
    badge: "Template",
  },
  {
    title: "Checklist entretien annuel",
    description: "Préparer managers et collaborateurs aux moments clés de progression.",
    badge: "Checklist",
  },
];

export default function ResourcesPage() {
  return (
    <main className="bg-muted">
      <section className="mx-auto flex max-w-5xl flex-col gap-12 px-6 pb-24 pt-20 sm:px-10 lg:px-16">
        <header className="max-w-3xl space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1 text-sm font-medium text-[color:var(--brand)] shadow-[var(--shadow)]">
            Guides & ressources
          </span>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Outils pour piloter la rémunération, les promotions et l’expérience collaborateur.
          </h1>
          <p className="text-lg text-[color:rgba(11,11,11,0.7)]">
            Téléchargez gratuitement nos ressources avant de basculer vos process sur Leaft.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          {resources.map((resource) => (
            <article
              key={resource.title}
              className="rounded-[var(--radius)] border border-border bg-white p-6 shadow-[var(--shadow)]"
            >
              <span className="inline-flex w-fit rounded-full bg-[color:rgba(9,82,40,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--brand)]">
                {resource.badge}
              </span>
              <h2 className="mt-4 text-lg font-semibold text-[var(--text)]">{resource.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[color:rgba(11,11,11,0.7)]">{resource.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

