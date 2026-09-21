import { shopRankOdds } from '../config/shopOdds';
import { canAddSpell, PLAYABLE_SPELLS, SPELLS } from './engine';
import type { Equipment, EquipmentId, EquipmentSlot, SpellId } from './model';

export const EQUIPMENT: Record<EquipmentId, Equipment> = {
  wand: { id: 'wand', slot: 'weapon', name: 'Apprentice wand', price: 4, description: '+5 maximum mana', modifiers: { mana: 5 }, symbol: '╱' },
  robe: { id: 'robe', slot: 'armor', name: 'Woven robes', price: 4, description: '+15 maximum health', modifiers: { health: 15 }, symbol: '♜' },
  band: { id: 'band', slot: 'ring', name: 'Sapphire band', price: 4, description: '+10 maximum mana', modifiers: { mana: 10 }, symbol: '◉' },
  treads: { id: 'treads', slot: 'boots', name: 'Wayfarer boots', price: 3, description: '+10 maximum health', modifiers: { health: 10 }, symbol: '⌁' },
};
export const EQUIPMENT_SLOTS: EquipmentSlot[] = ['weapon', 'armor', 'ring', 'boots'];
const spells = PLAYABLE_SPELLS;
const items: EquipmentId[] = ['wand', 'robe', 'band', 'treads'];

// Deterministic local offers; a future server can replace this with seeded generation.
export function offersFor(round: number, rerolls: number, deck: SpellId[] = []) {
  const eligible = spells.filter(id => canAddSpell(deck, id));
  const offset = round - 1 + rerolls;
  let seed=(round*73856093 ^ rerolls*19349663)>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const odds=shopRankOdds(round);
  const ranks=odds.map((weight,index)=>({weight, pool:eligible.filter(id=>SPELLS[id].stars===index+1)})).filter(rank=>rank.weight>0 && rank.pool.length>0);
  const total=ranks.reduce((sum,rank)=>sum+rank.weight,0);
  if(!total) throw new Error('No playable spells match the configured shop ranks and deck domains.');
  const shop:SpellId[]=[];
  const usedDomains=new Set<string>();
  for(let slot=0;slot<4;slot++) {
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
    equipmentShop: Array.from({ length: 2 }, (_, i) => items[(offset + i) % items.length]),
  };
}
export function equipmentModifiers(equipment: Partial<Record<EquipmentSlot, EquipmentId>>) {
  return Object.values(equipment).map(id => EQUIPMENT[id].modifiers);
}
