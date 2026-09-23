# Combat conventions

## Sequence and tick order

Six active spells maximum in combat. During shopping, extra spells may be purchased at their full gold price as a temporary bench. Combat is blocked until the hand contains at most six spells; trashing or merging removes extras. A Cycle is one pass through the surviving sequence. Spend one full tick reshuffling; Reckless Loop skips it and costs 25 Health. Cursed adds one reshuffle tick while Curse is present. Combat ends on a knockout or at 30 ticks; greater remaining Health wins, equal Health draws.

1. Start eligible casts. Reserve Heat/Tide, consume Slow charges, and resolve cast-start Triggers. Each fighter starts at most one card each tick.
2. Resolve Instant effects and simultaneous damage; check deaths.
3. Resolve Poison damage; check deaths before healing.
4. Resolve Regeneration healing.
5. Advance ordinary casts and reshuffles. Interrupts cancel even a 1T cast completing now; simultaneous interrupts cancel both. Channels skip remaining adjacent copies, capped at three.
6. Resolve completing spells and their Echoes. Healing, Guard and Ward resolve before queued direct damage. Apply damage and check deaths. Complete Oaths, fire eligible Triggers and completion effects, then break Fragile cards and advance the sequence.
7. Apply pending summons last, so newly summoned Health cannot absorb this tick's damage. A defeated Imp remains visible for one tick, then disappears unless resummoned.

## Counters, protection and scaling

- Fire completions grant 1 Heat. The next non-Instant spell of any domain consumes 5 Heat, becomes 1T and Empowered. Excess remains. Slow adds 1T after acceleration. Free Heat activation does not count as consumption for Awaken or Heat-consumed Triggers.
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
- Every Trigger starts Dormant. That copy arms only after its first successful cast and the entire resulting event chain resolve; interruption does not arm it. Armed state lasts for the duel. Each copy fires at most once per tick (Fatal Damage is also once per combat). Eligible cards resolve in sequence order through a deterministic event queue. Normal Trigger effects can create further events, without a global chain-length cap. Broken cards immediately lose their Trigger.
- Damage listens to actual outgoing damage, including damage absorbed by Ward or Imp. Heal listens to actual Health restored to the owner or their Imp, including Regeneration; overhealing emits no event. Self-Damage listens to actual owner-caused Health loss. Ward Gain carries only the actual increase, so an equal/lower non-stacking grant emits no event. Curse Applied listens to an actual enemy stack increase; Imp Attack requires positive damage. Heat/Tide Consume require actual counters spent; free activations do not emit them.
- Retrigger repeats the latest eligible Armed friendly Trigger payload from this Cycle, ignoring its per-tick limit. It does not replace Trigger history, activate further Triggers or repeat another Retrigger. Dormant and broken copies are ineligible. Percentage payloads retain the original event amount.
- Awaken transforms that copy once per duel when its condition is met. Conditions can be reached before its first cast. The replay briefly holds the transformation, then preserves its border and updated text.
- Fragile leaves only after both the original cast and its Echo complete. Removed cards compress the sequence and return next duel. Divine Intervention instead breaks after its fatal-damage Trigger fires.
- One Oath at a time. New Oaths replace old ones. They inspect following completed spells, including their Echo, rather than elapsed ticks. Direct damage includes damage absorbed by Ward/Imp; Health costs do not count. Safe Oaths track actual Health loss. Rewards resolve immediately after the qualifying completion.
- Conditional 'if Echoed, gain/apply X' bonuses happen once, at the printed whole amount. The ordinary payload still uses the reserved Echo effectiveness.
- Permanent spell rules use a source-card marker rather than extra status icons. Heat/Tide predictions use currently held counters only.
- Living Flame modifies the first non-Instant Fire cast start of each Cycle. Maelstrom reserves its free Echo on the first spell start, including Instant. Free activations take priority over normal consumption, grant one activation rather than a second Echo, and interrupted casts still use that Cycle's free activation. Previously started spells are not retroactively modified when the permanent rule is acquired.
- Downpour, Radiant Bolt and Sacred Group snapshot their conditions at cast start. First-domain bonuses check completed spells this Cycle. Heatwave's next-Fire bonus expires at the Cycle boundary. Holy no longer generates Heat, Curse or Slow.

## Progression

Start level 1 at 500 Health. After every two rounds, all players gain a level, 100 max Health and one permanent augment. Wins award trophies equal to current level; 20 trophies wins. Resolve every duel before awarding shared tournament victories. All 27 augments are available to every build.

Momentum now Empowers the spell after three consecutive printed 1T completions. Blood Infusion grants 1 Heat on self Health loss. Criticality grants 2 Heat on the first Critical spell each Cycle. Tough Skin grants 40 Ward when Guard blocks damage. Hot Stuff applies its existing +10% outgoing/incoming damage while Heat is held.

Full values: [spell and augment reference](Spell_and_Augment_Reference.md).

## Playback feedback

Trigger darts follow causal parents: siblings travel concurrently, later hops wait for their parent, and separate chains run together. Each chain fits one playback tick. Faint trails retain earlier hops. Self/Cycle activations use an exclamation hop; damage numbers and darts pause with playback. See [development previews](Development.md#browser-validation).

All cards show rising embers and sparks that grow denser, brighter and faster across five Heat levels, with a restrained edge glow. The next eligible card pulses more strongly at five Heat. Empowered adds a brief ignition burst and white-hot corners. The animation follows playback speed and pause; reduced motion keeps a static glow.

When an Echo resolves, a translucent blue copy of that spell appears behind its sequence card, rises slightly and fades. This feedback follows pause and playback speed; reduced motion uses a stationary fading copy.

The combat HUD reserves Ward space even at zero Ward and fixed-height buff/debuff boxes. Status chips wrap horizontally and scroll within the reserved box when needed. During an echoed cast, the Tide wave icon remains visible at zero stacks and pulses with playback; it replaces the extended Tide activation receipt.
