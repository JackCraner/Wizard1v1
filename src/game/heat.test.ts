import {expect, it} from 'vitest';
import {fighter, simulate} from './engine';
import {resourcePredictions} from './combatCards';
import {cardAt} from './upgrades';

it('requires five Heat, consumes exactly five, and preserves surplus', () => {
  for (const heat of [1, 2, 3, 4, 5, 7]) {
    const player = fighter('A', ['pyroblast']);
    player.statuses.heat = heat;
    expect(resourcePredictions(player).heat).toBe(heat >= 5 ? 0 : undefined);
    const frame = simulate(player, fighter('B', ['healing-seed'])).frames[1];
    if (heat < 5) {
      expect(frame.player.casting?.totalTicks).toBe(3);
      expect(frame.player.statuses.heat).toBe(heat);
      expect(frame.notices?.some(n => n.status === 'heat')).toBe(false);
    } else {
      expect(frame.events.find(e => e.side === 'player')?.details).toContain('Empowered');
      expect(frame.notices?.find(n => n.status === 'heat')?.resource).toEqual({before: heat, spent: 5, after: heat - 5});
      expect(frame.player.statuses.heat).toBe(heat - 5 + 1);
    }
  }
});

it('keeps the slower Fire roles at their printed duration after upgrading', () => {
  for (const [id, ticks] of [['heatwave', 2], ['lava-floor', 2], ['emberstorm', 2], ['eruption', 3], ['phoenix-guard', 3]] as const) {
    for (const xp of [0, 3]) {
      expect(cardAt(id, xp).castTicks).toBe(ticks);
      const battle = simulate(fighter('A', [id], [], [xp]), fighter('B', ['healing-seed']));
      expect(battle.frames.find(f => f.events.some(e => e.side === 'player' && e.status === 'cast'))?.tick).toBe(ticks);
    }
  }
});

it.each(['pyroblast', 'brine', 'healing-seed', 'aegis', 'leech'])('Heat Empowers %s without requiring Fire attunement', id => {
  const player = fighter('A', [id]);
  player.health = 100;
  player.statuses.heat = 5;
  const frame = simulate(player, fighter('B', ['healing-seed'])).frames[1];
  expect(frame.events.find(e => e.side === 'player')?.details).toContain('Empowered');
  expect(frame.notices?.find(n => n.status === 'heat')?.resource?.spent).toBe(5);
  expect(frame.player.statuses.heat??0).toBe(id === 'pyroblast' ? 1 : 0);
  if (id === 'aegis') expect(frame.player.shield).toBe(75);
  if (id === 'healing-seed') expect(frame.player.health).toBe(137);
});

it('skips Instant spells and can combine Heat with a Tide Echo on another domain', () => {
  const player = fighter('A', ['holy-light', 'brine']);
  player.statuses = {heat: 5, tide: 3};
  expect(resourcePredictions(player)).toEqual({heat: 1, tide: 1});
  const frames = simulate(player, fighter('B', ['healing-seed'])).frames;
  expect(frames[1].player.statuses.heat).toBe(5);
  expect(frames[1].notices?.some(n => n.status === 'heat')).toBe(false);
  const cast = frames[2].events.find(e => e.side === 'player');
  expect(cast?.details).toContain('Empowered');
  expect(cast?.repeats).toBe(2);
  expect(frames[2].player.statuses.heat??0).toBe(0);
});

