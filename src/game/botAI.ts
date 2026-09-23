import { cardAges, attunedDomains, effectEnabled } from './attunement';
import config from '../config/bots.json';
import { cardAt, deckXp, UPGRADE_XP } from './upgrades';
import { AUGMENTS, augmentOffers } from './augments';
import { canAddSpell, fighter, RULES, SPELLS } from './engine';
import { offersFor, rerollCost } from './shop';
import type { Difficulty, SpellId } from './model';
export const BOT_CONFIG = config;
export type BotState = {
    spellXp: number[];
    spellAcquired: number[];
    nextAcquisition: number;
    gold: number;
    strategy: number;
    augments: string[];
    lastPreparedRound: number;
    lastRewardRound: number;
};
export type BotStates = Record<string, BotState>;
export function createBotStates(ids: string[]): BotStates { return Object.fromEntries(ids.map((id, i) => [id, { spellXp: [], spellAcquired: [], nextAcquisition: 0, gold: 0, strategy: i % config.strategies.length, augments: [], lastPreparedRound: 0, lastRewardRound: 0 }])); }
export function scoreBotDeck(deck: SpellId[], strategy: number, xp: number[] = [], acquired: number[] = []): number {
    const profile = config.strategies[strategy];
    const attuned = attunedDomains(deck, acquired);
    return deck.reduce((sum, id, index) => {
        const c = cardAt(id, xp[index]);
        let value = 0;
        for (const e of c.combat?.effects ?? []) {
            if (!effectEnabled(e, attuned))
                continue;
            const amount = e.bonusDomain && attuned.includes(e.bonusDomain) ? e.attunedAmount ?? e.amount ?? 0 : e.amount ?? 0;
            if (e.kind === 'damage')
                value += amount + (e.empowered && attuned.includes('fire') && deck.some(x => SPELLS[x].keywords.includes('heat')) ? 40 : 0);
            if (e.kind === 'heal' || e.kind === 'ward')
                value += amount * .6;
            if(e.kind==='healFull') value += 120; // One-use recovery, rather than repeatable healing.
            if (e.kind === 'status')
                value += amount * (e.status === 'poison' ? 12 : e.status === 'regeneration' ? 8 : e.status === 'heat' || e.status === 'tide' ? 15 : 12);
            if (e.kind === 'summon') value += (e.currentHealthFraction ? 150 * amount : amount) * .8;
            if (e.kind === 'growImp' && deck.some(id=>cardAt(id).combat?.effects?.some(effect=>effect.kind==='summon'))) value += amount * .8;
            if (e.kind === 'removeWard') value += 35;
            if (['impGuard','impPower','sacrificeImp'].includes(e.kind) && deck.some(id=>cardAt(id).combat?.effects?.some(effect=>effect.kind==='summon'))) value += e.kind==='impPower'?amount*3:50;
            if (['consume', 'spend', 'multiply', 'oath', 'repeatNext', 'interrupt', 'modifier', 'cultivate', 'retrigger', 'sequenceOath'].includes(e.kind))
                value += 40;
            if (['trigger','awaken','rule'].includes(e.kind)) value += 65;
            if (e.kind === 'selfDamage')
                value -= amount * .4;
        }
        return sum + value / Math.max(1, c.castTicks ?? 1) + (xp[index] ?? 0) % 3 * 8 + (profile.domains.includes(c.domain) ? 8 : 0);
    }, 0);
}
export function grantBotAugment(state: BotState, _deck: SpellId[], round: number, index: number, runSeed = RULES.seed) {
    if (round % RULES.augmentEvery || state.lastRewardRound >= round)
        return;
    const offers = augmentOffers(round, state.augments, runSeed + index * 101);
    offers.sort((a, b) => { const score = (id: string) => { const a = AUGMENTS[id]; return 5 + (a.category === 'sequence' ? 2 : 0); }; return score(b) - score(a); });
    if (offers[0])
        state.augments.push(offers[0]);
    state.lastRewardRound = round;
}
export function prepareBot(state: BotState, previous: SpellId[], round: number, index: number, difficulty: Difficulty, runSeed = RULES.seed): SpellId[] {
    if (state.lastPreparedRound === round)
        return [...previous];
    const level = config.difficulties[difficulty];
    state.gold += RULES.gold + (state.augments.includes('deep-pockets') ? 3 : 0) + (round >= level.advantageStartsRound ? level.bonusGoldPerRound : 0);
    let deck = [...previous], xp = deckXp(deck, state.spellXp), ages = cardAges(deck, state.spellAcquired);
    state.nextAcquisition = Math.max(state.nextAcquisition, ...ages.map(n => n + 1));
    const target = Math.min(RULES.slots, config.deck.openingSize + (round - 1) * config.deck.cardsPerRound);
    for (let roll = 0; roll < level.shoppingRolls; roll++) {
        const fee = roll === 0 ? 0 : rerollCost(state.augments, roll - 1);
        if (state.gold < fee)
            break;
        state.gold -= fee;
        const offers = offersFor(round, roll + index * 101, deck, state.augments, runSeed).shop;
        for (const id of offers) {
            if (SPELLS[id].price > state.gold)
                continue;
            let best: {
                deck: string[];
                xp: number[];
                gain: number;
            } | null = null;
            const before = scoreBotDeck(deck, state.strategy, xp, ages);
            const consider = (next: string[], nextXp: number[]) => {
                const gain = scoreBotDeck(next, state.strategy, nextXp, next.map((id, i) => id === deck[i] ? ages[i] : state.nextAcquisition)) - before;
                if (!best || gain > best.gain)
                    best = { deck: next, xp: nextXp, gain };
            };
            if (deck.length < target && canAddSpell(deck, id))
                consider([...deck, id], [...xp, 0]);
            deck.forEach((owned, i) => {
                if (owned === id && xp[i] < UPGRADE_XP) {
                    const next = [...xp];
                    next[i] = Math.min(3, next[i] + 1);
                    consider([...deck], next);
                }
                else if (canAddSpell(deck.filter((_, at) => at !== i), id)) {
                    const next = [...deck], nextXp = [...xp];
                    next[i] = id;
                    nextXp[i] = 0;
                    consider(next, nextXp);
                }
            });
            const choice = best as {
                deck: string[];
                xp: number[];
                gain: number;
            } | null;
            if (choice && choice.gain > 0) {
                ages = choice.deck.map((id, i) => id === deck[i] ? ages[i] : state.nextAcquisition++);
                deck = choice.deck;
                xp = choice.xp;
                state.gold -= SPELLS[id].price;
            }
        }
    }
    if (!deck.length) {
        deck = ['wrath'];
        xp = [0];
        ages = [state.nextAcquisition++];
        state.gold -= SPELLS.wrath.price;
    }
    const priority = (id: string) => { const e = SPELLS[id].combat?.effects ?? []; return e.some(e => ['sequenceOath','trigger','rule'].includes(e.kind)) ? 0 : e.some(e => e.kind === 'status') ? 1 : e.some(e => e.kind === 'consume' || e.empowered) ? 3 : 2; };
    const ordered = deck.map((id, i) => ({ id, xp: xp[i], age: ages[i] })).sort((a, b) => priority(a.id) - priority(b.id));
    state.spellXp = ordered.map(x => x.xp);
    state.spellAcquired = ordered.map(x => x.age);
    state.lastPreparedRound = round;
    return ordered.map(x => x.id);
}
export function botFighter(name: string, deck: SpellId[], state: BotState, level = 1) { return fighter(name, deck, state.augments, state.spellXp, state.spellAcquired, level); }
