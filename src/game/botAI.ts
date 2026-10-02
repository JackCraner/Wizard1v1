import { cardAges, attunedDomains, effectEnabled } from './attunement';
import config from '../config/bots.json';
import { cardAt, deckXp, UPGRADE_XP } from './upgrades';
import { AUGMENTS, augmentOffers, shopIncome, trashRefund } from './augments';
import { botCombatScore, orderBotDeck } from './botTactics';
import { canAddSpell, fighter, RULES, SPELLS } from './engine';
import { offersFor, rerollCost } from './shop';
import type { Difficulty, SpellId, Effect } from './model';
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
export function createBotStates(ids: string[]): BotStates { return Object.fromEntries(ids.map((id, i) => [id, { spellXp: [], spellAcquired: [], nextAcquisition: 0, gold: 0, strategy: Math.round(i * (config.strategies.length - 1) / Math.max(1, ids.length - 1)), augments: [], lastPreparedRound: 0, lastRewardRound: 0 }])); }
export function scoreBotDeck(deck: SpellId[], strategy: number, xp: number[] = [], acquired: number[] = [], augments: string[] = []): number {
    const profile = config.strategies[strategy];
    const attuned = attunedDomains(deck, acquired);
    const cards = deck.map((id, i) => cardAt(id, xp[i]));
    const effects = cards.flatMap(c => c.combat?.effects ?? []).filter(e => effectEnabled(e, attuned));
    const has = (kind: Effect['kind'], status?: string) => effects.some(e => e.kind === kind && (!status || e.status === status));
    const events: Partial<Record<NonNullable<Effect['event']>, number>> = {
        damage: has('damage') ? 2 : .3, heal: has('heal') || has('status', 'regeneration') ? 2 : .2,
        selfDamage: has('selfDamage') ? 2 : 0, tide: cards.some(c => c.domain === 'water') ? 1.5 : 0,
        heat: cards.some(c => c.domain === 'fire') ? 1 : 0, echo: cards.some(c => c.domain === 'water') ? 1.5 : 0,
        curse: has('status', 'curse') ? 2 : 0, ward: has('ward') ? 1 : 0,
        impAttack: has('impPower') ? 2 : 0, impHurt: has('summon') ? 1 : 0,
        poison: has('status', 'poison') ? 2 : 0, oath: has('sequenceOath') ? 1 : 0, cycle: 1, fatal: .3,
    };
    const effectValue = (items: Effect[]): number => {
        let value = 0;
        for (const e of items) {
            if (!effectEnabled(e, attuned))
                continue;
            const amount = e.bonusDomain && attuned.includes(e.bonusDomain) ? e.attunedAmount ?? e.amount ?? 0 : e.amount ?? 0;
            if (e.kind === 'damage')
                value += amount + (e.empowered && attuned.includes('fire') && deck.some(x => SPELLS[x].keywords.includes('heat')) ? 40 : 0);
            if (e.kind === 'heal' || e.kind === 'ward')
                value += amount * .6;
            if(e.kind==='healFull') value += 120; // One-use recovery, rather than repeatable healing.
            if (e.kind === 'status')
                value += amount * (e.status === 'poison' ? (augments.includes('super-poison') ? 20 : 10) : e.status === 'regeneration' ? 6 : e.status === 'heat' || e.status === 'tide' ? 15 : e.status === 'slow' ? 28 : 12);
            if (e.kind === 'summon') value += (e.currentHealthFraction ? 150 * amount : amount) * .8;
            if (e.kind === 'growImp' && deck.some(id=>cardAt(id).combat?.effects?.some(effect=>effect.kind==='summon'))) value += amount * .8;
            if (e.kind === 'removeWard') value += 35;
            if (['impGuard','impPower','sacrificeImp'].includes(e.kind) && deck.some(id=>cardAt(id).combat?.effects?.some(effect=>effect.kind==='summon'))) value += e.kind==='impPower'?amount*3:50;
            if (['consume', 'spend', 'multiply', 'oath', 'repeatNext', 'interrupt', 'modifier', 'cultivate', 'retrigger', 'sequenceOath'].includes(e.kind))
                value += 40;
            if (e.kind === 'trigger') value += effectValue(e.effects ?? []) * (events[e.event ?? 'cycle'] ?? 0) * (augments.includes('resonance') ? 1.25 : 1);
            if (e.kind === 'awaken') value += effectValue(e.effects ?? []) * .6 + (e.awakenedDamage ?? 0) * .4;
            if (e.kind === 'rule') value += 40 + (e.rule?.toLowerCase().includes('echo') && cards.some(c => c.domain === 'water') ? 35 : 0);
            if (e.kind === 'selfDamage')
                value -= amount * .4;
        }
        return value;
    };
    return deck.reduce((sum, id, index) => {
        const c = cards[index];
        const ticks = Math.max(1, c.castDomain && !attuned.includes(c.castDomain) ? c.unattunedCastTicks ?? c.castTicks ?? 1 : c.castTicks ?? 1);
        const current = effectValue(c.combat?.effects ?? []) / ticks;
        const upgraded = cardAt(id, UPGRADE_XP);
        const future = effectValue(upgraded.combat?.effects ?? []) / Math.max(1, upgraded.castTicks ?? 1);
        // Credit progress toward the actual upgrade rather than a flat XP bonus.
        const progress = (xp[index] ?? 0) < UPGRADE_XP ? Math.max(0, future - current) * (xp[index] ?? 0) / UPGRADE_XP : 0;
        return sum + current + progress + (profile.domains.includes(c.domain) ? 8 : 0);
    }, 0);
}
export function grantBotAugment(state: BotState, deck: SpellId[], round: number, index: number, runSeed = RULES.seed) {
    if (round % RULES.augmentEvery || state.lastRewardRound >= round)
        return;
    const offers = augmentOffers(round, state.augments, runSeed + index * 101);
    const scores = new Map(offers.map(id => [id, botCombatScore({ deck, xp: state.spellXp, acquired: state.spellAcquired, augments: [...state.augments, id], level: 1 + Math.floor(round / RULES.augmentEvery) }) + (AUGMENTS[id].category === 'economy' ? .12 : 0)]));
    offers.sort((a, b) => scores.get(b)! - scores.get(a)!);
    if (offers[0])
        state.augments.push(offers[0]);
    state.lastRewardRound = round;
}
export function prepareBot(state: BotState, previous: SpellId[], round: number, index: number, difficulty: Difficulty, runSeed = RULES.seed): SpellId[] {
    if (state.lastPreparedRound === round)
        return [...previous];
    const level = config.difficulties[difficulty];
    state.gold = shopIncome(state.augments) + (round >= level.advantageStartsRound ? level.bonusGoldPerRound : 0);
    let deck = [...previous], xp = deckXp(deck, state.spellXp), ages = cardAges(deck, state.spellAcquired);
    state.nextAcquisition = Math.max(state.nextAcquisition, ...ages.map(n => n + 1));
    const target = Math.min(RULES.slots, config.deck.openingSize + (round - 1) * config.deck.cardsPerRound);
    for (let roll = 0; roll < level.shoppingRolls; roll++) {
        const fee = roll === 0 ? 0 : rerollCost(state.augments, roll - 1);
        if (state.gold < fee)
            break;
        state.gold -= fee;
        const offers = offersFor(round, roll + index * 101, deck, state.augments, runSeed).shop;
        // Compare all visible purchases before spending, then re-evaluate the remaining offers.
        while (offers.length) {
            type Purchase = { offer: number; deck: string[]; xp: number[]; gain: number; refund: number; value: number };
            let best: Purchase | null = null;
            const before = scoreBotDeck(deck, state.strategy, xp, ages, state.augments);
            offers.forEach((id, offer) => {
                // Buy first, then merge/sell, exactly as the player's temporary bench permits.
                if (SPELLS[id].price > state.gold) return;
                const consider = (next: string[], nextXp: number[]) => {
                    const gain = scoreBotDeck(next, state.strategy, nextXp, next.map((id, i) => id === deck[i] ? ages[i] : state.nextAcquisition), state.augments) - before;
                    const replaced = deck.findIndex((id, i) => id !== next[i]);
                    const refund = replaced >= 0 ? trashRefund(state.augments, SPELLS[deck[replaced]].price) : 0;
                    const value = gain / Math.max(1, SPELLS[id].price - refund);
                    if (gain > 0 && (!best || value > best.value)) best = { offer, deck: next, xp: nextXp, gain, refund, value };
                };
                if (deck.length < target && canAddSpell(deck, id)) consider([...deck, id], [...xp, 0]);
                deck.forEach((owned, i) => {
                    if (owned === id && xp[i] < UPGRADE_XP) {
                        const next = [...xp]; next[i]++;
                        consider([...deck], next);
                    } else if (canAddSpell(deck.filter((_, at) => at !== i), id)) {
                        const next = [...deck], nextXp = [...xp]; next[i] = id; nextXp[i] = 0;
                        consider(next, nextXp);
                    }
                });
            });
            const choice = best as Purchase | null;
            if (!choice) break;
            const [id] = offers.splice(choice.offer, 1);
            ages = choice.deck.map((id, i) => id === deck[i] ? ages[i] : state.nextAcquisition++);
            deck = choice.deck;
            xp = choice.xp;
            state.gold += choice.refund - SPELLS[id].price;
        }
    }
    if (!deck.length) {
        deck = ['wrath'];
        xp = [0];
        ages = [state.nextAcquisition++];
        state.gold -= SPELLS.wrath.price;
    }
    const ordered = orderBotDeck({ deck, xp, acquired: ages, augments: state.augments, level: 1 + Math.floor((round - 1) / RULES.augmentEvery) });
    state.spellXp = ordered.xp;
    state.spellAcquired = ordered.acquired;
    state.lastPreparedRound = round;
    return ordered.deck;
}
export function botFighter(name: string, deck: SpellId[], state: BotState, level = 1) { return fighter(name, deck, state.augments, state.spellXp, state.spellAcquired, level); }
