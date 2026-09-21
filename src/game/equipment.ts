import raw from '../config/equipment.json';
import type { Equipment, EquipmentId, EquipmentSlot, Fighter } from './model';
export type Ability = {trigger:string;effect:string;text:string;[key:string]:any};
export type EquipmentStats={maxHealth:number;maxMana:number;spellPowerPct:number;restorationPct:number;critChancePct:number;critPowerBonusPct:number;startingWard:number};
const symbols={weapon:'╱',armor:'♜',ring:'◉',boots:'⌁'};
export const EQUIPMENT:Record<string,Equipment>=Object.fromEntries(raw.equipment.map(e=>[e.id,{...e,slot:e.slot as EquipmentSlot,price:e.stars,symbol:symbols[e.slot as EquipmentSlot],description:[...Object.entries(e.stats).filter(([,v])=>v!==0).map(([k,v])=>`${v>0?'+':''}${v}${['maxHealth','maxMana','startingWard'].includes(k)?'':'%'} ${({maxHealth:'Health',maxMana:'Mana',spellPowerPct:'Spell Power',restorationPct:'Restoration',critChancePct:'Crit chance',critPowerBonusPct:'Crit power',startingWard:'starting Ward'} as Record<string,string>)[k]}`),e.ability?.text].filter(Boolean).join(' · '),modifiers:{health:e.stats.maxHealth,mana:e.stats.maxMana,equipmentId:e.id}}]));
export const EQUIPMENT_SLOTS:EquipmentSlot[]=['weapon','armor','ring','boots'];
export function equipped(f:Pick<Fighter,'equipment'>){return Object.values(f.equipment??{}).map(id=>EQUIPMENT[id]).filter(Boolean);}
export function equipmentModifiers(equipment:Partial<Record<EquipmentSlot,EquipmentId>>){return Object.values(equipment).map(id=>EQUIPMENT[id]?.modifiers).filter(Boolean);}
export function rerollCost(equipment:Partial<Record<EquipmentSlot,EquipmentId>>,rerolls:number){return equipped({equipment}).some(e=>e.ability?.effect==='free_rerolls'&&rerolls<e.ability.count)?0:1;}
export function equipmentKeywords(item:Equipment){const text=item.description.toLowerCase();return ['ward','cycle','restoration','spell-power','crit','burn','hotstreak','growth','tide','tidecaller','rain','veil','guard','phoenix','interrupt','overgrowth','dot','hot','fury','combust','overheat'].filter(k=>text.includes(k.replace(/-/g,' ')));}
