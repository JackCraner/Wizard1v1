# Simplification redesign

Implemented from the supplied Wizard1v1_Simplification_Redesign proposal, using the user's high-level direction as the scope: remove mana, replace items with shared combat rewards, consolidate keywords, and make card rarity clearer.

## Shipped rules

- 50 playable spells: 10 per domain, including Affliction, all with explicit upgrades.
- 500 base Health; 1–3T spells; fixed 1T reshuffle; 40-tick limit; no mana, Instant category or random crit system.
- 18 shared glossary terms. Poison/Regeneration use fixed 15-point ticks; Tide/Heat are charges; Ward is a shield; Slow affects the next cast; Oaths last three qualifying spells.
- 32 permanent, nonstacking augments. Pick one of three after rounds 2, 4, 6, etc., regardless of duel outcome. All seven bots receive rewards too.
- Retained five-offer shop, gold, rank odds, rerolls, ten-card order, duplicate XP upgrades, drag purchases/reorder/trash, eight-player tournament and scouting.
- Open domain access with +10% at three matching cards and +20% at five. No hard two-domain shop lock.

## Concrete interpretations

The proposal contains examples and alternatives rather than a fixed specification. This pass chooses +4% Fire damage per Heat and five-Heat printed payoffs; 20% Frailty; 25-Health same-domain Curse; generic Empowered +50% direct damage/heal/Ward; Scholar's first purchased duplicate grants 2 XP. Oaths use printed cast times. These are editable initial balance defaults.

Channel and Unique remain defined shared concepts, but no initial fifty-card entry requires them. Augment effects use existing artwork/domain emblems, with code-rendered frames instead of new generated bitmap borders. Old bitmap frame assets are preserved but no longer rendered, so no mana socket can remain baked into the visible card.

## Mobile presentation

The Codex browser is set to 832 × 384 logical pixels for S24 Ultra landscape testing. Device display/zoom settings may vary. Shop cards use the full available offer width, a high-contrast rarity band, explicit cast time, and uncluttered effect text. Small hand cards show identity and progress; hold/drag opens a readable preview away from the pointer. Reward cards explain their keywords and retain visible selection buttons while their text scrolls.

## Verification

The retired mana/item/domain-specific test suites were replaced by the new combat and augment contracts, rather than disabled. Existing purchase, XP, trash, layout, shop-odds, tournament and native-compatibility coverage was retained and migrated. See the PR for final check results. Browser testing covers fresh-run shopping, drag purchases, multiple domains, duels, free reward selection, all-player augment scouting, and mobile rarity display.

Reload after installing this ruleset: local in-memory sessions do not migrate removed cards or items. Competitive balance and physical-device touch testing remain follow-up playtesting work.
