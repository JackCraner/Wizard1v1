import config from '../config/bots.json';
import statuses from '../config/statuses.json';
import { canAddSpell, fighter, RULES, simulate, SPELLS } from './engine';
import { EQUIPMENT, equipmentModifiers, offersFor } from './shop';
import type { Difficulty, Fighter, Session, SpellId } from './model';

export const BOT_CONFIG=config;
export type BotState={gold:number;strategy:number;equipment:Session['equipment'];lastPreparedRound:number};
export type BotStates=Record<string,BotState>;
export function createBotStates(ids:string[]):BotStates {
 return Object.fromEntries(ids.map((id,i)=>[id,{gold:0,strategy:i%config.strategies.length,equipment:{},lastPreparedRound:0}]));
}
const effects=(id:string)=>SPELLS[id].combat?.effects??[];
const isDamage=(id:string)=>effects(id).some(e=>e.kind==='damage'||e.kind==='bothDamage'||e.kind==='status'&&e.target==='enemy'&&(statuses as Record<string,{kind:string}>)[e.status!]?.kind==='dot');

export function scoreBotDeck(deck:SpellId[],strategy:number):number {
 const w=config.weights,profile=config.strategies[strategy];
 const available=new Set(deck.flatMap(id=>effects(id).filter(e=>e.kind==='status').map(e=>e.status)));
 let score=0,cost=0,mana=0;
 for(const id of deck){
  const card=SPELLS[id],time=Math.max(1,card.castTicks??1);let power=0;
  for(const e of effects(id)){
   const channel=e.perChannel?deck.filter(other=>other===id).length:1;
   const value=(e.amount??0)*channel;
   if(e.kind==='damage'||e.kind==='bothDamage')power+=value*w.damage*(e.critWhen?.length&&e.critWhen.every(s=>available.has(s))?RULES.critMultiplier:1);
   if(e.kind==='selfDamage')power-=value*.7;
   if(e.kind==='loseCurrentHealth')power-=RULES.health*(e.amount??0)*.15;
   if(e.kind==='heal')power+=value*w.healing;
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
 let deck=[...previous];
 const target=Math.min(RULES.slots,config.deck.openingSize+(round-1)*config.deck.cardsPerRound);
 for(let roll=0;roll<level.shoppingRolls;roll++){
  const fee=roll===0||boosted&&roll<=level.freeRerolls?0:config.economy.rerollCost;
  if(state.gold<=fee)break;state.gold-=fee;
  const offers=offersFor(round+(boosted?level.shopRoundBonus:0),index*101+roll,deck).shop;
  // Buy each offer at most once. Rank, cost, slot and domain rules still apply.
  for(let purchase=0;purchase<offers.length;purchase++){
   const options=offers.flatMap((id,offerIndex)=>{
    if(!profile.domains.includes(SPELLS[id].domain)||!canAddSpell(deck,id)||SPELLS[id].price>state.gold)return [];
    const base=scoreBotDeck(deck,state.strategy),candidates:{deck:SpellId[];score:number;id:string;offerIndex:number}[]=[];
    const targets=deck.length<target?[-1]:deck.map((_,i)=>i);
    for(const at of targets){
     if(at>=0&&deck[at]===id)continue;
     const next=[...deck];if(at<0)next.push(id);else next[at]=id;
     if(!isDamage(id)&&next.filter(x=>!isDamage(x)).length/next.length>config.deck.maxSupportFraction)continue;
     const gain=scoreBotDeck(next,state.strategy)-base;
     if(at>=0&&gain<config.deck.replacementThreshold)continue;
     candidates.push({deck:next,score:gain,id,offerIndex});
    }
    return candidates;
   }).sort((a,b)=>b.score-a.score);
   if(!options.length)break;
   const choice=options[random()<level.mistakeChance?Math.floor(random()*options.length):0];
   deck=choice.deck;state.gold-=SPELLS[choice.id].price;offers.splice(choice.offerIndex,1);purchase--;
  }
 }
 // A bot must always be able to enter its first duel, even with unlucky offers.
 if(!deck.length){const id=profile.domains.includes('nature')?'wrath':'ember';deck=[id];state.gold-=SPELLS[id].price;}
 if(round>=config.economy.equipmentStartRound){
  let budget=Math.min(state.gold,level.equipmentBudget);
  for(const item of Object.values(EQUIPMENT))if(!state.equipment[item.slot]&&item.price<=budget){state.equipment[item.slot]=item.id;state.gold-=item.price;budget-=item.price;}
 }
 if(level.orderTrials>0){
  deck=orderedDeck(deck);
  // Train against fixed archetypes, never inspect the human's current hand.
  const training=[['wrath','moonfire','regrowth'],['ember','splash','brine']];
  const evaluate=(candidate:SpellId[])=>training.reduce((sum,enemy)=>{const battle=simulate(fighter('Bot',candidate,equipmentModifiers(state.equipment)),fighter('Sparring',enemy),RULES.seed+round);const last=battle.frames.at(-1)!;return sum+last.player.health-last.bot.health+(battle.outcome==='victory'?200:battle.outcome==='defeat'?-200:0);},0);
  let best=evaluate(deck);
  for(let trial=0;trial<level.orderTrials;trial++){const candidate=[...deck],a=Math.floor(random()*deck.length),b=Math.floor(random()*deck.length);[candidate[a],candidate[b]]=[candidate[b],candidate[a]];const score=evaluate(candidate);if(score>best){deck=candidate;best=score;}}
 }
 state.lastPreparedRound=round;
 return deck;
}
export function botFighter(name:string,deck:SpellId[],state:BotState):Fighter {
 return {...fighter(name,deck,equipmentModifiers(state.equipment)),equipment:{...state.equipment}};
}
