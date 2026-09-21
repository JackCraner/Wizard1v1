import {expect,it} from 'vitest';
import {fighter,simulate,PLAYABLE_SPELLS} from './engine';

it('enables all newly defined base spells',()=>{
 for(const id of ['mistveil','tsunami','rainborn','maelstrom','monsoon','cloud-heart','eruption','sear','flamewave','immolate','firekick','flashfire'])expect(PLAYABLE_SPELLS).toContain(id);
});
it('Veil halves damage and restores mana per spell, not per DoT tick',()=>{
 const p=fighter('A',['pyroblast']);p.statuses={veil:5,moonfire:3};p.mana=50;
 const b=simulate(p,fighter('B',['wrath']));
 expect(b.frames[1].player.health).toBe(485);
 expect(b.frames[1].player.mana).toBe(45); // 50 - 10 cast cost + 5 hit
 expect(b.frames[1].damageEvents?.filter(e=>e.side==='player').map(e=>e.amount)).toEqual([5,10]);
 expect(b.frames[2].player.mana).toBe(45); // reshuffling enemy; DoT grants no mana
});
it('Tsunami pays half current mana rounded down at cast start and uses that amount on resolution',()=>{
 const p=fighter('A',['tsunami']);p.mana=51;
 const b=simulate(p,fighter('B',['splash']));
 expect(b.frames[1].player.mana).toBe(26);expect(b.frames[1].bot.health).toBe(500);
 expect(b.frames[2].bot.health).toBe(475);
});
it('Rainborn heals 20 per rain tick and Monsoon restores 5, including the last stack',()=>{
 const p=fighter('A',['pyroblast']);p.health=200;p.mana=30;p.statuses={rain:2};p.enhancements={rainborn:20,monsoon:5};
 const b=simulate(p,fighter('B',['splash']));
 expect(b.frames[1].player.health).toBe(220);expect(b.frames[1].player.mana).toBe(25);
 expect(b.frames[2].player.health).toBe(240);expect(b.frames[2].player.mana).toBe(30);
 expect(b.frames[3].player.health).toBe(240);expect(b.frames[3].player.mana).toBe(30);
});
it('Rainborn, Monsoon and Maelstrom enable their combat-long upgrades',()=>{
 const b=simulate(fighter('A',['rainborn','monsoon','maelstrom']),fighter('B',['splash']));
 expect(b.frames[2].player.enhancements?.rainborn).toBe(20);
 expect(b.frames[3].player.enhancements?.monsoon).toBe(5);
 expect(b.frames[6].player.enhancements?.maelstrom).toBe(1);
});
it('Tide does not count down under Maelstrom but double casts consume up to 5 stacks',()=>{
 for(const stacks of [3,8]) {
  let triggered=false;
  for(let seed=1;seed<1000&&!triggered;seed++){
   const p=fighter('A',['tidal-burst']);p.statuses={tide:stacks};p.enhancements={maelstrom:1};
   const b=simulate(p,fighter('B',['splash']),seed);
   expect(b.frames[1].player.statuses.tide).toBe(stacks);
   if(b.frames[2].events.find(e=>e.side==='player')?.repeats===2){expect(b.frames[2].player.statuses.tide??0).toBe(Math.max(0,stacks-5));triggered=true;}
  }
  expect(triggered).toBe(true);
 }
});
it('Cloud Heart lasts 25 ticks, costs 10 mana and increases HoT healing',()=>{
 const p=fighter('A',['cloud-heart']);p.health=100;p.statuses={growth:4};
 const b=simulate(p,fighter('B',['splash']));
 expect(b.frames[1].player.mana).toBe(90);expect(b.frames[1].player.statuses['cloud-heart']).toBe(25);
 expect(b.frames[2].player.health-b.frames[1].player.health).toBe(14);
 expect(b.frames[2].player.statuses['cloud-heart']).toBe(24);
});
it('Burn deals ten times its remaining stack count and self-applied Burn uses the caster',()=>{
 const p=fighter('A',['pyroblast']);p.statuses={burn:3};
 const b=simulate(p,fighter('B',['splash']));
 expect(b.frames.slice(1,4).map(f=>f.damageEvents?.find(e=>e.kind==='dot')?.amount)).toEqual([30,20,10]);
 const self=fighter('A',['immolate']);self.statuses={eruption:10,hotstreak:20};
 const result=simulate(self,fighter('B',['splash']));
 expect(result.frames[4].damageEvents?.find(e=>e.kind==='dot'&&e.side==='player')?.critical).toBe(true);
});
it('Eruption uses current crit chance before stacks count down',()=>{
 const p=fighter('A',['flashfire']);p.spellXp=[3];p.statuses={eruption:5,hotstreak:10};
 const bot=fighter('B',['splash']);bot.statuses={burn:3};
 const b=simulate(p,bot);
 expect(b.frames[1].damageEvents?.find(e=>e.kind==='dot')?.critical).toBe(true);
 expect(b.frames[1].damageEvents?.find(e=>e.kind==='dot')?.amount).toBe(45);
});
it('Interrupt skips an ongoing spell with no refund and resumes with the following card',()=>{
 const b=simulate(fighter('A',['firekick']),fighter('B',['pyroblast','wrath']));
 expect(b.frames[2].bot.mana).toBe(90);expect(b.frames[2].bot.casting).toBeNull();expect(b.frames[2].bot.cursor).toBe(1);
 expect(b.frames[2].events).toContainEqual(expect.objectContaining({side:'bot',spell:'pyroblast',status:'skipped',mana:10}));
 expect(b.frames[3].events).toContainEqual(expect.objectContaining({side:'bot',spell:'wrath',status:'cast'}));
});
it('Flashfire consumes remaining Burn on both fighters and grants matching stacks',()=>{
 const p=fighter('A',['flashfire']);p.statuses={burn:4};const bot=fighter('B',['splash']);bot.statuses={burn:5};
 const b=simulate(p,bot);const f=b.frames[1]; // periodic ticks remove one stack from each before the normal cast
 expect(f.player.statuses.burn).toBeUndefined();expect(f.bot.statuses.burn).toBeUndefined();
 expect(f.player.statuses.hotstreak).toBe(7);expect(f.player.statuses.fury).toBe(7);expect(f.player.statuses.combust).toBe(3);
});

it('Instant Hotstreak gains do not change the crit chance sampled for this tick',()=>{
 const p=fighter('A',['cinder']);p.spellXp=[3];p.statuses={eruption:5,'next-instant':2};
 const bot=fighter('B',['splash']);bot.statuses={moonfire:3};
 const b=simulate(p,bot,1);
 expect(b.frames[1].damageEvents?.find(e=>e.kind==='dot')?.critical).toBe(false);
});
it('An Instant interrupt prevents another spell starting on the same tick',()=>{
 const p=fighter('A',['firekick']);p.statuses={'next-instant':2};
 const bot=fighter('B',['pyroblast','wrath']);bot.mana=90;bot.casting={spell:'pyroblast',index:0,remaining:3,totalTicks:5,mana:10,tidecaller:false};
 const b=simulate(p,bot);
 expect(b.frames[1].events.filter(e=>e.side==='bot').map(e=>e.status)).toEqual(['skipped']);
 expect(b.frames[1].bot.mana).toBe(90);expect(b.frames[1].bot.cursor).toBe(1);
 expect(b.frames[2].events).toContainEqual(expect.objectContaining({side:'bot',spell:'wrath',status:'cast'}));
});
