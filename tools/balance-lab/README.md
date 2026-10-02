# Balance lab

Standalone, offline development tool. Run from the repository root with Node 24 and installed development dependencies:

```sh
npm run balance
npm run balance -- --builds 60 --tournaments 100 --search 100 --seed 42
npm run balance:test
```

Open the printed `report.html` path in a browser. No server, network connection, chart library, or extra dependency is required. The default batch uses three consecutive seeds, 24 builds per level per seed, ten eight-bot tournaments per seed, and three search restarts with 60 mutations each. Use `--seeds 1 --restarts 1 --builds 4 --tournaments 1 --search 1` for a smoke test. Arena work grows quadratically with `--builds`; search and removal probes add further battles. Benchmark a small run before increasing sizes. Runs are synchronous and can be stopped with Ctrl+C; partial results are not saved.

## APK separation

The dependency direction is **lab → game**. Nothing in the app imports the lab. Its Node-only loader uses the existing development TypeScript dependency to load the real engine and JSON catalogues; combat rules are not duplicated. Metro explicitly blocks this entire directory (including reports), and the app TypeScript project excludes tools. Android's Expo bundle entry remains the application entry. This tool adds no runtime dependency or app screen. Keep custom output directories outside app assets.

## Experiments and charts

- Arena: generated ordered decks at levels 1, 3, and 5; three slots at level 1 and six at levels 3 and 5, with fixed rarity schedules and upgrade counts per level. Every pair plays in both orientations. Augments are sampled without duplicates. These are synthetic availability-unconstrained builds, not legal shop purchase histories. If unique restrictions force a rarity fallback, costs can differ; inspect saved builds.
- Tactical arena: exactly the same arena cards, upgrades, augments and acquisition ages, reordered by the live bot tactics. Every pair plays in both orientations, allowing comparison with random ordering.
- Search: multiple starting decks and greedy mutations to spell choice, order, or augments. Spell replacements preserve star cost. Training opponents and evaluation opponents are split. This is a local search, not an exhaustive optimum; held-out results remain specific to this generated population.
- Progression: eight existing shopping bots, real shop/upgrade/reward logic, normal difficulty by default, rounds until the trophy target or `--rounds` cap. Seed changes offer-stream offsets. Saved profiles reflect actual deck domains, with the preferred strategy saved separately. These are bot-only tournaments, with the game's reward timing and round pairings. Difficulty applies equally to all participants. They reflect existing heuristic bot behavior, not expert play.
- Augment removal: arena builds with/without each owned augment versus four same-level opponents in both orientations. Reports show the paired score change. This cannot measure economy benefits, and removing an augment does not compare it with an alternative reward.

- Dependency probes: each search candidate faces up to four held-out opponents before and after sampled order shuffles, equal-rarity card substitutions, or individual augment removal. XP/age travel with shuffled copies. These tests expose reliance on specific pieces and ordering; a strong but fragile combination can be desirable. They do not prove causation or prescribe nerfs. Full-combination sightings count independent progression bot lineages with all required cards, upgrades and augments, regardless of order; this is observed bot access, not a human acquisition probability.

The offline report includes spell/augment score bars, domain matchup heatmaps, spell-pair associations, battle-duration and health histograms, progression by round with timeout rates, per-seed results, distinct build/lineage counts, upgrade coverage, actual starting Health (including Monster), completed casts, close versus clear timeouts, controlled augment contribution, and inspectable builds. Filters separate experiment and level; the progression-round chart always covers the whole progression run and removal always covers arena. Score means wins plus half draws. Appearances are correlated; a high score is an investigation lead, not statistical proof. Pair charts include only observed combinations. They are associations, not a causal synergy estimate. Deterministic duplicate matchups provide no new evidence.

## Comparing edits

```sh
npm run balance -- --out tools/balance-lab/reports/before
# Edit spells or augments, then run the same experiment settings.
npm run balance -- --baseline tools/balance-lab/reports/before/results.json --out tools/balance-lab/reports/after
```

Schema 2 reports are required for baseline comparison; older reports remain readable on their own but used different sampling and economy assumptions. The lab rejects mismatched experiment settings and nonempty output folders. It records a content fingerprint of game rules and tool code. With an unchanged catalogue, seeded arena fixtures stay paired across value edits. Adding/removing cards or augments changes generated fixtures; comparisons then mix population and balance changes. Bot choices and search winners can change after any balance edit. Compare these as system outcomes, not controlled substitutions.

Each run saves `results.json`, `matches.csv`, five sample search scenarios and their detailed combat traces. Exact builds include acquisition ages because these influence attunement. Frames are discarded for bulk runs; only sample traces are retained. Recorded battle counts exclude internal search and removal probes.

```sh
npm run balance -- --replay tools/balance-lab/reports/before/scenario-1.json
```

Replay runs the saved fighters through the **current** engine and writes `replay.json`. To reproduce historical rules exactly, restore the corresponding source/config version as well. Search samples are the fastest held-out battles, not an automated verdict that a build is broken.

## Balance philosophy

Use the lab to find broadly dominant, easy-to-assemble strategies, not to force every card toward a 50% score. Powerful combinations are welcome when assembling their cards and augments takes luck and correct ordering takes tactics. Inspect strength, order sensitivity, missing-piece sensitivity and observed access together. Compare independent seeds and build counts; repeated matches and snapshots are correlated. Bot shopping is still heuristic and the two practice archetypes are a limited training population. Held-out search performance is not expert-human performance. Never infer that an economy augment is weak from combat-only removal.
