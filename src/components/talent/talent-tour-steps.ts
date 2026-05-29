import type { GuidedTourStep } from "@/components/guided-tour/guided-tour-engine";

export const TALENT_TOUR_STORAGE_KEY = "leaft_talent_guided_tour_v5_done";

export function buildTalentTourSteps(options: {
  salaryVisible: boolean;
  hasProgression: boolean;
  skipRdv?: boolean;
}): GuidedTourStep[] {
  const steps: GuidedTourStep[] = [
    {
      id: "intro",
      kind: "modal",
      title: "Bienvenue",
      body: "Nous allons faire le tour de votre espace : profil, comparatif salarial, simulateur et organigramme. Cliquez sur les entrées du menu lorsque nous vous le demandons.",
    },
    {
      id: "hero",
      kind: "highlight",
      pathname: "/espace-talent",
      selector: '[data-tour="talent-welcome"]',
      title: "Votre profil",
      body: "Votre poste, équipe, manager et photo. Survolez l’avatar pour le modifier.",
    },
  ];

  if (options.salaryVisible) {
    steps.push({
      id: "remuneration",
      kind: "highlight",
      pathname: "/espace-talent",
      selector: '[data-tour="talent-remuneration-stats"]',
      title: "Votre rémunération",
      body: "Salaire annuel brut et position dans la grille interne de l’entreprise.",
    });
  }

  steps.push({
    id: "entretiens",
    kind: "highlight",
    pathname: "/espace-talent",
    selector: '[data-tour="talent-entretiens"]',
    title: "Mes entretiens",
    body: "Historique, prochains entretiens et demandes de rendez-vous avec votre manager ou les RH.",
  });

  if (options.hasProgression) {
    steps.push({
      id: "progression",
      kind: "highlight",
      pathname: "/espace-talent",
      selector: '[data-tour="talent-progression"]',
      title: "Ma progression",
      body: "L’évolution de votre rémunération et de votre parcours dans l’entreprise.",
    });
  }

  steps.push(
    {
      id: "go_comparatif",
      kind: "navigate",
      pathname: "/espace-talent",
      navSelector: '[data-tour="talent-nav-comparatif"]',
      waitPathname: "/espace-talent/comparatif",
      title: "Page Comparatif",
      body: "Cliquez sur « Comparatif » dans le menu pour voir le marché et la référence France.",
      showNext: false,
    },
    {
      id: "comparatif_marche",
      kind: "highlight",
      pathname: "/espace-talent/comparatif",
      selector: '[data-tour="talent-marche-emploi"]',
      title: "Comparatif marché",
      body: "Fourchette issue des offres Indeed et Glassdoor, et position de votre équipe sur cette échelle.",
    },
    {
      id: "comparatif_france",
      kind: "highlight",
      pathname: "/espace-talent/comparatif",
      selector: '[data-tour="talent-reference-france"]',
      title: "Référence France",
      body: "Où vous vous situez par rapport aux salaires nets du secteur privé (données publiques).",
    },
    {
      id: "go_simulateur",
      kind: "navigate",
      pathname: "/espace-talent/comparatif",
      navSelector: '[data-tour="talent-nav-simulateur"]',
      waitPathname: "/espace-talent/simulateur",
      title: "Simulateur",
      body: "Cliquez sur « Simulateur » pour projeter une évolution de rémunération.",
      showNext: false,
    },
    {
      id: "simulateur",
      kind: "highlight",
      pathname: "/espace-talent/simulateur",
      selector: '[data-tour="talent-simulateur-params"]',
      title: "Paramètres de simulation",
      body: "Modifiez département, palier, management ou ancienneté pour voir la rémunération projetée.",
    },
    {
      id: "go_organigramme",
      kind: "navigate",
      pathname: "/espace-talent/simulateur",
      navSelector: '[data-tour="talent-nav-organigramme"]',
      waitPathname: "/espace-talent/organigramme",
      title: "Organigramme",
      body: "Cliquez sur « Organigramme » pour visualiser la hiérarchie de l’entreprise.",
      showNext: false,
    },
    {
      id: "organigramme",
      kind: "highlight",
      pathname: "/espace-talent/organigramme",
      selector: '[data-tour="talent-organigramme-view"]',
      title: "Vue organigramme",
      body: "Filtrez par équipe ou chaîne managériale, exportez en PNG si besoin.",
    },
    {
      id: "go_profil_rdv",
      kind: "navigate",
      pathname: "/espace-talent/organigramme",
      navSelector: '[data-tour="talent-nav-profil"]',
      waitPathname: "/espace-talent",
      title: "Retour au profil",
      body: options.skipRdv
        ? "Cliquez sur « Mon profil » pour terminer la visite."
        : "Cliquez sur « Mon profil » pour découvrir la demande de rendez-vous.",
      showNext: false,
    },
  );

  if (!options.skipRdv) {
    steps.push({
      id: "rdv_hint",
      kind: "highlight",
      pathname: "/espace-talent",
      selector: "#talent-tour-rdv-btn",
      title: "Demander un rendez-vous",
      body: "Cliquez sur « Demander un RDV » pour ouvrir le formulaire (vous pourrez l’annuler ensuite).",
      showNext: false,
    });
  }

  steps.push(
    {
      id: "outro",
      kind: "modal",
      title: "C’est tout pour le tour",
      body: "Explorez librement votre espace. Vous pouvez relancer ce guide avec ?tour=replay sur la page profil.",
    },
  );

  return steps;
}
