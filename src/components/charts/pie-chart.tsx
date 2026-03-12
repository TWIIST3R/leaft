"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type PieItem = { label: string; value: number; color: string };

const COLORS = [
  "var(--brand)", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6",
  "#10b981", "#ec4899", "#6366f1", "#14b8a6", "#f97316",
];

export function PieChart({
  items,
  size = 180,
  strokeWidth = 36,
  showLegend = true,
}: {
  items: PieItem[];
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const total = items.reduce((s, i) => s + i.value, 0);

  useEffect(() => {
    if (!svgRef.current || total === 0) return;
    const circles = svgRef.current.querySelectorAll("[data-slice]");
    gsap.fromTo(
      circles,
      { strokeDashoffset: (i: number) => {
        const pct = items[i].value / total;
        return pct * Math.PI * (size - strokeWidth);
      }},
      { strokeDashoffset: 0, duration: 0.9, stagger: 0.06, ease: "power2.out" }
    );
  }, [items, total, size, strokeWidth]);

  if (total === 0) {
    return <p className="text-sm text-[color:rgba(11,11,11,0.5)]">Aucune donnée</p>;
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg ref={svgRef} width={size} height={size} className="shrink-0 -rotate-90">
        {items.map((item, i) => {
          const pct = item.value / total;
          const dash = pct * circumference;
          const currentOffset = offset;
          offset += dash;
          return (
            <circle
              key={item.label}
              data-slice
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color || COLORS[i % COLORS.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      {showLegend && (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.color || COLORS[i % COLORS.length] }}
              />
              <span className="text-sm text-[var(--text)]">{item.label}</span>
              <span className="text-xs font-medium text-[color:rgba(11,11,11,0.5)]">
                {item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { COLORS as PIE_COLORS };
