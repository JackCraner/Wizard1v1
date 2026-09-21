import { expect,it } from 'vitest';
import { fighter,simulate } from './engine';

it('records direct and periodic hits even when healing offsets health loss',()=>{
 const a=fighter('A',['regrowth']);a.health=200;a.statuses.moonfire=2;
 const frame=simulate(a,fighter('B',['wrath'])).frames[1];
 expect(frame.player.health).toBe(200);
 expect(frame.damageEvents?.filter(hit=>hit.side==='player')).toEqual([
  {side:'player',amount:10,critical:false,kind:'dot',domain:'nature'},
  {side:'player',amount:20,critical:false,kind:'hit',domain:'nature'},
 ]);
});
it('records crits and individual instant hits, without reporting blocked damage',()=>{
 const a=fighter('A',['mist','mist']);a.statuses.hotstreak=10;
 const b=fighter('B',['splash']);
 const result=simulate(a,b);
 expect(result.frames[1].damageEvents).toEqual([
  {side:'bot',amount:30,critical:true,kind:'hit',domain:'water'},
  {side:'bot',amount:30,critical:true,kind:'hit',domain:'water'},
 ]);
 b.statuses.guard=1;
 expect(simulate(a,b).frames[1].damageEvents).toEqual([]);
});
it('records lethal damage before Phoenix restores health and snapshots events independently',()=>{
 const a=fighter('A',['splash']);a.health=10;a.statuses.phoenix=2;
 const result=simulate(a,fighter('B',['wrath']));
 expect(result.frames[1].player.health).toBe(250);
 expect(result.frames[1].damageEvents?.[0].amount).toBe(20);
 expect(result.frames[0].damageEvents).toEqual([]);
 expect(result.frames[1].damageEvents).not.toBe(result.frames[2].damageEvents);
});
