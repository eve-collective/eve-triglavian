"""Tests for glyph catalog, character definitions, and categorization."""

import pytest
from eve_triglavian.glyphs import (
    GLYPHS,
    get_glyph_category,
    get_glyph_info,
    get_glyph_safe_name,
    get_glyph_strokes,
    list_all_glyph_info,
)
from eve_triglavian.models import GlyphCategory


def test_glyph_count():
    assert len(GLYPHS) == 81


def test_glyph_categories_breakdown():
    infos = list_all_glyph_info()
    assert len(infos) == 81

    uppers = [g for g in infos if g.category == GlyphCategory.UPPERCASE]
    lowers = [g for g in infos if g.category == GlyphCategory.LOWERCASE]
    numerals = [g for g in infos if g.category == GlyphCategory.NUMERAL]
    symbols = [g for g in infos if g.category == GlyphCategory.SYMBOL]

    assert len(uppers) == 26
    assert len(lowers) == 26
    assert len(numerals) == 10
    assert len(symbols) == 19


def test_all_strokes_have_at_least_two_points():
    for char in GLYPHS:
        strokes = get_glyph_strokes(char)
        assert len(strokes) >= 1
        for stroke in strokes:
            assert len(stroke.points) >= 2


def test_get_glyph_info():
    info_a = get_glyph_info("A")
    assert info_a.character == "A"
    assert info_a.category == GlyphCategory.UPPERCASE
    assert info_a.unicode_hex == "U+0041"
    assert info_a.safe_name == "upper_A"
    assert info_a.stroke_count == 2

    info_qmark = get_glyph_info("?")
    assert info_qmark.safe_name == "sym_question"
    assert info_qmark.category == GlyphCategory.SYMBOL


def test_unknown_glyph_raises():
    with pytest.raises(KeyError):
        get_glyph_strokes("~")
    with pytest.raises(KeyError):
        get_glyph_info("~")
