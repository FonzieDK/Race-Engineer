#!/usr/bin/env python3
"""Packaged Python entry point for the server and background collector."""
from __future__ import annotations

import sys


def run() -> int:
    if "--collector" in sys.argv[1:]:
        from event_collector import run as run_collector

        return run_collector()

    from main import main as run_server

    run_server()
    return 0


if __name__ == "__main__":
    raise SystemExit(run())

