import { expect,it } from 'vitest';
import { nextCombatBeat } from './playback';
it('advances a real tick on every beat with no automatic hold',()=>{
 expect(nextCombatBeat(0,'cast',50)).toEqual({frame:1,beat:'cast'});
 expect(nextCombatBeat(1,'cast',50)).toEqual({frame:2,beat:'cast'});
});
it('does not advance beyond the final combat frame',()=>{
 expect(nextCombatBeat(50,'cast',50)).toEqual({frame:50,beat:'cast'});
});

import { fighter,simulate } from './engine';
import { presentedCombatFrame } from './playback';
it('shows DoT at real-tick start, then direct damage before holding',()=>{
 const a=fighter('A',['wrath']),b=fighter('B',['splash']);b.statuses.moonfire=2;
 const battle=simulate(a,b);
 const start=presentedCombatFrame(battle,0,'cast');
 expect(start.tick).toBe(1);expect(start.bot.health).toBe(490);
 expect(start.events).toEqual([]);
 expect(start.damageEvents).toEqual([expect.objectContaining({kind:'dot',amount:10})]);
 const hold=presentedCombatFrame(battle,1,'hold');
 expect(hold.bot.health).toBe(470);
 expect(hold.damageEvents).toEqual([expect.objectContaining({kind:'hit',amount:20})]);
 expect(presentedCombatFrame(battle,1,'hold')).toEqual(hold);
 expect(presentedCombatFrame(battle,1,'cast').bot.health).toBe(460);
 expect(battle.frames[1].damageEvents).toHaveLength(2);
});
it('does not cast after lethal tick-start damage or repeat periodic healing in the hold',()=>{
 const a=fighter('A',['wrath']);a.health=5;a.statuses.moonfire=1;
 const dead=simulate(a,fighter('B',['splash']));
 expect(presentedCombatFrame(dead,0,'cast').player.health).toBe(0);
 expect(presentedCombatFrame(dead,1,'hold').events).toEqual([]);
 const healer=fighter('A',['splash']);healer.health=300;healer.statuses.growth=2;
 const battle=simulate(healer,fighter('B',['splash']));
 expect(presentedCombatFrame(battle,0,'cast').healingEvents).toHaveLength(1);
 expect(presentedCombatFrame(battle,1,'hold').healingEvents).toEqual([]);
});

it('presents both one-tick casts at the same boundary and neither during the next cast start',()=>{
 const battle=simulate(fighter('A',['wrath','wrath']),fighter('B',['wrath','wrath']));
 const start=presentedCombatFrame(battle,0,'cast');
 expect(start.events).toEqual([]);
 expect([start.player.health,start.bot.health]).toEqual([500,500]);
 const resolved=presentedCombatFrame(battle,1,'hold');
 expect(resolved.events.map(e=>e.side)).toEqual(['player','bot']);
 expect([resolved.player.health,resolved.bot.health]).toEqual([480,480]);
 const nextStart=presentedCombatFrame(battle,1,'cast');
 expect(nextStart.events).toEqual([]);
 expect([nextStart.player.health,nextStart.bot.health]).toEqual([480,480]);
});

import { continuousCombatFrame } from './playback';
it('retains completed casts and upcoming periodic feedback with no hold',()=>{
 const a=fighter('A',['wrath','wrath']),b=fighter('B',['splash']);b.statuses.moonfire=3;
 const battle=simulate(a,b),frame=continuousCombatFrame(battle,1);
 expect(frame.events.map(e=>e.side)).toEqual(['player','bot']);
 expect(frame.damageEvents).toEqual([expect.objectContaining({kind:'hit',amount:20}),expect.objectContaining({kind:'dot',amount:10})]);
 expect(frame.bot.health).toBe(460);
});

it('shows mana deducted before a one-tick cast resolves for both fighters',()=>{
 const battle=simulate(fighter('A',['ember']),fighter('B',['ember']));
 const start=continuousCombatFrame(battle,0);
 for(const f of [start.player,start.bot]) {
  expect(f.mana).toBe(95);expect(f.health).toBe(500);
  expect(f.casting?.remaining).toBe(1);
 }
 expect(start.events).toEqual([]);
 const resolved=presentedCombatFrame(battle,1,'hold');
 expect(resolved.player.mana).toBe(95);expect(resolved.bot.mana).toBe(95);
 expect(resolved.manaEvents).toEqual([]);
});
it('charges multi-tick casts once at start and applies mana restoration only on completion',()=>{
 const a=fighter('A',['sap']);a.mana=50;
 const battle=simulate(a,fighter('B',['splash']));
 const first=continuousCombatFrame(battle,0),second=continuousCombatFrame(battle,1);
 expect(first.player.mana).toBe(48);expect(first.player.casting?.remaining).toBe(2);
 expect(second.player.mana).toBe(48);expect(second.player.casting?.remaining).toBe(1);
 expect(second.manaEvents?.filter(e=>e.side==='player')).toEqual([]);
 expect(presentedCombatFrame(battle,2,'hold').player.mana).toBe(53);
});
it('does not precharge the next card after an Instant or after lethal periodic damage',()=>{
 const battle=simulate(fighter('A',['mist','seed-shot']),fighter('B',['splash']));
 expect(continuousCombatFrame(battle,0).player.mana).toBe(95);
 expect(continuousCombatFrame(battle,0).player.casting).toBeNull();
 expect(continuousCombatFrame(battle,1).player.mana).toBe(90);
 const a=fighter('A',['ember']);a.health=5;a.statuses.moonfire=1;
 const dead=continuousCombatFrame(simulate(a,fighter('B',['splash'])),0);
 expect(dead.player.mana).toBe(100);expect(dead.player.casting).toBeNull();
});

it('keeps the final reshuffle tick visible instead of previewing a phantom cast',()=>{
 const battle=simulate(fighter('A',['wrath']),fighter('B',['sap']));
 // Each fighter has a different cast length, so their cycle boundaries differ.
 for(const side of ['player','bot'] as const) {
  const boundary=battle.frames.findIndex(f=>(f[side].reshuffleRemaining??0)>0);
  expect(boundary).toBeGreaterThan(0);
  for(let offset=0;offset<2;offset++) {
   const frame=continuousCombatFrame(battle,boundary+offset);
   expect(frame[side].reshuffleRemaining).toBe(2-offset);
   expect(frame[side].casting).toBeNull();
   expect(battle.frames[boundary+offset+1].events.filter(e=>e.side===side&&e.status==='cast')).toEqual([]);
  }
  const firstCast=continuousCombatFrame(battle,boundary+2)[side];
  expect(firstCast.reshuffleRemaining).toBe(0);
  expect(firstCast.casting?.index).toBe(0);
  const ticks=side==='player'?1:2;
  expect(firstCast.casting?.remaining).toBe(ticks);
  expect(battle.frames[boundary+2+ticks].events.filter(e=>e.side===side&&e.status==='cast')).toHaveLength(1);
 }
});