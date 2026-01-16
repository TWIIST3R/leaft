"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useOrganizationList } from "@clerk/nextjs";

type DashboardData = {
  organization: { id: string; name: string };
  employeesCount: number;
  departmentsCount: number;
  jobFamiliesCount: number;
};

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setActive, organizationList } = useOrganizationList();
  const [isVerifying, setIsVerifying] = useState(false);
  const sessionId = searchParams.get("session_id");

  // If we have a session_id, verify the subscription was synced
  useEffect(() => {
    if (!sessionId) return;

    let retryCount = 0;
    const maxRetries = 10; // Increased retries for webhook delays

    const verifySubscription = async () => {
      setIsVerifying(true);
      try {
        // Call API to verify and sync subscription if needed
        const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Try to set the active organization if we have orgId in response
          // This ensures orgId is set in Clerk session for subsequent requests
          if (data.orgId && setActive) {
            // Check if this organization is in the user's organization list
            const orgInList = organizationList?.find(org => org.id === data.orgId);
            if (orgInList) {
              try {
                await setActive({ organization: data.orgId });
                console.log("Set active organization:", data.orgId);
              } catch (error) {
                console.error("Error setting active organization:", error);
                // Continue anyway - we can still work with orgId undefined
              }
            } else {
              console.log("Organization not found in organization list, skipping setActive");
            }
          }

          // Wait a bit to ensure database is updated and organization is set
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Remove session_id from URL and force full page reload to ensure subscription is recognized
          window.location.href = "/dashboard";
          return;
        } else {
          // If verification fails, wait a bit and retry (webhook might be delayed)
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying subscription verification (${retryCount}/${maxRetries})...`);
            setTimeout(() => {
              verifySubscription();
            }, 2000);
          } else {
            // Max retries reached, stop trying and show error
            setIsVerifying(false);
            console.error("Failed to verify subscription after multiple retries:", data);
            alert("Impossible de vérifier votre abonnement. Veuillez rafraîchir la page ou contacter le support.");
          }
        }
      } catch (error) {
        console.error("Error verifying subscription:", error);
        // Retry after delay
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => {
            verifySubscription();
          }, 2000);
        } else {
          setIsVerifying(false);
          alert("Erreur lors de la vérification de l'abonnement. Veuillez rafraîchir la page.");
        }
      }
    };

    verifySubscription();
  }, [sessionId, router]);

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
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-8 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">Bienvenue sur Leaft</h1>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
              Gérez vos grilles salariales, talents et entretiens en toute transparence.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Talents</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{initialData.employeesCount}</p>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            {initialData.employeesCount === 0
              ? "Commencez par ajouter vos premiers talents"
              : `${initialData.employeesCount} talent${initialData.employeesCount > 1 ? "s" : ""} dans votre organisation`}
          </p>
        </div>

        <div className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Départements</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{initialData.departmentsCount}</p>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            {initialData.departmentsCount === 0
              ? "Créez vos départements pour organiser vos talents"
              : `${initialData.departmentsCount} département${initialData.departmentsCount > 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Familles de métiers</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{initialData.jobFamiliesCount}</p>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            {initialData.jobFamiliesCount === 0
              ? "Définissez vos familles de métiers et grilles salariales"
              : `${initialData.jobFamiliesCount} famille${initialData.jobFamiliesCount > 1 ? "s" : ""} de métiers`}
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">Actions rapides</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <button className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-left transition hover:bg-[#f2f5f2]">
            <p className="text-sm font-semibold text-[var(--text)]">Ajouter un talent</p>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.65)]">Inviter un nouveau collaborateur</p>
          </button>
          <button className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-left transition hover:bg-[#f2f5f2]">
            <p className="text-sm font-semibold text-[var(--text)]">Créer une grille</p>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.65)]">Définir une famille de métiers</p>
          </button>
          <button className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-left transition hover:bg-[#f2f5f2]">
            <p className="text-sm font-semibold text-[var(--text)]">Nouvel entretien</p>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.65)]">Enregistrer un entretien</p>
          </button>
          <button className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-left transition hover:bg-[#f2f5f2]">
            <p className="text-sm font-semibold text-[var(--text)]">Voir les statistiques</p>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.65)]">Analyser l'équité salariale</p>
          </button>
        </div>
      </section>

      {/* Getting Started */}
      {initialData.employeesCount === 0 && (
        <section className="rounded-3xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-6">
          <h2 className="text-lg font-semibold text-[var(--text)]">Pour commencer</h2>
          <ol className="mt-4 space-y-3 text-sm text-[color:rgba(11,11,11,0.7)]">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white">
                1
              </span>
              <div>
                <p className="font-semibold text-[var(--text)]">Créez vos départements</p>
                <p className="mt-1">Organisez votre structure en créant vos départements (ex: Product, Sales, Engineering).</p>
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
