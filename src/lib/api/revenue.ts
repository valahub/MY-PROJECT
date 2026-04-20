export const SUBSCRIPTION_DUNNING_DAYS = [1, 3, 7] as const;

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function addBillingCycle(isoDate: string, interval: "monthly" | "yearly"): string {
  const d = new Date(isoDate);
  if (interval === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
  if (interval === "yearly") d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString();
}

export function calculateProrationDelta(
  currentPlanPrice: number,
  targetPlanPrice: number,
  periodStartIso: string,
  periodEndIso: string,
  atIso: string,
): number {
  const start = new Date(periodStartIso).getTime();
  const end = new Date(periodEndIso).getTime();
  const at = new Date(atIso).getTime();

  const cycleMs = Math.max(1, end - start);
  const clampedAt = Math.min(Math.max(at, start), end);
  const remainingMs = Math.max(0, end - clampedAt);
  const ratio = remainingMs / cycleMs;

  const raw = (targetPlanPrice - currentPlanPrice) * ratio;
  return Math.round(raw * 100) / 100;
}
