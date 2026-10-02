import type { Battle, CombatContribution } from './model';

export interface SpellTotal { damage: number; healing: number }
export function combatTotals(battle: Battle): Record<'player' | 'bot', SpellTotal[]> {
  const first = battle.frames[0];
  const totals = {
    player: first.player.spells.map(() => ({ damage: 0, healing: 0 })),
    bot: first.bot.spells.map(() => ({ damage: 0, healing: 0 })),
  };
  const add = (credits: CombatContribution[], kind: keyof SpellTotal) => {
    for (const credit of credits) {
      const entry = totals[credit.side][credit.index];
      if (entry) entry[kind] += credit.amount;
    }
  };
  // tickStart is a presentation snapshot of events already included in its parent frame.
  for (const frame of battle.frames) {
    for (const hit of frame.damageEvents ?? []) {
      if (!hit.sourceSide || hit.sourceSide === hit.side || hit.kind === 'cost') continue;
      add(hit.contributions ?? [{ side: hit.sourceSide, index: hit.sourceIndex ?? -1, amount: hit.amount }], 'damage');
    }
    for (const heal of frame.healingEvents ?? []) {
      add(heal.contributions ?? [{ side: heal.side, index: heal.sourceIndex ?? -1, amount: heal.amount }], 'healing');
    }
  }
  return totals;
}
