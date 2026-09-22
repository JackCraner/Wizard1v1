# Balance lab

Standalone, offline development tool. Run from the repository root with Node 24 and installed development dependencies:

```sh
npm run balance
npm run balance -- --builds 60 --tournaments 100 --search 100 --seed 42
npm run balance:test
```

Open the printed `report.html` path in a browser. No server, network connection, chart library, or extra dependency is required. The default batch uses 24 builds per level and 10 eight-bot tournaments. Arena work grows quadratically with `--builds`; search and removal probes add further battles. Benchmark a small run before increasing sizes. Runs are synchronous and can be stopped with Ctrl+C; partial results are not saved.

## APK separation

The dependency direction is **lab → game**. Nothing in the app imports the lab. Its Node-only loader uses the existing development TypeScript dependency to load the real engine and JSON catalogues; combat rules are not duplicated. Metro explicitly blocks this entire directory (including reports), and the app TypeScript project excludes tools. Android's Expo bundle entry remains the application entry. This tool adds no runtime dependency or app screen. Keep custom output directories outside app assets.

## Experiments and charts

- Arena: generated ordered decks at levels 1, 3, and 5; three, six, or ten slots, with fixed rarity schedules and upgrade counts per level. Every pair plays in both orientations. Augments are sampled without duplicates. These are synthetic availability-unconstrained builds, not legal shop purchase histories. If unique restrictions force a rarity fallback, costs can differ; inspect saved builds.
- Search: greedy mutations to spell choice, order, or augments. Spell replacements preserve star cost. Training opponents and evaluation opponents are split. This is a local search, not an exhaustive optimum; held-out results remain specific to this generated population.
- Progression: eight existing shopping bots, real shop/upgrade/reward logic, normal difficulty by default, rounds until the trophy target or `--rounds` cap. Seed changes offer-stream offsets. These are bot-only tournaments, with the game's reward timing and round pairings. Difficulty applies equally to all participants. They reflect existing heuristic bot behavior, not expert play.
- Augment removal: arena builds with/without each owned augment versus four same-level opponents in both orientations. Reports show the paired score change. This cannot measure economy benefits, and removing an augment does not compare it with an alternative reward.

The offline report includes spell/augment score bars, domain matchup heatmaps, spell-pair associations, battle-duration and health histograms, progression by round, controlled augment contribution, and inspectable builds. Filters separate experiment and level; the progression-round chart always covers the whole progression run and removal always covers arena. Score means wins plus half draws. Appearances are correlated; a high score is an investigation lead, not statistical proof. Pair charts include only observed combinations. They are associations, not a causal synergy estimate. Deterministic duplicate matchups provide no new evidence.

## Comparing edits

```sh
npm run balance -- --out tools/balance-lab/reports/before
# Edit spells or augments, then run the same experiment settings.
npm run balance -- --baseline tools/balance-lab/reports/before/results.json --out tools/balance-lab/reports/after
```

The lab rejects mismatched experiment settings and nonempty output folders. It records a content fingerprint of game rules and tool code. With an unchanged catalogue, seeded arena fixtures stay paired across value edits. Adding/removing cards or augments changes generated fixtures; comparisons then mix population and balance changes. Bot choices and search winners can change after any balance edit. Compare these as system outcomes, not controlled substitutions.

Each run saves `results.json`, `matches.csv`, five sample search scenarios and their detailed combat traces. Exact builds include acquisition ages because these influence attunement. Frames are discarded for bulk runs; only sample traces are retained. Recorded battle counts exclude internal search and removal probes.

```sh
npm run balance -- --replay tools/balance-lab/reports/before/scenario-1.json
```

Replay runs the saved fighters through the **current** engine and writes `replay.json`. To reproduce historical rules exactly, restore the corresponding source/config version as well. Search samples are the fastest held-out battles, not an automated verdict that a build is broken.
