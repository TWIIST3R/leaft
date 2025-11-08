import Link from "next/link";
import { Hero } from "@/components/marketing/hero";

export const metadata = {
  title: "Leaft – Contact",
  description: "Parlez avec l’équipe Leaft pour découvrir comment structurer vos grilles salariales et vos entretiens.",
};

export default function ContactPage() {
  return (
    <main className="bg-muted">
      <section className="mx-auto flex max-w-4xl flex-col gap-12 px-6 pb-24 pt-20 sm:px-10 lg:px-16">
        <Hero
          eyebrow="Contact & démo"
          title="Discutons transparence salariale, organigramme et expérience collaborateur."
          description="Laissez-nous vos coordonnées – nous revenons vers vous sous 24h ouvrées pour organiser une démo adaptée à votre contexte (RH, finance ou managers)."
          ctas={[{ href: "/pricing", label: "Voir les tarifs" }]}
        />

        <form className="grid gap-6 rounded-[var(--radius)] border border-border bg-white p-6 shadow-[var(--shadow)] sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Prénom</label>
            <input
              type="text"
              required
              className="rounded-[var(--radius)] border border-border bg-muted px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Nom</label>
            <input
              type="text"
              required
              className="rounded-[var(--radius)] border border-border bg-muted px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Email professionnel</label>
            <input
              type="email"
              required
              className="rounded-[var(--radius)] border border-border bg-muted px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Taille de l’entreprise</label>
            <select className="rounded-[var(--radius)] border border-border bg-muted px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]">
              <option>1 – 5</option>
              <option>6 – 19</option>
              <option>20 – 99</option>
              <option>100+</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="text-sm font-medium">Message</label>
            <textarea
              rows={4}
              className="rounded-[var(--radius)] border border-border bg-muted px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
              placeholder="Parlez-nous de vos objectifs rémunération, People Ops ou reporting."
            />
          </div>
          <button
            type="submit"
            className="sm:col-span-2 inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Envoyer ma demande
          </button>
          <p className="sm:col-span-2 text-xs text-[color:rgba(11,11,11,0.6)]">
            En soumettant ce formulaire vous acceptez notre{" "}
            <Link href="/privacy" className="font-medium text-[var(--text)] underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </form>
      </section>
    </main>
  );
}

