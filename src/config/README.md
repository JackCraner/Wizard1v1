# Game configuration

- Each domain's spell.json defines ten spells and explicit upgrade values. No spell has mana. Gold cost equals stars; castTicks is 1, 2 or 3.
- augments.json defines 32 unique permanent rewards. game/augments.ts selects three unowned choices with category variety; their behavior is implemented in the engine, shop, bots or local gateway.
- keywords.json is the shared 18-term glossary. statuses.json defines duration versus charges and periodic potency.
- rules.json defines base Health and Health per level, ten deck slots, five shop slots, 40 ticks, one reshuffle tick, a maximum of two attuned domains and rewards every two rounds.
- shopOdds.json controls star probabilities independently of domain selection.
- bots.json controls difficulty shopping attempts, income advantages, opening deck growth and domain preferences.
- tournament.json and playback.json control the race to 20 trophies and replay speeds.

All fifty cards are playable at both upgrade levels. Removed systems and old card definitions remain in Git history. See COMBAT_RULES.md for timing, CARDS.md for the current list, and ../../docs/simplification-redesign.md for migration choices.
