# Combat rules and remaining decisions

## Active rules

- Only ids in `src/config/spells.json` exist in the game. Starting hand: empty. Buy at least one spell before combat. Shop offers are shuffled deterministically across eligible domains. Bots and shop offers use catalogue cards with implemented, sufficiently defined effects. Undefined cards remain browsable, with a `combat.blockedReason`, and cannot enter a loadout.
- `src/config/rules.json`: 500 base health, 100 base mana, 50 maximum ticks, 1.5 critical multiplier. Equipment modifies maximum stats. Gold cost is derived from stars.
- `src/config/statuses.json`: per-tick effect values. Every existing buff and debuff loses one remaining stack each world tick, including while its owner is casting.
- Apply 5 Moonfire on tick 1: it remains at 5 in that snapshot; tick 2 deals 10 damage and leaves 4; ticks 3–6 finish the remaining ticks. It deals five ticks of damage total. Damage per tick does not multiply by remaining duration.
- Casting 1T completes at the end of the first casting tick. Casting 2T completes on the second. Spells repeat in loadout order.
- Mana is charged once when casting starts. An unaffordable spell is skipped and consumes one tick, preserving the prototype's skip behavior. Healing and mana restoration cap at maximum values.
- Existing periodic effects resolve first, simultaneously. Ready spells resolve their effects, then simultaneous damage. New timed effects begin on the following tick. Cast events record actual completions, skips, crits and Tidecaller repeats.
- A knockout ends combat. At tick 50, the player with less remaining health loses; equal health, including simultaneous knockouts, is a draw. This compares actual health, not percentage.
- Deterministic seeded randomness keeps the replay portable to a future backend. Base random critical chance is provisionally 0%; explicitly guaranteed critical conditions work at 150% damage. Moonfire/Sunfire critical checks refer to effects on the opponent.

## Clarified deck and effect rules

- A deck can contain at most two domains, enforced at purchase and combat boundaries. Bots follow the same restriction. Once two domains are chosen, rerolls and future shops offer those domains only; existing third-domain offers cannot be bought.
- Stacks add duration, not per-tick power: 5 Moonfire plus 5 is 10 before the normal tick countdown. Reapplication never resets or caps duration.
- Guard grants immunity to all direct, self and periodic damage while active. Hits do not consume stacks. Guard takes effect when applied, including against simultaneous damage.
- Phoenix revives before knockout is checked. Current interpretation: half maximum health and mana (rounded down, with at least 1 health), without consuming the remaining duration; further lethal hits can trigger another rebirth during that window.
- Channel X counts every identical card in its consecutive group, including copies before and after the current position. Each card casts separately at its listed time and cost. Three Undertows each deal 3 damage and grant 3 Tide; two Spore Drains each deal 20 damage and grant 2 Growth. Reordering recalculates the groups. Current interpretation: groups do not wrap from the end to the start of the hand.

## Provisional conventions to confirm

- Instant spells have zero casting delay and can precede a timed spell in the same tick. An all-Instant loadout completes at most one full hand traversal per tick. This is a finite-loop guard and needs a final game rule.
- Slowness adds one tick to the next started spell, then is consumed. Next-spell effects are also consumed on start; if unused, their duration expires normally. Confirm consumption versus purely duration-based behavior.
- Tide gives one flat 20% Tidecaller chance while active; Whirlpool scales by remaining Tide. Rain adds 20% Water damage while active, not per remaining duration stack.
- Fractional damage is rounded to the nearest whole point. Stealing mana takes only what the opponent has; the recipient is capped at maximum mana.

## Still undefined

1. **Missing costs:** Celestial Alignment (mana and casting ticks), Tidal, Rainborn and Cloud Heart (mana).
2. **Remaining X values:** Burn damage; Starfall amount; Lifebloom's X. Channel scaling is defined; Immolate applies Burn to the caster and remains blocked only by Burn damage.
3. **Critical rules:** base crit chance; Hotstreak now preserves stacks and grants 3 Combust on upward crossings of five stacks. Combust caps casts at 1T and leaves Instant unchanged. Overheat health loss rounds down. Overheat is confirmed to override crit damage to 200% total while active; its spell grants 15 Overheat and 5 Hotstreak.
4. **Trap:** Trigger timing and whose casts it counts. Guard and Phoenix now use timed durations as described above.
5. **Targets and counting:** Renew's second Growth recipient; whose HoTs Flourish doubles; what Germination counts; whose Burn Flashfire consumes; whether Eclipse consumes DoTs.
6. **Restrictions and upgrades:** Unique definition; Overgrowth and the stated Growth change to 3 healing; Rainborn/Monsoon/Cloud Heart duration and trigger timing; Tsunami's current/max mana and rounding.
7. **Conflicts with countdown:** Maelstrom says Tide never expires. Confirm this as an explicit exception, or change the card.
8. **Interrupt:** whether the interrupted spell is skipped/restarted, refunds, and interaction with simultaneous completion.

The individual card's `combat.blockedReason` is the authoritative current availability reason. Do not enable a blocked card by only deleting the reason: supply and implement its effect definition first.

## Hotstreak and Combust

Each remaining Hotstreak stack adds 10 percentage points of crit chance, capped at 100%. Applying stacks across the five-stack threshold grants 3 Combust without consuming Hotstreak. Staying above the threshold does not repeatedly grant Combust; falling below and crossing again does. All stacks continue their normal countdown. Combust caps remaining cast time at 1T (including Slowness) and leaves Instant at zero. A spell completed while Combust was active before its effects deals 5 damage to its caster; skips do not. Tidecaller repeats are one cast and pay once. Guard can block this damage, and Phoenix can revive from it. The spell that first grants Combust does not pay the damage retroactively. Overheat loses half current health rounded down, then grants 15 Overheat and 5 Hotstreak; this loss is a health cost, unaffected by Guard.
