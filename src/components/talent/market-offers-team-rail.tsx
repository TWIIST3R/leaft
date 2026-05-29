"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import type { SalaryDisclosureMode } from "@/lib/organization/salary-transparency-shared";
import type { MarketTeamPeer } from "@/lib/talent/market-team-peer-types";

function PeerHoverCard({ peer, isMe }: { peer: MarketTeamPeer; isMe: boolean }) {
  const sal = peer.annual_salary_brut != null ? Number(peer.annual_salary_brut) : null;
  return (
    <div className="rounded-xl border border-[#e2e7e2] bg-white px-3 py-2.5 text-xs shadow-lg">
      <p className="font-semibold text-[var(--text)]">
        {peer.is_department_average
          ? `Moyenne — ${peer.department_name ?? "département"}`
          : `${peer.first_name} ${peer.last_name}${isMe ? " (vous)" : ""}`}
      </p>
      {peer.current_job_title && !peer.is_department_average && (
        <p className="mt-1 text-[color:rgba(11,11,11,0.6)]">{peer.current_job_title}</p>
      )}
      {peer.department_name && (
        <p className="mt-0.5 text-[color:rgba(11,11,11,0.55)]">{peer.department_name}</p>
      )}
      {sal != null && (
        <p className="mt-2 text-sm font-bold tabular-nums text-[var(--brand)]">
          {peer.is_department_average ? "Moyenne " : ""}
          {Math.round(sal).toLocaleString("fr-FR")} € <span className="text-[10px] font-medium text-[color:rgba(11,11,11,0.5)]">brut / an</span>
        </p>
      )}
      {peer.is_department_average && (
        <p className="mt-1 text-[10px] text-[color:rgba(11,11,11,0.5)]">Basé sur les salaires renseignés dans votre département.</p>
      )}
    </div>
  );
}

/**
 * Fourchette marché offres (P25–P75) + position des salaires (avatars).
 */
export function MarketOffersTeamRail({
  p25,
  p50,
  p75,
  currentEmployeeId,
  teamPeers,
  salaryVisible,
  disclosureMode,
}: {
  p25: number;
  p50: number;
  p75: number;
  currentEmployeeId: string;
  teamPeers: MarketTeamPeer[];
  salaryVisible: boolean;
  disclosureMode: SalaryDisclosureMode;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hoveredId) return;
    const onDoc = (e: MouseEvent) => {
      if (railRef.current && !railRef.current.contains(e.target as Node)) setHoveredId(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [hoveredId]);

  const withSalary = teamPeers.filter((p) => p.annual_salary_brut != null && Number(p.annual_salary_brut) > 0);
  const peersToShow = !salaryVisible
    ? withSalary.filter((p) => p.id === currentEmployeeId)
    : withSalary;

  const salaries = peersToShow.map((p) => Number(p.annual_salary_brut));
  const minPeer = salaries.length ? Math.min(...salaries) : p25;
  const maxPeer = salaries.length ? Math.max(...salaries) : p75;
  const span = Math.max(p75 - p25, maxPeer - minPeer, 1);
  const pad = span * 0.08;
  const axisLo = Math.min(p25, minPeer) - pad;
  const axisHi = Math.max(p75, maxPeer) + pad;
  const axisSpan = Math.max(axisHi - axisLo, 1);

  const posPct = (sal: number) => ((sal - axisLo) / axisSpan) * 100;

  const markers = [
    { label: "Fourchette basse", value: p25, tone: "muted" as const },
    { label: "Médiane marché", value: p50, tone: "brand" as const },
    { label: "Fourchette haute", value: p75, tone: "muted" as const },
  ];

  const sorted = [...peersToShow].sort((a, b) => Number(a.annual_salary_brut) - Number(b.annual_salary_brut));
  const stackAt: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const sal = Number(sorted[i]!.annual_salary_brut);
    const p = posPct(sal);
    let stack = 0;
    for (let j = 0; j < i; j++) {
      const pj = posPct(Number(sorted[j]!.annual_salary_brut));
      if (Math.abs(p - pj) < 3.2) stack = Math.max(stack, (stackAt[j] ?? 0) + 1);
    }
    stackAt[i] = stack;
  }

  const hovered = sorted.find((p) => p.id === hoveredId);

  return (
    <div className="mt-4" ref={railRef}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.45)]">
        Où se situent les salaires (brut annuel) vs la fourchette marché offres
      </p>
      <div className="relative mt-10 min-h-[112px] rounded-2xl border border-[#e2e7e2] bg-gradient-to-r from-[#f4f1ea] via-[#eef5ee] to-[#e8f0e8] px-3 pt-2 pb-14">
        <div className="absolute inset-x-4 top-8 h-4 rounded-full bg-white/85 shadow-inner ring-1 ring-[#e2e7e2]/80" />
        {markers.map((mk) => {
          const left = Math.max(2, Math.min(98, posPct(mk.value)));
          return (
            <div
              key={mk.label}
              className="absolute top-6 z-[1] flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${left}%` }}
            >
              <span
                className={`h-8 w-0.5 rounded-full ${mk.tone === "brand" ? "bg-[var(--brand)]" : "bg-[#c5ccc5]"}`}
              />
              <span className="mt-1 max-w-[92px] text-center text-[9px] font-semibold uppercase leading-tight text-[color:rgba(11,11,11,0.5)]">
                {mk.label}
              </span>
              <span className="text-[10px] font-semibold text-[var(--text)]">{Math.round(mk.value).toLocaleString("fr-FR")} €</span>
            </div>
          );
        })}

        {sorted.map((peer, i) => {
          const sal = Number(peer.annual_salary_brut);
          const left = Math.max(4, Math.min(96, posPct(sal)));
          const stack = stackAt[i] ?? 0;
          const isMe = peer.id === currentEmployeeId;
          const isDeptAvg = !!peer.is_department_average;
          return (
            <div
              key={peer.id}
              className="absolute z-[2] flex -translate-x-1/2 flex-col items-center gap-1"
              style={{ left: `${left}%`, bottom: `${12 + stack * 52}px` }}
              onMouseEnter={() => setHoveredId(peer.id)}
              onMouseLeave={() => setHoveredId((id) => (id === peer.id ? null : id))}
              onFocus={() => setHoveredId(peer.id)}
              onBlur={() => setHoveredId(null)}
            >
              <button
                type="button"
                className={`cursor-pointer rounded-full p-0.5 shadow-md ring-2 transition hover:scale-105 ${
                  isMe ? "ring-[var(--brand)] ring-offset-2 ring-offset-white" : isDeptAvg ? "ring-amber-200 bg-amber-50" : "ring-white"
                }`}
                aria-label={
                  isDeptAvg
                    ? `Moyenne ${peer.department_name}`
                    : `${peer.first_name} ${peer.last_name}`
                }
              >
                {isDeptAvg ? (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] font-bold text-white">
                    Ø
                  </span>
                ) : (
                  <Avatar
                    firstName={peer.first_name}
                    lastName={peer.last_name}
                    avatarUrl={peer.avatar_url}
                    size="sm"
                  />
                )}
              </button>
              {hoveredId === peer.id && (
                <div className="absolute bottom-full z-50 mb-2 w-[min(100vw-2rem,14rem)]">
                  <PeerHoverCard peer={peer} isMe={isMe} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!salaryVisible && peersToShow.length <= 1 && (
        <p className="mt-2 text-[11px] text-[color:rgba(11,11,11,0.5)]">
          Transparence désactivée : seule votre position est affichée.
        </p>
      )}
      {salaryVisible && disclosureMode === "department_average" && (
        <p className="mt-2 text-[11px] text-[color:rgba(11,11,11,0.5)]">
          Votre salaire et la moyenne de votre département (pas les salaires individuels des collègues).
        </p>
      )}
      {salaryVisible && disclosureMode === "exact" && hovered && (
        <p className="mt-2 text-[11px] text-[color:rgba(11,11,11,0.5)]">Survolez un profil pour voir le détail.</p>
      )}
    </div>
  );
}
