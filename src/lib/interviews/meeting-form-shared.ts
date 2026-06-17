export const INTERVIEW_TYPES = [
  { value: "Entretien annuel", label: "Entretien annuel" },
  { value: "Entretien semestriel", label: "Entretien semestriel" },
  { value: "Entretien ponctuel", label: "Entretien ponctuel" },
  { value: "Rémunération & avantages", label: "Rémunération & avantages" },
  { value: "Évolution de carrière", label: "Évolution de carrière" },
  { value: "Performance & objectifs", label: "Performance & objectifs" },
] as const;

export type RdvSlotForm = { date: string; time: string; durationMin: number };

export function emptyRdvSlots(): RdvSlotForm[] {
  return [
    { date: "", time: "", durationMin: 45 },
    { date: "", time: "", durationMin: 45 },
    { date: "", time: "", durationMin: 45 },
  ];
}

export function buildSlotsPayload(slots: RdvSlotForm[]) {
  return slots
    .filter((s) => s.date && s.time)
    .map((s) => {
      const start = new Date(`${s.date}T${s.time}`);
      const end = new Date(start.getTime() + s.durationMin * 60_000);
      return { starts_at: start.toISOString(), ends_at: end.toISOString() };
    });
}
