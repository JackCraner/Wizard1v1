import catalogue from '../config/augments.json';
export const AUGMENTS = Object.fromEntries(catalogue.map(a => [a.id, a]));
export function validateAugments(ids: readonly string[]) {
    if (new Set(ids).size !== ids.length || ids.some(id => !AUGMENTS[id]))
        throw new Error('Invalid augments.');
}
export function augmentOffers(round: number, owned: readonly string[], seed = 42): string[] {
    validateAugments(owned);
    let state = (seed ^ Math.imul(round, 7919)) >>> 0;
    const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    const pool = catalogue.filter(a => !owned.includes(a.id));
    const choices: string[] = [], categories = new Set<string>();
    while (choices.length < 3 && pool.length) {
        const fresh = pool.filter(a => !categories.has(a.category));
        const candidates = fresh.length ? fresh : pool;
        const choice = candidates[Math.floor(random() * candidates.length)];
        choices.push(choice.id);
        categories.add(choice.category);
        pool.splice(pool.indexOf(choice), 1);
    }
    return choices;
}
export const rerollCost = (augments: readonly string[], rerolls: number) => augments.includes('scavenger') && rerolls < 2 ? 0 : 1;
export const shopIncome = (augments: readonly string[]) => 10 + (augments.includes('deep-pockets') ? 3 : 0);

export const trashRefund = (augments: readonly string[], stars: number) => augments.includes('recycler') ? Math.floor(stars * .8) : 0;
