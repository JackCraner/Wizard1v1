import { fighter, simulate, RULES } from './engine';
import { cardAt } from './upgrades';

export type BotLoadout = { deck: string[]; xp: number[]; acquired: number[]; augments: string[]; level: number };

// Small, public practice archetypes, never the next opponent's hidden purchases.
const practiceDecks = [
    ['spark', 'firebolt', 'backdraft', 'healing-seed', 'blaze', 'pyroblast'],
    ['toxic-growth', 'healing-seed', 'undercurrent', 'storm', 'mist', 'leech'],
];

/** Win outcome plus a health-margin tie breaker: surviving to the limit can be a valid plan. */
export function botCombatScore(loadout: BotLoadout): number {
    if (!loadout.deck.length) return -10;
    const healthScale = RULES.health + (loadout.level - 1) * RULES.healthPerLevel;
    const upgrades = loadout.xp.filter(xp => xp >= 3).length;
    return practiceDecks.reduce((sum, deck) => {
        const size = Math.min(RULES.slots, loadout.deck.length);
        const enemy = deck.slice(0, size);
        const battle = simulate(
            fighter('bot', loadout.deck, loadout.augments, loadout.xp, loadout.acquired, loadout.level),
            fighter('practice', enemy, [], enemy.map((_, slot) => slot < upgrades ? 3 : 0), [], loadout.level),
        );
        const last = battle.frames.at(-1)!;
        const result = battle.outcome === 'victory' ? 1 : battle.outcome === 'draw' ? .5 : 0;
        // Fixed weighting avoids a build choosing which practice opponent matters most.
        return sum + (result + .2 * (last.player.health - last.bot.health) / healthScale) / practiceDecks.length;
    }, 0);
}

/** Bounded local search; card XP and acquisition age always move with the card. */
export function orderBotDeck(loadout: BotLoadout): BotLoadout {
    let best = { ...loadout, deck: [...loadout.deck], xp: [...loadout.xp], acquired: [...loadout.acquired] };
    let score = botCombatScore(best);
    const evaluate = (order: number[]) => {
        const candidate = { ...best, deck: order.map(i => best.deck[i]), xp: order.map(i => best.xp[i]), acquired: order.map(i => best.acquired[i]) };
        const next = botCombatScore(candidate);
        if (next > score + 1e-8) { best = candidate; score = next; }
    };
    const indices = best.deck.map((_, i) => i);
    const setup = (i: number) => cardAt(best.deck[i], best.xp[i]).combat?.effects?.some(e => ['trigger', 'rule', 'sequenceOath'].includes(e.kind)) ? 0 : 1;
    evaluate([...indices].sort((a, b) => setup(a) - setup(b)));
    // Try every card in the lead, then adjacent swaps for enabler/payoff sequencing.
    for (let i = 1; i < indices.length; i++) evaluate([i, ...indices.filter(n => n !== i)]);
    for (let i = 0; i + 1 < indices.length; i++) {
        const order = [...indices];
        [order[i], order[i + 1]] = [order[i + 1], order[i]];
        evaluate(order);
    }
    return best;
}
