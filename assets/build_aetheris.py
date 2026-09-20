#!/usr/bin/env python3
"""
Aetheris font builder

Builds a dark-fantasy card/UI type system from user-supplied EB Garamond
font files (SIL Open Font License 1.1). It does not redistribute the base
font binaries. The generated Modified Version must remain under OFL-1.1.

Outputs:
  AetherisDisplay-Regular.ttf / .woff2
  AetherisText-Regular.ttf / .woff2
  aetheris.css

Requires:
  pip install fonttools brotli
"""

from __future__ import annotations

import argparse
import os
import shutil
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen

UNITS = 1000


def set_name(font: TTFont, family: str, style: str, ps_name: str):
    name = font["name"]
    full = f"{family} {style}"
    preferred = family
    entries = {
        1: family,
        2: style,
        3: f"Aetheris: {full}: 1.000",
        4: full,
        5: "Version 1.000",
        6: ps_name,
        16: preferred,
        17: style,
    }
    for nid, value in entries.items():
        name.setName(value, nid, 3, 1, 0x409)
        name.setName(value, nid, 1, 0, 0)

    # License metadata. Keep the derivative explicitly under OFL.
    name.setName(
        "This Font Software is a Modified Version derived from EB Garamond and is licensed under the SIL Open Font License, Version 1.1.",
        13, 3, 1, 0x409,
    )
    name.setName("https://openfontlicense.org", 14, 3, 1, 0x409)


def transform_outlines(font: TTFont, x_scale: float, y_scale: float):
    if "glyf" not in font:
        raise RuntimeError("Aetheris builder currently expects a TrueType/glyf input font (.ttf).")

    glyph_set = font.getGlyphSet()
    glyph_order = font.getGlyphOrder()
    new_glyphs = {}

    for gname in glyph_order:
        pen = TTGlyphPen(glyph_set)
        tpen = TransformPen(pen, (x_scale, 0, 0, y_scale, 0, 0))
        glyph_set[gname].draw(tpen)
        new_glyphs[gname] = pen.glyph()

    for gname, glyph in new_glyphs.items():
        font["glyf"][gname] = glyph

    for gname, (advance, lsb) in list(font["hmtx"].metrics.items()):
        font["hmtx"].metrics[gname] = (round(advance * x_scale), round(lsb * x_scale))

    # Give display letters a little extra breathing room by default.
    font["head"].xMin = round(font["head"].xMin * x_scale)
    font["head"].xMax = round(font["head"].xMax * x_scale)
    font["head"].yMin = round(font["head"].yMin * y_scale)
    font["head"].yMax = round(font["head"].yMax * y_scale)


def glyph_pen(font: TTFont):
    return TTGlyphPen(font.getGlyphSet())


def add_icon_glyphs(font: TTFont):
    """Add five domain icons + rarity star at U+E000..U+E005."""
    glyf = font["glyf"]
    hmtx = font["hmtx"]
    order = font.getGlyphOrder()
    cmap_tables = [t for t in font["cmap"].tables if t.isUnicode()]

    icons = {}

    # FIRE: tapered flame with an inner tongue cut suggested by silhouette.
    p = glyph_pen(font)
    p.moveTo((500, 70));
    p.qCurveTo((235, 190), (265, 455), (410, 650))
    p.qCurveTo((485, 750), (505, 900), (500, 950))
    p.qCurveTo((690, 775), (805, 610), (775, 405))
    p.qCurveTo((745, 180), (610, 85), (500, 70)); p.closePath()
    p.moveTo((500, 225));
    p.qCurveTo((415, 330), (455, 470), (540, 590))
    p.qCurveTo((600, 480), (635, 360), (585, 285))
    p.qCurveTo((550, 235), (520, 220), (500, 225)); p.closePath()
    icons[0xE000] = ("uniE000", p.glyph())

    # WATER: classic droplet.
    p = glyph_pen(font)
    p.moveTo((500, 950));
    p.qCurveTo((380, 710), (260, 560), (255, 385))
    p.qCurveTo((250, 155), (375, 70), (500, 70))
    p.qCurveTo((750, 70), (750, 285), (745, 390))
    p.qCurveTo((730, 575), (600, 760), (500, 950)); p.closePath()
    icons[0xE001] = ("uniE001", p.glyph())

    # NATURE: leaf + stem.
    p = glyph_pen(font)
    p.moveTo((180, 210));
    p.qCurveTo((300, 745), (665, 900), (850, 875))
    p.qCurveTo((825, 610), (695, 295), (260, 155)); p.closePath()
    p.moveTo((250, 120)); p.lineTo((310, 135)); p.lineTo((705, 735)); p.lineTo((675, 760)); p.closePath()
    icons[0xE002] = ("uniE002", p.glyph())

    # AFFLICTION: corrupted eye / sigil.
    p = glyph_pen(font)
    p.moveTo((110, 500)); p.qCurveTo((305, 760), (500, 810), (890, 500));
    p.qCurveTo((690, 245), (500, 190), (110, 500)); p.closePath()
    p.moveTo((500, 665)); p.qCurveTo((640, 665), (640, 500), (500, 335));
    p.qCurveTo((360, 335), (360, 500), (500, 665)); p.closePath()
    p.moveTo((480, 875)); p.lineTo((535, 875)); p.lineTo((520, 725)); p.lineTo((495, 725)); p.closePath()
    icons[0xE003] = ("uniE003", p.glyph())

    # HOLY: sun disk + eight rays.
    p = glyph_pen(font)
    # central octagon
    pts = [(500,250),(675,325),(750,500),(675,675),(500,750),(325,675),(250,500),(325,325)]
    p.moveTo(pts[0]);
    for pt in pts[1:]: p.lineTo(pt)
    p.closePath()
    rays = [
        [(470,790),(530,790),(500,960)], [(470,210),(530,210),(500,40)],
        [(790,470),(790,530),(960,500)], [(210,470),(210,530),(40,500)],
        [(710,710),(750,750),(865,865)], [(250,250),(290,290),(135,135)],
        [(710,290),(750,250),(865,135)], [(250,750),(290,710),(135,865)],
    ]
    for tri in rays:
        p.moveTo(tri[0]); p.lineTo(tri[1]); p.lineTo(tri[2]); p.closePath()
    icons[0xE004] = ("uniE004", p.glyph())

    # RARITY STAR: four long points + four short.
    p = glyph_pen(font)
    star = [(500,950),(565,610),(805,805),(635,565),(950,500),(610,435),(805,195),(565,390),(500,50),(435,390),(195,195),(390,435),(50,500),(390,565),(195,805),(435,610)]
    p.moveTo(star[0]);
    for pt in star[1:]: p.lineTo(pt)
    p.closePath()
    icons[0xE005] = ("uniE005", p.glyph())

    for cp, (name, glyph) in icons.items():
        if name not in order:
            order.append(name)
        glyf[name] = glyph
        hmtx.metrics[name] = (UNITS, 0)
        for cmap in cmap_tables:
            cmap.cmap[cp] = name

    font.setGlyphOrder(order)
    font["maxp"].numGlyphs = len(order)


def strip_dsig(font: TTFont):
    if "DSIG" in font:
        del font["DSIG"]


def build_one(src: Path, out: Path, family: str, ps: str, x_scale: float, y_scale: float):
    font = TTFont(src)
    transform_outlines(font, x_scale=x_scale, y_scale=y_scale)
    add_icon_glyphs(font)
    set_name(font, family, "Regular", ps)
    strip_dsig(font)

    # Aetheris is intended as an app/game UI face, so keep a sane UPM.
    font["head"].unitsPerEm = 1000
    if "OS/2" in font:
        font["OS/2"].achVendID = "AETH"
        font["OS/2"].fsSelection &= ~0x20  # clear bold flag if inherited
        font["OS/2"].usWeightClass = 500 if "Display" in family else 400

    out.parent.mkdir(parents=True, exist_ok=True)
    font.save(out)

    web = TTFont(out)
    web.flavor = "woff2"
    web.save(out.with_suffix(".woff2"))


def write_css(outdir: Path):
    css = """/* Aetheris — generated Modified Version under SIL OFL 1.1 */
@font-face {
  font-family: 'Aetheris Display';
  src: url('./AetherisDisplay-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Aetheris Text';
  src: url('./AetherisText-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

.spell-title {
  font-family: 'Aetheris Display', serif;
  letter-spacing: 0.055em;
  text-transform: uppercase;
}

.spell-rules {
  font-family: 'Aetheris Text', serif;
  letter-spacing: 0.01em;
}
"""
    (outdir / "aetheris.css").write_text(css, encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--display", required=True, type=Path, help="Path to an EB Garamond TTF for display text, ideally Semibold/Bold")
    ap.add_argument("--text", required=True, type=Path, help="Path to an EB Garamond TTF for body/rules text, ideally Regular")
    ap.add_argument("--out", default=Path("dist"), type=Path)
    args = ap.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    build_one(args.display, args.out / "AetherisDisplay-Regular.ttf", "Aetheris Display", "AetherisDisplay-Regular", 0.955, 1.015)
    build_one(args.text, args.out / "AetherisText-Regular.ttf", "Aetheris Text", "AetherisText-Regular", 0.985, 1.000)
    write_css(args.out)

    print(f"Built Aetheris into: {args.out.resolve()}")
    print("Domain glyphs: Fire U+E000, Water U+E001, Nature U+E002, Affliction U+E003, Holy U+E004, Star U+E005")


if __name__ == "__main__":
    main()
