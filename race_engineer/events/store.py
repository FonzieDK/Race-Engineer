from __future__ import annotations

import sqlite3
import time
from uuid import uuid4
from contextlib import closing
from pathlib import Path
from threading import Lock
from typing import Any


class EventStore:
    """Persistent storage for leaderboard events."""

    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self._active_session_key: str | None = None
        self._session_lock = Lock()
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path, timeout=10)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with closing(self._connect()) as connection:
            with connection:
                connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS events (
                        id TEXT PRIMARY KEY,
                        session_key TEXT,
                        type TEXT NOT NULL CHECK (type IN ('pos', 'swap', 'inc')),
                        car_number TEXT NOT NULL,
                        lap TEXT NOT NULL,
                        old_position INTEGER,
                        position INTEGER,
                        old_driver TEXT,
                        new_driver TEXT,
                        incident_points INTEGER,
                        incident_total INTEGER,
                        event_group TEXT,
                        session_num INTEGER,
                        session_time REAL,
                        description TEXT,
                        timestamp TEXT,
                        source TEXT,
                        created_at INTEGER NOT NULL
                    )
                    """
                )
                connection.execute(
                    "CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC)"
                )
                columns = {
                    row["name"] for row in connection.execute("PRAGMA table_info(events)").fetchall()
                }
                if "session_key" not in columns:
                    connection.execute("ALTER TABLE events ADD COLUMN session_key TEXT")
                if "old_driver" not in columns:
                    connection.execute("ALTER TABLE events ADD COLUMN old_driver TEXT")
                if "new_driver" not in columns:
                    connection.execute("ALTER TABLE events ADD COLUMN new_driver TEXT")
                if "incident_points" not in columns:
                    connection.execute("ALTER TABLE events ADD COLUMN incident_points INTEGER")
                if "incident_total" not in columns:
                    connection.execute("ALTER TABLE events ADD COLUMN incident_total INTEGER")
                if "event_group" not in columns:
                    connection.execute("ALTER TABLE events ADD COLUMN event_group TEXT")
                if "session_num" not in columns:
                    connection.execute("ALTER TABLE events ADD COLUMN session_num INTEGER")
                if "session_time" not in columns:
                    connection.execute("ALTER TABLE events ADD COLUMN session_time REAL")
                if "description" not in columns:
                    connection.execute("ALTER TABLE events ADD COLUMN description TEXT")
                if "timestamp" not in columns:
                    connection.execute("ALTER TABLE events ADD COLUMN timestamp TEXT")
                if "source" not in columns:
                    connection.execute("ALTER TABLE events ADD COLUMN source TEXT")
                connection.execute(
                    """
                    CREATE INDEX IF NOT EXISTS idx_events_session_created_at
                    ON events(session_key, created_at DESC)
                    """
                )
                connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS pit_history (
                        session_key TEXT NOT NULL,
                        car_idx INTEGER NOT NULL,
                        last_pit_lap INTEGER NOT NULL,
                        last_pit_duration REAL,
                        PRIMARY KEY (session_key, car_idx)
                    )
                    """
                )
                connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS fallback_session (
                        singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
                        session_id TEXT NOT NULL,
                        session_num INTEGER NOT NULL,
                        last_session_time REAL,
                        race_started INTEGER NOT NULL DEFAULT 0,
                        updated_at INTEGER NOT NULL
                    )
                    """
                )
                pit_history_columns = {
                    row["name"]
                    for row in connection.execute("PRAGMA table_info(pit_history)").fetchall()
                }
                if "last_pit_duration" not in pit_history_columns:
                    connection.execute(
                        "ALTER TABLE pit_history ADD COLUMN last_pit_duration REAL"
                    )

    def activate_session(self, session_key: str) -> None:
        """Mark a session active without deleting archived race history."""
        normalized_key = str(session_key).strip()
        if not normalized_key:
            return

        with self._session_lock:
            self._active_session_key = normalized_key

    def resolve_fallback_session_id(
        self,
        session_num: int,
        session_time: float | None,
        race_started: bool,
        is_replay: bool = False,
    ) -> str:
        """Return one persistent id when iRacing omits its session ids.

        Electron and the detached event collector run in separate processes.
        Keeping this identity in SQLite makes both processes, and later app
        launches, attach events to the same race.
        """
        normalized_num = int(session_num)
        normalized_time = self._optional_float(session_time)
        now = int(time.time() * 1000)
        with self._session_lock:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                row = connection.execute(
                    "SELECT * FROM fallback_session WHERE singleton = 1"
                ).fetchone()
                if row is None:
                    # Adopt the newest legacy local session so events already
                    # recorded before this migration remain visible.
                    suffix = f":{normalized_num}"
                    legacy = connection.execute(
                        """
                        SELECT session_key
                        FROM events
                        WHERE session_key LIKE 'local-%'
                          AND substr(session_key, -?) = ?
                        GROUP BY session_key
                        ORDER BY MAX(created_at) DESC
                        LIMIT 1
                        """,
                        (len(suffix), suffix),
                    ).fetchone()
                    session_id = (
                        str(legacy["session_key"]).rsplit(":", 1)[0]
                        if legacy is not None
                        else f"local-{uuid4().hex}"
                    )
                else:
                    session_id = str(row["session_id"])

                previous_time = self._optional_float(
                    row["last_session_time"] if row is not None else None
                )
                # SessionTime is monotonic during a live iRacing session.  A
                # substantial backwards jump therefore identifies a new race,
                # even when the collector attaches more than 30 seconds after
                # that race began.  Requiring the new value itself to be below
                # 30 seconds caused late connections to reuse the previous
                # race's fallback id and mix both event feeds.
                time_reset = (
                    normalized_time is not None
                    and previous_time is not None
                    and normalized_time + 30 < previous_time
                )
                if not is_replay and time_reset:
                    session_id = f"local-{uuid4().hex}"

                # Seeking a replay also moves SessionTime backwards, but must
                # neither start a new race nor erase the live high-water mark
                # used to recognise the next real race.
                stored_session_time = (
                    previous_time
                    if is_replay and previous_time is not None
                    else normalized_time
                )
                stored_race_started = (
                    int(row["race_started"])
                    if is_replay and row is not None
                    else int(race_started)
                )

                connection.execute(
                    """
                    INSERT INTO fallback_session
                        (singleton, session_id, session_num, last_session_time,
                         race_started, updated_at)
                    VALUES (1, ?, ?, ?, ?, ?)
                    ON CONFLICT(singleton) DO UPDATE SET
                        session_id = excluded.session_id,
                        session_num = excluded.session_num,
                        last_session_time = excluded.last_session_time,
                        race_started = excluded.race_started,
                        updated_at = excluded.updated_at
                    """,
                    (
                        session_id,
                        normalized_num,
                        stored_session_time,
                        stored_race_started,
                        now,
                    ),
                )
                connection.commit()
        return session_id

    def clear_session(self, session_key: str) -> None:
        """Remove recorded race data for one session without changing others."""
        normalized_key = str(session_key).strip()
        if not normalized_key:
            return
        with self._session_lock:
            with closing(self._connect()) as connection:
                with connection:
                    connection.execute(
                        "DELETE FROM events WHERE session_key = ?",
                        (normalized_key,),
                    )
                    connection.execute(
                        "DELETE FROM pit_history WHERE session_key = ?",
                        (normalized_key,),
                    )

    def get_last_pit_lap(self, session_key: str, car_idx: int) -> int | None:
        with closing(self._connect()) as connection:
            row = connection.execute(
                """
                SELECT last_pit_lap
                FROM pit_history
                WHERE session_key = ? AND car_idx = ?
                """,
                (session_key, car_idx),
            ).fetchone()
        return int(row["last_pit_lap"]) if row is not None else None

    def save_last_pit_lap(self, session_key: str, car_idx: int, lap: int) -> None:
        self.activate_session(session_key)
        with closing(self._connect()) as connection:
            with connection:
                connection.execute(
                    """
                    INSERT INTO pit_history (session_key, car_idx, last_pit_lap)
                    VALUES (?, ?, ?)
                    ON CONFLICT(session_key, car_idx)
                    DO UPDATE SET last_pit_lap = excluded.last_pit_lap
                    """,
                    (session_key, car_idx, lap),
                )

    def get_last_pit_duration(self, session_key: str, car_idx: int) -> float | None:
        with closing(self._connect()) as connection:
            row = connection.execute(
                """
                SELECT last_pit_duration
                FROM pit_history
                WHERE session_key = ? AND car_idx = ?
                """,
                (session_key, car_idx),
            ).fetchone()
        if row is None or row["last_pit_duration"] is None:
            return None
        return float(row["last_pit_duration"])

    def save_last_pit_duration(
        self,
        session_key: str,
        car_idx: int,
        lap: int,
        duration: float,
    ) -> None:
        self.activate_session(session_key)
        with closing(self._connect()) as connection:
            with connection:
                connection.execute(
                    """
                    INSERT INTO pit_history
                        (session_key, car_idx, last_pit_lap, last_pit_duration)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(session_key, car_idx)
                    DO UPDATE SET
                        last_pit_lap = excluded.last_pit_lap,
                        last_pit_duration = excluded.last_pit_duration
                    """,
                    (session_key, car_idx, lap, duration),
                )

    def add(self, event: dict[str, Any]) -> dict[str, Any]:
        event_type = str(event.get("type", "")).strip().lower()
        if event_type not in {"pos", "swap", "inc"}:
            raise ValueError("Event type must be pos, swap, or inc")

        event_id = str(event.get("id", "")).strip()
        if not event_id:
            raise ValueError("Event id is required")

        session_key = str(event.get("sessionKey", "")).strip()
        if not session_key:
            raise ValueError("Event sessionKey is required")
        self.activate_session(session_key)

        stored = {
            "id": event_id,
            "sessionKey": session_key,
            "type": event_type,
            "carNumber": str(event.get("carNumber", "--")),
            "lap": str(event.get("lap", "--")),
            "oldPosition": self._optional_int(event.get("oldPosition")),
            "position": self._optional_int(event.get("position")),
            "oldDriver": self._optional_text(event.get("oldDriver")),
            "newDriver": self._optional_text(event.get("newDriver")),
            "incidentPoints": self._optional_int(event.get("incidentPoints")),
            "incidentTotal": self._optional_int(event.get("incidentTotal")),
            "groupId": self._optional_text(event.get("groupId")),
            "sessionNum": self._optional_int(event.get("sessionNum")),
            "sessionTime": self._optional_float(event.get("sessionTime")),
            "description": self._optional_text(event.get("description")),
            "timestamp": self._optional_text(event.get("timestamp")),
            "source": self._optional_text(event.get("source")),
            "createdAt": self._optional_int(event.get("createdAt")) or int(time.time() * 1000),
        }

        with closing(self._connect()) as connection:
            with connection:
                connection.execute(
                    """
                    INSERT OR IGNORE INTO events
                        (id, session_key, type, car_number, lap, old_position, position,
                         old_driver, new_driver, incident_points, incident_total, event_group,
                         session_num, session_time, description, timestamp, source, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        stored["id"],
                        stored["sessionKey"],
                        stored["type"],
                        stored["carNumber"],
                        stored["lap"],
                        stored["oldPosition"],
                        stored["position"],
                        stored["oldDriver"],
                        stored["newDriver"],
                        stored["incidentPoints"],
                        stored["incidentTotal"],
                        stored["groupId"],
                        stored["sessionNum"],
                        stored["sessionTime"],
                        stored["description"],
                        stored["timestamp"],
                        stored["source"],
                        stored["createdAt"],
                    ),
                )
        return stored

    def all(self, session_key: str | None = None) -> list[dict[str, Any]]:
        with closing(self._connect()) as connection:
            if session_key is None:
                rows = connection.execute(
                    """
                    SELECT id, session_key, type, car_number, lap,
                           old_position, position, old_driver, new_driver,
                           incident_points, incident_total, event_group,
                           session_num, session_time, description, timestamp, source, created_at
                    FROM events
                    ORDER BY created_at DESC, rowid DESC
                    """
                ).fetchall()
            else:
                rows = connection.execute(
                    """
                    SELECT id, session_key, type, car_number, lap,
                           old_position, position, old_driver, new_driver,
                           incident_points, incident_total, event_group,
                           session_num, session_time, description, timestamp, source, created_at
                    FROM events
                    WHERE session_key = ?
                    ORDER BY created_at DESC, rowid DESC
                    """,
                    (session_key,),
                ).fetchall()

        return [
            {
                "id": row["id"],
                "sessionKey": row["session_key"],
                "raceId": row["session_key"],
                "type": row["type"],
                "carNumber": row["car_number"],
                "lap": row["lap"],
                "oldPosition": row["old_position"],
                "position": row["position"],
                "fromPosition": row["old_position"],
                "toPosition": row["position"],
                "oldDriver": row["old_driver"],
                "newDriver": row["new_driver"],
                "incidentPoints": row["incident_points"],
                "incidentTotal": row["incident_total"],
                "groupId": row["event_group"],
                "sessionNum": row["session_num"],
                "sessionTime": row["session_time"],
                "description": row["description"],
                "timestamp": row["timestamp"],
                "source": row["source"],
                "createdAt": row["created_at"],
            }
            for row in rows
        ]

    def has_equivalent(self, candidate: dict[str, Any]) -> bool:
        """Match imported and live events even when their source IDs differ."""
        session_key = str(candidate.get("sessionKey") or "").strip()
        event_type = str(candidate.get("type") or "").strip()
        car_number = str(candidate.get("carNumber") or "--")
        lap = str(candidate.get("lap") or "--")
        for event in self.all(session_key):
            if (
                event["type"] != event_type
                or event["carNumber"] != car_number
                or str(event["lap"]) != lap
            ):
                continue
            if event_type == "pos" and (
                event["oldPosition"] == candidate.get("oldPosition")
                and event["position"] == candidate.get("position")
            ):
                stored_time = self._optional_float(event.get("sessionTime"))
                candidate_time = self._optional_float(candidate.get("sessionTime"))
                if stored_time is None or candidate_time is None:
                    return True
                if abs(stored_time - candidate_time) <= 0.25:
                    return True
            if event_type == "swap" and (
                event["oldDriver"] == candidate.get("oldDriver")
                and event["newDriver"] == candidate.get("newDriver")
            ):
                return True
            if event_type == "inc":
                stored_time = self._optional_float(event.get("sessionTime"))
                candidate_time = self._optional_float(candidate.get("sessionTime"))
                if stored_time is not None and candidate_time is not None:
                    if abs(stored_time - candidate_time) <= 2.0:
                        return True
                elif event.get("incidentPoints") == candidate.get("incidentPoints"):
                    return True
        return False

    @staticmethod
    def _optional_int(value: Any) -> int | None:
        if value is None or value == "":
            return None
        return int(value)

    @staticmethod
    def _optional_text(value: Any) -> str | None:
        if value is None:
            return None
        text = str(value).strip()
        return text or None

    @staticmethod
    def _optional_float(value: Any) -> float | None:
        if value is None or value == "":
            return None
        return float(value)
