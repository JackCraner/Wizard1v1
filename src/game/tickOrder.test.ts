import { expect,it } from 'vitest';
import { fighter,simulate } from './engine';
import { continuousCombatFrame,presentedCombatFrame } from './playback';

it('resolves Instant before DoT and normal damage, without queuing its next card',()=>{
 const a=fighter('A',['mist','seed-shot']);a.mana=50;
 const b=fighter('B',['wrath']);b.statuses.moonfire=2;
 const battle=simulate(a,b),f=battle.frames[1];
 expect(f.damageEvents?.map(e=>e.kind)).toEqual(['hit','dot','hit']);
 expect(f.tickStart?.bot.health).toBe(470);
 expect(f.player.casting).toBeNull();expect(f.player.mana).toBe(45);
 expect(battle.frames[2].player.casting?.remaining).toBe(1);
 expect(battle.frames[2].player.mana).toBe(40);
 expect(battle.frames[3].events.find(e=>e.side==='player')?.spell).toBe('seed-shot');
});
it('uses final DoT and buff stacks for Instant criticals before they expire',()=>{
 const a=fighter('A',['starsurge']);a.statuses.overheat=1;
 const b=fighter('B',['splash']);b.statuses={moonfire:1,sunfire:1};
 const f=simulate(a,b).frames[1];
 expect(f.events[0].critMultiplier).toBe(2);expect(f.bot.health).toBe(340);
 expect(f.player.statuses).toEqual({});expect(f.bot.statuses).toEqual({});
 const normal=fighter('A',['lunar-strike']);normal.casting={spell:'lunar-strike',index:0,remaining:1,mana:5,tidecaller:false};
 expect(simulate(normal,b).frames[1].events.find(e=>e.side==='player')?.critical).toBe(false);
});
it('ends on lethal DoT before healing, but allows Instant healing first',()=>{
 const a=fighter('A',['splash']);a.health=5;a.statuses={moonfire:1,growth:2};
 const dead=simulate(a,fighter('B',['splash']));
 expect(dead.frames).toHaveLength(2);expect(dead.frames[1].player.health).toBe(0);
 expect(dead.frames[1].healingEvents).toEqual([]);expect(dead.frames[1].events).toEqual([]);
 a.spells=['rejuvenation'];
 const saved=simulate(a,fighter('B',['splash'])).frames[1];
 expect(saved.player.health).toBe(55);
 expect(saved.healingEvents?.map(e=>e.kind)).toEqual(['heal','hot']);
});
it('processes Instant-applied DoTs immediately and ages them exactly once',()=>{
 const a=fighter('A',['moonfire']);a.statuses['next-instant']=1;
 const f=simulate(a,fighter('B',['splash'])).frames[1];
 expect(f.bot.health).toBe(490);expect(f.bot.statuses.moonfire).toBe(4);
 expect(f.tickStart?.events[0].spell).toBe('moonfire');
});
it('resolves both Instant knockouts together and stops later phases',()=>{
 const a=fighter('A',['mist']);a.health=20;a.statuses.growth=3;
 const battle=simulate(a,a);
 expect(battle.outcome).toBe('draw');expect(battle.frames).toHaveLength(2);
 expect(battle.frames[1].events).toHaveLength(2);expect(battle.frames[1].healingEvents).toEqual([]);
});
it('presents each Instant once at tick start and waits until the next tick to peel again',()=>{
 const b=simulate(fighter('A',['mist','mist']),fighter('B',['splash']));
 expect(continuousCombatFrame(b,0).events.map(e=>e.spell)).toEqual(['mist']);
 expect(presentedCombatFrame(b,1,'hold').events.map(e=>e.spell)).toEqual(['splash']);
 expect(continuousCombatFrame(b,1).events.map(e=>e.spell)).toEqual(['splash','mist']);
 expect(continuousCombatFrame(b,2).events).toEqual([]);
});
