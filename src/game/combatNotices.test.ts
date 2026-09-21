import { describe, expect, it } from 'vitest';
import { fighter, simulate } from './engine';

describe('combat explanations',()=>{
 it('records guaranteed crit conditions and the actual Overheat multiplier',()=>{
  const p=fighter('You',['lunar-strike']),b=fighter('Foe',['splash']);p.statuses.overheat=15;b.statuses.moonfire=5;
  const frame=simulate(p,b).frames[2],cast=frame.events.find(e=>e.side==='player')!;
  expect(cast.critMultiplier).toBe(2);
  expect(cast.details).toContain('Guaranteed critical: moonfire on target.');
  expect(frame.notices).toEqual(expect.arrayContaining([expect.objectContaining({side:'bot',status:'moonfire'}),expect.objectContaining({side:'player',status:'overheat'})]));
 });
 it('explains Guard without creating a damage number',()=>{
  const p=fighter('You',['ember']),b=fighter('Foe',['splash']);b.statuses.guard=3;
  const frame=simulate(p,b).frames[1];
  expect(frame.bot.health).toBe(500);expect(frame.damageEvents).toEqual([]);
  expect(frame.notices).toContainEqual({side:'bot',status:'guard',text:'Guard blocked 60 damage'});
 });
 it('records Phoenix revival and Combust activation on the affected fighter',()=>{
  const p=fighter('You',['overheat']),b=fighter('Foe',['ember']);p.health=50;p.statuses.phoenix=3;
  const frame=simulate(p,b).frames[1];
  expect(frame.notices).toEqual(expect.arrayContaining([expect.objectContaining({side:'player',status:'phoenix'}),expect.objectContaining({side:'player',status:'combust'})]));
  expect(frame.player.health).toBe(250);
 });
 it('keeps previous replay explanations unchanged and deterministic',()=>{
  const p=fighter('You',['regrowth']),b=fighter('Foe',['ember']);p.health=490;
  const battle=simulate(p,b);expect(battle).toEqual(simulate(p,b));
  expect(battle.frames[1].events[0].details).toContain('Heal self: 10 restored (30 before health cap).');
  expect(battle.frames[0].notices).toEqual([]);
 });
});
