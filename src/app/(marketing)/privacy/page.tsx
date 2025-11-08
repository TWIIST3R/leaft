export const metadata = {
  title: "Leaft – Politique de confidentialité",
  description: "Politique RGPD de Leaft concernant les données collaborateurs et utilisateurs.",
};

const sections = [
  {
    title: "1. Finalités",
    content:
      "Leaft collecte des données afin de fournir sa plateforme de structuration salariale, d’accompagner les équipes People et de maintenir la sécurité des comptes.",
  },
  {
    title: "2. Données traitées",
    content:
      "Identité, coordonnées professionnelles, informations de rémunération, historiques d’entretiens. Aucune donnée n’est vendue ou louée.",
  },
  {
    title: "3. Durées de conservation",
    content:
      "Les données sont conservées tant que l’organisation reste cliente Leaft, puis supprimées ou anonymisées sous 90 jours.",
  },
  {
    title: "4. Sous-traitants",
    content:
      "Supabase (hébergement et base de données), Clerk (authentification), Stripe (facturation), Render (hébergement applicatif).",
  },
  {
    title: "5. Droits RGPD",
    content: "Accès, rectification, suppression, opposition, portabilité. Contact : privacy@leaft.io.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="bg-muted">
      <section className="mx-auto flex max-w-4xl flex-col gap-10 px-6 pb-24 pt-20 sm:px-10 lg:px-16">
        <header className="space-y-4">
          <h1 className="text-4xl font-semibold">Politique de confidentialité</h1>
          <p className="text-sm text-[color:rgba(11,11,11,0.7)]">
            Dernière mise à jour : {new Date().getFullYear()} – Cette page sera enrichie au fur et à mesure de
            l’ouverture du service.
          </p>
        </header>

        <div className="space-y-6 rounded-[var(--radius)] border border-border bg-white p-6 text-sm text-[color:rgba(11,11,11,0.74)] shadow-[var(--shadow)]">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-semibold text-[var(--text)]">{section.title}</h2>
              <p className="mt-2 leading-relaxed">{section.content}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

