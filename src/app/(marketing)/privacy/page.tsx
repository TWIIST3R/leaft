import { Hero } from "@/components/marketing/hero";

export const metadata = {
  title: "Leaft – Confidentialité & sécurité des données",
  description:
    "Comment Leaft protège les données de rémunération de votre entreprise : chiffrement, hébergement européen, contrôle des accès et conformité RGPD.",
};

const securityMeasures = [
  {
    title: "Chiffrement",
    content:
      "Toutes les données transitent via des connexions chiffrées (HTTPS / TLS) et sont chiffrées au repos sur nos serveurs. Les communications entre votre navigateur et Leaft ne peuvent pas être interceptées.",
  },
  {
    title: "Hébergement en Europe",
    content:
      "Vos données sont hébergées au sein de l'Union européenne, sur une infrastructure cloud certifiée (Supabase, opérant sur AWS, certifié SOC 2 Type 2 et ISO 27001). Elles ne quittent pas l'espace européen.",
  },
  {
    title: "Cloisonnement des données",
    content:
      "Chaque organisation est strictement isolée. Les données d'une entreprise ne sont jamais accessibles à une autre. L'accès à la base est protégé et réservé aux services applicatifs de Leaft.",
  },
  {
    title: "Contrôle des accès (RBAC)",
    content:
      "L'accès aux rémunérations est régi par des rôles (Administrateur, RH, Manager, Employé). Un employé ne voit que sa propre situation ; les salaires de l'organisation ne sont visibles que selon les règles que vous définissez.",
  },
  {
    title: "Authentification sécurisée",
    content:
      "L'authentification est gérée par Clerk, un fournisseur spécialisé. Les mots de passe ne sont jamais stockés par Leaft et l'authentification à plusieurs facteurs (MFA) est prise en charge.",
  },
  {
    title: "Paiements externalisés",
    content:
      "La facturation est traitée par Stripe (certifié PCI-DSS niveau 1). Aucune donnée de carte bancaire n'est stockée sur les serveurs de Leaft.",
  },
  {
    title: "Sauvegardes",
    content:
      "Des sauvegardes automatiques quotidiennes de la base de données sont réalisées afin de garantir la disponibilité et la restauration de vos données en cas d'incident.",
  },
];

const sections = [
  {
    title: "1. Finalités du traitement",
    content:
      "Leaft collecte des données afin de fournir sa plateforme de structuration salariale, d'accompagner les équipes RH dans le suivi des carrières et de maintenir la sécurité des comptes.",
  },
  {
    title: "2. Données traitées",
    content:
      "Identité, coordonnées professionnelles, informations de rémunération (salaire annuel brut, fourchettes, historiques d'entretiens). Ces données sont fournies par l'entreprise cliente. Aucune donnée n'est vendue, louée ou cédée à des tiers à des fins commerciales.",
  },
  {
    title: "3. Durées de conservation",
    content:
      "Les données sont conservées tant que l'organisation reste cliente de Leaft. À la résiliation, elles sont exportables, puis supprimées ou anonymisées sous 90 jours.",
  },
  {
    title: "4. Sous-traitants",
    content:
      "Supabase (hébergement et base de données, UE), Clerk (authentification), Stripe (facturation), Render (hébergement applicatif). Chacun est sélectionné pour son niveau de sécurité et son respect du RGPD.",
  },
  {
    title: "5. Vos droits RGPD",
    content:
      "Accès, rectification, suppression, opposition, portabilité. Vous pouvez exercer ces droits à tout moment en écrivant à privacy@leaft.io. Nous nous engageons à répondre dans les meilleurs délais.",
  },
  {
    title: "6. Confidentialité des salaires",
    content:
      "Les rémunérations ne sont jamais exposées aux autres collaborateurs. L'option de transparence salariale est désactivée par défaut : c'est vous qui décidez si, quand et comment partager ces informations (moyenne par département ou salaires exacts).",
  },
];

export default function PrivacyPage() {
  return (
    <main className="bg-muted">
      <section className="mx-auto flex max-w-4xl flex-col gap-10 px-6 pb-24 pt-20 sm:px-10 lg:px-16">
        <Hero
          eyebrow="Confidentialité & sécurité"
          title="Vos données sensibles, protégées avec le plus grand soin."
          description="Les salaires comptent parmi les données les plus sensibles d'une entreprise. Voici concrètement comment nous les sécurisons et respectons votre vie privée."
          align="start"
        />

        {/* Mesures de sécurité */}
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)]">Comment nous sécurisons vos données</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {securityMeasures.map((m) => (
              <div key={m.title} className="rounded-[var(--radius)] border border-border bg-white p-5 shadow-[var(--shadow)]">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:rgba(9,82,40,0.1)] text-[var(--brand)]">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <h3 className="text-sm font-semibold text-[var(--text)]">{m.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[color:rgba(11,11,11,0.7)]">{m.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Politique RGPD */}
        <div className="space-y-6 rounded-[var(--radius)] border border-border bg-white p-6 text-sm text-[color:rgba(11,11,11,0.74)] shadow-[var(--shadow)]">
          <h2 className="text-2xl font-semibold text-[var(--text)]">Politique de confidentialité</h2>
          <p className="text-xs text-[color:rgba(11,11,11,0.5)]">
            Dernière mise à jour : {new Date().getFullYear()}
          </p>
          {sections.map((section) => (
            <section key={section.title}>
              <h3 className="text-base font-semibold text-[var(--text)]">{section.title}</h3>
              <p className="mt-2 leading-relaxed">{section.content}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
