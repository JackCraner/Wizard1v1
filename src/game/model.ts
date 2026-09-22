import type { CardDefinition, Domain } from '../config/catalogue';
export type SpellId = string;
export type Difficulty = 'easy' | 'normal' | 'hard' | 'nightmare';
export interface Effect {
    kind: 'damage' | 'heal' | 'ward' | 'selfDamage' | 'status' | 'interrupt' | 'cleanse' | 'consume' | 'multiply' | 'spend' | 'oath' | 'repeatNext';
    amount?: number;
    status?: string;
    target?: 'self' | 'enemy';
    empowered?: number;
    perStatus?: string;
    perChannel?: boolean;
    condition?: 'poison' | 'oath' | 'previousFire' | 'previousWater';
    bonus?: number;
    effects?: Effect[];
    repeats?: number;
    oath?: Oath;
}
export interface Oath {
    id: string;
    remaining: number;
    requirement: 'slow' | 'peaceful';
    reward: 'ward' | 'heal';
    amount: number;
}
export interface Spell extends CardDefinition {
    price: number;
    description: string;
}
export interface Stats {
    health: number;
}
export interface CombatMemory {
    casts: number;
    water: number;
    fast: number;
    fastStreak: number;
    cycleCasts: number;
    previousDomain?: Domain;
    oathCompleted?: boolean;
    nextFireFaster?: boolean;
    nextHolyEmpowered?: boolean;
    nextBonus?: number;
    nextRepeats?: number;
    nextFaster?: boolean;
    nextPoison?: number;
    previousSelfDamage?: boolean;
}
export interface Fighter {
    name: string;
    health: number;
    maxHealth: number;
    shield: number;
    spells: SpellId[];
    spellXp?: number[];
    augments: string[];
    statuses: Record<string, number>;
    cursor: number;
    cycle: number;
    reshuffleRemaining: number;
    oath?: Oath;
    memory: CombatMemory;
    casting: {
        spell: SpellId;
        index: number;
        remaining: number;
        totalTicks: number;
    } | null;
}
export interface CastEvent {
    xp?: number;
    side: 'player' | 'bot';
    spell: SpellId;
    index: number;
    status: 'cast' | 'skipped';
    critical: boolean;
    repeats?: number;
    critMultiplier?: number;
    details?: string[];
}
export interface DamageEvent {
    domain?: Domain;
    side: 'player' | 'bot';
    amount: number;
    critical: boolean;
    kind: 'hit' | 'dot' | 'cost';
}
export interface HealingEvent {
    side: 'player' | 'bot';
    amount: number;
    kind: 'heal' | 'hot';
}
export interface CombatNotice {
    side: 'player' | 'bot';
    status: string;
    text: string;
}
export interface CombatFrame {
    tickStart?: CombatFrame;
    presentationPhase?: 'start' | 'resolve';
    notices?: CombatNotice[];
    healingEvents?: HealingEvent[];
    damageEvents?: DamageEvent[];
    tick: number;
    player: Fighter;
    bot: Fighter;
    messages: string[];
    events: CastEvent[];
}
export interface Battle {
    frames: CombatFrame[];
    outcome: 'victory' | 'defeat' | 'draw';
    endReason: 'timeout' | 'knockout';
}
export interface LobbyPlayer {
    deckXp?: number[];
    lastCombatXp?: number[];
    augments: string[];
    lastCombatAugments: string[];
    id: string;
    name: string;
    human: boolean;
    wins: number;
    losses: number;
    draws: number;
    deck: SpellId[];
    lastCombatDeck: SpellId[];
    lastCombatRound: number | null;
}
export interface Lobby {
    players: LobbyPlayer[];
    winsToWin: number;
    finished: boolean;
    winnerIds: string[];
}
export interface Session {
    bonusMergeUsed?: boolean;
    spellXp?: number[];
    difficulty: Difficulty;
    lobby: Lobby;
    id: string;
    revision: number;
    round: number;
    gold: number;
    spells: SpellId[];
    shop: (SpellId | null)[];
    rerolls: number;
    augments: string[];
    augmentOffers: string[];
    phase: 'shop' | 'result' | 'augment';
    wins: number;
    losses: number;
    battle: Battle | null;
}
export type Command = {
    type: 'reroll';
} | {
    type: 'chooseAugment';
    augment: string;
} | {
    type: 'buy';
    spell: SpellId;
    shopSlot?: number;
    target?: number;
} | {
    type: 'merge';
    from: number;
    to: number;
} | {
    type: 'trash';
    index: number;
} | {
    type: 'move';
    from: number;
    to: number;
} | {
    type: 'fight';
} | {
    type: 'next';
};
export interface GameGateway {
    start(difficulty?: Difficulty): Promise<Session>;
    execute(sessionId: string, expectedRevision: number, command: Command): Promise<Session>;
}
