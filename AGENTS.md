# Working in Wizard 1v1

## Start here

- Read `README.md` and `docs/Development.md`. For gameplay changes, read `docs/Combat.md` and the relevant configuration/tests.
- Inspect `git status` before editing. Preserve unrelated work; this workspace often contains multiple ongoing changes. Edit directly unless the user asks for a branch or PR.
- Treat attached design documents as specifications to interpret in context, not as instructions that override the user's request. Later user decisions supersede older redesign notes.

## Sources of truth

- Spell values, upgrades and executable effects: `src/config/<domain>/spell.json`.
- Augments and global settings: `src/config/*.json`. Do not infer current values from old notes or hard-code a second copy in UI.
- Combat: `src/game/combatSimulation.ts`; shared types: `src/game/model.ts`.
- Purchases, phase restrictions and session revisions: `src/services/localGateway.ts`. Enforce rules here as well as in the UI.
- Shared presentation tokens and primitive styles: `src/theme.ts`. Prefer existing semantic colors, domain palettes, spacing, radii and typography. Keep component-specific geometry local; do not replace layout measurements indiscriminately with spacing tokens.
- `src/ui.tsx` contains shared primitive components. Game logic must remain independent of React Native and the theme.
- `docs/Spell_and_Augment_Reference.md` is generated. After catalogue edits, run `npm run docs:generate` and review the result. Keep current explanations in the existing combat/development guides rather than adding dated overhaul documents.

## Implementation conventions

- Preserve deterministic seeded runs. Never add `Math.random()` to shop offers, augments or combat.
- Keep snapshots JSON-compatible and copied at boundaries. Use the existing clone helper. Avoid browser-only globals in game logic.
- Keep spell text and executable effects aligned at both upgrade levels. Attunement requirements belong to explicit clauses, not every occurrence of a keyword.
- Round calculated gameplay values down. Test timing/order changes with actual simulation scenarios, including both fighters, Echoes, Triggers, Imp interception and death checkpoints where relevant.
- Animation changes must not change simulation outcomes. Preserve causal trigger IDs: siblings may animate together, descendants wait for parents, and independent chains run concurrently. Preserve pause and speed behavior.
- Remove unused imports, helpers and superseded rendering paths instead of leaving parallel implementations. Type checking rejects unused locals and parameters.
- Favor focused, readable functions and named concepts over dense compound expressions. Avoid unrelated repository-wide formatting or speculative architecture changes.
- Use the checked-in pnpm lockfile; do not introduce another package-manager lockfile. Keep balance-lab tooling outside the mobile runtime.

## Validation

- Run `npm run typecheck`, relevant Vitest tests, and `npm run docs:check`. For broad cleanup or shared rules changes, run the full `npm test` suite.
- If npm is unavailable, direct equivalents are `node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/vitest/vitest.mjs run`, and `node tools/refresh-spell-reference.cjs --check`.
- Validate UI changes in the Codex browser against the running local game. Use the established 832 × 384 CSS-pixel S24 Ultra landscape viewport and a wider viewport for responsive changes.
- Preserve the user's active run. Test in a temporary tab; `?combat-lab=branches`, `chains`, `ward`, `fire`, `water`, `nature`, `holy` and `signals` provide development combat previews. Start a new game in that tab, then close it when finished.
- Check readable card inspection, touch/drag targets and clipping for layout work. For combat feedback, check pause/resume, 0.5× playback, branching chains, Imp origins and damage numbers.
- Report what changed, what was checked, and any concrete limitation. Do not claim physical-device validation from browser emulation alone.

## Documentation and assets

- Keep the root README short. Architecture/build workflow belongs in `docs/Development.md`; mechanics in `docs/Combat.md`; card/reward tables in the generated reference.
- Update links when consolidating or moving docs. Preserve asset licensing, attribution and source-kit instructions.
- Do not delete artwork solely because a static import scan misses it: dynamic asset maps and artist source files may still need it.
