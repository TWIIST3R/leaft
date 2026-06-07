"use client";

import { useEffect, useMemo, useState } from "react";

type TabKey = "grille" | "simulateur" | "organigramme" | "marche";

const TABS: { key: TabKey; label: string; hint: string }[] = [
  { key: "grille", label: "Grille & équité", hint: "Des salaires lisibles pour tous" },
  { key: "simulateur", label: "Simulateur", hint: "Projeter une augmentation" },
  { key: "organigramme", label: "Organigramme", hint: "Voir toute l'équipe" },
  { key: "marche", label: "Repères marché", hint: "Se situer face au marché" },
];

function compaColor(ratio: number) {
  if (ratio < 0.92) return "#d99a3a"; // sous la fourchette → ambre
  if (ratio > 1.08) return "#3a78d9"; // au-dessus → bleu
  return "#1f8f57"; // dans la cible → vert
}

function compaLabel(ratio: number) {
  if (ratio < 0.92) return "Sous la cible";
  if (ratio > 1.08) return "Au-dessus";
  return "Dans la cible";
}

/* ----------------------------- Onglet Grille ----------------------------- */

const GRID_PEOPLE = [
  { name: "Camille Roy", role: "Product Designer", level: "Senior", salary: 52000, mid: 54000 },
  { name: "Yanis Berger", role: "Développeur", level: "Confirmé", salary: 49000, mid: 48000 },
  { name: "Inès Lefèvre", role: "Customer Success", level: "Junior", salary: 36000, mid: 39000 },
  { name: "Tom Mercier", role: "Sales", level: "Senior", salary: 61000, mid: 56000 },
];

function GridDemo() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-1 text-xs font-medium uppercase tracking-wide text-[color:rgba(11,11,11,0.45)] sm:grid-cols-[1.4fr_1fr_auto]">
        <span>Collaborateur</span>
        <span className="hidden sm:block">Positionnement (compa-ratio)</span>
        <span className="text-right">Statut</span>
      </div>
      {GRID_PEOPLE.map((p) => {
        const ratio = p.salary / p.mid;
        // 0.80 → 0%, 1.20 → 100%
        const pos = Math.max(0, Math.min(1, (ratio - 0.8) / 0.4));
        return (
          <div
            key={p.name}
            className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[var(--radius)] border border-border bg-white px-4 py-3 sm:grid-cols-[1.4fr_1fr_auto]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:rgba(9,82,40,0.1)] text-xs font-semibold text-[var(--brand)]">
                {p.name.split(" ").map((n) => n[0]).join("")}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text)]">{p.name}</p>
                <p className="truncate text-xs text-[color:rgba(11,11,11,0.55)]">
                  {p.role} · {p.level}
                </p>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="relative h-2.5 w-full rounded-full bg-muted">
                {/* repère cible (mid = 50%) */}
                <span className="absolute top-1/2 left-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-[color:rgba(11,11,11,0.2)]" />
                <span
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow transition-all duration-700 ease-out"
                  style={{
                    left: mounted ? `${pos * 100}%` : "50%",
                    backgroundColor: compaColor(ratio),
                  }}
                />
              </div>
            </div>
            <div className="text-right">
              <span
                className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: `${compaColor(ratio)}1a`, color: compaColor(ratio) }}
              >
                {(ratio * 100).toFixed(0)}%
              </span>
              <p className="mt-1 text-[11px] text-[color:rgba(11,11,11,0.5)]">{compaLabel(ratio)}</p>
            </div>
          </div>
        );
      })}
      <p className="px-1 pt-1 text-xs text-[color:rgba(11,11,11,0.55)]">
        Un compa-ratio à 100 % signifie un salaire pile dans la cible du niveau. Repérez en un coup d'œil qui est à
        rééquilibrer.
      </p>
    </div>
  );
}

/* --------------------------- Onglet Simulateur --------------------------- */

function SimulatorDemo() {
  const min = 42000;
  const mid = 54000;
  const max = 66000;
  const [salary, setSalary] = useState(48000);

  const ratio = salary / mid;
  const pos = Math.max(0, Math.min(1, (salary - min) / (max - min)));

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius)] border border-border bg-white p-5">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">
              Product Designer · Senior
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text)]">
              {salary.toLocaleString("fr-FR")} €<span className="text-sm font-normal text-[color:rgba(11,11,11,0.5)]"> brut/an</span>
            </p>
          </div>
          <div className="text-right">
            <span
              className="inline-flex rounded-full px-3 py-1 text-sm font-semibold"
              style={{ backgroundColor: `${compaColor(ratio)}1a`, color: compaColor(ratio) }}
            >
              {(ratio * 100).toFixed(0)}%
            </span>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.5)]">{compaLabel(ratio)}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative h-3 w-full rounded-full bg-gradient-to-r from-[#f0e3cf] via-[#dff0e6] to-[#dde7f5]">
            <span
              className="absolute -top-1.5 h-6 w-6 -translate-x-1/2 rounded-full border-[3px] border-white shadow-md transition-all duration-200"
              style={{ left: `${pos * 100}%`, backgroundColor: compaColor(ratio) }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-[color:rgba(11,11,11,0.5)]">
            <span>Min {Math.round(min / 1000)}k€</span>
            <span>Cible {Math.round(mid / 1000)}k€</span>
            <span>Max {Math.round(max / 1000)}k€</span>
          </div>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={500}
          value={salary}
          onChange={(e) => setSalary(Number(e.target.value))}
          className="mt-6 w-full cursor-pointer accent-[var(--brand)]"
          aria-label="Simuler un salaire"
        />
        <p className="mt-2 text-center text-xs text-[color:rgba(11,11,11,0.55)]">
          Faites glisser pour simuler une augmentation et visualiser son impact en temps réel.
        </p>
      </div>
    </div>
  );
}

/* -------------------------- Onglet Organigramme -------------------------- */

const PASTELS = ["#dff0e6", "#e9e2f7", "#fdeede", "#dde9f5", "#f7e2ea"];

function OrgNode({ name, role, color }: { name: string; role: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-[var(--text)] shadow-sm"
        style={{ backgroundColor: color }}
      >
        {name.split(" ").map((n) => n[0]).join("")}
      </span>
      <div>
        <p className="text-xs font-semibold text-[var(--text)]">{name}</p>
        <p className="text-[10px] text-[color:rgba(11,11,11,0.5)]">{role}</p>
      </div>
    </div>
  );
}

function OrgDemo() {
  const reports = [
    { name: "Léa Dubois", role: "Design" },
    { name: "Hugo Petit", role: "Engineering" },
    { name: "Sara Moreau", role: "Sales" },
  ];
  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <OrgNode name="Marie Caron" role="CEO" color={PASTELS[0]} />
      <div className="h-5 w-px bg-[color:rgba(11,11,11,0.15)]" />
      <div className="grid w-full grid-cols-3 gap-3 sm:gap-8">
        {reports.map((r, i) => (
          <div key={r.name} className="flex flex-col items-center gap-4">
            <OrgNode name={r.name} role={r.role} color={PASTELS[(i + 1) % PASTELS.length]} />
            <div className="flex gap-2">
              {[0, 1].map((j) => (
                <span
                  key={j}
                  className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: PASTELS[(i + j + 2) % PASTELS.length] }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-[color:rgba(11,11,11,0.55)]">
        L'organigramme se construit tout seul. Chaque collaborateur visualise sa place et sa chaîne managériale.
      </p>
    </div>
  );
}

/* ----------------------------- Onglet Marché ----------------------------- */

function MarketDemo() {
  const p25 = 44000;
  const p50 = 52000;
  const p75 = 60000;
  const you = 54000;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const range = useMemo(() => {
    const lo = p25 - 4000;
    const hi = p75 + 4000;
    const at = (v: number) => ((v - lo) / (hi - lo)) * 100;
    return { at };
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius)] border border-border bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">
          Product Designer · France · données marché
        </p>
        <div className="relative mt-8 h-2.5 w-full rounded-full bg-muted">
          <div
            className="absolute top-0 h-2.5 rounded-full bg-[color:rgba(9,82,40,0.18)] transition-all duration-700"
            style={{ left: `${range.at(p25)}%`, width: mounted ? `${range.at(p75) - range.at(p25)}%` : "0%" }}
          />
          {[
            { v: p25, label: "p25" },
            { v: p50, label: "Médiane" },
            { v: p75, label: "p75" },
          ].map((m) => (
            <div key={m.label} className="absolute -top-6 -translate-x-1/2 text-center" style={{ left: `${range.at(m.v)}%` }}>
              <p className="text-[10px] font-medium text-[color:rgba(11,11,11,0.5)]">{m.label}</p>
              <span className="mx-auto block h-3 w-px bg-[color:rgba(11,11,11,0.25)]" />
            </div>
          ))}
          <span
            className="absolute -top-1.5 h-6 w-6 -translate-x-1/2 rounded-full border-[3px] border-white bg-[var(--brand)] shadow-md transition-all duration-700"
            style={{ left: mounted ? `${range.at(you)}%` : "0%" }}
          />
          <span
            className="absolute top-7 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-semibold text-white transition-all duration-700"
            style={{ left: mounted ? `${range.at(you)}%` : "0%" }}
          >
            Vous · {Math.round(you / 1000)}k€
          </span>
        </div>
        <p className="mt-12 text-xs text-[color:rgba(11,11,11,0.55)]">
          Comparez vos salaires aux repères du marché (p25 / médiane / p75) pour fixer des fourchettes justes et
          défendables.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------- Showcase -------------------------------- */

export function ProductShowcase() {
  const [active, setActive] = useState<TabKey>("grille");

  return (
    <div className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_20px_60px_rgba(9,82,40,0.12)]">
      {/* Barre fenêtre */}
      <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#e5a3a3]" />
        <span className="h-3 w-3 rounded-full bg-[#e8cf94]" />
        <span className="h-3 w-3 rounded-full bg-[#a9d3b4]" />
        <span className="ml-3 text-xs font-medium text-[color:rgba(11,11,11,0.45)]">app.leaft.io</span>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
              active === tab.key
                ? "bg-[var(--brand)] text-white"
                : "text-[color:rgba(11,11,11,0.6)] hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="p-4 sm:p-6">
        <p className="mb-4 text-sm font-medium text-[color:rgba(11,11,11,0.6)]">
          {TABS.find((t) => t.key === active)?.hint}
        </p>
        {active === "grille" && <GridDemo key="grille" />}
        {active === "simulateur" && <SimulatorDemo key="simulateur" />}
        {active === "organigramme" && <OrgDemo key="organigramme" />}
        {active === "marche" && <MarketDemo key="marche" />}
      </div>
    </div>
  );
}
