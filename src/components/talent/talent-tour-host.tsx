"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  GuidedTourEngine,
  goToGuidedTourStep,
} from "@/components/guided-tour/guided-tour-engine";
import { buildTalentTourSteps, TALENT_TOUR_STORAGE_KEY } from "@/components/talent/talent-tour-steps";

export const TALENT_TOUR_OPEN_RDV_EVENT = "leaft-tour-open-rdv";
export const TALENT_TOUR_RDV_CLOSED_EVENT = "leaft-tour-rdv-closed";

type Props = {
  firstName: string;
  salaryVisible: boolean;
  hasProgression: boolean;
  subscriptionActive: boolean;
};

export function TalentTourHost({ firstName, salaryVisible, hasProgression, subscriptionActive }: Props) {
  const rdvOpenedRef = useRef(false);
  const currentStepIdRef = useRef<string | null>(null);

  const steps = useMemo(
    () =>
      buildTalentTourSteps({
        salaryVisible,
        hasProgression,
        skipRdv: !subscriptionActive,
      }),
    [salaryVisible, hasProgression, subscriptionActive],
  );

  const handleStepChange = useCallback((stepId: string) => {
    currentStepIdRef.current = stepId;
    rdvOpenedRef.current = false;
  }, []);

  useEffect(() => {
    const onOpenRdv = () => {
      if (currentStepIdRef.current !== "rdv_hint") return;
      rdvOpenedRef.current = true;
    };
    window.addEventListener(TALENT_TOUR_OPEN_RDV_EVENT, onOpenRdv);
    return () => window.removeEventListener(TALENT_TOUR_OPEN_RDV_EVENT, onOpenRdv);
  }, []);

  useEffect(() => {
    const onRdvClosed = () => {
      if (currentStepIdRef.current !== "rdv_hint" || !rdvOpenedRef.current) return;
      goToGuidedTourStep("outro");
    };
    window.addEventListener(TALENT_TOUR_RDV_CLOSED_EVENT, onRdvClosed);
    return () => window.removeEventListener(TALENT_TOUR_RDV_CLOSED_EVENT, onRdvClosed);
  }, []);

  if (!firstName) return null;

  return (
    <GuidedTourEngine
      steps={steps}
      storageDoneKey={TALENT_TOUR_STORAGE_KEY}
      firstName={firstName}
      onStepChange={handleStepChange}
    />
  );
}
