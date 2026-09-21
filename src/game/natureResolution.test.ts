import {expect,it} from 'vitest';
import {fighter,simulate,PLAYABLE_SPELLS} from './engine';
it('enables clarified spells at both tiers',()=>{
 for(const id of ['renew','celestial-alignment','nettle-trap','lava-floor','eclipse','wild-growth']){
  expect(PLAYABLE_SPELLS).toContain(id);
  expect(()=>simulate(fighter('A',[id],[],[3]),fighter('B',['splash']))).not.toThrow();
 }
});
it('Renew heals the caster and gives five Growth to each fighter',()=>{
 const a=fighter('A',['renew']);a.health=200;const b=fighter('B',['splash']);b.health=200;
 const f=simulate(a,b).frames;
 expect(f[1].player.health).toBe(250);expect(f[1].bot.health).toBe(200);
 expect(f[1].player.statuses.growth).toBe(5);expect(f[1].bot.statuses.growth).toBe(5);
 expect(f[2].player.health).toBe(260);expect(f[2].bot.health).toBe(210);
});
it('Alignment is free, takes one tick and empowers only the next cast, even a long cast',()=>{
 for(const [xp,damage] of [[0,400],[3,600]]){
  const a=fighter('A',['celestial-alignment','pyroblast','wrath'],[],[xp,0,0]);
  const f=simulate(a,fighter('B',['splash'],[{health:1000}])).frames;
  expect(f[1].player.mana).toBe(100);expect(f[1].events[0].spell).toBe('celestial-alignment');
  expect(f[2].player.casting?.damageMultiplier).toBe(xp===3?3:2);
  expect(f[6].bot.health).toBe(1500-damage);expect(f[7].bot.health).toBe(1480-damage);
 }
});
it('Trap triggers at cast start once, including Instant, but never on skipped cards',()=>{
 const a=fighter('A',['seed-shot','mist']);a.statuses.trap=10;
 const f=simulate(a,fighter('B',['splash'])).frames;
 expect(f.slice(1,4).map(x=>x.player.health)).toEqual([490,490,480]);
 expect(f[1].tickStart?.player.health).toBe(490);
 a.mana=0;expect(simulate(a,fighter('B',['splash'])).frames[1].player.health).toBe(500);
});
it('Trap respects Guard and lethal traps stop spell resolution symmetrically',()=>{
 const a=fighter('A',['mist']);a.health=10;a.statuses.trap=4;
 const dead=simulate(a,a);expect(dead.outcome).toBe('draw');expect(dead.frames).toHaveLength(2);
 expect(dead.frames[1].events).toEqual([]);
 a.statuses.guard=1;expect(simulate(a,fighter('B',['splash'])).frames[1].player.health).toBe(10);
 a.statuses={trap:4,phoenix:1};expect(simulate(a,fighter('B',['splash'])).frames[1].player.health).toBe(250);
});
it('Eclipse detonates and consumes only remaining enemy DoTs after countdown',()=>{
 const a=fighter('A',['eclipse']);a.statuses.moonfire=4;
 const b=fighter('B',['splash']);b.statuses={moonfire:5,sunfire:3,growth:3,trap:3};
 const f=simulate(a,b).frames;
 expect(f[1].bot.health).toBe(390); // 30 periodic, heal capped by 10, Trap 10, then 80 remaining DoT damage.
 expect(f[1].bot.statuses.moonfire).toBeUndefined();expect(f[1].bot.statuses.sunfire).toBeUndefined();
 expect(f[1].bot.statuses.growth).toBe(2);expect(f[1].bot.statuses.trap).toBe(2);
 expect(f[1].player.statuses.moonfire).toBe(3);
 expect(f[2].damageEvents?.some(e=>e.side==='bot'&&e.kind==='dot')).toBe(false);
});
it('Instant Eclipse consumes DoTs before they can tick, and Guard still blocks damage',()=>{
 const a=fighter('A',['eclipse']);a.statuses['next-instant']=1;
 const b=fighter('B',['splash']);b.statuses={moonfire:5,sunfire:3};
 const f=simulate(a,b).frames[1];expect(f.bot.health).toBe(390);expect(f.damageEvents?.some(e=>e.kind==='dot')).toBe(false);
 b.statuses.guard=2;const guarded=simulate(a,b).frames[1];expect(guarded.bot.health).toBe(500);expect(guarded.bot.statuses.moonfire).toBeUndefined();
});
it('Overgrowth changes only own Growth to 30 and returns to 10 after expiration',()=>{
 const a=fighter('A',['splash']);a.health=100;a.statuses={growth:4,overgrowth:2,lifebloom:2};
 const b=fighter('B',['splash']);b.health=100;b.statuses.growth=4;
 const f=simulate(a,b).frames;
 expect(f.slice(1,4).map(x=>x.player.health)).toEqual([150,190,200]);
 expect(f.slice(1,4).map(x=>x.bot.health)).toEqual([110,120,130]);
 const wild=simulate(fighter('A',['wild-growth']),fighter('B',['splash'])).frames[2];
 expect(wild.player.statuses).toEqual({growth:5,overgrowth:25});
});
