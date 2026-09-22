# Wizard 1v1 — Spell and Augment Reference

Updated 22 September 2026. **109 spells · 5 domains · 32 augments.** All five domains use their latest spell overhauls.

Edit this document to propose changes, then share it back. Markdown edits do not automatically change the game. Stable IDs identify every entry. See [overhaul decisions](Spell_Overhaul_Notes.md) for the defaults chosen for incomplete entries.

See [Holy and Fragile notes](Holy_Overhaul_Notes.md) and [Affliction and Imp notes](Affliction_Overhaul_Notes.md) for the chosen defaults and detailed timing.

## Core rules

- Start at level 1 with 500 Health. Every two completed rounds, gain a level, +100 max Health and an augment. Wins grant trophies equal to your level; reach at least 20 to win.
- Rounds 1–2: level 1 / 500 Health / 1 trophy per win. Rounds 3–4: level 2 / 600 Health / 2 trophies. Health is before augment modifiers and resets to full each duel.
- Gold cost equals stars. There is no mana. Cards upgrade at 3 XP.
- Cast left to right; pause one tick to reshuffle and repeat the same order. One tick is 2 seconds at 1× speed. Reckless Loop is the explicit exception to the pause.
- At most two domains are attuned, by held-card count then oldest surviving card. Reordering never changes priority. Only explicitly marked effects require attunement; bracketed numerical upgrades retain their base value off-domain.
- Ward does not stack. Channel groups have at most three adjacent matching cards. Instant resolves before periodic effects and ordinary spells. Interrupt can cancel a 1T spell or a Channel.
- “All enemies/all allies” currently means the single enemy/self in a 1v1 duel.

## Spells by domain

### Nature — 25 spells

Source: [nature/spell.json](../src/config/nature/spell.json)

#### Thorn Lash

- **ID:** `thorn-lash`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 35 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 45 damage.

#### Healing Seed

- **ID:** `healing-seed`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Heal 20.
- **Upgraded cast:** 1T
- **Upgraded effect:** Heal 35.

#### Barkskin

- **ID:** `barkskin`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Gain 40 Ward.
- **Upgraded cast:** 1T
- **Upgraded effect:** Gain 50 Ward.

#### Moonblight

- **ID:** `moonblight`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Apply Poison for 5 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Apply Poison for 8 ticks.

#### Regrowth

- **ID:** `regrowth`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 2T
- **Base effect:** Gain Regeneration for 5 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Gain Regeneration for 5 ticks.

#### Wrath

- **ID:** `wrath`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 20 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 70 damage.

#### Photosynthesis

- **ID:** `photosynthesis`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Gain Regeneration for 3 ticks. Channel: +1 Regeneration per adjacent copy (max 3 copies).
- **Upgraded cast:** 1T
- **Upgraded effect:** Gain Regeneration for 3 ticks. Channel: +1 Regeneration per adjacent copy (max 3 copies). Nature attuned: Heal 20.

#### Sporeburst

- **ID:** `sporeburst`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 2T
- **Base effect:** Deal 50 damage. Guaranteed critical hit if the enemy has a debuff.
- **Upgraded cast:** 2T
- **Upgraded effect:** Deal 80 damage. Guaranteed critical hit if the enemy has a debuff.

#### Budding Life

- **ID:** `budding-life`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Gain Regeneration for 5 ticks. Apply Regeneration for 5 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Gain Regeneration for 8 ticks. Apply Regeneration for 5 ticks.

#### Solar Beam

- **ID:** `solar-beam`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 3T
- **Base effect:** Deal 100 damage.
- **Upgraded cast:** 3T
- **Upgraded effect:** Deal 200 damage.

#### Rejuvenation

- **ID:** `rejuvenation`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 2T
- **Base effect:** Heal 80.
- **Upgraded cast:** 2T
- **Upgraded effect:** Heal 80. Nature attuned: Cleanse 1 debuff.

#### Toxic Growth

- **ID:** `toxic-growth`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Deal 30 damage. Apply Poison for 5 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 50 damage. Apply Poison for 5 ticks.

#### Flourish

- **ID:** `flourish`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Double your Regeneration duration.
- **Upgraded cast:** 1T
- **Upgraded effect:** Double your Regeneration duration. Nature attuned: Your Regeneration heals double this Cycle.

#### Starsurge

- **ID:** `starsurge`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Deal 100 damage. Nature attuned: +20% damage per unique enemy debuff.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 100 damage. Nature attuned: +20% damage per unique enemy debuff.

#### World Root

- **ID:** `world-root`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Nature attuned: Apply Trap for 5 ticks.
- **Upgraded cast:** 2T
- **Upgraded effect:** Nature attuned: Apply Trap for 10 ticks.

#### Starfall

- **ID:** `starfall`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Deal 80 damage to all enemies.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 120 damage to all enemies.

#### Germination

- **ID:** `germination`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Heal 70.
- **Upgraded cast:** Instant with Nature attunement; otherwise 1T
- **Upgraded effect:** Nature attuned: Instant; otherwise 1T. Heal 70.

#### Bramble Wall

- **ID:** `bramble-wall`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Nature attuned: Gain 100 Ward.
- **Upgraded cast:** 1T
- **Upgraded effect:** Nature attuned: Gain 150 Ward.

#### Venom Bloom

- **ID:** `venom-bloom`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 1T
- **Base effect:** Nature attuned: Your Poison deals 50% more damage for the rest of combat.
- **Upgraded cast:** 1T
- **Upgraded effect:** Nature attuned: Your Poison deals 100% more damage for the rest of combat.

#### Celestial Alignment

- **ID:** `celestial-alignment`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 2T
- **Base effect:** Nature attuned: Your next spell deals double damage.
- **Upgraded cast:** 1T with Nature attunement; otherwise 2T
- **Upgraded effect:** Nature attuned: 1T; otherwise 2T. Nature attuned: Your next spell deals double damage.

#### Wild Growth

- **ID:** `wild-growth`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 3T
- **Base effect:** Heal 80 to all allies.
- **Upgraded cast:** 2T with Nature attunement; otherwise 3T
- **Upgraded effect:** Nature attuned: 2T; otherwise 3T. Heal 80 to all allies.

#### Symbiosis

- **ID:** `symbiosis`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 1T
- **Base effect:** Gain Regeneration for 5 ticks. Apply Poison for 5 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Gain Regeneration for 10 ticks. Apply Poison for 10 ticks.

#### Transformation: Bear

- **ID:** `transformation-bear`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 2T
- **Base effect:** Nature attuned: Gain Resilience for 8 ticks.
- **Upgraded cast:** 2T
- **Upgraded effect:** Nature attuned: Gain Resilience for the rest of combat.

#### Cycle of Life

- **ID:** `cycle-of-life`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 2T
- **Base effect:** Nature attuned: Cultivate all Regeneration: remove it and heal its remaining healing immediately.
- **Upgraded cast:** 2T
- **Upgraded effect:** Nature attuned: Cultivate all Regeneration: remove it and heal its remaining healing immediately. Nature attuned: Heal 100.

#### Astral Power

- **ID:** `astral-power`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 1T
- **Base effect:** Nature attuned: Deal 80 damage. +10% damage per Poison on the enemy.
- **Upgraded cast:** 1T
- **Upgraded effect:** Nature attuned: Deal 80 damage. +20% damage per Poison on the enemy.

### Water — 19 spells

Source: [water/spell.json](../src/config/water/spell.json)

#### Jet

- **ID:** `jet`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 45 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 55 damage.

#### Brine

- **ID:** `brine`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 3T
- **Base effect:** Deal 80 damage.
- **Upgraded cast:** 3T
- **Upgraded effect:** Deal 100 damage.

#### Current

- **ID:** `current`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Gain 1 Tidecaller.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 15 damage. Gain 1 Tidecaller.

#### Healing Surge

- **ID:** `healing-surge`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 2T
- **Base effect:** Heal 40.
- **Upgraded cast:** 2T
- **Upgraded effect:** Heal 40. Gain Regeneration for 4 ticks.

#### Frostbolt

- **ID:** `frostbolt`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Deal 10 damage. Apply Slow for 3 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 10 damage. Apply Slow for 3 ticks. Water attuned: 5 instead.

#### Foamguard

- **ID:** `foamguard`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 2T
- **Base effect:** Gain Guard for 1 ticks.
- **Upgraded cast:** 2T
- **Upgraded effect:** Gain Guard for 2 ticks.

#### Deep Water

- **ID:** `deep-water`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Deal 60 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 70 damage.

#### Deluge

- **ID:** `deluge`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Water attuned: Gain 2 Tidecaller.
- **Upgraded cast:** 1T
- **Upgraded effect:** Water attuned: Gain 3 Tidecaller.

#### Downpour

- **ID:** `downpour`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Deal 60 damage.
- **Upgraded cast:** 2T
- **Upgraded effect:** Deal 60 damage. Water attuned: +20% damage per Tidecaller you have.

#### Storm

- **ID:** `storm`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Deal 70 damage. Water attuned: Gain 1 Tidecaller.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 70 damage. Water attuned: Gain 3 Tidecaller.

#### Frost Nova

- **ID:** `frost-nova`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Apply Slow for 3 ticks. Apply Weaken for 4 ticks.
- **Upgraded cast:** 2T
- **Upgraded effect:** Apply Slow for 3 ticks. Apply Weaken for 4 ticks. Water attuned: 6 instead.

#### Riptide

- **ID:** `riptide`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Heal 80.
- **Upgraded cast:** 1T
- **Upgraded effect:** Heal 80. Water attuned: Gain 2 Tidecaller.

#### Whirlpool

- **ID:** `whirlpool`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Deal 50 damage. Water attuned: Channel: +10 damage per adjacent copy (max 3 copies).
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 50 damage. Water attuned: Channel: +20 damage per adjacent copy (max 3 copies).

#### Water Barrier

- **ID:** `water-barrier`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Gain 80 Ward.
- **Upgraded cast:** 1T
- **Upgraded effect:** Gain 80 Ward. Water attuned: Gain 2 Tidecaller.

#### Ice Block

- **ID:** `ice-block`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 2T
- **Base effect:** Water attuned: Gain Guard for 4 ticks.
- **Upgraded cast:** 1T with Water attunement; otherwise 2T
- **Upgraded effect:** Water attuned: 1T; otherwise 2T. Water attuned: Gain Guard for 4 ticks.

#### Tsunami

- **ID:** `tsunami`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 2T
- **Base effect:** Water attuned: Deal 80 damage. Water attuned: Apply Weaken for 3 ticks.
- **Upgraded cast:** 2T
- **Upgraded effect:** Water attuned: Deal 100 damage. Water attuned: Apply Weaken for 4 ticks.

#### Crash

- **ID:** `crash`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 3T
- **Base effect:** Water attuned: Deal 100 damage.
- **Upgraded cast:** 3T
- **Upgraded effect:** Water attuned: Deal 100 damage. Deals double damage when Echoed.

#### Ocean Heart

- **ID:** `ocean-heart`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 2T
- **Base effect:** Water attuned: Gain 5 Tidecaller.
- **Upgraded cast:** 1T with Water attunement; otherwise 2T
- **Upgraded effect:** Water attuned: 1T; otherwise 2T. Water attuned: Gain 5 Tidecaller.

#### Tidal Power

- **ID:** `tidal-power`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 1T
- **Base effect:** Water attuned: Your next Tidecaller Echo has 100% effectiveness.
- **Upgraded cast:** 1T
- **Upgraded effect:** Water attuned: Your next Tidecaller Echo has 150% effectiveness.

### Fire — 20 spells

Source: [fire/spell.json](../src/config/fire/spell.json)

#### Spark

- **ID:** `spark`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 45 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 65 damage.

#### Flare

- **ID:** `flare`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 55 damage. Take 10 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 80 damage. Take 20 damage.

#### Char

- **ID:** `char`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Deal 30 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 30 damage. Fire attuned: double damage below 30% Health.

#### Ember

- **ID:** `ember`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Gain 1 Heat.
- **Upgraded cast:** 1T
- **Upgraded effect:** Gain 1 Heat. Fire attuned: 2 instead.

#### Scorch

- **ID:** `scorch`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 2T
- **Base effect:** Take 30 damage. Gain 2 Combust.
- **Upgraded cast:** 2T
- **Upgraded effect:** Take 30 damage. Gain 2 Combust. Fire attuned: 4 instead.

#### Lava Floor

- **ID:** `lava-floor`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Apply Trap for 3 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Apply Trap for 5 ticks.

#### Heatwave

- **ID:** `heatwave`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Apply Weaken for 3 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Apply Weaken for 3 ticks. Fire attuned: 5 instead.

#### Firebolt

- **ID:** `firebolt`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Deal 80 damage.
- **Upgraded cast:** Instant with Fire attunement; otherwise 1T
- **Upgraded effect:** Fire attuned: Instant; otherwise 1T. Deal 80 damage.

#### Firefury

- **ID:** `firefury`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Gain Fury for 2 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Gain Fury for 2 ticks. Fire attuned: 5 instead.

#### Overheat

- **ID:** `overheat`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Fire attuned: Lose half your current Health. Fire attuned: Gain 5 Combust.
- **Upgraded cast:** 1T
- **Upgraded effect:** Fire attuned: Lose half your current Health. Fire attuned: Gain 5 Combust. Fire attuned: Gain 2 Heat.

#### Flameshield

- **ID:** `flameshield`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Gain 40 Ward.
- **Upgraded cast:** 2T
- **Upgraded effect:** Gain 80 Ward.

#### Emberstorm

- **ID:** `emberstorm`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Deal 120 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 120 damage to all enemies.

#### Immolate

- **ID:** `immolate`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Fire attuned: Deal 80 damage. Fire attuned: Gain 2 Combust.
- **Upgraded cast:** 1T with Fire attunement; otherwise 2T
- **Upgraded effect:** Fire attuned: 1T; otherwise 2T. Fire attuned: Deal 80 damage. Fire attuned: Gain 2 Combust.

#### Flamekick

- **ID:** `flamekick`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Deal 50 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 50 damage. Fire attuned: Interrupt the enemy spell, including 1T spells and Channel.

#### Pyroblast

- **ID:** `pyroblast`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 3T
- **Base effect:** Deal 150 damage.
- **Upgraded cast:** 3T
- **Upgraded effect:** Deal 300 damage.

#### Phoenix Renewal

- **ID:** `phoenix-renewal`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 2T
- **Base effect:** Fire attuned: Heal 25 per Heat.
- **Upgraded cast:** 2T
- **Upgraded effect:** Fire attuned: Heal 35 per Heat.

#### Conflagrate

- **ID:** `conflagrate`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 2T
- **Base effect:** Gain Fury for 5 ticks.
- **Upgraded cast:** 2T
- **Upgraded effect:** Gain Fury for 5 ticks. Fire attuned: 10 instead.

#### Blaze

- **ID:** `blaze`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 1T
- **Base effect:** Deal 120 damage. Take 30 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 120 damage. Fire attuned: 150 instead. Take 30 damage. Fire attuned: 30 instead.

#### Eruption

- **ID:** `eruption`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 3T
- **Base effect:** Fire attuned: Your critical hits deal 200% total damage for the rest of combat.
- **Upgraded cast:** 3T
- **Upgraded effect:** Fire attuned: Your critical hits deal 250% total damage for the rest of combat.

#### Phoenix Guard

- **ID:** `phoenix-guard`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 1T
- **Base effect:** Fire attuned: Gain Guard for 1 per Heat ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Fire attuned: Gain Guard for 2 per Heat ticks.

### Holy — 23 spells

Source: [holy/spell.json](../src/config/holy/spell.json)

#### Aegis

- **ID:** `aegis`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Gain 50 Ward.
- **Upgraded cast:** 1T
- **Upgraded effect:** Gain 75 Ward.

#### Prayer

- **ID:** `prayer`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Gain Regeneration for 3 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Gain Regeneration for 3 ticks. Holy attuned: Gain Resilience for 1 tick.

#### Radiant Bolt

- **ID:** `radiant-bolt`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 2T
- **Base effect:** Deal 50 damage.
- **Upgraded cast:** 2T
- **Upgraded effect:** Deal 80 damage.

#### Sacred Flame

- **ID:** `sacred-flame`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 2T
- **Base effect:** Gain 1 Heat. Deal 40 damage.
- **Upgraded cast:** 2T
- **Upgraded effect:** Gain 2 Heat. Deal 40 damage.

#### Oath: Restraint

- **ID:** `oath-restraint`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Holy attuned: Oath: Deal no damage for the next 2 ticks. Reward: Gain Guard for 4 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Holy attuned: Oath: Deal no damage for the next 2 ticks. Reward: Gain Guard for 6 ticks.

#### Smite

- **ID:** `smite`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 2T
- **Base effect:** Deal 80 damage.
- **Upgraded cast:** 2T
- **Upgraded effect:** Deal 100 damage.

#### Penance

- **ID:** `penance`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Deal 60 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 60 damage. Holy attuned: Deal 100 instead while you have Regeneration.

#### Forgiveness

- **ID:** `forgiveness`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 2T
- **Base effect:** Holy attuned: Cultivate all your Curse; remove it and heal 20 per stack.
- **Upgraded cast:** 2T
- **Upgraded effect:** Holy attuned: Cultivate all your Curse; remove it and heal 30 per stack.

#### Sanctify

- **ID:** `sanctify`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 3T
- **Base effect:** Heal 100. Gain Regeneration for 5 ticks.
- **Upgraded cast:** 3T
- **Upgraded effect:** Heal 100. Gain Regeneration for 8 ticks.

#### Reckoning

- **ID:** `reckoning`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 2T
- **Base effect:** Apply 5 Curse.
- **Upgraded cast:** 2T
- **Upgraded effect:** Apply 8 Curse.

#### Radiant Spear

- **ID:** `radiant-spear`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Deal 50 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 50 damage. Holy attuned: Apply Weaken for 3 ticks.

#### Oath: Eye for an Eye

- **ID:** `oath-eye-for-an-eye`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Holy attuned: Oath: Deal at least 100 damage across the next 2 ticks. Reward: Gain Fury for 6 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Holy attuned: Oath: Deal at least 100 damage across the next 2 ticks. Reward: Gain Fury for 8 ticks.

#### Consecration

- **ID:** `consecration`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Deal 80 damage. Holy attuned: If you completed an Oath this cycle, gain 50 Ward.
- **Upgraded cast:** 2T
- **Upgraded effect:** Deal 100 damage. Holy attuned: If you completed an Oath this cycle, gain 80 Ward.

#### Oath: Judgement

- **ID:** `oath-judgement`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Holy attuned: Oath: Take no damage for the next 2 ticks. Reward: Apply Stun for 2 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Holy attuned: Oath: Take no damage for the next 2 ticks. Reward: Apply Stun for 3 ticks.

#### Pillar of Sun

- **ID:** `pillar-of-sun`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Gain 1 Heat. Gain Regeneration for 4 ticks.
- **Upgraded cast:** 2T
- **Upgraded effect:** Gain 1 Heat and Regeneration for 4 ticks. Holy attuned: 3 Heat and 5 Regeneration ticks instead.

#### Holy Light

- **ID:** `holy-light`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** Instant
- **Base effect:** Instant: Heal 80.
- **Upgraded cast:** Instant
- **Upgraded effect:** Instant: Heal 100.

#### Sacred Group

- **ID:** `sacred-group`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 3T
- **Base effect:** Deal 60 damage. Apply Slow for 3 ticks.
- **Upgraded cast:** 3T
- **Upgraded effect:** Deal 60 damage. Apply Slow for 3 ticks. Holy attuned: 100 damage and 4 Slow ticks instead.

#### Lay on Hands

- **ID:** `lay-on-hands`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 3T
- **Base effect:** Holy attuned: Heal to full Health. Fragile: breaks after its first completed cast this duel.
- **Upgraded cast:** 2T with Holy attunement; otherwise 3T
- **Upgraded effect:** Holy attuned: Heal to full Health in 2T. Fragile. Otherwise: 3T, no effect.

#### Oath: Meditation

- **ID:** `oath-meditation`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 1T
- **Base effect:** Holy attuned: Gain Stun for 5 ticks. Oath: Complete those 5 stunned ticks. Reward: Deal 300 damage.
- **Upgraded cast:** 1T
- **Upgraded effect:** Holy attuned: Gain Stun for 5 ticks. Oath: Complete those 5 stunned ticks. Reward: Deal 400 damage.

#### Redemption

- **ID:** `redemption`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 3T
- **Base effect:** Gain Resilience for half your remaining Regeneration ticks, rounded down.
- **Upgraded cast:** 2T with Holy attunement; otherwise 3T
- **Upgraded effect:** Holy attuned: 2T; otherwise 3T. Gain Resilience for half your remaining Regeneration ticks, rounded down.

#### Divine Hands

- **ID:** `divine-hands`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 2T
- **Base effect:** Holy attuned: Heal 15 per remaining Regeneration tick.
- **Upgraded cast:** 2T
- **Upgraded effect:** Holy attuned: Heal 20 per remaining Regeneration tick.

#### Turn Unholy

- **ID:** `turn-unholy`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 2T
- **Base effect:** Holy attuned: For 5 ticks, your healing becomes damage to the enemy instead, including Regeneration.
- **Upgraded cast:** 1T with Holy attunement; otherwise 2T
- **Upgraded effect:** Holy attuned: 1T cast. For 5 ticks, your healing becomes damage to the enemy, including Regeneration. Otherwise: 2T, no effect.

#### Divine Intervention

- **ID:** `divine-intervention`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 3T
- **Base effect:** Holy attuned: Gain 300 Ward.
- **Upgraded cast:** 3T
- **Upgraded effect:** Holy attuned: Gain 400 Ward.

### Affliction — 22 spells

Source: [affliction/spell.json](../src/config/affliction/spell.json)

#### Leech

- **ID:** `leech`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 2T
- **Base effect:** Deal 35 damage. Heal 10.
- **Upgraded cast:** 2T
- **Upgraded effect:** Deal 45 damage. Heal 20.

#### Agony

- **ID:** `agony`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 1T
- **Base effect:** Apply Poison for 5 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Apply Poison for 5 ticks. Apply 1 Curse.

#### Dark Grab

- **ID:** `dark-grab`
- **Rarity / cost:** ★ (1 gold)
- **Base cast:** 3T
- **Base effect:** Deal 100 damage.
- **Upgraded cast:** 3T
- **Upgraded effect:** Deal 100 damage. Apply Slow for 1 tick.

#### Ritual

- **ID:** `ritual`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 2T
- **Base effect:** Summon an Imp with 50 Health. If alive, add 50 current and max Health.
- **Upgraded cast:** 2T
- **Upgraded effect:** Summon an Imp with 80 Health. If alive, add 80 current and max Health.

#### Eldritch Bolt

- **ID:** `eldritch-bolt`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 2T
- **Base effect:** Deal 80 damage.
- **Upgraded cast:** 2T
- **Upgraded effect:** Deal 80 damage. Double damage if the enemy has any debuff.

#### Malison

- **ID:** `malison`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 2T
- **Base effect:** Deal 50 damage. Apply 2 Curse.
- **Upgraded cast:** 2T
- **Upgraded effect:** Deal 50 damage. Apply 2 Curse; Affliction attuned: 4 instead.

#### Disrupt

- **ID:** `disrupt`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Interrupt the enemy spell, including 1T spells and Channel.
- **Upgraded cast:** 1T
- **Upgraded effect:** Interrupt the enemy spell, including 1T spells and Channel. Affliction attuned: Apply Poison for 5 ticks.

#### Dual Hex

- **ID:** `dual-hex`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 2T
- **Base effect:** Apply Poison for 2 ticks. Gain Poison for 2 ticks.
- **Upgraded cast:** 1T with Affliction attunement; otherwise 2T
- **Upgraded effect:** Affliction attuned: 1T; otherwise 2T. Apply Poison for 2 ticks. Gain Poison for 2 ticks.

#### Blood Pact

- **ID:** `blood-pact`
- **Rarity / cost:** ★★ (2 gold)
- **Base cast:** 1T
- **Base effect:** Affliction attuned: Take 50 damage. Give your living Imp Guard for 2 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Affliction attuned: Take 50 damage. Give your living Imp Guard for 4 ticks.

#### Dark Communication

- **ID:** `dark-communication`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Affliction attuned: Summon an Imp with 100 Health, or add 100 current and max Health.
- **Upgraded cast:** 2T
- **Upgraded effect:** Affliction attuned: Summon an Imp with 150 Health, or add 150 current and max Health.

#### Life Drain

- **ID:** `life-drain`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Deal 40 damage. Heal 50. Channel: +10 damage and healing per extra adjacent copy (max 3 copies).
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 40 damage. Heal 50. Channel: +20 damage and healing per extra adjacent copy (max 3 copies).

#### Corrupt Ward

- **ID:** `corrupt-ward`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Remove all enemy Ward.
- **Upgraded cast:** 1T
- **Upgraded effect:** Remove all enemy Ward.

#### Shadow Bolt

- **ID:** `shadow-bolt`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Deal 80 damage. Affliction attuned: +50% damage while your Imp is alive.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 80 damage. Affliction attuned: +100% damage while your Imp is alive.

#### Nightmare

- **ID:** `nightmare`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 2T
- **Base effect:** Affliction attuned: Cultivate all enemy Poison, consuming it to deal 10 damage per remaining tick.
- **Upgraded cast:** 2T
- **Upgraded effect:** Affliction attuned: Cultivate all enemy Poison, consuming it to deal 15 damage per remaining tick.

#### SoulBound

- **ID:** `soulbound`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Apply Stun for 5 ticks. Gain Stun for 5 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Apply Stun for 7 ticks. Gain Stun for 7 ticks.

#### Damnation

- **ID:** `damnation`
- **Rarity / cost:** ★★★ (3 gold)
- **Base cast:** 1T
- **Base effect:** Apply Poison for 8 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Apply Poison for 10 ticks.

#### Blood Offering

- **ID:** `blood-offering`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 1T
- **Base effect:** Affliction attuned: Lose half your current Health. Summon that much Imp Health.
- **Upgraded cast:** 1T
- **Upgraded effect:** Affliction attuned: Lose half your current Health. Summon 1.5× that much Imp Health.

#### Death Mark

- **ID:** `death-mark`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 1T
- **Base effect:** Deal 5 damage per remaining enemy Poison tick.
- **Upgraded cast:** 1T
- **Upgraded effect:** Deal 8 damage per remaining enemy Poison tick.

#### Rupture

- **ID:** `rupture`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 3T
- **Base effect:** Deal 120 damage. Cast in 2T if the enemy is Cursed when casting starts.
- **Upgraded cast:** 3T
- **Upgraded effect:** Deal 120 damage. Cast in 1T if the enemy is Cursed when casting starts.

#### Devils Bargain

- **ID:** `devils-bargain`
- **Rarity / cost:** ★★★★ (4 gold)
- **Base cast:** 1T
- **Base effect:** Apply Slow for 5 ticks. Gain Slow for 5 ticks.
- **Upgraded cast:** 1T
- **Upgraded effect:** Apply Slow for 8 ticks. Gain Slow for 8 ticks.

#### Empowered Imp

- **ID:** `empowered-imp`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 2T
- **Base effect:** Affliction attuned: For this combat, your living Imp deals 30 damage after each spell you complete.
- **Upgraded cast:** 2T
- **Upgraded effect:** Affliction attuned: For this combat, your living Imp deals 50 damage after each spell you complete.

#### Doomsday

- **ID:** `doomsday`
- **Rarity / cost:** ★★★★★ (5 gold)
- **Base cast:** 1T
- **Base effect:** Affliction attuned: Kill your Imp and deal damage equal to its current Health.
- **Upgraded cast:** 1T
- **Upgraded effect:** Affliction attuned: Kill your Imp and deal damage equal to its max Health.

## Permanent augments — 32

Source: [augments.json](../src/config/augments.json). Pick one of three every level-up. Identical augments cannot stack.

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
- **Effect:** Water attuned: Every third Water spell grants 2 Tidecaller.

#### Reservoir

- **ID:** `reservoir`
- **Domain theme:** Water
- **Effect:** Water attuned: Start combat with 3 Tidecaller.

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
- **Effect:** Fire attuned: After Water, a Fire spell gains 2 Heat after resolving.

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
- **Effect:** Nature + Water attuned: Spending Tidecaller extends existing enemy Poison by 2 ticks.

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

- **Poison:** Debuff duration. Take 10 damage at the start of each tick after Instant spells, then lose 1 duration. New applications add duration.
- **Regeneration:** Buff duration. Heal 10 at the start of each tick after Instant spells, then lose 1 duration. New applications add duration.
- **Ward:** Absorbs damage before Health. Does not stack: gaining Ward keeps the higher of your current Ward and the new amount. Does not decay.
- **Interrupt:** Cancels the current enemy spell, even a 1T spell finishing this tick. Also skips the remaining copies in its current Channel group (up to 3). Simultaneous interrupts cancel each other.
- **Empowered:** An enhanced spell: +50% direct damage, healing and Ward. This is separate from critical hits and does not consume Heat.
- **Heat:** Counter. Starting your next non-Instant spell with at least 5 Heat consumes 5 and makes its cast time exactly 1T, including through Slow. Extra charges remain.
- **Oath:** A timed condition beginning on the next full tick. Complete it to receive its printed reward. Damage conditions count Health damage after protection; dealing damage includes Poison and your Imp. Only one Oath can be active: a new one replaces the previous one. Reshuffling or interruption does not cancel it.
- **Slow:** Debuff duration. Each non-Instant spell started while Slow is active takes +1T. Slow is not consumed on cast; loses 1 duration each following tick. Existing casts are unchanged.
- **Cleanse:** Remove the printed number of unique debuffs from yourself, or all if unspecified. Priority: Poison, Slow, Trap, Weaken, Frailty, Repetition, Curse, Stun.
- **Repeat:** Resolve a spell’s effects again without advancing the sequence. A repeat does not count as another spell for Oaths or augment counters.
- **Consume:** Remove the named duration or charges and use the amount removed for the payoff.
- **Channel:** Adjacent matching copies form a Channel. Each additional copy adds the printed bonus, capped at 3 copies (two bonuses). Interrupt cancels the rest of that channel group.
- **Unique:** Only one copy may be held. Matching shop copies can still upgrade it.
- **Cycle:** One pass through your sequence, followed by one reshuffle tick.
- **Frailty:** Affliction attunement required to gain or apply this keyword. Duration. Take 20% more incoming enemy damage. Loses 1 duration at the end of each following tick.
- **Curse:** Debuff counter. Take 10 damage per stack when your next cycle begins, after reshuffling. Stacks persist until cleansed.
- **Attunement:** Your two most numerous domains are attuned. Ties favor the oldest card still held. Only effects explicitly marked with a domain attunement requirement need that domain; unmarked effects remain usable.
- **Instant:** Resolves before other effects that tick, including over-time effects and ordinary spells. Simultaneous Instant spells resolve together.
- **Trap:** Debuff duration. Each completed spell deals 10 damage to its caster. Echoes do not count as additional casts. Loses 1 duration each following tick.
- **Weaken:** Debuff duration. Deal 20% less damage. Loses 1 duration each following tick.
- **Guard:** Buff duration. Prevents all damage, including periodic and self-inflicted damage, while active. Explicit Health loss costs bypass it. Loses 1 duration each following tick.
- **Resilience:** Buff duration. Take 50% less damage. Loses 1 duration each following tick unless granted for the rest of combat. Explicit Health costs bypass it.
- **Tidecaller:** Counter. At 5 charges, starting the next spell consumes 5 and gives it one Echo at 50% effectiveness. Extra charges remain. Interrupted spells lose their reserved Echo.
- **Echo:** Resolve the spell’s effects again at the stated effectiveness (normally 50%). Echoes do not trigger another Echo or another cast. Whole-number amounts round to the nearest integer.
- **Combust:** Counter. Each charge adds 10 percentage points of critical-hit chance, capped at 100%. Charges persist. Critical rolls are seeded for repeatable replays.
- **Critical:** A critical spell deals 150% damage by default. Eruption can change this to 200% or 250%. Echoes share the original spell’s critical result.
- **Fury:** Buff duration. Deal 10% more damage. Loses 1 duration each following tick.
- **Cultivate:** Consume the specified over-time effect to resolve the printed payoff immediately.
- **Venom Bloom:** Your Poison damage multiplier for this combat. Recasting keeps the strongest multiplier, without stacking.
- **Flourish:** Your Regeneration healing multiplier until the next Cycle begins.
- **Astral Alignment:** Your next completed spell’s direct damage multiplier. Consumed even if that spell deals no damage.
- **Tidal Power:** Effectiveness of your next Tidecaller Echo. Consumed when five Tidecaller charges are reserved at cast start.
- **Eruption:** Your critical-hit damage multiplier for this combat. Recasting keeps the strongest multiplier.
- **Apply:** Put the named effect on the enemy. Applying Regeneration heals the enemy.
- **Gain:** Put the named effect on yourself.
- **Stun:** Pauses casting and rotation, including reshuffling, for its duration. Over-time effects and other durations still tick.
- **Summon:** Summon an Imp with the printed Health. If alive, add that amount to its current and maximum Health. It absorbs enemy spell damage before you, with overflow reaching you. Empowered Imp unlocks an attack after each spell its owner completes.
- **Doom:** Debuff counter reserved for a future spell. Its trigger and damage are not defined yet; no current spell applies it.
- **Fragile:** After its first completed cast, this copy breaks and leaves the rotation for the rest of the duel. It returns next duel. Interrupting it does not break it. Echoes on that first cast still resolve.
- **Unholy:** Your healing becomes damage to the enemy for the duration, including Regeneration. Printed healing converts even at full Health; heal-to-full converts only missing Health. Enemy healing stays unchanged.
