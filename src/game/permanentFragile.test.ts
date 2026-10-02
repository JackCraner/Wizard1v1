import { expect, it } from 'vitest';
import { fighter, simulate } from './engine';
import { cardAt } from './upgrades';
import { activeSpellIndices } from './rotation';

const lastingSpells = [
  ['ocean-heart', 'tideThreshold'],
  ['tidal-power', 'echoPower'],
  ['maelstrom', 'cycleEcho'],
  ['eruption', 'heatCritical'],
  ['living-flame', 'livingFlame'],
  ['empowered-imp', 'impDamage'],
] as const;

it.each(lastingSpells)('%s breaks after its cast and Echo while its effect survives', (id, rule) => {
  for (const xp of [0, 3]) for (const echo of [false, true]) for (const swap of [false, true]) {
    const caster = fighter('Caster', [id, 'jet'], [], [xp, 0]);
    const rival = fighter('Rival', ['healing-seed']);
    caster.health = caster.maxHealth = rival.health = rival.maxHealth = 10000;
    if (echo) caster.statuses.tide = 3;
    const side = swap ? 'bot' : 'player';
    const battle = simulate(...(swap ? [rival, caster] : [caster, rival]) as [typeof caster, typeof rival]);
    const casts = battle.frames.flatMap(f => f.events).filter(e => e.side === side && e.index === 0 && e.status === 'cast');
    expect(casts).toHaveLength(1);
    expect(casts[0].repeats).toBe(echo ? 2 : 1);
    const broken = battle.frames.find(f => f[side].broken?.includes(0))!;
    expect(broken).toBeDefined();
    expect(broken.notices?.filter(n => n.side === side && n.status === 'fragile' && n.index === 0)).toHaveLength(1);
    const value = broken[side].memory.rules?.[rule];
    expect(value).toBeGreaterThan(0);
    for (const frame of battle.frames.filter(f => f.tick >= broken.tick)) {
      expect(frame[side].memory.rules?.[rule]).toBe(value);
      expect(activeSpellIndices(frame[side])).toEqual([1]);
    }
    expect(battle.frames.some(f => f.events.some(e => e.side === side && e.index === 1))).toBe(true);
    expect(caster.broken).toBeUndefined();
    expect(fighter('Next duel', [id, 'jet'], [], [xp, 0]).memory.rules).toBeUndefined();
    expect(cardAt(id, xp).keywords).toContain('fragile');
    expect(cardAt(id, xp).rules).toContain('Fragile');
  }
});

it('an interrupted permanent spell remains available and grants no lasting effect', () => {
  const battle = simulate(fighter('A', ['ocean-heart', 'jet']), fighter('B', ['disrupt']));
  expect(battle.frames[1].player.broken ?? []).toEqual([]);
  expect(battle.frames[1].player.memory.rules?.tideThreshold).toBeUndefined();
  expect(battle.frames[1].events.some(e => e.side === 'player' && e.status === 'skipped' && e.details?.includes('Interrupted'))).toBe(true);
});

it('keeps Bear and Venom Bloom available for their Trigger and Awaken benefits', () => {
  for (const id of ['transformation-bear', 'venom-bloom']) for (const xp of [0, 3]) {
    expect(cardAt(id, xp).keywords).not.toContain('fragile');
    const battle = simulate(fighter('A', [id], [], [xp]), fighter('B', ['healing-seed']));
    expect(battle.frames.at(-1)!.player.broken ?? []).toEqual([]);
  }
});
