export function dropIndex(from: number, deltaX: number, spacing: number, count: number) {
  if (count < 1 || spacing <= 0 || !Number.isFinite(deltaX)) return from;
  return Math.max(0, Math.min(count - 1, from + Math.round(deltaX / spacing)));
}
