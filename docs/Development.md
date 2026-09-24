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

Supported browsers show **Full screen** in the main menu and Local lobby. Tap it to hide browser controls; **Exit full screen** restores them. Fullscreen persists between game screens, and the button follows browser-initiated exits. Native apps and browsers without fullscreen support omit the control.

Use 832 × 384 CSS pixels as the established S24 Ultra landscape reference; this is a logical viewport, not the panel's physical resolution. Check a wider viewport when changing responsive layout. Verify readable inspection dialogs, long-hold previews away from the finger, drag/drop, full-hand warnings and disabled battle entry above the slot limit.

Development builds support `?combat-lab=mixed-heat`, `heat`, `branches`, `chains`, `ward`, `signals`, `fire`, `water`, `nature`, `holy` and `resolutions` (successful Oaths and Fragile casts with Echo). Open a separate tab and start a new game for a reproducible combat preview. Production builds use the regular gateway. Preserve the user's active run and close temporary tabs afterward.

For combat visuals, check pause/resume, 0.5× and normal speed, independent concurrent chains, parent-before-child hops, self/Cycle exclamation cues, Imp origins and damage-number positioning. One chain fits one tick; siblings depart together. IDs describe actual causal events rather than inferring dependencies from card positions.

## Runtime boundaries

Combat darts update SVG geometry directly from one progress clock, without per-frame React state. Measure each distinct endpoint once per feedback batch, retain causal trigger scheduling, and keep inactive darts static. Native transform/opacity feedback and heat particles use the native animation driver; SVG geometry and width-based bars remain JavaScript-driven. Pause/speed changes preserve normalized progress without per-frame position listeners. Keep particle counts, glow styles and simulation outcomes unchanged when optimizing presentation.

Runs are currently in memory; refreshing loses them. Reload after changing the ruleset. Keep combat snapshots JSON-compatible and avoid browser-only globals or native UI imports inside game logic. Use the shared snapshot clone helper rather than requiring browser crypto or structuredClone.

The asynchronous injected `GameGateway` supports solo play and subscribed multiplayer snapshots. The solo adapter remains in-process. Multiplayer commands pass through an authenticated room authority; public internet hosting still needs TLS, account authentication, durable rooms and operational rate limiting.

## Local multiplayer

**Host:** install the Android APK, open **Multiplayer → Local**, then choose **Create hotspot & host** or **Host on existing Wi-Fi**. Grant the Wi-Fi permission when prompted. Hotspot mode creates an Android local-only network with no internet. Existing Wi-Fi works only when the router allows devices to communicate with each other (guest-network/client isolation prevents it).

**Guest:** scan the host's first QR code to join its Wi-Fi and accept the phone's connection prompt. Stay connected even if the phone reports no internet. Then scan the second QR code and open it in a browser; it joins automatically. If already on the same Wi-Fi, scan only the game code. A standard Wi-Fi QR cannot also launch a game URL, so these are deliberately two separate scans. The full link and hotspot credentials are shown for manual entry. On a host with several local interfaces, select the address belonging to the shared network before scanning the game code.

The room has two human seats and 0–6 Normal bots. Only the host can change the bot count, before starting. Both players shop independently and select **Ready**; ready hands are locked, with a cancel option until the other player is ready. Each battle is calculated once and mirrored for the opponent. Odd player totals rotate a rest round with no trophies. Augment choices and round progression follow solo rules.

Keep the host app in the foreground; its screen stays awake while hosting. A browser refresh rejoins the same seat using a tab-scoped key. Temporary Wi-Fi loss displays reconnect status and preserves the authoritative session while the host remains running. Leaving during a game closes the room for both players. Host-process termination loses the room; there is no host migration or save/resume yet. Internet play is not enabled by the Local option.

### Architecture and builds

- `src/multiplayer/roomAuthority.ts`: serialized, authoritative commands, revision checks, private per-player snapshots, ready barriers, seeded bots and tournament results. It has no React, network or Android dependencies and reuses the solo purchase/reward rules.
- `protocol.ts`: versioned request/reply schema and runtime command validation. Per-seat tokens authorize mutations; invitation tokens do not authorize host controls. Request IDs deduplicate retries. Opponents see only decks from completed rounds.
- `client.ts`: `RoomTransport` plus an HTTP implementation and a subscribed `GameGateway`. Polls transfer battle data only when a player's revision changes. A future online service can reuse the authority and replace transport/identity/storage without changing the game screens.
- `hosting.ts` and Android `LocalMultiplayerModule.kt`: hotspot lifecycle, bundled static HTTP hosting and request transport to the host's JS authority. The server accepts local-network clients, bounds requests, rejects cross-origin API writes, serves only packaged assets and stops when the host closes the room.

Gradle's `exportLocalWeb` task exports the browser build into generated `android/app/src/main/assets/local-web/` before Android builds. These generated files are ignored by Git. The APK includes its web client and assets, so guests require neither Expo nor an internet connection. Expo Go cannot provide the custom host module; use an installed native build.

For two-browser development on a computer:

1. Run `npm run local:web` (or `node node_modules/expo/bin/cli export --platform web --output-dir android/app/src/main/assets/local-web`).
2. Run `npm run local:serve` (or `node tools/local-multiplayer/serve.cjs`). The server listens on port 8787 and prints a private host link and guest invitation. `LOCAL_MULTIPLAYER_PORT` overrides the port.
3. Open the host link, select **Host local game**, and open the guest link in a separate tab/device. Host bot controls and both clients use the same authority/protocol as Android. Re-export and restart after source changes; this standalone test server does not hot-reload.

Validation covers two browser clients and Kotlin compilation. A physical Android host plus a second phone is required to validate OEM hotspot behaviour, camera QR scanning, network permission prompts and device backgrounding. The current Android target is SDK 36; upgrading to SDK 37 must include Android 17's local-network runtime permission.

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
