#!/usr/bin/env python3
"""Persistent iRacing event collector, independent of the Race-Engineer window."""
from __future__ import annotations

import atexit
import os
import time
from race_engineer.events.store import EventStore
from race_engineer.events.tracker import RaceEventTracker
from race_engineer.paths import COLLECTOR_LOCK_PATH, DATABASE_PATH
from race_engineer.telemetry import TelemetryReader


LOCK_PATH = COLLECTOR_LOCK_PATH


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

    store = EventStore(DATABASE_PATH)
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
