import { attunedDomains, effectEnabled, KEYWORD_DOMAINS } from './attunement';
import { CARDS, type Domain } from '../config/catalogue';
import settings from '../config/rules.json';
import statusRules from '../config/statuses.json';
import { cloneSnapshot } from './clone';
import { activeSpellIndices } from './rotation';
import { cardAt, deckXp, validateXp } from './upgrades';
import { validateAugments } from './augments';
import type { Battle, CastEvent, CombatFrame, DamageEvent, Effect, Fighter, HealingEvent, Spell, SpellId, Stats } from './model';
export const RULES = settings;
export const SPELLS: Record<string, Spell> = Object.fromEntries(CARDS.map(c => [c.id, { ...c, price: c.stars, description: c.rules }]));
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
type Side = 'player' | 'bot';
const sides: Side[] = ['player', 'bot'];
const opposite = (side: Side): Side => side === 'player' ? 'bot' : 'player';
export const NEGATIVE_STATUSES = ['poison', 'slow', 'trap', 'weaken', 'frailty', 'repetition', 'curse', 'stun'];
const durations = ['slow', 'trap', 'weaken', 'resilience', 'guard', 'fury', 'frailty', 'repetition', 'stun', 'unholy'];

/** Seeded combat: Instant spells, periodic effects, then normal completions. */
export function simulate(player: Fighter, bot: Fighter, seed = RULES.seed): Battle {
    const f = { player: cloneSnapshot(player), bot: cloneSnapshot(bot) };
    for (const unit of Object.values(f)) {
        if (unit.shield > 0) unit.wardCapacity = Math.max(unit.shield, unit.wardCapacity ?? 0);
        validateDeck(unit.spells); validateXp(unit.spells, unit.spellXp); validateAugments(unit.augments);
    }
    let randomState = seed >>> 0;
    const random = () => { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296; };
    const frames: CombatFrame[] = [];
    let events: CastEvent[] = [], damageEvents: DamageEvent[] = [], healingEvents: HealingEvent[] = [];
    let notices: NonNullable<CombatFrame['notices']> = [], messages: string[] = [];
    let hits: (Omit<DamageEvent, 'critical'> & { critical: boolean; intercept?:boolean; source:Side })[] = [];
    let tickDamage = {player:{dealt:0,taken:0},bot:{dealt:0,taken:0}};
    let pendingSummons = {player:0,bot:0};
    const secondWind = new Set<Side>();
    const has = (side: Side, id: string) => f[side].augments.includes(id);
    const damageMultiplier = (side: Side, unit = f[side]) => (has(side, 'glass-cannon') ? 1.3 : 1) * (unit.statuses.fury ? 1.1 : 1) * (unit.statuses.weaken ? .8 : 1) * (has(side, 'hot-stuff') && unit.statuses.heat ? 1.1 : 1);
    const attuned = (side: Side, domain: Domain) => f[side].attuned.includes(domain);
    const notify = (side: Side, status: string, text: string) => notices.push({ side, status, text });
    const addStatus = (side: Side, status: string, amount: number, source:Side=opposite(side)) => {
        if (amount > 0) {
            const previous = f[side].statuses[status] ?? 0;
            f[side].statuses[status] = (f[side].statuses[status] ?? 0) + Math.round(amount);
            if(['poison','curse','trap'].includes(status)) (f[side].statusSources??={})[status]=source===side?'self':'enemy';
            if (status === 'potency' && previous < 10 && f[side].statuses.potency >= 10 && has(side, 'criticality')) {
                addStatus(side, 'heat', 15, side);
                notify(side, 'heat', 'Criticality: +15 Heat');
            }
        }
    };
    const ward = (side: Side, amount: number) => {
        const value = Math.round(amount), unit = f[side];
        if (value >= unit.shield && value > 0) { unit.shield = value; unit.wardCapacity = value; }
    };
    const heal = (side: Side, amount: number, kind: HealingEvent['kind'] = 'heal', source:Side=side, direct = false) => {
        if (f[source].statuses.unholy) {
            const power=damageMultiplier(source);
            queue(opposite(source), Math.max(0,amount)*power, kind==='hot'?'dot':'hit', 'holy', false, kind!=='hot', source);
            return;
        }
        if (direct && has(side, 'friendly-imp') && (f[side].imp?.health ?? 0) > 0) {
            const imp = f[side].imp!;
            const restored = Math.min(imp.maxHealth - imp.health, Math.max(0, Math.round(amount)));
            imp.health += restored; amount -= restored;
            if (restored) healingEvents.push({side, amount: restored, kind, target:'imp'});
        }
        const value = Math.min(f[side].maxHealth - f[side].health, Math.max(0, Math.round(amount)));
        f[side].health += value;
        if (value) healingEvents.push({ side, amount: value, kind });
    };
    const queue = (side: Side, amount: number, kind: DamageEvent['kind'] = 'hit', domain?: Domain, critical = false, intercept = false, source:Side=opposite(side)) => {
        if (amount > 0) hits.push({ side, amount: Math.round(amount), kind, domain, critical, intercept, source });
    };
    const applyHits = () => {
        const totals = { player: 0, bot: 0 };
        const pending = hits; hits = [];
        for (const h of pending) {
            const unit = f[h.side];
            let amount = h.amount;
            if (h.intercept && unit.imp && unit.imp.health > 0) {
                if (unit.imp.guard > 0) { notify(h.side, 'summon', 'Imp Guard prevented damage'); continue; }
                const absorbed = Math.min(unit.imp.health, amount);
                unit.imp.health -= absorbed; amount -= absorbed;
                damageEvents.push({ ...h, amount: absorbed, target: 'imp' });
                if(h.source!==h.side) tickDamage[h.source].dealt += absorbed;
                notify(h.side, 'summon', unit.imp.health ? `Imp absorbed ${absorbed}` : 'Imp defeated');
            }
            // Explicit Health costs ("lose Health") bypass protection. Damage does not.
            if (h.kind !== 'cost') {
                if (unit.statuses.guard) { notify(h.side, 'guard', 'Guard prevented damage'); continue; }
                if (has(h.side, 'hot-stuff') && unit.statuses.heat) amount *= 1.1;
                if (unit.statuses.resilience || unit.memory.permanentResilience) amount *= has(h.side, 'tough-skin') ? .35 : .5;
                if (unit.statuses.frailty) amount *= 1.2;
                amount = Math.round(amount);
                const absorbed = h.kind === 'dot' ? 0 : Math.min(unit.shield, amount);
                unit.shield -= absorbed; amount -= absorbed;
                if (absorbed) {
                    damageEvents.push({ ...h, amount: absorbed, target: 'ward' });
                    notify(h.side, 'ward', 'Ward absorbed ' + absorbed);
                }
            }
            if (amount) {
                const actual = Math.min(amount, Math.max(0,unit.health-totals[h.side]));
                totals[h.side] += amount; damageEvents.push({ ...h, amount });
                if(h.kind!=='cost') {tickDamage[h.side].taken += actual; if(h.source!==h.side) tickDamage[h.source].dealt += actual;}
                if (actual > 0 && h.source === h.side) {
                    if (has(h.side, 'blood-magic')) addStatus(h.side, 'regeneration', 3, h.side);
                    if (has(h.side, 'blood-infusion')) addStatus(h.side, 'potency', 1, h.side);
                }
            }
        }
        for (const side of sides) {
            const unit = f[side]; unit.health = Math.max(0, unit.health - totals[side]);
            if (totals[side] > 0 && unit.health > 0 && unit.health <= unit.maxHealth * .3 && has(side, 'second-wind') && !secondWind.has(side)) {
                secondWind.add(side); heal(side, 120); notify(side, 'regeneration', 'Second Wind: heal 120');
            }
        }
        // Converted Second Wind healing can enqueue damage during hit processing.
        if(hits.length) applyHits();
    };
    const startCycle = (side: Side) => {
        const unit = f[side]; unit.memory.cycleCasts = 0; unit.memory.oathCompleted = false;
        unit.memory.regenerationPower = 1;
        if (unit.statuses.curse) { const source=unit.statusSources?.curse==='self'?side:opposite(side); queue(side, unit.statuses.curse * statusRules.curse.power * damageMultiplier(source), 'dot', 'affliction', false, false, source); }
        if (unit.memory.recklessCostPending) { unit.memory.recklessCostPending=false; queue(side,25,'cost',undefined,false,false,side); notify(side,'cycle','Reckless Loop: lose 25 Health'); }
    };
    const advance = (side: Side) => {
        const unit = f[side]; unit.casting = null;
        const active=activeSpellIndices(unit),next=active.find(index=>index>unit.cursor);
        if(!active.length) {unit.cursor=0;unit.reshuffleRemaining=0;return;}
        if(next!==undefined) unit.cursor=next;
        else {
            unit.cursor = active[0];
            const curseSource = unit.statusSources?.curse === 'self' ? side : opposite(side);
            unit.reshuffleRemaining = (has(side, 'reckless-loop') ? 0 : RULES.reshuffleTicks) + (unit.statuses.curse && has(curseSource, 'cursed') ? 1 : 0);
            if (has(side, 'reckless-loop') && unit.reshuffleRemaining) unit.memory.recklessCostPending = true;
            if (!unit.reshuffleRemaining) {
                unit.cycle++; startCycle(side); queue(side, 25, 'cost', undefined, false, false, side);
                notify(side, 'cycle', 'Reckless Loop: lose 25 Health');
            }
        }
    };
    const snapshot = (tick: number, tickStart?: CombatFrame): CombatFrame => ({
        tick, player: cloneSnapshot(f.player), bot: cloneSnapshot(f.bot), events: cloneSnapshot(events),
        damageEvents: cloneSnapshot(damageEvents), healingEvents: cloneSnapshot(healingEvents), notices: cloneSnapshot(notices), messages: [...messages], ...(tickStart ? { tickStart } : {}),
    });
    const interrupt = (side: Side) => {
        const unit = f[side], cast = unit.casting;
        if (!cast) return;
        const card = cardAt(cast.spell, unit.spellXp?.[cast.index]);
        const active=activeSpellIndices(unit),position=active.indexOf(cast.index);
        let last = cast.index;
        if (card.keywords.includes('channel')) {
            let first = position,lastPosition=position;
            while (first > 0 && unit.spells[active[first - 1]] === cast.spell) first--;
            // Adjacent copies form channel groups of at most three.
            const end = first + Math.floor((position - first) / 3) * 3 + 2;
            while (lastPosition < end && unit.spells[active[lastPosition + 1]] === cast.spell) lastPosition++;
            last=active[lastPosition];
        }
        for (const index of active.filter(index=>index>=cast.index&&index<=last)) events.push({ side, spell: unit.spells[index], index, status: 'skipped', critical: false, details: ['Interrupted'] });
        unit.cursor = last; advance(side); notify(side, 'interrupt', 'Interrupted');
    };
    for (const side of sides) {
        if (has(side, 'opening-ward')) ward(side, 100);
        startCycle(side);
    }
    for (const side of sides) if (has(side, 'toxic-start')) {
        addStatus(opposite(side), 'poison', 5, side);
        addStatus(opposite(side), 'curse', 1, side);
    }
    messages = ['Cast left to right. Two ticks to reshuffle.']; frames.push(snapshot(0));
    for (let tick = 1; tick <= RULES.maxTicks; tick++) {
        events = []; damageEvents = []; healingEvents = []; notices = []; messages = []; hits = [];
        pendingSummons = {player:0,bot:0};
        // Keep the defeated companion in its defeat frame only.
        for (const side of sides) if (f[side].imp && f[side].imp!.health <= 0) delete f[side].imp;
        tickDamage = {player:{dealt:0,taken:0},bot:{dealt:0,taken:0}};
        const durationBefore = cloneSnapshot({ player: f.player.statuses, bot: f.bot.statuses });
        const impGuardBefore = {player:f.player.imp?.guard??0,bot:f.bot.imp?.guard??0};
        const stunned = new Set(sides.filter(side => (f[side].statuses.stun??0)>0));
        const waiting = new Set<Side>();
        // Start all casts together, so Instant interrupts can see a new 1T cast.
        for (const side of sides) {
            const unit = f[side];
            if (stunned.has(side)) continue;
            if(!activeSpellIndices(unit).length) continue;
            if (unit.reshuffleRemaining) { waiting.add(side); continue; }
            if (unit.casting) continue;
            const card = cardAt(unit.spells[unit.cursor], unit.spellXp?.[unit.cursor]);
            const instant = card.castTicks === 0 && (!card.instantDomain || attuned(side, card.instantDomain));
            let duration = instant ? 0 : Math.max(1, card.castDomain && !attuned(side, card.castDomain) ? card.unattunedCastTicks ?? 1 : card.castTicks ?? 1);
            if (!instant) {
                if (card.enemyStatusCast && f[opposite(side)].statuses[card.enemyStatusCast.status]) duration = card.enemyStatusCast.ticks;
                if (unit.statuses.slow) duration++;
                if (has(side, 'last-stand') && unit.health < unit.maxHealth * .3) duration--;
                duration = Math.max(1, duration);
                if ((unit.statuses.heat ?? 0) >= 5) {
                    unit.statuses.heat -= 5; duration = 1;
                    notify(side, 'heat', card.name + ': spent 5 Heat for 1T');
                }
            }
            let echoPower: number | undefined;
            const echoThreshold = unit.memory.tidecallerThreshold ?? 5;
            if ((unit.statuses.tidecaller ?? 0) >= echoThreshold) {
                unit.statuses.tidecaller -= echoThreshold; echoPower = unit.memory.nextEcho ?? unit.memory.echoPower ?? .5; unit.memory.nextEcho = undefined;
                notify(side, 'tidecaller', card.name + ': spent ' + echoThreshold + ' Tidecaller');
            }
            unit.casting = { spell: card.id, index: unit.cursor, remaining: duration, totalTicks: duration, instant, echoPower };
        }
        const resolve = (ready: Side[]) => {
            const before = cloneSnapshot(f);
            // Interrupt is a pre-completion action. Two simultaneous interrupts
            // cancel each other; neither side wins from iteration order.
            const interrupted = new Set<Side>();
            for (const side of ready) {
                const cast = f[side].casting;
                if (!cast) continue;
                if (cardAt(cast.spell, f[side].spellXp?.[cast.index]).combat!.effects!.some(e => e.kind === 'interrupt' && effectEnabled(e, f[side].attuned)) && f[opposite(side)].casting) interrupted.add(opposite(side));
            }
            for (const side of interrupted) interrupt(side);
            for (const side of ready) {
                const unit = f[side], enemySide = opposite(side), enemy = f[enemySide], memory = unit.memory, cast = unit.casting;
                if (!cast || interrupted.has(side)) continue;
                const card = cardAt(cast.spell, unit.spellXp?.[cast.index]);
                const effects = card.combat!.effects!.filter(e => effectEnabled(e, unit.attuned));
                const previousDomain = memory.previousDomain;
                const active=activeSpellIndices(unit);
                const basePower = has(side, 'alternation') && previousDomain && previousDomain !== card.domain ? 1.2 : 1;
                const damagePower = basePower * damageMultiplier(side, before[side]) * (has(side, 'first-strike') && cast.index === active[0] ? 1.5 : 1) * (has(side, 'finisher') && cast.index === active.at(-1) ? 1.5 : 1) * (has(side, 'heavy-hitter') && card.castTicks === 3 ? 1.4 : 1) * (has(side, 'crescendo') ? 1 + memory.cycleCasts * .05 : 1);
                const enemyDebuffs = NEGATIVE_STATUSES.filter(id => before[enemySide].statuses[id] > 0).length;
                const canDamage = effects.some(e => e.kind === 'damage' || e.kind === 'consume' || e.kind === 'sacrificeImp');
                const critical = canDamage && (effects.some(e => e.criticalIfDebuffed) && enemyDebuffs > 0 || random() < Math.min(1, (before[side].statuses.potency ?? 0) * .1));
                const critPower = critical ? memory.critDamage ?? 1.5 : 1;
                const nextDamage = memory.nextDamage ?? 1; memory.nextDamage = undefined;
                const bonus = memory.nextBonus ?? 0; memory.nextBonus = 0;
                let bonusUsed = false, selfHurt = false, direct = false;
                let repeats = memory.nextRepeats ?? 1; memory.nextRepeats = undefined;
                memory.casts++; memory.cycleCasts++;
                if (card.castTicks === 1) { memory.fast++; memory.fastStreak++; } else memory.fastStreak = 0;
                if (has(side, 'momentum') && memory.fastStreak >= 3) { addStatus(side, 'fury', 5, side); memory.fastStreak = 0; notify(side, 'fury', 'Momentum: +5 Fury'); }
                const event: CastEvent = { side, spell: card.id, index: cast.index, status: 'cast', critical, xp: unit.spellXp?.[cast.index] ?? 0, repeats: repeats + (cast.echoPower !== undefined ? 1 : 0), details: [...(critical ? ['Critical'] : []), ...(cast.instant ? ['Instant'] : []), ...(cast.echoPower !== undefined ? [`Echo ${cast.echoPower * 100}%`] : [])] };
                events.push(event);
                const execute = (e: Effect, repeatPower: number, echo = false) => {
                    if (!effectEnabled(e, unit.attuned)) return;
                    if(e.onlyIf==='oath'&&!memory.oathCompleted)return;
                    const target = e.target === 'enemy' ? enemySide : side;
                    const bonusActive = !e.bonusDomain || attuned(side, e.bonusDomain);
                    let value = e.attunedAmount !== undefined && bonusActive ? e.attunedAmount : e.amount ?? 0;
                    if (e.perStatus) value *= before[e.perStatus.startsWith('enemy:') ? enemySide : side].statuses[e.perStatus.replace('enemy:', '')] ?? 0;
                    const channel=channelPower(active.map(index=>unit.spells[index]),active.indexOf(cast.index));
                    if (e.perChannel) value *= channel;
                    if (e.channelBonus && bonusActive) value += e.channelBonus * (channel - 1);
                    if (e.debuffMultiplier && bonusActive) value *= 1 + e.debuffMultiplier * enemyDebuffs;
                    if (e.statusMultiplier && bonusActive) value *= 1 + e.statusMultiplier.amount * (before[e.statusMultiplier.status.startsWith('enemy:') ? enemySide : side].statuses[e.statusMultiplier.status.replace('enemy:', '')] ?? 0);
                    if (e.lowHealthMultiplier && bonusActive && before[side].health < before[side].maxHealth * .3) value *= e.lowHealthMultiplier;
                    if (e.debuffDamageMultiplier && bonusActive && enemyDebuffs > 0) value *= e.debuffDamageMultiplier;
                    if (e.impMultiplier && bonusActive && (before[side].imp?.health??0)>0) value *= e.impMultiplier;
                    if (echo && e.echoMultiplier) value *= e.echoMultiplier;
                    if (e.condition && bonusActive) {
                        const yes = e.condition === 'regeneration' ? !!before[side].statuses.regeneration : e.condition === 'poison' ? !!before[enemySide].statuses.poison : e.condition === 'oath' ? !!memory.oathCompleted : e.condition === 'previousFire' ? previousDomain === 'fire' : previousDomain === 'water';
                        if (yes) value += e.bonus ?? 0;
                    }
                    if (e.kind === 'damage') {
                        direct = true; if (!bonusUsed) { value += bonus; bonusUsed = true; }
                        queue(enemySide, value * damagePower * repeatPower * nextDamage * critPower, 'hit', card.domain, critical, true);
                    } else if (e.kind === 'heal') heal(target, value * basePower * repeatPower, 'heal', side, true);
                    else if(e.kind==='healFull') heal(side, ((unit.maxHealth-unit.health)+(has(side,'friendly-imp')&&(unit.imp?.health??0)>0?unit.imp!.maxHealth-unit.imp!.health:0))*repeatPower, 'heal', side, true);
                    else if (e.kind === 'ward') ward(target, value * basePower * repeatPower);
                    else if (e.kind === 'selfDamage') { queue(side, (e.currentHealthFraction ? before[side].health * e.currentHealthFraction : value) * repeatPower, e.currentHealthFraction ? 'cost' : 'hit',undefined,false,false,side); selfHurt = true; }
                    else if (e.kind === 'status') {
                        let amount = value * repeatPower;
                        if (e.status === 'poison' && target !== side) {
                            if (has(side, 'wildfire') && (unit.statuses.heat ?? 0) > 0) queue(enemySide, 20 * damageMultiplier(side, before[side]), 'hit', 'fire', false, true);
                        }
                        if (e.permanent && e.status === 'resilience') memory.permanentResilience = true;
                        else addStatus(target, e.status!, e.roundDown?Math.floor(amount):amount, side);
                    } else if (e.kind === 'cleanse') {
                        const active = NEGATIVE_STATUSES.filter(id => unit.statuses[id] > 0);
                        for (const id of active.slice(0, e.amount ?? active.length)) delete unit.statuses[id];
                    } else if (e.kind === 'multiply') unit.statuses[e.status!] = Math.round((unit.statuses[e.status!] ?? 0) * value);
                    else if (e.kind === 'cultivate') {
                        const duration = unit.statuses[e.status!] ?? 0; delete unit.statuses[e.status!];
                        heal(side, duration * value * (e.status==='regeneration'?memory.regenerationPower ?? 1:1) * repeatPower, 'heal', side, true);
                    } else if (e.kind === 'consume') {
                        const amount = f[target].statuses[e.status!] ?? 0; delete f[target].statuses[e.status!]; direct = true;
                        queue(enemySide, amount * value * damagePower * repeatPower * nextDamage * critPower, 'hit', card.domain, critical, true);
                    } else if (e.kind === 'summon') {
                        const amount = Math.round((e.currentHealthFraction ? before[side].health * e.currentHealthFraction * value : value) * repeatPower);
                        if (amount > 0) pendingSummons[side] += amount;
                    } else if (e.kind === 'impGuard') {
                        if (unit.imp && unit.imp.health > 0) unit.imp.guard += Math.round(value * repeatPower);
                    } else if (e.kind === 'impPower') memory.impDamage = Math.max(memory.impDamage??0, Math.round(value * repeatPower));
                    else if (e.kind === 'removeWard') f[target].shield = 0;
                    else if (e.kind === 'sacrificeImp') {
                        if (unit.imp && unit.imp.health > 0) {
                            const amount = (e.useMaxHealth ? unit.imp.maxHealth : unit.imp.health) * (e.amount ?? 1);
                            unit.imp.health = 0; unit.imp.guard = 0; direct = true;
                            queue(enemySide, amount * damagePower * repeatPower * nextDamage * critPower, 'hit', card.domain, critical, true);
                            notify(side, 'summon', 'Imp sacrificed');
                        }
                    } else if (e.kind === 'spend' && (unit.statuses[e.status!] ?? 0) >= value) {
                        unit.statuses[e.status!] -= value; for (const child of e.effects ?? []) execute(child, repeatPower, echo);
                    } else if (e.kind === 'oath') {
                        // Echo copies do not overwrite a stronger newly established Oath.
                        const amount=Math.round(e.oath!.amount*repeatPower);
                        if(unit.oath?.startedTick!==tick||unit.oath.id!==e.oath!.id||unit.oath.amount<amount) unit.oath={...cloneSnapshot(e.oath!),amount,startedTick:tick,progress:0};
                    }
                    else if (e.kind === 'repeatNext') memory.nextRepeats = Math.max(memory.nextRepeats ?? 1, value);
                    else if (e.kind === 'modifier' && e.modifier) {
                        // A half-strength Echo scales the bonus above baseline.
                        const modified = 1 + (value - 1) * repeatPower;
                        if (e.modifier === 'tidecallerThreshold') memory.tidecallerThreshold = Math.min(memory.tidecallerThreshold ?? 5, Math.max(1, 5 - Math.floor((5 - value) * repeatPower)));
                        else if (e.modifier === 'echoPower') memory.echoPower = Math.max(memory.echoPower ?? .5, .5 + (value - .5) * repeatPower);
                        else if (e.modifier === 'nextEcho') memory.nextEcho = Math.max(memory.nextEcho ?? .5, .5 + (value - .5) * repeatPower);
                        else memory[e.modifier] = Math.max(memory[e.modifier] ?? 1, modified);
                    }
                };
                for (let repeat = 0; repeat < Math.min(4, repeats); repeat++) for (const effect of effects) execute(effect, 1);
                if (cast.echoPower !== undefined) for (const effect of effects) execute(effect, cast.echoPower, true);
                if ((unit.imp?.health??0)>0 && memory.impDamage) {
                    queue(enemySide, memory.impDamage * damageMultiplier(side, before[side]), 'hit', 'affliction', false, true);
                    notify(side, 'summon', `Imp attacks for ${memory.impDamage}`);
                }
                if (card.domain === 'water') {
                    memory.water++;
                }
                if (before[side].statuses.trap) { const source=unit.statusSources?.trap==='self'?side:enemySide; queue(side,10*damageMultiplier(source),'dot',undefined,false,false,source); }
                if (before[side].statuses.repetition && previousDomain === card.domain) queue(side, 25, 'cost');
                memory.previousDomain = card.domain;
                messages.push(unit.name + ' casts ' + card.name + '.');
                if(effects.some(e=>e.kind==='fragile')) {
                    (unit.broken??=[]).push(cast.index);
                    event.details!.push('Fragile: broken for this duel');
                    notify(side,'fragile',card.name+' broke');
                }
                advance(side);
            }
            applyHits();
        };
        resolve(sides.filter(side => !stunned.has(side) && f[side].casting?.instant));
        // Instant can heal before Poison ticks, or kill before a normal spell lands.
        if (sides.some(side => f[side].health === 0)) { frames.push(snapshot(tick)); break; }
        for (const side of sides) {
            const unit = f[side], sourceSide=unit.statusSources?.poison==='self'?side:opposite(side),source = f[sourceSide];
            if (unit.statuses.poison) {
                const multiplier = (source.memory.poisonPower ?? 1) * (has(sourceSide, 'super-poison') ? 2 : 1) * damageMultiplier(sourceSide);
                queue(side, statusRules.poison.power * multiplier, 'dot', 'nature',false,false,sourceSide); unit.statuses.poison--;
                if (unit.statuses.poison === 0 && has(sourceSide, 'bloom')) { queue(side, 60 * damageMultiplier(sourceSide), 'hit', undefined, false, true, sourceSide); notify(sourceSide, 'poison', 'Bloom: Poison expired'); }
            }
            if (unit.statuses.regeneration) { heal(side, statusRules.regeneration.power * (unit.memory.regenerationPower ?? 1), 'hot'); unit.statuses.regeneration--;
            }
        }
        applyHits();
        if (sides.some(side => f[side].health === 0)) { frames.push(snapshot(tick)); break; }
        const tickStart = snapshot(tick); tickStart.presentationPhase = 'start';
        for (const side of waiting) if (!f[side].statuses.stun && --f[side].reshuffleRemaining === 0) { f[side].cycle++; startCycle(side); }
        const ready = sides.filter(side => !stunned.has(side) && !f[side].statuses.stun && !waiting.has(side) && f[side].casting && !f[side].casting!.instant && --f[side].casting!.remaining === 0);
        resolve(ready);
        for (const side of sides) {
            if (impGuardBefore[side]>0 && f[side].imp?.guard) f[side].imp!.guard--;
            for (const id of durations) if (durationBefore[side][id] > 0 && f[side].statuses[id]) f[side].statuses[id]--;
            for (const [id, value] of Object.entries(f[side].statuses)) if (value <= 0) delete f[side].statuses[id];
        }
        // Timed Oaths watch full subsequent ticks, including periodic damage and reshuffling.
        for(const side of sides) {
            const unit=f[side],oath=unit.oath;
            if(!oath||(oath.startedTick??0)>=tick||unit.health===0)continue;
            oath.progress=(oath.progress??0)+tickDamage[side].dealt;
            const failed=oath.requirement==='dealNone'&&tickDamage[side].dealt>0||oath.requirement==='takeNone'&&tickDamage[side].taken>0||oath.requirement==='meditate'&&!stunned.has(side);
            if(failed) {delete unit.oath;notify(side,'oath','Oath broken');continue;}
            if(--oath.remaining>0)continue;
            delete unit.oath;
            if(oath.requirement==='deal100'&&(oath.progress??0)<100) {notify(side,'oath','Oath broken: less than 100 damage');continue;}
            unit.memory.oathCompleted=true;
            if(oath.reward==='damage')queue(opposite(side),oath.amount*damageMultiplier(side),'hit','holy',false,true,side);
            else addStatus(oath.reward==='stun'?opposite(side):side,oath.reward,oath.amount,side);
            notify(side,'oath','Oath completed: '+oath.amount+' '+(oath.reward==='damage'?'damage':oath.reward+' ticks'));
        }
        applyHits();
        // Summons and reinforcement arrive after every damage phase, including Oath rewards.
        for (const side of sides) {
            const unit = f[side], amount = pendingSummons[side];
            if (amount <= 0 || unit.health <= 0) continue;
            if (unit.imp && unit.imp.health > 0) { unit.imp.health += amount; unit.imp.maxHealth += amount; }
            else unit.imp = {health:amount,maxHealth:amount,guard:0};
            notify(side, 'summon', `Summon: +${amount} Imp Health`);
        }
        frames.push(snapshot(tick, tickStart));
        if (sides.some(side => f[side].health === 0)) break;
    }
    const outcome = f.player.health === f.bot.health ? 'draw' : f.player.health > f.bot.health ? 'victory' : 'defeat';
    return { frames, outcome, endReason: f.player.health === 0 || f.bot.health === 0 ? 'knockout' : 'timeout' };
}
