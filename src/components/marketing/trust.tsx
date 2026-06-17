import { ReactNode } from "react";

/* ----------------------- Bande sécurité / réassurance ----------------------- */

type SecurityPoint = { title: string; description: string; icon: ReactNode };

const SECURITY_POINTS: SecurityPoint[] = [
  {
    title: "Chiffrement de bout en bout",
    description: "Vos données sont chiffrées en transit (TLS) et au repos. Personne ne peut les intercepter.",
    icon: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </>
    ),
  },
  {
    title: "Conforme au RGPD",
    description: "Données hébergées dans l'Union européenne. Jamais vendues, jamais partagées à des tiers.",
    icon: (
      <>
        <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
  {
    title: "Accès strictement contrôlé",
    description: "Chaque organisation est isolée. Les salaires ne sont visibles que par les personnes autorisées.",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 11l-3 3-1.5-1.5" />
      </>
    ),
  },
  {
    title: "Paiements sécurisés",
    description: "Facturation via Stripe (certifié PCI-DSS). Aucune donnée bancaire ne transite par Leaft.",
    icon: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </>
    ),
  },
];

export function SecurityBand() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {SECURITY_POINTS.map((p) => (
        <div key={p.title} className="rounded-[20px] border border-border bg-white p-6 shadow-[var(--shadow)]">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:rgba(9,82,40,0.1)] text-[var(--brand)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {p.icon}
            </svg>
          </span>
          <h3 className="mt-4 text-sm font-semibold text-[var(--text)]">{p.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[color:rgba(11,11,11,0.65)]">{p.description}</p>
        </div>
      ))}
    </div>
  );
}

/* ----------------------- Témoignages ----------------------- */

type Testimonial = { quote: string; name: string; role: string; initials: string };

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Avant Leaft, nos salaires vivaient dans un tableur que personne n'osait ouvrir. Aujourd'hui, chaque décision d'augmentation est claire et défendable.",
    name: "Camille D.",
    role: "Directrice People · scale-up SaaS",
    initials: "CD",
  },
  {
    quote:
      "Mes managers arrivent enfin préparés aux entretiens, avec les bonnes données sous les yeux. On a gagné un temps fou et beaucoup de sérénité.",
    name: "Thomas L.",
    role: "CEO · agence de 30 personnes",
    initials: "TL",
  },
  {
    quote:
      "La transparence faisait peur à notre direction. Le mode « moyenne par département » nous a permis d'avancer sereinement, à notre rythme.",
    name: "Sarah M.",
    role: "Responsable RH · PME industrielle",
    initials: "SM",
  },
];

export function Testimonials() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {TESTIMONIALS.map((t) => (
        <figure key={t.name} className="flex h-full flex-col rounded-[20px] border border-border bg-white p-7 shadow-[var(--shadow)]">
          <div className="flex gap-1 text-[var(--brand)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3 6.5 7 .9-5 4.8 1.3 7-6.3-3.5-6.3 3.5 1.3-7-5-4.8 7-.9z" />
              </svg>
            ))}
          </div>
          <blockquote className="mt-4 grow text-sm leading-relaxed text-[color:rgba(11,11,11,0.78)]">
            « {t.quote} »
          </blockquote>
          <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)]/15 text-xs font-semibold text-[var(--brand)]">
              {t.initials}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-[var(--text)]">{t.name}</p>
              <p className="text-xs text-[color:rgba(11,11,11,0.55)]">{t.role}</p>
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
