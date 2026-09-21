import {CARD_BY_ID,type CardDefinition} from '../config/catalogue';
import statuses from '../config/statuses.json';
import {equipped,type Ability} from './equipment';
import type {Equipment,Fighter} from './model';
type Context={spell?:CardDefinition;amount?:number;status?:string;target?:Fighter;cost?:number;instant?:boolean;eligibleTide?:boolean;self?:boolean;periodic?:boolean;combust?:boolean};
type Hooks={mana:(f:Fighter,n:number)=>void;heal:(f:Fighter,n:number)=>void;status:(f:Fighter,id:string,n:number,source?:Fighter)=>void;damage:(f:Fighter,n:number,source:Fighter)=>void;cleanse:(f:Fighter)=>void;notice:(f:Fighter,id:string,text:string)=>void};
const key=(s:string)=>s.toLowerCase().replace(/ /g,'-');
const kind=(id:string)=>(statuses as Record<string,{kind:string}>)[id]?.kind;
const damaging=(s?:CardDefinition)=>!!s?.combat?.effects?.some(e=>['damage','bothDamage','consumeDots'].includes(e.kind)||e.kind==='status'&&kind(e.status!)==='dot');
const direct=(s?:CardDefinition)=>!!s?.combat?.effects?.some(e=>['damage','bothDamage','consumeDots'].includes(e.kind));
const healing=(s?:CardDefinition)=>!!s?.combat?.effects?.some(e=>e.kind==='heal'||e.kind==='status'&&kind(e.status!)==='hot');
export function equipmentRuntime(fighters:{player:Fighter;bot:Fighter},hooks:Hooks){
 let tick=0;
 const state=(f:Fighter)=>f.gearState??={used:{},completed:0,slow:0,spent:0,cycles:0};
 const enemy=(f:Fighter)=>f===fighters.player?fighters.bot:fighters.player;
 const scope=(a:Ability)=>a.oncePer??(a.trigger.includes('combat')?'combat':a.trigger.includes('each_tick')?'tick':a.trigger.includes('each_cycle')||a.trigger.includes('after_reshuffle')||a.trigger==='consume_burn'?'cycle':null);
 const token=(f:Fighter,e:Equipment)=>e.id+':'+(scope(e.ability!)==='combat'?'combat':scope(e.ability!)==='tick'?'tick'+tick:'cycle'+(f.cycle??1));
 const condition=(f:Fighter,a:Ability,c:Context)=>{
  const t=a.trigger;
  if(t==='passive')return true;
  if(t==='exactly_two_domains'||t==='single_domain_deck')return new Set(f.spells.map(id=>CARD_BY_ID[id].domain)).size===(t==='single_domain_deck'?1:2);
  if(t==='while_below_health_pct')return f.health/f.maxHealth<a.thresholdPct/100;
  if(t==='target_below_health_pct')return enemy(f).health/enemy(f).maxHealth<a.thresholdPct/100;
  if(t.startsWith('while_')){const id=t==='while_self_has_burn'?'burn':t.replace('while_','').replace('_active','');return !!f.statuses[id];}
  return false;
 };
 const matches=(f:Fighter,a:Ability,event:string,c:Context)=>{
  const t=a.trigger,s=state(f),spell=c.spell;
  if(condition(f,a,c))return true;
  if(t.startsWith('while_')||t==='passive'||t==='target_below_health_pct'||t.endsWith('_domain_deck')||t==='exactly_two_domains')return false;
  if(event==='start'||event==='spell'){
   if(t==='first_fire_spell_each_cycle')return spell?.domain==='fire';
   if(t==='first_water_spell_each_cycle')return spell?.domain==='water'&&(a.effect!=='guarantee_tidecaller'||c.eligibleTide);
   if(t==='first_water_spell_after_reshuffle')return s.cycles>0&&spell?.domain==='water';
   if(t==='first_spell_after_reshuffle')return s.cycles>0;
   if(t==='first_spell_combat')return (spell?.castTicks??0)>0;
   if(t==='first_slow_spell_each_cycle')return (spell?.castTicks??0)>=2;
   if(t==='every_n_slow_spells')return (spell?.castTicks??0)>=2&&(s.slow+1)%a.every===0;
   if(t==='first_direct_damage_spell_each_cycle')return direct(spell);
   if(t==='first_expensive_spell_each_cycle')return (c.cost??0)>=a.thresholdMana;
   if(t==='first_eligible_water_spell_each_cycle')return spell?.domain==='water'&&c.eligibleTide;
   if(t==='every_n_completed_spells')return (s.completed+1)%a.every===0;
   const previous=s.previous?CARD_BY_ID[s.previous]:undefined;
   if(t==='same_domain_as_previous_spell')return !!previous&&previous.domain===spell?.domain;
   if(t==='domain_changes_between_spells')return !!previous&&previous.domain!==spell?.domain;
   if(t==='second_consecutive_water_spell')return spell?.domain==='water'&&s.waterRun===1;
   if(t==='alternate_cast_time_classes')return !!previous&&(previous.castTicks??0)<=1&&(spell?.castTicks??0)>=2;
   if(t==='alternate_damage_and_healing_spells')return damaging(previous)&&healing(spell)||healing(previous)&&damaging(spell);
  }
  if(event==='status'){
   if(t==='first_dot_application_each_cycle')return kind(c.status!)==='dot';
   if(t==='first_hot_application_each_cycle')return kind(c.status!)==='hot';
   if(t==='first_periodic_application_each_cycle')return ['dot','hot'].includes(kind(c.status!));
   if(t==='apply_many_dot_stacks')return kind(c.status!)==='dot'&&(c.amount??0)>=a.threshold;
  }
  if(event==='receiveStatus'){
   if(t==='first_debuff_each_cycle')return ['dot','debuff'].includes(kind(c.status!));
   if(t==='first_slowness_each_cycle')return c.status==='slowness';
   if(t==='when_self_burn_applied')return c.status==='burn';
   if(t==='reach_hotstreak_threshold')return c.status==='hotstreak'&&(f.statuses.hotstreak??0)>=a.threshold;
  }
  if(event==='heal')return ['first_heal_each_tick','first_heal_each_cycle'].includes(t)||t==='first_heal_above_threshold_each_cycle'&&(c.amount??0)>=a.threshold;
  if(event==='crit')return t==='on_crit'||t==='first_crit_each_cycle';
  if(event==='tide')return ['on_tidecaller','after_tidecaller','first_tidecaller_each_cycle'].includes(t)&&(!a.domain||spell?.domain===a.domain);
  if(event==='dot')return t==='first_dot_tick_each_cycle';
  if(event==='hit')return t==='first_direct_hit_each_cycle'&&!c.periodic&&!c.self||t==='on_direct_spell_damage_received'&&!c.periodic&&!c.self||t==='first_self_damage_each_cycle'&&!!c.self;
  if(event==='health')return (t==='first_time_below_health_pct_combat'||t==='first_time_below_health_pct_each_cycle')&&f.health/f.maxHealth<a.thresholdPct/100;
  if(event==='skip')return ['on_unaffordable_skip','first_unaffordable_skip_each_cycle'].includes(t);
  if(event==='cycle')return t==='after_reshuffle'||t==='every_n_completed_cycles'&&s.cycles%a.every===0;
  if(event==='tick')return t==='fixed_ticks'&&a.ticks.includes(tick);
  if(event==='reshuffle')return t==='first_reshuffle_combat';
  if(event==='interruptReceived')return ['first_interrupt_received_combat','after_interrupt_received'].includes(t);
  const exact:Record<string,string>={combat:'combat_start',phoenix:'after_phoenix_revive',enemyReshuffle:'opponent_begins_reshuffle',interrupt:'opponent_interrupted',healthCost:'spend_health_from_explicit_cost',burnConsumed:'consume_burn',dotsConsumed:'consume_enemy_dot_stacks',overheal:'on_excess_healing',overflow:'on_mana_overflow',instant:'after_instant_spell'};
  if(event==='spent')return t==='spend_mana_threshold_each_cycle'&&s.spent>=a.thresholdMana;
  return t===exact[event];
 };
 const select=(f:Fighter,effects:string[],event:string,c:Context={},consume=true)=>equipped(f).filter(e=>{
  const a=e.ability;if(!a||!effects.includes(a.effect)||!matches(f,a,event,c)||scope(a)&&state(f).used[token(f,e)])return false;
  if(['domain_mana_cost_reduction','domain_damage_multiplier'].includes(a.effect)&&c.spell?.domain!==a.domain)return false;
  if(consume&&scope(a))state(f).used[token(f,e)]=true;return true;
 });
 const sum=(f:Fighter,effects:string[],event:string,c:Context={},field='valuePct',consume=false)=>select(f,effects,event,c,consume).reduce((n,e)=>n+(e.ability![field]??0),0);
 const stats=(f:Fighter,field:string)=>equipped(f).reduce((n,e)=>n+((e.stats as any)[field]??0),0)+sum(f,['single_domain_stat_bonus','two_domain_stat_bonus'],'passive',{},field);
 const ward=(f:Fighter,n:number)=>{if(n>0){f.shield+=Math.round(n);hooks.notice(f,'ward','+'+Math.round(n)+' Ward');}};
 const execute=(f:Fighter,e:Equipment,c:Context)=>{
  const a=e.ability!,s=state(f),effect=a.effect;
  if(effect==='restore_mana')hooks.mana(f,a.value);
  else if(['grant_status','grant_status_on_ticks','apply_status','self_apply_status_on_crit'].includes(effect))hooks.status(a.target==='opponent'?enemy(f):f,key(a.status),a.stacks,f);
  else if(effect==='gain_ward'||effect==='gain_ward_on_ticks')ward(f,a.value);
  else if(effect==='gain_ward_from_max_health')ward(f,f.maxHealth*a.valuePct/100);
  else if(effect==='restore_mana_and_gain_ward'){hooks.mana(f,a.mana);ward(f,a.ward);}
  else if(effect==='conditional_gain_ward'){if(f.statuses.growth||f.statuses.lifebloom)ward(f,a.value);}
  else if(effect==='heal_and_gain_ward'){if(Object.keys(f.statuses).some(id=>kind(id)==='hot')){hooks.heal(f,a.heal);ward(f,a.ward);}}
  else if(effect==='cleanse_random')hooks.cleanse(f);
  else if(effect==='extend_status_group'){for(const id of Object.keys(f.statuses))if(kind(id)==='hot')f.statuses[id]+=a.stacks;}
  else if(effect==='next_spell_mana_reduction'){const field=a.trigger==='after_instant_spell'?'nextNormalMana':'nextMana';s[field]=(s[field]??0)+a.value;}
  else if(effect==='next_domain_spell_mana_reduction')s.nextWaterMana=(s.nextWaterMana??0)+a.value;
  else if(effect==='next_spell_cast_time_reduction')s.nextTicks=(s.nextTicks??0)+a.ticks;
  else if(effect==='next_spell_tempo_and_cost'){s.nextTicks=(s.nextTicks??0)+a.ticks;s.nextMana=(s.nextMana??0)+a.manaReduction;}
  else if(effect==='set_next_spell_ticks')s.nextMaxTicks=a.value;
  else if(effect==='next_direct_damage_multiplier')s.nextDamage=(s.nextDamage??0)+a.valuePct;
  else if(effect==='convergence_charges')s.convergence=Math.min(a.maxCharges,(s.convergence??0)+1);
  else if(effect==='restore_mana_per_consumed_stack'){
   const token=e.id+':cast'+s.completed,used=s[token]??0,n=Math.min(a.cap-used,(c.amount??0)*a.valuePerStack);s[token]=used+n;hooks.mana(f,n);
  }
  else if(effect==='crit_tradeoff')hooks.damage(f,a.selfDamage,f);
  else if(effect==='retaliate_damage')hooks.damage(enemy(f),a.value,f);
 };
 const actionEffects=['restore_mana','grant_status','grant_status_on_ticks','apply_status','self_apply_status_on_crit','gain_ward','gain_ward_on_ticks','gain_ward_from_max_health','restore_mana_and_gain_ward','conditional_gain_ward','heal_and_gain_ward','cleanse_random','extend_status_group','next_spell_mana_reduction','next_domain_spell_mana_reduction','next_spell_cast_time_reduction','next_spell_tempo_and_cost','set_next_spell_ticks','next_direct_damage_multiplier','convergence_charges','restore_mana_per_consumed_stack','crit_tradeoff','retaliate_damage'];
 const trigger=(f:Fighter,event:string,c:Context={})=>{for(const e of select(f,actionEffects,event,c))execute(f,e,c);};
 const overflow=(f:Fighter,amount:number,event:'overheal'|'overflow')=>{
  for(const e of select(f,[event==='overheal'?'overheal_to_ward':'mana_overflow_to_ward'],event,{},false)){
   const k=e.id+':cap'+(f.cycle??1),s=state(f),n=Math.max(0,Math.min(amount,e.ability!.capPerCycle-(s[k]??0)));s[k]=(s[k]??0)+n;ward(f,n);
  }
 };
 return {
  stats,ward,trigger,overflow,
  start(){for(const f of Object.values(fighters)){f.cycle=1;state(f);ward(f,stats(f,'startingWard'));trigger(f,'combat');}},
  tick(n:number){tick=n;for(const f of Object.values(fighters))trigger(f,'tick');},
  critChance(f:Fighter){return stats(f,'critChancePct')/100;},
  critPower(f:Fighter){return (stats(f,'critPowerBonusPct')+sum(f,['crit_power_bonus'],'passive',{},'valuePctPoints'))/100;},
  damage(f:Fighter,domain:string,periodic:boolean){return 1+(periodic?sum(f,['dot_damage_multiplier'],'passive'):stats(f,'spellPowerPct')+sum(f,['spell_power_bonus','damage_multiplier'],'passive')+sum(f,['domain_damage_multiplier'],'passive',{spell:{domain} as CardDefinition}))/100;},
  healPower(f:Fighter){return 1+stats(f,'restorationPct')/100;},
  healReceived(f:Fighter){return 1+sum(f,['healing_received_multiplier'],'passive')/100;},
  healBonus(f:Fighter,n:number){return n+sum(f,['flat_heal_bonus'],'heal',{amount:n},'value',true);},
  onHeal(f:Fighter,n:number){if(n>0)trigger(f,'heal',{amount:n});},
  periodic(f:Fighter,amount:number){return amount+sum(f,['flat_periodic_damage_bonus'],'dot',{},'value',true);},
  growth(f:Fighter){const n=sum(f,['growth_restores_mana'],'passive',{},'value');if(n)hooks.mana(f,n);},
  veilMana(f:Fighter){return equipped(f).reduce((n,e)=>n+(e.ability?.effect==='veil_mana_bonus'?e.ability.value:0),0);},
  status(source:Fighter,target:Fighter,id:string,n:number){
   const c={status:id,amount:n,target};
   for(const e of select(source,['bonus_status_stacks','bonus_periodic_stacks_and_ward'],'status',c)){
    const a=e.ability!;n+=a.stacks;if(a.ward)ward(source,a.ward);
   }
   const reduction=sum(target,['debuff_duration_reduction'],'receiveStatus',c,'stacks',true);if(reduction)n=Math.max(1,n-reduction);
   n-=sum(target,['reduce_status_stacks'],'receiveStatus',c,'stacks',true);
   trigger(source,'status',{...c,amount:n});return Math.max(0,n);
  },
  receiveStatus(f:Fighter,id:string){trigger(f,'receiveStatus',{status:id});},
  startCast(f:Fighter,spell:CardDefinition,cost:number,duration:number,commit=false){
   const c={spell,cost},s=state(f);
   let mana=cost-(duration>0?s.nextNormalMana??0:0)-sum(f,['mana_cost_reduction','domain_mana_cost_reduction'],'start',c,'value',commit)-(s.nextMana??0)-(spell.domain==='water'?s.nextWaterMana??0:0);
   let ticks=duration;
   if(ticks>0)ticks=Math.max(1,ticks-sum(f,['cast_time_reduction','periodic_cast_time_reduction'],'start',c,'ticks',commit)-(s.nextTicks??0));
   if(s.nextMaxTicks!==undefined)ticks=Math.min(ticks,s.nextMaxTicks);
   for(const e of select(f,['make_instant_and_modify_cost'],'start',c,commit)){ticks=0;mana+=e.ability!.manaDelta;}
   if(commit){if(duration>0)s.nextNormalMana=0;s.nextMana=0;if(spell.domain==='water')s.nextWaterMana=0;s.nextTicks=0;delete s.nextMaxTicks;s.spent+=Math.max(0,mana);trigger(f,'spent',c);}
   return {cost:Math.max(0,mana),duration:ticks};
  },
  spellPower(f:Fighter,spell:CardDefinition){
   const s=state(f),damage=direct(spell)?s.nextDamage??0:0;if(direct(spell))s.nextDamage=0;
   
   // Convergence is consumed by this spell; domain-change charges are earned on completion.
   const convergencePower=(s.convergence??0)*equipped(f).filter(e=>e.ability?.effect==='convergence_charges').reduce((n,e)=>n+e.ability!.valuePctPerCharge,0);s.convergence=0;
   const common=sum(f,['spell_power_multiplier'],'spell',{spell},'valuePct',true)+convergencePower;
   return {damage:1+(common+damage+sum(f,['damage_multiplier'],'spell',{spell},'valuePct',true)-sum(f,['damage_multiplier'],'passive'))/100,healing:1+common/100};
  },
  complete(f:Fighter,spell:CardDefinition,instant:boolean){const s=state(f);trigger(f,'spell',{spell});if(instant)trigger(f,'instant',{spell});s.completed++;if((spell.castTicks??0)>=2)s.slow++;s.waterRun=spell.domain==='water'?(s.waterRun??0)+1:0;s.previous=spell.id;},
  tide(f:Fighter,spell:CardDefinition,eligible:boolean){return {bonus:sum(f,['modify_tidecaller_chance'],'spell',{spell,eligibleTide:eligible},'valuePctPoints',eligible)/100,guaranteed:eligible&&select(f,['guarantee_tidecaller'],'spell',{spell,eligibleTide:eligible},true).length>0&&!!f.statuses.tide};},
  tideTriggered(f:Fighter,spell:CardDefinition){trigger(f,'tide',{spell});return select(f,['prevent_tide_consumption'],'tide',{spell}).length>0;},
  repeatPower(f:Fighter){return 1+sum(f,['repeat_power_multiplier'],'tide')/100;},
  incoming(f:Fighter,amount:number,c:Context){let pct=sum(f,['incoming_damage_reduction'],'hit',c,'valuePct',true);if(c.periodic)pct+=sum(f,['dot_damage_reduction'],'passive');if(c.self)pct+=sum(f,['self_spell_damage_reduction'],'passive');return Math.max(0,Math.round(amount*(1-pct/100))-(c.combust?sum(f,['flat_self_damage_reduction'],'passive',{},'value'):0));},
  penetration(f:Fighter){return sum(f,['ward_penetration'],'passive')/100;},
  ignoreInterrupt(f:Fighter){return select(f,['ignore_interrupt'],'interruptReceived').length>0;},
  reshuffle(f:Fighter,normal:number){let n=normal;for(const e of select(f,['set_reshuffle_ticks','set_first_reshuffle_ticks'],'reshuffle'))n=e.ability!.value;trigger(enemy(f),'enemyReshuffle');return n;},
  cycle(f:Fighter){const s=state(f);s.cycles++;f.cycle=(f.cycle??1)+1;s.spent=0;trigger(f,'cycle');},
 };
}
