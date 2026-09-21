import { cardAt, deckXp, UPGRADE_XP } from './upgrades';
import config from '../config/bots.json';
import statuses from '../config/statuses.json';
import { canAddSpell, canOfferSpell, fighter, RULES, simulate, SPELLS } from './engine';
import { EQUIPMENT, equipmentModifiers, offersFor } from './shop';
import type { Difficulty, Fighter, Session, SpellId } from './model';

export const BOT_CONFIG=config;
export type BotState={spellXp?:number[];gold:number;strategy:number;equipment:Session['equipment'];lastPreparedRound:number};
export type BotStates=Record<string,BotState>;
export function createBotStates(ids:string[]):BotStates {
 return Object.fromEntries(ids.map((id,i)=>[id,{gold:0,strategy:i%config.strategies.length,equipment:{},lastPreparedRound:0}]));
}
const effects=(id:string)=>SPELLS[id].combat?.effects??[];
const isDamage=(id:string)=>effects(id).some(e=>e.kind==='damage'||e.kind==='bothDamage'||e.kind==='status'&&e.target==='enemy'&&(statuses as Record<string,{kind:string}>)[e.status!]?.kind==='dot');

export function scoreBotDeck(deck:SpellId[],strategy:number,xp:number[]=[]):number {
 const w=config.weights,profile=config.strategies[strategy];
 const available=new Set(deck.flatMap(id=>effects(id).filter(e=>e.kind==='status').map(e=>e.status)));
 let score=0,cost=0,mana=0;
 for(const [index,id] of deck.entries()){
  const card=cardAt(id,xp[index]),time=Math.max(1,card.castTicks??1);let power=0;
  for(const e of card.combat?.effects??[]){
   const channel=e.perChannel?deck.filter(other=>other===id).length:1;
   const value=(e.amount??0)*channel;
   if(e.kind==='damage'||e.kind==='bothDamage')power+=value*w.damage*(e.critWhen?.length&&e.critWhen.every(s=>available.has(s))?RULES.critMultiplier:1);
   if(e.kind==='manaPerDotStack')power+=deck.some(x=>effects(x).some(effect=>effect.kind==='status'&&effect.target==='enemy'))?w.synergy:0;
   if(e.kind==='multiplyHotStacks')power+=deck.some(x=>effects(x).some(effect=>effect.kind==='status'&&(statuses as Record<string,{kind:string}>)[effect.status!]?.kind==='hot'))?w.synergy:0;
   if(e.kind==='selfDamage')power-=value*.7;
   if(e.kind==='loseCurrentHealth')power-=RULES.health*(e.amount??0)*.15;
   if(e.kind==='heal')power+=value*w.healing;
   if(e.kind==='oath')power+=(e.oath?.rewards.reduce((n,r)=>n+(r.kind==='heal'?(r.amount??0)*w.healing:(r.amount??0)*2),0)??0)*0.5;
   if(e.kind==='interrupt')power+=w.synergy;
   if(e.kind==='cleanseAll'||e.kind==='cleanse')power+=w.synergy*0.5;
   if(e.kind==='mana'||e.kind==='bothMana'||e.kind==='stealMana'){mana+=value;power+=value*w.mana;}
   if(e.kind==='status'){
    const status=(statuses as Record<string,{kind:string;power?:number}>)[e.status!];
    power+=status?.kind==='dot'?Math.min(5,value)*(status.power??0)*w.status:status?.kind==='hot'?Math.min(5,value)*(status.power??0)*w.healing:value*2;
    if(e.status==='hotstreak'&&available.has('overheat'))power+=w.synergy;
   }
   if(e.perStatus&&available.has(e.perStatus))power+=w.synergy;
  }
  if(card.keywords.includes('tidecaller')&&available.has('tide'))power+=w.synergy;
  score+=power/time+(profile.preferredSpells.includes(id)?w.preference:0);
  cost+=typeof card.mana==='number'?card.mana:card.mana==='half'?50:0;
 }
 score-=Math.max(0,cost-(RULES.mana/2+mana))*w.manaShortfall;
 for(const id of new Set(deck))if(!SPELLS[id].keywords.includes('channel'))score-=Math.max(0,deck.filter(x=>x===id).length-2)*config.deck.duplicatePenalty;
 return score;
}

function orderedDeck(deck:SpellId[]):SpellId[] {
 const priority=(id:string)=>{
  if(effects(id).some(e=>e.kind==='status'&&e.target==='enemy'))return 0;
  if(effects(id).some(e=>e.kind==='mana'||e.kind==='stealMana'))return 1;
  if(effects(id).some(e=>e.kind==='status'&&e.target!=='enemy'))return 2;
  return 3;
 };
 return [...deck].sort((a,b)=>priority(a)-priority(b)||(a===b?0:deck.indexOf(a)-deck.indexOf(b)));
}
export function prepareBot(state:BotState,previous:SpellId[],round:number,index:number,difficulty:Difficulty):SpellId[] {
 if(state.lastPreparedRound===round)return [...previous];
 const level=config.difficulties[difficulty],profile=config.strategies[state.strategy];
 let seed=(RULES.seed+round*937+index*7919)>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 state.gold+=round===1?config.economy.startingGold:config.economy.roundIncome;
 const boosted=round>=level.advantageStartsRound;
 if(boosted)state.gold+=level.bonusGoldPerRound;
 let deck=[...previous],xp=deckXp(previous,state.spellXp);
 const remap=(next:SpellId[])=>{const pools=new Map<string,number[]>();deck.forEach((id,i)=>pools.set(id,[...(pools.get(id)??[]),xp[i]]));return next.map(id=>pools.get(id)?.shift()??0);};
 if(round>=config.economy.equipmentStartRound){
  let budget=Math.min(Math.max(0,state.gold-config.economy.spellGoldReserve),level.equipmentBudget);
  for(const item of offersFor(round,state.strategy+round,deck).equipmentShop.map(id=>EQUIPMENT[id!]).filter(Boolean).sort((a,b)=>(Number(b.affinity==='neutral'||profile.domains.includes(b.affinity))-Number(a.affinity==='neutral'||profile.domains.includes(a.affinity)))||b.stars-a.stars))if(item.price<=budget){state.equipment[item.id]=(state.equipment[item.id]??0)+1;state.gold-=item.price;budget-=item.price;}
 }
 const target=Math.min(RULES.slots,config.deck.openingSize+(round-1)*config.deck.cardsPerRound);
 for(let roll=0;roll<level.shoppingRolls;roll++){
  const fee=roll===0||boosted&&roll<=level.freeRerolls?0:config.economy.rerollCost;
  if(state.gold<=fee)break;state.gold-=fee;
  const offers=offersFor(round+(boosted?level.shopRoundBonus:0),index*101+roll,deck).shop;
  // Buy each offer at most once. Rank, cost, slot and domain rules still apply.
  for(let purchase=0;purchase<offers.length;purchase++){
   const options=offers.flatMap((id,offerIndex)=>{
    if(!profile.domains.includes(SPELLS[id].domain)||!canOfferSpell(deck,id)||SPELLS[id].price>state.gold)return [];
    const base=scoreBotDeck(deck,state.strategy,xp),candidates:{deck:SpellId[];xp:number[];score:number;id:string;offerIndex:number}[]=[];
    // Once established, invest in matching copies without filling extra slots.
    if(deck.length>=config.deck.openingSize)deck.forEach((owned,at)=>{
     if(owned!==id||xp[at]>=UPGRADE_XP)return;
     const nextXp=[...xp];nextXp[at]++;
     const gain=scoreBotDeck(deck,state.strategy,nextXp)-base;
     candidates.push({deck:[...deck],xp:nextXp,score:gain+config.deck.mergePriority,id,offerIndex});
    });
    const targets=deck.length<target?[-1]:deck.map((_,i)=>i);
    for(const at of targets){
     if(at>=0&&deck[at]===id)continue;
     if(!canAddSpell(at<0?deck:deck.filter((_,i)=>i!==at),id))continue;
     const next=[...deck];if(at<0)next.push(id);else next[at]=id;
     if(!isDamage(id)&&next.filter(x=>!isDamage(x)).length/next.length>config.deck.maxSupportFraction)continue;
     const nextXp=[...xp];if(at<0)nextXp.push(0);else nextXp[at]=0;
     const gain=scoreBotDeck(next,state.strategy,nextXp)-base;
     if(at>=0&&gain<config.deck.replacementThreshold+(xp[at]??0)*config.deck.mergePriority)continue;
     candidates.push({deck:next,xp:nextXp,score:gain,id,offerIndex});
    }
    return candidates;
   }).sort((a,b)=>b.score-a.score);
   if(!options.length)break;
   const choice=options[random()<level.mistakeChance?Math.floor(random()*options.length):0];
   deck=choice.deck;xp=choice.xp;state.gold-=SPELLS[choice.id].price;offers.splice(choice.offerIndex,1);purchase--;
  }
 }
 // A bot must always be able to enter its first duel, even with unlucky offers.
 if(!deck.length){const id=profile.domains.includes('nature')?'wrath':'ember';deck=[id];xp=[0];state.gold-=SPELLS[id].price;}
 if(level.orderTrials>0){
  const ordered=orderedDeck(deck);xp=remap(ordered);deck=ordered;
  // Train against fixed archetypes, never inspect the human's current hand.
  const training=[['wrath','moonfire','regrowth'],['ember','splash','brine']];
  const evaluate=(candidate:SpellId[],candidateXp:number[])=>training.reduce((sum,enemy)=>{const battle=simulate(fighter('Bot',candidate,equipmentModifiers(state.equipment),candidateXp),fighter('Sparring',enemy),RULES.seed+round);const last=battle.frames.at(-1)!;return sum+last.player.health-last.bot.health+(battle.outcome==='victory'?200:battle.outcome==='defeat'?-200:0);},0);
  let best=evaluate(deck,xp);
  for(let trial=0;trial<level.orderTrials;trial++){const candidate=[...deck],candidateXp=[...xp],a=Math.floor(random()*deck.length),b=Math.floor(random()*deck.length);[candidate[a],candidate[b]]=[candidate[b],candidate[a]];[candidateXp[a],candidateXp[b]]=[candidateXp[b],candidateXp[a]];const score=evaluate(candidate,candidateXp);if(score>best){deck=candidate;xp=candidateXp;best=score;}}
 }
 state.spellXp=xp;state.lastPreparedRound=round;
 return deck;
}
export function botFighter(name:string,deck:SpellId[],state:BotState):Fighter {
 return {...fighter(name,deck,equipmentModifiers(state.equipment),state.spellXp),equipment:{...state.equipment}};
}
