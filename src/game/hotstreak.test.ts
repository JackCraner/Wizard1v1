import { expect,it } from 'vitest';
import { fighter,simulate } from './engine';

it('grants Overheat, Hotstreak and Combust while losing half current health',()=>{
 const a=fighter('A',['overheat','pyroblast']);a.health=301;
 const b=fighter('B',['splash'],[{health:2000}]);
 const result=simulate(a,b);
 expect(result.frames[1].player.health).toBe(151);
 expect(result.frames[1].player.statuses).toEqual({overheat:15,hotstreak:5,combust:3});
 expect(result.frames[2].events.find(e=>e.side==='player')?.spell).toBe('pyroblast');
 expect(result.frames[2].player.health).toBe(146);
 expect(result.frames[2].player.statuses).toEqual({overheat:14,hotstreak:4,combust:2});
});
it('gives 10% crit per remaining stack and caps chance at 100%',()=>{
 for(const stacks of [10,20]) {
  const a=fighter('A',['ember']);a.statuses.hotstreak=stacks;
  const result=simulate(a,fighter('B',['splash']));
  expect(result.frames[1].events.find(e=>e.side==='player')?.critical).toBe(true);
  expect(result.frames[1].bot.health).toBe(410);
 }
 const a=fighter('A',['ember']);a.statuses.hotstreak=1;
 let crits=0;for(let seed=0;seed<1000;seed++)if(simulate(a,fighter('B',['splash']),seed*1009).frames[1].events.find(e=>e.side==='player')?.critical)crits++;
 expect(crits).toBeGreaterThan(70);expect(crits).toBeLessThan(130);
});
it('triggers on upward threshold crossings without consuming Hotstreak or retriggering above five',()=>{
 const a=fighter('A',['scorch']);a.statuses.hotstreak=4;
 const result=simulate(a,fighter('B',['splash']));
 expect(result.frames[1].player.statuses.hotstreak).toBe(4);
 expect(result.frames[1].player.statuses.combust).toBe(3);
 a.statuses.hotstreak=6;
 expect(simulate(a,fighter('B',['splash'])).frames[1].player.statuses.combust).toBeUndefined();
});
it('caps casts at one tick, expires normally, and leaves Instant casts unchanged',()=>{
 const a=fighter('A',['pyroblast']);a.statuses={combust:3,slowness:2};
 const result=simulate(a,fighter('B',['splash'],[{health:2000}]));
 expect(result.frames.slice(1,4).map(f=>f.player.health)).toEqual([495,490,485]);
 expect(result.frames[3].player.statuses.combust).toBeUndefined();
 expect(result.frames[4].player.casting?.remaining).toBe(4);
 const instant=fighter('A',['from-ash','wrath']);instant.statuses.combust=1;
 const frame=simulate(instant,fighter('B',['splash'])).frames[1];
 expect(frame.events.filter(e=>e.side==='player').map(e=>e.spell)).toEqual(['from-ash','wrath']);
 expect(frame.player.health).toBe(470); // 20 self + two Combust charges
});
it('does not charge skipped spells and lets Guard block Combust damage',()=>{
 const a=fighter('A',['pyroblast']);a.mana=0;a.statuses.combust=2;
 expect(simulate(a,fighter('B',['splash'])).frames[1].player.health).toBe(500);
 a.mana=100;a.statuses.guard=1;
 expect(simulate(a,fighter('B',['splash'])).frames[1].player.health).toBe(500);
});
