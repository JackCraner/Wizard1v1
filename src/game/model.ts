import type { CardDefinition, Domain } from '../config/catalogue';
export type SpellId = string;
export type Difficulty = 'easy' | 'normal' | 'hard' | 'nightmare';
export interface Effect {
    requiresAttunement?: Domain;
    attunedAmount?: number;
    bonusDomain?: Domain;
    kind: 'damage' | 'heal' | 'ward' | 'selfDamage' | 'status' | 'interrupt' | 'cleanse' | 'consume' | 'multiply' | 'spend' | 'oath' | 'repeatNext' | 'modifier' | 'cultivate' | 'summon' | 'impGuard' | 'impPower' | 'sacrificeImp' | 'removeWard' | 'healFull' | 'fragile';
    onlyIf?: 'oath';
    roundDown?: boolean;
    impMultiplier?: number;
    debuffDamageMultiplier?: number;
    useMaxHealth?: boolean;
    amount?: number;
    all?: boolean;
    channelBonus?: number;
    criticalIfDebuffed?: boolean;
    debuffMultiplier?: number;
    statusMultiplier?: {status:string; amount:number};
    lowHealthMultiplier?: number;
    currentHealthFraction?: number;
    echoMultiplier?: number;
    permanent?: boolean;
    modifier?: 'poisonPower' | 'regenerationPower' | 'nextDamage' | 'nextEcho' | 'critDamage';
    cycleOnly?: boolean;
    status?: string;
    target?: 'self' | 'enemy';
    empowered?: number;
    perStatus?: string;
    perChannel?: boolean;
    condition?: 'poison' | 'oath' | 'previousFire' | 'previousWater' | 'regeneration';
    bonus?: number;
    effects?: Effect[];
    repeats?: number;
    oath?: Oath;
}
export interface Oath {
    id: string;
    remaining: number;
    requirement: 'dealNone' | 'deal100' | 'takeNone' | 'meditate';
    reward: 'guard' | 'fury' | 'stun' | 'damage';
    amount: number;
    startedTick?: number;
    progress?: number;
}
export interface Spell extends CardDefinition {
    price: number;
    description: string;
}
export interface Stats {
    health: number;
}
export interface CombatMemory {
    impDamage?: number;
    poisonPower?: number;
    regenerationPower?: number;
    nextDamage?: number;
    nextEcho?: number;
    critDamage?: number;
    permanentResilience?: boolean;
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
    broken?: number[];
    statusSources?: Record<string, 'self' | 'enemy'>;
    imp?: { health: number; maxHealth: number; guard: number };
    level: number;
    attuned: Domain[];
    name: string;
    health: number;
    maxHealth: number;
    shield: number;
    spells: SpellId[];
    spellXp?: number[];
    spellAcquired?: number[];
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
        echoPower?: number;
        instant?: boolean;
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
    level: number;
    trophies: number;
    deckXp?: number[];
    deckAcquired?: number[];
    lastCombatAttuned?: Domain[];
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
    trophiesToWin: number;
    finished: boolean;
    winnerIds: string[];
}
export interface Session {
    level: number;
    trophies: number;
    spellAcquired?: number[];
    nextAcquisition?: number;
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
