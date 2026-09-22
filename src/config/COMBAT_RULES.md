# Combat conventions

## Tick order

1. Start both fighters' next casts unless reshuffling or Stunned. Apply duration-based Slow, casting modifiers, then spend five Heat for an exact 1T non-Instant cast. Reserve five Tidecaller for an Echo when available.
2. Resolve Instant spells before everything else. Apply their damage together and check knockouts. Each fighter starts at most one card per tick.
3. Apply Poison (10 damage) and Regeneration (10 healing), then decrease their duration. Apply damage and check knockouts.
4. Capture the tick-start replay snapshot. Finish a reshuffle tick, or advance ordinary casts, unless Stunned. Resolve interrupts first: even finishing 1T spells can be canceled; simultaneous interrupts cancel each other. Interrupt also skips the remainder of a Channel group, capped at three adjacent copies.
5. Resolve ordinary completions and their Echoes. Healing, Guard and Ward protect against queued simultaneous damage. Apply queued damage, then check knockouts.
6. Decrease durations that were already present at tick start. Save the completed snapshot.

After the final card, spend one full tick reshuffling and restart the same order. Reckless Loop explicitly skips that wait for a 25-Health cost. At 40 ticks, higher remaining Health wins; ties are draws.

## Effects

- Ward does not add: keep the higher of current Ward and the new shield. Damage consumes Ward.
- Guard prevents damage during its duration. Resilience halves damage; Frailty adds 20% incoming damage. Explicit Health loss costs bypass protection.
- Slow adds exactly +1T to each non-Instant cast started during its duration, without changing casts already underway.
- Trap deals 10 damage on each completed spell, once regardless of Echoes. Fury adds 10% outgoing damage; Weaken reduces outgoing damage by 20%.
- Tidecaller: at five, the next started spell consumes five and receives a 50% Echo. Echo effects round to integers, do not recurse, and share the original critical roll. Tidal Power modifies the next Echo. Interrupted spells lose reserved charges.
- Heat: at five, the next non-Instant spell consumes five and has exactly 1T cast time. It no longer boosts damage or triggers Empowered.
- Combust: +10 percentage points of critical chance per persistent charge, capped at 100%. Seeded rolls make replays deterministic. Critical spells deal 150% damage by default; Eruption can set 200% or 250%.
- Generic Empowered remains +50% direct damage, healing and Ward. Critical damage is separate.
- Poison/Regeneration durations add. Venom Bloom modifies Poison potency; Flourish modifies Regeneration healing until next Cycle. Cultivate consumes the specified over-time effect for its printed payoff: Cycle of Life heals remaining Regeneration, while Nightmare damages from remaining enemy Poison.
- Oaths track the next full ticks and resolve rewards after normal combat. A new Oath replaces the old one; interruption and reshuffling do not cancel it. See the Holy notes for condition and reward timing.
- Fragile removes an individual copy from rotation after its first completed cast this duel, preserving its purchased copy and XP for the next duel. Empty rotations stop casting.
- Two attuned domains are selected by held-card count, then oldest surviving card. Only explicit printed requirements gate effects. Buying/merging/trashing can change priority; reordering cannot. Cast speed requirements have explicit unattuned fallbacks.

## Progression and permanent rewards

Start at level 1 with 500 base Health. After every two completed rounds, every player gains a level, +100 max Health and one free permanent augment. Each duel starts at full current max Health. Wins grant trophies equal to the combat level; losses/draws give none. Resolve every duel in the round before awarding the crown to all players at or above 20 trophies.

The human chooses from three unowned augments; bots receive the same cadence. Selection locks other actions. Scholar grants bonus XP to the first purchased duplicate per shop; owned-card merges stay +1. Recycler refunds explicit trash only. Glass Cannon subtracts 125 max Health and adds 30% outgoing damage. Second Wind triggers once only while alive at or below 30% Health.

See [overhaul decisions](../../docs/Spell_Overhaul_Notes.md) for defaults on incomplete entries, and [all spells and augments](../../docs/Spell_and_Augment_Reference.md) for editable values.

## Affliction companions and control

See [Affliction overhaul notes](../../docs/Affliction_Overhaul_Notes.md) for Imp interception, Curse, Stun, conditional Rupture timing, sacrifice and provisional values. The current reference contains 109 spells, including 22 Affliction spells.

## Holy and Fragile

See [Holy overhaul notes](../../docs/Holy_Overhaul_Notes.md) for timed Oaths, healing conversion, Fragile rotation, and chosen interpretations.
