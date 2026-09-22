# Bot development

Bots buy from the same deterministic spell catalogue and rank odds, pay gold, track per-card XP and retain permanent augments. They receive the same three-choice reward cadence as the human. A reward favors an invested domain or a broadly useful sequence bonus; it never duplicates ownership.

Difficulty changes shopping attempts and, from the configured advantage round, bonus income. No hidden combat stats or result overrides are applied. Domain preferences influence valuation. Partial XP is valued so bots can complete upgrades. Oaths and generators are placed before payoffs; this is a simple heuristic, not an exhaustive search.

The opening target is three spells and grows by one per round up to ten. Preparing the same round twice is idempotent. Last-combat decks, XP and augments are copied before duels for scouting and replay isolation.
