import type { FaqItem } from "./faq";

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Oui, c'est notre priorité absolue. Vos données sont chiffrées en transit (TLS) et au repos, hébergées sur une infrastructure cloud certifiée (Supabase, sous-jacent AWS) au sein de l'Union européenne. Chaque organisation est strictement isolée des autres, et des sauvegardes automatiques sont réalisées quotidiennement.",
  },
  {
    q: "Qui peut voir les salaires dans mon entreprise ?",
    a: "Vous gardez le contrôle total. Par défaut, seuls les profils RH et administrateurs voient les rémunérations. Les managers et les employés n'y ont accès que si vous activez l'option de transparence — et même dans ce cas, vous choisissez entre afficher une moyenne par département ou les salaires exacts.",
  },
  {
    q: "Les employés voient-ils les salaires de leurs collègues ?",
    a: "Non. Chaque collaborateur voit uniquement sa propre situation : son salaire, sa fourchette, sa progression et son positionnement face au marché. Il ne voit jamais le salaire individuel de ses collègues, conformément au cadre légal.",
  },
  {
    q: "Êtes-vous conforme au RGPD ?",
    a: "Oui. Nous traitons uniquement les données nécessaires au service, nous ne les vendons ni ne les partageons à des tiers, et nous respectons vos droits d'accès, de rectification et de suppression. Vous pouvez exporter ou demander la suppression de vos données à tout moment (privacy@leaft.io).",
  },
  {
    q: "Que deviennent mes données si je résilie ?",
    a: "Elles vous appartiennent. Vous pouvez les exporter avant de partir, et elles sont définitivement supprimées ou anonymisées dans les 90 jours suivant la fin de votre abonnement.",
  },
  {
    q: "Leaft remplace-t-il mon logiciel de paie ?",
    a: "Non, et ce n'est pas son but. Leaft est un outil de pilotage de la rémunération et des carrières (grilles, équité, transparence, entretiens). Il ne se connecte à aucun logiciel de paie et ne gère pas les bulletins.",
  },
  {
    q: "Y a-t-il un engagement ?",
    a: "Aucun engagement sur l'offre mensuelle : vous arrêtez quand vous voulez. L'offre annuelle vous fait économiser 17 % (l'équivalent de 2 mois offerts).",
  },
  {
    q: "Combien de temps pour démarrer ?",
    a: "Quelques minutes pour créer votre compte, et quelques jours pour structurer vos premières grilles. Nous vous accompagnons à la prise en main, sans migration technique complexe.",
  },
];

export const FAQ_SECURITY: FaqItem[] = FAQ_ITEMS.filter((item) =>
  [
    "Mes données sont-elles en sécurité ?",
    "Qui peut voir les salaires dans mon entreprise ?",
    "Les employés voient-ils les salaires de leurs collègues ?",
    "Êtes-vous conforme au RGPD ?",
  ].includes(item.q),
);
