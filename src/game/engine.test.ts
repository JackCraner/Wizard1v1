import { describe, expect, it } from 'vitest';
import { deriveStats, fighter, simulate } from './engine';
import { LocalGameGateway } from '../services/localGateway';
describe('combat', () => {
  it('starts at 100 health and 50 mana and supports equipment modifiers', () => {
    expect(deriveStats()).toEqual({ health: 100, mana: 50 });
    expect(deriveStats([{ health: 25, mana: 10 }])).toEqual({ health: 125, mana: 60 });
  });
  it('is deterministic and does not mutate input', () => {
    const p = fighter('A', ['spark', 'fireball']), b = fighter('B', ['ward', 'spark']);
    const original = structuredClone(p);
    expect(simulate(p, b)).toEqual(simulate(p, b)); expect(p).toEqual(original);
  });
  it('resolves simultaneous lethal casts as a draw', () => {
    const battle = simulate(fighter('A', ['spark']), fighter('B', ['spark']));
    expect(battle.outcome).toBe('draw');
    expect(battle.frames.at(-1)?.player.health).toBe(0);
    expect(battle.frames.at(-1)?.bot.health).toBe(0);
  });
  it('repeats spell order and skips unaffordable casts without negative mana', () => {
    const battle = simulate(fighter('A', ['bolt', 'mend']), fighter('B', ['ward']));
    expect(battle.frames[1].player.mana).toBe(30);
    expect(battle.frames[2].player.mana).toBe(20);
    expect(battle.frames[3].player.mana).toBe(0);
    expect(battle.frames[4].messages[0]).toContain('skips');
    expect(battle.frames.every(f => f.player.mana >= 0)).toBe(true);
    expect(battle.frames.length).toBeLessThanOrEqual(61);
  });
  it('applies shields before damage and caps healing', () => {
    const battle = simulate(fighter('A', ['ward', 'mend']), fighter('B', ['spark']));
    expect(battle.frames[1].player.health).toBe(100);
    expect(battle.frames[1].player.shield).toBe(10);
    expect(battle.frames.every(f => f.player.health <= 100)).toBe(true);
  });
  it('siphons actual damage dealt through shields', () => {
    const p = fighter('A', ['drain']); p.health = 50;
    const battle = simulate(p, fighter('B', ['ward']));
    expect(battle.frames[1].player.health).toBe(50);
  });
});

