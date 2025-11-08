import { Hero } from "@/components/marketing/hero";

export const metadata = {
  title: "Leaft – Mentions légales",
  description: "Informations légales et coordonnées de l’éditeur Leaft.",
};

export default function LegalPage() {
  return (
    <main className="bg-muted">
      <section className="mx-auto flex max-w-4xl flex-col gap-10 px-6 pb-24 pt-20 sm:px-10 lg:px-16">
        <Hero
          title="Mentions légales"
          description="Ces informations seront complétées avec les détails officiels (raison sociale, hébergeur, contact) lors du lancement public de Leaft."
          align="start"
        />

        <div className="space-y-6 rounded-[var(--radius)] border border-border bg-white p-6 text-sm text-[color:rgba(11,11,11,0.74)] shadow-[var(--shadow)]">
          <section>
            <h2 className="text-base font-semibold text-[var(--text)]">Éditeur</h2>
            <p className="mt-2">
              Leaft SAS
              <br />
              10 rue de la Transparence
              <br />
              75000 Paris – France
              <br />
              contact@leaft.io
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-[var(--text)]">Responsable de publication</h2>
            <p className="mt-2">Vincent X – contact@leaft.io</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-[var(--text)]">Hébergement</h2>
            <p className="mt-2">
              Render – 123 Mission Street, San Francisco, CA 94105, États-Unis.
              <br />
              https://render.com
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-[var(--text)]">Protection des données</h2>
            <p className="mt-2">
              Leaft respecte la réglementation RGPD. Pour toute question sur vos données personnelles, contactez
              privacy@leaft.io.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

