import { expect,it } from 'vitest';
import { fighter,simulate } from './engine';

it('shows only effective healing and hides full-health heals',()=>{
 const a=fighter('A',['regrowth']);a.health=490;
 const result=simulate(a,fighter('B',['splash']));
 expect(result.frames[1].healingEvents).toEqual([{side:'player',amount:10,kind:'heal'}]);
 expect(result.frames[2].healingEvents).toEqual([]);
 expect(result.frames[0].healingEvents).toEqual([]);
});
it('records healing over time independently of damage in the same tick',()=>{
 const a=fighter('A',['splash']);a.health=400;a.statuses.growth=2;
 const result=simulate(a,fighter('B',['wrath']));
 expect(result.frames[1].healingEvents).toEqual([{side:'player',amount:10,kind:'hot'}]);
 expect(result.frames[1].damageEvents?.[0].amount).toBe(20);
 expect(result.frames[1].player.health).toBe(390);
 expect(result.frames[3].healingEvents).toEqual([]);
});
