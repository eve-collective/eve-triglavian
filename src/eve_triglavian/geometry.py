"""Computational geometry routines for polyline buffering, boolean unions, and coordinate transformations."""

from __future__ import annotations

from typing import Union

from shapely.geometry import LineString, MultiPolygon, Polygon
from shapely.ops import unary_union

from eve_triglavian.constants import DEFAULT_STROKE_WIDTH, PointLike, pt
from eve_triglavian.glyphs import GLYPHS

ShapelyGeom = Union[Polygon, MultiPolygon]


def stroke_to_polygon(
    coords: list[PointLike],
    stroke_width: float = DEFAULT_STROKE_WIDTH,
    cap_style: int = 2,
    join_style: int = 2,
    mitre_limit: float = 4.0,
) -> ShapelyGeom:
    """Buffer a polyline into a mitered 2D polygon with flat end caps.

    Args:
        coords: List of coordinate tuples or named grid points.
        stroke_width: Full stroke width in canvas units.
        cap_style: Shapely cap style (2 = FLAT / BUTT).
        join_style: Shapely join style (2 = MITRE).
        mitre_limit: Maximum miter ratio before clipping.

    Returns:
        A Shapely Polygon or MultiPolygon representing the buffered stroke.
    """
    resolved_pts = [pt(p) for p in coords]
    if len(resolved_pts) < 2:
        return Polygon()

    line = LineString(resolved_pts)
    return line.buffer(
        stroke_width / 2.0,
        cap_style=cap_style,
        join_style=join_style,
        mitre_limit=mitre_limit,
    )


def build_glyph_polygon(
    char: str,
    stroke_width: float = DEFAULT_STROKE_WIDTH,
) -> ShapelyGeom:
    """Create a unified, non-overlapping polygonal geometry for a Triglavian character.

    Args:
        char: The character to build.
        stroke_width: Stroke width for polyline buffering.

    Returns:
        A merged Shapely Polygon or MultiPolygon.
    """
    if char not in GLYPHS:
        raise KeyError(f"Character '{char}' is not in Triglavian GLYPHS dictionary.")

    paths = GLYPHS[char]
    buffered_shapes = [stroke_to_polygon(path, stroke_width=stroke_width) for path in paths]
    return unary_union(buffered_shapes)


def svg_to_font_y(y: float, font_y_offset: int = 850) -> int:
    """Transform an SVG coordinate (Y-down) to TrueType coordinate space (Y-up).

    TrueType space uses Y-up with baseline at Y=0 and cap-line near Y=850.
    """
    return round(font_y_offset - y)
