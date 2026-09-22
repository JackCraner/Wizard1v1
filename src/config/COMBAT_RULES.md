# Simplified combat conventions

## Tick order

1. Both fighters trigger active Poison (15 damage) and Regeneration (15 healing), then lose one duration. Healing is capped. Periodic damage is applied together; check knockouts.
2. Spend a reshuffle tick, or start the next spell. Printed cast times are 1–3T. Slow is consumed at start and adds up to two ticks. Augment reductions have a 1T minimum.
3. Capture the replay's tick-start snapshot. Advance ongoing casts one tick.
4. Resolve every completed spell. Healing and Ward apply before queued simultaneous damage. Interrupt cancels only an unfinished enemy spell, advances its position, and breaks its Oath. Already completed spells both resolve.
5. Apply all queued damage, including health costs, then check knockouts. Second Wind triggers once only if damage leaves its owner alive at or below 30% Health; it cannot revive.
6. Decrement previously active Frailty and Curse durations. New applications keep their full duration. Save the completed snapshot.

After the last spell, the deck pauses for one full tick and restarts in the same order. A Cycle includes that reshuffle. Statuses keep ticking. At 40 ticks, higher Health wins; equal Health is a draw. The engine never rolls random critical hits.

## Shared effects

- Poison and Regeneration use fixed potency and additive durations, never potency multiplied by remaining duration.
- Tide and Heat are persistent charges. Slow is also a charge, consumed on the next cast start.
- Ward is a numeric, nondecaying shield. Health costs bypass Ward and Frailty.
- Frailty increases incoming enemy damage by 20%. Curse of Repetition costs 25 Health when successive completed spells share a domain, including across cycles.
- Cleanse removes Poison, Slow, Frailty and Curse, preserving positive effects.
- Poison-condition and per-status values use the shared state immediately before simultaneous spell resolution. Consume removes the target's actual remaining resource when its effect resolves.
- Each Heat grants +4% Fire direct damage. An eligible printed Fire payoff spends five Heat once when it completes, then uses its printed Empowered damage. Its damage uses Heat before spending. Generic Empowered effects use printed Empowered damage where supplied; otherwise +50% direct damage, healing and Ward. Status-only spells gain no numeric benefit.
- Repeat resolves effects again but does not advance deck position or Oath/augment counters. Echo/Tide/Echo Chamber choose the largest repeat count, not a product; Rapid Casting may add one half-power repeat. Resource spends still require sufficient charges. Consume cannot spend the same resource twice.
- Oaths test the next three completed spells, not their repeats. Patience requires printed 2T or 3T; Mercy requires no direct damage effect. A failed condition, interruption or replacement breaks/replaces the Oath. Judgment checks completion earlier in the same Cycle.
- Attune to the two domains with the most held cards, breaking ties by oldest surviving acquisition age. Reordering preserves age; purchased copies get a new age; merging keeps the recipient’s age and removes the donor. Combat snapshots freeze this selection. There are no passive domain-count multipliers.
- Signature production and consumption require source attunement: Nature → Poison/Regeneration, Water → Tide, Fire → Heat, Holy → Oath, Affliction → Frailty/Curse. Incoming debuffs still apply without the victim being attuned. Augment keyword production follows the same gate. Ward, Slow and generic Empowered remain shared. Printed Fire Empowered amounts require Fire attunement; otherwise generic Empowered still gives +50%.
- Early resource generators also provide a basic 20 damage/heal (28 upgraded). Rank 3–5 direct damage/heal/Ward without a full keyword gate use 40% of the former printed amount off-domain (rounded), with full power as an explicit attuned bonus. Pure keyword payoffs can have no off-domain effect. Card JSON is authoritative. Applicable augment multipliers multiply; rounded integer amounts are stored in events.

## Permanent rewards

After each even round, Next opens a three-choice free reward. Every bot also selects one unowned augment. Choosing the human reward advances to the next shop, awards income and resets shop-limited counters. No shop, combat or second Next command is allowed during selection. Stale revisions and invalid/repeated choices are rejected without consuming the reward. A finished tournament ends before additional rewards.

Thirty-two augments replace items. Economy effects apply in the shop, not to replay frames. Scholar grants bonus XP to the first purchased duplicate per shop (owned-donor merges stay +1). Recycler refunds only explicit trash, not donor consumption. Deep Pockets applies immediately when the reward choice enters a new shop. Specialist/Wanderer alter domain weights after rank is rolled. All domains stay eligible.

Combat-only memories reset each duel. Once-per-combat Second Wind, every-N-spell counters and cycle counters never leak between rounds. Glass Cannon sets max Health to 375 and adds 30% damage, including Poison. Self-damage does not receive damage bonuses. Replay snapshots copy augments, counters, status durations and card XP.
