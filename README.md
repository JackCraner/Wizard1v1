# Wizard 1v1

A mobile spell auto-battler built with Expo, React Native and TypeScript. Buy and arrange spells, watch simultaneous duels, and choose permanent augments as you level up.

## Play

- Build a six-spell combat sequence from five shop offers. Spells cost their star rarity + 1 gold; rerolls cost 2 gold before augment modifiers.
- Drag offers into your hand to buy, drag matching copies together to merge, or hold a card to inspect. Shopping permits extra cards temporarily; reduce to six before battle.
- The two most common domains are attuned, with ties decided by the oldest surviving card. Only explicit attuned clauses require them.
- Start at 500 Health. Every two rounds, everyone gains a level, 100 max Health and an augment choice. Each win awards trophies equal to your level; first to 20 wins.
- Triggers arm after their first completed cast and can chain. Duels last up to 30 ticks, with one reshuffle tick between cycles. There is no mana.

## Run and verify

`pnpm install --frozen-lockfile`, then `npm run web` or `npm run android`.

Run `npm run typecheck`, `npm test` and `npm run docs:check` before finishing changes. Runs live in memory; reloading starts fresh.

## Documentation

- [Combat rules](docs/Combat.md): current timing, counters, protection and trigger behavior.
- [Spells and augments](docs/Spell_and_Augment_Reference.md): generated base/upgraded rules for every domain and reward.
- [Development guide](docs/Development.md): architecture, configuration, browser previews and Android builds.
- [AGENTS.md](AGENTS.md): repository guidance for coding agents.
- [Balance lab](tools/balance-lab/README.md): optional offline balance simulations.

Artwork/font source instructions and licensing information remain alongside their assets. Historical redesign notes are available in Git history; shipping configuration and executable tests are authoritative.
