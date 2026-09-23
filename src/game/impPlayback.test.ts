import {expect, it} from 'vitest';
import {fighter, simulate} from './engine';
import {continuousCombatFrame} from './playback';

it('shows a defeated Imp for one presentation tick without changing simulation state', () => {
  const player = fighter('A', ['healing-seed']);
  player.imp = {health: 20, maxHealth: 80, guard: 0};
  const battle = simulate(player, fighter('B', ['spark']));
  expect(battle.frames[1].player.imp?.health).toBe(0);
  expect(continuousCombatFrame(battle, 1).player.imp?.health).toBe(0);
  expect(continuousCombatFrame(battle, 2).player.imp).toBeUndefined();
  expect(battle.frames[2].tickStart?.player.imp).toBeUndefined();
});

it('replaces the defeated presentation with a resummoned Imp', () => {
  const player = fighter('A', ['ritual']);
  player.imp = {health: 20, maxHealth: 80, guard: 0};
  const battle = simulate(player, fighter('B', ['spark']));
  expect(continuousCombatFrame(battle, 1).player.imp?.health).toBe(0);
  expect(continuousCombatFrame(battle, 2).player.imp?.health).toBe(60);
});
