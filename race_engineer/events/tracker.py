from __future__ import annotations

import time
from threading import Lock
from typing import Any

from race_engineer.events.reconstructor import EventReconstructor, stable_event_id
from race_engineer.events.store import EventStore


class RaceEventTracker:
    """Turn consecutive telemetry standings into persistent race events."""

    def __init__(self, store: EventStore) -> None:
        self.store = store
        self._lock = Lock()
        self._session_key: str | None = None
        self._session_time: float | None = None
        self._reconstructor = EventReconstructor()
        self._physical_cars: dict[str, dict[str, Any]] = {}

    def reset_baseline(self) -> None:
        with self._lock:
            self._clear_baseline()

    def restart_current_race(self, session_key: str | None = None) -> None:
        """Clear stored/current data before rebuilding a replay from its start."""
        with self._lock:
            target_session_key = str(session_key or self._session_key or "").strip()
            if target_session_key:
                self.store.clear_session(target_session_key)
            self._clear_baseline()

    def process(self, telemetry: dict[str, Any] | None) -> list[dict[str, Any]]:
        if not isinstance(telemetry, dict):
            return []

        session_key = str(telemetry.get("session_key") or "").strip()
        if not session_key or telemetry.get("race_started") is not True:
            with self._lock:
                self._clear_baseline()
            return []

        standings = telemetry.get("standings")
        if not isinstance(standings, list) or not standings:
            return []

        session_time = self._event_session_time(telemetry)
        is_replay = self._is_historical_replay(telemetry)

        with self._lock:
            if is_replay:
                # Replaying an event must never create a second generation of
                # position-change events. Those entries would point at the
                # replay viewing time rather than the original live capture.
                if session_key != self._session_key:
                    self.store.activate_session(session_key)
                    self._session_key = session_key
                self._clear_baseline()
                return []

            if session_key != self._session_key:
                self.store.activate_session(session_key)
                self._session_key = session_key
                self._clear_baseline()
            elif self._session_time is not None and session_time is not None:
                delta = session_time - self._session_time
                if delta < -0.25:
                    # Timeline seeks establish a fresh comparison point. The
                    # replay scanner explicitly clears storage before starting.
                    self._clear_baseline()

            normalized = dict(telemetry)
            normalized["event_session_time"] = session_time
            reconstructed = self._reconstructor.process(normalized, source="iracing-sdk")
            # Official iRacing positions can update at a scoring line after the
            # cars have already crossed. Keep swaps/incidents from that feed,
            # but create blue position events from physical track progression.
            events = [event for event in reconstructed if event["type"] != "pos"]
            events.extend(self._physical_overtakes(telemetry, session_time))

            for event in events:
                if not self.store.has_equivalent(event):
                    self.store.add(event)

            self._session_time = session_time
            return events

    def _clear_baseline(self) -> None:
        self._reconstructor.reset()
        self._physical_cars = {}
        self._session_time = None

    def _physical_overtakes(
        self,
        telemetry: dict[str, Any],
        session_time: float | None,
    ) -> list[dict[str, Any]]:
        if session_time is None:
            self._physical_cars = {}
            return []

        current: dict[str, dict[str, Any]] = {}
        for entry in telemetry.get("standings") or []:
            if not isinstance(entry, dict):
                continue
            car_key = str(entry.get("car_idx", entry.get("car_number", "")))
            laps = self._number(entry.get("laps_completed"))
            lap_dist = self._number(entry.get("lap_dist_pct"))
            position = self._optional_int(entry.get("position"))
            if not car_key or laps is None or lap_dist is None or position is None:
                continue
            current[car_key] = {
                "progress": laps + lap_dist,
                "position": position,
                "car_number": str(entry.get("car_number") or "--"),
                "class_id": entry.get("class_id"),
                "is_on_pit_road": entry.get("is_on_pit_road") is True,
                "lap": int(laps) + 1,
            }

        previous = self._physical_cars
        self._physical_cars = current
        if not previous:
            return []

        created_at = int(time.time() * 1000)
        events: list[dict[str, Any]] = []
        handled_pairs: set[tuple[str, str]] = set()
        for overtaker_key, overtaker in current.items():
            old_overtaker = previous.get(overtaker_key)
            if old_overtaker is None or overtaker["is_on_pit_road"]:
                continue
            for passed_key, passed in current.items():
                if passed_key == overtaker_key or passed["is_on_pit_road"]:
                    continue
                pair = tuple(sorted((overtaker_key, passed_key)))
                if pair in handled_pairs:
                    continue
                old_passed = previous.get(passed_key)
                if old_passed is None or old_passed["is_on_pit_road"]:
                    continue
                if overtaker.get("class_id") != passed.get("class_id"):
                    continue

                old_diff = old_overtaker["progress"] - old_passed["progress"]
                new_diff = overtaker["progress"] - passed["progress"]
                if old_diff >= 0 or new_diff <= 0:
                    continue
                if abs(new_diff) > 0.02:
                    continue
                if old_overtaker["position"] != old_passed["position"] + 1:
                    continue

                handled_pairs.add(pair)
                fraction = abs(old_diff) / (abs(old_diff) + abs(new_diff))
                previous_time = self._session_time if self._session_time is not None else session_time
                crossing_time = previous_time + (session_time - previous_time) * fraction
                group_id = (
                    f"{telemetry.get('session_key')}-track-pass-"
                    f"{crossing_time:.3f}-{'-'.join(pair)}"
                )
                common = {
                    "sessionKey": str(telemetry.get("session_key")),
                    "raceId": str(telemetry.get("session_key")),
                    "type": "pos",
                    "groupId": group_id,
                    "sessionNum": self._optional_int(telemetry.get("session_num")) or 0,
                    "sessionTime": crossing_time,
                    "timestamp": time.strftime(
                        "%Y-%m-%dT%H:%M:%SZ", time.gmtime(created_at / 1000)
                    ),
                    "source": "iracing-sdk-track-pass",
                    "createdAt": created_at,
                    "lap": max(overtaker["lap"], passed["lap"]),
                }
                gain = {
                    **common,
                    "carNumber": overtaker["car_number"],
                    "oldPosition": old_overtaker["position"],
                    "position": old_passed["position"],
                    "fromPosition": old_overtaker["position"],
                    "toPosition": old_passed["position"],
                }
                loss = {
                    **common,
                    "carNumber": passed["car_number"],
                    "oldPosition": old_passed["position"],
                    "position": old_overtaker["position"],
                    "fromPosition": old_passed["position"],
                    "toPosition": old_overtaker["position"],
                }
                gain["id"] = stable_event_id(gain)
                loss["id"] = stable_event_id(loss)
                events.extend((gain, loss))

        return events

    @staticmethod
    def _event_session_time(telemetry: dict[str, Any]) -> float | None:
        historical_replay = RaceEventTracker._is_historical_replay(telemetry)
        value = (
            telemetry.get("replay_session_time")
            if historical_replay
            else telemetry.get("session_time")
        )
        try:
            return float(value) if value is not None else None
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _is_historical_replay(telemetry: dict[str, Any]) -> bool:
        if telemetry.get("is_replay_playing") is not True:
            return False
        session_time = RaceEventTracker._number(telemetry.get("session_time"))
        replay_time = RaceEventTracker._number(telemetry.get("replay_session_time"))
        if session_time is None or replay_time is None:
            return True
        # Spectator/broadcast mode reports replay playback even at the live
        # edge. A small buffer delay is live; a larger offset is historical.
        return session_time - replay_time > 2.0

    @staticmethod
    def _optional_int(value: Any) -> int | None:
        try:
            return int(value) if value is not None and value != "" else None
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _number(value: Any) -> float | None:
        try:
            return float(value) if value is not None else None
        except (TypeError, ValueError):
            return None
