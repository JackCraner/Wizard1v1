# Combat rules and remaining decisions

## Active rules

- Only ids in `src/config/spells.json` exist in the game. Starting hand: empty. Buy at least one spell before combat. Shop offers are shuffled deterministically across eligible domains. Bots and shop offers use catalogue cards with implemented, sufficiently defined effects. Undefined cards remain browsable, with a `combat.blockedReason`, and cannot enter a loadout.
- `src/config/rules.json`: 500 base health, 100 base mana, 50 maximum ticks, 1.5 critical multiplier. Equipment modifies maximum stats. Gold cost is derived from stars.
- `src/config/statuses.json`: per-tick effect values. Every existing buff and debuff loses one remaining stack each world tick, including while its owner is casting, except Tide after Maelstrom.
- Apply 5 Moonfire on tick 1: it remains at 5 in that snapshot; tick 2 deals 10 damage and leaves 4; ticks 3–6 finish the remaining ticks. It deals five ticks of damage total. Moonfire damage per tick does not multiply by remaining duration; Burn does.
- Casting 1T completes at the end of the first casting tick. Casting 2T completes on the second. Spells repeat in loadout order.
- Mana is charged once when casting starts. An unaffordable spell is skipped and consumes one tick, preserving the prototype's skip behavior. Healing and mana restoration cap at maximum values.
- Tick order: Instant spells → DoT damage → death check → DoT countdown → HoT healing → HoT countdown → other buffs/debuffs and their countdown → normal spells. Each phase resolves both fighters together. Instant-applied effects can participate immediately; normal-applied effects start next tick. A lethal early phase ends combat before later healing or casts.
- A knockout ends combat. At tick 50, the player with less remaining health loses; equal health, including simultaneous knockouts, is a draw. This compares actual health, not percentage.
- Deterministic seeded randomness keeps the replay portable to a future backend. Base random critical chance is provisionally 0%; explicitly guaranteed critical conditions work at 150% damage. Moonfire/Sunfire critical checks refer to effects on the opponent.

## Clarified deck and effect rules

- A deck can contain at most two domains, enforced at purchase and combat boundaries. Bots follow the same restriction. Once two domains are chosen, rerolls and future shops offer those domains only; existing third-domain offers cannot be bought.
- Stacks normally add duration, not per-tick power (Lifebloom also scales healing with remaining stacks): 5 Moonfire plus 5 is 10 before the normal tick countdown. Reapplication never resets or caps duration.
- Guard grants immunity to all direct, self and periodic damage while active. Hits do not consume stacks. Guard takes effect when applied, including against simultaneous damage.
- Phoenix revives before knockout is checked. Current interpretation: half maximum health and mana (rounded down, with at least 1 health), without consuming the remaining duration; further lethal hits can trigger another rebirth during that window.
- Channel X counts every identical card in its consecutive group, including copies before and after the current position. Each card casts separately at its listed time and cost. Three Undertows each deal 24 damage and grant 3 Tide; two Spore Drains each deal 20 damage and grant 2 Growth. Reordering recalculates the groups. Current interpretation: groups do not wrap from the end to the start of the hand.

## Provisional conventions to confirm

- Instant spells resolve at tick start but consume that fighter’s turn: the next card cannot queue until the next tick. This also applies to spells made Instant by Conflagrate. Instant can use a final duration stack before it expires; normal casts resolve after countdowns.
- Slowness adds one tick to the next started spell, then is consumed. Next-spell effects are also consumed on start; if unused, their duration expires normally. Confirm consumption versus purely duration-based behavior.
- Tide gives one flat 20% Tidecaller chance while active; Whirlpool scales by remaining Tide. Rain adds 20% Water damage while active, not per remaining duration stack.
- Fractional damage is rounded to the nearest whole point. Stealing mana takes only what the opponent has; the recipient is capped at maximum mana.

## Still undefined

1. **Missing cost:** Tidal mana cost.
2. **Remaining X value:** Starfall application amount.
3. **Provisional defaults:** base random crit chance remains 0%; simultaneous completed casts cannot be interrupted. Rainborn, Maelstrom and Monsoon modify the rest of the current combat, without stacking their power on recast.

The individual card's `combat.blockedReason` is the authoritative current availability reason. Do not enable a blocked card by only deleting the reason: supply and implement its effect definition first.

## Hotstreak and Combust

Each remaining Hotstreak stack adds 10 percentage points of crit chance, capped at 100%. Applying stacks across the five-stack threshold grants 3 Combust without consuming Hotstreak. Staying above the threshold does not repeatedly grant Combust; falling below and crossing again does. All stacks continue their normal countdown. Combust caps remaining cast time at 1T (including Slowness) and leaves Instant at zero. A spell completed while Combust was active before its effects deals 5 damage to its caster; skips do not. Tidecaller repeats are one cast and pay once. Guard can block this damage, and Phoenix can revive from it. The spell that first grants Combust does not pay the damage retroactively. Overheat loses half current health rounded down, then grants 15 Overheat and 5 Hotstreak; this loss is a health cost, unaffected by Guard.

## Card upgrades and first balance pass

- Each owned copy has its own 0–3 XP. Consume a matching non-upgraded hand copy, or buy a shop copy into a chosen target, to add exactly 1 XP. The target upgrades at 3 XP. Upgraded cards cannot be consumed or gain further XP. A partially trained donor still gives exactly 1 XP; its other progress is lost. Merging is free; shop copies cost their normal star value.
- XP moves with cards when reordered or removed, persists between rounds, and is included in combat/leaderboard snapshots. Channel groups still count matching base spell IDs, including mixed upgraded and base copies.
- Every spell has an explicit `upgrade` object in `spells.json`. It overrides mana, castTicks, rules, keywords and combat effects; rank and domain are unchanged. Existing undefined mechanics stay blocked at both tiers.
- Nature favors longer periodic durations and efficient sustain. Water favors mana recovery, control, Tide combinations and moderate healing. Fire favors direct burst and Hotstreak, with self-damage and health costs retained. Costs and effect amounts are literal JSON values, not runtime scaling.
- First-pass adjustments: Astral Power now costs 6 mana and deals 65 damage; Riptide heals 65 for 8 mana; Starsurge deals 65 for 8 mana. Undertow deals 8 × channel length for 6 mana. Photosynthesis takes 2T. Healing Surge heals 25. Root Bind and Tidal Echo have 2 stacks so their effects survive countdown before the next normal cast. Flameshield has 2 Guard. Scorch gives 2 Hotstreak, Cinder 4, Flame Fury 3 Hotstreak/6 Fury. This is an initial balance pass, not a claim of competitive balance.
- Shared status power (e.g. Moonfire damage per tick) remains in `statuses.json`; individual card application durations and both tiers live in `spells.json`. Bot upgrade preference is `deck.mergePriority` in `bots.json`.

## Clarified Nature effects

- Lifebloom heals 10 × remaining stacks in the HoT phase, before losing one stack. Five stacks heal 50, then 40, 30, 20, 10. Its stack scaling is explicit in `statuses.json`; Growth remains flat healing per tick.
- Germination restores mana equal to the opponent’s total remaining DoT stacks at resolution. Normal casts see the post-countdown total; Instant casts see the pre-countdown total.
- Flourish doubles the caster’s remaining stacks of every HoT, including Growth and Lifebloom, without immediately triggering a heal. Its upgraded version keeps the same effect at reduced mana cost.
- Unique means one owned copy of each tagged spell per deck, including across upgrade tiers. Direct shop-to-XP merges remain legal; they do not create an additional deck entry. Combat input, purchases and bots enforce the restriction.

## Renew, Alignment, Trap, Eclipse and Overgrowth

- Apply targets the opponent; gain/give/grant target the caster unless an explicit exception states otherwise (Immolate burns its caster). Renew heals the caster for 50 and adds 5 Growth to both fighters.
- Celestial Alignment is Unique, free and 1T. It grants a 2-tick window to start the next spell. The next started spell consumes the bonus and retains double direct damage throughout its cast; upgraded Alignment gives triple. Skips do not consume it. Later DoT ticks are not amplified.
- Trap deals a flat 10 on each new cast start, not per remaining stack, including Instant casts. Continued casting, skips, reshuffles and Tidecaller repeats do not retrigger it. Mana is paid before the trigger. Both sides’ triggers resolve together; lethal Trap stops subsequent resolution. Guard blocks it and Phoenix can revive.
- Eclipse consumes all remaining DoTs on the opponent and deals their remaining ticks of damage immediately, with current periodic damage buffs. It does not consume HoTs, Trap or caster DoTs. Normal Eclipse uses stacks after this tick’s countdown; Instant Eclipse consumes before periodic damage. Guard blocks the hit but does not prevent consumption.
- Wild Growth grants 5 Growth and 25 Overgrowth. While Overgrowth is active, its owner’s Growth heals 30 instead of 10. Lifebloom and the opponent’s healing are unchanged. Values live in spells.json and statuses.json.

## Clarified Water and Fire effects

- Veil reduces incoming damage by 50% and grants 5 mana for each opposing spell hit (including repeat hits), not periodic damage. Health costs remain costs. Spell-hit mana is granted once per spell resolution, not once per individual effect.
- Tsunami pays half current mana, rounded down, when casting starts. Its damage uses that paid amount.
- Rainborn costs 15 mana and makes active Rain heal 20 in the HoT phase each tick. Monsoon makes active Rain restore 5 mana per tick. Their combat-long modifiers do not add or extend Rain; the final Rain stack still triggers before expiring.
- Maelstrom prevents Tide countdown for the rest of combat. A Tidecaller double cast still consumes up to 5 stacks after its effects; Whirlpool damage uses the pre-consumption Tide count.
- Cloud Heart costs 10 mana and grants 25 ticks of 40% increased healing received, including HoTs. The upgraded version grants 60% instead; the two bonuses do not multiply together.
- Burn deals 10 × its remaining stack count as damage each tick, then loses one stack. Eruption permits periodic crits using the applying caster's crit chance sampled at tick start, before Instant effects. Periodic status ownership tracks the most recent applier when stacks are combined; self-Burn from Immolate belongs to its caster.
- Interrupt cancels an ongoing cast, advances its card, and does not refund mana. The interrupted fighter cannot start another spell until the next tick. Already completed simultaneous casts remain resolved.
- Flashfire consumes remaining Burn on both fighters and grants matching Hotstreak and Fury. Its normal cast occurs after periodic damage and countdowns.
