# Affliction overhaul — 22 September 2026

The catalogue contains 22 Affliction spells with base and upgraded effects. See [all spells and augments](Spell_and_Augment_Reference.md).

## Imp

- Confirmed: the Imp absorbs incoming enemy spell damage before the owner; overflow reaches the owner. Poison, Curse, Trap and self-damage affect the owner directly.
- Summon creates an Imp with X current/max Health. Summoning while it lives adds X to both. Summoning after defeat starts fresh, with no old Guard or maximum Health.
- Imp Guard prevents the whole incoming spell hit, including overflow, for its duration. The owner's Guard, Ward and Resilience protect the owner, not the Imp.
- Empowered Imp persists for the duel and enables one attack after each completed owner spell, including its own cast and later summons. Repeats/Echo do not add attacks. Upgrades use the stronger attack value instead of stacking. The enhancement survives the Imp's death and applies to a replacement.
- Imp attacks use the owner's Fury/Weaken and can be intercepted by the opposing Imp. They do not trigger another Imp attack or spell completion.
- Doomsday requires a living Imp, removes it, then deals its current Health (base) or max Health (upgrade). Repeats cannot sacrifice the same Imp twice. It does not receive an Imp attack afterward.
- Combat shows the Imp, current/max Health, Guard duration or attack value, and a tap-to-inspect explanation, including when replaying ticks.

## Timing and defaults

- Curse: 10 damage per stack at the beginning of each new cycle after reshuffling. Stacks persist until cleansed. The damage value was unspecified, so 10 is provisional.
- Stun pauses casting, starting spells, and reshuffling. Periodic effects and durations continue ticking. A Stun applied by an ordinary spell affects following ticks; ordinary spells already completing together still resolve together. Instant Stun would prevent an ordinary completion that tick.
- Rupture checks enemy Curse when casting starts, then applies Slow or Heat normally. Base becomes 2T, upgrade 1T when Cursed; otherwise both are 3T.
- Regeneration remains healing for 10 per tick; “damage” in its HoT definition is treated as a typo.
- Brackets require Affliction attunement. Unmentioned base effects remain on upgrades. Malison's stronger bracketed Curse amount falls back to the base 2 off-domain.
- Corrupt Ward removes all enemy Ward. Its upgrade is identical until specified; merging it currently provides no additional combat benefit.
- Nightmare consumes all remaining enemy Poison ticks, after that tick's periodic damage, then deals its printed per-tick amount. It does not multiply that amount by Nature's Poison potency.
- Blood Offering loses half the owner's current Health as a Health cost, bypassing protection, and summons that amount (1.5× upgraded). Blood Pact's flat 50 is damage to the owner and respects the owner's protection, even if no Imp is alive.
- All Health amounts round to the nearest integer. Spell damage payoffs use the usual damage modifiers and critical rules.
- Spelling normalized to Devils Bargain and Life Drain. IDs are in the complete reference.
- Doom's trigger and damage remain unspecified, and no supplied spell applies it. It has a glossary entry but no active combat behavior yet.
- Holy cards and supporting legacy keywords remain available. Affliction's old ten-card list is replaced; start a fresh run after updating.
