from __future__ import annotations

import re
import time
from datetime import datetime, timezone
from typing import Any

from race_engineer.events.reconstructor import EventReconstructor, stable_event_id


class IracingResultsImporter:
    """Convert iRacing Results API exports into the local event format."""

    def build_events(self, payload: dict[str, Any]) -> tuple[str, list[dict[str, Any]]]:
        if not isinstance(payload, dict):
            raise ValueError("iRacing result data must be a JSON object")

        results = self._object(payload, "results", "result", "results_get")
        event_log = self._array(payload, "event_log", "eventLog", "events")
        lap_chart = self._array(payload, "lap_chart_data", "lapChartData", "lap_chart", "laps")
        if results is payload and not event_log and not lap_chart:
            event_log = self._array(results, "event_log", "eventLog")
            lap_chart = self._array(results, "lap_chart_data", "lapChartData", "lap_chart")

        subsession_id = self._first_int(
            results.get("subsession_id"),
            payload.get("subsession_id"),
            self._first_value(event_log, "subsession_id"),
        )
        if not subsession_id:
            raise ValueError("The JSON file does not contain an iRacing subsession_id")

        simsession_number = self._first_int(
            payload.get("simsession_number"),
            self._first_value(event_log, "simsession_number"),
            0,
        ) or 0
        session_key = f"{subsession_id}:{simsession_number}"
        start_time_ms = self._start_time_ms(results.get("start_time"))
        identity_map = self._identity_map(results, lap_chart)

        lap_events = self._lap_chart_events(
            lap_chart,
            subsession_id,
            simsession_number,
            session_key,
            start_time_ms,
        )
        log_events = self._event_log_events(
            event_log,
            identity_map,
            subsession_id,
            simsession_number,
            session_key,
            start_time_ms,
        )
        detailed_incidents = {
            (event.get("carNumber"), str(event.get("lap")))
            for event in log_events if event.get("type") == "inc" and event.get("carNumber") != "--"
        }
        events = [
            event for event in lap_events
            if event.get("type") != "inc"
            or (event.get("carNumber"), str(event.get("lap"))) not in detailed_incidents
        ]
        events.extend(log_events)
        return session_key, self._deduplicate(events)

    def _lap_chart_events(
        self,
        rows: list[dict[str, Any]],
        subsession_id: int,
        simsession_number: int,
        session_key: str,
        start_time_ms: int,
    ) -> list[dict[str, Any]]:
        events: list[dict[str, Any]] = []
        ordered = sorted(
            (row for row in rows if isinstance(row, dict)),
            key=lambda row: (
                self._int(row.get("session_time"), 0),
                self._int(row.get("lap_number"), 0),
                self._identity(row),
            ),
        )
        groups: dict[tuple[float, int], list[dict[str, Any]]] = {}
        for row in ordered:
            key = (self._session_seconds(row.get("session_time")), self._int(row.get("lap_number"), 0))
            groups.setdefault(key, []).append(row)

        reconstructor = EventReconstructor()
        for (session_seconds, lap), group in sorted(groups.items()):
            created_at = start_time_ms + round(session_seconds * 1000)
            snapshot = {
                "session_key": session_key,
                "session_num": simsession_number,
                "session_time": session_seconds,
                "created_at": created_at,
                "current_lap": lap,
                "standings": [{
                    "car_idx": self._car_key(row),
                    "car_number": str(row.get("car_number") or "--"),
                    "position": self._positive_int(row.get("lap_position")),
                    "driver_id": row.get("cust_id"),
                    "driver_name": str(row.get("display_name") or row.get("name") or "").strip(),
                    "lap": lap,
                } for row in group],
            }
            reconstructed = reconstructor.process(snapshot, source="iracing-results-lap-chart")
            for event in reconstructed:
                if event["type"] == "pos":
                    event["description"] = f"P{event['oldPosition']} → P{event['position']}"
                elif event["type"] == "swap":
                    event["description"] = f"{event['oldDriver']} → {event['newDriver']}"
            events.extend(reconstructed)

            for row in group:
                if row.get("incident") is not True:
                    continue
                event = {
                    "sessionKey": session_key,
                    "raceId": session_key,
                    "type": "inc",
                    "carNumber": str(row.get("car_number") or "--"),
                    "lap": lap,
                    "description": self._lap_event_description(row),
                    "sessionNum": simsession_number,
                    "sessionTime": session_seconds,
                    "source": "iracing-results-lap-chart",
                    "timestamp": self._iso_timestamp(created_at),
                    "createdAt": created_at,
                }
                event["id"] = stable_event_id(event)
                events.append(event)
        return events

    def _event_log_events(
        self,
        rows: list[dict[str, Any]],
        identities: dict[str, str],
        subsession_id: int,
        simsession_number: int,
        session_key: str,
        start_time_ms: int,
    ) -> list[dict[str, Any]]:
        events: list[dict[str, Any]] = []
        for index, row in enumerate(rows):
            if not isinstance(row, dict):
                continue
            text = " · ".join(
                part for part in (
                    str(row.get("description") or "").strip(),
                    str(row.get("message") or "").strip(),
                ) if part
            )
            lowered = text.casefold()
            if not any(word in lowered for word in (
                "incident", "contact", "off track", "loss of control", "penalty", "disqual"
            )):
                continue
            sequence = self._int(row.get("event_seq"), index)
            lap = self._int(row.get("lap_number"), 0)
            session_seconds = self._session_seconds(row.get("session_time"))
            identity = str(row.get("group_id") or row.get("cust_id") or "")
            car_number = identities.get(identity, "--")
            points_match = re.search(r"(?<!\d)(\d+)\s*x\b", text, re.IGNORECASE)
            incident_points = int(points_match.group(1)) if points_match else None
            created_at = start_time_ms + round(session_seconds * 1000)
            events.append({
                "id": f"iracing-{subsession_id}-{simsession_number}-log-{sequence}",
                "sessionKey": session_key,
                "raceId": session_key,
                "type": "inc",
                "carNumber": car_number,
                "lap": lap,
                "incidentPoints": incident_points,
                "description": text or "iRacing race-control event",
                "sessionNum": simsession_number,
                "sessionTime": session_seconds,
                "timestamp": self._iso_timestamp(created_at),
                "source": "iracing-results-event-log",
                "createdAt": created_at,
            })
        return events

    @staticmethod
    def _identity_map(results: dict[str, Any], lap_chart: list[dict[str, Any]]) -> dict[str, str]:
        identities: dict[str, str] = {}
        for row in lap_chart:
            if not isinstance(row, dict):
                continue
            number = str(row.get("car_number") or "").strip()
            if number:
                for key in (row.get("group_id"), row.get("cust_id")):
                    if key is not None:
                        identities[str(key)] = number
        for session in results.get("session_results") or []:
            if not isinstance(session, dict):
                continue
            for row in session.get("results") or []:
                if not isinstance(row, dict):
                    continue
                number = str((row.get("livery") or {}).get("car_number") or "").strip()
                if not number:
                    continue
                for key in (row.get("team_id"), row.get("cust_id")):
                    if key is not None:
                        identities[str(key)] = number
        return identities

    @staticmethod
    def _deduplicate(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
        unique: dict[tuple[Any, ...], dict[str, Any]] = {}
        for event in events:
            key = (
                event.get("type"), event.get("carNumber"), str(event.get("lap")),
                event.get("oldPosition"), event.get("position"),
                event.get("oldDriver"), event.get("newDriver"),
                round(float(event.get("sessionTime") or 0), 1),
            )
            existing = unique.get(key)
            if existing and str(existing.get("description", "")).startswith("iRacing"):
                unique[key] = event
            elif not existing:
                unique[key] = event
        return sorted(unique.values(), key=lambda event: event.get("createdAt", 0), reverse=True)

    @staticmethod
    def _object(payload: dict[str, Any], *names: str) -> dict[str, Any]:
        for name in names:
            value = payload.get(name)
            if isinstance(value, dict):
                return value
        return payload

    @staticmethod
    def _array(payload: dict[str, Any], *names: str) -> list[dict[str, Any]]:
        for name in names:
            value = payload.get(name)
            if isinstance(value, list):
                return value
        return []

    @staticmethod
    def _first_value(rows: list[dict[str, Any]], name: str) -> Any:
        return next((row.get(name) for row in rows if isinstance(row, dict) and row.get(name) is not None), None)

    @classmethod
    def _first_int(cls, *values: Any) -> int | None:
        for value in values:
            parsed = cls._positive_int(value)
            if parsed is not None:
                return parsed
        return None

    @staticmethod
    def _int(value: Any, default: int) -> int:
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _positive_int(value: Any) -> int | None:
        try:
            parsed = int(value)
            return parsed if parsed >= 0 else None
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _car_key(row: dict[str, Any]) -> str:
        return str(row.get("group_id") or row.get("car_number") or row.get("cust_id") or "unknown")

    @staticmethod
    def _identity(row: dict[str, Any]) -> str:
        return str(row.get("group_id") or row.get("cust_id") or row.get("car_number") or "")

    @staticmethod
    def _session_seconds(value: Any) -> float:
        try:
            parsed = float(value or 0)
        except (TypeError, ValueError):
            return 0.0
        # Results API time values are normally stored in 1/10,000 seconds.
        return parsed / 10000.0 if abs(parsed) >= 10000 else parsed

    @staticmethod
    def _start_time_ms(value: Any) -> int:
        if isinstance(value, str) and value.strip():
            try:
                return round(datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp() * 1000)
            except ValueError:
                pass
        return int(time.time() * 1000)

    @staticmethod
    def _iso_timestamp(value_ms: int) -> str:
        return datetime.fromtimestamp(value_ms / 1000, timezone.utc).isoformat().replace("+00:00", "Z")

    @staticmethod
    def _lap_event_description(row: dict[str, Any]) -> str:
        details = [str(value).strip() for value in (row.get("lap_events") or []) if str(value).strip()]
        return " · ".join(details) if details else "Incident registreret af iRacing"
