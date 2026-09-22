# Nature, Water and Fire overhaul — implementation notes

This pass implements the supplied spell list, with Guard and brackets interpreted using the user's clarification. The editable [complete reference](Spell_and_Augment_Reference.md) contains all base/upgraded spell effects and augments.

## Confirmed rules

- Guard is damage immunity for a duration, not a charge that blocks one hit.
- Square brackets mean the effect requires the card's domain attunement. The game prints the exact requirement.
- Ward keeps the stronger shield instead of adding shields together.
- Channel groups contain at most three adjacent identical cards. Each extra copy adds the printed bonus. An interrupt skips the rest of that group.
- Poison and Regeneration tick for 10 damage/healing. Slow lasts for a duration and adds +1T to spells begun while active. Instant resolves before periodic effects and ordinary spells. Interrupt can stop a finishing 1T spell.

## Defaults chosen for entries left open

The user authorized reasonable defaults for later revision.

- A vertical bar introduces the upgraded version. Unmentioned base effects carry over. A bracketed stronger value retains the base value while unattuned, rather than making the upgrade weaker.
- Astral Power, Tidal Power and Heatwave use 1T.
- The healing Phoenix is **Phoenix Renewal** (4★); the defensive one is **Phoenix Guard** (5★).
- Lava Floor upgrades from 3 to 5 Trap duration. Phoenix Guard upgrades from 1 to 2 Guard duration per Heat.
- Upgraded Bear's Resilience lasts for the rest of that combat. Ordinary Bear lasts 8 ticks.
- Budding Life's upgrade increases self Regeneration to 8 and retains 5 applied to the enemy.
- Cycle of Life's upgrade retains Cultivate and adds 100 healing.
- “All” means all enemies for damage and all allies for healing. Each side has one fighter in this duel, so Starfall/Wild Growth affect that one target; Emberstorm's area upgrade is equivalent in the current 1v1 format.
- “Regeneration — 10 damage” is treated as 10 healing, consistent with its HoT description.
- Venom Bloom and Eruption keep their strongest multiplier for the rest of combat; recasting does not stack them. Flourish's extra healing lasts until the next Cycle. Celestial Alignment/Tidal Power are consumed by the next relevant spell/Echo.
- Critical hits deal 150% total damage by default; Eruption changes this to 200%/250%. Potency adds 10 percentage points per charge, capped at 100%, and is not consumed. Each spell and its Echo share one seeded critical result.
- Five Heat are consumed at the start of the next non-Instant spell, making it exactly 1T even through Slow. Instant remains Instant. Extra charges remain.
- Five Tidecaller are reserved at cast start for one Echo. Charges gained by that spell cannot echo itself. Interrupt loses the reserved Echo. Per-charge payoffs read the remaining charges at resolution.
- Duration buffs/debuffs lose one tick at the end of each following tick; Poison/Regeneration tick after Instant. Reapplications extend duration. Fury/Weaken/Resilience percentages do not stack.
- Guard prevents damage including Poison, Trap and “take damage” costs. Explicit “lose Health” effects, such as Overheat's half-Health cost and Reckless Loop, bypass protection.
- One-debuff Cleanse uses a stable priority: Poison, Slow, Trap, Weaken, Frailty, Curse.
- Rot, Rain and the proposed Doom counter have no fully specified spell/effect in these three lists. They remain future definitions. The former Affliction spell named Doom was subsequently replaced by the Affliction overhaul.

## Compatibility

Holy and Affliction card lists are retained; shared status and timing rules apply to them too. The 32 augments remain, with Tide references migrated to Tidecaller. Steam grants its Heat after the triggering Fire spell resolves, since Heat is now spent at cast start. Starting Health, levels, 20-trophy scoring, shop economy, upgrades and the one-tick reshuffle remain intact.

Reload the app to start a new run after installing this catalogue; removed card IDs are not migrated in in-memory runs. Existing artwork is reused where available, with domain emblems for the new spells.

## Later Affliction update

Affliction now has 22 spells. Its new Imp, Curse and Stun rules are documented in [Affliction overhaul notes](Affliction_Overhaul_Notes.md). These supersede references above to the old Affliction list.

Holy was subsequently replaced with 23 spells; see [Holy and Fragile notes](Holy_Overhaul_Notes.md). The complete reference now contains 109 spells.
