"use client";

import { Avatar } from "@/components/ui/avatar";
import {
  INSEE_CHART_NET_MAX,
  INSEE_CHART_NET_MIN,
  INSEE_INSPIRED_NET_MONTHLY_HISTOGRAM,
  readInseeMedianNetMonthly,
} from "@/lib/talent/insee-fr-distribution";

const VB_W = 640;
const VB_H = 200;
const PAD_L = 36;
const PAD_R = 16;
const PAD_B = 28;
const PAD_T = 12;
const PLOT_W = VB_W - PAD_L - PAD_R;
const PLOT_H = VB_H - PAD_T - PAD_B;

function xNetToSvg(net: number): number {
  const n = Math.max(INSEE_CHART_NET_MIN, Math.min(INSEE_CHART_NET_MAX, net));
  const t = (n - INSEE_CHART_NET_MIN) / (INSEE_CHART_NET_MAX - INSEE_CHART_NET_MIN);
  return PAD_L + t * PLOT_W;
}

function curveYAtNet(net: number): number {
  const bins = INSEE_INSPIRED_NET_MONTHLY_HISTOGRAM;
  const maxRel = Math.max(...bins.map((b) => b.rel), 0.01);
  for (const b of bins) {
    if (net >= b.from && net <= b.to) {
      const mid = (b.from + b.to) / 2;
      const half = (b.to - b.from) / 2 || 1;
      const bell = 1 - Math.min(1, Math.abs(net - mid) / half);
      const h = (b.rel / maxRel) * PLOT_H * (0.62 + 0.38 * bell);
      return PAD_T + PLOT_H - h;
    }
  }
  if (net < bins[0]!.from) {
    const b = bins[0]!;
    const h = (b.rel / maxRel) * PLOT_H * 0.42;
    return PAD_T + PLOT_H - h;
  }
  const b = bins[bins.length - 1]!;
  const h = (b.rel / maxRel) * PLOT_H * 0.28;
  return PAD_T + PLOT_H - h;
}

/**
 * Distribution indicative Insee (histogramme + courbe) — distinct des données HasData / offres.
 */
export function InseeSalaryCurveChart({
  netMonthlyEstimated,
  firstName,
  lastName,
  avatarUrl,
}: {
  netMonthlyEstimated: number;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}) {
  const median = readInseeMedianNetMonthly();
  const maxRel = Math.max(...INSEE_INSPIRED_NET_MONTHLY_HISTOGRAM.map((b) => b.rel), 0.01);

  const bars = INSEE_INSPIRED_NET_MONTHLY_HISTOGRAM.map((b) => {
    const x1 = xNetToSvg(b.from);
    const x2 = xNetToSvg(b.to);
    const w = Math.max(2, x2 - x1);
    const h = (b.rel / maxRel) * PLOT_H;
    const y = PAD_T + PLOT_H - h;
    return { x1, w, h, y, key: `${b.from}-${b.to}` };
  });

  const centers = INSEE_INSPIRED_NET_MONTHLY_HISTOGRAM.map((b) => {
    const cx = xNetToSvg((b.from + b.to) / 2);
    const h = (b.rel / maxRel) * PLOT_H;
    const cy = PAD_T + PLOT_H - h;
    return { cx, cy };
  });
  const linePoints = centers.map((c) => `${c.cx.toFixed(1)},${c.cy.toFixed(1)}`).join(" ");

  const talentX = xNetToSvg(netMonthlyEstimated);
  const talentY = curveYAtNet(netMonthlyEstimated);
  const medianX = xNetToSvg(median);

  return (
    <div className="relative mt-3 w-full">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="h-auto w-full max-w-full text-[var(--text)]"
        role="img"
        aria-label="Courbe indicative de répartition des salaires nets mensuels secteur privé France"
      >
        <defs>
          <linearGradient id="inseeBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(9,82,40,0.35)" />
            <stop offset="100%" stopColor="rgba(9,82,40,0.06)" />
          </linearGradient>
          <linearGradient id="inseeLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7a9a7a" />
            <stop offset="50%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="#0b3d1f" />
          </linearGradient>
        </defs>

        {bars.map((b) => (
          <rect key={b.key} x={b.x1} y={b.y} width={b.w} height={b.h} rx={3} fill="url(#inseeBarGrad)" />
        ))}

        <polyline
          points={linePoints}
          fill="none"
          stroke="url(#inseeLineGrad)"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.92}
        />

        <line x1={medianX} y1={PAD_T} x2={medianX} y2={PAD_T + PLOT_H} stroke="rgba(11,11,11,0.22)" strokeDasharray="5 5" />
        <text x={medianX} y={VB_H - 6} textAnchor="middle" className="fill-[rgba(11,11,11,0.45)] text-[10px] font-medium">
          Médiane indicative
        </text>

        <text x={PAD_L} y={VB_H - 6} textAnchor="start" className="fill-[rgba(11,11,11,0.4)] text-[9px]">
          {INSEE_CHART_NET_MIN.toLocaleString("fr-FR")} €
        </text>
        <text x={VB_W - PAD_R} y={VB_H - 6} textAnchor="end" className="fill-[rgba(11,11,11,0.4)] text-[9px]">
          {INSEE_CHART_NET_MAX.toLocaleString("fr-FR")} €
        </text>
      </svg>

      <div
        className="pointer-events-none absolute z-[3] flex -translate-x-1/2 flex-col items-center gap-1"
        style={{
          left: `${(talentX / VB_W) * 100}%`,
          top: `${(talentY / VB_H) * 100}%`,
          transform: "translate(-50%, calc(-100% - 10px))",
        }}
      >
        <div className="rounded-full bg-white p-0.5 shadow-lg ring-2 ring-[var(--brand)]">
          <Avatar firstName={firstName} lastName={lastName} avatarUrl={avatarUrl} size="sm" />
        </div>
        <span className="max-w-[140px] rounded bg-white/95 px-1.5 py-0.5 text-center text-[9px] font-semibold leading-tight text-[var(--brand)] shadow-sm ring-1 ring-[#e2e7e2]">
          Toi (~{netMonthlyEstimated.toLocaleString("fr-FR")} € net / mois)
        </span>
      </div>
    </div>
  );
}
