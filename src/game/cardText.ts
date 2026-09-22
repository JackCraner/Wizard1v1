import type {CardDefinition,Domain} from '../config/catalogue';
import {requiredDomains} from './attunement';

export function cardRequirements(card:Pick<CardDefinition,'combat'|'instantDomain'|'castDomain'>) {
 const effects=card.combat?.effects??[];
 const domains=[...new Set([...requiredDomains(effects),...(card.instantDomain?[card.instantDomain]:[]),...(card.castDomain?[card.castDomain]:[])])];
 const whole=effects.length>0&&effects.every(e=>e.requiresAttunement===effects[0].requiresAttunement)&&effects[0].requiresAttunement?effects[0].requiresAttunement:undefined;
 return {domains,whole};
}
export type RuleSection={text:string;domain?:Domain};
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
