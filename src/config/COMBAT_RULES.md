# Combat rules and remaining decisions

## Active rules

- Only ids in `src/config/<domain>/spell.json` exist in the game. Starting hand: empty. Buy at least one spell before combat. Shop offers are shuffled deterministically across eligible domains. Bots and shop offers use catalogue cards with implemented, sufficiently defined effects. Undefined cards remain browsable, with a `combat.blockedReason`, and cannot enter a loadout.
- `src/config/rules.json`: 500 base health, 100 base mana, 50 maximum ticks, 1.5 critical multiplier. Equipment modifies maximum stats. Gold cost is derived from stars.
- `src/config/statuses.json`: per-tick effect values. Every existing buff and debuff loses one remaining stack each world tick, including while its owner is casting, except Tide after Maelstrom and persistent Consecration. Condition-based Oaths are separate from timed stacks.
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
- Every spell has an explicit `upgrade` object in `<domain>/spell.json`. It overrides mana, castTicks, rules, keywords and combat effects; rank and domain are unchanged. Existing undefined mechanics stay blocked at both tiers.
- Nature favors longer periodic durations and efficient sustain. Water favors mana recovery, control, Tide combinations and moderate healing. Fire favors direct burst and Hotstreak, with self-damage and health costs retained. Costs and effect amounts are literal JSON values, not runtime scaling.
- First-pass adjustments: Astral Power now costs 6 mana and deals 65 damage; Riptide heals 65 for 8 mana; Starsurge deals 65 for 8 mana. Undertow deals 8 × channel length for 6 mana. Photosynthesis takes 2T. Healing Surge heals 25. Root Bind and Tidal Echo have 2 stacks so their effects survive countdown before the next normal cast. Flameshield has 2 Guard. Scorch gives 2 Hotstreak, Cinder 4, Flame Fury 3 Hotstreak/6 Fury. This is an initial balance pass, not a claim of competitive balance.
- Shared status power (e.g. Moonfire damage per tick) remains in `statuses.json`; individual card application durations and both tiers live in `<domain>/spell.json`. Bot upgrade preference is `deck.mergePriority` in `bots.json`.

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
- Wild Growth grants 5 Growth and 25 Overgrowth. While Overgrowth is active, its owner’s Growth heals 30 instead of 10. Lifebloom and the opponent’s healing are unchanged. Values live in <domain>/spell.json and statuses.json.

## Clarified Water and Fire effects

- Veil reduces incoming damage by 50% and grants 5 mana for each opposing spell hit (including repeat hits), not periodic damage. Health costs remain costs. Spell-hit mana is granted once per spell resolution, not once per individual effect.
- Tsunami pays half current mana, rounded down, when casting starts. Its damage uses that paid amount.
- Rainborn costs 15 mana and makes active Rain heal 20 in the HoT phase each tick. Monsoon makes active Rain restore 5 mana per tick. Their combat-long modifiers do not add or extend Rain; the final Rain stack still triggers before expiring.
- Maelstrom prevents Tide countdown for the rest of combat. A Tidecaller double cast still consumes up to 5 stacks after its effects; Whirlpool damage uses the pre-consumption Tide count.
- Cloud Heart costs 10 mana and grants 25 ticks of 40% increased healing received, including HoTs. The upgraded version grants 60% instead; the two bonuses do not multiply together.
- Burn deals 10 × its remaining stack count as damage each tick, then loses one stack. Eruption permits periodic crits using the applying caster's crit chance sampled at tick start, before Instant effects. Periodic status ownership tracks the most recent applier when stacks are combined; self-Burn from Immolate belongs to its caster.
- Interrupt cancels an ongoing cast, advances its card, and does not refund mana. The interrupted fighter cannot start another spell until the next tick. Already completed simultaneous casts remain resolved.
- Flashfire consumes remaining Burn on both fighters and grants matching Hotstreak and Fury. Its normal cast occurs after periodic damage and countdowns.

## Stackable items

The 80-item catalogue is in `src/config/equipment.json`. Items have **no equipment slots, inventory limit, or duplicate limit**. Buying a copy adds one stack of that item and consumes only that shop offer. Items persist for the run and apply to every duel. Affinity describes synergy, not a requirement: any deck may own any item.

The shop has **three item offers** alongside five spells. Price equals 1–5★ rarity. Item rarity uses the same round-based probabilities as spells. After rolling rarity, offers favor your domains: 35% neutral, 60% shared between matching domains, and 5% shared between other domains when all groups are available. With no chosen domain, domain items share that 65%. These weights and offer count are editable in `src/config/itemShop.json`.

Owned items appear as icons with **×N** badges. Tap one to inspect its per-copy effect and current total. Shop inspection also previews the bonus after buying another copy. Large collections use an expandable grid, keeping the shop and combat screens free of horizontal scrolling. Placeholder initials are supplied; add future assets to `ITEM_ART` in `src/components/ItemInventory.tsx`.

### Stacking and combat timing

- Item effects scale linearly. Polished Lens ×3 gives +6 percentage points of crit chance; Vitality Charm ×4 gives +80 maximum Health. Health has a minimum of 1, Mana a minimum of 0, and crit chance caps at 100%.
- All applicable **item damage percentages add into one bucket**, including conditional, domain, critical and first-spell bonuses. Rain, Fury and other spell/status multipliers then multiply that bucket. Generic spell damage affects direct damage and DoTs; direct-only bonuses do not affect DoTs or retaliation. Flat Moonfire/Sunfire bonuses apply before percentages. Item-triggered damage is the listed flat value per copy.
- Healing-done percentages add together, including applicable HoT/domain bonuses. Healing-received modifiers form a separate bucket that multiplies healing done, with a minimum of zero. Prayer Beads uses the healing spell/status source's Holy domain. Lifebloom Petal adds to the per-stack base before multiplying by remaining Lifebloom stacks.
- A Cycle ends after the entire reshuffle, including Penance. First-cast mana discounts commit when a cast starts, survive an unaffordable skip, and are still consumed if that cast is interrupted. First-spell damage and first-domain completion triggers count completed cards once; Tidecaller repeats do not re-trigger them. First-spell damage bonuses affect damage at cast resolution, not future DoT ticks.
- **Clockwork Spring** restores its listed amount once at reshuffle start. **Scholar's Quill**, **Brine Flask**, and **Restoration Stone** trigger when reshuffling finishes. **Chapel Bell** damages only on the extra Penance ticks appended after the normal two ticks, during the periodic damage phase.
- **Conch Shell** adds mana to positive Water spell mana gains (including Water status effects). It does not trigger from costs, rebirth, item mana or itself. Mana remains capped at maximum.
- **Small Censer** and **Sacred Reliquary** trigger after the first completed Holy card each Cycle. **Golden Chain** triggers per application of Slowness. **Templar Seal** rewards a fulfilled Oath; **Battle Rosary** heals once per Guard grant, not per Guard stack.
- **Incense Burner** heals at most once per item type per world tick when Guard blocks positive damage. Mirrors retaliate after direct enemy spell damage reaches Health, at most once per item type per tick; they ignore DoTs, self-damage and other retaliation. Multiple copies increase the trigger's amount, not its frequency.
- **Scorched Band** reduces actual self-inflicted damage, including Combust, but does not reduce Overheat's explicit half-current-Health cost. **Ancient Bark** applies only while a HoT remains active. **Stone Charm** reduces the first unguarded opposing direct hit each Cycle, before Ward absorption.

The catalogue's recommended caps are enforced: Lucky Coin 10 mana reduction; Conch Shell +10 mana per trigger; Ancient Bark 30% reduction; Small Censer +4 Consecration per trigger; Golden Chain +3 per application. Sacred Reliquary has no such cap. Buying beyond a cap is allowed; the inspection panel shows the capped total. Different items' bonuses add rather than sharing a duplicate cap.

Bots accumulate item stacks with the same effects and shop rules. Their editable spending budget and spell-gold reserve keep resources available for deck development. This overhaul replaces the old 155 slotted items; old rule-changing equipment and proposed Relics are not part of this catalogue. Start a new run when switching from the old equipment version.

## Holy domain

Holy has 27 spells across ranks 1–5. It uses the same shop odds, star prices, two-domain limit, merging and XP rules as the other domains. The 5-star spells are Unique. Missing spell artwork intentionally leaves the Holy frame's illustration area empty.

| Keyword | Behavior |
| --- | --- |
| **Consecration** | Persistent stacks applied to the enemy. Every **5 stacks** are immediately consumed for **+1 Penance tick**, with **no cap**. Unconverted stacks remain between ticks. Cleanse removes those stacks, but cannot remove Penance already queued. |
| **Penance** | Extra ticks on the next reshuffle, added after the normal base duration. Damage, healing and timed effects continue. Penance received during an active reshuffle waits for the following reshuffle. The deck shows queued and active extra ticks. |
| **Oath** | One active condition-based Oath per wizard; a new one replaces it. The buff panel shows its remaining requirement. Swearing the Oath does not count toward its own condition. Skipped or interrupted cards do not count as completed; Tidecaller repeats count once. |
| **Retribution** | For 5 ticks, retaliate for 15 damage after an opposing direct spell damages your Health, at most once per tick. DoTs, costs, retaliation, and fully absorbed hits do not trigger it. Retaliation cannot trigger retaliation. |
| **Templar's Oath** | A 6-tick stance: incoming damage ×0.8 and your direct spell damage ×0.9. Despite its name, this timed stance does not replace a condition-based Oath. |
| **Sanctuary** | For 6 ticks, incoming damage ×0.6 and healing received ×1.25. Distinct damage reduction effects multiply. |
| **Holy Ground** | For 6 ticks, heal 15 in the HoT phase and apply 1 Consecration whenever the opponent starts a new cast. Progressing a cast, skipping, and repeated spell triggers do not count as new starts. |
| **Citadel** | Grants 5 Guard and an 8-tick stance with incoming damage ×0.7. Each opposing direct hit that damages your Health applies 1 Consecration to its caster. Guard and Ward can prevent this trigger by absorbing the damage. |

| Oath | Requirement | Reward |
| --- | --- | --- |
| **Patience** | Complete the next 3 cards without starting an Instant cast. Actual cast time, including modifiers, determines whether it is Instant. | 2 Guard. |
| **Mercy** | Complete the next 3 cards without dealing direct damage to opposing Health. | Heal 80 and apply 3 Consecration. |
| **Resolve** | Until your next reshuffle starts, never skip a card because of insufficient mana. Interruptions do not break this Oath. | 3 Guard and apply 5 Consecration. |
| **Salvation** | Until your next reshuffle starts, deal no direct damage to opposing Health. | Heal 150, gain 4 Guard, and apply 10 Consecration. |

Mercy and Salvation allow DoTs, retaliation, self-damage, and hits fully absorbed by Guard/Ward. Rewards resolve after simultaneous spell damage; an Oath cannot rescue a wizard killed by that damage. Resolve and Salvation pay at reshuffle **start**, not completion. If both decks finish together, both sets of rewards and Consecration are processed before assigning either reshuffle duration.

Judgment's bonus requires an opposing cast still in progress. Intercession gives Guard when interruption fails; Inquisition applies Consecration only on successful interruption. Divine Decree applies its debuffs regardless. Divine Intervention grants 5 Guard instead of 3 only below **30% of maximum Health**. Exorcism removes all distinct DoTs/debuffs and heals 25 per removed effect, capped at 100 before healing modifiers; it counts effects, not stacks.

All these timed statuses follow the existing tick order. In particular, a 1-stack Guard from an Instant protects the early phases of that tick and expires before normal spells. An Oath reward at a normal cast's completion begins after that tick's countdown.

