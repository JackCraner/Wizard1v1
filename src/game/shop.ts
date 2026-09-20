import type { Equipment, EquipmentId, EquipmentSlot, SpellId } from './model';

export const EQUIPMENT: Record<EquipmentId, Equipment> = {
  wand: { id: 'wand', slot: 'weapon', name: 'Apprentice wand', price: 4, description: '+5 maximum mana', modifiers: { mana: 5 }, symbol: '╱' },
  robe: { id: 'robe', slot: 'armor', name: 'Woven robes', price: 4, description: '+15 maximum health', modifiers: { health: 15 }, symbol: '♜' },
  band: { id: 'band', slot: 'ring', name: 'Sapphire band', price: 4, description: '+10 maximum mana', modifiers: { mana: 10 }, symbol: '◉' },
  treads: { id: 'treads', slot: 'boots', name: 'Wayfarer boots', price: 3, description: '+10 maximum health', modifiers: { health: 10 }, symbol: '⌁' },
};
export const EQUIPMENT_SLOTS: EquipmentSlot[] = ['weapon', 'armor', 'ring', 'boots'];
const spells: SpellId[] = ['fireball', 'ward', 'bolt', 'drain', 'mend', 'spark'];
const items: EquipmentId[] = ['wand', 'robe', 'band', 'treads'];

// Deterministic local offers; a future server can replace this with seeded generation.
export function offersFor(round: number, rerolls: number) {
  const offset = round - 1 + rerolls;
  return {
    shop: Array.from({ length: 4 }, (_, i) => spells[(offset + i) % spells.length]),
    equipmentShop: Array.from({ length: 2 }, (_, i) => items[(offset + i) % items.length]),
  };
}
export function equipmentModifiers(equipment: Partial<Record<EquipmentSlot, EquipmentId>>) {
  return Object.values(equipment).map(id => EQUIPMENT[id].modifiers);
}
