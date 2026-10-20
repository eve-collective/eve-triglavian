"""Module entry point for python -m eve_triglavian."""

from __future__ import annotations

import sys

from eve_triglavian.cli import app

if __name__ == "__main__":
    if len(sys.argv) == 1:
        app(["build"])
    else:
        app()
