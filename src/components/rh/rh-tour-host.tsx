"use client";

import { GuidedTourEngine } from "@/components/guided-tour/guided-tour-engine";
import { buildRhTourSteps, RH_TOUR_STORAGE_KEY } from "@/components/rh/rh-tour-steps";

export function RhTourHost() {
  const steps = buildRhTourSteps();
  return <GuidedTourEngine steps={steps} storageDoneKey={RH_TOUR_STORAGE_KEY} />;
}
