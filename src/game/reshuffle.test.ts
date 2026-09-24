import {expect,it} from 'vitest';
import {fighter,simulate} from './engine';
import {continuousCombatFrame,reshuffleDuration} from './playback';
it('presents one full reshuffle tick with no cast before the next cycle',()=>{const r=simulate(fighter('A',['spark']),fighter('B',['healing-seed']));expect(continuousCombatFrame(r,1).player.reshuffleRemaining).toBe(1);expect(r.frames[2].events.filter(e=>e.side==='player')).toHaveLength(0);expect(r.frames[3].events.some(e=>e.side==='player')).toBe(true);});
it('Reckless Loop still pays to skip the normal pause',()=>{const r=simulate(fighter('A',['spark'],['reckless-loop']),fighter('B',['healing-seed']));expect(r.frames[1].player.health).toBe(475);expect(r.frames[2].events.some(e=>e.side==='player')).toBe(true);});

it.each(['player','bot'] as const)('keeps the full cursed reshuffle duration when seeking on %s',side=>{
 const waiting=fighter('Waiting',['spark']);waiting.statuses.curse=1;
 const opponent=fighter('Curser',['healing-seed'],['cursed']);
 const battle=simulate(...(side==='player'?[waiting,opponent]:[opponent,waiting]) as [typeof waiting,typeof waiting]);
 const first=continuousCombatFrame(battle,1)[side];
 const second=continuousCombatFrame(battle,2)[side];
 expect(first.reshuffleRemaining).toBe(2);
 expect(second.reshuffleRemaining).toBe(1);
 expect(reshuffleDuration(battle,1,side,first)).toBe(2);
 expect(reshuffleDuration(battle,2,side,second)).toBe(2);
 expect(reshuffleDuration(battle,3,side,continuousCombatFrame(battle,3)[side])).toBe(0);
});

it('uses one tick for an ordinary reshuffle and none for a skipped one',()=>{
 for(const augments of [[],['reckless-loop']]){
  const battle=simulate(fighter('A',['spark'],augments),fighter('B',['healing-seed']));
  expect(reshuffleDuration(battle,1,'player',continuousCombatFrame(battle,1).player)).toBe(augments.length?0:1);
 }
});
