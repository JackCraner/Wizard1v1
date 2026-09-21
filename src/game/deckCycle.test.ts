import { expect,it } from 'vitest';
import { fighter,simulate } from './engine';

it('waits two full ticks after the last card then repeats the same order',()=>{
 const b=simulate(fighter('A',['wrath','sap']),fighter('B',['splash']));
 expect(b.frames.slice(1,10).map(f=>f.events.filter(e=>e.side==='player').map(e=>e.spell))).toEqual([['wrath'],[],['sap'],[],[],['wrath'],[],['sap'],[]]);
 expect(b.frames.slice(3,6).map(f=>f.player.reshuffleRemaining)).toEqual([2,1,0]);
});
it('does not charge mana or pause statuses while reshuffling',()=>{
 const a=fighter('A',['moonfire']);a.health=300;a.statuses.growth=5;
 const b=simulate(a,fighter('B',['splash']));
 expect(b.frames.slice(1,5).map(f=>f.player.mana)).toEqual([95,95,95,90]);
 expect(b.frames.slice(1,5).map(f=>f.player.health)).toEqual([310,320,330,340]);
 expect(b.frames.slice(1,4).map(f=>f.bot.statuses.moonfire)).toEqual([5,4,3]);
});
it('reshuffles once an Instant chain or skipped last card empties the deck',()=>{
 const a=fighter('A',['mist','mist']);
 const b=simulate(a,fighter('B',['splash']));
 expect(b.frames.slice(1,5).map(f=>f.events.filter(e=>e.side==='player').length)).toEqual([2,0,0,2]);
 a.mana=0;
 const skipped=simulate(a,fighter('B',['splash']));
 expect(skipped.frames[2].player.reshuffleRemaining).toBe(2);
 expect(skipped.frames[3].events.filter(e=>e.side==='player')).toEqual([]);
 expect(skipped.frames[5].events.find(e=>e.side==='player')?.status).toBe('skipped');
});
it('lets the other fighter cast while one deck reshuffles',()=>{
 const b=simulate(fighter('A',['splash']),fighter('B',['wrath','wrath','wrath']));
 expect(b.frames[2].events.map(e=>e.side)).toEqual(['bot']);
 expect(b.frames[3].events.map(e=>e.side)).toEqual(['bot']);
});
it('records mana costs at cast start and actual restoration after capping',()=>{
 const a=fighter('A',['sap']);a.mana=99;
 const b=simulate(a,fighter('B',['splash']));
 expect(b.frames[1].manaEvents).toEqual([{side:'player',amount:-2,kind:'cost'}]);
 expect(b.frames[2].manaEvents).toEqual([{side:'player',amount:3,kind:'effect'}]);
 expect(b.frames[3].manaEvents).toEqual([]);
});
it('records both sides of a mana steal, caps the gain and records no zero changes',()=>{
 const a=fighter('A',['aqua-steal']),b=fighter('B',['splash']);b.mana=12;
 const frame=simulate(a,b).frames[2];
 expect(frame.manaEvents).toEqual([{side:'player',amount:5,kind:'effect'},{side:'bot',amount:-10,kind:'effect'}]);
 expect(frame.player.mana).toBe(100);expect(frame.bot.mana).toBe(7);
});

it('keeps a reshuffling fighter vulnerable while healing and all statuses age',()=>{
 const a=fighter('A',['splash']);a.health=300;a.statuses={growth:3,moonfire:3,fury:3};
 const battle=simulate(a,fighter('B',['wrath','wrath','wrath']));
 expect(battle.frames.slice(1,4).map(f=>f.player.health)).toEqual([280,260,240]);
 expect(battle.frames.slice(1,4).map(f=>f.player.reshuffleRemaining)).toEqual([2,1,0]);
 expect(battle.frames[2].player.statuses).toEqual({growth:1,moonfire:1,fury:1});
 expect(battle.frames[3].player.statuses).toEqual({});
 expect(battle.frames[2].damageEvents).toEqual(expect.arrayContaining([expect.objectContaining({side:'player',kind:'dot',amount:10}),expect.objectContaining({side:'player',kind:'hit',amount:20})]));
 expect(battle.frames[2].healingEvents).toContainEqual({side:'player',amount:10,kind:'hot'});
});
it('can be knocked out while reshuffling',()=>{
 const a=fighter('A',['splash']);a.health=30;
 const battle=simulate(a,fighter('B',['wrath','wrath']));
 expect(battle.frames.at(-1)?.tick).toBe(2);
 expect(battle.frames.at(-1)?.player.reshuffleRemaining).toBe(1);
 expect(battle.frames.at(-1)?.player.health).toBe(0);
 expect(battle.outcome).toBe('defeat');expect(battle.endReason).toBe('knockout');
});
