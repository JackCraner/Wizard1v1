# Editable card and combat configuration

- `spells.json`: the 71 cards, stars, mana, castTicks, concise rules, keywords, notes, and executable `combat.effects` or `combat.blockedReason`. Gold cost is always the star value.
- `keywords.json`: keyword wording and related explanation boxes.
- `rules.json`: base stats, tick limit, crit multiplier, seed and other shared limits.
- `statuses.json`: periodic damage/healing values and timed status definitions.
- `COMBAT_RULES.md`: implemented timing and remaining design questions.

Mana 0 is free, `null` is unknown, and `"half"` is half mana (currently blocked pending its definition). `castTicks: 0` is Instant, a positive number is casting ticks, and null is unknown.

Card text is plain text; `RulesText` bolds recognized keywords. When changing numeric effects, update both the concise rules sentence and its structured `combat.effects` in the same card object. Buff duration uses the effect's amount; periodic potency lives in statuses.json.

The game, shop, bots and card UI use this catalogue. Only cards with implemented effects and resolved costs are offered. The old six-spell prototype pool is removed. Old in-memory sessions need a new game after the schema change.

SpellCard accepts CardDefinition fields directly as props, plus optional art/compact. CardPreview includes keyword boxes. Art belongs in assets/nature, assets/water, or assets/fire, registered with static require paths in src/components/cards/spellArt.ts. Missing artwork renders an empty area. Seed Shot is the sole integrated generated illustration; further generation was stopped at the user's request.

Seed Shot used built-in image generation with this prompt: glowing seed projectile, two leaves and curved green magical sparks; dark forest backdrop; bold painted emerald and gold shapes; centered square, no text, border or UI.

## Shop rank progression

Edit `shopOdds.json`. Each `rankPercent` array lists the percentages for ranks 1, 2, 3, 4 and 5, in that order, and must total 100. Rank means a card's star value. `fromRound` applies until the next configured row; the last row applies indefinitely. Round 1 must remain [100, 0, 0, 0, 0]. These are initial balancing values, not TFT's odds.

Each of the four shop slots rolls rank independently, including on rerolls. Four cards will not necessarily match the percentage split in any individual shop. Selection then encourages domain variety without changing the rolled rank. The two-domain deck restriction and unavailable-card exclusions still apply. If a rank has no eligible playable cards, its chance is redistributed proportionally among eligible ranks with nonzero odds. Zero-odds ranks never appear. If no configured rank is available, generation reports an explicit configuration error. Repeated cards are allowed when a selected pool is exhausted.
