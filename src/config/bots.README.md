# Bot balancing

Edit bots.json. Difficulty is chosen for a new run and stays fixed for that run.

- economy: initial gold, income each following round, reroll cost and first equipment round. Unspent gold persists.
- deck: target opening size, growth per round, maximum fraction of support cards, minimum score gain to replace a card, and penalty for excess non-Channel copies. Game slot and two-domain limits always apply.
- weights: relative purchase values, synergy bonus, preferred-spell bonus, and mana-shortfall penalty.
- strategies: stable domain pairs and preferred catalogue spell IDs. Bots keep their strategy throughout the run.
- shoppingRolls: maximum shop searches each round. Each search after the first costs gold unless covered by freeRerolls.
- orderTrials: number of spell-order swaps tested against fixed practice decks. Zero skips ordering optimization. No current human deck is consulted.
- mistakeChance: probability from 0 to 1 of choosing a random valid improvement instead of the highest-scoring one.
- equipmentBudget: maximum gold spent on equipment per round, limited by available gold.
- bonusGoldPerRound, freeRerolls, shopRoundBonus: private difficulty advantages beginning at advantageStartsRound. shopRoundBonus advances the round used for configured shop rank odds. These values and private bot wallets are not returned in session snapshots or displayed in gameplay.

No hidden health, mana, damage, crit, or result overrides are applied. Equipped items use the same modifiers as player equipment. Gold, spells, equipment and order evolve before every round; leaderboard decks remain snapshots of the last combat.

This is still a local prototype: bundled configuration can be inspected on the client. For true secrecy, move bot planning and these settings to the server behind GameGateway.
