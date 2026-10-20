"""Geometric constants, equilateral lattice definitions, and naming maps."""

from __future__ import annotations

from typing import Union

# Standard Canvas & Typography Metrics (UPM = Units Per Em)
UPM: int = 1000
DEFAULT_STROKE_WIDTH: float = 44.0

# Key named coordinates on the 60-degree equilateral grid (SVG Y-down: 0=top, 1000=bottom)
P: dict[str, tuple[int, int]] = {
    # Primary Triangle (Apex Up)
    "T": (500, 180),  # Top Apex
    "BL": (220, 665),  # Bottom-Left Vertex
    "BR": (780, 665),  # Bottom-Right Vertex
    "BC": (500, 665),  # Bottom-Center
    "ML": (360, 422),  # Mid-Left Edge
    "MR": (640, 422),  # Mid-Right Edge
    "C": (500, 480),  # Center
    # Inner Nested Triangle (Apex Up)
    "iT": (500, 310),
    "iBL": (335, 595),
    "iBR": (665, 595),
    "iML": (417, 452),
    "iMR": (582, 452),
    # Inverted Triangle (Apex Down)
    "B": (500, 725),  # Bottom Apex
    "TL": (220, 240),  # Top-Left Vertex
    "TR": (780, 240),  # Top-Right Vertex
    "TC": (500, 240),  # Top-Center
    "vML": (360, 482),  # Inverted Mid-Left
    "vMR": (640, 482),  # Inverted Mid-Right
    # Inner Inverted Triangle (Apex Down)
    "iB": (500, 595),
    "iTL": (335, 310),
    "iTR": (665, 310),
}

# Safe filename mapping for non-alphanumeric filesystem symbols
SAFE_NAMES: dict[str, str] = {
    "?": "question",
    "!": "exclam",
    ".": "period",
    ",": "comma",
    ":": "colon",
    ";": "semicolon",
    '"': "quotedbl",
    "'": "quotesingle",
    "/": "slash",
    "\\": "backslash",
    "@": "at",
    "#": "numbersign",
    "%": "percent",
    "^": "asciicircum",
    "&": "ampersand",
    "*": "asterisk",
    "-": "hyphen",
    "+": "plus",
    "=": "equal",
}

PointLike = Union[str, tuple[int, int], tuple[float, float]]


def pt(v: PointLike) -> tuple[float, float]:
    """Resolve a named grid point or return raw numeric coordinate tuple.

    Args:
        v: Either a named coordinate string (e.g. 'T', 'BL') or an (x, y) numeric tuple.

    Returns:
        A tuple of (x, y) float coordinates.

    Raises:
        KeyError: If the point name is not defined in the lattice grid `P`.
    """
    if isinstance(v, str):
        if v not in P:
            raise KeyError(f"Unknown grid point '{v}'. Defined points: {list(P.keys())}")
        coords = P[v]
        return float(coords[0]), float(coords[1])
    return float(v[0]), float(v[1])
