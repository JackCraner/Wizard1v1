# Wizard 1v1

Wizard 1v1 is a mobile spell auto-battler built with Expo, React Native, and TypeScript. Build a spell deck in the shop, choose its casting order, and watch it fight automatically against another wizard.

A game contains **you and seven bots**. Race to **8 duel wins**. Every duel starts at **500 health and 100 mana**, before equipment bonuses, and lasts at most **50 ticks**. Your deck can contain **10 cards from at most two domains**. The strategy comes from balancing damage, mana, cast times, and the timing of buffs and debuffs.

## At a glance

1. Start a run with an empty hand and 10 gold.
2. Buy spells, merge duplicates for upgrades, equip items, and reorder your hand.
3. Lock your deck and fight a 1v1 duel automatically.
4. Earn a trophy for a win, check the leaderboard, and return to the shop with 10 more gold.
5. Continue until someone reaches 8 wins.

Nature focuses on damage over time and healing. Water focuses on mana, healing, and repeated spell effects. Fire focuses on burst damage, critical hits, and self-damage. Holy focuses on protection, Oaths, interrupts, and extending enemy reshuffles through Consecration. Affliction currently has visual assets only.

## Shopping and deck building

### Gold, offers, and equipment

- The shop has **five spell offers** and three stackable item offers. Equipment also costs its 1–5 star rank and uses the same round-based rarity probabilities as spells. A spell's gold price equals its star rank: a 3-star spell costs 3 gold. Mana is a separate combat resource.
- Drag a shop spell into your hand to buy it. Each offer can be purchased once; its slot stays empty until a reroll or the next round.
- Rerolling costs **1 gold** and refreshes both shop rows. Unspent gold carries over; each new round adds **10 gold**.
- Round 1 offers only rank 1 spells. Higher ranks gradually become more likely. The probabilities for each round are in `src/config/shopOdds.json`; rounds beyond the last entry use that entry's probabilities.
- Items have no equipment slots or ownership limit. Each copy adds one stack; items persist for the run. Each shop offer is consumed on purchase.

### Hand order and domains

Your hand holds up to **10 spells**. Drag cards to change their order; that order becomes the combat casting sequence. Hold a card to enlarge it and see explanations for its keywords. Accessible inspection controls also support buying and reordering.

You may use at most **two domains**, determined by the spells currently in your hand. The player panel shows those domains, with empty icons for unused choices. After selecting two domains, new shop rolls are restricted to them. Existing offers from a third domain cannot be purchased. Removing every spell from a domain frees that domain slot.

Drag an owned card to the **trash** to remove it. This gives no gold refund. You need at least one spell to enter combat. Duplicate cards are allowed except for spells marked **Unique**.

### XP and upgraded cards

Each owned card starts at **0/3 XP**. Consume a matching copy to add **1 XP** to the target card. At **3 XP**, it upgrades: one original card plus three donated copies produces one upgraded card.

Drag a shop copy onto a matching hand card to buy and merge it directly. The purchase consumes the shop offer and costs its normal gold price. Owned copies can also be merged through inspection controls. A direct shop merge works even when the hand is full and can upgrade a Unique card without creating a second deck copy.

Upgraded cards use a different border and their configured upgraded mana cost, cast time, and effects. Their star rank and domain stay the same. XP follows a card when reordered and persists between rounds. A partially trained donor still grants only 1 XP; its other progress is lost. Upgraded cards cannot gain more XP or be consumed as donors.

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

## Combat mechanics

### Casting, mana, and reshuffling

Both wizards act automatically. A **1T** spell completes at the end of its first casting tick; a **2T** spell needs two ticks. Mana is paid **when casting starts**, not when the spell completes. An unaffordable card is skipped, consumes that tick, and does not spend mana.

An **Instant** spell resolves at the start of the tick, but your next card cannot start until the next tick. Instant chains therefore still use one card per tick. There is no passive mana regeneration: spells and their effects must supply mana. Mana and healing cannot exceed their maximums.

After the last card, the wizard normally spends **two full ticks reshuffling**, then restarts the same order. Reshuffling does not randomize the deck or grant immunity: damage, healing, buffs, and debuffs continue normally.

### What happens during a tick?

The engine follows this order for both fighters:

1. Resolve Instant spells.
2. Deal damage over time.
3. Check for death, including active Phoenix revival.
4. Decrease DoT stacks.
5. Apply healing over time.
6. Decrease HoT stacks.
7. Process other buffs and debuffs, then decrease their stacks.
8. Progress and resolve normal spells.

A lethal early phase ends the duel before later phases can rescue the defeated wizard. Effects from an Instant can participate in that tick's periodic phases; effects from a normal cast generally begin their periodic work next tick. Effects with immediate reactions, such as Guard, take effect when applied.

### Stacks usually mean duration

Most stacks represent remaining ticks, not increased power. Applying 5 Moonfire to a target that already has 5 adds them together to make 10. A normal cast applying 5 Moonfire leaves 5 stacks that tick; the following five ticks each deal 10 damage and count down through 4, 3, 2, 1, and zero.

Some effects also scale with their remaining stacks:

- **Burn:** 10 damage per stack. Five stacks deal **50 → 40 → 30 → 20 → 10** damage before modifiers.
- **Lifebloom:** 10 healing per stack, following the same declining sequence.
- **Hotstreak:** each remaining stack adds 10 percentage points of crit chance.
- **Channel:** X counts adjacent copies of that spell, rather than status stacks.

Timed stacks continue to count down during casting and reshuffling. Consecration persists until consumed or cleansed, and Oaths persist until completed, broken, or replaced. Maelstrom explicitly prevents Tide countdown. Next-spell effects, such as Slowness and Alignment, are consumed when used and can also expire before use.

### Critical hits and damage modifiers

Base random crit chance is currently **0%**. Hotstreak adds **10% per remaining stack**, capped at 100%. A critical hit deals **150% of normal damage**, or **200% while Overheat is active**. Some spells have conditions that guarantee a crit.

Normal spells check their crit chance when they resolve, **after that tick's buff countdown**. For example, Scorch grants 2 Hotstreak; the next 1T spell resolves with 1 stack and a 10% chance. A 2T spell can finish after both stacks expire. Scorch cannot retroactively use the stacks it grants to improve its own crit roll. Instant spells can use stacks before countdown.

DoTs need **Eruption** to crit; their crit chance is sampled from the applying caster at the start of the tick. Direct damage crits and periodic crits are recorded separately. Inspect a cast on the timeline to see its actual crit chance, result, and damage calculation.

Fury increases damage by 10%, Rain increases Water damage by 20%, and Star Empowerment increases DoT damage by 20%. Their stack counts extend duration rather than multiplying those percentages. Different applicable damage bonuses multiply together. Fractional damage rounds to the nearest whole point.

### Targets, protection, and interruption

**Apply** means the opponent; **gain**, **give**, and **grant** mean the caster unless the card explicitly says otherwise. For example, Immolate burns its own caster, and Renew grants Growth to both fighters.

Guard blocks damage while active. Veil reduces incoming damage by 50% and restores 5 mana per opposing spell hit, including repeat hits, but not per periodic damage tick. Explicit health costs, such as Overheat's loss of half current health, bypass damage protection.

Interrupt stops an ongoing cast, skips that card, and does not refund mana. The interrupted wizard waits until the next tick to start another card. A spell that already completed in the same resolution phase is not cancelled.

### Winning and playback

A duel ends when a wizard reaches zero health without reviving, or after 50 ticks. At the limit, the wizard with **less actual remaining health** loses. Equal health or simultaneous knockouts produce a draw. Wins award one trophy; draws award none. Losses do not eliminate players. The run ends when a participant reaches 8 wins; simultaneous qualifiers can share the finish.

Combat speed changes presentation, not the result: **1× = 2 seconds per tick**, **2× = 1 second**, and **4× = 0.5 seconds**. Skip jumps to the result. There are no extra pause ticks. Red numbers show damage, green numbers show healing, and blue numbers show mana gained or lost through abilities. Routine casting costs do not produce floating mana numbers. Critical damage has a glow and an exclamation mark.

## Spell keyword reference

The following entries describe the current rules. Values are before other modifiers unless stated otherwise.

| Keyword | Explanation |
| --- | --- |
| **Ward** | A damage shield: 1 Ward absorbs 1 damage before health, then is consumed. Ward stacks, does not count down, and resets each combat. Guard blocks damage without spending Ward. |
| **Cycle** | One pass through the ordered deck, ending after Reshuffle. Once-per-Cycle effects refresh for the next pass; skips and interrupts still advance the deck. |
| **Restoration** | Percentage increase to healing done, including HoTs. Separate from healing received bonuses; does not affect mana restoration. |
| **Spell Power** | Percentage increase to direct spell damage. DoTs require their own bonus unless explicitly included. |
| **DoT** | Damage over time. Deals damage before normal spells and loses one stack afterward. Reapplication adds stacks. Most DoTs deal fixed damage; Burn scales with remaining stacks. |
| **HoT** | Heals during the HoT phase, then loses 1 stack. Reapplying adds stacks. Most HoTs heal a fixed amount; Lifebloom heals per remaining stack. |
| **Instant** | Resolves at tick start, before damage over time and duration countdowns. Your next spell waits until the next tick. |
| **Crit** | A critical hit deals 150% of normal damage. |
| **Channel** | X is the number of identical Channel cards in a consecutive group in your hand. Each copy casts separately at its listed time and mana cost. Groups do not wrap across the ends of the hand. |
| **Unique** | Only one copy of this spell may be in your deck, across base and upgraded versions. Shop copies can still be consumed directly for upgrade XP. |
| **Moonfire** | A DoT that deals 10 damage per tick. |
| **Sunfire** | A DoT that deals 20 damage per tick. |
| **Lifebloom** | Heals 10 health per remaining stack each tick, then loses 1 stack. At 5 stacks, heals 50; next tick at 4 stacks, heals 40. Reapplying adds stacks. |
| **Growth** | A HoT that heals 10 health per tick. |
| **Slowness** | Adds one tick to the next started spell, then is consumed. Additional stacks extend the window to use it, not the extra cast time. |
| **Starfall** | A DoT that deals 50 damage per tick. |
| **Star Empowerment** | Increases DoT damage by 20%. |
| **Trap** | Take 10 damage each time you begin casting a spell while active, including Instant spells. Skips and continued casting do not trigger it. Loses 1 stack each tick. |
| **Overgrowth** | Your Growth heals 30 health per tick instead of 10 while active. Does not change Lifebloom or the opponent’s Growth. Loses 1 stack each tick. |
| **Tide** | Grants a 20% chance to trigger Tidecaller. A double cast consumes up to 5 Tide stacks. Maelstrom prevents countdown, but not consumption. |
| **Tidecaller** | While Tide is active, an eligible spell has a flat 20% chance to resolve twice. Pay its casting cost once. A trigger consumes up to 5 Tide stacks after its effects. |
| **Steal** | Take available mana from the opponent and restore it to yourself, capped by your maximum mana. |
| **Rain** | Increases Water spell damage by 20%. |
| **Veil** | Take 50% less damage. Restore 5 mana each time an opposing spell hits you; periodic damage does not grant mana. |
| **Cleanse** | Remove one randomly chosen DoT or debuff from yourself, including all its remaining stacks. |
| **Guard** | Immune to direct, self, and periodic damage while active. Hits do not consume stacks. Explicit health costs still apply. |
| **Hotstreak** | Each stack grants 10% crit chance (up to 100%) and loses 1 stack per tick. Crossing from below 5 to at least 5 stacks grants 3 Combust. Hotstreak is not consumed. |
| **Combust** | While active, spells take at most 1 tick; Instant stays Instant. Each completed spell deals 5 damage to you. Each stack adds 1 tick of duration. |
| **Burn** | Deal 10 damage per remaining Burn stack each tick, then remove 1 stack. For example, 5 stacks deal 50, then 40, 30, 20 and 10 damage. |
| **Eruption** | Your DoTs can critically hit using your crit chance at the start of each tick. |
| **Overheat** | While active, your critical hits deal 200% of normal damage instead of 150%. Each stack adds 1 tick of duration. |
| **Interrupt** | Stop the current cast or channel and skip that card. Mana already spent is not refunded. Completed casts are unaffected. |
| **Fury** | Increases damage by 10%. |
| **Phoenix** | Revive with half maximum health and mana while active (rounded down, at least 1 health). Rebirth does not consume duration, so it can trigger again during the window. |
| **Celestial Alignment** | Your next started spell deals double direct damage. Consumed when casting starts; the bonus lasts through that cast. Does not boost later DoT ticks. Unused stacks count down each tick. |
| **Greater Alignment** | Your next started spell deals triple direct damage. Consumed when casting starts; the bonus lasts through that cast. Does not boost later DoT ticks. Unused stacks count down each tick. |
| **Cloud Heart** | Receive 40% more healing, including HoTs, for 25 ticks. Greater Cloud Heart replaces this with 60%; the bonuses do not multiply together. |
| **Greater Cloud Heart** | Receive 60% more healing while active, including healing over time. Lasts 25 ticks. |

## Special spell interactions

| Spell | Current behavior |
| --- | --- |
| Germination | Restores mana based on the opponent's total remaining DoT stacks at resolution. |
| Flourish | Doubles the caster's remaining HoT stacks without immediately triggering healing. Unique. |
| Renew | Heals the caster, then grants 5 Growth to the caster and 5 to the opponent. |
| Eclipse | Consumes the opponent's remaining DoTs and deals their remaining damage immediately. Burn's future damage declines as its stacks count down. Guard blocks the damage but not consumption. |
| Wild Growth | Grants Growth and Overgrowth; Overgrowth changes the caster's Growth healing to 30 per tick. |
| Tsunami | Pays half current mana, rounded down, at cast start. Damage is based on that paid amount. |
| Rainborn | Costs 15 mana. For the rest of combat, active Rain also heals 20 each tick. Does not grant Rain itself. |
| Monsoon | For the rest of combat, active Rain also restores 5 mana each tick. Does not grant Rain itself. |
| Maelstrom | Prevents Tide countdown for the rest of combat. Tidecaller still consumes up to 5 stacks when triggered. |
| Whirlpool | Scales with Tide before the double-cast consumption is applied. |
| Cloud Heart | Costs 10 mana and grants a 25-tick healing bonus: 40%, or 60% when upgraded. |
| Overheat | Loses half current health, rounded down, then grants Overheat and Hotstreak. The base card grants 15 and 5 stacks respectively. |
| Flashfire | Consumes Burn on both fighters and grants one Hotstreak and one Fury per remaining stack consumed. |
| Conflagrate | Makes the next started spell Instant, if the next-spell effect is still active. |

Rainborn, Monsoon, and Maelstrom are combat-long modifiers; recasting them does not stack their power. Each Channel card casts separately and uses the entire contiguous group size, including copies before and after it. For example, three consecutive Undertows each use X = 3. Groups do not wrap across the ends of the deck; upgraded and base copies of the same spell belong to the same group.

## Holy: protection, Oaths and Penance

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

## Current scope and balancing

Runs are local and use bots that develop their decks between rounds. Difficulty changes their shopping and deck-building behavior. The shop leaderboard shows all eight participants, their wins, and their decks from the previous combat. Returning to the menu keeps the current run; reloading or restarting the app resets it.

The catalogue contains 98 spells across Nature, Water, Fire, and Holy. All 27 Holy spells are playable; their first upgraded versions cost 20% less mana with the same effects and cast times. Cards with unresolved mechanics remain visible in the library but cannot appear in playable decks or shop offers. **Tidal's mana cost and Starfall's application amount remain undefined.** Spell assets are still being added; missing artwork is allowed.

The JSON files are the source of truth for balancing:

| File | Controls |
| --- | --- |
| `src/config/itemShop.json` | Item offer count, affinity weights and timing notes. |
| `src/config/equipment.json` | All 80 stackable items: 1–5 stars, affinity, per-stack effects and caps. |
| `src/config/spells.json` | Every spell's base and upgraded values, rules text, keywords, and effects. |
| `src/config/holy.json` | Consecration-to-Penance threshold and Holy rule notes. |
| `src/config/statuses.json` | Shared status values, such as Burn damage per stack and crit bonuses. |
| `src/config/keywords.json` | Keyword names and in-game explanations. |
| `src/config/rules.json` | Base resources, hand/shop limits, max ticks, and crit defaults. |
| `src/config/shopOdds.json` | Spell rank probabilities by round. |
| `src/config/bots.json` | Bot difficulty and deck-building settings. |
| `src/config/tournament.json` | Wins required and bot names. |
| `src/config/playback.json` | Tick duration and playback speeds. |

See `src/config/COMBAT_RULES.md` for implementation conventions and remaining design decisions. Base and upgraded cards may differ; consult the individual spell entry for exact values.

## Development

## Run on your Android emulator

Start an Android virtual device in Android Studio, then in IntelliJ's terminal:

```powershell
cd D:\Apps\Wizard1v1
npm run android
```

Dependencies are already installed. On a fresh checkout use `pnpm install --frozen-lockfile` (the repository includes a pnpm lockfile), or `npm install` if you prefer npm. Use a supported Node LTS version; Node 24 is recommended. `npm run android` starts Metro, installs/opens Expo Go if needed, and loads this app. Keep the terminal running for development and live reload.

Other commands:

```sh
npm start                 # Expo dev server; press a for Android
npm run web              # Same React Native interface in the browser
npm run ios              # iOS Simulator (requires macOS)
npm run typecheck
npm test
npm run build            # Production JS/Hermes bundles for all platforms; NOT an APK
npm run android:build    # Generate native Android project, compile and install debug app
```

`android:build` uses Expo Prebuild and Gradle, and requires an installed Android SDK, compatible JDK, and emulator. It does not require an Expo account. Generated `android/` and `ios/` folders are ignored; app configuration belongs in `app.json`. The package identifier `com.wizard1v1.app` is a placeholder that can be changed before publishing. Store distribution and signed release builds are not configured yet.

### Android connection troubleshooting

Expo must find the correct Android SDK. If necessary, set these for the current PowerShell session (adjust the path if your SDK is elsewhere):

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:ANDROID_HOME\platform-tools;" + $env:Path
npm run android
```

If LAN connections are unavailable, use `npm run android -- --localhost`. On systems where localhost resolves only to IPv6, use `node --dns-result-order=ipv4first node_modules/expo/bin/cli start --android --localhost`. Expo sets up ADB forwarding for the emulator. If an old server is already using port 8081, stop it before starting another.

Official references: [Expo CLI](https://docs.expo.dev/more/expo-cli/) and [Android emulator setup](https://docs.expo.dev/workflow/android-studio-emulator/).

## Structure

- `App.tsx`: providers and dependency injection for the game gateway.
- `src/GameApp.tsx`: native navigation shell, main menu, and guide.
- `src/screens/`: shopping and combat screens.
- `src/ui.tsx`: reusable native controls, meters, and theme.
- `src/useGame.ts`: session requests, replay timing, app lifecycle, and back-button behavior.
- `src/game/`: serializable domain models, spell catalog, stat modifiers, and deterministic combat engine.
- `src/services/localGateway.ts`: local authority validates purchases, spell order, revision, and phase. Local session identifiers are process-local counters, not authentication tokens.

## Future backend and equipment

`GameGateway` is asynchronous and injected at the app root. Replace the local implementation with an HTTP/WebSocket adapter; keep the same screens and shared rules. The server must own sessions, matchmaking, loadout locking, command validation, concurrency/idempotency, and combat results. Add authentication, persistence, runtime request validation, reconnection, and ruleset versioning before real multiplayer. The current local adapter is not a server or a security boundary.

Item inventories are JSON maps of item ID to stack count. `equipmentModifiers`, `deriveStats` and the pure combat runtime apply their configured effects. Purchases validate session revision, offer slot, price and phase before incrementing inventory. Selling remains future work. Game data uses JSON-compatible snapshots and does not depend on DOM, browser crypto, or structuredClone, making it portable to Hermes and a future Node backend.

## Validation

`npm test` covers deterministic combat, simultaneous knockouts, shields, healing, mana exhaustion, equipment stats, purchase/offer validation, stale revisions, phase locking, and native-safe snapshots. `npm run build` compiles Android and iOS Hermes bundles plus a web export. Bundle export is not a signed native application build.

