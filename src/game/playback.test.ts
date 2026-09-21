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
