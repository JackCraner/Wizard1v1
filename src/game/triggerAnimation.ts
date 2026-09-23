import type {CombatFrame,CombatNotice} from './model';
import {COMBAT_TICK_MS} from './playback';

// Keep simulation order. Self/Cycle cues use the existing exclamation animation.
export const dartNotices=(frame:CombatFrame)=>(frame.notices??[]).filter(n=>
 n.origin&&n.index!==undefined&&(n.status==='trigger'||n.status==='retrigger')&&
 n.origin.kind!=='cycle'&&!(n.origin.kind==='spell'&&n.origin.side===n.side&&
 n.origin.index===(n.status==='retrigger'?n.targetIndex:n.index)));

export const triggerJumpDuration=(jumps:number,speed:number)=>COMBAT_TICK_MS/speed/Math.max(1,jumps);
export const triggerJumpProgress=(progress:number,index:number,jumps:number)=>progress*jumps-index;

/** Causal trees share a clock, not a queue: siblings fly together. Hidden self/cycle
 * cues keep their ancestry without consuming a dart hop. */
export function triggerSchedule(frame:CombatFrame){
 const notices=(frame.notices??[]).filter(n=>n.status==='trigger'||n.status==='retrigger');
 const visible=new Set(dartNotices(frame));
 const byId=new Map(notices.filter(n=>n.triggerId!==undefined).map(n=>[n.triggerId!,n]));
 const placement=new Map<CombatNotice,{root:unknown;order:number}>();
 const locate=(n:CombatNotice):{root:unknown;order:number}=>{
  const cached=placement.get(n);if(cached)return cached;
  const parent=n.parentTriggerId===undefined?undefined:byId.get(n.parentTriggerId);
  const previous=parent?locate(parent):undefined;
  const result={root:previous?.root??n.triggerGroup??n,order:(previous?.order??-1)+(visible.has(n)?1:0)};
  placement.set(n,result);return result;
 };
 const lengths=new Map<unknown,number>();
 for(const n of visible){const p=locate(n);lengths.set(p.root,Math.max(lengths.get(p.root)??0,p.order+1));}
 return [...visible].map(notice=>{const p=locate(notice);return {notice,order:p.order,jumps:lengths.get(p.root)!};});
}
