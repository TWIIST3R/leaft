"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

type DataPoint = { label: string; value: number };

export function LineChart({
  data,
  height = 200,
  color = "var(--brand)",
  formatValue,
}: {
  data: DataPoint[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: string } | null>(null);

  const fmt = formatValue ?? ((v: number) => v.toLocaleString("fr-FR"));

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || data.length < 2) return;
    const path = svgRef.current.querySelector("[data-line]") as SVGPathElement | null;
    const area = svgRef.current.querySelector("[data-area]") as SVGPathElement | null;
    if (path) {
      const len = path.getTotalLength();
      gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.2, ease: "power2.out" });
    }
    if (area) {
      gsap.fromTo(area, { opacity: 0 }, { opacity: 0.15, duration: 1, ease: "power2.out" });
    }
    const dots = svgRef.current.querySelectorAll("[data-dot]");
    gsap.fromTo(dots, { scale: 0 }, { scale: 1, duration: 0.3, stagger: 0.04, ease: "back.out(2)", delay: 0.4 });
  }, [data, width]);

  if (data.length < 2) {
    return <p className="text-sm text-[color:rgba(11,11,11,0.5)]">Pas assez de données</p>;
  }

  const padX = 10;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = Math.min(...data.map((d) => d.value), 0);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - ((d.value - minVal) / range) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible">
        <path data-area d={areaPath} fill={color} opacity={0} />
        <path data-line d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            data-dot
            cx={p.x}
            cy={p.y}
            r={4}
            fill="white"
            stroke={color}
            strokeWidth={2}
            className="cursor-pointer"
            onMouseEnter={() => setTooltip({ x: p.x, y: p.y, label: p.label, value: fmt(p.value) })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </svg>
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-[#e2e7e2] bg-white px-3 py-1.5 text-xs shadow-md"
          style={{ left: tooltip.x, top: tooltip.y - 36, transform: "translateX(-50%)" }}
        >
          <span className="font-medium text-[var(--text)]">{tooltip.value}</span>
          <span className="ml-1 text-[color:rgba(11,11,11,0.5)]">{tooltip.label}</span>
        </div>
      )}
      <div className="mt-1 flex justify-between px-2">
        {data.filter((_, i) => i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 6) === 0).map((d, i) => (
          <span key={i} className="text-[10px] text-[color:rgba(11,11,11,0.4)]">{d.label}</span>
        ))}
      </div>
    </div>
  );
}
