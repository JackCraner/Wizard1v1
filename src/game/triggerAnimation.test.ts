import {expect,it} from 'vitest';
import {dartNotices,triggerJumpDuration,triggerJumpProgress,triggerSchedule} from './triggerAnimation';
import {COMBAT_TICK_MS,nextPlaybackSpeed,PLAYBACK_CONFIG} from './playback';
import {fighter,simulate} from './engine';
import type {CombatFrame} from './model';

it('fits any number of non-overlapping jumps into one tick at every playback speed',()=>{
 for(const speed of PLAYBACK_CONFIG.speedMultipliers)for(const jumps of [1,2,3,6,12]){
  const duration=triggerJumpDuration(jumps,speed);
  expect(duration*jumps).toBeCloseTo(COMBAT_TICK_MS/speed);
  for(let step=0;step<100;step++){
   const progress=step/100;
   const active=Array.from({length:jumps},(_,i)=>triggerJumpProgress(progress,i,jumps)).filter(p=>p>=0&&p<1);
   expect(active).toHaveLength(1);
  }
  expect(triggerJumpProgress(1,jumps-1,jumps)).toBe(1);
 }
});
it('keeps causal notice order and excludes self/Cycle exclamation cues',()=>{
 const f=fighter('A',['healing-seed','backdraft','spark']);
 const frame:CombatFrame={tick:3,player:f,bot:f,events:[],messages:[],notices:[
  {side:'player',status:'trigger',text:'TRIGGER',index:0,origin:{side:'player',kind:'spell',index:2}},
  {side:'player',status:'trigger',text:'TRIGGER',index:1,origin:{side:'player',kind:'spell',index:0}},
  {side:'player',status:'trigger',text:'TRIGGER',index:1,origin:{side:'player',kind:'spell',index:1}},
  {side:'player',status:'trigger',text:'TRIGGER',index:0,origin:{side:'player',kind:'cycle'}},
  {side:'player',status:'retrigger',text:'RETRIGGER',index:2,targetIndex:1,origin:{side:'player',kind:'spell',index:2}},
 ]};
 expect(dartNotices(frame).map(n=>[n.origin?.index,n.targetIndex??n.index])).toEqual([[2,0],[0,1],[2,1]]);
});
it('cycles through half speed and all existing speeds while retaining the 1× default',()=>{
 expect(PLAYBACK_CONFIG.defaultSpeed).toBe(1);
 expect([.5,1,2,4].map(nextPlaybackSpeed)).toEqual([1,2,4,.5]);
 expect(triggerJumpDuration(3,.5)).toBe(triggerJumpDuration(3,1)*2);
});

it('branches concurrently, waits for parents, and runs separate chains independently',()=>{
 const f=fighter('A',['spark']);
 const notices=[
  {triggerId:1,triggerGroup:10,index:1,origin:{side:'player' as const,kind:'spell' as const,index:0}},
  {triggerId:2,triggerGroup:10,index:2,origin:{side:'player' as const,kind:'spell' as const,index:0}},
  {triggerId:3,parentTriggerId:1,triggerGroup:11,index:3,origin:{side:'player' as const,kind:'spell' as const,index:1}},
  // Same source card, but a separate event: must not invent a dependency.
  {triggerId:4,triggerGroup:12,index:4,origin:{side:'player' as const,kind:'spell' as const,index:1}},
 ].map(n=>({...n,side:'player' as const,status:'trigger',text:'TRIGGER'}));
 const schedule=triggerSchedule({tick:1,player:f,bot:f,events:[],messages:[],notices});
 expect(schedule.map(s=>[s.order,s.jumps])).toEqual([[0,2],[0,2],[1,2],[0,1]]);
 const active=(p:number)=>schedule.filter(s=>{const v=triggerJumpProgress(p,s.order,s.jumps);return v>=0&&v<1;}).map(s=>s.notice.triggerId);
 expect(active(.25)).toEqual([1,2,4]);
 expect(active(.75)).toEqual([3,4]);
 expect(active(1)).toEqual([]);
});

it('preserves true simulation parents and unique IDs across combat ticks',()=>{
 const a=fighter('A',['healing-seed','backdraft','healing-seed','radiance','spark']);
 a.maxHealth=10000;a.health=5000;
 a.memory.cards=Object.fromEntries([0,1,2,3].map(i=>[i,{armed:true}]));
 const idle={...fighter('Idle',['germination']),broken:[0]};
 const battle=simulate(a,idle);
 const notices=battle.frames[1].notices!.filter(n=>n.status==='trigger');
 expect(notices.map(n=>n.index)).toEqual([1,3,0,2]);
 expect(notices[0].triggerGroup).toBe(notices[1].triggerGroup);
 expect(notices.slice(2).map(n=>n.parentTriggerId)).toEqual([notices[0].triggerId,notices[0].triggerId]);
 expect(triggerSchedule(battle.frames[1]).map(s=>[s.order,s.jumps])).toEqual([[0,2],[0,2],[1,2],[1,2]]);
 const ids=battle.frames.flatMap(f=>(f.notices??[]).flatMap(n=>n.triggerId===undefined?[]:[n.triggerId]));
 expect(new Set(ids).size).toBe(ids.length);
});

it('keeps ancestry through self cues and treats an absent parent as a fresh root',()=>{
 const f=fighter('A',['spark']);
 const notices=[
  {triggerId:1,index:1,origin:{side:'player' as const,kind:'spell' as const,index:0}},
  {triggerId:2,parentTriggerId:1,index:1,origin:{side:'player' as const,kind:'spell' as const,index:1}},
  {triggerId:3,parentTriggerId:2,index:2,origin:{side:'player' as const,kind:'spell' as const,index:1}},
  {triggerId:4,parentTriggerId:99,index:3,origin:{side:'player' as const,kind:'imp' as const}},
 ].map(n=>({...n,side:'player' as const,status:'trigger',text:'TRIGGER'}));
 expect(triggerSchedule({tick:1,player:f,bot:f,events:[],messages:[],notices}).map(s=>[s.notice.triggerId,s.order,s.jumps]))
  .toEqual([[1,0,2],[3,1,2],[4,0,1]]);
});
