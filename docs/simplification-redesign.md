# Simplification redesign

Implemented from the supplied Wizard1v1_Simplification_Redesign proposal, using the user's high-level direction as the scope: remove mana, replace items with shared combat rewards, consolidate keywords, and make card rarity clearer.

## Shipped rules

- 109 playable spells: Nature 25, Water 19, Fire 20, Holy 23 and Affliction 22. See [the spell overhaul](Spell_Overhaul_Notes.md) for the latest changes.
- Start at level 1 with 500 base Health; every two completed rounds grant one level, +100 max Health and an augment. Wins grant current-level trophies; reach 20 to win.
- 1–3T spells plus Instant upgrades; fixed 1T reshuffle; 40-tick limit; no mana. Potency supplies seeded critical chance.
- Expanded shared glossary for the spell overhaul: 10-point Poison/Regeneration, duration-based Slow, Guard immunity, capped Channel, Tidecaller Echoes and Heat cast-speed payoffs.
- 32 permanent, nonstacking augments. Pick one of three after rounds 2, 4, 6, etc., regardless of duel outcome. All seven bots receive rewards too.
- Retained five-offer shop, gold, rank odds, rerolls, ten-card order, duplicate XP upgrades, drag purchases/reorder/trash, eight-player tournament and scouting.
- Open shop access with at most two attuned domains, selected by card count then oldest surviving card. Explicitly marked effects require attunement; there are no passive Affinity buffs. Early spells retain basic effects while later payoffs rely more heavily on commitment.

## Concrete interpretations

The supplied three-domain overhaul supersedes the original Heat, Tide, periodic potency and interrupt rules. See [overhaul decisions](Spell_Overhaul_Notes.md) for defaults and [combat conventions](../src/config/COMBAT_RULES.md) for timing.

Channel now powers Photosynthesis and Whirlpool. Unique remains available but is not used by this catalogue. Augment effects use existing artwork/domain emblems, with code-rendered frames instead of new generated bitmap borders. Old bitmap frame assets are preserved but no longer rendered, so no mana socket can remain baked into the visible card.

## Mobile presentation

The Codex browser is set to 832 × 384 logical pixels for S24 Ultra landscape testing. Device display/zoom settings may vary. Shop cards use the full available offer width, a high-contrast rarity band, explicit cast time, and uncluttered effect text. Small hand cards show identity and progress; hold/drag opens a readable preview away from the pointer. Reward cards explain their keywords and retain visible selection buttons while their text scrolls.

## Verification

The retired mana/item/domain-specific test suites were replaced by the new combat and augment contracts, rather than disabled. Existing purchase, XP, trash, layout, shop-odds, tournament and native-compatibility coverage was retained and migrated. Changes are applied directly to the working code. Browser testing covers fresh-run shopping, drag purchases, multiple domains, duels, free reward selection, all-player augment scouting, and mobile rarity display.

Reload after installing this ruleset: local in-memory sessions do not migrate removed cards or items. Competitive balance and physical-device touch testing remain follow-up playtesting work.
