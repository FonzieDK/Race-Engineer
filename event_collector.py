#!/usr/bin/env python3
"""Persistent iRacing event collector, independent of the Pit Wall window."""
from __future__ import annotations

import atexit
import os
import time
from pathlib import Path

from event_store import EventStore
from race_event_tracker import RaceEventTracker
from telemetry import TelemetryReader


BASE_DIR = Path(__file__).resolve().parent
LOCK_PATH = BASE_DIR / "sql" / "event-collector.lock"


def acquire_single_instance():
    LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    handle = open(LOCK_PATH, "a+b")
    handle.seek(0)
    if handle.read(1) == b"":
        handle.seek(0)
        handle.write(b"0")
        handle.flush()
    handle.seek(0)
    try:
        if os.name == "nt":
            import msvcrt
            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        handle.close()
        return None
    atexit.register(handle.close)
    return handle


def run() -> int:
    lock = acquire_single_instance()
    if lock is None:
        return 0

    store = EventStore(BASE_DIR / "sql" / "events.db")
    tracker = RaceEventTracker(store)
    while True:
        reader = TelemetryReader(store)
        if not reader.connect():
            time.sleep(2)
            continue
        try:
            while reader.is_connected():
                snapshot = reader.get_telemetry_data()
                if snapshot:
                    tracker.process(snapshot)
                time.sleep(0.1)
        except Exception:
            tracker.reset_baseline()
            time.sleep(1)
        finally:
            try:
                reader.disconnect()
            except Exception:
                pass


if __name__ == "__main__":
    raise SystemExit(run())
