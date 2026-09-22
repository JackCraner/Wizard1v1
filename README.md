# Wizard 1v1

A mobile spell auto-battler built with Expo, React Native, and TypeScript. Build an ordered deck, watch simultaneous duels, and shape your strategy with permanent combat rewards.

## The simplified game

- You and seven bots race to eight duel wins. Draws award no trophy.
- Start with 500 Health, an empty hand, and 10 gold. There is no mana or random critical-hit system.
- Buy from five spell offers. Price equals the clearly displayed 1–5 star rarity. Drag into your hand to buy, or tap for full rules and purchase controls.
- Hold a card to read a large preview placed above or beside your finger. Drag owned cards to arrange up to ten spells in casting order.
- Spells take 1T, 2T, or 3T before modifiers. After the last spell, spend one tick reshuffling and repeat the same order.
- Duels end on a knockout or after 40 ticks; higher remaining Health wins at timeout.
- After rounds 2, 4, 6, and so on, every player chooses a free permanent augment from three unowned options. The pool contains 32 augments. Identical augments cannot stack.
- Unspent gold carries over. Each new shop adds 10 gold, and a reroll costs 1 gold before augment modifiers.

## Domains and card upgrades

All five domains are playable, with ten spells each. Shops remain open to every domain. Your two most numerous domains are attuned. Ties favor the oldest card still held; reordering never changes priority. Buying, merging or trashing can change the counts. Merging preserves the recipient’s age and removes the donor. There are no passive Affinity/Mastery stat bonuses.

Colored signature keywords require the source deck’s matching attunement: Nature activates Poison and Regeneration; Water activates Tide; Fire activates Heat; Holy activates Oath; Affliction activates Frailty and Curse of Repetition. Incoming enemy debuffs still affect unattuned targets. Ward, Slow, Cleanse and basic damage/healing remain shared.

Early spells retain useful basic effects; late-game spells depend more heavily on attunement. Printed conditions show exactly what changes. Nature uses Poison and Regeneration, each with fixed 15-point ticks and additive duration. Water builds and spends persistent Tide. Fire builds Heat (+4% Fire damage per charge) and spends five on printed Empowered payoffs. Holy uses Ward and three-spell Oaths. Affliction uses Slow, Frailty, Poison and Curse of Repetition.

Cards start at 0/3 XP. Merge a matching card to add 1 XP; reaching 3 upgrades its printed effects. Drag a shop copy onto a matching owned card to buy and merge it, even when your hand is full. Owned-card merges remain available in inspection. A partially trained donor grants only 1 XP; upgraded cards cannot be donors. Scholar makes the first purchased duplicate each shop grant 2 XP.

Trash removes an owned spell without a refund unless Recycler grants 1 gold. You need at least one spell to enter combat. The spell library includes base and upgraded effects and the shared 18-keyword glossary.

## Augments and scouting

Augments replace purchased items. They can change domain interactions, casting speed, sequence rewards, risk/reward, or shop economy. Examples include repeating every fourth spell, empowering the final spell, faster casting after three quick spells, and a free first reroll. Reward cards explain their keywords before selection.

Inspect augments from the shop, combat, or leaderboard. The leaderboard preserves each player's last combat deck and XP while showing their current permanent augments. Bot choices follow the same reward cadence and cannot duplicate owned augments.

See [combat conventions](src/config/COMBAT_RULES.md), [the catalogue](src/config/CARDS.md), and [redesign decisions](docs/simplification-redesign.md). This is an initial balance pass, not a competitively balanced release. Runs live in memory; reload after changing rules.

## Development

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

`android:build` uses Expo Prebuild and Gradle, and requires an installed Android SDK, compatible JDK, and emulator. It does not require an Expo account. The native `android/` project and Gradle wrapper are kept in the repository. Android build outputs, caches and machine-specific `local.properties` remain ignored. The generated `ios/` folder is ignored. Expo app configuration belongs in `app.json`; use Expo prebuild to synchronize native settings after changing it, and review generated changes. The package identifier `com.wizard1v1.app` is a placeholder that can be changed before publishing. Store distribution and signed release builds are not configured yet.

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

## Structure and validation

- src/config: spells, upgrades, augment catalogue, keywords, status potency, shop odds, difficulty and tournament settings.
- src/game: deterministic combat, bot deck development, reward offers, tournament and replay snapshots.
- src/services/localGateway.ts: session authority for purchases, revisions, phase locks and rewards.
- src/screens: shop, augment choice, combat, scouting and spell inspection.

GameGateway is asynchronous and injected at the app root. A future remote authority must add authentication, persistence, runtime validation, reconnect support and ruleset versioning. The local adapter is not a server or a security boundary. Snapshots remain JSON-compatible and work without browser crypto or structuredClone.

Run npm test and npm run typecheck. npm run build exports Android/iOS Hermes bundles and web assets; it does not produce a signed native application. Tests cover every base/upgraded spell, augment mechanics, reward cadence for all players, purchases/XP, replay timing, simultaneous combat, mobile preview layout and tournament progression.
