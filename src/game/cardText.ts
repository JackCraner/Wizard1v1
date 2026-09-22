import type {CardDefinition,Domain} from '../config/catalogue';
import {requiredDomains} from './attunement';

export function cardRequirements(card:Pick<CardDefinition,'combat'|'instantDomain'|'castDomain'>) {
 const effects=card.combat?.effects??[];
 const domains=[...new Set([...requiredDomains(effects),...(card.instantDomain?[card.instantDomain]:[]),...(card.castDomain?[card.castDomain]:[])])];
 const whole=effects.length>0&&effects.every(e=>e.requiresAttunement===effects[0].requiresAttunement)&&effects[0].requiresAttunement?effects[0].requiresAttunement:undefined;
 return {domains,whole};
}
export type RuleSection={text:string;domain?:Domain};
/** Upgrade previews describe changes; upgraded cards retain their complete rules. */
export function upgradeSummary(card:CardDefinition):string {
 const upgrade=card.upgrade;
 if(!upgrade)return '';
 const prefix=(domain?:Domain)=>domain?domain[0].toUpperCase()+domain.slice(1)+' attuned: ':'';
 if(JSON.stringify(card.combat)===JSON.stringify(upgrade.combat)&&card.castTicks!==upgrade.castTicks) {
  return prefix(upgrade.castDomain??upgrade.instantDomain)+(upgrade.castTicks===0?'Become Instant.':`Cast time becomes ${upgrade.castTicks}T.`);
 }
 const clauses=(rules:string,variant:CardDefinition)=>ruleSections(rules,variant).flatMap(section=>section.text.replace(/(?:Nature|Water|Fire|Holy|Affliction) attuned:\s*/gi,'').split(/(?<=[.!?])\s+/).map(text=>({text,domain:section.domain})));
 const base=clauses(card.rules,card);
 const changed=clauses(upgrade.rules,{...card,...upgrade}).filter(next=>!base.some(old=>old.text===next.text&&old.domain===next.domain));
 if(!changed.length)return 'No additional effect.';
 // Short replacement clauses need the original effect for their subject and value.
 if(changed.some(part=>/^(?:\d|otherwise)/i.test(part.text)))return upgrade.rules;
 return changed.map(part=>prefix(part.domain)+part.text).join(' ');
}
/** Explicit prose markers scope the condition; keyword themes never imply a lock. */
export function ruleSections(rules:string,card?:Pick<CardDefinition,'combat'|'instantDomain'|'castDomain'>):RuleSection[] {
 const whole=card?cardRequirements(card).whole:undefined;
 const sections:RuleSection[]=[];
 for(const sentence of rules.split(/(?<=[.!?])\s+(?=[A-Z])/) ) {
  let domain=whole;
  const parts=sentence.split(/((?:Nature|Water|Fire|Holy|Affliction) attuned:|(?:otherwise|without (?:Nature|Water|Fire|Holy|Affliction) attunement):?)/gi);
  let pending='';
  for(const part of parts) {
   const match=part.match(/^(Nature|Water|Fire|Holy|Affliction) attuned:$/i);
   if(match){domain=match[1].toLowerCase() as Domain;pending=part+' ';continue;}
   if(/^(otherwise|without .*attunement):?$/i.test(part)){domain=undefined;pending=part+' ';continue;}
   const text=(pending+part).trim();pending='';if(!text)continue;
   if(sections.length&&sections.at(-1)?.domain===domain)sections[sections.length-1].text+=' '+text;
   else sections.push({text,domain});
  }
 }
 return sections;
}
