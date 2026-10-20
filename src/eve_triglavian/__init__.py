"""Triglavian Collective Typography & Geometric Font Toolkit for EVE Online."""

from __future__ import annotations

from eve_triglavian.constants import DEFAULT_STROKE_WIDTH, SAFE_NAMES, UPM, P, pt
from eve_triglavian.font import compile_ttf_font, draw_shapely_to_pen
from eve_triglavian.geometry import build_glyph_polygon, stroke_to_polygon, svg_to_font_y
from eve_triglavian.glyphs import (
    GLYPHS,
    get_glyph_category,
    get_glyph_info,
    get_glyph_safe_name,
    get_glyph_strokes,
    list_all_glyph_info,
)
from eve_triglavian.models import (
    BuildConfig,
    BuildSummary,
    FontMetadata,
    GlyphCategory,
    GlyphInfo,
    GlyphStroke,
    Point2D,
)
from eve_triglavian.svg import export_all_svgs, generate_glyph_svg_content

__version__ = "0.1.0"

__all__ = [
    "DEFAULT_STROKE_WIDTH",
    "GLYPHS",
    "P",
    "SAFE_NAMES",
    "UPM",
    "BuildConfig",
    "BuildSummary",
    "FontMetadata",
    "GlyphCategory",
    "GlyphInfo",
    "GlyphStroke",
    "Point2D",
    "__version__",
    "build_glyph_polygon",
    "compile_ttf_font",
    "draw_shapely_to_pen",
    "export_all_svgs",
    "generate_glyph_svg_content",
    "get_glyph_category",
    "get_glyph_info",
    "get_glyph_safe_name",
    "get_glyph_strokes",
    "list_all_glyph_info",
    "pt",
    "stroke_to_polygon",
    "svg_to_font_y",
]
