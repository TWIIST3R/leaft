"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useOrganizationList } from "@clerk/nextjs";
import gsap from "gsap";
import { PieChart, PIE_COLORS } from "@/components/charts/pie-chart";

type DashboardData = {
  organization: { id: string; name: string };
  employeesCount: number;
  departmentsCount: number;
  paliersCount: number;
  avgSalary: number;
  totalSalaryMass: number;
  genderF: number;
  genderH: number;
  genderOther: number;
  newestHire: { name: string; date: string | null } | null;
  deptDistribution: { label: string; value: number }[];
  upcomingInterviews: { id: string; date: string; type: string; employeeName: string }[];
};

const CARD = "rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]";

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setActive, userMemberships } = useOrganizationList();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const sessionId = searchParams.get("session_id");
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) return;

    let retryCount = 0;
    const maxRetries = 10;

    const verifySubscription = async () => {
      setIsVerifying(true);
      try {
        const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          if (data.orgId && setActive) {
            const orgInList = userMemberships?.data?.find(membership => membership.organization.id === data.orgId);
            if (orgInList) {
              try {
                await setActive({ organization: data.orgId });
              } catch (error) {
                console.error("Error setting active organization:", error);
              }
            }
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          window.location.href = "/dashboard";
          return;
        } else {
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(() => verifySubscription(), 2000);
          } else {
            setIsVerifying(false);
            setVerifyError("Impossible de vérifier votre abonnement. Veuillez rafraîchir la page ou contacter le support.");
          }
        }
      } catch {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => verifySubscription(), 2000);
        } else {
          setIsVerifying(false);
          setVerifyError("Erreur lors de la vérification de l'abonnement. Veuillez rafraîchir la page.");
        }
      }
    };

    verifySubscription();
  }, [sessionId, router, setActive, userMemberships]);

  useEffect(() => {
    if (!mainRef.current || isVerifying) return;
    const sections = mainRef.current.querySelectorAll("[data-animate]");
    gsap.fromTo(sections, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" });
  }, [isVerifying]);

  if (verifyError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-medium text-amber-800">{verifyError}</p>
          <button
            type="button"
            onClick={() => { setVerifyError(null); router.refresh(); }}
            className="mt-4 cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Rafraîchir la page
          </button>
        </div>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--brand)]/20"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[var(--brand)]"></div>
          </div>
          <p className="text-sm font-medium text-[color:rgba(11,11,11,0.7)]">
            Finalisation de votre abonnement...
          </p>
        </div>
      </div>
    );
  }

  const genderPieItems = [
    { label: "Hommes", value: initialData.genderH, color: "#3b82f6" },
    { label: "Femmes", value: initialData.genderF, color: "#ec4899" },
    ...(initialData.genderOther > 0 ? [{ label: "Autre", value: initialData.genderOther, color: "#a3a3a3" }] : []),
  ].filter((i) => i.value > 0);

  const deptPieItems = initialData.deptDistribution.map((d, i) => ({
    ...d,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div ref={mainRef} className="space-y-8">
      <section data-animate className="rounded-3xl border border-[#e2e7e2] bg-white p-8 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">
              Bienvenue sur Leaft{initialData.organization.name ? `, ${initialData.organization.name}` : ""}
            </h1>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
              Gérez vos grilles salariales, talents et entretiens en toute transparence.
            </p>
          </div>
        </div>
      </section>

      <section data-animate className="grid gap-6 md:grid-cols-4">
        <Link
          href="/dashboard/talents"
          className={`block ${CARD} transition hover:border-[var(--brand)]/30 hover:shadow-[0_24px_60px_rgba(17,27,24,0.08)]`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Talents</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{initialData.employeesCount}</p>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            {initialData.employeesCount === 0
              ? "Ajoutez vos premiers talents"
              : `${initialData.employeesCount} talent${initialData.employeesCount > 1 ? "s" : ""}`}
          </p>
        </Link>

        <Link
          href="/dashboard/grilles"
          className={`block ${CARD} transition hover:border-[var(--brand)]/30 hover:shadow-[0_24px_60px_rgba(17,27,24,0.08)]`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Départements</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{initialData.departmentsCount}</p>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            {initialData.departmentsCount === 0
              ? "Créez vos départements"
              : `${initialData.departmentsCount} département${initialData.departmentsCount > 1 ? "s" : ""}`}
          </p>
        </Link>

        <Link
          href="/dashboard/grilles"
          className={`block ${CARD} transition hover:border-[var(--brand)]/30 hover:shadow-[0_24px_60px_rgba(17,27,24,0.08)]`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Paliers</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{initialData.paliersCount}</p>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            {initialData.paliersCount === 0
              ? "Définissez vos paliers"
              : `${initialData.paliersCount} palier${initialData.paliersCount > 1 ? "s" : ""}`}
          </p>
        </Link>

        <div className={CARD}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Masse salariale</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">
            {initialData.totalSalaryMass > 0
              ? `${Math.round(initialData.totalSalaryMass / 1000).toLocaleString("fr-FR")}k €`
              : "—"}
          </p>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">Total annuel brut</p>
        </div>
      </section>

      {initialData.employeesCount > 0 && (
        <section data-animate className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className={CARD}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Salaire moyen brut</p>
            <p className="mt-3 text-2xl font-semibold text-[var(--text)]">
              {initialData.avgSalary > 0 ? `${initialData.avgSalary.toLocaleString("fr-FR")} €` : "—"}
            </p>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">Moyenne annuelle brute</p>
          </div>
          {genderPieItems.length > 0 && (
            <div className={CARD}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">
                Répartition H / F
              </p>
              <PieChart items={genderPieItems} size={140} strokeWidth={28} />
            </div>
          )}
          {deptPieItems.length > 0 && (
            <div className={CARD}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">
                Effectif par département
              </p>
              <PieChart items={deptPieItems} size={140} strokeWidth={28} />
            </div>
          )}
        </section>
      )}

      {initialData.upcomingInterviews.length > 0 && (
        <section data-animate className={CARD}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text)]">Prochains entretiens</h2>
            <Link href="/dashboard/entretiens" className="text-sm font-medium text-[var(--brand)] hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-[#e2e7e2]">
            {initialData.upcomingInterviews.map((iv) => (
              <div key={iv.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)]/10">
                    <svg className="h-5 w-5 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{iv.employeeName}</p>
                    <p className="text-xs text-[color:rgba(11,11,11,0.5)]">{iv.type}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-[color:rgba(11,11,11,0.6)]">
                  {new Date(iv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section data-animate className={CARD}>
        <h2 className="text-lg font-semibold text-[var(--text)]">Actions rapides</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/talents/new"
            className="block rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-left transition hover:bg-[#f2f5f2]"
          >
            <p className="text-sm font-semibold text-[var(--text)]">Ajouter un talent</p>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.65)]">Nouveau collaborateur</p>
          </Link>
          <Link
            href="/dashboard/grilles"
            className="block rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-left transition hover:bg-[#f2f5f2]"
          >
            <p className="text-sm font-semibold text-[var(--text)]">Grilles de salaire</p>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.65)]">Départements et grilles</p>
          </Link>
          <Link
            href="/dashboard/entretiens"
            className="block rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-left transition hover:bg-[#f2f5f2]"
          >
            <p className="text-sm font-semibold text-[var(--text)]">Entretiens</p>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.65)]">Gérer les entretiens annuels</p>
          </Link>
          <Link
            href="/dashboard/statistiques"
            className="block rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-left transition hover:bg-[#f2f5f2]"
          >
            <p className="text-sm font-semibold text-[var(--text)]">Statistiques</p>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.65)]">Démographie et équité</p>
          </Link>
        </div>
      </section>

      {initialData.employeesCount === 0 && (
        <section data-animate className="rounded-3xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-6">
          <h2 className="text-lg font-semibold text-[var(--text)]">Pour commencer</h2>
          <ol className="mt-4 space-y-3 text-sm text-[color:rgba(11,11,11,0.7)]">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white">1</span>
              <div>
                <p className="font-semibold text-[var(--text)]">Créez vos départements</p>
                <p className="mt-1">Dans Grilles de salaire, organisez votre structure.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white">2</span>
              <div>
                <p className="font-semibold text-[var(--text)]">Définissez vos grilles salariales</p>
                <p className="mt-1">Créez des familles de métiers avec leurs niveaux et fourchettes.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white">3</span>
              <div>
                <p className="font-semibold text-[var(--text)]">Ajoutez vos talents</p>
                <p className="mt-1">Invitez vos collaborateurs et assignez-les à leurs postes.</p>
              </div>
            </li>
          </ol>
        </section>
      )}
    </div>
  );
}
