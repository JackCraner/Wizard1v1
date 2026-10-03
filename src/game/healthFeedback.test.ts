import {expect,it} from 'vitest';
import {healthFeedback} from './healthFeedback';
import {fighter,simulate} from './engine';
import {continuousCombatFrame} from './playback';
import {combatNumberSize} from '../screens/combatNumberSize';
import type {CombatFrame} from './model';

it('retains Poison and Regeneration alongside many simultaneous spell hits without overlapping cells',()=>{
 const player=fighter('A',['spark','backdraft','radiance','current','leech','whirlpool']);
 const frame:CombatFrame={tick:1,player,bot:player,events:[],messages:[],damageEvents:[
  ...player.spells.map((_,index)=>({side:'player' as const,sourceSide:'bot' as const,sourceIndex:index,kind:'hit' as const,amount:20+index,critical:false})),
  {side:'player',kind:'dot',status:'poison',amount:10,critical:false}],healingEvents:[{side:'player',kind:'hot',amount:8}]};
 const receipts=healthFeedback(frame,'player');
 expect(receipts.find(r=>r.label==='Poison')).toMatchObject({amount:10,healing:false,start:0});
 expect(receipts.find(r=>r.label==='Regeneration')).toMatchObject({amount:8,healing:true,start:0});
 expect(receipts.reduce((n,r)=>n+r.amount,0)).toBe(153);
 for(let t=0;t<1;t+=.001){
  const active=receipts.filter(r=>r.start<=t&&r.end>t);
  expect(active.length).toBeLessThanOrEqual(4);
  expect(new Set(active.map(r=>r.slot)).size).toBe(active.length);
 }
});

it('records real poison ticks and actual regeneration healing on both sides',()=>{
 const a=fighter('A',['spark']),b=fighter('B',['spark']);
 for(const f of [a,b]){f.health=300;f.statuses.poison=4;f.statuses.regeneration=4;}
 const battle=simulate(a,b,20);
 const frame=continuousCombatFrame(battle,1);
 for(const side of ['player','bot'] as const){
  expect(frame.damageEvents?.some(e=>e.side===side&&e.status==='poison')).toBe(true);
  const feedback=healthFeedback(frame,side);
  expect(feedback.some(r=>r.label==='Poison'&&r.amount>0)).toBe(true);
  expect(feedback.some(r=>r.label==='Regeneration'&&r.amount>0)).toBe(true);
  expect(feedback.reduce((n,r)=>n+r.amount,0)).toBe([...(frame.damageEvents??[]),...(frame.healingEvents??[])].filter(e=>e.side===side).reduce((n,e)=>n+e.amount,0));
 }
});

it('scales large damage and healing numbers while keeping sizes within their cell',()=>{
 for(const compact of [true,false]){
  expect(combatNumberSize(100,compact)).toBeGreaterThan(combatNumberSize(10,compact));
  expect(combatNumberSize(1000,compact)).toBeGreaterThan(combatNumberSize(100,compact));
  expect(combatNumberSize(10000,compact,true)).toBeLessThanOrEqual(compact?26:32);
 }
});

it('shows a regeneration tick at full Health without inventing healing or triggering heal effects',()=>{
 const a=fighter('A',['ritual']),b=fighter('B',['ritual']);
 a.statuses.regeneration=2;
 const battle=simulate(a,b,23);
 const frame=continuousCombatFrame(battle,1);
 expect(healthFeedback(frame,'player').find(r=>r.label==='Regeneration')).toMatchObject({amount:0,healing:true});
 expect(frame.player.health).toBe(a.maxHealth);
 expect(frame.notices?.filter(n=>n.status==='trigger')??[]).toHaveLength(0);
});
