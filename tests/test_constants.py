"""Tests for constants and equilateral lattice coordinate resolution."""

import pytest

from eve_triglavian.constants import DEFAULT_STROKE_WIDTH, SAFE_NAMES, UPM, P, pt


def test_canvas_metrics():
    assert UPM == 1000
    assert DEFAULT_STROKE_WIDTH == 44.0


def test_named_points_validity():
    assert len(P) > 0
    for _name, coords in P.items():
        assert len(coords) == 2
        x, y = coords
        assert 0 <= x <= UPM
        assert 0 <= y <= UPM


def test_pt_resolution():
    assert pt("T") == (500.0, 180.0)
    assert pt("BL") == (220.0, 665.0)
    assert pt((123, 456)) == (123.0, 456.0)
    assert pt((12.5, 34.5)) == (12.5, 34.5)


def test_pt_unknown_name_raises():
    with pytest.raises(KeyError, match="Unknown grid point"):
        pt("NONEXISTENT_POINT")


def test_safe_names_non_empty():
    assert len(SAFE_NAMES) >= 19
    assert SAFE_NAMES["?"] == "question"
    assert SAFE_NAMES["+"] == "plus"
