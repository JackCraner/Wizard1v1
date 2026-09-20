import { SPELLS } from './engine';
import type { Battle, SpellId } from './model';

// Replay frames are post-cast snapshots. Use the preceding snapshot's mana,
// rather than the remaining mana or human-readable log, to classify the cast.
export function castAt(battle: Battle, tick: number, side: 'player' | 'bot', visibleTick: number): { spell: SpellId; skipped: boolean } | null {
  if (tick < 1 || tick > visibleTick || !battle.frames[tick]) return null;
  const before = battle.frames[tick - 1][side];
  const spell = before.spells[(tick - 1) % before.spells.length];
  return spell ? { spell, skipped: before.mana < SPELLS[spell].mana } : null;
}
