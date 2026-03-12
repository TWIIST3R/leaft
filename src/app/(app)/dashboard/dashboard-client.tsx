"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useOrganizationList } from "@clerk/nextjs";
import gsap from "gsap";

type DashboardData = {
  organization: { id: string; name: string };
  employeesCount: number;
  departmentsCount: number;
  paliersCount: number;
  avgSalary: number;
  genderF: number;
  genderH: number;
  newestHire: { name: string; date: string | null } | null;
};

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setActive, userMemberships } = useOrganizationList();
  const [isVerifying, setIsVerifying] = useState(false);
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
            alert("Impossible de vérifier votre abonnement. Veuillez rafraîchir la page ou contacter le support.");
          }
        }
      } catch {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => verifySubscription(), 2000);
        } else {
          setIsVerifying(false);
          alert("Erreur lors de la vérification de l'abonnement. Veuillez rafraîchir la page.");
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

      <section data-animate className="grid gap-6 md:grid-cols-3">
        <Link
          href="/dashboard/talents"
          className="block rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)] transition hover:border-[var(--brand)]/30 hover:shadow-[0_24px_60px_rgba(17,27,24,0.08)]"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Talents</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{initialData.employeesCount}</p>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            {initialData.employeesCount === 0
              ? "Commencez par ajouter vos premiers talents"
              : `${initialData.employeesCount} talent${initialData.employeesCount > 1 ? "s" : ""} dans votre organisation`}
          </p>
        </Link>

        <Link
          href="/dashboard/grilles"
          className="block rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)] transition hover:border-[var(--brand)]/30 hover:shadow-[0_24px_60px_rgba(17,27,24,0.08)]"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Départements</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{initialData.departmentsCount}</p>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            {initialData.departmentsCount === 0
              ? "Créez vos départements pour organiser vos talents"
              : `${initialData.departmentsCount} département${initialData.departmentsCount > 1 ? "s" : ""}`}
          </p>
        </Link>

        <Link
          href="/dashboard/grilles"
          className="block rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)] transition hover:border-[var(--brand)]/30 hover:shadow-[0_24px_60px_rgba(17,27,24,0.08)]"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Paliers</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{initialData.paliersCount}</p>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            {initialData.paliersCount === 0
              ? "Définissez vos paliers par département (rémunération + critères)"
              : `${initialData.paliersCount} palier${initialData.paliersCount > 1 ? "s" : ""} dans vos grilles`}
          </p>
        </Link>
      </section>

      {initialData.employeesCount > 0 && (
        <section data-animate className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Salaire moyen brut</p>
            <p className="mt-3 text-2xl font-semibold text-[var(--text)]">
              {initialData.avgSalary > 0 ? `${initialData.avgSalary.toLocaleString("fr-FR")} €` : "—"}
            </p>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">Moyenne annuelle brute</p>
          </div>
          <div className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Répartition H/F</p>
            <p className="mt-3 text-2xl font-semibold text-[var(--text)]">
              {initialData.genderH}H / {initialData.genderF}F
            </p>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
              {initialData.employeesCount - initialData.genderH - initialData.genderF > 0
                ? `${initialData.employeesCount - initialData.genderH - initialData.genderF} autre(s)`
                : "Sur l'ensemble de l'organisation"}
            </p>
          </div>
          {initialData.newestHire && (
            <div className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Dernière arrivée</p>
              <p className="mt-3 text-lg font-semibold text-[var(--text)]">{initialData.newestHire.name}</p>
              <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
                {initialData.newestHire.date
                  ? new Date(initialData.newestHire.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                  : "—"}
              </p>
            </div>
          )}
        </section>
      )}

      <section data-animate className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
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
          <div className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-left opacity-60">
            <p className="text-sm font-semibold text-[var(--text)]">Entretiens</p>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.65)]">Bientôt disponible</p>
          </div>
          <div className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-left opacity-60">
            <p className="text-sm font-semibold text-[var(--text)]">Statistiques</p>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.65)]">Bientôt disponible</p>
          </div>
        </div>
      </section>

      {initialData.employeesCount === 0 && (
        <section data-animate className="rounded-3xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-6">
          <h2 className="text-lg font-semibold text-[var(--text)]">Pour commencer</h2>
          <ol className="mt-4 space-y-3 text-sm text-[color:rgba(11,11,11,0.7)]">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white">
                1
              </span>
              <div>
                <p className="font-semibold text-[var(--text)]">Créez vos départements</p>
                <p className="mt-1">Dans Grilles de salaire, organisez votre structure (ex: Product, Sales, Engineering).</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white">
                2
              </span>
              <div>
                <p className="font-semibold text-[var(--text)]">Définissez vos grilles salariales</p>
                <p className="mt-1">Créez des familles de métiers avec leurs niveaux et fourchettes salariales.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white">
                3
              </span>
              <div>
                <p className="font-semibold text-[var(--text)]">Ajoutez vos talents</p>
                <p className="mt-1">Invitez vos collaborateurs et assignez-les à leurs postes et niveaux.</p>
              </div>
            </li>
          </ol>
        </section>
      )}
    </div>
  );
}
