import { CARD_BY_ID, KEYWORDS, type Domain } from '../config/catalogue';
import settings from '../config/rules.json';
import type { Effect } from './model';

export const DOMAIN_COLORS: Record<Domain, string> = {
    nature: '#81cf68', water: '#64c9ef', fire: '#ff7864', holy: '#edc565', affliction: '#bf8feb',
};
export const DOMAIN_INK: Record<Domain, string> = {
    nature: '#286721', water: '#075b83', fire: '#a52b20', holy: '#765000', affliction: '#713592',
};
export const KEYWORD_DOMAINS: Record<string, Domain> = {
    poison: 'nature', regeneration: 'nature', heat: 'fire', tide: 'water',
    oath: 'holy', frailty: 'affliction', curse: 'affliction', repetition: 'affliction',
};
export function cardAges(deck: readonly string[], ages: readonly number[] = []): number[] {
    return deck.map((_, i) => ages[i] ?? i);
}
/** Count first; the oldest surviving card breaks ties independently of cast order. */
export function attunementRanking(deck: readonly string[], ages: readonly number[] = []) {
    const order = cardAges(deck, ages);
    const ranks = new Map<Domain, { domain: Domain; count: number; oldest: number }>();
    deck.forEach((id, i) => {
        const domain = CARD_BY_ID[id].domain;
        const rank = ranks.get(domain) ?? { domain, count: 0, oldest: order[i] };
        rank.count++;
        rank.oldest = Math.min(rank.oldest, order[i]);
        ranks.set(domain, rank);
    });
    return [...ranks.values()].sort((a, b) => b.count - a.count || a.oldest - b.oldest || a.domain.localeCompare(b.domain));
}
export const attunedDomains = (deck: readonly string[], ages: readonly number[] = []) =>
    attunementRanking(deck, ages).slice(0, settings.maxDomains).map(r => r.domain);

export function effectDomain(effect: Effect): Domain | undefined {
    if (effect.requiresAttunement) return effect.requiresAttunement;
    if (['status', 'consume', 'multiply', 'spend'].includes(effect.kind)) return KEYWORD_DOMAINS[effect.status ?? ''];
    if (effect.kind === 'oath') return 'holy';
    return undefined;
}
export function effectEnabled(effect: Effect, domains: readonly Domain[]) {
    const required = effectDomain(effect);
    return !required || domains.includes(required);
}
/** Includes conditional bonuses and nested payoffs so inspection matches execution. */
export function requiredDomains(effects: readonly Effect[]): Domain[] {
    const required = new Set<Domain>();
    for (const effect of effects) {
        const domain = effectDomain(effect);
        if (domain) required.add(domain);
        if (effect.bonusDomain) required.add(effect.bonusDomain);
        if (effect.empowered !== undefined) required.add('fire');
        if (effect.condition === 'poison') required.add('nature');
        if (effect.condition === 'oath') required.add('holy');
        const statusDomain = KEYWORD_DOMAINS[effect.perStatus?.replace('enemy:', '') ?? ''];
        if (statusDomain) required.add(statusDomain);
        requiredDomains(effect.effects ?? []).forEach(d => required.add(d));
    }
    return [...required];
}
export function keywordDomain(word: string): Domain | undefined {
    const lower = word.toLowerCase();
    if (lower in DOMAIN_COLORS) return lower as Domain;
    return Object.entries(KEYWORD_DOMAINS).find(([id]) =>
        [KEYWORDS[id]?.name, ...(KEYWORDS[id]?.aliases ?? [])].some(name => name?.toLowerCase() === lower))?.[1];
}
