"use client";

import { useState } from "react";

const MIN = 42000;
const MID = 54000;
const MAX = 66000;
const BASELINE = 48000; // salaire actuel
const P25 = 44000;
const P50 = 52000;
const P75 = 60000;

function color(ratio: number) {
  if (ratio < 0.92) return "#d99a3a";
  if (ratio > 1.08) return "#3a78d9";
  return "#1f8f57";
}

export function HeroSimulator() {
  const [salary, setSalary] = useState(52000);

  const ratio = salary / MID;
  const raise = (salary - BASELINE) / BASELINE;
  const lo = P25 - 5000;
  const hi = P75 + 5000;
  const at = (v: number) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));

  return (
    <div className="overflow-hidden rounded-3xl border border-[#e2e7e2] bg-white shadow-[0_30px_80px_rgba(9,82,40,0.18)]">
      {/* En-tête contrasté */}
      <div className="flex items-center justify-between bg-[var(--brand)] px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
            CR
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Camille Roy</p>
            <p className="text-xs text-white/70">Product Designer · Senior</p>
          </div>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">Simulation</span>
      </div>

      <div className="space-y-6 p-6">
        {/* Salaire projeté */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">
              Salaire projeté
            </p>
            <p className="mt-1 text-3xl font-semibold text-[var(--text)]">
              {salary.toLocaleString("fr-FR")} €
            </p>
            <p className="text-xs text-[color:rgba(11,11,11,0.5)]">
              Actuel : {BASELINE.toLocaleString("fr-FR")} €
            </p>
          </div>
          <div className="text-right">
            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold"
              style={{
                backgroundColor: raise >= 0 ? "rgba(31,143,87,0.12)" : "rgba(217,154,58,0.14)",
                color: raise >= 0 ? "#1f8f57" : "#d99a3a",
              }}
            >
              {raise >= 0 ? "+" : ""}
              {(raise * 100).toFixed(1)} %
            </span>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.5)]">vs salaire actuel</p>
          </div>
        </div>

        {/* Slider */}
        <div>
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
          <p className="mt-1 text-center text-xs text-[color:rgba(11,11,11,0.55)]">
            Faites glisser pour projeter une augmentation
          </p>
        </div>

        {/* Compa-ratio */}
        <div className="flex items-center justify-between rounded-[var(--radius)] bg-muted px-4 py-3">
          <span className="text-sm font-medium text-[color:rgba(11,11,11,0.7)]">Positionnement dans le niveau</span>
          <span
            className="rounded-full px-2.5 py-1 text-sm font-semibold"
            style={{ backgroundColor: `${color(ratio)}1a`, color: color(ratio) }}
          >
            {(ratio * 100).toFixed(0)} %
          </span>
        </div>

        {/* Jauge marché */}
        <div>
          <p className="mb-6 text-xs font-medium uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">
            Face au marché — Product Designer
          </p>
          <div className="relative h-2.5 w-full rounded-full bg-muted">
            <div
              className="absolute top-0 h-2.5 rounded-full bg-[color:rgba(9,82,40,0.18)]"
              style={{ left: `${at(P25)}%`, width: `${at(P75) - at(P25)}%` }}
            />
            {[
              { v: P25, label: "p25" },
              { v: P50, label: "Médiane" },
              { v: P75, label: "p75" },
            ].map((m) => (
              <div key={m.label} className="absolute -top-5 -translate-x-1/2 text-center" style={{ left: `${at(m.v)}%` }}>
                <p className="text-[10px] font-medium text-[color:rgba(11,11,11,0.5)]">{m.label}</p>
              </div>
            ))}
            <span
              className="absolute -top-1.5 h-6 w-6 -translate-x-1/2 rounded-full border-[3px] border-white shadow-md transition-all duration-150"
              style={{ left: `${at(salary)}%`, backgroundColor: color(ratio) }}
            />
            <span
              className="absolute top-7 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-semibold text-white transition-all duration-150"
              style={{ left: `${at(salary)}%` }}
            >
              Camille · {Math.round(salary / 1000)}k€
            </span>
          </div>
          <div className="mt-10" />
        </div>
      </div>
    </div>
  );
}
