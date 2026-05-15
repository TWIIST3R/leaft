"use client";

import { Avatar } from "@/components/ui/avatar";

export type MarketTeamPeer = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  annual_salary_brut: number | null;
};

/**
 * Fourchette marché offres (P25–P75 HasData) + position des salaires équipe (avatars).
 * Si la transparence salariale est désactivée : uniquement le talent courant.
 */
export function MarketOffersTeamRail({
  p25,
  p50,
  p75,
  currentEmployeeId,
  teamPeers,
  salaryVisible,
}: {
  p25: number;
  p50: number;
  p75: number;
  currentEmployeeId: string;
  teamPeers: MarketTeamPeer[];
  salaryVisible: boolean;
}) {
  const withSalary = teamPeers.filter((p) => p.annual_salary_brut != null && Number(p.annual_salary_brut) > 0);
  const peersToShow = salaryVisible
    ? withSalary
    : withSalary.filter((p) => p.id === currentEmployeeId);

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

  return (
    <div className="mt-4">
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
          return (
            <div
              key={peer.id}
              className="absolute z-[2] flex -translate-x-1/2 flex-col items-center gap-1"
              style={{ left: `${left}%`, bottom: `${12 + stack * 52}px` }}
              title={`${peer.first_name} ${peer.last_name} — ${sal.toLocaleString("fr-FR")} € brut / an`}
            >
              <div
                className={`rounded-full p-0.5 shadow-md ring-2 ${isMe ? "ring-[var(--brand)] ring-offset-2 ring-offset-white" : "ring-white"}`}
              >
                <Avatar
                  firstName={peer.first_name}
                  lastName={peer.last_name}
                  avatarUrl={peer.avatar_url}
                  size="sm"
                />
              </div>
            </div>
          );
        })}
      </div>
      {!salaryVisible && peersToShow.length <= 1 && (
        <p className="mt-2 text-[11px] text-[color:rgba(11,11,11,0.5)]">
          La transparence salariale est désactivée : seule ta position est affichée sur la fourchette marché.
        </p>
      )}
    </div>
  );
}
