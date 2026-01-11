"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Hero } from "@/components/marketing/hero";

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingOrg, setCheckingOrg] = useState(true);
  const router = useRouter();
  const { isSignedIn, userId, orgId, isLoaded } = useAuth();

  // Check if organization already exists in Supabase
  useEffect(() => {
    if (!isLoaded) return;

    // If not signed in, redirect to sign-up
    if (!isSignedIn || !userId) {
      router.push("/sign-up");
      return;
    }

    // Check if organization already exists in Supabase
    // If it exists with an active subscription, redirect to dashboard
    // Otherwise, show the onboarding form to create the organization
    const checkOrganization = async () => {
      try {
        const response = await fetch("/api/onboarding/check");
        if (!response.ok) {
          setCheckingOrg(false);
          return;
        }

        const data = await response.json();

        if (data.exists && data.hasSubscription) {
          // Organization exists and has subscription, redirect to dashboard
          router.push("/dashboard");
          return;
        }

        // Organization doesn't exist or has no subscription, show onboarding form
        setCheckingOrg(false);
      } catch (err) {
        console.error("Error checking organization:", err);
        setCheckingOrg(false);
      }
    };

    checkOrganization();
  }, [isLoaded, isSignedIn, userId, router]);

  if (!isLoaded || !isSignedIn || !userId || checkingOrg) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8f6]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--brand)]/20"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[var(--brand)]"></div>
          </div>
          <p className="text-sm font-medium text-[color:rgba(11,11,11,0.7)]">Chargement...</p>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const organizationName = formData.get("organizationName") as string;
    const businessName = formData.get("businessName") as string;
    const taxId = formData.get("taxId") as string;
    const employeeCount = parseInt(formData.get("employeeCount") as string, 10);
    const planType = formData.get("planType") as "monthly" | "annual";

    if (!organizationName || !businessName || !taxId || !employeeCount || !planType) {
      setError("Veuillez remplir tous les champs");
      setLoading(false);
      return;
    }

    try {
      // Create organization and redirect to checkout
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationName,
          businessName,
          taxId,
          employeeCount,
          planType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || "Une erreur est survenue";
        throw new Error(errorMsg);
      }

      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("URL de checkout non reçue");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8f6] px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <Hero
            eyebrow="Configuration de votre compte"
            title="Bienvenue sur Leaft !"
            description="Complétez les informations de votre entreprise pour commencer."
            align="center"
            tone="light"
          />
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-[#e2e7e2] bg-white p-8 shadow-[0_24px_60px_rgba(17,27,24,0.08)]">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="organizationName" className="block text-sm font-semibold text-[var(--text)]">
                Nom de l'organisation (interne) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="organizationName"
                name="organizationName"
                required
                className="mt-2 w-full rounded-xl border border-[#e2e7e2] bg-white px-4 py-3 text-[var(--text)] transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                placeholder="Ex: Acme Corp"
              />
              <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.6)]">
                Nom utilisé dans l'application pour identifier votre organisation
              </p>
            </div>

            <div>
              <label htmlFor="businessName" className="block text-sm font-semibold text-[var(--text)]">
                Nom légal de l'entreprise <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                required
                className="mt-2 w-full rounded-xl border border-[#e2e7e2] bg-white px-4 py-3 text-[var(--text)] transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                placeholder="Ex: Acme Corporation SARL"
              />
              <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.6)]">
                Nom officiel de votre entreprise (apparaîtra sur les factures)
              </p>
            </div>

            <div>
              <label htmlFor="taxId" className="block text-sm font-semibold text-[var(--text)]">
                Numéro de TVA / SIRET <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="taxId"
                name="taxId"
                required
                className="mt-2 w-full rounded-xl border border-[#e2e7e2] bg-white px-4 py-3 text-[var(--text)] transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                placeholder="Ex: FR12345678901 ou 12345678901234"
              />
              <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.6)]">
                Numéro d'identification fiscale de votre entreprise
              </p>
            </div>

            <div>
              <label htmlFor="employeeCount" className="block text-sm font-semibold text-[var(--text)]">
                Nombre de talents <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="employeeCount"
                name="employeeCount"
                required
                min="1"
                step="1"
                className="mt-2 w-full rounded-xl border border-[#e2e7e2] bg-white px-4 py-3 text-[var(--text)] transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                placeholder="Ex: 5"
              />
              <p className="mt-2 text-xs text-[color:rgba(11,11,11,0.6)]">
                C'est le nombre de talents qui sera facturé lors de votre premier paiement. Vous pourrez ajouter des talents à tout moment depuis votre dashboard.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-3">
                Type d'abonnement <span className="text-red-500">*</span>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="relative flex cursor-pointer rounded-xl border-2 border-[#e2e7e2] bg-white p-4 transition hover:border-[var(--brand)]/50 has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--brand)]/5">
                  <input
                    type="radio"
                    name="planType"
                    value="monthly"
                    defaultChecked
                    required
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-[var(--text)]">Mensuel</div>
                    <div className="mt-1 text-xs text-[color:rgba(11,11,11,0.6)]">Facturation mensuelle</div>
                  </div>
                </label>
                <label className="relative flex cursor-pointer rounded-xl border-2 border-[#e2e7e2] bg-white p-4 transition hover:border-[var(--brand)]/50 has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--brand)]/5">
                  <input
                    type="radio"
                    name="planType"
                    value="annual"
                    required
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-[var(--text)]">Annuel</div>
                    <div className="mt-1 text-xs text-[color:rgba(11,11,11,0.6)]">2 mois offerts</div>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Traitement..." : "Continuer vers le paiement"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

