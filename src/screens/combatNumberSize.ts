/** Bounded square-root scaling gives large hits emphasis without dominating the HUD. */
export function combatNumberSize(amount: number, compact = false, critical = false): number {
  const magnitude = Math.sqrt(Math.max(0, Math.min(1000, Math.abs(amount))) / 1000);
  return Math.round((compact ? 10 : 13) + magnitude * (compact ? 12 : 17) + (critical ? 2 : 0));
}
