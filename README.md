# Wizard 1v1 — Expo / React Native

Native mobile auto battler built with Expo SDK 57, React Native 0.86, React 19, and TypeScript. Android, iOS, and web share native components. This project no longer uses Vite, HTML screens, or CSS stylesheets.

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

## Game loop

Main menu → shop → buy/reorder → simultaneous automatic bot duel → results → next shop.

- Every duel starts with base 100 health and 50 mana, increased by equipped items.
- Start with Spark, Fireball, and 10 gold; ten spell slots; duplicates allowed.
- Gain 10 gold each round; unspent gold carries over.
- Cast from first slot to last, then repeat. No passive mana regeneration; unaffordable casts are skipped. Spark costs zero mana.
- Shields/healing resolve before simultaneous damage. Siphon heals actual damage only if its caster survives the beat.
- Both fighters defeated, or 60 beats without a knockout, means a draw.
- Bot loadouts rotate. Full spellbooks can be reordered; selling/replacement is not implemented yet.
- Runs live in memory and reset on app restart/reload. Returning to the menu preserves the run. Playback pauses when backgrounded; Android Back returns to the menu.

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

Equipment can feed health/mana modifiers into `deriveStats` and `fighter`. Four basic equipment items now occupy weapon, armor, ring, and boots slots and apply health/mana modifiers. Equipment replacement, selling, and richer combat buffs remain future work. Game data uses JSON-compatible snapshots and does not depend on DOM, browser crypto, or structuredClone, making it portable to Hermes and a future Node backend.

## Validation

`npm test` covers deterministic combat, simultaneous knockouts, shields, healing, mana exhaustion, equipment stats, purchase/slot validation, stale revisions, phase locking, and native-safe snapshots. `npm run build` compiles Android and iOS Hermes bundles plus a web export. Bundle export is not a signed native application build.

## Shop prototype layout

The shop follows the supplied wireframe: player panel on the left, four spell offers above two equipment offers, gold and a 1-gold reroll at the upper right, a fanned ten-slot spell hand below, and Next round on the right. Shopping and combat lock to landscape on Android/iOS; the menu locks to portrait. In a portrait browser viewport the game prompts you to widen the window or rotate. Both shop panels stay side by side, and the hand measures its available width so it never needs horizontal scrolling. The shop sizes its offers and hand to the available landscape height, keeping the main screen free of horizontal and vertical scrolling. Card inspection opens a separate scrollable detail dialog. Mock cards use the supplied Fire, Nature, Water, Affliction, and Holy frame assets with temporary spell sigils. Tap a card to inspect and buy; drag a hand card left or right to reorder; tapping still opens accessible Earlier/Later controls. Purchases apply immediately. Next round locks the hand and starts combat.

The local gateway generates deterministic rotating offers. Duplicate spell purchases are allowed while gold and hand capacity permit. Rerolls update both rows and cost 1 gold. Equipment buys fill one empty matching slot; bonuses persist between rounds and are applied by the shared combat engine. Gear cannot currently be replaced or sold. Player portrait and level are visual placeholders.


Native orientation uses expo-screen-orientation and iOS full-screen mode. If you use a custom native build, rebuild once with npm run android:build after this dependency/configuration change. Expo Go includes the supported module. Reordering is submitted as a single validated move command on drop; cancelled gestures leave the order unchanged.

