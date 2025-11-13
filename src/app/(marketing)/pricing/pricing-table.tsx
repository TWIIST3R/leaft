"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import type { PricingPlan } from "./page";

type BillingCycle = "monthly" | "annual";

export function PricingTable({ plans }: { plans: PricingPlan[] }) {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();
  const onboarding = searchParams.get("onboarding") === "true";

  // Extract seat count from plan range
  const getSeatCount = (range: string): number => {
    if (range.includes("1 à 5")) return 5;
    if (range.includes("6 à 19")) return 19;
    if (range.includes("20 à 99")) return 99;
    if (range.includes("100+")) return 100;
    return 5;
  };

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (!isSignedIn) {
      router.push("/sign-up");
      return;
    }

    const seatCount = getSeatCount(plan.range);
    const planKey = `${plan.range}-${billing}`;
    setLoading(planKey);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seatCount,
          planType: billing,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        console.error("Error creating checkout:", data.error);
        alert("Erreur lors de la création de la session de paiement. Veuillez réessayer.");
        setLoading(null);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
      setLoading(null);
    }
  };

  useEffect(() => {
    if (!cardsRef.current) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLDivElement>("[data-plan-card]");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 32, rotateX: -8 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.55,
          ease: "power3.out",
          stagger: 0.08,
        },
      );
    }, cardsRef);

    return () => ctx.revert();
  }, [billing]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`cursor-pointer rounded-full px-4 py-2 transition ${
              billing === "monthly" ? "bg-white text-[var(--brand)]" : "text-white/80 hover:text-white"
            }`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setBilling("annual")}
            className={`cursor-pointer rounded-full px-4 py-2 transition ${
              billing === "annual" ? "bg-white text-[var(--brand)]" : "text-white/80 hover:text-white"
            }`}
          >
            Annuel
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4" ref={cardsRef}>
        {plans.map((plan) => {
          const data = plan[billing];
          return (
            <article
              key={plan.range}
              className="flex h-full flex-col rounded-[40px] border border-white/20 bg-white p-8 text-left text-[var(--text)] shadow-[0_20px_60px_rgba(9,82,40,0.25)]"
              data-plan-card
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:rgba(9,82,40,0.75)]">
                {plan.range}
              </h2>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-[var(--brand)]">{data.perSeat}</span>
                <span className="text-sm font-medium text-[color:rgba(11,11,11,0.65)]">{data.suffix}</span>
              </div>
              <p className="mt-1 text-xs uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">{data.fixed}</p>
              <button
                type="button"
                onClick={() => handleSelectPlan(plan)}
                disabled={loading === `${plan.range}-${billing}`}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === `${plan.range}-${billing}` ? "Chargement..." : "Choisir ce plan"}
              </button>
              <div className="mt-6 space-y-3 text-sm text-[color:rgba(11,11,11,0.7)]">
                <p className="font-semibold">Est inclus :</p>
                <ul className="space-y-2 list-disc list-inside [&_li::marker]:text-[var(--brand)]">
                  {data.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

