# Game configuration

- Each domain's spell.json defines spells and explicit upgrades: Nature 25, Water 19, Fire 20, Holy 23, Affliction 22. Gold equals stars; castTicks is 0 (Instant), 1, 2 or 3. instantDomain/castDomain store conditional cast speed; unattunedCastTicks stores the fallback.
- augments.json defines 32 unique permanent rewards. game/augments.ts selects three unowned choices with category variety; their behavior is implemented in the engine, shop, bots or local gateway.
- keywords.json is the shared glossary. statuses.json defines duration versus charges and periodic potency.
- rules.json defines base Health and Health per level, ten deck slots, five shop slots, 40 ticks, two reshuffle ticks, a maximum of two attuned domains and rewards every two rounds.
- shopOdds.json controls star probabilities independently of domain selection.
- bots.json controls difficulty shopping attempts, income advantages, opening deck growth and domain preferences.
- tournament.json and playback.json control the race to 20 trophies and replay speeds.

All 109 cards are playable at both upgrade levels. Removed systems and old card definitions remain in Git history. See COMBAT_RULES.md for timing, CARDS.md for the current list, and ../../docs/simplification-redesign.md for migration choices.
