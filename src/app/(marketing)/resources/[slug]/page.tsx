import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { articles, getArticle } from "../articles";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Leaft – Ressources" };
  return {
    title: `Leaft – ${article.title}`,
    description: article.excerpt,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = articles.filter((a) => a.slug !== article.slug).slice(0, 2);

  return (
    <main className="bg-muted">
      <article className="mx-auto max-w-3xl px-6 pb-16 pt-16 sm:px-10 lg:px-16">
        <Link href="/resources" className="text-sm font-medium text-[var(--brand)] transition hover:underline">
          ← Toutes les ressources
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span className="inline-flex rounded-full bg-[color:rgba(9,82,40,0.08)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
            {article.category}
          </span>
          <span className="text-xs text-[color:rgba(11,11,11,0.5)]">{article.readingTime} de lecture</span>
        </div>

        <h1 className="mt-4 text-balance text-3xl font-semibold leading-tight text-[var(--text)] sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[color:rgba(11,11,11,0.7)]">{article.intro}</p>

        <div className="mt-10 space-y-5">
          {article.content.map((block, i) => {
            if (block.type === "h2") {
              return (
                <h2 key={i} className="pt-2 text-xl font-semibold text-[var(--text)]">
                  {block.text}
                </h2>
              );
            }
            if (block.type === "p") {
              return (
                <p key={i} className="text-base leading-relaxed text-[color:rgba(11,11,11,0.78)]">
                  {block.text}
                </p>
              );
            }
            if (block.type === "ul") {
              return (
                <ul key={i} className="space-y-2">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-2 text-base leading-relaxed text-[color:rgba(11,11,11,0.78)]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <blockquote
                key={i}
                className="rounded-[var(--radius)] border-l-4 border-[var(--brand)] bg-white p-5 text-base font-medium leading-relaxed text-[var(--text)] shadow-[var(--shadow)]"
              >
                {block.text}
              </blockquote>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-[20px] bg-[var(--brand)] p-8 text-center text-white">
          <h2 className="text-2xl font-semibold">Mettez ces bonnes pratiques en place avec Leaft</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/85">
            Grilles de salaires, suivi des carrières, repères marché et transparence : tout est réuni dans un seul
            outil simple à prendre en main.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--brand)] transition hover:bg-white/90"
            >
              Demander une démo
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </article>

      {/* Articles liés */}
      {related.length > 0 && (
        <section className="border-t border-border bg-white">
          <div className="mx-auto max-w-3xl px-6 py-12 sm:px-10 lg:px-16">
            <h2 className="text-lg font-semibold text-[var(--text)]">À lire ensuite</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {related.map((a) => (
                <Link
                  key={a.slug}
                  href={`/resources/${a.slug}`}
                  className="group rounded-[var(--radius)] border border-border bg-white p-5 transition hover:shadow-[var(--shadow)]"
                >
                  <span className="text-xs font-semibold text-[var(--brand)]">{a.category}</span>
                  <h3 className="mt-1 font-semibold text-[var(--text)] group-hover:text-[var(--brand)]">{a.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
