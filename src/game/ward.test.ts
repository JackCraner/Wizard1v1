import {expect,it} from 'vitest';
import {fighter,simulate} from './engine';

it('records Ward capacity and keeps it while the shield is damaged',()=>{
 const a=fighter('A',['barkskin','current']);
 const r=simulate(a,fighter('B',['char']));
 expect(r.frames[1].player.shield).toBe(10);
 expect(r.frames[1].player.wardCapacity).toBe(40);
 expect(r.frames[1].player.health).toBe(500);
 expect(r.frames[1].damageEvents?.filter(e=>e.side==='player')).toMatchObject([{target:'ward',amount:30}]);
});

it('splits a 60 damage hit into 40 Ward and 20 Health damage',()=>{
 const a=fighter('A',['current']);a.shield=40;
 const r=simulate(a,fighter('B',['penance'])).frames[1];
 expect(r.player.shield).toBe(0);expect(r.player.health).toBe(480);
 expect(r.damageEvents?.filter(e=>e.side==='player')).toMatchObject([{target:'ward',amount:40},{amount:20}]);
 expect(r.damageEvents?.filter(e=>e.side==='player'&&!e.target)).toHaveLength(1);
});

it('Poison, Curse and Trap damage Health without consuming Ward',()=>{
 for(const status of ['poison','curse','trap']) {
  const a=fighter('A',['current']);a.shield=40;a.statuses[status]=2;
  const r=simulate(a,fighter('B',['current']));
  const hit=r.frames.find(frame=>frame.damageEvents?.some(e=>e.side==='player'&&e.kind==='dot'))!;
  expect(hit.player.health).toBeLessThan(500);
  expect(hit.player.shield).toBe(40);
  expect(hit.damageEvents?.some(e=>e.target==='ward')).toBe(false);
 }
});

it('starts fresh Ward full without stacking weaker grants',()=>{
 const a=fighter('A',['barkskin']);a.shield=10;a.wardCapacity=75;
 expect(simulate(a,fighter('B',['current'])).frames[1].player).toMatchObject({shield:40,wardCapacity:40});
 a.shield=60;
 expect(simulate(a,fighter('B',['current'])).frames[1].player).toMatchObject({shield:60,wardCapacity:75});
});
