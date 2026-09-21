import { EQUIPMENT } from './equipment';
export {EQUIPMENT,EQUIPMENT_SLOTS,equipmentModifiers,rerollCost} from './equipment';
import { shopRankOdds } from '../config/shopOdds';
import { canOfferSpell, RULES, PLAYABLE_SPELLS, SPELLS } from './engine';
import type { Equipment, EquipmentId, EquipmentSlot, SpellId } from './model';

const spells = PLAYABLE_SPELLS;
const items=Object.keys(EQUIPMENT);

// Deterministic local offers; a future server can replace this with seeded generation.
export function offersFor(round: number, rerolls: number, deck: SpellId[] = []) {
  const eligible = spells.filter(id => canOfferSpell(deck, id));

  let seed=(round*73856093 ^ rerolls*19349663)>>>0;
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
    const choices=fresh.length?fresh:domains;
    const domain=choices[Math.floor(random()*choices.length)];usedDomains.add(domain);
    const pool=rank.pool.filter(id=>SPELLS[id].domain===domain);
    const unseen=pool.filter(id=>!shop.includes(id));
    const candidates=unseen.length?unseen:pool;
    shop.push(candidates[Math.floor(random()*candidates.length)]);
  }
  return {
    shop,
    equipmentShop: Array.from({length:2},()=>{
      let roll=random()*odds.reduce((a,b)=>a+b,0);let stars=odds.findIndex(weight=>(roll-=weight)<0)+1;if(!stars)stars=5;
      const pool=items.filter(id=>EQUIPMENT[id].stars===stars);return pool[Math.floor(random()*pool.length)];
    }),
  };
}
