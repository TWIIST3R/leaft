"use client";

import { useEffect, useState } from "react";
import type { PricingPlan } from "./page";

type BillingCycle = "monthly" | "annual";

export function PricingTable({ plans }: { plans: PricingPlan[] }) {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [pendingBilling, setPendingBilling] = useState<BillingCycle | null>(null);
  const [isFading, setIsFading] = useState(false);

  const handleBillingChange = (mode: BillingCycle) => {
    if (mode === billing || pendingBilling) return;
    setPendingBilling(mode);
    setIsFading(true);
  };

  useEffect(() => {
    if (!isFading || !pendingBilling) return;

    const timeout = setTimeout(() => {
      setBilling(pendingBilling);
      setPendingBilling(null);
      setIsFading(false);
    }, 200);

    return () => clearTimeout(timeout);
  }, [isFading, pendingBilling, billing]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => handleBillingChange("monthly")}
            className={`cursor-pointer rounded-full px-4 py-2 transition ${
              billing === "monthly" ? "bg-white text-[var(--brand)]" : "text-white/80 hover:text-white"
            }`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => handleBillingChange("annual")}
            className={`cursor-pointer rounded-full px-4 py-2 transition ${
              billing === "annual" ? "bg-white text-[var(--brand)]" : "text-white/80 hover:text-white"
            }`}
          >
            Annuel
          </button>
        </div>
      </div>

      <div
        className={`grid gap-6 transition-[opacity,transform] duration-200 ease-in-out lg:grid-cols-4 ${
          isFading ? "pointer-events-none opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        {plans.map((plan) => {
          const data = plan[billing];
          return (
            <article
              key={plan.range}
              className="flex h-full flex-col rounded-[40px] border border-white/20 bg-white p-8 text-left text-[var(--text)] shadow-[0_20px_60px_rgba(9,82,40,0.25)]"
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
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                {data.ctaLabel}
              </button>
              <div className="mt-6 space-y-3 text-sm text-[color:rgba(11,11,11,0.7)]">
                <p className="font-semibold">Est inclus :</p>
                <ul className="space-y-2">
                  {data.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] text-white">
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
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

