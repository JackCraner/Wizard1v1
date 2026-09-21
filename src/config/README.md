# Editable card and combat configuration

- Each domain has its own `spell.json`: `nature/spell.json`, `water/spell.json`, `fire/spell.json`, `holy/spell.json`, and `affliction/spell.json` (currently empty).
- The 98 cards keep their stars, mana, castTicks, rules, keywords, notes, executable `combat.effects` or `combat.blockedReason`, and full `upgrade` object. Gold cost equals stars. `catalogue.ts` combines the domain arrays in a stable order.
- `keywords.json`: every keyword's wording and related explanation boxes; the root README contains the full glossary.
- `rules.json`: base stats, tick limit, crit multiplier, deck/domain limits and five spell offers.
- `statuses.json`: periodic potency and status definitions. `holy.json`: Holy mechanics, including uncapped Penance.
- `equipment.json`: 80 unlimited stackable items. `itemShop.json`: three item offers and affinity weights.
- `shopOdds.json`: round-based rank probabilities for spells and items.
- `bots.json`, `tournament.json`, `playback.json`: difficulty, eight-player race and combat playback.
- `COMBAT_RULES.md`: timing and unresolved design decisions.

Mana 0 is free, null is unknown, and "half" pays half current mana rounded down at cast start. castTicks 0 is Instant, positive values are casting ticks, and null is unknown. Instant resolves before periodic effects and still consumes that wizard's tick.

Update both rules text and structured effects when balancing a card, including its upgrade. Effect amounts usually set applied stacks; shared periodic potency lives in statuses.json. Only playable cards with resolved mechanics and costs enter the shop and bot decks; blocked entries remain in the library.

SpellCard accepts CardDefinition plus optional art, compact and shop props. Art is registered with static require paths in src/components/cards/spellArt.ts. Missing illustrations leave an empty opening. Domain cast-time badges are registered in SpellCard.tsx. Add item illustrations to ITEM_ART in ItemInventory.tsx. Spell art is reused for timeline and status icons.

## Shop rank progression

Each rankPercent array in shopOdds.json lists ranks 1–5 and totals 100. fromRound applies until the next row; the final row applies indefinitely. Round 1 is rank 1 only. Each of the five spell slots and three item slots rolls independently, including on rerolls. Domain constraints and unavailable-card exclusions still apply. Missing ranks redistribute probability among eligible ranks with nonzero odds. Offers are consumed on purchase and refill on reroll or the next round.
