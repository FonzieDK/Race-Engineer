from __future__ import annotations

import hashlib
import json
import time
from typing import Any


def stable_event_id(event: dict[str, Any]) -> str:
    """Return the same id when history/live feeds describe the same event."""
    event_type = str(event.get("type") or "").lower()
    identity: dict[str, Any] = {
        "race": event.get("sessionKey") or event.get("raceId"),
        "car": str(event.get("carNumber") or "--"),
        "lap": str(event.get("lap") or "--"),
        "type": event_type,
    }
    if event_type == "pos":
        session_time = _normalized_session_time(event.get("sessionTime"))
        identity.update(
            fromPosition=event.get("oldPosition"),
            toPosition=event.get("position"),
            # A car can make the same position transition more than once on a
            # lap. Keep those as separate events while still generating the
            # same id for live and imported data describing the same moment.
            eventMoment=(
                session_time
                if session_time is not None
                else event.get("timestamp") or event.get("createdAt")
            ),
        )
    elif event_type == "swap":
        identity.update(oldDriver=event.get("oldDriver"), newDriver=event.get("newDriver"))
    elif event_type == "inc":
        identity.update(
            incidentPoints=event.get("incidentPoints"),
            incidentTotal=event.get("incidentTotal"),
            description=event.get("description"),
        )
    encoded = json.dumps(identity, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return f"event-{hashlib.sha256(encoded).hexdigest()[:24]}"


def _normalized_session_time(value: Any) -> float | None:
    try:
        return round(float(value), 3) if value is not None and value != "" else None
    except (TypeError, ValueError):
        return None


class EventReconstructor:
    """Shared state machine for chronological historical and live standings."""

    def __init__(self) -> None:
        self.positions: dict[str, int] = {}
        self.drivers: dict[str, tuple[str, str]] = {}
        self.incidents: dict[str, int] = {}

    def reset(self) -> None:
        self.positions = {}
        self.drivers = {}
        self.incidents = {}

    def process(self, snapshot: dict[str, Any], source: str) -> list[dict[str, Any]]:
        session_key = str(snapshot.get("session_key") or "").strip()
        standings = snapshot.get("standings")
        if not session_key or not isinstance(standings, list) or not standings:
            return []

        entries: dict[str, dict[str, Any]] = {}
        positions: dict[str, int] = {}
        drivers: dict[str, tuple[str, str]] = {}
        incidents: dict[str, int] = {}
        for entry in standings:
            if not isinstance(entry, dict):
                continue
            car_key = str(entry.get("car_idx", entry.get("car_number", "")))
            if not car_key:
                continue
            entries[car_key] = entry
            position = self._int(entry.get("position"))
            if position is not None and position > 0:
                positions[car_key] = position
            driver_name = str(entry.get("driver_name") or "").strip()
            if driver_name and driver_name != "Unknown driver":
                drivers[car_key] = (str(entry.get("driver_id") or driver_name), driver_name)
            incident_total = self._int(entry.get("incident_count"))
            if incident_total is not None and incident_total >= 0:
                incidents[car_key] = incident_total

        session_time = self._float(snapshot.get("event_session_time", snapshot.get("session_time")))
        created_at = self._int(snapshot.get("created_at")) or int(time.time() * 1000)
        timestamp = snapshot.get("timestamp") or time.strftime(
            "%Y-%m-%dT%H:%M:%SZ", time.gmtime(created_at / 1000)
        )
        common = {
            "sessionKey": session_key,
            "raceId": session_key,
            "sessionNum": self._int(snapshot.get("session_num")) or 0,
            "sessionTime": session_time,
            "timestamp": timestamp,
            "source": source,
            "createdAt": created_at,
        }

        previous_by_position = {position: car for car, position in self.positions.items()}
        groups: dict[str, str] = {}
        group_laps: dict[str, int | str] = {}
        for car_key, position in positions.items():
            old_position = self.positions.get(car_key)
            counterpart = previous_by_position.get(position)
            if (
                old_position is not None
                and old_position != position
                and counterpart
                and counterpart != car_key
                and positions.get(counterpart) == old_position
            ):
                cars = "-".join(sorted((car_key, counterpart)))
                pair_laps = (
                    self._lap(entries[car_key], snapshot),
                    self._lap(entries[counterpart], snapshot),
                )
                numeric_pair_laps = [lap for lap in pair_laps if isinstance(lap, int)]
                group_lap = max(numeric_pair_laps) if numeric_pair_laps else pair_laps[0]
                group_time = (
                    f"{session_time:.3f}"
                    if session_time is not None
                    else str(created_at)
                )
                group = f"{session_key}-pos-{group_lap}-{group_time}-{cars}"
                groups[car_key] = group
                groups[counterpart] = group
                group_laps[car_key] = group_lap
                group_laps[counterpart] = group_lap

        events: list[dict[str, Any]] = []
        for car_key, position in positions.items():
            old_position = self.positions.get(car_key)
            if old_position is None or old_position == position:
                continue
            event = {
                **common,
                "type": "pos",
                "groupId": groups.get(car_key),
                "carNumber": str(entries[car_key].get("car_number") or "--"),
                "lap": group_laps.get(car_key, self._lap(entries[car_key], snapshot)),
                "oldPosition": old_position,
                "position": position,
                "fromPosition": old_position,
                "toPosition": position,
            }
            event["id"] = stable_event_id(event)
            events.append(event)

        for car_key, driver in drivers.items():
            old_driver = self.drivers.get(car_key)
            if old_driver is None or old_driver[0] == driver[0]:
                continue
            event = {
                **common,
                "type": "swap",
                "carNumber": str(entries[car_key].get("car_number") or "--"),
                "lap": self._lap(entries[car_key], snapshot),
                "oldDriver": old_driver[1],
                "newDriver": driver[1],
            }
            event["id"] = stable_event_id(event)
            events.append(event)

        for car_key, incident_total in incidents.items():
            old_total = self.incidents.get(car_key)
            if old_total is None or incident_total <= old_total:
                continue
            event = {
                **common,
                "type": "inc",
                "carNumber": str(entries[car_key].get("car_number") or "--"),
                "lap": self._lap(entries[car_key], snapshot),
                "incidentPoints": incident_total - old_total,
                "incidentTotal": incident_total,
            }
            event["id"] = stable_event_id(event)
            events.append(event)

        self.positions, self.drivers, self.incidents = positions, drivers, incidents
        return events

    @staticmethod
    def _lap(entry: dict[str, Any], snapshot: dict[str, Any]) -> int | str:
        explicit = EventReconstructor._int(entry.get("lap"))
        if explicit is not None:
            return explicit
        completed = EventReconstructor._int(entry.get("laps_completed"))
        if completed is not None and completed >= 0:
            return completed + 1
        return EventReconstructor._int(snapshot.get("current_lap")) or "--"

    @staticmethod
    def _int(value: Any) -> int | None:
        try:
            return int(value) if value is not None and value != "" else None
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _float(value: Any) -> float | None:
        try:
            return float(value) if value is not None and value != "" else None
        except (TypeError, ValueError):
            return None
