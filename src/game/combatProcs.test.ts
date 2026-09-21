import {expect,it} from 'vitest';
import {fighter,simulate} from './engine';
import {combatProcCues} from './combatProcs';
import {continuousCombatFrame} from './playback';

it('announces an actual Combust reduction at cast start for both sides',()=>{
 const a=fighter('A',['pyroblast']),b=fighter('B',['pyroblast']);
 a.statuses.combust=3;b.statuses.combust=3;
 const battle=simulate(a,b),start=continuousCombatFrame(battle,0);
 expect(combatProcCues(start)).toEqual([
  {side:'player',kind:'combust',text:'Pyroblast · 5T → 1T'},
  {side:'bot',kind:'combust',text:'Pyroblast · 5T → 1T'},
 ]);
 expect(battle.frames[1].events.filter(e=>e.status==='cast')).toHaveLength(2);
 expect(combatProcCues(continuousCombatFrame(battle,1))).toEqual([]);
});
it('does not show a speed cue for Instant, 1T, expired Combust or a mana skip',()=>{
 for(const [spell,stacks,mana] of [['mist',3,100],['ember',3,100],['pyroblast',1,100],['pyroblast',3,0]] as const){
  const a=fighter('A',[spell]);a.statuses.combust=stacks;a.mana=mana;
  expect(combatProcCues(continuousCombatFrame(simulate(a,fighter('B',['splash'])),0))).toEqual([]);
 }
});
it('shows Tidecaller only when a spell actually repeats, on either side',()=>{
 let repeats=0,singles=0;
 for(let seed=0;seed<60;seed++){
  const a=fighter('A',['tidal-burst']),b=fighter('B',['tidal-burst']);a.statuses.tide=10;b.statuses.tide=10;
  const battle=simulate(a,b,seed*1009),frame=continuousCombatFrame(battle,2);
  const cues=combatProcCues(frame);
  for(const event of frame.events){
   const found=cues.filter(c=>c.side===event.side&&c.kind==='tidecaller');
   expect(found).toHaveLength(event.repeats===2?1:0);
   if(event.repeats===2)repeats++;else singles++;
  }
 }
 expect(repeats).toBeGreaterThan(0);expect(singles).toBeGreaterThan(0);
});
