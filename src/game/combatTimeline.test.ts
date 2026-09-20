import { describe, expect, it } from 'vitest';
import { fighter, simulate } from './engine';
import { castAt } from './combatTimeline';

describe('combat timeline replay', () => {
  const battle = simulate(fighter('You', ['fireball', 'spark'], [{ mana: -38 }]), fighter('Bot', ['ward', 'mend']));
  it('shows both simultaneous casts and reads mana before payment', () => {
    expect(castAt(battle, 1, 'player', 1)).toEqual({ spell: 'fireball', skipped: false });
    expect(castAt(battle, 1, 'bot', 1)).toEqual({ spell: 'ward', skipped: false });
  });
  it('wraps casting order and distinguishes free casts from mana skips', () => {
    expect(castAt(battle, 2, 'player', 3)).toEqual({ spell: 'spark', skipped: false });
    expect(castAt(battle, 3, 'player', 3)).toEqual({ spell: 'fireball', skipped: true });
  });
  it('does not expose future casts, the initial snapshot, or ticks after combat', () => {
    expect(castAt(battle, 2, 'player', 1)).toBeNull();
    expect(castAt(battle, 0, 'bot', 1)).toBeNull();
    expect(castAt(battle, battle.frames.length, 'bot', 99)).toBeNull();
  });
});
