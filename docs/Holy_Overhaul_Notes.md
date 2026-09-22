# Holy and Fragile — implementation notes

23 Holy spells replace the previous Holy list. All five domains are now updated: **109 spells and 32 augments**. The [complete editable reference](Spell_and_Augment_Reference.md) lists base and upgraded effects.

## Fragile

- After its first completed cast, that individual copy leaves the rotation for the rest of the duel. Interrupting it does not break it. Echoes/repeats attached to the first cast still resolve before it breaks.
- Purchased cards and their XP remain intact; the spell returns next duel. Other copies each get their own cast.
- Lay on Hands' bracketed healing and Fragile both require Holy attunement. Off-domain it resolves without either effect.
- Remaining cards keep their order and original replay indexes. The usual one-tick reshuffle remains; a deck with every card broken simply stops casting, while periodic effects and timers continue.
- Attunement remains the duel's starting deck attunement. Fragile does not change ownership, domain priority, or acquired age.
- A card badge, combat notice and timeline detail identify the break. The combat deck omits broken cards and explicitly shows when all spells are gone.

## Timed Oaths

- The condition starts on the next full tick after the Oath resolves. Restraint, Eye for an Eye and Judgement watch two ticks. Meditation watches its five stunned ticks.
- Restraint requires zero damage dealt. Eye for an Eye requires at least 100 total damage over the two ticks, not 100 each tick. Judgement requires zero damage taken. Meditation requires being Stunned for the five watched ticks.
- Conditions use actual Health damage after protection. Outgoing damage includes enemy Imp Health, Poison and Imp attacks. Damage absorbed entirely by Ward/Guard does not count. Judgement tracks the owner's Health, not the Imp's. Explicit Health-loss costs are not damage.
- A new Oath replaces the previous Oath. Casting interruption or reshuffling does not cancel a timed Oath. Breaking a zero-damage condition fails immediately; Eye for an Eye checks the total at the end.
- Rewards resolve after the tick's normal combat and duration countdowns, giving Guard/Fury/Stun their full printed duration. Rewards do not retroactively invalidate another Oath completed in the same reward phase.
- Completing an Oath sets the completed-this-cycle flag and activates Sacred Rhythm. The flag resets at the start of the next cycle; the next-Holy-spell Empowered bonus persists until used.
- Echoing an Oath does not stack rewards or shorten its timer; the strongest copy wins.

## Chosen interpretations

- Oath: Judgement and Oath: Meditation have 1T cast time because none was supplied.
- Holy Light is Instant at both upgrade levels; the explicit Instant keyword takes precedence over the conflicting 1T notation.
- Turn Unholy provisionally converts the caster's healing into damage to the enemy for five ticks, including the caster's Regeneration. Enemy healing remains healing. Printed healing converts even at full Health; heal-to-full converts missing Health only. Conversion uses Fury/Weaken/Glass Cannon, does not roll a second critical, and does not heal at the same time. Converted direct healing is intercepted by an Imp; converted Regeneration damages the opponent directly.
- Forgiveness consumes the caster's Curse stacks, although Curse is a counter rather than an over-time effect. It heals the printed 20/30 per stack; Regeneration potency does not multiply it.
- Redemption uses remaining Regeneration ticks when the spell resolves, rounded down after halving. Divine Hands also uses remaining ticks at resolution and does not consume them.
- Unmentioned base effects remain on upgrades. Bracketed stronger numbers fall back to the base numbers without Holy attunement. Consecration's Ward requires both Holy attunement and an Oath completed in the current cycle.
- Spelling standardized to Forgiveness and Radiant Bolt. Sacred Group retains the supplied name.
- Start a fresh run for the replaced Holy catalogue; older removed card IDs are not migrated.
