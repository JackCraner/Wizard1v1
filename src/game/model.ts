import type { CardDefinition, Domain } from '../config/catalogue';
export type SpellId = string;
export type Difficulty = 'easy' | 'normal' | 'hard' | 'nightmare';
export interface Effect {
    bonusWhen?: Effect['when'];
    addPerStatus?: string;
    perStatusAmount?: number;
    bonusLimit?: number;
    perEventAmount?: boolean;
    wardPerAdded?: number;
    requiresAttunement?: Domain;
    attunedAmount?: number;
    bonusDomain?: Domain;
    kind: 'growImp' | 'rule' | 'trigger' | 'awaken' | 'retrigger' | 'sequenceOath' | 'damage' | 'heal' | 'ward' | 'selfDamage' | 'status' | 'interrupt' | 'cleanse' | 'consume' | 'multiply' | 'spend' | 'oath' | 'repeatNext' | 'modifier' | 'cultivate' | 'summon' | 'impGuard' | 'impPower' | 'sacrificeImp' | 'removeWard' | 'healFull' | 'fragile';
    when?: 'heatConsumed'|'echoed'|'impAlive'|'impAbsent'|'regen8'|'wardRemoved'|'regen'|'poison6'|'firstFire'|'firstWater'|'belowHalf'|'enemyNoWard'|'enemyPoison'|'enemyCurse'|'startTide2'|'startWard'|'startNoWard'|'ward'|'oath'|'previousEcho';
    rule?: string;
    event?: 'heat'|'tide'|'ward'|'curse'|'impAttack'|'damage'|'heal'|'selfDamage'|'echo'|'cycle'|'poison'|'impHurt'|'oath'|'fatal';
    limit?: number;
    domainFilter?: Domain;
    onceCombat?: boolean;
    awakenOn?: 'heat'|'echo'|'poison'|'enemyPoison';
    threshold?: number;
    attunedThreshold?: number;
    awakenedDamage?: number;
    awakenedPerPoison?: number;
    criticalIf?: 'previousCost'|'lowHealth'|'poison'|'debuff'|'imp'|'regeneration';
    criticalDomain?: Domain;
    criticalMultiplier?: number;
    empoweredIf?: 'imp'|'critical';
    empoweredDomain?: Domain;
    perPoison?: number;
    echoEffectiveness?: number;
    healFraction?: number;
    splashImp?: boolean;
    oathCondition?: 'noDamage'|'damage100'|'safe';
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
    modifier?: 'poisonPower' | 'regenerationPower' | 'nextDamage' | 'nextEcho' | 'critDamage' | 'tidecallerThreshold' | 'echoPower';
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
export interface CardState { armed?:boolean; firedTick?:number; firedCombat?:boolean; awakened?:boolean; echoes?:number; rules?:string[] }
export interface CombatMemory {
    cycleDomains?: Partial<Record<Domain,number>>;
    cycleStarts?: number;
    cycleFireStarts?: number;
    previousHeat?: boolean;
    previousEcho?: boolean;
    livingFlameCycle?: number;
    rules?: Record<string,number>;
    cards?: Record<number,CardState>;
    heatConsumed?:number;
    poisonEvents?:number;
    echoCycle?:number;
    criticalCycle?:number;
    lastTrigger?: {index:number;effects:Effect[];cycle:number;eventAmount?:number};
    triggerHistory?: {index:number;effects:Effect[];cycle:number;eventAmount?:number}[];
    sequenceOath?: {index:number;condition:'noDamage'|'damage100'|'safe';remaining:number;effects:Effect[];failed:boolean};
    tidecallerThreshold?: number;
    echoPower?: number;
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
    recklessCostPending?: boolean;
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
    wardCapacity?: number;
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
        startWard?: number;
        startTide?: number;
        freeHeat?: boolean;
        spell: SpellId;
        index: number;
        remaining: number;
        totalTicks: number;
        echoPower?: number;
        instant?: boolean;
        empowered?:boolean;
        heatConsumed?:boolean;
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
    sourceSide?: "player"|"bot";
    sourceIndex?:number;
    target?: 'wizard' | 'imp' | 'ward';
    domain?: Domain;
    side: 'player' | 'bot';
    amount: number;
    critical: boolean;
    kind: 'hit' | 'dot' | 'cost';
}
export interface HealingEvent {
    sourceIndex?:number;
    target?: 'wizard' | 'imp';
    side: 'player' | 'bot';
    amount: number;
    kind: 'heal' | 'hot';
}
export interface CombatOrigin { side: 'player' | 'bot'; kind: 'spell' | 'wizard' | 'imp' | 'cycle'; index?: number; }
export interface CombatNotice {
    triggerId?: number;
    parentTriggerId?: number;
    triggerGroup?: number;
    resource?: { before:number; spent:number; after:number };
    origin?: CombatOrigin;
    index?:number;
    targetIndex?:number;
    side: 'player' | 'bot';
    status: string;
    text: string;
}
export interface CombatFrame {
    stateTick?: number;
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
    multiplayer?: { ready: boolean; waitingFor: string[]; bye: boolean };
    seed: number;
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
    augmentRerolledSlots?: number[];
    phase: 'shop' | 'result' | 'augment';
    wins: number;
    losses: number;
    battle: Battle | null;
}
export type Command = {
    type: 'reroll';
} | {
    type: 'rerollAugment';
    slot: number;
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
    subscribe?(listener: (session: Session) => void): () => void;
    cancelReady?(): Promise<Session>;
    start(difficulty?: Difficulty, seed?: number): Promise<Session>;
    execute(sessionId: string, expectedRevision: number, command: Command): Promise<Session>;
}
