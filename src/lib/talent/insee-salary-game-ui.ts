export type InseeSalaryGameUi = {
  netMonthlyEstimated: number;
  inseeMedianNetMonthly: number;
  pctVsMedian: number;
  approximatePercentile: number;
  game: { bucket: number; title: string; emoji: string; blurb: string };
};
