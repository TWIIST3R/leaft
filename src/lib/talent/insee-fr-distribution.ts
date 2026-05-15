/**
 * Repères publics Insee (secteur privé, salaire net mensuel, base « Tous salariés » 2024)
 * pour positionner le talent sur une distribution indicative — sans appel API.
 * Les montants nets sont issus des publications Insee courantes (médiane, déciles élevés).
 *
 * Ne pas importer @/env ici : ce module est utilisé par des composants client (graph Insee) ;
 * charger env.ts exécuterait aussi serverEnv (CLERK_SECRET_KEY, etc.) et ferait planter le navigateur.
 */

/** Médiane : 50 % des salariés gagnent plus que ce montant (net / mois). */
export const INSEE_PRIVATE_NET_MEDIAN_MONTHLY_2024 = 2190;

/** Décile élevé (top 10 % environ). */
export const INSEE_PRIVATE_NET_P90_MONTHLY_2024 = 4344;

/** Top 1 % environ. */
export const INSEE_PRIVATE_NET_P99_MONTHLY_2024 = 10261;

/** Zone basse indicative du graphique (stages / contrats courts, hors agricole). */
export const INSEE_PRIVATE_NET_FLOOR_MONTHLY_2024 = 1300;

/**
 * Histogramme indicatif (forme proche des courbes Insee « tous salariés » privé, net / mois).
 * Hauteurs relatives uniquement — pour visualisation, pas des effectifs officiels.
 */
export const INSEE_INSPIRED_NET_MONTHLY_HISTOGRAM: { from: number; to: number; rel: number }[] = [
  { from: 900, to: 1300, rel: 0.12 },
  { from: 1300, to: 1500, rel: 0.38 },
  { from: 1500, to: 1700, rel: 0.62 },
  { from: 1700, to: 1900, rel: 0.72 },
  { from: 1900, to: 2100, rel: 0.58 },
  { from: 2100, to: 2400, rel: 0.45 },
  { from: 2400, to: 2800, rel: 0.32 },
  { from: 2800, to: 3400, rel: 0.24 },
  { from: 3400, to: 4200, rel: 0.18 },
  { from: 4200, to: 5200, rel: 0.13 },
  { from: 5200, to: 7000, rel: 0.09 },
  { from: 7000, to: 9500, rel: 0.06 },
  { from: 9500, to: 14000, rel: 0.04 },
];

export const INSEE_CHART_NET_MIN = 900;
export const INSEE_CHART_NET_MAX = 14000;

export function readInseeMedianNetMonthly(): number {
  const raw = process.env.INSEE_NET_MEDIAN_MONTHLY_OVERRIDE;
  if (raw) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 800 && n < 8000) return Math.round(n);
  }
  return INSEE_PRIVATE_NET_MEDIAN_MONTHLY_2024;
}

/**
 * Estimation indicative : brut annuel → net mensuel (coefficient volontairement simple,
 * à affiner côté produit si besoin d’une paie plus précise).
 */
export function estimateNetMonthlyFromAnnualBrut(annualBrut: number): number {
  return (annualBrut / 12) * 0.75;
}

/** % au-dessus / en dessous de la médiane Insee (net mensuel). */
export function pctVsInseeMedianNetMonthly(netMonthly: number): number {
  const med = readInseeMedianNetMonthly();
  if (med <= 0) return 0;
  return Math.round((netMonthly / med - 1) * 100);
}

/**
 * Percentile approximatif (0–100) sur la base de segments linéaires entre repères Insee 2024.
 * Lecture indicative uniquement (pas un calcul officiel Insee).
 */
export function approximatePrivateNetPercentile2024(netMonthly: number): number {
  const points: { x: number; p: number }[] = [
    { x: INSEE_PRIVATE_NET_FLOOR_MONTHLY_2024, p: 8 },
    { x: INSEE_PRIVATE_NET_MEDIAN_MONTHLY_2024, p: 50 },
    { x: INSEE_PRIVATE_NET_P90_MONTHLY_2024, p: 90 },
    { x: INSEE_PRIVATE_NET_P99_MONTHLY_2024, p: 99 },
    { x: 16_000, p: 99.7 },
  ];
  if (netMonthly <= points[0].x) return Math.max(0, (netMonthly / points[0].x) * points[0].p);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (netMonthly <= b.x) {
      const t = (netMonthly - a.x) / (b.x - a.x);
      return a.p + t * (b.p - a.p);
    }
  }
  return 99.9;
}
