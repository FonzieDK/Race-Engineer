from __future__ import annotations

import time
from threading import Lock
from typing import Any

from event_store import EventStore
from race_event_tracker import RaceEventTracker


class ReplayEventScanner:
    """Optionally rebuild an empty event log by fast-forwarding a replay."""

    def __init__(
        self,
        store: EventStore,
        tracker: RaceEventTracker,
        scan_speed: int = 16,
        enabled: bool = False,
    ) -> None:
        self.store = store
        self.tracker = tracker
        self.scan_speed = max(2, min(16, int(scan_speed)))
        # Seeking a replay changes iRacing's playback state. Keep that behavior
        # opt-in so merely starting Race-Engineer can never pause or seek the sim.
        self.enabled = bool(enabled)
        self._lock = Lock()
        self._session_key: str | None = None
        self._status = "idle"
        self._target_time: float | None = None
        self._original_speed = 1
        self._commanded_at = 0.0
        self._attempted: set[str] = set()
        self._error: str | None = None

    def update(self, telemetry: dict[str, Any], reader: Any) -> dict[str, Any]:
        with self._lock:
            return self._update_locked(telemetry, reader)

    def _update_locked(self, telemetry: dict[str, Any], reader: Any) -> dict[str, Any]:
        session_key = str(telemetry.get("session_key") or "").strip()
        replay_time = self._number(telemetry.get("replay_session_time"))
        is_replay = telemetry.get("is_replay_playing") is True

        if not self.enabled:
            return {
                "status": "disabled",
                "progress": None,
                "target_time": None,
                "speed": None,
                "error": None,
            }

        if session_key != self._session_key:
            self._session_key = session_key or None
            self._status = "idle"
            self._target_time = None
            self._error = None

        if not session_key or not is_replay:
            return self._snapshot(replay_time)

        if (
            self._status == "idle"
            and session_key not in self._attempted
            and telemetry.get("race_started") is True
            and replay_time is not None
            and replay_time > 5
            and not self.store.all(session_key)
        ):
            self._attempted.add(session_key)
            self._target_time = replay_time
            self._original_speed = self._safe_speed(telemetry.get("replay_play_speed"))
            self._commanded_at = time.monotonic()
            self._error = None
            self.tracker.restart_current_race(session_key)
            if reader.start_race_event_scan(telemetry.get("session_num", 0), self.scan_speed):
                self._status = "seeking"
            else:
                self._status = "error"
                self._error = "iRacing rejected the replay scan command."
            return self._snapshot(replay_time)

        if self._status == "seeking":
            if replay_time is not None and self._target_time is not None and replay_time < self._target_time - 2:
                if reader.set_replay_play_speed(self.scan_speed):
                    self._status = "scanning"
                else:
                    self._status = "error"
                    self._error = "iRacing rejected the replay scan speed."
            elif time.monotonic() - self._commanded_at > 8:
                self._status = "error"
                self._error = "Replay did not seek to the start of the race."

        if (
            self._status == "scanning"
            and replay_time is not None
            and self._target_time is not None
            and replay_time >= self._target_time - 0.75
        ):
            reader.set_replay_play_speed(self._original_speed)
            self.tracker.reset_baseline()
            self._status = "complete"

        return self._snapshot(replay_time)

    def _snapshot(self, replay_time: float | None) -> dict[str, Any]:
        progress = None
        if self._target_time and replay_time is not None and self._status in {"seeking", "scanning"}:
            progress = max(0.0, min(1.0, replay_time / self._target_time))
        return {
            "status": self._status,
            "progress": progress,
            "target_time": self._target_time,
            "speed": self.scan_speed if self._status in {"seeking", "scanning"} else None,
            "error": self._error,
        }

    @staticmethod
    def _safe_speed(value: Any) -> int:
        try:
            speed = int(value)
        except (TypeError, ValueError):
            return 1
        return speed if -16 <= speed <= 16 else 1

    @staticmethod
    def _number(value: Any) -> float | None:
        try:
            return float(value) if value is not None else None
        except (TypeError, ValueError):
            return None
