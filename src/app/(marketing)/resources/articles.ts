export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string };

export type Article = {
  slug: string;
  category: "Transparence" | "Grilles de salaires" | "Management" | "Guide";
  title: string;
  excerpt: string;
  readingTime: string;
  /** Petit accroche affichée en tête d'article. */
  intro: string;
  content: ArticleBlock[];
};

export const articles: Article[] = [
  {
    slug: "transparence-salariale-bonne-idee",
    category: "Transparence",
    title: "La transparence salariale est-elle une bonne idée pour mon entreprise ?",
    excerpt:
      "Avantages, limites et bonnes pratiques pour décider si vous devez ouvrir le sujet des salaires dans votre équipe.",
    readingTime: "5 min",
    intro:
      "La transparence salariale fait peur à beaucoup de dirigeants. Pourtant, bien menée, c'est l'un des leviers de confiance les plus puissants. Faisons le point honnêtement.",
    content: [
      { type: "h2", text: "De quoi parle-t-on exactement ?" },
      {
        type: "p",
        text: "La transparence salariale ne veut pas dire afficher le salaire de chacun sur un tableau. Elle consiste surtout à rendre les règles claires : sur quels critères un salaire est fixé, comment on évolue, et pourquoi deux personnes au même poste peuvent être payées différemment.",
      },
      { type: "h2", text: "Les bénéfices concrets" },
      {
        type: "ul",
        items: [
          "Plus de confiance : les collaborateurs comprennent les décisions au lieu de les subir.",
          "Moins d'inégalités : les écarts injustifiés (notamment femmes/hommes) deviennent visibles et corrigeables.",
          "Une marque employeur forte : les candidats valorisent les entreprises qui jouent cartes sur table.",
          "Moins de départs : l'incompréhension sur la rémunération est une cause majeure de démission.",
        ],
      },
      { type: "h2", text: "Les vraies limites" },
      {
        type: "p",
        text: "La transparence sans préparation peut créer des tensions. Si vos salaires actuels comportent des incohérences, les exposer brutalement serait contre-productif. La bonne approche est progressive : d'abord structurer, ensuite communiquer.",
      },
      {
        type: "quote",
        text: "La transparence n'est pas un interrupteur qu'on allume. C'est une démarche : on commence par mettre de l'ordre, puis on ouvre le dialogue.",
      },
      { type: "h2", text: "Par où commencer" },
      {
        type: "p",
        text: "Avant d'ouvrir le sujet, donnez-vous une base saine : des fourchettes de salaires par niveau, une vision claire des écarts et des critères de progression. C'est exactement ce que Leaft permet de poser en quelques jours, sans tableur. Vous gardez la main sur ce que vous communiquez, et à qui.",
      },
    ],
  },
  {
    slug: "construire-grille-salariale",
    category: "Grilles de salaires",
    title: "Comment construire une grille de salaires juste (guide pas à pas)",
    excerpt:
      "La méthode simple pour structurer vos rémunérations par métier et par niveau, sans y passer des semaines.",
    readingTime: "6 min",
    intro:
      "Une grille de salaires, ce n'est pas réservé aux grands groupes. C'est même l'outil le plus utile pour une PME qui veut payer juste et éviter les négociations au cas par cas.",
    content: [
      { type: "h2", text: "1. Regroupez vos métiers en familles" },
      {
        type: "p",
        text: "Commencez par regrouper vos postes par grande famille : commercial, technique, support, etc. Cela évite de comparer des choses incomparables et donne une structure lisible.",
      },
      { type: "h2", text: "2. Définissez des niveaux" },
      {
        type: "p",
        text: "Pour chaque famille, posez 3 à 5 niveaux (par exemple junior, confirmé, senior). À chaque niveau, décrivez ce qu'on attend en termes d'autonomie, d'impact et de responsabilités.",
      },
      { type: "h2", text: "3. Fixez des fourchettes min – cible – max" },
      {
        type: "ul",
        items: [
          "Le minimum : le salaire d'entrée dans le niveau.",
          "La cible : le salaire « normal » pour quelqu'un qui maîtrise le poste.",
          "Le maximum : le haut de la fourchette avant de passer au niveau supérieur.",
        ],
      },
      { type: "h2", text: "4. Confrontez au marché" },
      {
        type: "p",
        text: "Vos fourchettes doivent rester compétitives. Comparez-les aux repères du marché (bas, médiane, haut) pour le métier concerné. Trop bas, vous perdez vos talents ; trop haut, vous déséquilibrez votre budget.",
      },
      { type: "h2", text: "5. Positionnez chacun et corrigez" },
      {
        type: "p",
        text: "Placez chaque collaborateur dans sa fourchette. Le « compa-ratio » (salaire ÷ cible) vous montre d'un coup d'œil qui est sous-payé ou sur-payé par rapport à son niveau. Vous savez alors où agir en priorité.",
      },
      {
        type: "quote",
        text: "Avec Leaft, ces 5 étapes se font dans un seul outil : les fourchettes, le positionnement de chacun et les repères marché sont calculés automatiquement.",
      },
    ],
  },
  {
    slug: "comprendre-compa-ratio",
    category: "Guide",
    title: "Le compa-ratio expliqué simplement",
    excerpt: "Un indicateur tout simple pour savoir si un salaire est cohérent avec le niveau attendu.",
    readingTime: "3 min",
    intro:
      "Derrière ce mot un peu technique se cache l'indicateur le plus pratique pour piloter vos salaires. On vous explique en 3 minutes.",
    content: [
      { type: "h2", text: "La formule" },
      {
        type: "p",
        text: "Compa-ratio = salaire de la personne ÷ salaire cible de son niveau. On l'exprime en pourcentage.",
      },
      { type: "h2", text: "Comment le lire" },
      {
        type: "ul",
        items: [
          "Autour de 100 % : la personne est payée pile dans la cible de son niveau. Tout va bien.",
          "En dessous de ~92 % : la personne est sous-payée par rapport à son niveau. À surveiller.",
          "Au-dessus de ~108 % : la personne est en haut de fourchette. C'est peut-être le signe qu'il faut envisager une évolution de niveau.",
        ],
      },
      { type: "h2", text: "Pourquoi c'est utile" },
      {
        type: "p",
        text: "Le compa-ratio vous permet de comparer des salaires entre des postes différents sur une base juste. Plutôt que de regarder des montants bruts difficiles à comparer, vous regardez un pourcentage qui dit la même chose pour tout le monde : « est-ce cohérent avec le niveau ? ».",
      },
      {
        type: "quote",
        text: "Dans Leaft, le compa-ratio de chaque collaborateur est calculé en temps réel et visualisé par une barre colorée. Vous repérez les écarts en quelques secondes.",
      },
    ],
  },
  {
    slug: "preparer-entretien-augmentation",
    category: "Management",
    title: "Préparer un entretien d'augmentation sans stress",
    excerpt: "Une trame simple pour des entretiens justes, factuels et bien vécus des deux côtés.",
    readingTime: "4 min",
    intro:
      "L'entretien d'augmentation est souvent redouté, par le manager comme par le collaborateur. Avec un peu de méthode et des données claires, il devient un moment de dialogue serein.",
    content: [
      { type: "h2", text: "Avant l'entretien : objectivez" },
      {
        type: "p",
        text: "Arrivez avec des faits, pas des impressions. Où se situe la personne dans sa fourchette ? Quel est son positionnement face au marché ? Quelles réalisations concrètes depuis le dernier point ?",
      },
      { type: "h2", text: "Pendant : un cadre clair" },
      {
        type: "ul",
        items: [
          "Rappelez les attentes du niveau et ce qui est valorisé.",
          "Partagez les éléments factuels (positionnement, progression, marché).",
          "Écoutez : un entretien réussi est d'abord une conversation.",
          "Soyez transparent sur ce qui est possible, et sur ce qui ne l'est pas encore.",
        ],
      },
      { type: "h2", text: "Après : tracez la décision" },
      {
        type: "p",
        text: "Notez la décision et sa justification. Cet historique est précieux : il assure la cohérence dans le temps et protège l'équité entre les collaborateurs.",
      },
      {
        type: "quote",
        text: "Leaft conserve l'historique de chaque entretien et décision, avec les bonnes données sous les yeux. Vos managers arrivent préparés et vos collaborateurs comprennent les choix.",
      },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
