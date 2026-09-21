import { expect, it } from 'vitest';
import { fighter, simulate } from './engine';
import { castAt, castsAt } from './combatTimeline';
it('reads actual completion events and never invents casts during charging',()=>{
 const battle=simulate(fighter('A',['seed-shot']),fighter('B',['splash']));
 expect(castAt(battle,1,'player',1)).toBeNull();
 expect(castAt(battle,2,'player',2)?.spell).toBe('seed-shot');
 expect(castAt(battle,2,'player',1)).toBeNull();
 expect(castAt(battle,0,'player',3)).toBeNull();
});
it('retains every Instant completion in the same tick',()=>{
 const battle=simulate(fighter('A',['mist','rejuvenation']),fighter('B',['splash']));
 expect(castsAt(battle,1,'player',1).map(e=>e.spell)).toEqual(['mist','rejuvenation']);
});
