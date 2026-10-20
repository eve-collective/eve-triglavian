"""Tests for geometric stroke buffering and coordinate transformations."""

from eve_triglavian.geometry import build_glyph_polygon, stroke_to_polygon, svg_to_font_y


def test_stroke_to_polygon_valid():
    poly = stroke_to_polygon([(100, 100), (200, 200)], stroke_width=40.0)
    assert not poly.is_empty
    assert poly.area > 0


def test_stroke_to_polygon_insufficient_points():
    poly = stroke_to_polygon([(100, 100)], stroke_width=40.0)
    assert poly.is_empty


def test_build_glyph_polygon_sample_chars():
    for char in ["A", "a", "1", "?", "#"]:
        geom = build_glyph_polygon(char)
        assert not geom.is_empty
        assert geom.area > 0
        minx, miny, maxx, maxy = geom.bounds
        assert minx >= 0
        assert miny >= 0
        assert maxx <= 1000
        assert maxy <= 1000


def test_svg_to_font_y():
    assert svg_to_font_y(850, font_y_offset=850) == 0
    assert svg_to_font_y(0, font_y_offset=850) == 850
    assert svg_to_font_y(180, font_y_offset=850) == 670
