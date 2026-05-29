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
  pctVsMedian: number;
  approximatePercentile: number;
  inseeMedianNetMonthly: number;
  hovered: boolean;
  onHover: (on: boolean) => void;
};

function TalentMarkerShape({
  cx = 0,
  cy = 0,
  firstName,
  lastName,
  avatarUrl,
  netMonthly,
  pctVsMedian,
  approximatePercentile,
  inseeMedianNetMonthly,
  hovered,
  onHover,
}: MarkerProps) {
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
  const pctLabel = pctVsMedian >= 0 ? `+${pctVsMedian} %` : `${pctVsMedian} %`;

  return (
    <g
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: "pointer" }}
    >
      <line x1={cx} y1={cy} x2={cx} y2={cy + 32} stroke={BRAND} strokeWidth={1.5} strokeDasharray="3 3" />
      <foreignObject x={cx - 22} y={cy - 58} width={44} height={56}>
        <div className="flex flex-col items-center gap-0.5">
          <div
            className={`rounded-full bg-white p-0.5 shadow-md transition-transform ${
              hovered ? "scale-110 ring-2 ring-[var(--brand)] ring-offset-1" : "ring-2 ring-[var(--brand)]"
            }`}
          >
            <Avatar firstName={firstName} lastName={lastName} avatarUrl={avatarUrl} size="sm" />
          </div>
          <span className="max-w-[96px] rounded bg-white/95 px-1.5 py-0.5 text-center text-[8px] font-semibold leading-tight text-[var(--brand)] shadow-sm ring-1 ring-[#e2e7e2]">
            Toi · {netMonthly.toLocaleString("fr-FR")} €
          </span>
        </div>
      </foreignObject>
      {hovered && (
        <foreignObject x={cx - 88} y={cy - 148} width={176} height={88}>
          <div className="rounded-xl border border-[#e2e7e2] bg-white px-3 py-2 text-[10px] shadow-lg">
            <p className="font-semibold text-[var(--text)]">
              {firstName} {lastName}
            </p>
            <p className="mt-1 text-[color:rgba(11,11,11,0.65)]">
              <strong>{netMonthly.toLocaleString("fr-FR")} €</strong> net / mois
            </p>
            <p className="mt-0.5 text-[color:rgba(11,11,11,0.55)]">
              {pctLabel} vs médiane (~{inseeMedianNetMonthly.toLocaleString("fr-FR")} €)
            </p>
            <p className="mt-0.5 font-medium text-[var(--brand)]">
              ~{Math.round(approximatePercentile)}e percentile national
            </p>
          </div>
        </foreignObject>
      )}
    </g>
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
  const talentCurveY = inseeCurveValueAtNet(netMonthlyEstimated);

  const markerProps: Omit<MarkerProps, "cx" | "cy" | "hovered" | "onHover"> = {
    firstName,
    lastName,
    avatarUrl,
    netMonthly: netMonthlyEstimated,
    pctVsMedian,
    approximatePercentile,
    inseeMedianNetMonthly,
  };

  return (
    <div className="mt-4 w-full">
      <div className="h-[min(340px,56vw)] min-h-[260px] w-full sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 72, right: 16, left: 8, bottom: 12 }}
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
                offset: 8,
              }}
            />
            <ReferenceLine x={netMonthlyEstimated} stroke={BRAND} strokeOpacity={0.35} strokeWidth={1} />
            <ReferenceDot
              x={netMonthlyEstimated}
              y={talentCurveY}
              shape={(props) => (
                <TalentMarkerShape
                  {...props}
                  {...markerProps}
                  hovered={talentHovered}
                  onHover={setTalentHovered}
                />
              )}
              isFront
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-[10px] text-[color:rgba(11,11,11,0.45)]">
        Survolez les barres ou votre repère « Toi » pour plus de détails · données publiques indicatives
      </p>
    </div>
  );
}
