/** Palier = tranche de 5 pts de % autour de la médiane Insee (net mensuel estimé / médiane - 1) * 100. */
export function frSalaryGameBucket(pctVsReference: number): number {
  return Math.max(-24, Math.min(28, Math.round(pctVsReference / 5)));
}

export function frSalaryGameTitle(bucket: number): { title: string; emoji: string; blurb: string } {
  if (bucket <= -20) return { title: "Explorateur du marché", emoji: "🧭", blurb: "Chaque discussion sur la valeur crée compte." };
  if (bucket <= -15) return { title: "Cap progression", emoji: "🎯", blurb: "Les objectifs clairs ouvrent les négociations." };
  if (bucket <= -10) return { title: "Piste d’envol", emoji: "🛫", blurb: "Documente tes impacts pour monter en puissance." };
  if (bucket <= -5) return { title: "Montée en régime", emoji: "📈", blurb: "Tu te rapproches du niveau de référence indicative." };
  if (bucket <= -1) return { title: "Presque aligné", emoji: "⚖️", blurb: "Tu es tout proche de la médiane indicative nationale." };
  if (bucket === 0) return { title: "Aligné référence", emoji: "✅", blurb: "Tu es sur la médiane indicative utilisée pour le jeu." };
  if (bucket <= 4) return { title: "Au-dessus du lot", emoji: "🌿", blurb: "Tu dépasses déjà la référence : continue à capitaliser." };
  if (bucket <= 8) return { title: "Talent confirmé", emoji: "⭐", blurb: "Tes résultats se traduisent aussi en rémunération." };
  if (bucket <= 12) return { title: "Expert reconnu", emoji: "🏅", blurb: "Tu as de la marge pour négocier sur le scope ou l’impact." };
  if (bucket <= 16) return { title: "Négociateur aguerri", emoji: "💼", blurb: "Pense long terme : formation, mobilité, variable." };
  if (bucket <= 20) return { title: "Maître du package", emoji: "👑", blurb: "Garde une veille marché pour rester aligné." };
  return { title: "Sommet indicatif", emoji: "🏔️", blurb: "Référence indicative dépassée : reste factuel en entretien." };
}

export function nextBucketThresholdPct(currentBucket: number): number | null {
  if (currentBucket >= 28) return null;
  return (currentBucket + 1) * 5;
}
