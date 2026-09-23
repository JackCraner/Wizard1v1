# Trigger and spell revision

Implemented from the supplied September 23 revision: 130 spells, 26 in each Domain. The [complete spell reference](Current_Spell_Reference.md) lists all base and upgraded effects.

## Trigger timing

Each copy begins Dormant. Its first successful cast and resulting event chain finish before it becomes Armed. Interrupted casts do not arm it. Armed copies persist across Cycles and can each fire once per tick. Eligible copies resolve in sequence order; normal Trigger effects may activate other unused Armed Triggers. There is no global chain-length cutoff.

Retrigger remains separate: replay the latest eligible Armed Trigger from this Cycle without changing history or creating further Trigger chains. Broken cards are immediately ineligible.

New event connections include actual Heat/Tide consumption, Ward increases, enemy Curse application, Imp attacks, outgoing damage, healing and self-damage. Existing Echo, Poison, Imp Hurt, Oath, Cycle and Fatal events remain.

## Interpretation of edge cases

- Heal requires actual Health restored, including Regeneration and healing an Imp. Overhealing cannot start a chain.
- Damage includes damage absorbed by Ward or Imp. Guard-blocked hits emit no damage event. Self-Damage requires actual self-caused Health loss.
- Ward Gain carries the actual increase. Bear's upgraded Trigger heals a rounded-down fraction of that amount, once per tick. Its first cast cannot heal through its own Dormant Trigger.
- Free Living Flame and Maelstrom activations take priority over ordinary resource consumption. Each gives one activation, not an additional Echo. Cast interruption still uses that Cycle's activation.
- Maelstrom can Echo an Instant first spell. Living Flame explicitly selects the first non-Instant Fire spell. Neither modifies a spell that started before the permanent rule was acquired.
- Cast-start conditions retain their original Ward/Tide snapshot. Heatwave expires at the Cycle boundary. First-domain bonus generation checks earlier completed spells in the Cycle.

## Presentation and verification

Trigger cards show Dormant, Armed and spent-until-next-tick states, with an arming pulse and staggered chain flashes. Source darts retain their spell, Imp or player origins and pause with playback. Existing self/Cycle exclamation effects remain.

Development previews: `?combat-lab=chains` demonstrates damage, healing, self-damage, Curse and Imp connections; `?combat-lab=ward` demonstrates Ward, Poison, Tide and Echo interactions. These use the normal combat UI and do not persist a run.

Run `node tools/refresh-spell-reference.cjs` after editing spell JSON to refresh the Markdown references.
