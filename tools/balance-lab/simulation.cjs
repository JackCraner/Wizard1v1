const { fighter, simulate, SPELLS, PLAYABLE_SPELLS, RULES, AUGMENTS, canAddSpell,
  createBotStates, prepareBot, grantBotAugment, BOT_CONFIG, roundPairings, tournament } = require('./game.cjs');
const { orderBotDeck } = require('../../src/game/botTactics.ts');

function randomSource(seed) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
}
const pick = (items, random) => items[Math.floor(random() * items.length)];
function duel(a, b, trace = false) {
  const make = b => fighter(b.id, b.deck, b.augments, b.xp, b.acquired, b.level);
  const battle = simulate(make(a), make(b));
  const last = battle.frames.at(-1);
  return { score: battle.outcome === 'victory' ? 1 : battle.outcome === 'draw' ? .5 : 0,
    ticks: last.tick, healthA: last.player.health, healthB: last.bot.health,
    maxHealthA: last.player.maxHealth, maxHealthB: last.bot.maxHealth,
    castsA: last.player.memory.casts, castsB: last.bot.memory.casts,
    endReason: battle.endReason, ...(trace ? { battle } : {}) };
}
function build(random, id, stage) {
  const domains = [...new Set(PLAYABLE_SPELLS.map(id => SPELLS[id].domain))];
  const domain = pick(domains, random);
  const second = pick(domains, random);
  const pool = PLAYABLE_SPELLS.filter(id => SPELLS[id].domain === domain || SPELLS[id].domain === second);
  const size = Math.min(RULES.slots, stage === 1 ? 3 : stage === 3 ? 6 : 10);
  const deck = [];
  // Same printed acquisition cost and upgrade count within each stage.
  for (let i = 0; i < size; i++) {
    const stars = i % 5 + 1;
    const legal = pool.filter(id => canAddSpell(deck, id));
    const ranked = legal.filter(id => SPELLS[id].stars === stars);
    deck.push(pick(ranked.length ? ranked : legal, random));
  }
  const augments = [];
  for (let i = 0; i < Math.min(stage - 1, Object.keys(AUGMENTS).length); i++)
    augments.push(pick(Object.keys(AUGMENTS).filter(id => !augments.includes(id)), random));
  return { id, stage, level: stage, deck, augments,
    xp: deck.map((_, i) => stage >= 5 && i % 3 === 0 ? 3 : 0), acquired: deck.map((_, i) => i),
    profile: [...new Set(deck.map(id => SPELLS[id].domain))].sort().join(' + ') };
}
function runSeed(options, progress = () => {}) {
  const random = randomSource(options.seed), builds = [], matches = [], searches = [], dependencies = [];
  const record = (a, b, mode, round = 0) => {
    const result = duel(a, b);
    matches.push({ a: a.id, b: b.id, mode, round, stage: a.stage, ...result });
    return result;
  };
  for (const stage of [1, 3, 5]) {
    const pool = Array.from({ length: options.builds }, (_, i) => build(random, `arena-${stage}-${i}`, stage));
    builds.push(...pool);
    for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) {
      record(pool[i], pool[j], 'arena'); record(pool[j], pool[i], 'arena');
    }
    progress(`Stage ${stage}: ${matches.length} battles completed`);
    // Discover candidates against training opponents, report only held-out evaluation.
    const training = pool.slice(0, Math.floor(pool.length / 2));
    const heldOut = pool.slice(Math.floor(pool.length / 2));
    const fitness = b => training.reduce((sum, enemy) => sum + duel(b, enemy).score + (1 - duel(enemy, b).score), 0) / (2 * training.length);
    for (let restart = 0; restart < (options.restarts ?? 1); restart++) {
    let best = structuredClone(training[restart % training.length]), score = fitness(best);
    for (let n = 0; n < options.search; n++) {
      const candidate = structuredClone(best), slot = Math.floor(random() * best.deck.length);
      if (n % 3 === 0 && candidate.augments.length) {
        const at = Math.floor(random() * candidate.augments.length);
        candidate.augments[at] = pick(Object.keys(AUGMENTS).filter(id => !candidate.augments.includes(id)), random);
      } else if (n % 3 === 1) {
        const at = Math.floor(random() * best.deck.length);
        [candidate.deck[slot], candidate.deck[at]] = [candidate.deck[at], candidate.deck[slot]];
        [candidate.xp[slot], candidate.xp[at]] = [candidate.xp[at], candidate.xp[slot]];
        [candidate.acquired[slot], candidate.acquired[at]] = [candidate.acquired[at], candidate.acquired[slot]];
      } else {
        const legal = PLAYABLE_SPELLS.filter(id => SPELLS[id].stars === SPELLS[best.deck[slot]].stars && canAddSpell(candidate.deck.filter((_, i) => i !== slot), id));
        candidate.deck[slot] = pick(legal, random);
      }
      const next = fitness(candidate);
      if (next > score) { best = candidate; score = next; }
    }
    best.id = `search-${stage}-${restart}`;
    best.profile = [...new Set(best.deck.map(id => SPELLS[id].domain))].sort().join(' + ');
    builds.push(best);
    for (const enemy of heldOut) { record(best, enemy, 'search'); record(enemy, best, 'search'); }
    searches.push({ id: best.id, trainingScore: score });
    dependencies.push(...probeDependencies(best, heldOut.slice(0, 4), random));
    }
    // Same cards, XP, ages and augments; isolate the effect of bot ordering.
    const tactical = pool.map(b => ({ ...b, ...orderBotDeck(b), id: b.id.replace('arena-', 'tactical-') }));
    builds.push(...tactical);
    for (let i = 0; i < tactical.length; i++) for (let j = i + 1; j < tactical.length; j++) {
      record(tactical[i], tactical[j], 'tactical'); record(tactical[j], tactical[i], 'tactical');
    }
  }
  for (let t = 0; t < options.tournaments; t++) {
    const ids = Array.from({ length: 8 }, (_, i) => `t${t}-bot${i}`), states = createBotStates(ids);
    const decks = Object.fromEntries(ids.map(id => [id, []]));
    const trophies = Object.fromEntries(ids.map(id => [id, 0]));
    for (let round = 1; round <= options.rounds; round++) {
      const level = 1 + Math.floor((round - 1) / RULES.augmentEvery);
      const current = {};
      ids.forEach((id, i) => {
        const index = t * 8 + i;
        states[id].strategy = (t * 8 + i) % BOT_CONFIG.strategies.length;
        decks[id] = prepareBot(states[id], decks[id], round, index, options.difficulty, options.seed);
        const state = states[id];
        current[id] = { id: `${id}-r${round}`, deck: [...decks[id]], xp: [...state.spellXp], acquired: [...state.spellAcquired],
          augments: [...state.augments], level, stage: level, strategy: BOT_CONFIG.strategies[state.strategy].id,
          lineage: id, gold: state.gold, profile: [...new Set(decks[id].map(id => SPELLS[id].domain))].sort().join(' + ') };
        builds.push(current[id]);
      });
      for (const [a, b] of roundPairings(ids, round)) {
        const result = record(current[a], current[b], 'progression', round);
        if (result.score !== .5) trophies[result.score === 1 ? a : b] += level;
      }
      if (Object.values(trophies).some(n => n >= tournament.trophiesToWin)) break;
      ids.forEach((id, i) => grantBotAugment(states[id], decks[id], round, t * 8 + i, options.seed));
    }
    progress(`Tournament ${t + 1}/${options.tournaments}: ${matches.length} battles completed`);
  }
  // Paired removal: same fighter and opponent; measures combat contribution only.
  const contributions = [];
  const arena = builds.filter(b => b.id.startsWith('arena-'));
  for (const a of arena) {
    const enemies = arena.filter(b => b.stage === a.stage && b.id !== a.id).slice(0, 4);
    for (const augment of a.augments) for (const b of enemies) {
      const removed = { ...a, augments: a.augments.filter(id => id !== augment) };
      const full = (duel(a, b).score + 1 - duel(b, a).score) / 2;
      const without = (duel(removed, b).score + 1 - duel(b, removed).score) / 2;
      contributions.push({ augment, build: a.id, opponent: b.id, stage: a.stage, delta: full - without });
    }
  }
  return { builds, matches, searches, contributions, dependencies };
}

function probeDependencies(build, enemies, random) {
  const score = b => enemies.reduce((sum, enemy) => sum + duel(b, enemy).score + 1 - duel(enemy, b).score, 0) / (enemies.length * 2);
  const baseline = score(build), probes = [];
  const record = (kind, detail, candidate) => probes.push({ build: build.id, stage: build.stage, kind, detail, baseline, score: score(candidate), opponents: enemies.length });
  const seen = new Set([JSON.stringify([build.deck, build.xp, build.acquired])]);
  for (let n = 0; n < 6; n++) {
    const order = build.deck.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const candidate = { ...build, deck: order.map(i => build.deck[i]), xp: order.map(i => build.xp[i]), acquired: order.map(i => build.acquired[i]) };
    const key = JSON.stringify([candidate.deck, candidate.xp, candidate.acquired]);
    if (!seen.has(key)) { seen.add(key); record('order', candidate.deck.join(' → '), candidate); }
  }
  for (const augment of build.augments) record('augment', augment, { ...build, augments: build.augments.filter(id => id !== augment) });
  build.deck.forEach((id, slot) => {
    const legal = PLAYABLE_SPELLS.filter(next => next !== id && SPELLS[next].stars === SPELLS[id].stars && canAddSpell(build.deck.filter((_, i) => i !== slot), next));
    if (!legal.length) return;
    const replacement = pick(legal, random), deck = [...build.deck]; deck[slot] = replacement;
    record('card', `${id} → ${replacement} (slot ${slot + 1})`, { ...build, deck });
  });
  return probes;
}

function run(options, progress = () => {}) {
  const combined = { builds: [], matches: [], searches: [], contributions: [], dependencies: [] };
  for (let offset = 0; offset < (options.seeds ?? 1); offset++) {
    const seed = (options.seed + offset) >>> 0;
    const data = runSeed({ ...options, seed }, message => progress(`Seed ${seed}: ${message}`));
    const id = value => `s${seed}/${value}`;
    data.builds.forEach(b => { b.id = id(b.id); if (b.lineage) b.lineage = id(b.lineage); b.seed = seed; });
    data.matches.forEach(m => { m.a = id(m.a); m.b = id(m.b); m.seed = seed; });
    data.searches.forEach(s => { s.id = id(s.id); s.seed = seed; });
    data.contributions.forEach(c => { c.build = id(c.build); c.opponent = id(c.opponent); c.seed = seed; });
    data.dependencies.forEach(p => { p.build = id(p.build); p.seed = seed; });
    for (const key of Object.keys(combined)) combined[key].push(...data[key]);
  }
  return combined;
}
module.exports = { randomSource, build, duel, run, probeDependencies };
