import { CARDS, type Domain } from '../config/catalogue';
import settings from '../config/rules.json';
import statusRules from '../config/statuses.json';
import { cloneSnapshot } from './clone';
import { cardAt, deckXp, validateXp } from './upgrades';
import { validateAugments } from './augments';
import type { Battle, CastEvent, CombatFrame, DamageEvent, Effect, Fighter, HealingEvent, Spell, SpellId, Stats } from './model';
export const RULES = settings;
export const SPELLS: Record<string, Spell> = Object.fromEntries(CARDS.map(c => [c.id, { ...c, price: c.stars, description: c.rules }]));
export const PLAYABLE_SPELLS = CARDS.filter(c => c.combat?.effects && !c.combat.blockedReason).map(c => c.id);
export const deckDomains = (deck: readonly string[]) => [...new Set(deck.map(id => SPELLS[id]?.domain).filter(Boolean))];
export function domainProgress(deck: readonly string[]) { return deckDomains(deck).map(domain => ({ domain, count: deck.filter(id => SPELLS[id].domain === domain).length })).sort((a, b) => b.count - a.count); }
export const canOfferSpell = (_deck: readonly string[], id: string) => PLAYABLE_SPELLS.includes(id);
export function spellAddReason(deck: readonly string[], id: string): string | null { if (!canOfferSpell(deck, id))
    return 'Spell unavailable.'; return SPELLS[id].keywords.includes('unique') && deck.includes(id) ? 'Unique: only one copy may be held. Merge a duplicate to upgrade.' : null; }
export const canAddSpell = (deck: readonly string[], id: string) => spellAddReason(deck, id) === null;
export function validateDeck(deck: readonly string[]) { if (!deck.length || deck.length > RULES.slots || deck.some(id => !PLAYABLE_SPELLS.includes(id)))
    throw new Error('Loadout contains an unavailable spell or invalid slot count.'); if (deck.some((id, i) => SPELLS[id].keywords.includes('unique') && deck.indexOf(id) !== i))
    throw new Error('Unique spell duplicated.'); }
export function channelPower(deck: readonly string[], index: number) { let first = index, last = index; while (first > 0 && deck[first - 1] === deck[index])
    first--; while (last + 1 < deck.length && deck[last + 1] === deck[index])
    last++; return last - first + 1; }
export function deriveStats(augments: readonly string[] = []): Stats { return { health: augments.includes('glass-cannon') ? 375 : RULES.health }; }
export function fighter(name: string, spells: SpellId[], augments: string[] = [], xp: number[] = []): Fighter {
    validateDeck(spells);
    validateXp(spells, xp);
    validateAugments(augments);
    const { health } = deriveStats(augments);
    return { name, spells: [...spells], spellXp: deckXp(spells, xp), augments: [...augments], health, maxHealth: health, shield: 0, statuses: {}, cursor: 0, cycle: 1, reshuffleRemaining: 0, casting: null, memory: { casts: 0, water: 0, fast: 0, fastStreak: 0, cycleCasts: 0 } };
}
type Side = 'player' | 'bot';
const sides: Side[] = ['player', 'bot'];
const opposite = (side: Side): Side => side === 'player' ? 'bot' : 'player';
const negative = ['poison', 'slow', 'frailty', 'repetition'];
/** Deterministic tick simulation. All completed spells land together, including lethal hits. */
export function simulate(player: Fighter, bot: Fighter, _seed = RULES.seed): Battle {
    const f = { player: cloneSnapshot(player), bot: cloneSnapshot(bot) };
    for (const unit of Object.values(f)) {
        validateDeck(unit.spells);
        validateXp(unit.spells, unit.spellXp);
        validateAugments(unit.augments);
    }
    const frames: CombatFrame[] = [];
    let events: CastEvent[] = [], damageEvents: DamageEvent[] = [], healingEvents: HealingEvent[] = [], notices: NonNullable<CombatFrame['notices']> = [], messages: string[] = [];
    let hits: {
        side: Side;
        amount: number;
        kind: DamageEvent['kind'];
        domain?: Domain;
    }[] = [];
    const has = (side: Side, id: string) => f[side].augments.includes(id);
    const notify = (side: Side, status: string, text: string) => notices.push({ side, status, text });
    const addStatus = (side: Side, status: string, amount: number) => { if (amount > 0)
        f[side].statuses[status] = (f[side].statuses[status] ?? 0) + Math.round(amount); };
    const heal = (side: Side, amount: number, kind: HealingEvent['kind'] = 'heal') => { const value = Math.min(f[side].maxHealth - f[side].health, Math.max(0, Math.round(amount))); f[side].health += value; if (value)
        healingEvents.push({ side, amount: value, kind }); };
    const power = (side: Side, domain: Domain) => { const count = f[side].spells.filter(id => SPELLS[id].domain === domain).length; return count >= RULES.mastery ? 1.2 : count >= RULES.affinity ? 1.1 : 1; };
    const queue = (side: Side, amount: number, kind: DamageEvent['kind'] = 'hit', domain?: Domain) => { if (amount > 0)
        hits.push({ side, amount: Math.round(amount), kind, domain }); };
    const applyHits = () => {
        const totals = { player: 0, bot: 0 };
        for (const h of hits) {
            const unit = f[h.side];
            let amount = h.amount;
            if (h.kind !== 'cost') {
                if (unit.statuses.frailty)
                    amount = Math.round(amount * 1.2);
                const absorbed = Math.min(unit.shield, amount);
                unit.shield -= absorbed;
                amount -= absorbed;
                if (absorbed)
                    notify(h.side, 'ward', 'Ward absorbed ' + absorbed);
            }
            if (amount) {
                totals[h.side] += amount;
                damageEvents.push({ ...h, amount, critical: false });
            }
        }
        for (const side of sides) {
            const unit = f[side];
            unit.health = Math.max(0, unit.health - totals[side]);
            if (totals[side] > 0 && unit.health > 0 && unit.health <= unit.maxHealth * .3 && has(side, 'second-wind') && !secondWind.has(side)) {
                secondWind.add(side);
                heal(side, 120);
                notify(side, 'regeneration', 'Second Wind: heal 120');
            }
        }
        hits = [];
    };
    const secondWind = new Set<Side>();
    const startCycle = (side: Side) => { const unit = f[side]; unit.memory.cycleCasts = 0; unit.memory.oathCompleted = false; if (has(side, 'verdant-cycle'))
        addStatus(side, 'regeneration', 3); };
    const advance = (side: Side) => { const unit = f[side]; unit.casting = null; unit.cursor++; if (unit.cursor >= unit.spells.length) {
        unit.cursor = 0;
        unit.reshuffleRemaining = has(side, 'reckless-loop') ? 0 : RULES.reshuffleTicks;
        if (!unit.reshuffleRemaining) {
            unit.cycle++;
            startCycle(side);
            queue(side, 25, 'cost');
            if (has(side, 'blood-magic'))
                unit.memory.nextBonus = 50;
            notify(side, 'cycle', 'Reckless Loop: lose 25 Health');
        }
    } };
    const snapshot = (tick: number, tickStart?: CombatFrame): CombatFrame => ({ tick, player: cloneSnapshot(f.player), bot: cloneSnapshot(f.bot), events: cloneSnapshot(events), damageEvents: cloneSnapshot(damageEvents), healingEvents: cloneSnapshot(healingEvents), notices: cloneSnapshot(notices), messages: [...messages], ...(tickStart ? { tickStart } : {}) });
    for (const side of sides) {
        if (has(side, 'reservoir'))
            addStatus(side, 'tide', 3);
        startCycle(side);
    }
    messages = ['Cast left to right. One tick to reshuffle.'];
    frames.push(snapshot(0));
    for (let tick = 1; tick <= RULES.maxTicks; tick++) {
        events = [];
        damageEvents = [];
        healingEvents = [];
        notices = [];
        messages = [];
        hits = [];
        const durationBefore = Object.fromEntries(sides.map(side => [side, { frailty: f[side].statuses.frailty ?? 0, repetition: f[side].statuses.repetition ?? 0 }]));
        for (const side of sides) {
            const unit = f[side];
            if (unit.statuses.poison) {
                queue(side, statusRules.poison.power * (has(opposite(side), 'glass-cannon') ? 1.3 : 1), 'dot', 'nature');
                unit.statuses.poison--;
            }
            if (unit.statuses.regeneration) {
                heal(side, statusRules.regeneration.power, 'hot');
                unit.statuses.regeneration--;
            }
        }
        applyHits();
        if (sides.some(side => f[side].health === 0)) {
            frames.push(snapshot(tick));
            break;
        }
        const waiting = new Set<Side>();
        for (const side of sides) {
            const unit = f[side];
            if (unit.reshuffleRemaining) {
                unit.reshuffleRemaining--;
                waiting.add(side);
                if (!unit.reshuffleRemaining) {
                    unit.cycle++;
                    startCycle(side);
                }
                continue;
            }
            if (!unit.casting) {
                const card = cardAt(unit.spells[unit.cursor], unit.spellXp?.[unit.cursor]);
                let duration = card.castTicks ?? 1;
                duration += Math.min(2, unit.statuses.slow ?? 0);
                delete unit.statuses.slow;
                if (has(side, 'last-stand') && unit.health < unit.maxHealth * .3)
                    duration--;
                if (card.domain === 'fire' && unit.memory.nextFireFaster) {
                    duration--;
                    unit.memory.nextFireFaster = false;
                }
                if ((card.castTicks ?? 1) >= 2 && unit.memory.nextFaster) {
                    duration--;
                    unit.memory.nextFaster = false;
                }
                duration = Math.max(1, duration);
                unit.casting = { spell: card.id, index: unit.cursor, remaining: duration, totalTicks: duration };
            }
        }
        const tickStart = snapshot(tick);
        tickStart.presentationPhase = 'start';
        const ready = sides.filter(side => !waiting.has(side) && f[side].casting && --f[side].casting!.remaining === 0);
        const stateBefore = cloneSnapshot(f);
        for (const side of ready) {
            const unit = f[side], enemy = f[opposite(side)], memory = unit.memory, cast = unit.casting!;
            const card = cardAt(cast.spell, unit.spellXp?.[cast.index]);
            const effects = card.combat!.effects!;
            const previousOath = unit.oath ? cloneSnapshot(unit.oath) : null;
            const previousDomain = memory.previousDomain;
            if (has(side, 'steam') && previousDomain === 'water' && card.domain === 'fire')
                addStatus(side, 'heat', 2);
            const heat = unit.statuses.heat ?? 0;
            const heatEmpowered = card.domain === 'fire' && heat >= 5 && effects.some(e => e.empowered !== undefined);
            const empowered = heatEmpowered || has(side, 'finisher') && cast.index === unit.spells.length - 1 || card.domain === 'holy' && !!memory.nextHolyEmpowered;
            if (card.domain === 'holy')
                memory.nextHolyEmpowered = false;
            if (heatEmpowered) {
                unit.statuses.heat -= 5;
                if (has(side, 'inferno'))
                    memory.nextFireFaster = true;
                notify(side, 'empowered', card.name + ' Empowered · spent 5 Heat');
            }
            const alternating = has(side, 'alternation') && previousDomain && previousDomain !== card.domain ? 1.2 : 1;
            const basePower = power(side, card.domain) * alternating;
            let damagePower = basePower * (has(side, 'glass-cannon') ? 1.3 : 1) * (has(side, 'first-strike') && cast.index === 0 ? 1.5 : 1) * (has(side, 'heavy-hitter') && card.castTicks === 3 ? 1.4 : 1) * (has(side, 'crescendo') ? 1 + memory.cycleCasts * .05 : 1) * (card.domain === 'fire' ? 1 + heat * .04 : 1);
            const bonus = memory.nextBonus ?? 0;
            memory.nextBonus = 0;
            let bonusUsed = false, selfHurt = false, direct = false;
            let repeats = memory.nextRepeats ?? 1;
            memory.nextRepeats = undefined;
            memory.casts++;
            memory.cycleCasts++;
            if (card.castTicks === 1) {
                memory.fast++;
                memory.fastStreak++;
            }
            else
                memory.fastStreak = 0;
            if (has(side, 'momentum') && memory.fastStreak >= 3) {
                memory.nextFaster = true;
                memory.fastStreak = 0;
            }
            if (has(side, 'echo-chamber') && memory.casts % 4 === 0)
                repeats = Math.max(2, repeats);
            for (const e of effects)
                if (e.kind === 'spend' && e.repeats && (unit.statuses.tide ?? 0) >= (e.amount ?? 0)) {
                    unit.statuses.tide -= e.amount!;
                    repeats = Math.max(repeats, e.repeats);
                    if (has(side, 'blighted-tide') && enemy.statuses.poison)
                        addStatus(opposite(side), 'poison', 2);
                }
            const rapid = has(side, 'rapid-casting') && card.castTicks === 1 && memory.fast % 3 === 0;
            const event: CastEvent = { side, spell: card.id, index: cast.index, status: 'cast', critical: false, xp: unit.spellXp?.[cast.index] ?? 0, repeats: repeats + (rapid ? 1 : 0), details: empowered ? ['Empowered'] : [] };
            events.push(event);
            const execute = (effect: Effect, repeatPower: number) => {
                const e = effect, target = e.target === 'enemy' ? opposite(side) : side;
                let value = e.amount ?? 0;
                if (e.perStatus) {
                    const enemyStatus = e.perStatus.startsWith('enemy:');
                    value *= stateBefore[enemyStatus ? opposite(side) : side].statuses[e.perStatus.replace('enemy:', '')] ?? 0;
                }
                if (e.perChannel)
                    value *= channelPower(unit.spells, cast.index);
                if (e.condition) {
                    const yes = e.condition === 'poison' ? !!stateBefore[opposite(side)].statuses.poison : e.condition === 'oath' ? !!memory.oathCompleted : e.condition === 'previousFire' ? previousDomain === 'fire' : previousDomain === 'water';
                    if (yes)
                        value += e.bonus ?? 0;
                }
                if (e.kind === 'damage') {
                    direct = true;
                    if (empowered && e.empowered !== undefined)
                        value = e.empowered;
                    else if (empowered)
                        value *= 1.5;
                    if (!bonusUsed) {
                        value += bonus;
                        bonusUsed = true;
                    }
                    queue(opposite(side), value * damagePower * repeatPower, 'hit', card.domain);
                }
                else if (e.kind === 'heal')
                    heal(target, value * basePower * repeatPower * (empowered ? 1.5 : 1));
                else if (e.kind === 'ward')
                    f[target].shield += Math.round(value * basePower * repeatPower * (empowered ? 1.5 : 1));
                else if (e.kind === 'selfDamage') {
                    queue(side, value * repeatPower, 'cost');
                    selfHurt = true;
                }
                else if (e.kind === 'status') {
                    let amount = value * repeatPower;
                    if (e.status === 'poison' && target !== side) {
                        if (has(side, 'wild-garden'))
                            amount += 2;
                        if (has(side, 'wildfire') && (unit.statuses.heat ?? 0) > 0)
                            queue(opposite(side), 20 * (has(side, 'glass-cannon') ? 1.3 : 1), 'hit', 'fire');
                    }
                    addStatus(target, e.status!, amount);
                    if (e.status === 'slow' && has(side, 'venomous-hex'))
                        addStatus(target, 'poison', 2 + (has(side, 'wild-garden') ? 2 : 0));
                }
                else if (e.kind === 'interrupt') {
                    if (enemy.casting && !ready.includes(opposite(side))) {
                        events.push({ side: opposite(side), spell: enemy.casting.spell, index: enemy.casting.index, status: 'skipped', critical: false, details: ['Interrupted'] });
                        delete enemy.oath;
                        advance(opposite(side));
                        notify(opposite(side), 'interrupt', 'Interrupted');
                    }
                }
                else if (e.kind === 'cleanse')
                    for (const id of negative)
                        delete unit.statuses[id];
                else if (e.kind === 'multiply')
                    unit.statuses[e.status!] = Math.round((unit.statuses[e.status!] ?? 0) * value);
                else if (e.kind === 'consume') {
                    const amount = f[target].statuses[e.status!] ?? 0;
                    delete f[target].statuses[e.status!];
                    direct = true;
                    queue(opposite(side), amount * value * damagePower * repeatPower * (empowered ? 1.5 : 1), 'hit', card.domain);
                    if (e.status === 'heat' && amount >= 5 && has(side, 'inferno'))
                        memory.nextFireFaster = true;
                }
                else if (e.kind === 'spend' && !e.repeats && (unit.statuses[e.status!] ?? 0) >= value) {
                    unit.statuses[e.status!] -= value;
                    for (const child of e.effects ?? [])
                        execute(child, repeatPower);
                    if (has(side, 'blighted-tide') && enemy.statuses.poison)
                        addStatus(opposite(side), 'poison', 2);
                }
                else if (e.kind === 'oath')
                    unit.oath = cloneSnapshot(e.oath!);
                else if (e.kind === 'repeatNext')
                    memory.nextRepeats = Math.max(memory.nextRepeats ?? 1, value);
            };
            for (let repeat = 0; repeat < Math.min(4, repeats); repeat++)
                for (const effect of effects)
                    execute(effect, 1);
            if (rapid)
                for (const effect of effects)
                    execute(effect, .5);
            if (previousOath && unit.oath?.id === previousOath.id && !effects.some(e => e.kind === 'oath')) {
                const succeeds = previousOath.requirement === 'slow' ? (card.castTicks ?? 1) >= 2 : !direct;
                if (!succeeds) {
                    delete unit.oath;
                    notify(side, 'oath', 'Oath broken');
                }
                else if (--unit.oath.remaining === 0) {
                    const oath = unit.oath;
                    delete unit.oath;
                    memory.oathCompleted = true;
                    if (oath.reward === 'ward')
                        unit.shield += oath.amount;
                    else
                        heal(side, oath.amount);
                    if (has(side, 'sacred-rhythm'))
                        memory.nextHolyEmpowered = true;
                    notify(side, 'oath', 'Oath completed');
                }
            }
            if (has(side, 'opening-ward') && cast.index === 0)
                unit.shield += 50;
            if (has(side, 'patience') && card.castTicks === 3)
                unit.shield += 80;
            if (card.domain === 'water') {
                memory.water++;
                if (has(side, 'rising-tide') && memory.water % 3 === 0)
                    addStatus(side, 'tide', 2);
                if (has(side, 'purifying-rain') && previousDomain === 'holy')
                    unit.shield += 45;
            }
            if (stateBefore[side].statuses.repetition && previousDomain === card.domain)
                queue(side, 25, 'cost');
            if (selfHurt && has(side, 'blood-magic'))
                memory.nextBonus = 50;
            memory.previousDomain = card.domain;
            messages.push(unit.name + ' casts ' + card.name + '.');
        }
        for (const side of ready)
            advance(side);
        applyHits();
        for (const side of sides) {
            for (const id of ['frailty', 'repetition'] as const)
                if (durationBefore[side][id] > 0 && f[side].statuses[id])
                    f[side].statuses[id]--;
            for (const [id, n] of Object.entries(f[side].statuses))
                if (n <= 0)
                    delete f[side].statuses[id];
        }
        frames.push(snapshot(tick, tickStart));
        if (sides.some(side => f[side].health === 0))
            break;
    }
    const outcome = f.player.health === f.bot.health ? 'draw' : f.player.health > f.bot.health ? 'victory' : 'defeat';
    return { frames, outcome, endReason: f.player.health === 0 || f.bot.health === 0 ? 'knockout' : 'timeout' };
}
