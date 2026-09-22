import { shopRankOdds } from '../config/shopOdds';
import { canOfferSpell, RULES, PLAYABLE_SPELLS, SPELLS } from './engine';
export { rerollCost } from './augments';
import type { SpellId } from './model';

const spells = PLAYABLE_SPELLS;


// A run seed plus round and reroll identifies a reproducible shop.
export function offersFor(round: number, rerolls: number, deck: SpellId[] = [], augments: string[] = [], runSeed = 0) {
  const eligible = spells.filter(id => canOfferSpell(deck, id));

  let seed=(runSeed ^ Math.imul(round,73856093) ^ Math.imul(rerolls,19349663))>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const odds=shopRankOdds(round);
  const ranks=odds.map((weight,index)=>({weight, pool:eligible.filter(id=>SPELLS[id].stars===index+1)})).filter(rank=>rank.weight>0 && rank.pool.length>0);
  const total=ranks.reduce((sum,rank)=>sum+rank.weight,0);
  if(!total) throw new Error('No playable spells match the configured shop ranks and deck domains.');
  const shop:SpellId[]=[];
  const usedDomains=new Set<string>();
  for(let slot=0;slot<RULES.shopSlots;slot++) {
    // Roll rank first: domain variety and catalogue size must not change rank odds.
    let roll=random()*total;
    const rank=ranks.find(entry=>{roll-=entry.weight;return roll<0;}) ?? ranks[ranks.length-1];
    const domains=[...new Set(rank.pool.map(id=>SPELLS[id].domain))];
    const fresh=domains.filter(domain=>!usedDomains.has(domain));
    const choices=augments.includes('specialist')?domains:fresh.length?fresh:domains;
    const counts=Object.fromEntries(domains.map(d=>[d,deck.filter(id=>SPELLS[id].domain===d).length]));
    const most=domains.slice().sort((a,b)=>counts[b]-counts[a])[0];
    const weighted=choices.flatMap(d=>Array(augments.includes('specialist')&&d===most&&counts[d]>0?3:1).fill(d));
    const domain=weighted[Math.floor(random()*weighted.length)];usedDomains.add(domain);
    const pool=rank.pool.filter(id=>SPELLS[id].domain===domain);
    const unseen=pool.filter(id=>!shop.includes(id));
    const candidates=unseen.length?unseen:pool;
    shop.push(candidates[Math.floor(random()*candidates.length)]);
  }
  return { shop };
}
