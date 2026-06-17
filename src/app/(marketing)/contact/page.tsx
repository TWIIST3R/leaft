import { Hero } from "@/components/marketing/hero";
import { ContactForm } from "@/components/marketing/contact-form";
import { CalendlyEmbed } from "@/components/marketing/calendly-embed";
import { SecurityBand } from "@/components/marketing/trust";
import { Faq } from "@/components/marketing/faq";
import { FAQ_SECURITY } from "@/components/marketing/faq-items";

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

      {/* SÉCURITÉ */}
      <section className="border-t border-border bg-muted">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-[var(--text)] sm:text-3xl">
              Vos données sont protégées
            </h2>
            <p className="mt-3 text-[color:rgba(11,11,11,0.7)]">
              Les salaires font partie des données les plus sensibles. Voici comment nous les sécurisons.
            </p>
          </div>
          <SecurityBand />
        </div>
      </section>

      {/* FAQ sécurité */}
      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:px-16">
          <h2 className="mb-10 text-center text-2xl font-semibold text-[var(--text)] sm:text-3xl">
            Questions fréquentes sur vos données
          </h2>
          <Faq items={FAQ_SECURITY} />
        </div>
      </section>
    </main>
  );
}
