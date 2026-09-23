import { attunedDomains } from './attunement';
import { goldCost, CARDS } from '../config/catalogue';
import settings from '../config/rules.json';
import { deckXp, validateXp } from './upgrades';
import { validateAugments } from './augments';
import type { Fighter, Spell, SpellId, Stats } from './model';
export const RULES = settings;
export const SPELLS: Record<string, Spell> = Object.fromEntries(CARDS.map(c => [c.id, { ...c, price: goldCost(c), description: c.rules }]));
export const PLAYABLE_SPELLS = CARDS.filter(c => c.combat?.effects && !c.combat.blockedReason).map(c => c.id);
export const deckDomains = (deck: readonly string[]) => [...new Set(deck.map(id => SPELLS[id]?.domain).filter(Boolean))];
export function domainProgress(deck: readonly string[]) { return deckDomains(deck).map(domain => ({ domain, count: deck.filter(id => SPELLS[id].domain === domain).length })).sort((a, b) => b.count - a.count); }
export const canOfferSpell = (_deck: readonly string[], id: string) => PLAYABLE_SPELLS.includes(id);
export function spellAddReason(deck: readonly string[], id: string): string | null {
    if (!canOfferSpell(deck, id))
        return 'Spell unavailable.';
    return SPELLS[id].keywords.includes('unique') && deck.includes(id) ? 'Unique: only one copy may be held. Merge a duplicate to upgrade.' : null;
}
export const canAddSpell = (deck: readonly string[], id: string) => spellAddReason(deck, id) === null;
export function validateDeck(deck: readonly string[]) {
    if (!deck.length || deck.length > RULES.slots || deck.some(id => !PLAYABLE_SPELLS.includes(id)))
        throw new Error('Loadout contains an unavailable spell or invalid slot count.');
    if (deck.some((id, i) => SPELLS[id].keywords.includes('unique') && deck.indexOf(id) !== i))
        throw new Error('Unique spell duplicated.');
}
export function channelPower(deck: readonly string[], index: number) {
    let first = index, last = index;
    while (first > 0 && deck[first - 1] === deck[index])
        first--;
    while (last + 1 < deck.length && deck[last + 1] === deck[index])
        last++;
    const groupStart = first + Math.floor((index - first) / 3) * 3;
    return Math.min(3, last - groupStart + 1);
}
export function deriveStats(augments: readonly string[] = [], level = 1): Stats { return { health: RULES.health + (level - 1) * RULES.healthPerLevel - (augments.includes('glass-cannon') ? 125 : 0) + (augments.includes('monster') ? 200 + (level - 1) * 100 : 0) }; }
export function fighter(name: string, spells: SpellId[], augments: string[] = [], xp: number[] = [], acquired: number[] = [], level = 1): Fighter {
    validateDeck(spells);
    validateXp(spells, xp);
    validateAugments(augments);
    const { health } = deriveStats(augments, level);
    return { name, level, attuned: attunedDomains(spells, acquired), spellAcquired: [...acquired], spells: [...spells], spellXp: deckXp(spells, xp), augments: [...augments], health, maxHealth: health, shield: 0, statuses: {}, cursor: 0, cycle: 1, reshuffleRemaining: 0, casting: null, memory: { casts: 0, water: 0, fast: 0, fastStreak: 0, cycleCasts: 0 } };
}
export const NEGATIVE_STATUSES = ['poison','slow','trap','curse'];
export { simulate } from './combatSimulation';
