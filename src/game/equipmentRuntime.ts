import type {CardDefinition} from '../config/catalogue';
import statuses from '../config/statuses.json';
import {equipped,effectValue,effectCap,type ItemEffect} from './equipment';
import type {Fighter,ItemRuntimeState} from './model';

type Context={spell?:CardDefinition;self?:boolean;periodic?:boolean;reactive?:boolean;combust?:boolean};
type Hooks={mana:(f:Fighter,n:number)=>void;heal:(f:Fighter,n:number)=>void;status:(f:Fighter,id:string,n:number,source?:Fighter)=>void;damage:(f:Fighter,n:number,source:Fighter)=>void;notice:(f:Fighter,id:string,text:string)=>void};
const kind=(id:string)=>(statuses as Record<string,{kind:string}>)[id]?.kind;
const fresh=():ItemRuntimeState=>({started:0,slowStarted:0,completed:0,domains:{},used:{}});
export function equipmentRuntime(fighters:{player:Fighter;bot:Fighter},hooks:Hooks){
 let tick=0;
 const state=(f:Fighter)=>f.gearState??=fresh();
 const enemy=(f:Fighter)=>f===fighters.player?fighters.bot:fighters.player;
 const entries=(f:Fighter)=>equipped(f).flatMap(item=>item.effects.map((effect,i)=>({item,effect,key:item.id+':'+i})));
 const value=(e:ItemEffect,count:number)=>{const n=effectValue(e,count),cap=effectCap(e);return cap===undefined?n:Math.min(cap,n);};
 const sum=(f:Fighter,type:string)=>entries(f).filter(x=>x.effect.type===type).reduce((n,x)=>n+value(x.effect,x.item.stacks),0);
 const trigger=(f:Fighter,event:string,c:Context={})=>{
  if(f.health<=0)return;
  for(const {item,effect:e,key} of entries(f)){
   const type=e.type,s=state(f),n=value(e,item.stacks);
   const matches=event==='skip'&&type==='restore_mana_on_insufficient_mana_skip'||event==='oathComplete'&&type==='heal_on_oath_complete'||event==='guardBlock'&&type==='heal_when_guard_blocks_damage'||event==='hit'&&!c.self&&!c.periodic&&!c.reactive&&type==='retaliation_damage';
   if(!matches)continue;
   const token=key+(e.maxTriggersPerTick!==undefined?':tick'+tick:':cycle');
   const limit=e.maxTriggersPerTick??e.maxTriggersPerCycle;
   if(limit!==undefined&&(s.used[token]??0)>=limit)continue;
   if(limit!==undefined)s.used[token]=(s.used[token]??0)+1;
   if(type==='restore_mana_on_insufficient_mana_skip')hooks.mana(f,n);
   else if(type==='retaliation_damage')hooks.damage(enemy(f),n,f);
   else hooks.heal(f,n);
   hooks.notice(f,'item',item.name+' ×'+item.stacks);
  }
 };
 return {
  trigger,
  start(){for(const f of Object.values(fighters)){f.cycle=1;f.gearState=fresh();}},
  tick(n:number){tick=n;},
  critChance(f:Fighter){let n=sum(f,'crit_chance');for(const {effect:e,item} of entries(f))if(e.type==='crit_chance_below_health'&&f.health/f.maxHealth<e.healthThresholdPercent!/100||e.type==='crit_chance_while_status'&&f.statuses[e.status!])n+=value(e,item.stacks);return Math.max(0,Math.min(1,n/100));},
  // All applicable item percentages share one additive bucket, independent of
  // copy count and catalogue ordering. Spell/status multipliers apply outside it.
  damage(f:Fighter,domain:string,periodic:boolean,options:{status?:string;critical?:boolean;tidecaller?:boolean;bonus?:number;reactive?:boolean;direct?:boolean}={}){
   let n=options.bonus??0;
   for(const {effect:e,item} of entries(f)){
    const type=e.type,v=value(e,item.stacks),below=f.health/f.maxHealth<(e.healthThresholdPercent??0)/100;
    if(type==='damage_percent'||type===domain+'_damage_percent'||(!periodic||options.direct)&&!options.reactive&&type==='direct_damage_percent'||periodic&&type==='dot_damage_percent'||options.status&&type===options.status+'_damage_percent'||type==='damage_percent_below_health'&&below||type===domain+'_damage_percent_below_health'&&below||type==='damage_percent_while_status'&&f.statuses[e.status!]||type===domain+'_damage_percent_while_status'&&f.statuses[e.status!]||type==='critical_fire_damage_percent'&&domain==='fire'&&options.critical||type==='tidecaller_spell_damage_percent'&&options.tidecaller)n+=v;
    if(type==='damage_per_missing_health')n+=Math.floor(Math.max(0,f.maxHealth-f.health)/e.missingHealthInterval!)*v;
   }
   return Math.max(0,1+n/100);
  },
  healPower(f:Fighter,periodic=false,domain?:string){let n=sum(f,'healing_percent')+(periodic?sum(f,'hot_healing_percent'):0)+(domain?sum(f,domain+'_healing_percent'):0);for(const {item,effect:e} of entries(f))if(e.type==='healing_percent_while_status'&&f.statuses[e.status!])n+=value(e,item.stacks);return Math.max(0,1+n/100);},
  healReceived(f:Fighter){let n=sum(f,'healing_received_percent');for(const {item,effect:e} of entries(f))if(e.type==='healing_received_percent_while_status'&&f.statuses[e.status!])n+=value(e,item.stacks);return Math.max(0,1+n/100);},
  periodicFlat(f:Fighter,id:string){return sum(f,id+'_damage_flat');},
  hotFlat(f:Fighter,id:string){return id==='lifebloom'?sum(f,'lifebloom_healing_per_remaining_stack'):0;},
  manaBonus(f:Fighter,n:number,domain:string){return n>0&&domain==='water'?n+sum(f,'bonus_mana_from_water_mana_gain'):n;},
  status(source:Fighter,target:Fighter,id:string,n:number){
   if(id==='slowness'&&target!==source){const extra=sum(source,'bonus_consecration_on_slowness');if(extra)hooks.status(target,'consecration',extra,source);}return n;
  },
  receiveStatus(f:Fighter,id:string){if(id==='guard'){const n=sum(f,'heal_on_guard_gain');if(n)hooks.heal(f,n);}},
  startCast(f:Fighter,spell:CardDefinition,cost:number,duration:number,commit=false){
   const s=state(f);let reduction=0;
   for(const {item,effect:e,key} of entries(f)){
    if(e.type==='first_spell_cycle_mana_reduction'&&s.started===0)reduction+=value(e,item.stacks);
    if(e.type==='first_slow_spell_mana_reduction'&&(spell.castTicks??0)>=e.minimumPrintedCastTime!&&!s.used[key+':discount']){reduction+=value(e,item.stacks);if(commit)s.used[key+':discount']=1;}
   }
   if(commit){s.started++;if((spell.castTicks??0)>=2)s.slowStarted++;}
   return {cost:Math.max(0,cost-reduction),duration};
  },
  spellPower(f:Fighter,spell:CardDefinition){const s=state(f);return {damageBonus:(s.completed===0?sum(f,'first_spell_cycle_damage_percent'):0)+(spell.domain==='fire'&&!s.domains.fire?sum(f,'first_fire_spell_cycle_damage_percent'):0)};},
  complete(f:Fighter,spell:CardDefinition){
   const s=state(f);
   if(!s.domains[spell.domain]){
    if(spell.domain==='water'){const n=sum(f,'mana_after_first_water_spell_each_cycle');if(n)hooks.mana(f,n);}
    if(spell.domain==='holy'){const n=sum(f,'bonus_consecration_first_holy_spell_cycle');if(n)hooks.status(enemy(f),'consecration',n,f);}
   }
   s.completed++;s.domains[spell.domain]=(s.domains[spell.domain]??0)+1;
  },
  incoming(f:Fighter,amount:number,c:Context){
   let reduction=0,pct=0;const s=state(f);
   if(c.self)reduction+=sum(f,'reduce_self_damage_flat');
   const direct=!c.self&&!c.periodic&&!c.reactive;
   if(direct){
    if(Object.keys(f.statuses).some(id=>f.statuses[id]>0&&kind(id)==='hot'))pct+=sum(f,'direct_damage_reduction_while_hot_active');
    for(const {item,effect:e,key} of entries(f))if(e.type==='reduce_first_direct_hit_each_cycle'&&!s.used[key+':hit']){reduction+=value(e,item.stacks);s.used[key+':hit']=1;}
   }
   return Math.max(0,Math.round(amount*Math.max(0,1-pct/100)-reduction));
  },
  reshuffle(f:Fighter,normal:number){const n=sum(f,'mana_during_reshuffle');if(n&&f.health>0)hooks.mana(f,n);return normal;},
  penanceDamage(f:Fighter){return sum(f,'damage_during_enemy_consecration_extra_tick');},
  cycle(f:Fighter){f.cycle=(f.cycle??1)+1;f.gearState=fresh();if(f.health<=0)return;const mana=sum(f,'mana_after_reshuffle'),healing=sum(f,'heal_after_reshuffle');if(mana)hooks.mana(f,mana);if(healing)hooks.heal(f,healing);},
 };
}
