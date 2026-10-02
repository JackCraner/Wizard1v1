import { expect, it } from 'vitest';
import { fighter, simulate } from './engine';
import { combatTotals } from './combatTotals';
import { CombatAttribution, distributeCredit } from './combatAttribution';
import { combatNumberSize } from '../screens/combatNumberSize';
import type { Battle } from './model';
import { mirrorBattle } from '../multiplayer/roomAuthority';

const through = (battle: Battle, tick: number) => ({ ...battle, frames: battle.frames.filter(frame => frame.tick <= tick) });
const idle = () => fighter('Idle', ['healing-seed']);

it('keeps duplicate slots separate and does not double-count tickStart snapshots', () => {
  const battle = through(simulate(fighter('A', ['spark', 'spark']), idle()), 2);
  const before = JSON.stringify(battle);
  expect(combatTotals(battle).player).toEqual([{ damage: 55, healing: 0 }, { damage: 55, healing: 0 }]);
  expect(combatTotals(battle)).toEqual(combatTotals(battle));
  expect(JSON.stringify(battle)).toBe(before);
});

it('includes Echo damage across Imp, Ward and Health, capped at actual loss', () => {
  const a = fighter('A', ['spark']); a.statuses.tide = 3;
  const b = idle(); b.imp = { health: 10, maxHealth: 10, guard: 0 }; b.shield = 15; b.health = 20;
  const battle = through(simulate(a, b), 1);
  const damage = battle.frames[1].damageEvents!.filter(e => e.sourceSide === 'player');
  expect(new Set(damage.map(e => e.target))).toEqual(new Set(['imp', 'ward', 'wizard']));
  expect(combatTotals(battle).player[0].damage).toBe(damage.reduce((sum, e) => sum + e.amount, 0));
  expect(combatTotals(battle).player[0].damage).toBeLessThanOrEqual(70);
});

it('counts actual healing and excludes self-inflicted Health costs', () => {
  const a = fighter('A', ['healing-seed', 'scorch']); a.health = 490;
  expect(combatTotals(through(simulate(a, idle()), 2)).player).toEqual([{ damage: 0, healing: 10 }, { damage: 0, healing: 0 }]);
});

it('attributes Poison and Regeneration to their applying spells', () => {
  const a = fighter('A', ['agony', 'prayer']); a.health = 100;
  const totals = combatTotals(through(simulate(a, idle()), 3));
  expect(totals.player[0].damage).toBe(20);
  expect(totals.player[1].healing).toBe(10);
});

it('keeps empowered Imp attacks on the broken empowerment card', () => {
  const battle = through(simulate(fighter('A', ['empowered-imp', 'healing-seed'], [], [3, 0]), idle()), 2);
  expect(battle.frames[2].player.broken).toContain(0);
  expect(combatTotals(battle).player).toEqual([{ damage: 80, healing: 0 }, { damage: 0, healing: 0 }]);
});

it.each(['hex', 'lava-floor'])('attributes delayed %s damage to its card', id => {
  const battle = simulate(fighter('A', [id, 'healing-seed']), idle());
  const damage = battle.frames.flatMap(frame=>frame.damageEvents??[]).filter(hit=>hit.sourceSide==='player'&&hit.side==='bot');
  expect(damage.length).toBeGreaterThan(0);
  expect(combatTotals(battle).player[0].damage).toBe(damage.reduce((sum,hit)=>sum+hit.amount,0));
});

it('includes healing to a friendly Imp without counting unused healing', () => {
  const a = fighter('A', ['healing-seed'], ['friendly-imp']);
  a.imp = { health: 10, maxHealth: 30, guard: 0 }; a.health=495;
  const battle = through(simulate(a,idle()),1);
  expect(combatTotals(battle).player[0].healing).toBe(25);
});

it('records Trigger and Retrigger payloads under the triggering card', () => {
  const a = fighter('A', ['healing-seed', 'spark', 'whirlpool']); a.health = 100;
  const battle = through(simulate(a, idle()), 3);
  expect(battle.frames[3].notices?.some(n => n.status === 'retrigger')).toBe(true);
  expect(combatTotals(battle).player[0].healing).toBeGreaterThan(25);
  expect(combatTotals(battle).player[2].healing).toBe(0);
});

it('spends durations oldest-first and removes cleansed credits before reapplication', () => {
  const attribution = new CombatAttribution();
  attribution.change('bot', 'poison', 0, 2, 'player', 0);
  attribution.change('bot', 'poison', 2, 5, 'player', 1);
  expect(distributeCredit(10, attribution.credits('bot', 'poison'))).toEqual([{ side: 'player', index: 0, amount: 10 }]);
  attribution.change('bot', 'poison', 5, 3);
  expect(attribution.credits('bot', 'poison')[0].index).toBe(1);
  attribution.change('bot', 'poison', 3, 0);
  attribution.change('bot', 'poison', 0, 4, 'player', 2);
  expect(attribution.credits('bot', 'poison')[0].index).toBe(2);
  expect(distributeCredit(17, [{ side: 'player', index: 0, amount: 2 }, { side: 'player', index: 1, amount: 3 }]).reduce((sum,c)=>sum+c.amount,0)).toBe(17);
});

it('mirrors totals between fighters and keeps augment-only effects separate', () => {
  const a = fighter('A', ['agony', 'prayer'], ['toxic-start']); a.health = 200;
  const b = fighter('B', ['spark', 'leech']);
  const forward = combatTotals(simulate(a,b)), reverse = combatTotals(simulate(b,a));
  expect(forward.player).toEqual(reverse.bot); expect(forward.bot).toEqual(reverse.player);
  const mirrored = combatTotals(mirrorBattle(simulate(a,b)));
  expect(mirrored.player).toEqual(forward.bot); expect(mirrored.bot).toEqual(forward.player);
  expect(combatTotals(through(simulate(fighter('A',['ocean-heart'],['toxic-start']),idle()),1)).player[0].damage).toBe(0);
});

it('increases number size with magnitude and bounds extreme values', () => {
  for (const compact of [false,true]) {
    const sizes = [10,50,100,250,1000].map(value=>combatNumberSize(value,compact));
    expect(sizes.every((size,i)=>i===0||size>sizes[i-1])).toBe(true);
    expect(combatNumberSize(1000000,compact)).toBe(sizes.at(-1));
    expect(combatNumberSize(100,compact,true)).toBeGreaterThan(combatNumberSize(100,compact));
  }
});
