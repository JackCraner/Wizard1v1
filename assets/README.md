# Aetheris — game/card typeface source kit

Aetheris is a dark-fantasy serif treatment designed for spell-card UI. The kit builds two installable fonts locally:

- **Aetheris Display** — spell names, headers, mana/cast values, rarity labels.
- **Aetheris Text** — card rules, descriptions and smaller UI copy.

The visual direction is intentionally restrained: classical high-contrast serif forms, slightly condensed display proportions, tall capitals, and generous tracking in titles. This keeps the painted dark-fantasy feel without making small card text difficult to read.

## Why this package contains source instead of font binaries

The builder produces the `.ttf` and `.woff2` files on your machine. It uses **EB Garamond** as the OFL-licensed outline base and applies the Aetheris naming/tuning plus custom domain glyphs. This package does not redistribute the base font binary.

## Build

1. Install Python 3.10+.
2. Install dependencies:

```bash
pip install fonttools brotli
```

3. Obtain two **TTF** files from EB Garamond under the SIL Open Font License 1.1. A semibold/bold cut works well for Display and Regular for Text.
4. Run:

```bash
python build_aetheris.py \
  --display /path/to/EBGaramond-SemiBold.ttf \
  --text /path/to/EBGaramond-Regular.ttf \
  --out ./dist
```

The `dist/` directory will contain:

```text
AetherisDisplay-Regular.ttf
AetherisDisplay-Regular.woff2
AetherisText-Regular.ttf
AetherisText-Regular.woff2
aetheris.css
```

## Domain glyphs

Aetheris also adds game-specific glyphs in Unicode's Private Use Area:

| Domain | Unicode | JS/TS escape |
|---|---:|---|
| Fire | U+E000 | `\uE000` |
| Water | U+E001 | `\uE001` |
| Nature | U+E002 | `\uE002` |
| Affliction | U+E003 | `\uE003` |
| Holy | U+E004 | `\uE004` |
| Rarity star | U+E005 | `\uE005` |

Example:

```tsx
<Text style={{ fontFamily: 'AetherisDisplay' }}>{'\uE000'} FLAME BOLT</Text>
```

## Recommended card typography

- Spell title: Aetheris Display, uppercase, `0.04–0.07em` tracking.
- Domain label: Aetheris Display, uppercase, smaller size, `0.08–0.12em` tracking.
- Rules text: Aetheris Text, normal case, relatively generous line-height (`1.15–1.3`).
- Numbers: use Aetheris Display for large mana/cast-time values.
- Avoid using Display below roughly 15–16 px equivalent on mobile; switch to Text for small copy.

## Expo / React Native

After building, copy the two `.ttf` files into your app's font asset directory. With `expo-font`:

```tsx
import { useFonts } from 'expo-font';

const [loaded] = useFonts({
  AetherisDisplay: require('./assets/fonts/AetherisDisplay-Regular.ttf'),
  AetherisText: require('./assets/fonts/AetherisText-Regular.ttf'),
});
```

Then:

```tsx
<Text style={{
  fontFamily: 'AetherisDisplay',
  fontSize: 24,
  letterSpacing: 1.2,
}}>
  COMBUSTION
</Text>
```

## Web

Copy the generated WOFF2 files and `aetheris.css` together, then import the stylesheet.

## Licensing

The builder is provided for this project. The generated fonts are **Modified Versions derived from EB Garamond** and therefore remain licensed under the **SIL Open Font License 1.1**. Keep the OFL notice with the font when bundling or redistributing it with the game.

EB Garamond copyright: Georg Duffner and contributors. Aetheris does not use the original font's name as its primary font name.
