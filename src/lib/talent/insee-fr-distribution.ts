/**
 * Repères publics Insee (secteur privé, salaire net mensuel, base « Tous salariés » 2024)
 * pour positionner le talent sur une distribution indicative — sans appel API.
 * Les montants nets sont issus des publications Insee courantes (médiane, déciles élevés).
 */

import { optionalEnv } from "@/env";

/** Médiane : 50 % des salariés gagnent plus que ce montant (net / mois). */
export const INSEE_PRIVATE_NET_MEDIAN_MONTHLY_2024 = 2190;

/** Décile élevé (top 10 % environ). */
export const INSEE_PRIVATE_NET_P90_MONTHLY_2024 = 4344;

/** Top 1 % environ. */
export const INSEE_PRIVATE_NET_P99_MONTHLY_2024 = 10261;

/** Zone basse indicative du graphique (stages / contrats courts, hors agricole). */
export const INSEE_PRIVATE_NET_FLOOR_MONTHLY_2024 = 1300;

export function readInseeMedianNetMonthly(): number {
  const raw = optionalEnv.INSEE_NET_MEDIAN_MONTHLY_OVERRIDE;
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
