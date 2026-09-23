# Development guide

## Structure and sources of truth

- `src/config/*/spell.json`: base spells and explicit upgrades. `catalogue.ts` supplies typed definitions; `game/upgrades.ts` resolves a copy's XP.
- `src/config/augments.json`, `keywords.json`, `statuses.json`: rewards, glossary, periodic potency and charge definitions.
- `rules.json`, `shopOdds.json`, `bots.json`, `tournament.json`, `playback.json`: game limits, economy odds, difficulty, scoring and playback settings. Read these instead of duplicating values in documentation.
- `src/game/combatSimulation.ts`: deterministic combat and event queue. `model.ts` defines serializable snapshots. `playback.ts` and `triggerAnimation.ts` derive presentation without changing combat outcomes.
- `src/services/localGateway.ts`: session authority for commands, revision checks, phase locks, purchases and rewards. `useGame.ts` manages UI actions and playback.
- `src/screens` and `src/components`: React Native screens and reusable card/UI components. `src/theme.ts` owns shared colors, domain palettes, typography, spacing, radii and primitive styles. `src/ui.tsx` owns primitive components.
- `tools/balance-lab`: offline simulation/report tooling, excluded from the mobile bundle. See its [guide](../tools/balance-lab/README.md).

Spells have explicit `castTicks`, `rules`, `keywords` and executable `combat.effects`. Upgrades specify the full resulting rules/effects. Conditional speed uses `instantDomain`, `castDomain` and `unattunedCastTicks`. Text describes mechanics; the simulator does not parse rules text to execute effects. Keep both aligned.

Bots use the same catalogue, prices, XP and reward cadence. Difficulty affects configured shopping attempts and income advantages, not hidden combat stats. Deck growth is bounded by `rules.slots`. Scouting uses copied last-combat decks and XP.

## Local workflow

Install with `pnpm install --frozen-lockfile` (the checked-in lockfile is pnpm). Run scripts with pnpm or npm; do not generate a second package lock. Use a supported Node LTS version.

- `npm run web`: Expo browser development; default local URL is http://localhost:8081/.
- `npm run android`: compile/install the native Android app; requires Android SDK, JDK and an emulator/device.
- `npm run ios`: native iOS build on macOS.
- `npm run typecheck`: strict TypeScript, including unused locals/parameters.
- `npm test`: deterministic rules, progression, shop and presentation tests.
- `npm run docs:generate`: regenerate the single [spell and augment reference](Spell_and_Augment_Reference.md) after catalogue changes.
- `npm run docs:check`: verify the reference is current without rewriting it.
- `npm run build`: export production web and native JS/Hermes bundles; this does not produce an APK.

If package-manager commands are unavailable but Node and dependencies exist, use `node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/vitest/vitest.mjs run`, and `node node_modules/expo/bin/cli start --web --port 8081`.

## Browser validation

Use 832 × 384 CSS pixels as the established S24 Ultra landscape reference; this is a logical viewport, not the panel's physical resolution. Check a wider viewport when changing responsive layout. Verify readable inspection dialogs, long-hold previews away from the finger, drag/drop, full-hand warnings and disabled battle entry above the slot limit.

Development builds support `?combat-lab=mixed-heat`, `heat`, `branches`, `chains`, `ward`, `signals`, `fire`, `water`, `nature` and `holy`. Open a separate tab and start a new game for a reproducible combat preview. Production builds use the regular gateway. Preserve the user's active run and close temporary tabs afterward.

For combat visuals, check pause/resume, 0.5× and normal speed, independent concurrent chains, parent-before-child hops, self/Cycle exclamation cues, Imp origins and damage-number positioning. One chain fits one tick; siblings depart together. IDs describe actual causal events rather than inferring dependencies from card positions.

## Runtime boundaries

Runs are currently in memory; refreshing loses them. Reload after changing the ruleset. Keep combat snapshots JSON-compatible and avoid browser-only globals or native UI imports inside game logic. Use the shared snapshot clone helper rather than requiring browser crypto or structuredClone.

The asynchronous injected GameGateway enables a future remote authority, but the local adapter is not a security boundary. A remote version still needs authentication, persistence, runtime validation, reconnect behavior and ruleset versioning.

### Build an APK with Gradle on Windows

The native project includes `android/gradlew.bat` and its Gradle wrapper. No separate Gradle installation or Expo account is required. Install Node dependencies first and have Java 17+ and the Android SDK available.

```powershell
cd D:\Apps\Wizard1v1\android
.\gradlew.bat assembleDebug
```

The APK is `android/app/build/outputs/apk/debug/app-debug.apk`. To build and install over USB debugging, use `./gradlew.bat installDebug`. Debug builds require Metro: run `npx expo start --localhost` from the project root and `adb reverse tcp:8081 tcp:8081` for a USB-connected phone.

For standalone local testing, `./gradlew.bat assembleRelease` bundles JavaScript and assets and writes `android/app/build/outputs/apk/release/app-release.apk`. The generated release configuration currently uses the debug signing key, so it is for local testing; configure a private release key for store distribution.

`android/local.properties` must point `sdk.dir` to your Android SDK, not your Java installation. On this machine it is `C:/Users/jackc/AppData/Local/Android/Sdk`. Keep this machine-specific file out of version control. `JAVA_HOME` points to the JDK. The wrapper downloads its configured Gradle version and build dependencies on the first run.

### Android connection troubleshooting

Expo must find the correct Android SDK. If necessary, set these for the current PowerShell session (adjust the path if your SDK is elsewhere):

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:ANDROID_HOME\platform-tools;" + $env:Path
npm run android
```

If LAN connections are unavailable, use `npm run android -- --localhost`. On systems where localhost resolves only to IPv6, use `node --dns-result-order=ipv4first node_modules/expo/bin/cli start --android --localhost`. Expo sets up ADB forwarding for the emulator. If an old server is already using port 8081, stop it before starting another.

Official references: [Expo CLI](https://docs.expo.dev/more/expo-cli/) and [Android emulator setup](https://docs.expo.dev/workflow/android-studio-emulator/).

