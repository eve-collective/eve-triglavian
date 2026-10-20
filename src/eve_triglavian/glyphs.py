"""Declarative vector polygon definitions for all 81 Triglavian glyphs."""

from __future__ import annotations

from typing import Any

from eve_triglavian.constants import SAFE_NAMES
from eve_triglavian.glyphs_data import GLYPHS_POLYGONS
from eve_triglavian.models import GlyphCategory, GlyphInfo, GlyphStroke, Point2D

# Alias to the canonical extracted polygon definitions
GLYPHS: dict[str, list[dict[str, Any]]] = GLYPHS_POLYGONS


def get_glyph_category(char: str) -> GlyphCategory:
    """Determine the glyph category for a character."""
    if char.isupper():
        return GlyphCategory.UPPERCASE
    if char.islower():
        return GlyphCategory.LOWERCASE
    if char.isdigit():
        return GlyphCategory.NUMERAL
    return GlyphCategory.SYMBOL


def get_glyph_safe_name(char: str) -> str:
    """Return a filesystem-safe identifier name for the character."""
    if char.isupper():
        return f"upper_{char}"
    if char.islower():
        return f"lower_{char}"
    if char.isdigit():
        return f"num_{char}"
    safe_symbol = SAFE_NAMES.get(char, f"u{ord(char):04x}")
    return f"sym_{safe_symbol}"


def get_glyph_strokes(char: str) -> list[GlyphStroke]:
    """Retrieve resolved geometric contours (shells and holes) for a character."""
    if char not in GLYPHS:
        raise KeyError(f"Character '{char}' is not defined in the Triglavian glyph set.")

    strokes: list[GlyphStroke] = []
    for poly_dict in GLYPHS[char]:
        shell_points = [Point2D(x=float(pt[0]), y=float(pt[1])) for pt in poly_dict["shell"]]
        strokes.append(GlyphStroke(points=shell_points))
        for hole in poly_dict.get("holes", []):
            hole_points = [Point2D(x=float(pt[0]), y=float(pt[1])) for pt in hole]
            strokes.append(GlyphStroke(points=hole_points))
    return strokes


def get_glyph_info(char: str) -> GlyphInfo:
    """Return complete metadata description for a character."""
    if char not in GLYPHS:
        raise KeyError(f"Character '{char}' is not defined in the Triglavian glyph set.")

    return GlyphInfo(
        character=char,
        category=get_glyph_category(char),
        unicode_codepoint=ord(char),
        unicode_hex=f"U+{ord(char):04X}",
        safe_name=get_glyph_safe_name(char),
        stroke_count=len(GLYPHS[char]),
    )


def list_all_glyph_info() -> list[GlyphInfo]:
    """Return a list of GlyphInfo for all 81 characters."""
    return [get_glyph_info(char) for char in GLYPHS]
