import { Hero } from "@/components/marketing/hero";
import { ContactForm } from "@/components/marketing/contact-form";
import { CalendlyEmbed } from "@/components/marketing/calendly-embed";

export const metadata = {
  title: "Leaft – Contact & démo",
  description:
    "Parlez avec l'équipe Leaft pour découvrir comment construire des salaires équitables et accompagner la progression de vos équipes.",
};

export default function ContactPage() {
  return (
    <main className="bg-muted">
      <section className="mx-auto flex max-w-4xl flex-col gap-12 px-6 pb-16 pt-20 sm:px-10 lg:px-16">
        <Hero
          eyebrow="Contact & démo"
          title="Discutons de l'avenir de vos équipes."
          description="Laissez-nous vos coordonnées : nous revenons vers vous sous 24h ouvrées pour organiser une démo adaptée à votre contexte. Vous pouvez aussi réserver directement un créneau ci-dessous."
        />

        <ContactForm />
      </section>

      {/* CALENDLY */}
      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:px-10 lg:px-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-[var(--text)] sm:text-3xl">Ou réservez directement votre démo</h2>
            <p className="mt-3 text-[color:rgba(11,11,11,0.7)]">
              30 minutes pour découvrir Leaft en conditions réelles, sans engagement.
            </p>
          </div>
          <CalendlyEmbed />
        </div>
      </section>
    </main>
  );
}
