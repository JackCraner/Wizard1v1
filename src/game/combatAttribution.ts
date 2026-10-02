import type { CombatContribution } from './model';

type Side = 'player' | 'bot';
type Credit = { side: Side; index: number; amount: number };

/** Presentation bookkeeping only. Added durations are spent oldest-first. */
export class CombatAttribution {
  private pools = new Map<string, Credit[]>();

  change(side: Side, status: string, before: number, after: number, source: Side = side, index = -1) {
    if (!['poison', 'regeneration', 'trap', 'curse'].includes(status)) return;
    const key = `${side}:${status}`;
    const pool = this.pools.get(key) ?? (before > 0 ? [{ side: source, index: -1, amount: before }] : []);
    let removed = Math.max(0, before - after);
    while (removed > 0 && pool.length) {
      const spent = Math.min(removed, pool[0].amount);
      pool[0].amount -= spent;
      removed -= spent;
      if (!pool[0].amount) pool.shift();
    }
    if (after > before) pool.push({ side: source, index, amount: after - before });
    this.pools.set(key, pool);
  }

  credits(side: Side, status: string, all = false): Credit[] {
    const pool = this.pools.get(`${side}:${status}`) ?? [];
    return (all ? pool : pool.slice(0, 1)).map(item => ({ ...item }));
  }
}

/** Allocate actual damage/healing, including caps, without changing combat resolution. */
export function distributeCredit(amount: number, credits: readonly Credit[]): CombatContribution[] {
  const total = credits.reduce((sum, credit) => sum + credit.amount, 0);
  let used = 0, weight = 0;
  return credits.map(credit => {
    weight += credit.amount;
    const cumulative = Math.floor(amount * weight / total);
    const portion = cumulative - used;
    used = cumulative;
    return { side: credit.side, index: credit.index, amount: portion };
  });
}
