"use client";

import { useState } from "react";

const MIN = 44000;
const MAX = 64000;
const BASELINE = 48000; // salaire actuel
const MARKET_MEDIAN = 54000; // médiane marché

function tone(salary: number) {
  if (salary < MARKET_MEDIAN - 4000) return "#d99a3a"; // sous le marché
  if (salary > MARKET_MEDIAN + 4000) return "#3a78d9"; // au-dessus
  return "#1f8f57"; // aligné
}

export function HeroSimulator() {
  const [salary, setSalary] = useState(52000);

  const raise = (salary - BASELINE) / BASELINE;
  const pos = Math.max(0, Math.min(100, ((salary - MIN) / (MAX - MIN)) * 100));
  const medianPos = ((MARKET_MEDIAN - MIN) / (MAX - MIN)) * 100;
  const color = tone(salary);

  return (
    <div className="overflow-hidden rounded-3xl border border-[#e2e7e2] bg-white shadow-[0_30px_80px_rgba(9,82,40,0.18)]">
      {/* En-tête */}
      <div className="flex items-center gap-3 bg-[var(--brand)] px-5 py-4 text-white">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
          CR
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Camille Roy</p>
          <p className="text-xs text-white/70">Product Designer · Senior</p>
        </div>
      </div>

      <div className="space-y-7 p-6">
        {/* Salaire projeté + variation */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">
              Salaire simulé
            </p>
            <p className="mt-1 text-4xl font-semibold tabular-nums text-[var(--text)]">
              {salary.toLocaleString("fr-FR")} €
            </p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-sm font-semibold tabular-nums"
            style={{
              backgroundColor: raise >= 0 ? "rgba(31,143,87,0.12)" : "rgba(217,154,58,0.14)",
              color: raise >= 0 ? "#1f8f57" : "#d99a3a",
            }}
          >
            {raise >= 0 ? "+" : ""}
            {(raise * 100).toFixed(1)} %
          </span>
        </div>

        {/* Slider */}
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={500}
          value={salary}
          onChange={(e) => setSalary(Number(e.target.value))}
          className="w-full cursor-pointer accent-[var(--brand)]"
          aria-label="Projeter une augmentation"
        />

        {/* Positionnement marché */}
        <div>
          <div className="relative mt-2 h-2.5 w-full rounded-full bg-muted">
            {/* médiane marché */}
            <span
              className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 rounded bg-[color:rgba(11,11,11,0.25)]"
              style={{ left: `${medianPos}%` }}
            />
            {/* marqueur talent */}
            <span
              className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-md transition-all duration-150"
              style={{ left: `${pos}%`, backgroundColor: color }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[color:rgba(11,11,11,0.55)]">
            <span>Marché : médiane {MARKET_MEDIAN.toLocaleString("fr-FR")} €</span>
            <span className="font-semibold" style={{ color }}>
              {salary < MARKET_MEDIAN - 4000
                ? "Sous le marché"
                : salary > MARKET_MEDIAN + 4000
                  ? "Au-dessus du marché"
                  : "Aligné au marché"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
