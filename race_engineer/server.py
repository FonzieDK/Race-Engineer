#!/usr/bin/env python3
"""
Race-Engineer local web server.
Serves telemetry on localhost for a browser or Electron shell.
"""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass, field
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import socket
from pathlib import Path
from queue import Empty, Full, Queue
from threading import Event, Lock, Thread
from typing import Any
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

from race_engineer.events.replay_scanner import ReplayEventScanner
from race_engineer.events.results import IracingResultsImporter
from race_engineer.events.store import EventStore
from race_engineer.events.tracker import RaceEventTracker
from race_engineer.paths import CONFIG_PATH, DATABASE_PATH, RESOURCE_DIR, TRACKS_PATH, WEB_DIR
from race_engineer.telemetry import TelemetryReader


BASE_DIR = RESOURCE_DIR
EVENT_STORE = EventStore(DATABASE_PATH)
IRACING_RESULTS_IMPORTER = IracingResultsImporter()
RACE_EVENT_TRACKER = RaceEventTracker(EVENT_STORE)
REPLAY_EVENT_SCANNER = ReplayEventScanner(
    EVENT_STORE,
    RACE_EVENT_TRACKER,
    # Race-Engineer must never seek, stop, or change replay speed automatically.
    # Historical gaps are handled by the detached collector/results import.
    enabled=False,
)
REFRESH_RATES_HZ = (10, 30, 60)
IRACING_TRACK_MAP_BASE = "https://members-assets.iracing.com/public/track-maps"
_official_track_svg_cache: dict[tuple[int, str], str | None] = {}
_official_track_svg_cache_lock = Lock()


def _track_slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def _track_compact(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def _find_iracing_track_folder(track_internal_name: str) -> str | None:
    """Match WeekendInfo.TrackName to an installed iRacing track directory."""
    roots = [
        Path(r"C:\Program Files (x86)\iRacing\tracks"),
        Path(r"C:\Program Files\iRacing\tracks"),
    ]
    compact_name = _track_compact(track_internal_name)
    candidates: list[str] = []
    for root in roots:
        if not root.is_dir():
            continue
        try:
            candidates.extend(path.name for path in root.iterdir() if path.is_dir())
        except OSError:
            continue

    matches = [
        folder for folder in candidates
        if _track_compact(folder) and _track_compact(folder) in compact_name
    ]
    if not matches:
        return None
    return max(matches, key=lambda folder: len(_track_compact(folder)))


def _fetch_text(url: str, timeout: float = 4.0) -> str:
    request = Request(url, headers={"User-Agent": "Race-Engineer/1.0"})
    with urlopen(request, timeout=timeout) as response:
        content_type = response.headers.get("Content-Type", "")
        if "svg" not in content_type.lower():
            raise ValueError(f"Unexpected track-map content type: {content_type}")
        return response.read(2_000_000).decode("utf-8")


def _svg_view_box(svg: str) -> str | None:
    match = re.search(r'\bviewBox\s*=\s*["\']([^"\']+)["\']', svg, re.IGNORECASE)
    return match.group(1).strip() if match else None


def _svg_body(svg: str) -> str:
    match = re.search(r"<svg\b[^>]*>(.*)</svg\s*>", svg, re.IGNORECASE | re.DOTALL)
    if not match:
        raise ValueError("Invalid SVG document")
    body = match.group(1)
    # Official assets are trusted, but scripts and external references do not
    # belong in the dashboard document.
    body = re.sub(r"<script\b[^>]*>.*?</script\s*>", "", body, flags=re.IGNORECASE | re.DOTALL)
    body = re.sub(r"<style\b[^>]*>.*?</style\s*>", "", body, flags=re.IGNORECASE | re.DOTALL)
    body = re.sub(r'''\s(?:class|style|fill)\s*=\s*["'][^"']*["']''', "", body, flags=re.IGNORECASE)
    body = re.sub(r'''\s(?:href|xlink:href)\s*=\s*["']https?://[^"']*["']''', "", body, flags=re.IGNORECASE)
    return body


def _closed_track_paths(svg: str) -> list[str]:
    match = re.search(r'<path\b[^>]*\bd\s*=\s*["\']([^"\']+)["\']', svg, re.IGNORECASE | re.DOTALL)
    if not match:
        return []
    path_data = match.group(1).strip()
    closed = re.findall(r"[mM].*?[zZ]", path_data, re.DOTALL)
    return [item.strip() for item in closed] or [path_data]


def build_official_track_svg(track_id: Any, track_internal_name: Any) -> str | None:
    """Fetch and combine the public SVG layers used by iRacing's own track map."""
    try:
        normalized_id = int(track_id)
    except (TypeError, ValueError):
        return None
    if normalized_id <= 0 or not isinstance(track_internal_name, str):
        return None

    internal_name = track_internal_name.strip()
    folder = _find_iracing_track_folder(internal_name)
    if not folder:
        return None

    cache_key = (normalized_id, internal_name.lower())
    with _official_track_svg_cache_lock:
        if cache_key in _official_track_svg_cache:
            return _official_track_svg_cache[cache_key]

    map_folder = f"{normalized_id}-{_track_slug(internal_name)}"
    base_url = f"{IRACING_TRACK_MAP_BASE}/tracks_{folder}/{map_folder}"
    try:
        active = _fetch_text(f"{base_url}/active.svg")
        view_box = _svg_view_box(active)
        track_paths = _closed_track_paths(active)
        track_path = track_paths[0] if track_paths else None
        inner_track_path = track_paths[1] if len(track_paths) > 1 else None
        if not view_box or not track_path:
            raise ValueError("Official active track layer has no usable path")

        layers: list[tuple[str, str, str, str]] = []
        for filename, layer_id, opacity, color in (
            ("inactive.svg", "track-inactive-layer", "0.10", "#8da0ad"),
            ("pitroad.svg", "track-pitroad-layer", "0.48", "#ed4a55"),
            ("active.svg", "track-active-layer", "0.24", "#ffffff"),
            ("start-finish.svg", "track-start-finish-layer", "0.78", "#ffffff"),
            ("turns.svg", "track-turns-layer", "0.46", "#dce7ee"),
        ):
            try:
                source = active if filename == "active.svg" else _fetch_text(f"{base_url}/{filename}")
                if _svg_view_box(source) != view_box:
                    continue
                layers.append((layer_id, opacity, color, _svg_body(source)))
            except Exception:
                # A few older layouts do not supply every optional layer.
                continue

        layer_markup = "\n".join(
            f'<g id="{layer_id}" opacity="{opacity}" fill="{color}">{body}</g>'
            for layer_id, opacity, color, body in layers
        )
        svg_content = f'''<svg id="track-map" viewBox="{view_box}" class="trackmap-svg official-track-map" aria-label="iRacing track map" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow"><feGaussianBlur stdDeviation="10" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  {layer_markup}
  <path id="track-path" d="{track_path}" fill="none" stroke="transparent" stroke-width="1"/>
  {f'<path id="track-path-inner" d="{inner_track_path}" fill="none" stroke="transparent" stroke-width="1"/>' if inner_track_path else ''}
  <g id="track-map-cars"></g>
</svg>'''
    except Exception as error:
        print(f"Unable to load official iRacing track map {normalized_id}: {error}")
        svg_content = None

    with _official_track_svg_cache_lock:
        _official_track_svg_cache[cache_key] = svg_content
    return svg_content


@dataclass
class AppState:
    connected: bool = False
    telemetry: dict[str, Any] | None = None
    alerts: list[str] = field(default_factory=list)
    updated_at: float | None = None
    status: str = "Starting"
    error: str | None = None


state = AppState()
state_lock = Lock()
subscribers: list[Queue[str]] = []
subscribers_lock = Lock()
telemetry_reader: TelemetryReader | None = None
config_lock = Lock()


def load_config() -> dict[str, Any]:
    with open(CONFIG_PATH, "r", encoding="utf-8") as config_file:
        return json.load(config_file)


runtime_config = load_config()


def refresh_interval_seconds() -> float:
    with config_lock:
        return float(runtime_config.get("refresh_rate", 1 / 30))


def set_refresh_rate(hz: int) -> None:
    if hz not in REFRESH_RATES_HZ:
        raise ValueError("Refresh rate must be 10, 30 or 60 Hz")

    interval_seconds = 1 / hz
    interval_ms = round(1000 / hz)
    with config_lock:
        runtime_config["refresh_rate"] = interval_seconds
        runtime_config["ui_refresh_rate_ms"] = interval_ms
        config_path = CONFIG_PATH
        temporary_path = config_path.with_suffix(".json.tmp")
        temporary_path.write_text(
            json.dumps(runtime_config, indent=4) + "\n",
            encoding="utf-8",
        )
        temporary_path.replace(config_path)


def build_snapshot() -> dict[str, Any]:
    with config_lock:
        ui_refresh_rate_ms = int(runtime_config.get("ui_refresh_rate_ms", 33))
        refresh_rate_hz = min(REFRESH_RATES_HZ, key=lambda hz: abs((1000 / hz) - ui_refresh_rate_ms))
    with state_lock:
        return {
            "connected": state.connected,
            "telemetry": state.telemetry,
            "alerts": list(state.alerts),
            "updated_at": state.updated_at,
            "status": state.status,
            "error": state.error,
            "ui_refresh_rate_ms": ui_refresh_rate_ms,
            "refresh_rate_hz": refresh_rate_hz,
        }


def current_race_session_key() -> str | None:
    """Return the active race key only after this race has started."""
    with state_lock:
        telemetry = state.telemetry or {}
        if telemetry.get("race_started") is not True:
            return None
        session_key = str(telemetry.get("session_key") or "").strip()
        return session_key or None


def snapshot_json() -> str:
    return json.dumps(build_snapshot())


def publish_snapshot() -> None:
    payload = snapshot_json()
    with subscribers_lock:
        for subscriber in subscribers:
            try:
                subscriber.put_nowait(payload)
            except Full:
                # Slow clients only need the newest telemetry frame. Replacing
                # the queued frame prevents latency and memory from accumulating.
                try:
                    subscriber.get_nowait()
                except Empty:
                    pass
                try:
                    subscriber.put_nowait(payload)
                except Full:
                    pass


def tire_wear_alert(tire_wear: dict[str, Any], threshold: float) -> str | None:
    for position, wear in tire_wear.items():
        if isinstance(wear, (int, float)) and wear > threshold:
            return f"Tire wear high on {position}: {wear:.2f}"
    return None


def telemetry_loop(stop_event: Event, config: dict[str, Any]) -> None:
    global telemetry_reader
    try:
        tire_wear_threshold = float(config.get("tire_wear_warning", 0.8))
    except (TypeError, ValueError):
        tire_wear_threshold = 0.8

    while not stop_event.is_set():
        telemetry = TelemetryReader(
            EVENT_STORE,
            pit_loss_seconds=config.get("pit_loss_seconds", 25.0),
            fuel_fill_rate_lps=config.get("fuel_fill_rate_lps", 2.5),
            tire_change_seconds=config.get("tire_change_seconds", 20.0),
        )
        telemetry_reader = telemetry
        with state_lock:
            state.connected = False
            state.telemetry = None
            state.alerts = []
            state.updated_at = None
            state.status = "Connecting to iRacing"
            state.error = None
        publish_snapshot()

        if not telemetry.connect():
            telemetry_reader = None
            with state_lock:
                state.connected = False
                state.telemetry = None
                state.alerts = []
                state.updated_at = None
                state.status = "Waiting for iRacing"
                state.error = "Failed to connect to iRacing. Make sure iRacing is running."
            publish_snapshot()
            stop_event.wait(refresh_interval_seconds())
            continue

        with state_lock:
            state.connected = True
            state.status = "Race-Engineer active"
            state.error = None
        publish_snapshot()

        try:
            while not stop_event.is_set() and telemetry.is_connected():
                try:
                    data = telemetry.get_telemetry_data()
                    if data:
                        RACE_EVENT_TRACKER.process(data)
                        data["event_scan"] = REPLAY_EVENT_SCANNER.update(data, telemetry)
                        alerts: list[str] = []

                        if not data.get("is_player_car"):
                            alerts.append(
                                "Fuel and tire telemetry are only available for your own car. "
                                "Focused car data uses iRacing's CarIdx fields."
                            )

                        tire_wear = data.get("tire_wear") or {}
                        if data.get("is_player_car") and all(
                            tire_wear.get(position) is not None for position in ("lf", "rf", "lr", "rr")
                        ):
                            tire_message = tire_wear_alert(
                                tire_wear,
                                tire_wear_threshold,
                            )
                            if tire_message:
                                alerts.append(tire_message)

                        with state_lock:
                            state.connected = True
                            state.telemetry = data
                            state.alerts = alerts
                            state.updated_at = time.time()
                            state.status = "Race-Engineer active"
                            state.error = None
                        publish_snapshot()
                except Exception as exc:
                    with state_lock:
                        state.error = f"Telemetry update failed: {exc}"
                        state.status = "Telemetry error"
                    publish_snapshot()

                stop_event.wait(refresh_interval_seconds())
        except KeyboardInterrupt:
            break
        finally:
            telemetry.disconnect()
            telemetry_reader = None
            with state_lock:
                state.connected = False
                # Never leave the last frame looking like current live data
                # after the SDK connection has gone away.
                state.telemetry = None
                state.alerts = []
                state.updated_at = None
                state.status = "Stopped" if stop_event.is_set() else "Waiting for iRacing"
            publish_snapshot()
            if not stop_event.is_set():
                stop_event.wait(refresh_interval_seconds())


class RaceEngineerHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        parsed_url = urlparse(self.path)
        request_path = parsed_url.path

        if request_path == "/api/state":
            self._send_json(build_snapshot())
            return

        if request_path == "/api/events":
            query = parse_qs(parsed_url.query)
            session_key = query.get("session_key", [""])[0].strip()
            event_type = query.get("type", ["all"])[0].strip().lower()
            active_race_key = current_race_session_key()
            events = (
                EVENT_STORE.all(session_key)
                if session_key and session_key == active_race_key
                else []
            )
            events = [
                event for event in events
                if event["type"] != "pos"
                or event.get("source") == "iracing-sdk-track-pass"
            ]
            if event_type in {"pos", "swap", "inc"}:
                events = [event for event in events if event["type"] == event_type]
            # Public API follows the documented uppercase event contract;
            # storage remains lowercase for backwards compatibility.
            api_events = [{**event, "type": event["type"].upper()} for event in events]
            self._send_json({"events": api_events})
            return

        if request_path == "/api/track-svg":
            self._send_track_svg()
            return

        if request_path == "/api/stream":
            self._stream_events()
            return

        if request_path in ("/", "/index.html"):
            self._send_file(WEB_DIR / "index.html", "text/html; charset=utf-8")
            return

        if request_path == "/app.css":
            self._send_file(WEB_DIR / "app.css", "text/css; charset=utf-8")
            return

        if request_path == "/app.js":
            self._send_file(WEB_DIR / "app.js", "application/javascript; charset=utf-8")
            return

        if request_path == "/car-brand-logos.js":
            self._send_file(WEB_DIR / "car-brand-logos.js", "application/javascript; charset=utf-8")
            return

        if request_path == "/car-brand-logos-extra.js":
            self._send_file(WEB_DIR / "car-brand-logos-extra.js", "application/javascript; charset=utf-8")
            return

        self.send_error(HTTPStatus.NOT_FOUND, "Not found")

    def do_POST(self) -> None:
        request_path = urlparse(self.path).path

        if request_path == "/api/camera/focus":
            self._focus_camera()
            return

        if request_path == "/api/replay/event":
            self._play_event_replay()
            return

        if request_path == "/api/events":
            self._save_event()
            return

        if request_path == "/api/events/import":
            self._import_iracing_events()
            return

        if request_path == "/api/refresh-rate":
            self._set_refresh_rate()
            return

        self.send_error(HTTPStatus.NOT_FOUND, "Not found")

    def log_message(self, format: str, *args: Any) -> None:
        return

    def _send_json(self, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0") or 0)
        if content_length <= 0:
            return {}

        body = self.rfile.read(content_length)
        return json.loads(body.decode("utf-8"))

    def _focus_camera(self) -> None:
        try:
            payload = self._read_json_body()
            car_number = str(payload.get("car_number", "")).strip()
            if not car_number:
                self._send_json({"ok": False, "error": "Missing car_number"})
                return

            if telemetry_reader is None or not telemetry_reader.is_connected():
                self._send_json({"ok": False, "error": "iRacing telemetry is not connected"})
                return

            switched = telemetry_reader.focus_camera_on_car(car_number)
            self._send_json({"ok": bool(switched), "car_number": car_number})
        except Exception as exc:
            self._send_json({"ok": False, "error": str(exc)})

    def _play_event_replay(self) -> None:
        try:
            payload = self._read_json_body()
            event_id = str(payload.get("event_id", "")).strip()
            stored_event = next(
                (
                    event
                    for event in EVENT_STORE.all(current_race_session_key())
                    if event["id"] == event_id
                ),
                None,
            ) if event_id else None
            car_number = str(
                stored_event.get("carNumber") if stored_event else payload.get("car_number", "")
            ).strip()
            if not car_number:
                raise ValueError("Missing car_number")
            session_time = (
                stored_event.get("sessionTime") if stored_event else payload.get("session_time")
            )
            session_num = (
                stored_event.get("sessionNum") if stored_event else payload.get("session_num", 0)
            )
            if session_time is None:
                raise ValueError("Replay timing is unavailable for this event")
            if telemetry_reader is None or not telemetry_reader.is_connected():
                raise ValueError("iRacing telemetry is not connected")

            estimated_timing = payload.get("estimated_timing") is True
            event_type = str(stored_event.get("type") if stored_event else "").lower()
            # iRacing's official position can update several seconds after the
            # cars physically cross. Move blue position-change replay timing
            # back to the pass itself; incidents retain their exact timestamp.
            position_timing_compensation = (
                0 if event_type != "pos" or stored_event.get("source") == "iracing-sdk-track-pass"
                else 5
            )
            replay_event_time = max(0.0, float(session_time) - position_timing_compensation)
            before_seconds = 5
            after_seconds = 7
            started = telemetry_reader.play_event_replay(
                car_number=car_number,
                session_num=int(session_num or 0),
                session_time=replay_event_time,
                before_seconds=before_seconds,
                after_seconds=after_seconds,
            )
            self._send_json({
                "ok": bool(started),
                "car_number": car_number,
                "estimated_timing": estimated_timing,
                "position_timing_compensation": position_timing_compensation,
                "replay_duration": before_seconds + after_seconds,
            })
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            self._send_json({"ok": False, "error": str(exc)})
        except Exception as exc:
            self._send_json({"ok": False, "error": str(exc)})

    def _save_event(self) -> None:
        try:
            payload = self._read_json_body()
            active_race_key = current_race_session_key()
            event_session_key = str(payload.get("sessionKey") or "").strip()
            if not active_race_key or event_session_key != active_race_key:
                raise ValueError("Event does not belong to the active race")
            event = EVENT_STORE.add(payload)
            self._send_json({"ok": True, "event": event})
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            self._send_json({"ok": False, "error": str(exc)})

    def _import_iracing_events(self) -> None:
        try:
            payload = self._read_json_body()
            session_key, events = IRACING_RESULTS_IMPORTER.build_events(payload)
            requested_local_key = str(payload.get("local_session_key") or "").strip()
            imported_subsession = session_key.split(":", 1)[0]
            if requested_local_key.split(":", 1)[0] == imported_subsession:
                session_key = requested_local_key
                for event in events:
                    event["sessionKey"] = session_key
            existing_ids = {event["id"] for event in EVENT_STORE.all(session_key)}
            for event in events:
                if not EVENT_STORE.has_equivalent(event):
                    EVENT_STORE.add(event)
            imported = [event for event in EVENT_STORE.all(session_key) if event["id"] not in existing_ids]
            self._send_json({
                "ok": True,
                "session_key": session_key,
                "imported_count": len(imported),
                "event_count": len(EVENT_STORE.all(session_key)),
                "events": EVENT_STORE.all(session_key),
            })
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            self._send_json({"ok": False, "error": str(exc)})
        except Exception as exc:
            self._send_json({"ok": False, "error": str(exc)})

    def _set_refresh_rate(self) -> None:
        try:
            hz = int(self._read_json_body().get("hz", 0))
            set_refresh_rate(hz)
            publish_snapshot()
            self._send_json({"ok": True, "hz": hz})
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            self._send_json({"ok": False, "error": str(exc)})

    def _stream_events(self) -> None:
        subscriber: Queue[str] = Queue(maxsize=1)
        with subscribers_lock:
            subscribers.append(subscriber)

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.end_headers()

        try:
            self.wfile.write(f"data: {snapshot_json()}\n\n".encode("utf-8"))
            self.wfile.flush()

            while True:
                try:
                    payload = subscriber.get(timeout=10)
                    self.wfile.write(f"data: {payload}\n\n".encode("utf-8"))
                except Empty:
                    self.wfile.write(b": keep-alive\n\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass
        finally:
            with subscribers_lock:
                if subscriber in subscribers:
                    subscribers.remove(subscriber)

    def _send_file(self, file_path: Path, content_type: str) -> None:
        if not file_path.exists():
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
            return

        body = file_path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_track_svg(self) -> None:
        try:
            # Read tracks database
            with open(TRACKS_PATH, "r", encoding="utf-8") as f:
                tracks_db = json.load(f)
        except Exception:
            tracks_db = {}

        track_name = None
        track_id = None
        track_internal_name = None
        with state_lock:
            if state.telemetry and isinstance(state.telemetry, dict):
                track_name = state.telemetry.get("track_name")
                track_id = state.telemetry.get("track_id")
                track_internal_name = state.telemetry.get("track_internal_name")

        # TrackID identifies the exact iRacing configuration.  Display names
        # alone are ambiguous for facilities with multiple layouts.
        svg_content = build_official_track_svg(track_id, track_internal_name)
        if track_name:
            def normalize_name(name: str) -> str:
                value = name.lower().strip()
                for ch in (" ", "-", "_", ".", ","):
                    value = value.replace(ch, "")
                return value

            filename = None
            if track_name in tracks_db:
                filename = tracks_db[track_name].get("file")
            else:
                normalized_track_name = normalize_name(track_name)
                for key, val in tracks_db.items():
                    try:
                        normalized_key = normalize_name(str(key))
                        if (
                            normalized_key == normalized_track_name
                            or normalized_track_name in normalized_key
                            or normalized_key in normalized_track_name
                        ):
                            filename = val.get("file")
                            break
                    except Exception:
                        continue
            if filename and svg_content is None:
                svg_path = BASE_DIR / filename
                if svg_path.exists():
                    try:
                        svg_content = svg_path.read_text(encoding="utf-8")
                    except Exception:
                        svg_content = None

        if svg_content is None:
            # Fallback: generate a minimal empty SVG container if the track file is missing.
            svg_content = '''<svg id="track-map" viewBox="0 0 520 380" class="trackmap-svg" aria-label="Track map">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <g id="track-map-cars"></g>
</svg>'''

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "image/svg+xml; charset=utf-8")
        self.send_header("Content-Length", str(len(svg_content.encode("utf-8"))))
        self.end_headers()
        self.wfile.write(svg_content.encode("utf-8"))


def main() -> None:
    config = runtime_config
    def detect_local_ip() -> str:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                return s.getsockname()[0]
        except Exception:
            return "127.0.0.1"

    host_config = config.get("host")
    if not host_config or str(host_config).lower() in ("auto", "detect"):
        host = detect_local_ip()
    else:
        host = str(host_config)

    port = int(config.get("port", 8080))

    stop_event = Event()
    worker = Thread(
        target=telemetry_loop,
        args=(stop_event, config),
        daemon=True,
        name="telemetry-loop",
    )
    worker.start()

    server = ThreadingHTTPServer((host, port), RaceEngineerHandler)
    print(f"Race-Engineer server running at http://{host}:{port}")
    print("Press Ctrl+C to stop.")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Stopping server...")
    finally:
        stop_event.set()
        server.shutdown()
        server.server_close()
        worker.join(timeout=2)


if __name__ == "__main__":
    main()
