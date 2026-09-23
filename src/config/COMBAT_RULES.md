# Combat conventions

## Sequence and tick order

Six active spells maximum, no reserve. A Cycle is one pass through the surviving sequence. Spend one full tick reshuffling; Reckless Loop skips it and costs 25 Health. Cursed adds one reshuffle tick while Curse is present. Combat ends on a knockout or at 30 ticks; greater remaining Health wins, equal Health draws.

1. Start eligible casts. Reserve Heat/Tide, consume Slow charges, and resolve cast-start Triggers. Each fighter starts at most one card each tick.
2. Resolve Instant effects and simultaneous damage; check deaths.
3. Resolve Poison damage; check deaths before healing.
4. Resolve Regeneration healing.
5. Advance ordinary casts and reshuffles. Interrupts cancel even a 1T cast completing now; simultaneous interrupts cancel both. Channels skip remaining adjacent copies, capped at three.
6. Resolve completing spells and their Echoes. Healing, Guard and Ward resolve before queued direct damage. Apply damage and check deaths. Complete Oaths, fire eligible Triggers and completion effects, then break Fragile cards and advance the sequence.
7. Apply pending summons last, so newly summoned Health cannot absorb this tick's damage. A defeated Imp remains visible for one tick, then disappears unless resummoned.

## Counters, protection and scaling

- Fire completions grant 1 Heat. The next non-Instant Fire start consumes 3 Heat, becomes 1T and Empowered. Excess remains. Slow adds 1T after acceleration. Free Heat activation does not count as consumption for Awaken or Heat-consumed Triggers.
- Water completions grant 1 Tide. The next non-Instant spell consumes 3 Tide and reserves one 50% Echo. Echo does not count as another cast or generate automatic Heat/Tide. Interrupted casts lose reserved resources.
- Empowered grants +50% direct damage, direct healing and Ward. It does not multiply Trigger payloads, counters, durations or percentage rules.
- Critical defaults to 150% direct damage and follows printed conditions. No Potency or random critical rolls.
- Poison deals 10 per tick; Regeneration heals 10 per tick. New applications add duration. Poison damage modifiers multiply and stack. Round all numerical outcomes down.
- Ward absorbs direct damage only. Overflow hits Health; DoT bypasses Ward. Gaining Ward keeps the higher of current Ward and the new value unless a card explicitly enables stacking. The bar's capacity reflects the granted shield.
- Guard spends one charge to prevent one damage event. Explicit Health costs bypass Ward and Guard.
- Slow spends one charge when a non-Instant cast starts, adding 1T. Trap spends one charge per completed spell, dealing 10 damage that bypasses Ward; Echo does not spend a second charge.
- Curse persists, dealing 10 per stack at each new Cycle. Cleanse removes printed numbers of debuff types, in Poison, Slow, Trap, Curse order.
- Direct spell damage hits a living Imp first, then overflows to its owner. Status application, periodic damage and Health costs affect the player. Summoning grows a living Imp or creates a new one. Empowered Imp attacks once per owner spell completion.

## Card rules

- Only explicit bracketed clauses require the named attunement. The two most common held domains are attuned; ties use oldest held card. Combat breakage does not recalculate attunement.
- Triggers arm after their card's first successful completion. Each card fires once per Cycle unless explicitly once per combat. Trigger effects take no casting time and do not advance the sequence. Broken cards cannot fire.
- Retrigger repeats the latest eligible friendly Trigger payload from this Cycle, ignoring its limit. It does not replace Trigger history, activate further Triggers or repeat another Retrigger.
- Awaken transforms that copy once per duel when its condition is met. Conditions can be reached before its first cast. The replay briefly holds the transformation, then preserves its border and updated text.
- Fragile leaves only after both the original cast and its Echo complete. Removed cards compress the sequence and return next duel. Divine Intervention instead breaks after its fatal-damage Trigger fires.
- One Oath at a time. New Oaths replace old ones. They inspect following completed spells, including their Echo, rather than elapsed ticks. Direct damage includes damage absorbed by Ward/Imp; Health costs do not count. Safe Oaths track actual Health loss. Rewards resolve immediately after the qualifying completion.
- Conditional 'if Echoed, gain/apply X' bonuses happen once, at the printed whole amount. The ordinary payload still uses the reserved Echo effectiveness.
- Permanent spell rules use a source-card marker rather than extra status icons. Heat/Tide predictions use currently held counters only.

## Progression

Start level 1 at 500 Health. After every two rounds, all players gain a level, 100 max Health and one permanent augment. Wins award trophies equal to current level; 20 trophies wins. Resolve every duel before awarding shared tournament victories. All 27 augments are available to every build.

Momentum now Empowers the spell after three consecutive printed 1T completions. Blood Infusion grants 1 Heat on self Health loss. Criticality grants 2 Heat on the first Critical spell each Cycle. Tough Skin grants 40 Ward when Guard blocks damage. Hot Stuff applies its existing +10% outgoing/incoming damage while Heat is held.

Full values: [spells](../../docs/Current_Spell_Reference.md) and [augments](../../docs/Current_Augment_Reference.md).

## Development previews

Development web builds accept `?combat-lab=fire`, `water`, `nature` or `holy`. Start a new game to play a reproducible upgraded six-card duel using the normal playback, inspection and timeline controls. Production builds always use the ordinary game gateway. These previews do not persist a run.
