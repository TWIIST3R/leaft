"use client";

import { useCallback, useMemo, useRef } from "react";
import { GuidedTourEngine } from "@/components/guided-tour/guided-tour-engine";
import { buildTalentTourSteps, TALENT_TOUR_STORAGE_KEY } from "@/components/talent/talent-tour-steps";

type Props = {
  firstName: string;
  salaryVisible: boolean;
  hasProgression: boolean;
};

export function TalentTourHost({ firstName, salaryVisible, hasProgression }: Props) {
  const currentStepIdRef = useRef<string | null>(null);

  const steps = useMemo(
    () => buildTalentTourSteps({ salaryVisible, hasProgression }),
    [salaryVisible, hasProgression],
  );

  const handleStepChange = useCallback((stepId: string) => {
    currentStepIdRef.current = stepId;
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
