import type { Ability, EquipmentStats } from './equipment';
import type { CardDefinition, Domain } from '../config/catalogue';
// IDs come from editable JSON and are validated against the catalogue at runtime.
export type SpellId = string;
export type Difficulty = 'easy'|'normal'|'hard'|'nightmare';
export interface Effect { kind: 'damage'|'loseCurrentHealth'|'selfDamage'|'bothDamage'|'heal'|'mana'|'bothMana'|'status'|'stealMana'|'cleanse'|'manaPerDotStack'|'multiplyHotStacks'|'consumeDots'|'enhance'|'interrupt'|'consumeBurn'|'castingStatus'|'cleanseAll'|'healPerCleanse'|'healthConditional'|'oath'; cap?:number; threshold?:number; onSuccess?:Effect[]; onFailure?:Effect[]; oath?:Oath; amount?: number; status?: string; target?: 'self'|'enemy'; critWhen?: string[]; perChannel?: boolean; perStatus?: string; perManaSpent?:boolean }
export interface Spell extends CardDefinition { price: number; description: string }
export interface Stats { health: number; mana: number }
export interface EquipmentModifier { health?: number; mana?: number; equipmentId?:string }
export interface Oath { id:string; remaining?:number; requirement:"nonInstant"|"noDamage"|"noSkip"; rewards:Effect[] }
export interface Fighter { oath?:Oath; penanceQueued?:number; penanceActive?:number; gearState?:Record<string,any>; cycle?:number; enhancements?:Record<string,number>; statusSources?:Record<string,'player'|'bot'>; spellXp?: number[]; instantThisTick?: SpellId; equipment?:Partial<Record<EquipmentSlot,EquipmentId>>; name: string; health: number; mana: number; shield: number; maxHealth: number; maxMana: number; spells: SpellId[]; statuses: Record<string,number>; cursor: number; reshuffleRemaining?: number; casting: { spell: SpellId; index: number; remaining: number; totalTicks?: number; damageMultiplier?:number; mana: number; tidecaller: boolean } | null }
export interface CastEvent { xp?: number; side: 'player'|'bot'; spell: SpellId; index: number; status: 'cast'|'skipped'; mana: number; critical: boolean; repeats?: number; critMultiplier?: number; details?: string[] }
export interface DamageEvent { domain?: Domain; side: 'player'|'bot'; amount: number; critical: boolean; kind: 'hit'|'dot'|'cost' }
export interface HealingEvent { side: 'player'|'bot'; amount:number; kind: 'heal'|'hot' }
export interface CombatNotice { side: 'player'|'bot'; status: string; text: string }
export interface ManaEvent { side: 'player'|'bot'; amount: number; kind: 'cost'|'effect'|'rebirth' }
export interface CombatFrame { tickStart?: CombatFrame; presentationPhase?: 'start'|'resolve'; manaEvents?: ManaEvent[]; notices?: CombatNotice[]; healingEvents?: HealingEvent[]; damageEvents?: DamageEvent[]; tick: number; player: Fighter; bot: Fighter; messages: string[]; events: CastEvent[] }
export interface Battle { frames: CombatFrame[]; outcome: 'victory'|'defeat'|'draw'; endReason: 'timeout'|'knockout' }
export interface LobbyPlayer { deckXp?:number[]; lastCombatXp?:number[]; id:string; name:string; human:boolean; wins:number; losses:number; draws:number; deck:SpellId[]; lastCombatDeck:SpellId[]; lastCombatRound:number|null }
export interface Lobby { players:LobbyPlayer[]; winsToWin:number; finished:boolean; winnerIds:string[] }
export interface Session { spellXp?:number[]; difficulty:Difficulty; lobby:Lobby; id: string; revision: number; round: number; gold: number; spells: SpellId[]; shop: (SpellId|null)[]; rerolls: number; equipmentShop: (EquipmentId|null)[]; equipment: Partial<Record<EquipmentSlot,EquipmentId>>; phase: 'shop'|'result'; wins: number; losses: number; battle: Battle|null }
export type Command = { type: 'reroll' } | { type:'buyEquipment';item:EquipmentId;shopSlot?:number } | { type:'buy';spell:SpellId;shopSlot?:number; target?:number } | {type:'merge';from:number;to:number} | { type:'trash';index:number } | { type:'move';from:number;to:number } | { type:'fight' } | { type:'next' };
export interface GameGateway { start(difficulty?:Difficulty):Promise<Session>; execute(sessionId:string,expectedRevision:number,command:Command):Promise<Session> }
export type EquipmentSlot = 'weapon'|'armor'|'ring'|'boots';
export type EquipmentId = string;
export interface Equipment { id:EquipmentId;slot:EquipmentSlot;name:string;price:number;description:string;modifiers:EquipmentModifier;symbol:string;stars:number;affinity:string;stats:EquipmentStats;ability:Ability|null;tags:string[] }
