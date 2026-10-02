import { expect, it, vi } from 'vitest';
import * as shop from './shop';
import { createBotStates, prepareBot, scoreBotDeck, grantBotAugment, BOT_CONFIG } from './botAI';
import { botCombatScore, orderBotDeck } from './botTactics';
import { RULES, SPELLS, validateDeck } from './engine';
import { augmentOffers } from './augments';

it('a normal seven-rival lobby includes Affliction strategy preferences', () => {
    const states = createBotStates(Array.from({ length: 7 }, (_, i) => String(i)));
    expect(Object.values(states).some(s => BOT_CONFIG.strategies[s.strategy].domains.includes('affliction'))).toBe(true);
});

it('bots reset income instead of banking previous rounds and remain deterministic', () => {
    const a = createBotStates(['a']).a, b = createBotStates(['b']).b;
    a.gold = 1000;
    const first = prepareBot(a, [], 1, 0, 'normal', 123);
    expect(first).toEqual(prepareBot(b, [], 1, 0, 'normal', 123));
    expect(a).toEqual(b);
    expect(a.gold).toBeGreaterThanOrEqual(0);
    expect(a.gold).toBeLessThanOrEqual(RULES.gold);
    expect(prepareBot(a, first, 1, 0, 'normal', 123)).toEqual(first);
});

it('trigger valuation responds to its enabler and rewards progress toward real upgrades', () => {
    const incremental = (enabler: string) => scoreBotDeck(['backdraft', enabler], 0) - scoreBotDeck([enabler], 0);
    expect(incremental('healing-seed')).toBeGreaterThan(incremental('spark'));
    expect(scoreBotDeck(['ice-shard'], 0, [2])).toBeGreaterThan(scoreBotDeck(['ice-shard'], 0, [1]));
    expect(scoreBotDeck(['ice-shard'], 0, [3])).toBeGreaterThan(scoreBotDeck(['ice-shard'], 0, [2]));
});

it('ordering preserves every copy, its XP and age, and improves a misplaced trigger build', () => {
    const input = { deck: ['spark', 'whirlpool', 'healing-seed', 'backdraft'], xp: [0, 1, 3, 2], acquired: [4, 2, 0, 3], augments: ['resonance'], level: 3 };
    const before = JSON.stringify(input), ordered = orderBotDeck(input);
    const copies = (b: typeof input) => b.deck.map((id, i) => `${id}:${b.xp[i]}:${b.acquired[i]}`).sort();
    expect(copies(ordered)).toEqual(copies(input));
    expect(JSON.stringify(input)).toBe(before);
    expect(botCombatScore(ordered)).toBeGreaterThan(botCombatScore(input));
    expect(orderBotDeck(input)).toEqual(ordered);
});

it('bots choose only offered augments and cannot gain a reward twice', () => {
    const state = createBotStates(['a']).a;
    const deck = prepareBot(state, [], 1, 0, 'normal', 22);
    const offers = augmentOffers(2, [], 22);
    grantBotAugment(state, deck, 2, 0, 22);
    expect(offers).toContain(state.augments[0]);
    grantBotAugment(state, deck, 2, 0, 22);
    expect(state.augments).toHaveLength(1);
});

it('a shopping run retains legal decks, upgrades and nonnegative gold', () => {
    const state = createBotStates(['a']).a;
    let deck: string[] = [];
    for (let round = 1; round <= 10; round++) {
        deck = prepareBot(state, deck, round, 3, 'normal', 42);
        expect(() => validateDeck(deck)).not.toThrow();
        expect(state.spellXp.every(x => x >= 0 && x <= 3)).toBe(true);
        expect(new Set(state.spellAcquired).size).toBe(deck.length);
        expect(state.gold).toBeGreaterThanOrEqual(0);
        grantBotAugment(state, deck, round, 3, 42);
    }
});

it('replacement purchases receive the regular refund and consume the offer once', () => {
    const state = createBotStates(['a']).a;
    const deck = Array(6).fill('wrath');
    state.spellXp = Array(6).fill(0);
    state.spellAcquired = [0, 1, 2, 3, 4, 5];
    const offers = vi.spyOn(shop, 'offersFor').mockReturnValue({ shop: [] }).mockReturnValueOnce({ shop: ['backdraft'] });
    try {
        const result = prepareBot(state, deck, 4, 0, 'normal', 1);
        expect(result.filter(id => id === 'backdraft')).toHaveLength(1);
        expect(state.gold).toBe(RULES.gold - SPELLS.backdraft.price + RULES.sellGold - 4 * RULES.rerollGold);
    } finally { offers.mockRestore(); }
});
