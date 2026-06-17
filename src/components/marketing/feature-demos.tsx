"use client";

import { useEffect, useState } from "react";

/* Palette département reprise de l'organigramme réel (organigramme-flow.tsx). */
const DEPT_COLORS = [
  { ring: "#a1b68d", text: "#3f6b4a", pill: "#dde7d6" },
  { ring: "#9ec5e8", text: "#3a6b97", pill: "#dbeaf6" },
  { ring: "#ecc79b", text: "#9a6b32", pill: "#f6e8d4" },
  { ring: "#c2b0e0", text: "#6f4f9e", pill: "#e7def4" },
  { ring: "#e6a3b6", text: "#a9445f", pill: "#f6dde4" },
  { ring: "#94d2bd", text: "#357f68", pill: "#d8ede6" },
];

const CARD =
  "overflow-hidden rounded-3xl border border-[#e2e7e2] bg-white shadow-[0_24px_60px_rgba(17,27,24,0.1)]";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

function compaColor(ratio: number) {
  if (ratio < 0.92) return "#d99a3a";
  if (ratio > 1.08) return "#3a78d9";
  return "#1f8f57";
}

function compaLabel(ratio: number) {
  if (ratio < 0.92) return "Sous la cible";
  if (ratio > 1.08) return "Au-dessus";
  return "Dans la cible";
}

/* ----------------------- Grille (vue Talents) ----------------------- */

const GRID_PEOPLE = [
  { name: "Camille Roy", dept: "Produit", deptIdx: 3, level: "Senior", salary: 52000, mid: 54000 },
  { name: "Yanis Berger", dept: "Tech", deptIdx: 1, level: "Confirmé", salary: 49000, mid: 48000 },
  { name: "Inès Lefèvre", dept: "Customer", deptIdx: 5, level: "Junior", salary: 36000, mid: 39000 },
  { name: "Tom Mercier", dept: "Sales", deptIdx: 2, level: "Senior", salary: 61000, mid: 56000 },
];

export function SalaryGridDemo() {
  return (
    <div className={CARD}>
      <div className="flex items-center justify-between border-b border-[#e2e7e2] bg-[#f8faf8] px-5 py-3.5">
        <p className="text-sm font-semibold text-[var(--text)]">Talents</p>
        <span className="rounded-lg bg-[var(--brand)]/10 px-2.5 py-1 text-xs font-medium text-[var(--brand)]">
          24 talents
        </span>
      </div>
      <div className="divide-y divide-[#eef2ee]">
        {GRID_PEOPLE.map((p) => {
          const ratio = p.salary / p.mid;
          const dept = DEPT_COLORS[p.deptIdx % DEPT_COLORS.length];
          return (
            <div key={p.name} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              {/* Identité */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/15 text-xs font-semibold text-[var(--brand)]">
                  {initials(p.name)}
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-medium text-[var(--text)]">{p.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: dept.pill, color: dept.text }}
                    >
                      {p.dept}
                    </span>
                    <span className="truncate text-xs text-[color:rgba(11,11,11,0.5)]">{p.level}</span>
                  </div>
                </div>
              </div>

              {/* Salaire */}
              <span className="shrink-0 text-sm tabular-nums text-[color:rgba(11,11,11,0.78)]">
                {(p.salary / 1000).toFixed(0)}k€
              </span>

              {/* Positionnement */}
              <span
                className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
                style={{ backgroundColor: `${compaColor(ratio)}1a`, color: compaColor(ratio) }}
                title={compaLabel(ratio)}
              >
                {(ratio * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------- Organigramme (radial) ----------------------- */

type OrgNodeDef = {
  name: string;
  job: string;
  dept?: string;
  deptIdx?: number;
  x: number; // position en % du conteneur
  y: number;
  root?: boolean;
};

const ORG_NODES: OrgNodeDef[] = [
  { name: "Marie Caron", job: "CEO", x: 50, y: 50, root: true },
  { name: "Léa Dubois", job: "Lead Design", dept: "Produit", deptIdx: 3, x: 50, y: 11 },
  { name: "Hugo Petit", job: "Lead Engineering", dept: "Tech", deptIdx: 1, x: 87, y: 35 },
  { name: "Sara Moreau", job: "Head of Sales", dept: "Sales", deptIdx: 2, x: 73, y: 84 },
  { name: "Karim Aziz", job: "Customer Success", dept: "Customer", deptIdx: 5, x: 27, y: 84 },
  { name: "Nina Lopez", job: "People", dept: "RH", deptIdx: 0, x: 13, y: 35 },
];

function RadialNode({ node }: { node: OrgNodeDef }) {
  const dept = node.deptIdx != null ? DEPT_COLORS[node.deptIdx % DEPT_COLORS.length] : null;
  const ring = node.root ? "var(--brand)" : dept?.ring ?? "#a1b68d";
  const size = node.root ? 52 : 42;
  return (
    <div
      className="absolute flex w-[96px] flex-col items-center text-center"
      style={{ left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%, -50%)" }}
    >
      <span
        className="rounded-full"
        style={{
          padding: node.root ? 5 : 4,
          background: ring,
          boxShadow: node.root ? "0 12px 30px rgba(17,27,24,0.16)" : "0 8px 20px rgba(17,27,24,0.1)",
        }}
      >
        <span className="block rounded-full bg-white p-[3px]">
          <span
            className="flex items-center justify-center rounded-full bg-[var(--brand)]/15 font-semibold text-[var(--brand)]"
            style={{ width: size, height: size, fontSize: node.root ? 16 : 13 }}
          >
            {initials(node.name)}
          </span>
        </span>
      </span>
      <p className="mt-2 text-[12px] font-semibold leading-tight text-[var(--text)]">{node.name}</p>
      <p className="text-[10px] leading-tight text-[color:rgba(11,11,11,0.5)]">{node.job}</p>
      {node.dept && dept && (
        <span
          className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold"
          style={{ background: dept.pill, color: dept.text }}
        >
          {node.dept}
        </span>
      )}
    </div>
  );
}

export function OrgChartDemo() {
  const root = ORG_NODES[0];
  const children = ORG_NODES.slice(1);
  return (
    <div className={CARD}>
      <div className="flex items-center justify-between border-b border-[#e2e7e2] bg-[#f8faf8] px-5 py-3.5">
        <p className="text-sm font-semibold text-[var(--text)]">Organigramme</p>
        <span className="rounded-lg bg-[var(--brand)]/10 px-2.5 py-1 text-xs font-medium text-[var(--brand)]">
          Rayonnant
        </span>
      </div>
      <div className="relative h-[400px] w-full bg-gradient-to-br from-[#fbfcfa] via-[#f7faf6] to-[#f3f6f1]">
        {/* Liens */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {children.map((c) => {
            const dept = c.deptIdx != null ? DEPT_COLORS[c.deptIdx % DEPT_COLORS.length] : null;
            return (
              <line
                key={c.name}
                x1={root.x}
                y1={root.y}
                x2={c.x}
                y2={c.y}
                stroke={dept?.ring ?? "#cdd5c8"}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {/* Noeuds */}
        {ORG_NODES.map((n) => (
          <RadialNode key={n.name} node={n} />
        ))}
      </div>
    </div>
  );
}

/* ----------------------- Transparence salariale ----------------------- */

export function TransparencyDemo() {
  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState<"department_average" | "exact">("department_average");

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between border-b border-[#e2e7e2] bg-[#f8faf8] px-5 py-3.5">
        <p className="text-sm font-semibold text-[var(--text)]">Paramètres · Transparence salariale</p>
        <span className="rounded-lg bg-[var(--brand)]/10 px-2.5 py-1 text-xs font-medium text-[var(--brand)]">
          Option
        </span>
      </div>
      <div className="space-y-4 p-5">
        {/* Interrupteur */}
        <div className="flex items-center justify-between rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Activer la transparence</p>
            <p className="text-xs text-[color:rgba(11,11,11,0.55)]">Visible par les managers et les talents</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? "bg-[var(--brand)]" : "bg-[#cfd6cf]"}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? "left-6" : "left-1"}`}
            />
          </button>
        </div>

        {/* Modes */}
        <div className={`space-y-3 transition ${enabled ? "opacity-100" : "pointer-events-none opacity-40"}`}>
          {[
            {
              key: "department_average" as const,
              title: "Moyenne du département",
              tag: "Recommandé",
              desc: "Chacun voit sa rémunération et la moyenne de son service, sans exposer les salaires individuels.",
            },
            {
              key: "exact" as const,
              title: "Salaires exacts",
              tag: "Optionnel",
              desc: "Le salaire brut annuel de chaque collègue est visible. Non requis par la loi.",
            },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={`flex w-full gap-3 rounded-2xl border-2 p-3.5 text-left transition ${
                mode === m.key ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-[#e2e7e2] bg-white"
              }`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  mode === m.key ? "border-[var(--brand)]" : "border-[#cfd6cf]"
                }`}
              >
                {mode === m.key && <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />}
              </span>
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  {m.title}
                  <span className="rounded-full bg-[var(--brand)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
                    {m.tag}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[color:rgba(11,11,11,0.6)]">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Aperçu */}
        <div className="rounded-2xl bg-[#eef3ec] px-4 py-3 text-sm text-[var(--brand)]">
          {!enabled
            ? "Les rémunérations restent entièrement masquées."
            : mode === "department_average"
              ? "Vos talents voient : leur salaire + la moyenne de leur département."
              : "Vos talents voient : le salaire brut de chaque collègue."}
        </div>
      </div>
    </div>
  );
}

/* ----------------------- Statistiques / équité ----------------------- */

const PIE_H = "#3b82f6";
const PIE_F = "#ec4899";

export function EquityDemo() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const womenPct = 48;
  const deptSalaries = [
    { label: "Produit", value: 54 },
    { label: "Tech", value: 58 },
    { label: "Sales", value: 49 },
    { label: "Customer", value: 41 },
    { label: "RH", value: 46 },
  ];
  const max = Math.max(...deptSalaries.map((d) => d.value));

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between border-b border-[#e2e7e2] bg-[#f8faf8] px-5 py-3.5">
        <p className="text-sm font-semibold text-[var(--text)]">Statistiques</p>
        <span className="rounded-lg bg-[var(--brand)]/10 px-2.5 py-1 text-xs font-medium text-[var(--brand)]">
          Vue d'ensemble
        </span>
      </div>
      <div className="space-y-6 p-5">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Effectif", value: "24" },
            { label: "Masse sal.", value: "1,28 M€" },
            { label: "Médian", value: "48 k€" },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">
                {k.label}
              </p>
              <p className="mt-1.5 text-xl font-semibold text-[var(--text)]">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Genre + bars */}
        <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
          {/* Donut genre */}
          <div className="flex items-center gap-4">
            <div
              className="relative h-24 w-24 rounded-full"
              style={{
                background: `conic-gradient(${PIE_H} 0 ${100 - womenPct}%, ${PIE_F} ${100 - womenPct}% 100%)`,
              }}
            >
              <div className="absolute inset-[10px] rounded-full bg-white" />
            </div>
            <div className="space-y-1.5 text-xs">
              <p className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_H }} />
                Hommes {100 - womenPct}%
              </p>
              <p className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_F }} />
                Femmes {womenPct}%
              </p>
            </div>
          </div>
        </div>

        {/* Salaire moyen par département */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">
            Salaire moyen par département
          </p>
          <div className="flex items-end gap-2" style={{ height: 120 }}>
            {deptSalaries.map((d) => {
              const pct = Math.max((d.value / max) * 100, 6);
              return (
                <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1.5" style={{ height: "100%" }}>
                  <span className="text-[10px] font-medium text-[var(--text)]">{d.value}k€</span>
                  <div
                    className="w-full rounded-t-lg transition-all duration-700 ease-out"
                    style={{ height: mounted ? `${pct}%` : "0%", backgroundColor: "var(--brand)", opacity: 0.75 }}
                  />
                  <span className="truncate text-[10px] text-[color:rgba(11,11,11,0.5)]">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
