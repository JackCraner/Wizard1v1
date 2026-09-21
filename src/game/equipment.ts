import raw from '../config/equipment.json';
import type {Equipment,ItemInventory,Fighter} from './model';

export interface ItemEffect {
 type:string; amountPerStack?:number; status?:string; maxReduction?:number;
 healthThresholdPercent?:number; minimumPrintedCastTime?:number;
 missingHealthInterval?:number; damagePercentPerIntervalPerStack?:number;
 maxTriggersPerTick?:number; maxTriggersPerCycle?:number;
 recommendedCapPercent?:number; recommendedBonusCapPerTrigger?:number; recommendedCap?:number;
}
export const EQUIPMENT:Record<string,Equipment>=Object.fromEntries(raw.items.map((item,i)=>[item.id,{
 id:item.id,name:item.name,stars:item.rarity,price:item.rarity,affinity:item.affinity==='natural'?'nature':item.affinity,
 description:item.description,effects:('effects' in item?item.effects:[item.effect]) as ItemEffect[],
 // Stable, distinct temporary icon; replace via the asset registry when art arrives.
 symbol:item.name.split(/[\s'-]+/).filter(Boolean).map(w=>w[0]).join('').slice(0,2),
}]));
export function equipped(f:Pick<Fighter,'equipment'>){return Object.entries(f.equipment??{}).filter(([id,n])=>EQUIPMENT[id]&&Number.isSafeInteger(n)&&n>0).map(([id,stacks])=>({...EQUIPMENT[id],stacks}));}
export function validateInventory(inventory:ItemInventory={}) {
 for(const [id,count] of Object.entries(inventory))if(!EQUIPMENT[id]||!Number.isSafeInteger(count)||count<=0)throw new Error('Invalid item inventory. Start a new run if it uses retired equipment.');
}
export function equipmentModifiers(equipment:ItemInventory){
 validateInventory(equipment);
 return equipped({equipment}).map(item=>({equipmentId:item.id,stacks:item.stacks,
 health:item.effects.filter(e=>e.type==='max_health').reduce((n,e)=>n+(e.amountPerStack??0)*item.stacks,0),
 mana:item.effects.filter(e=>e.type==='max_mana').reduce((n,e)=>n+(e.amountPerStack??0)*item.stacks,0)}));
}
export function rerollCost(_equipment:ItemInventory,_rerolls:number){return 1;}
export function effectValue(effect:ItemEffect,count:number){return (effect.amountPerStack??effect.damagePercentPerIntervalPerStack??0)*count;}
export function effectCap(e:ItemEffect){return e.maxReduction??e.recommendedBonusCapPerTrigger??e.recommendedCap??e.recommendedCapPercent;}
export function equipmentKeywords(item:Equipment){const text=item.description.toLowerCase();return ['cycle','crit','burn','hotstreak','tidecaller','rain','guard','dot','hot','combust','consecration','oath','penance'].filter(k=>new RegExp('\\b'+k+'s?\\b','i').test(text));}
// Replace the numerical phrase in each per-stack description with its aggregate.
// Exact caps and every trigger condition remain visible beside the total.
export function itemTotals(item:Equipment,count:number){return item.effects.map(e=>{
 const raw=effectValue(e,count),cap=effectCap(e),total=cap===undefined?raw:Math.min(cap,raw);
 const labels:Record<string,string>={max_health:'maximum Health',max_mana:'maximum Mana',damage_percent:'spell damage',direct_damage_percent:'direct spell damage',healing_percent:'healing',crit_chance:'crit chance',hot_healing_percent:'HoT healing',dot_damage_percent:'DoT damage',healing_received_percent:'healing received',damage_per_missing_health:'damage per 50 missing Health',moonfire_damage_flat:'Moonfire damage / tick',sunfire_damage_flat:'Sunfire damage / tick',lifebloom_healing_per_remaining_stack:'healing per Lifebloom stack'};
 const percent=/percent|crit_chance|damage_per_missing_health/.test(e.type);
 const triggers:Record<string,string>={
 first_spell_cycle_mana_reduction:'mana discount on first cast each Cycle',first_slow_spell_mana_reduction:'mana discount on first slow cast each Cycle',
 reduce_first_direct_hit_each_cycle:'damage blocked on first direct hit each Cycle',mana_after_reshuffle:'mana after each reshuffle',mana_during_reshuffle:'mana at reshuffle start',heal_after_reshuffle:'healing after each reshuffle',
 retaliation_damage:'retaliation damage (once per tick)',damage_percent_below_health:'damage below '+e.healthThresholdPercent+'% Health',fire_damage_percent_below_health:'Fire damage below '+e.healthThresholdPercent+'% Health',
 restore_mana_on_insufficient_mana_skip:'mana on first unaffordable skip each Cycle',first_spell_cycle_damage_percent:'damage on first spell each Cycle',first_fire_spell_cycle_damage_percent:'damage on first Fire spell each Cycle',
 heal_on_guard_gain:'healing per Guard grant',direct_damage_reduction_while_hot_active:'direct damage reduction while a HoT is active',
 fire_damage_percent:'Fire damage',water_damage_percent:'Water damage',holy_damage_percent:'Holy damage',holy_healing_percent:'Holy healing',burn_damage_percent:'Burn damage',starfall_damage_percent:'Starfall damage',
 crit_chance_below_health:'crit chance below '+e.healthThresholdPercent+'% Health',crit_chance_while_status:'crit chance while '+e.status+' is active',
 reduce_self_damage_flat:'self-damage reduction',damage_percent_while_status:'spell damage while '+e.status+' is active',critical_fire_damage_percent:'damage on critical Fire hits',
 mana_after_first_water_spell_each_cycle:'mana after first Water spell each Cycle',water_damage_percent_while_status:'Water damage while '+e.status+' is active',healing_received_percent_while_status:'healing received while '+e.status+' is active',
 bonus_mana_from_water_mana_gain:'bonus mana per Water spell mana gain',tidecaller_spell_damage_percent:'Tidecaller spell damage',
 bonus_consecration_first_holy_spell_cycle:'Consecration after first Holy spell each Cycle',heal_on_oath_complete:'healing per fulfilled Oath',damage_during_enemy_consecration_extra_tick:'damage per enemy Penance tick',bonus_consecration_on_slowness:'Consecration per Slowness application',healing_percent_while_status:'healing while '+e.status+' is active',heal_when_guard_blocks_damage:'healing when Guard blocks (once per tick)'};
 const label=labels[e.type]??triggers[e.type]??e.type.replace(/_/g,' ');
 return `${total>=0?'+':''}${total}${percent?'%':''} ${label}${cap!==undefined?' (cap '+cap+(percent?'%':'')+')':''}`;
});}
