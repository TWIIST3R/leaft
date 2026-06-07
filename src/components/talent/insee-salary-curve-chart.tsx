"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Avatar } from "@/components/ui/avatar";
import {
  buildInseeChartSeries,
  inseeChartDomain,
  type InseeChartPoint,
} from "@/lib/talent/insee-chart-series";

const BRAND = "#095228";
const BRAND_LIGHT = "rgba(9,82,40,0.35)";

function formatNetTick(v: number): string {
  if (v >= 1000) return `${Math.round(v / 100) / 10}k`;
  return String(v);
}

function InseeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: InseeChartPoint }[];
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-[#e2e7e2] bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-[var(--text)]">{p.rangeLabel} net / mois</p>
      <p className="mt-1 text-[color:rgba(11,11,11,0.65)]">
        Densité indicative : <strong>{p.density} %</strong> du pic observé
      </p>
    </div>
  );
}

/**
 * Distribution indicative Insee — graphique interactif (survol, infobulles, repères).
 */
export function InseeSalaryCurveChart({
  netMonthlyEstimated,
  inseeMedianNetMonthly,
  pctVsMedian,
  approximatePercentile,
  firstName,
  lastName,
  avatarUrl,
}: {
  netMonthlyEstimated: number;
  inseeMedianNetMonthly: number;
  pctVsMedian: number;
  approximatePercentile: number;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}) {
  const data = useMemo(() => buildInseeChartSeries(), []);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [talentHovered, setTalentHovered] = useState(false);
  const [domainMin, domainMax] = inseeChartDomain();

  const markerLeftPct = useMemo(() => {
    const span = domainMax - domainMin;
    if (span <= 0) return 50;
    return Math.max(6, Math.min(94, ((netMonthlyEstimated - domainMin) / span) * 100));
  }, [netMonthlyEstimated, domainMin, domainMax]);

  const pctLabel = pctVsMedian >= 0 ? `+${pctVsMedian} %` : `${pctVsMedian} %`;

  return (
    <div className="mt-4 w-full">
      <div className="relative">
        <div className="relative mx-2 mb-1 h-[88px] sm:h-[92px]">
          <div
            className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${markerLeftPct}%` }}
            onMouseEnter={() => setTalentHovered(true)}
            onMouseLeave={() => setTalentHovered(false)}
          >
            {talentHovered && (
              <div className="absolute bottom-full z-20 mb-2 w-[min(100vw-2rem,11rem)] rounded-xl border border-[#e2e7e2] bg-white px-3 py-2 text-[10px] shadow-lg">
                <p className="font-semibold text-[var(--text)]">
                  {firstName} {lastName}
                </p>
                <p className="mt-1 text-[color:rgba(11,11,11,0.65)]">
                  <strong>{netMonthlyEstimated.toLocaleString("fr-FR")} €</strong> net / mois
                </p>
                <p className="mt-0.5 text-[color:rgba(11,11,11,0.55)]">
                  {pctLabel} vs médiane (~{inseeMedianNetMonthly.toLocaleString("fr-FR")} €)
                </p>
                <p className="mt-0.5 font-medium text-[var(--brand)]">
                  ~{Math.round(approximatePercentile)}e percentile national
                </p>
              </div>
            )}
            <div
              className={`rounded-full bg-white p-0.5 shadow-md transition-transform ${
                talentHovered ? "scale-110 ring-2 ring-[var(--brand)] ring-offset-1" : "ring-2 ring-[var(--brand)]"
              }`}
            >
              <Avatar firstName={firstName} lastName={lastName} avatarUrl={avatarUrl} size="sm" />
            </div>
            <span className="mt-1 rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-[var(--brand)] shadow-sm ring-1 ring-[#e2e7e2]">
              Toi · {netMonthlyEstimated.toLocaleString("fr-FR")} €
            </span>
            <span className="mt-1 h-3 w-px bg-[var(--brand)]/60" aria-hidden />
          </div>
        </div>

        <div className="h-[min(380px,58vw)] min-h-[280px] w-full sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 16, left: 8, bottom: 12 }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(11,11,11,0.08)" />
              <XAxis
                type="number"
                dataKey="netMid"
                domain={[domainMin, domainMax]}
                tickFormatter={formatNetTick}
                tick={{ fontSize: 10, fill: "rgba(11,11,11,0.45)" }}
                axisLine={{ stroke: "rgba(11,11,11,0.15)" }}
                tickLine={false}
                label={{
                  value: "Salaire net mensuel (€)",
                  position: "insideBottom",
                  offset: -2,
                  style: { fontSize: 10, fill: "rgba(11,11,11,0.5)" },
                }}
              />
              <YAxis hide domain={[0, 112]} allowDataOverflow />
              <Tooltip content={<InseeTooltip />} cursor={{ fill: "rgba(9,82,40,0.06)" }} />
              <Bar
                dataKey="density"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                onMouseEnter={(_, index) => setActiveIndex(index)}
              >
                {data.map((_, i) => (
                  <Cell key={`bar-${i}`} fill={activeIndex === i ? BRAND : BRAND_LIGHT} />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="curve"
                stroke={BRAND}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: BRAND, stroke: "#fff", strokeWidth: 2 }}
                isAnimationActive
                animationDuration={800}
              />
              <ReferenceLine
                x={inseeMedianNetMonthly}
                stroke="rgba(11,11,11,0.35)"
                strokeDasharray="5 5"
                label={{
                  value: "Médiane indicative",
                  position: "insideTopRight",
                  fill: "rgba(11,11,11,0.5)",
                  fontSize: 10,
                  offset: 8,
                }}
              />
              <ReferenceLine x={netMonthlyEstimated} stroke={BRAND} strokeOpacity={0.35} strokeWidth={1.5} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-[color:rgba(11,11,11,0.45)]">
        Survolez les barres ou votre repère « Toi » pour plus de détails · données publiques indicatives
      </p>
    </div>
  );
}
