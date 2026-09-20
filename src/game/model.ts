export type SpellId = 'spark' | 'fireball' | 'mend' | 'ward' | 'drain' | 'bolt';
export interface Spell { id: SpellId; name: string; kind: 'damage' | 'heal' | 'shield' | 'drain'; power: number; mana: number; price: number; description: string }
export interface Stats { health: number; mana: number }
export interface EquipmentModifier { health?: number; mana?: number }
export interface Fighter { name: string; health: number; mana: number; shield: number; maxHealth: number; maxMana: number; spells: SpellId[] }
export interface CombatFrame { tick: number; player: Fighter; bot: Fighter; messages: string[] }
export interface Battle { frames: CombatFrame[]; outcome: 'victory' | 'defeat' | 'draw' }
export interface Session { id: string; revision: number; round: number; gold: number; spells: SpellId[]; shop: SpellId[]; rerolls: number; equipmentShop: EquipmentId[]; equipment: Partial<Record<EquipmentSlot, EquipmentId>>; phase: 'shop' | 'result'; wins: number; losses: number; battle: Battle | null }
export type Command = { type: 'reroll' } | { type: 'buyEquipment'; item: EquipmentId } | { type: 'buy'; spell: SpellId } | { type: 'move'; from: number; to: number } | { type: 'fight' } | { type: 'next' };
// The future HTTP/WebSocket adapter implements this same asynchronous boundary.
export interface GameGateway { start(): Promise<Session>; execute(sessionId: string, expectedRevision: number, command: Command): Promise<Session> }

export type EquipmentSlot = 'weapon' | 'armor' | 'ring' | 'boots';
export type EquipmentId = 'wand' | 'robe' | 'band' | 'treads';
export interface Equipment { id: EquipmentId; slot: EquipmentSlot; name: string; price: number; description: string; modifiers: EquipmentModifier; symbol: string }
