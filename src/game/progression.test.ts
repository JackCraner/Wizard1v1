import {expect,it} from 'vitest';
import {fighter,simulate} from './engine';

const idle=()=>fighter('B',['current']);
it('Ocean Heart and Tidal Power persist, spend the new threshold, and power multiple Echoes',()=>{
 const a=fighter('A',['ocean-heart','tidal-power','deluge','deluge','jet','jet'],[],[3,3,3,3,0,0]);
 const r=simulate(a,idle());
 expect(r.frames[2].player.memory.tidecallerThreshold).toBe(3);
 expect(r.frames[2].player.statuses.tidecaller??0).toBe(0);
 expect(r.frames[3].player.memory.echoPower).toBe(1.5);
 for(const tick of [6,7])expect(r.frames[tick].events.find(e=>e.side==='player')?.details).toContain('Echo 150%');
 expect(r.frames[6].player.statuses.tidecaller).toBe(5);
 expect(r.frames[7].player.statuses.tidecaller).toBe(2);
 expect(r.frames[7].bot.health).toBe(274);
 expect(r.frames[8].player.memory).toMatchObject({tidecallerThreshold:3,echoPower:1.5});
});
it('base Water capstones give a four-stack threshold and permanent full-strength Echoes',()=>{
 const a=fighter('A',['ocean-heart','tidal-power','current']);
 const r=simulate(a,idle());
 expect(r.frames[3].player.memory).toMatchObject({tidecallerThreshold:4,echoPower:1});
 expect(r.frames[10].player.memory).toMatchObject({tidecallerThreshold:4,echoPower:1});
});
it('Water capstones require attunement and cannot weaken stronger existing effects',()=>{
 const a=fighter('A',['ocean-heart','tidal-power']);a.attuned=[];
 const r=simulate(a,idle());
 expect(r.frames[3].player.memory.tidecallerThreshold).toBeUndefined();
 expect(r.frames[3].player.memory.echoPower).toBeUndefined();
 a.attuned=['water'];a.memory.tidecallerThreshold=3;a.memory.echoPower=1.5;
 expect(simulate(a,idle()).frames[3].player.memory).toMatchObject({tidecallerThreshold:3,echoPower:1.5});
});
it('Cycle of Life converts remaining healing, including Flourish, without an extra flat heal',()=>{
 for(const xp of [0,3]){
  const a=fighter('A',['flourish','cycle-of-life'],[],[3,xp]);a.health=1;a.statuses.regeneration=5;
  const f=simulate(a,idle()).frames[3];
  // 10 + 20 + 20 periodic healing, then six remaining boosted ticks.
  expect(f.player.health).toBe(51+6*20*(xp===3?2:1.5));
  expect(f.player.statuses.regeneration).toBeUndefined();
 }
});
it('Venom Bloom stacks with Super Poison and Astral Power scales from remaining Poison',()=>{
 const a=fighter('A',['venom-bloom'],['super-poison'],[3]);const b=idle();b.statuses.poison=5;
 expect(simulate(a,b).frames[2].bot.health).toBe(435);
 const c=idle();c.statuses.poison=5;
 const f=simulate(fighter('A',['astral-power'],[],[3]),c).frames[1];
 expect(f.bot.health).toBe(230); // 10 Poison, then 100 * (1 + 4 * .4).
});
it('Doomsday scales current or maximum Imp Health and only sacrifices once when Echoed',()=>{
 for(const xp of [0,3]){
  const a=fighter('A',['doomsday'],[],[xp]);a.imp={health:80,maxHealth:150,guard:0};a.statuses.tidecaller=5;
  const f=simulate(a,idle()).frames[1];
  expect(f.bot.health).toBe(xp===3?200:380);
  expect(f.player.imp?.health).toBe(0);
 }
});
it('upgraded Corrupt Ward removes protection before same-tick direct damage',()=>{
 const a=fighter('A',['corrupt-ward'],[],[3]);const b=fighter('B',['spark']);b.shield=200;
 const f=simulate(a,b).frames[1];
 expect(f.bot.shield).toBe(0);
 expect(f.events.find(e=>e.side==='player')?.details).toContain('Instant');
});
