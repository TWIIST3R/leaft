"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
          {Math.round(sal).toLocaleString("fr-FR")} €{" "}
          <span className="text-[10px] font-medium text-[color:rgba(11,11,11,0.5)]">brut / an</span>
        </p>
      )}
    </div>
  );
}

function buildSalaryAxis(values: number[]) {
  const filtered = values.filter((v) => Number.isFinite(v) && v > 0);
  if (!filtered.length) return { posPct: () => 50 };

  const rawLo = Math.min(...filtered);
  const rawHi = Math.max(...filtered);
  const span = Math.max(rawHi - rawLo, 1);
  const pad = span * 0.08;
  const axisLo = rawLo - pad;
  const axisHi = rawHi + pad;

  return {
    posPct: (sal: number) => Math.max(4, Math.min(96, ((sal - axisLo) / (axisHi - axisLo)) * 100)),
  };
}

/** Évite le chevauchement horizontal entre repères proches. */
function spreadPositions(items: { id: string; pct: number }[], minGap = 11): Map<string, number> {
  const sorted = [...items].sort((a, b) => a.pct - b.pct);
  const out = new Map<string, number>();
  let last = -Infinity;
  for (const item of sorted) {
    const next = Math.max(item.pct, last + minGap);
    out.set(item.id, Math.min(96, next));
    last = next;
  }
  return out;
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
  const { posPct } = useMemo(
    () => buildSalaryAxis([p25, p50, p75, ...salaries]),
    [p25, p50, p75, salaries],
  );

  const markers = [
    { id: "p25", label: "Fourchette basse", value: p25, tone: "muted" as const },
    { id: "p50", label: "Médiane marché", value: p50, tone: "brand" as const },
    { id: "p75", label: "Fourchette haute", value: p75, tone: "muted" as const },
  ];

  const markerPositions = useMemo(
    () => spreadPositions(markers.map((m) => ({ id: m.id, pct: posPct(m.value) })), 14),
    [markers, posPct],
  );

  const sorted = [...peersToShow].sort((a, b) => Number(a.annual_salary_brut) - Number(b.annual_salary_brut));
  const peerPositions = useMemo(
    () =>
      spreadPositions(
        sorted.map((p) => ({ id: p.id, pct: posPct(Number(p.annual_salary_brut)) })),
        10,
      ),
    [sorted, posPct],
  );

  const hovered = sorted.find((p) => p.id === hoveredId);

  return (
    <div className="mt-4" ref={railRef}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.45)]">
        Où se situent les salaires (brut annuel) vs la fourchette marché offres
      </p>

      <div className="mt-4 rounded-2xl border border-[#e2e7e2] bg-gradient-to-r from-[#f4f1ea] via-[#eef5ee] to-[#e8f0e8] px-4 py-5 sm:px-6">
        {/* Repères marché — au-dessus de la jauge */}
        <div className="relative mb-2 min-h-[52px]">
          {markers.map((mk) => {
            const left = markerPositions.get(mk.id) ?? posPct(mk.value);
            return (
              <div
                key={mk.id}
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${left}%`, width: "max-content", maxWidth: "28%" }}
              >
                <span
                  className={`text-[9px] font-semibold uppercase leading-tight text-center ${
                    mk.tone === "brand" ? "text-[var(--brand)]" : "text-[color:rgba(11,11,11,0.5)]"
                  }`}
                >
                  {mk.label}
                </span>
                <span className="mt-0.5 text-[11px] font-bold tabular-nums text-[var(--text)]">
                  {Math.round(mk.value).toLocaleString("fr-FR")} €
                </span>
              </div>
            );
          })}
        </div>

        {/* Jauge */}
        <div className="relative mx-1 h-4 rounded-full bg-white/90 shadow-inner ring-1 ring-[#e2e7e2]/80">
          {markers.map((mk) => {
            const left = markerPositions.get(mk.id) ?? posPct(mk.value);
            return (
              <span
                key={`tick-${mk.id}`}
                className={`absolute top-1/2 z-[1] h-6 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  mk.tone === "brand" ? "bg-[var(--brand)]" : "bg-[#b8c0b8]"
                }`}
                style={{ left: `${left}%` }}
              />
            );
          })}
        </div>

        {/* Talents & moyenne département — sous la jauge */}
        <div className="relative mt-6 min-h-[88px]">
          {sorted.map((peer) => {
            const left = peerPositions.get(peer.id) ?? posPct(Number(peer.annual_salary_brut));
            const isMe = peer.id === currentEmployeeId;
            const isDeptAvg = !!peer.is_department_average;
            return (
              <div
                key={peer.id}
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${left}%`, width: "max-content", maxWidth: "30%" }}
                onMouseEnter={() => setHoveredId(peer.id)}
                onMouseLeave={() => setHoveredId((id) => (id === peer.id ? null : id))}
              >
                {isMe ? (
                  <span className="mb-1 rounded-full bg-[var(--brand)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Vous
                  </span>
                ) : isDeptAvg ? (
                  <span className="mb-1 rounded-full border border-[var(--brand)]/25 bg-white px-2 py-0.5 text-[9px] font-semibold text-[var(--brand)]">
                    Moy. {peer.department_name ?? "dép."}
                  </span>
                ) : null}

                <button
                  type="button"
                  className={`cursor-pointer rounded-full p-0.5 shadow-md ring-2 transition hover:scale-105 ${
                    isMe
                      ? "ring-[var(--brand)] ring-offset-2 ring-offset-[#eef5ee]"
                      : isDeptAvg
                        ? "ring-[var(--brand)]/40 bg-white"
                        : "ring-white bg-white"
                  }`}
                  aria-label={
                    isDeptAvg
                      ? `Moyenne ${peer.department_name}`
                      : `${peer.first_name} ${peer.last_name}`
                  }
                >
                  {isDeptAvg ? (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-white">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0zM21 10a3 3 0 11-6 0 3 3 0 016 0zM9 10a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </span>
                  ) : (
                    <Avatar
                      firstName={peer.first_name}
                      lastName={peer.last_name}
                      avatarUrl={peer.avatar_url}
                      size="md"
                    />
                  )}
                </button>

                {!isMe && !isDeptAvg && (
                  <span className="mt-1 max-w-[80px] truncate text-center text-[9px] font-medium text-[color:rgba(11,11,11,0.55)]">
                    {peer.first_name}
                  </span>
                )}

                {hoveredId === peer.id && (
                  <div className="absolute top-full z-50 mt-2 w-[min(100vw-2rem,14rem)]">
                    <PeerHoverCard peer={peer} isMe={isMe} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#e2e7e2]/80 pt-3 text-[10px] text-[color:rgba(11,11,11,0.5)]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#b8c0b8]" /> Fourchette marché (offres)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--brand)]" /> Médiane
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)] text-[8px] text-white">Ø</span>
            Moyenne département
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-full ring-2 ring-[var(--brand)]" /> Vous
          </span>
        </div>
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
