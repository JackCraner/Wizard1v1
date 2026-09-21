import type { CardDefinition, Domain } from '../config/catalogue';
// IDs come from editable JSON and are validated against the catalogue at runtime.
export type SpellId = string;
export interface Effect { kind: 'damage'|'loseCurrentHealth'|'selfDamage'|'bothDamage'|'heal'|'mana'|'bothMana'|'status'|'stealMana'|'cleanse'; amount?: number; status?: string; target?: 'self'|'enemy'; critWhen?: string[]; perChannel?: boolean; perStatus?: string }
export interface Spell extends CardDefinition { price: number; description: string }
export interface Stats { health: number; mana: number }
export interface EquipmentModifier { health?: number; mana?: number }
export interface Fighter { name: string; health: number; mana: number; shield: number; maxHealth: number; maxMana: number; spells: SpellId[]; statuses: Record<string,number>; cursor: number; casting: { spell: SpellId; index: number; remaining: number; totalTicks?: number; mana: number; tidecaller: boolean } | null }
export interface CastEvent { side: 'player'|'bot'; spell: SpellId; index: number; status: 'cast'|'skipped'; mana: number; critical: boolean; repeats?: number }
export interface DamageEvent { domain?: Domain; side: 'player'|'bot'; amount: number; critical: boolean; kind: 'hit'|'dot'|'cost' }
export interface HealingEvent { side: 'player'|'bot'; amount:number; kind: 'heal'|'hot' }
export interface CombatFrame { healingEvents?: HealingEvent[]; damageEvents?: DamageEvent[]; tick: number; player: Fighter; bot: Fighter; messages: string[]; events: CastEvent[] }
export interface Battle { frames: CombatFrame[]; outcome: 'victory'|'defeat'|'draw'; endReason: 'timeout'|'knockout' }
export interface Session { id: string; revision: number; round: number; gold: number; spells: SpellId[]; shop: SpellId[]; rerolls: number; equipmentShop: EquipmentId[]; equipment: Partial<Record<EquipmentSlot,EquipmentId>>; phase: 'shop'|'result'; wins: number; losses: number; battle: Battle|null }
export type Command = { type: 'reroll' } | { type:'buyEquipment';item:EquipmentId } | { type:'buy';spell:SpellId } | { type:'trash';index:number } | { type:'move';from:number;to:number } | { type:'fight' } | { type:'next' };
export interface GameGateway { start():Promise<Session>; execute(sessionId:string,expectedRevision:number,command:Command):Promise<Session> }
export type EquipmentSlot = 'weapon'|'armor'|'ring'|'boots';
export type EquipmentId = 'wand'|'robe'|'band'|'treads';
export interface Equipment { id:EquipmentId;slot:EquipmentSlot;name:string;price:number;description:string;modifiers:EquipmentModifier;symbol:string }
