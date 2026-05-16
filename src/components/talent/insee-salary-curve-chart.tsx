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
  ReferenceDot,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Avatar } from "@/components/ui/avatar";
import {
  buildInseeChartSeries,
  inseeChartDomain,
  inseeCurveValueAtNet,
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

type MarkerProps = {
  cx?: number;
  cy?: number;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  netMonthly: number;
};

function TalentMarkerShape({ cx = 0, cy = 0, firstName, lastName, avatarUrl, netMonthly }: MarkerProps) {
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
  return (
    <g>
      <line x1={cx} y1={cy} x2={cx} y2={cy + 28} stroke={BRAND} strokeWidth={1.5} strokeDasharray="3 3" />
      <foreignObject x={cx - 20} y={cy - 52} width={40} height={48}>
        <div className="flex flex-col items-center gap-0.5">
          <div className="rounded-full bg-white p-0.5 shadow-md ring-2 ring-[var(--brand)]">
            <Avatar firstName={firstName} lastName={lastName} avatarUrl={avatarUrl} size="sm" />
          </div>
          <span className="max-w-[88px] rounded bg-white/95 px-1 py-0.5 text-center text-[8px] font-semibold leading-tight text-[var(--brand)] shadow-sm ring-1 ring-[#e2e7e2]">
            Toi · {netMonthly.toLocaleString("fr-FR")} €
          </span>
        </div>
      </foreignObject>
    </g>
  );
}

/**
 * Distribution indicative Insee — graphique interactif (survol, infobulles, repères).
 */
export function InseeSalaryCurveChart({
  netMonthlyEstimated,
  inseeMedianNetMonthly,
  firstName,
  lastName,
  avatarUrl,
}: {
  netMonthlyEstimated: number;
  inseeMedianNetMonthly: number;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}) {
  const data = useMemo(() => buildInseeChartSeries(), []);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [domainMin, domainMax] = inseeChartDomain();
  const talentCurveY = inseeCurveValueAtNet(netMonthlyEstimated);

  const markerProps: Omit<MarkerProps, "cx" | "cy"> = {
    firstName,
    lastName,
    avatarUrl,
    netMonthly: netMonthlyEstimated,
  };

  return (
    <div className="mt-4 w-full">
      <div className="h-[min(320px,52vw)] min-h-[220px] w-full sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 56, right: 12, left: 4, bottom: 8 }}
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
            <YAxis hide domain={[0, 100]} allowDataOverflow />
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
              }}
            />
            <ReferenceLine x={netMonthlyEstimated} stroke={BRAND} strokeOpacity={0.35} strokeWidth={1} />
            <ReferenceDot
              x={netMonthlyEstimated}
              y={talentCurveY}
              shape={(props) => <TalentMarkerShape {...props} {...markerProps} />}
              isFront
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-[10px] text-[color:rgba(11,11,11,0.45)]">
        Survolez les barres pour voir chaque tranche · données publiques indicatives (secteur privé France)
      </p>
    </div>
  );
}
