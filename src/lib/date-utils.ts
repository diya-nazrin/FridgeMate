// Client-safe Date utilities (no database imports)

export function formatDaysUntil(expiryStr: string): number {
  if (!expiryStr) return 99;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(expiryStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDatePlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
