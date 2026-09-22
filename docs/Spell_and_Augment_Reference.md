# Wizard 1v1 — Spell and Augment Reference

Current design reference: 22 September 2026. **50 spells · 5 domains · 32 augments.**

Edit the entries in this document to propose changes, then share it back for implementation. Editing this Markdown alone does not change the game. Stable IDs below identify exactly which spell or augment to update.

## Core rules

- Start at level 1 with 500 max Health. Every two completed rounds, all players gain a level, +100 max Health and an augment. Each new duel starts at full current max Health.
- Each win grants trophies equal to the winner’s current level; losses and draws grant none. Reach at least 20 trophies to win. Multiple players may share victory if they reach the target in the same round.
- Progression: rounds 1–2 → level 1 / 500 Health / 1 trophy per win; rounds 3–4 → level 2 / 600 Health / 2 trophies; rounds 5–6 → level 3 / 700 Health / 3 trophies. Health values are before augment modifiers.

- Spells cost gold equal to their stars. There is no mana.
- Cast times are in ticks (T). One tick is 2 seconds at 1× playback speed.
- Cast left to right, pause for one full tick while the deck reshuffles, then repeat the same order. Reshuffling does not randomize card order. Reckless Loop explicitly skips this pause at a Health cost.
- Each card upgrades at 3 XP. Matching copies normally add 1 XP; Scholar modifies the first purchased duplicate each shop.
- Attune to at most two domains: highest held-card counts, then oldest surviving card. Reordering does not change acquisition age. Merging keeps the recipient’s age and removes the donor.
- Domain-colored signature effects require the source deck’s matching attunement. Incoming enemy debuffs still apply regardless of the target’s attunement.
- Nature: Poison/Regeneration. Water: Tide. Fire: Heat. Holy: Oath. Affliction: Frailty/Curse. Ward, Slow and basic damage/healing are shared.
- After each even combat round, each player chooses one free permanent augment from three offers. Identical augments cannot stack.

## Spells by domain

### Nature — 10 spells

Source: [nature/spell.json](../src/config/nature/spell.json)

#### Wrath

- **ID:** `wrath`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 50 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 70 damage.

#### Moonfire

- **ID:** `moonfire`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 20 damage. Nature attuned: Apply 4 Poison.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 28 damage. Nature attuned: Apply 6 Poison.

#### Regrowth

- **ID:** `regrowth`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Heal 20. Nature attuned: Gain 4 Regeneration.
- **Upgraded cast:** 1T
- **Upgraded effect:** Heal 28. Nature attuned: Gain 6 Regeneration.

#### Sap

- **ID:** `sap`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 25 damage. Heal 20.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 35 damage. Heal 20.

#### Seed Shot

- **ID:** `seed-shot`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Deal 45 damage. Nature attuned: +35 damage if the enemy has Poison.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 63 damage. Nature attuned: +35 damage if the enemy has Poison.

#### Germination

- **ID:** `germination`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Nature attuned: Gain Regeneration equal to enemy Poison duration.
- **Upgraded cast:** 1T
- **Upgraded effect:** Nature attuned: Gain Regeneration equal to twice enemy Poison duration.

#### Nourish

- **ID:** `nourish`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 2T
- **Base effect:** Heal 100.
- **Upgraded cast:** 2T
- **Upgraded effect:** Heal 140.

#### Flourish

- **ID:** `flourish`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Nature attuned: Multiply your Regeneration duration by 2.
- **Upgraded cast:** 2T
- **Upgraded effect:** Nature attuned: Multiply your Regeneration duration by 3.

#### Eclipse

- **ID:** `eclipse`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 2T
- **Base effect:** Nature attuned: Consume all enemy Poison. Deal 15 damage per tick consumed.
- **Upgraded cast:** 2T
- **Upgraded effect:** Nature attuned: Consume all enemy Poison. Deal 21 damage per tick consumed.

#### Ancient Growth

- **ID:** `ancient-growth`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 3T
- **Base effect:** Nature attuned: Gain 10 Regeneration. Gain 40 Ward. Nature attuned: 100 instead.
- **Upgraded cast:** 3T
- **Upgraded effect:** Nature attuned: Gain 14 Regeneration. Gain 40 Ward. Nature attuned: 100 instead.

### Water — 10 spells

Source: [water/spell.json](../src/config/water/spell.json)

#### Splash

- **ID:** `splash`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 20 damage. Water attuned: Gain 1 Tide.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 28 damage. Water attuned: Gain 2 Tide.

#### Undertow

- **ID:** `undertow`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 30 damage. Water attuned: Gain 1 Tide.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 42 damage. Water attuned: Gain 1 Tide.

#### Brine

- **ID:** `brine`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 45 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 63 damage.

#### Riptide

- **ID:** `riptide`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Water attuned: Spend 2 Tide: Heal 100.
- **Upgraded cast:** 1T
- **Upgraded effect:** Water attuned: Spend 2 Tide: Heal 150.

#### Whirlpool

- **ID:** `whirlpool`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Water attuned: Deal 20 damage per Tide.
- **Upgraded cast:** 1T
- **Upgraded effect:** Water attuned: Deal 28 damage per Tide.

#### Ice Lance

- **ID:** `ice-lance`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Deal 35 damage. Apply 1 Slow.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 49 damage. Apply 1 Slow.

#### Tidal Burst

- **ID:** `tidal-burst`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Deal 24 damage. Water attuned: 60 instead. Water attuned: Spend 2 Tide: resolve this spell 2 times.
- **Upgraded cast:** 2T
- **Upgraded effect:** Deal 34 damage. Water attuned: 84 instead. Water attuned: Spend 2 Tide: resolve this spell 2 times.

#### Frostbolt

- **ID:** `frostbolt`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Deal 32 damage. Water attuned: 80 instead. Interrupt the enemy’s current spell.
- **Upgraded cast:** 2T
- **Upgraded effect:** Deal 45 damage. Water attuned: 112 instead. Interrupt the enemy’s current spell.

#### Tidal Wave

- **ID:** `tidal-wave`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 3T
- **Base effect:** Deal 48 damage. Water attuned: 120 instead. Water attuned: Spend 3 Tide: Gain 100 Ward.
- **Upgraded cast:** 3T
- **Upgraded effect:** Deal 67 damage. Water attuned: 168 instead. Water attuned: Spend 3 Tide: Gain 100 Ward.

#### Echo

- **ID:** `echo`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 2T
- **Base effect:** Water attuned: Your next spell resolves 3 times.
- **Upgraded cast:** 2T
- **Upgraded effect:** Water attuned: Your next spell resolves 4 times.

### Fire — 10 spells

Source: [fire/spell.json](../src/config/fire/spell.json)

#### Ember

- **ID:** `ember`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 50 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 70 damage.

#### Scorch

- **ID:** `scorch`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 30 damage. Fire attuned: Gain 2 Heat.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 42 damage. Fire attuned: Gain 2 Heat.

#### Cinder

- **ID:** `cinder`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 20 damage. Fire attuned: Gain 3 Heat.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 28 damage. Fire attuned: Gain 4 Heat.

#### From Ash

- **ID:** `from-ash`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Take 20 damage. Fire attuned: Gain 2 Heat.
- **Upgraded cast:** 1T
- **Upgraded effect:** Take 20 damage. Fire attuned: Gain 3 Heat.

#### Fireball

- **ID:** `fireball`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Deal 60 damage. Fire attuned — Empowered: 100 damage instead.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 84 damage. Fire attuned — Empowered: 100 damage instead.

#### Firekick

- **ID:** `firekick`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 2T
- **Base effect:** Deal 35 damage. Interrupt the enemy’s current spell.
- **Upgraded cast:** 2T
- **Upgraded effect:** Deal 49 damage. Interrupt the enemy’s current spell.

#### Overheat

- **ID:** `overheat`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Take 80 damage. Fire attuned: Gain 5 Heat.
- **Upgraded cast:** 1T
- **Upgraded effect:** Take 80 damage. Fire attuned: Gain 7 Heat.

#### Pyroblast

- **ID:** `pyroblast`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 3T
- **Base effect:** Deal 72 damage. Fire attuned: 180 instead. Fire attuned — Empowered: 300 damage instead.
- **Upgraded cast:** 3T
- **Upgraded effect:** Deal 101 damage. Fire attuned: 252 instead. Fire attuned — Empowered: 300 damage instead.

#### Flashfire

- **ID:** `flashfire`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 1T
- **Base effect:** Fire attuned: Consume all Heat. Deal 40 damage per charge consumed.
- **Upgraded cast:** 1T
- **Upgraded effect:** Fire attuned: Consume all Heat. Deal 56 damage per charge consumed.

#### Inferno

- **ID:** `inferno`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 3T
- **Base effect:** Deal 64 damage. Fire attuned: 160 instead. Fire attuned — Empowered: 240 damage instead. Fire attuned: Gain 3 Heat.
- **Upgraded cast:** 3T
- **Upgraded effect:** Deal 90 damage. Fire attuned: 224 instead. Fire attuned — Empowered: 240 damage instead. Fire attuned: Gain 3 Heat.

### Holy — 10 spells

Source: [holy/spell.json](../src/config/holy/spell.json)

#### Ward

- **ID:** `ward`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Gain 60 Ward.
- **Upgraded cast:** 1T
- **Upgraded effect:** Gain 84 Ward.

#### Smite

- **ID:** `smite`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 50 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 70 damage.

#### Rebuke

- **ID:** `rebuke`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 25 damage. Apply 1 Slow.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 35 damage. Apply 1 Slow.

#### Mend

- **ID:** `mend`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Heal 45.
- **Upgraded cast:** 1T
- **Upgraded effect:** Heal 63.

#### Oath of Patience

- **ID:** `oath-of-patience`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Holy attuned: Oath: complete 3 printed 2T/3T spells to gain 150 Ward.
- **Upgraded cast:** 1T
- **Upgraded effect:** Holy attuned: Oath: complete 3 printed 2T/3T spells to gain 210 Ward.

#### Oath of Mercy

- **ID:** `oath-of-mercy`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Holy attuned: Oath: complete 3 spells with no direct damage to heal 150.
- **Upgraded cast:** 1T
- **Upgraded effect:** Holy attuned: Oath: complete 3 spells with no direct damage to heal 210.

#### Cleanse

- **ID:** `cleanse`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Cleanse all negative effects. Heal 20.
- **Upgraded cast:** 1T
- **Upgraded effect:** Cleanse all negative effects. Heal 28.

#### Judgment

- **ID:** `judgment`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Deal 32 damage. Holy attuned: 80 instead. Holy attuned: +70 damage if you completed an Oath this Cycle.
- **Upgraded cast:** 2T
- **Upgraded effect:** Deal 45 damage. Holy attuned: 112 instead. Holy attuned: +70 damage if you completed an Oath this Cycle.

#### Bulwark

- **ID:** `bulwark`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 3T
- **Base effect:** Gain 72 Ward. Holy attuned: 180 instead.
- **Upgraded cast:** 3T
- **Upgraded effect:** Gain 101 Ward. Holy attuned: 252 instead.

#### Radiant Dawn

- **ID:** `radiant-dawn`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 3T
- **Base effect:** Deal 40 damage. Holy attuned: 100 instead. Heal 40. Holy attuned: 100 instead. Gain 32 Ward. Holy attuned: 80 instead.
- **Upgraded cast:** 3T
- **Upgraded effect:** Deal 56 damage. Holy attuned: 140 instead. Heal 40. Holy attuned: 100 instead. Gain 32 Ward. Holy attuned: 80 instead.

### Affliction — 10 spells

Source: [affliction/spell.json](../src/config/affliction/spell.json)

#### Hex

- **ID:** `hex`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 20 damage. Apply 1 Slow.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 28 damage. Apply 2 Slow.

#### Torment

- **ID:** `torment`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 45 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 63 damage.

#### Poison Needle

- **ID:** `poison-needle`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 20 damage. Nature attuned: Apply 2 Poison.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 28 damage. Nature attuned: Apply 2 Poison.

#### Frailty

- **ID:** `frailty`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Affliction attuned: Apply 4 Frailty.
- **Upgraded cast:** 1T
- **Upgraded effect:** Affliction attuned: Apply 6 Frailty.

#### Silence

- **ID:** `silence`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 2T
- **Base effect:** Interrupt the enemy’s current spell. Deal 35 damage.
- **Upgraded cast:** 2T
- **Upgraded effect:** Interrupt the enemy’s current spell. Deal 49 damage.

#### Siphon

- **ID:** `siphon`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 2T
- **Base effect:** Deal 55 damage. Heal 45.
- **Upgraded cast:** 2T
- **Upgraded effect:** Deal 77 damage. Heal 45.

#### Curse of Repetition

- **ID:** `curse-of-repetition`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Affliction attuned: Apply 5 Curse.
- **Upgraded cast:** 2T
- **Upgraded effect:** Affliction attuned: Apply 7 Curse.

#### Unravel

- **ID:** `unravel`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Deal 24 damage. Affliction attuned: 60 instead. Nature attuned: Apply 3 Poison.
- **Upgraded cast:** 2T
- **Upgraded effect:** Deal 34 damage. Affliction attuned: 84 instead. Nature attuned: Apply 3 Poison.

#### Doom

- **ID:** `doom`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 3T
- **Base effect:** Deal 48 damage. Affliction attuned: 120 instead. Nature attuned: +70 damage if the enemy has Poison.
- **Upgraded cast:** 3T
- **Upgraded effect:** Deal 67 damage. Affliction attuned: 168 instead. Nature attuned: +70 damage if the enemy has Poison.

#### Ruin

- **ID:** `ruin`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 3T
- **Base effect:** Deal 60 damage. Affliction attuned: 150 instead. Affliction attuned: Apply 4 Frailty.
- **Upgraded cast:** 3T
- **Upgraded effect:** Deal 84 damage. Affliction attuned: 210 instead. Affliction attuned: Apply 4 Frailty.

## Permanent augments — 32

Source: [augments.json](../src/config/augments.json). Domain labels indicate theme; the printed effect states any actual attunement requirement.

### Domain augments

#### Wild Garden

- **ID:** `wild-garden`
- **Domain theme:** Nature
- **Effect:** Nature attuned: Poison you apply lasts 2 extra ticks.

#### Verdant Cycle

- **ID:** `verdant-cycle`
- **Domain theme:** Nature
- **Effect:** Nature attuned: At each Cycle start, gain 3 Regeneration.

#### Rising Tide

- **ID:** `rising-tide`
- **Domain theme:** Water
- **Effect:** Water attuned: Every third Water spell grants 2 Tide.

#### Reservoir

- **ID:** `reservoir`
- **Domain theme:** Water
- **Effect:** Water attuned: Start combat with 3 Tide.

#### Inferno

- **ID:** `inferno`
- **Domain theme:** Fire
- **Effect:** Fire attuned: Spending 5 Heat makes your next Fire spell 1T faster.

#### Sacred Rhythm

- **ID:** `sacred-rhythm`
- **Domain theme:** Holy
- **Effect:** Holy attuned: Completing an Oath Empowers your next Holy spell.

#### Venomous Hex

- **ID:** `venomous-hex`
- **Domain theme:** Affliction
- **Effect:** Nature attuned: Applying Slow also applies 2 Poison.

### Hybrid augments

#### Steam

- **ID:** `steam`
- **Domain theme:** Fire
- **Effect:** Fire attuned: After Water, a Fire spell gains 2 Heat before resolving.

#### Wildfire

- **ID:** `wildfire`
- **Domain theme:** Nature
- **Effect:** Nature + Fire attuned: Applying Poison while you have Heat also deals 20 damage.

#### Purifying Rain

- **ID:** `purifying-rain`
- **Domain theme:** Water
- **Effect:** After Holy, a Water spell grants 45 Ward.

#### Blighted Tide

- **ID:** `blighted-tide`
- **Domain theme:** Water
- **Effect:** Nature + Water attuned: Spending Tide extends existing enemy Poison by 2 ticks.

### Sequence augments

#### First Strike

- **ID:** `first-strike`
- **Domain theme:** Any
- **Effect:** Your first spell each Cycle deals 50% more direct damage.

#### Finisher

- **ID:** `finisher`
- **Domain theme:** Any
- **Effect:** Your final spell each Cycle is Empowered.

#### Echo Chamber

- **ID:** `echo-chamber`
- **Domain theme:** Any
- **Effect:** Every fourth completed spell resolves twice.

#### Alternation

- **ID:** `alternation`
- **Domain theme:** Any
- **Effect:** Changing domains gives the next spell 20% more damage, healing and Ward.

#### Crescendo

- **ID:** `crescendo`
- **Domain theme:** Any
- **Effect:** Each preceding spell this Cycle adds 5% direct damage.

#### Opening Ward

- **ID:** `opening-ward`
- **Domain theme:** Any
- **Effect:** Your first spell each Cycle grants 50 Ward.

### Casting augments

#### Heavy Hitter

- **ID:** `heavy-hitter`
- **Domain theme:** Any
- **Effect:** Printed 3T spells deal 40% more direct damage.

#### Rapid Casting

- **ID:** `rapid-casting`
- **Domain theme:** Any
- **Effect:** Every third printed 1T spell repeats at half power.

#### Patience

- **ID:** `patience`
- **Domain theme:** Any
- **Effect:** Completing a printed 3T spell grants 80 Ward.

#### Momentum

- **ID:** `momentum`
- **Domain theme:** Any
- **Effect:** Three consecutive printed 1T spells make your next 2T+ spell 1T faster.

### Risk augments

#### Glass Cannon

- **ID:** `glass-cannon`
- **Domain theme:** Any
- **Effect:** Deal 30% more damage. Maximum Health is reduced by 125.

#### Blood Magic

- **ID:** `blood-magic`
- **Domain theme:** Any
- **Effect:** Self-damage adds 50 direct damage to your next completed spell.

#### Last Stand

- **ID:** `last-stand`
- **Domain theme:** Any
- **Effect:** Below 30% Health, spells start 1T faster (minimum 1T).

#### Reckless Loop

- **ID:** `reckless-loop`
- **Domain theme:** Any
- **Effect:** Skip the reshuffle tick. Lose 25 Health at each new Cycle.

#### Second Wind

- **ID:** `second-wind`
- **Domain theme:** Any
- **Effect:** Once per combat, reaching 30% Health restores 120 Health.

### Economy augments

#### Specialist

- **ID:** `specialist`
- **Domain theme:** Any
- **Effect:** Your most common domain has triple shop weight.

#### Wanderer

- **ID:** `wanderer`
- **Domain theme:** Any
- **Effect:** Domains absent from your deck have triple shop weight.

#### Recycler

- **ID:** `recycler`
- **Domain theme:** Any
- **Effect:** Trashing a spell refunds 1 gold.

#### Scholar

- **ID:** `scholar`
- **Domain theme:** Any
- **Effect:** Your first purchased duplicate each shop grants 2 XP instead of 1.

#### Scavenger

- **ID:** `scavenger`
- **Domain theme:** Any
- **Effect:** Your first reroll each shop is free.

#### Deep Pockets

- **ID:** `deep-pockets`
- **Domain theme:** Any
- **Effect:** Receive 4 extra gold whenever you enter a new shop.

## Keyword glossary

Source: [keywords.json](../src/config/keywords.json).

- **Poison:** Nature attunement required to gain or apply this keyword. Duration. Take 15 damage at the start of each tick, then lose 1 duration. Adding Poison extends its duration.
- **Regeneration:** Nature attunement required to gain or apply this keyword. Duration. Heal 15 at the start of each tick, then lose 1 duration. Adding Regeneration extends its duration.
- **Ward:** Shield. Absorbs incoming damage before Health. Does not decay.
- **Interrupt:** Cancel an enemy spell that is still casting. That position is skipped; their sequence continues next tick.
- **Empowered:** An enhanced spell. Fire spends 5 Heat on an eligible payoff for its printed Empowered effect. Spells without a printed Empowered damage value gain 50% direct damage, healing and Ward.
- **Tide:** Water attunement required to gain or apply this keyword. Charge. Water generates Tide and spends it on printed effects. Tide persists until spent.
- **Heat:** Fire attunement required to gain or apply this keyword. Charge. Each Heat adds 4% Fire damage. Eligible Empowered Fire payoffs spend 5 Heat. Heat does not decay.
- **Oath:** Holy attunement required to gain or apply this keyword. A condition on your next 3 spells. Complete all 3 to earn the reward. An interrupt or failed condition breaks it. A new Oath replaces an older one.
- **Slow:** Charge. The next spell you begin takes one extra tick per Slow, capped at +2T. Consumed on spell start.
- **Cleanse:** Remove Poison, Slow, Frailty and Curse from yourself.
- **Repeat:** Resolve a spell’s effects again without advancing the sequence. A repeat does not count as another spell for Oaths or augment counters.
- **Consume:** Remove the named duration or charges and use the amount removed for the payoff.
- **Channel:** Gain power for adjacent copies of the same spell in your ordered hand.
- **Unique:** Only one copy may be held. Matching shop copies can still upgrade it.
- **Cycle:** One pass through your sequence, followed by one reshuffle tick.
- **Frailty:** Affliction attunement required to gain or apply this keyword. Duration. Take 20% more incoming enemy damage. Loses 1 duration at the end of each following tick.
- **Curse:** Affliction attunement required to gain or apply this keyword. Duration. Completing the same domain twice in succession costs 25 Health. Loses 1 duration at the end of each following tick.
- **Attunement:** Your two most numerous domains are attuned. Ties favor the oldest card still held; cast order does not matter. Only attuned domains activate their colored signature keywords and attuned spell bonuses.
