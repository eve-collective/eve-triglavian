"""TrueType font compilation from computational geometric polygon outlines."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from shapely.geometry import MultiPolygon, Polygon

from eve_triglavian.constants import DEFAULT_STROKE_WIDTH
from eve_triglavian.geometry import build_glyph_polygon, svg_to_font_y
from eve_triglavian.glyphs import GLYPHS
from eve_triglavian.models import FontMetadata


def draw_shapely_to_pen(
    geom: Polygon | MultiPolygon,
    pen: TTGlyphPen,
    font_y_offset: int = 850,
) -> None:
    """Convert Shapely Polygon(s) into TrueType clockwise/counter-clockwise contour drawings.

    Args:
        geom: A Shapely Polygon or MultiPolygon.
        pen: A fontTools TTGlyphPen instance.
        font_y_offset: Y-offset used to flip coordinate direction from SVG down to TrueType up.
    """
    if geom.is_empty:
        return

    polys = [geom] if isinstance(geom, Polygon) else list(geom.geoms)
    for poly in polys:
        # Exterior contour (clockwise in TrueType)
        ext_coords = [
            (round(x), svg_to_font_y(y, font_y_offset=font_y_offset))
            for x, y in list(poly.exterior.coords)[:-1]
        ]
        if len(ext_coords) >= 3:
            pen.moveTo(ext_coords[0])
            for pt_coord in ext_coords[1:]:
                pen.lineTo(pt_coord)
            pen.closePath()

        # Interior contours / holes (counter-clockwise in TrueType)
        for interior in poly.interiors:
            int_coords = [
                (round(x), svg_to_font_y(y, font_y_offset=font_y_offset))
                for x, y in list(interior.coords)[:-1]
            ]
            if len(int_coords) >= 3:
                pen.moveTo(int_coords[0])
                for pt_coord in int_coords[1:]:
                    pen.lineTo(pt_coord)
                pen.closePath()


def compile_ttf_font(
    output_path: str | Path = "TriglavianGeometric.ttf",
    stroke_width: float = DEFAULT_STROKE_WIDTH,
    metadata: FontMetadata | None = None,
) -> Path:
    """Build and save an installable TrueType (.ttf) font file.

    Args:
        output_path: Path where the compiled .ttf font will be written.
        stroke_width: Stroke width for polyline buffering.
        metadata: Optional FontMetadata specifying naming, ascent, and descent.

    Returns:
        The destination Path where the font was saved.
    """
    meta = metadata or FontMetadata()
    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)

    fb = FontBuilder(meta.upm, isTTF=True)
    glyph_order = [".notdef", "space"] + [f"uni{ord(c):04X}" for c in GLYPHS.keys()]
    fb.setupGlyphOrder(glyph_order)

    cmap: dict[int, str] = {32: "space"}
    glyf_table: dict[str, Any] = {}
    metrics: dict[str, tuple[int, int]] = {".notdef": (600, 50), "space": (450, 0)}

    # Empty .notdef and space glyphs
    empty_pen = TTGlyphPen(None)
    glyf_table[".notdef"] = empty_pen.glyph()
    glyf_table["space"] = empty_pen.glyph()

    for char in GLYPHS:
        gname = f"uni{ord(char):04X}"
        cmap[ord(char)] = gname

        merged_poly = build_glyph_polygon(char, stroke_width=stroke_width)
        t_pen = TTGlyphPen(None)
        draw_shapely_to_pen(merged_poly, t_pen, font_y_offset=meta.ascent)
        glyf_table[gname] = t_pen.glyph()

        minx, _miny, maxx, _maxy = merged_poly.bounds
        advance_width = max(int(maxx + 120), 650)
        metrics[gname] = (advance_width, int(minx))

    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyf_table)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=meta.ascent, descent=meta.descent)
    fb.setupNameTable(
        {
            "familyName": meta.family_name,
            "styleName": meta.style_name,
            "uniqueFontIdentifier": meta.unique_font_identifier,
            "fullName": meta.full_name,
            "psName": meta.ps_name,
            "version": meta.version,
        }
    )
    fb.setupOS2(
        sTypoAscender=meta.ascent,
        sTypoDescender=meta.descent,
        usWinAscent=meta.ascent,
        usWinDescent=abs(meta.descent),
    )
    fb.setupPost()

    fb.save(str(out_file))
    return out_file
