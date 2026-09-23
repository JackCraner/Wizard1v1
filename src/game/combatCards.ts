import { cardAt } from './upgrades';
import { activeSpellIndices } from './rotation';
import type { Fighter } from './model';
export function combatCard(f:Fighter,index:number){
 const card=cardAt(f.spells[index],f.spellXp?.[index]),state=f.memory.cards?.[index];
 if(!state?.awakened)return card;
 const awakened=card.rules.match(/Awakened:\s*([^\[]+)/i)?.[1]?.trim();
 const retainBase=card.combat?.effects?.some(e=>e.kind==='awaken'&&e.effects?.some(x=>x.rule==='poisonPower'));
 return {...card,rules:awakened?`${retainBase?card.rules.split(/Awaken:/i)[0].trim()+' ':''}Awakened: ${awakened}`:card.rules};
}
/** Predictions only reserve counters already held, never hypothetical future gains. */
export function resourcePredictions(f:Fighter){
 const active=activeSpellIndices(f),current=f.casting?.index;
 const order=[...active.filter(i=>i>=f.cursor&&i!==current),...active.filter(i=>i<f.cursor)];
 const heat=order.find(i=>{const c=cardAt(f.spells[i],f.spellXp?.[i]);return c.domain==='fire'&&!(c.castTicks===0&&(!c.instantDomain||f.attuned.includes(c.instantDomain)));});
 const tide=order.find(i=>{const c=cardAt(f.spells[i],f.spellXp?.[i]);return !(c.castTicks===0&&(!c.instantDomain||f.attuned.includes(c.instantDomain)));});
 return {heat:(f.statuses.heat??0)>=3?heat:undefined,tide:(f.statuses.tide??0)>=(f.memory.rules?.tideThreshold??3)?tide:undefined};
}
