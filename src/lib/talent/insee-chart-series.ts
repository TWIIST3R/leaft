import {
  INSEE_CHART_NET_MAX,
  INSEE_CHART_NET_MIN,
  INSEE_INSPIRED_NET_MONTHLY_HISTOGRAM,
} from "@/lib/talent/insee-fr-distribution";

export type InseeChartPoint = {
  netMid: number;
  netFrom: number;
  netTo: number;
  rangeLabel: string;
  density: number;
  curve: number;
};

function curveHeightAtNet(net: number, maxRel: number): number {
  const bins = INSEE_INSPIRED_NET_MONTHLY_HISTOGRAM;
  for (const b of bins) {
    if (net >= b.from && net <= b.to) {
      const mid = (b.from + b.to) / 2;
      const half = (b.to - b.from) / 2 || 1;
      const bell = 1 - Math.min(1, Math.abs(net - mid) / half);
      return (b.rel / maxRel) * (0.62 + 0.38 * bell);
    }
  }
  if (net < bins[0]!.from) return (bins[0]!.rel / maxRel) * 0.42;
  return (bins[bins.length - 1]!.rel / maxRel) * 0.28;
}

/** Séries pour le graphique Insee (histogramme + courbe), échelle density/curve en 0–100. */
export function buildInseeChartSeries(): InseeChartPoint[] {
  const maxRel = Math.max(...INSEE_INSPIRED_NET_MONTHLY_HISTOGRAM.map((b) => b.rel), 0.01);
  return INSEE_INSPIRED_NET_MONTHLY_HISTOGRAM.map((b) => {
    const netMid = Math.round((b.from + b.to) / 2);
    const curve = curveHeightAtNet(netMid, maxRel) * 100;
    return {
      netMid,
      netFrom: b.from,
      netTo: b.to,
      rangeLabel: `${b.from.toLocaleString("fr-FR")} – ${b.to.toLocaleString("fr-FR")} €`,
      density: Math.round((b.rel / maxRel) * 100),
      curve: Math.round(curve),
    };
  });
}

export function inseeChartDomain(): [number, number] {
  return [INSEE_CHART_NET_MIN, INSEE_CHART_NET_MAX];
}

export function inseeCurveValueAtNet(net: number): number {
  const maxRel = Math.max(...INSEE_INSPIRED_NET_MONTHLY_HISTOGRAM.map((b) => b.rel), 0.01);
  return Math.round(curveHeightAtNet(net, maxRel) * 100);
}
