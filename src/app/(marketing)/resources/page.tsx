import Link from "next/link";
import { Hero } from "@/components/marketing/hero";
import { articles } from "./articles";

export const metadata = {
  title: "Leaft – Ressources & guides",
  description:
    "Guides pratiques sur la transparence salariale, les grilles de salaires et la gestion équitable des carrières. Tout pour mieux piloter vos rémunérations.",
};

const CATEGORY_STYLES: Record<string, string> = {
  Transparence: "bg-[color:rgba(9,82,40,0.08)] text-[var(--brand)]",
  "Grilles de salaires": "bg-[#e9e2f7] text-[#5b4b8a]",
  Management: "bg-[#fdeede] text-[#a8702f]",
  Guide: "bg-[#dde9f5] text-[#34618f]",
};

export default function ResourcesPage() {
  const [featured, ...rest] = articles;

  return (
    <main className="bg-muted">
      <section className="mx-auto flex max-w-5xl flex-col gap-12 px-6 pb-24 pt-20 sm:px-10 lg:px-16">
        <Hero
          eyebrow="Ressources & guides"
          title="Mieux gérer la rémunération et les carrières de votre équipe."
          description="Des guides clairs et concrets pour structurer vos salaires, instaurer la transparence et accompagner la progression de chacun."
        />

        {/* Article à la une */}
        <Link
          href={`/resources/${featured.slug}`}
          className="group grid gap-6 overflow-hidden rounded-[20px] border border-border bg-white shadow-[var(--shadow)] transition hover:shadow-[0_16px_40px_rgba(9,82,40,0.12)] lg:grid-cols-2"
        >
          <div className="flex min-h-[200px] items-center justify-center bg-[var(--brand)] p-10">
            <span className="text-center text-2xl font-semibold leading-snug text-white">{featured.title}</span>
          </div>
          <div className="flex flex-col justify-center gap-3 p-8">
            <div className="flex items-center gap-3">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_STYLES[featured.category]}`}>
                {featured.category}
              </span>
              <span className="text-xs text-[color:rgba(11,11,11,0.5)]">{featured.readingTime} de lecture</span>
            </div>
            <h2 className="text-xl font-semibold text-[var(--text)] group-hover:text-[var(--brand)]">{featured.title}</h2>
            <p className="text-sm leading-relaxed text-[color:rgba(11,11,11,0.7)]">{featured.excerpt}</p>
            <span className="mt-1 text-sm font-semibold text-[var(--brand)]">Lire le guide →</span>
          </div>
        </Link>

        {/* Autres articles */}
        <div className="grid gap-6 sm:grid-cols-2">
          {rest.map((article) => (
            <Link
              key={article.slug}
              href={`/resources/${article.slug}`}
              className="group flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-white p-6 shadow-[var(--shadow)] transition hover:shadow-[0_16px_40px_rgba(9,82,40,0.1)]"
            >
              <div className="flex items-center gap-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_STYLES[article.category]}`}>
                  {article.category}
                </span>
                <span className="text-xs text-[color:rgba(11,11,11,0.5)]">{article.readingTime}</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text)] group-hover:text-[var(--brand)]">{article.title}</h3>
              <p className="text-sm leading-relaxed text-[color:rgba(11,11,11,0.7)]">{article.excerpt}</p>
              <span className="mt-auto pt-1 text-sm font-semibold text-[var(--brand)]">Lire →</span>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-[20px] border border-dashed border-[color:rgba(9,82,40,0.25)] bg-white p-8 text-center shadow-[var(--shadow)]">
          <h2 className="text-2xl font-semibold text-[var(--text)]">Envie de passer de la théorie à la pratique ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[color:rgba(11,11,11,0.7)]">
            Leaft réunit grilles de salaires, suivi des carrières et repères marché dans un seul outil simple à
            utiliser. Découvrez-le en quelques minutes.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Demander une démo
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-muted"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
