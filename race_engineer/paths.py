"""Shared resource and writable-data paths for development and packaged builds."""
from __future__ import annotations

import os
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parent.parent
RESOURCE_DIR = Path(os.environ.get("RACE_ENGINEER_RESOURCE_DIR", PROJECT_DIR)).resolve()
DATA_DIR = Path(os.environ.get("RACE_ENGINEER_DATA_DIR", RESOURCE_DIR)).resolve()
CONFIG_PATH = DATA_DIR / "config.json"
DATABASE_PATH = DATA_DIR / "sql" / "events.db"
COLLECTOR_LOCK_PATH = DATA_DIR / "sql" / "event-collector.lock"
WEB_DIR = RESOURCE_DIR / "web"
TRACKS_PATH = RESOURCE_DIR / "tracks.json"
