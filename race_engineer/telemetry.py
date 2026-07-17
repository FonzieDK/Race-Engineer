import irsdk
import json
import math
import time
from pathlib import Path
from threading import Lock, Timer
from uuid import uuid4


class TelemetryReader:
    def __init__(
        self,
        pit_store=None,
        pit_loss_seconds=25.0,
        fuel_fill_rate_lps=2.5,
        tire_change_seconds=20.0,
        tire_estimate_path=None,
    ):
        self.ir = irsdk.IRSDK()
        self.connected = False
        self._var_names = set()
        self._pit_history = {}
        self._car_presence_history = {}
        self._cars_observed_present = set()
        self._pit_store = pit_store
        self._replay_seek_timer = None
        self._replay_start_timer = None
        self._replay_timer = None
        self._replay_timer_lock = Lock()
        self._pit_command_lock = Lock()
        self._event_replay_state = None
        self._latest_tick_count = None
        self._heavy_snapshot = None
        self._heavy_snapshot_at = 0.0
        self._heavy_snapshot_key = None
        self._pre_race_grid_key = None
        self._pre_race_grid = {}
        self._fallback_session_id = f"local-{uuid4().hex}"
        try:
            self._pit_loss_seconds = max(0.0, float(pit_loss_seconds))
        except (TypeError, ValueError):
            self._pit_loss_seconds = 25.0
        try:
            self._fuel_fill_rate_lps = max(0.1, float(fuel_fill_rate_lps))
        except (TypeError, ValueError):
            self._fuel_fill_rate_lps = 2.5
        try:
            self._tire_change_seconds = max(0.0, float(tire_change_seconds))
        except (TypeError, ValueError):
            self._tire_change_seconds = 20.0
        self._tire_estimate_path = Path(tire_estimate_path) if tire_estimate_path else None
        self._learned_tire_estimates = self._load_tire_estimates()
        self._active_tire_service = None
        self._pending_tire_selection = []
        self._current_tire_estimates = self._default_tire_estimates()

    def _default_tire_estimates(self):
        return {
            count: round(self._tire_change_seconds * count / 4, 3)
            for count in range(5)
        }

    def _load_tire_estimates(self):
        if self._tire_estimate_path is None:
            return {}
        try:
            with self._tire_estimate_path.open("r", encoding="utf-8") as estimate_file:
                data = json.load(estimate_file)
            return data if isinstance(data, dict) else {}
        except (OSError, ValueError, TypeError):
            return {}

    def _save_tire_estimates(self):
        if self._tire_estimate_path is None:
            return
        try:
            self._tire_estimate_path.parent.mkdir(parents=True, exist_ok=True)
            temporary_path = self._tire_estimate_path.with_suffix(".tmp")
            with temporary_path.open("w", encoding="utf-8") as estimate_file:
                json.dump(self._learned_tire_estimates, estimate_file, indent=2, sort_keys=True)
                estimate_file.write("\n")
            temporary_path.replace(self._tire_estimate_path)
        except OSError:
            pass

    @staticmethod
    def _tire_estimate_car_key(car_name):
        return str(car_name or "unknown-car").strip().lower() or "unknown-car"

    def _estimates_for_car(self, car_name):
        estimates = self._default_tire_estimates()
        car_history = self._learned_tire_estimates.get(
            self._tire_estimate_car_key(car_name),
            {},
        )
        for count in range(1, 5):
            measurement = car_history.get(str(count))
            if isinstance(measurement, dict):
                seconds = measurement.get("seconds")
                if isinstance(seconds, (int, float)) and seconds > 0:
                    estimates[count] = round(float(seconds), 3)
        return estimates

    def _record_tire_service_measurement(self, car_name, tire_count, seconds):
        if tire_count not in {1, 2, 3, 4} or not 0.5 <= seconds <= 120.0:
            return
        car_key = self._tire_estimate_car_key(car_name)
        car_history = self._learned_tire_estimates.setdefault(car_key, {})
        previous = car_history.get(str(tire_count), {})
        samples = int(previous.get("samples", 0)) if isinstance(previous, dict) else 0
        previous_seconds = previous.get("seconds") if isinstance(previous, dict) else None
        average = (
            (float(previous_seconds) * samples + seconds) / (samples + 1)
            if isinstance(previous_seconds, (int, float)) and samples > 0
            else seconds
        )
        car_history[str(tire_count)] = {
            "seconds": round(average, 3),
            "samples": samples + 1,
        }
        self._save_tire_estimates()

    def _update_tire_service_learning(
        self,
        car_name,
        session_time,
        pitstop_active,
        pit_service_flags,
        tire_usage,
    ):
        estimates = self._estimates_for_car(car_name)
        self._current_tire_estimates = estimates
        if not isinstance(session_time, (int, float)):
            self._active_tire_service = None
            return estimates

        service_flags = {
            "lf": irsdk.PitSvFlags.lf_tire_change,
            "rf": irsdk.PitSvFlags.rf_tire_change,
            "lr": irsdk.PitSvFlags.lr_tire_change,
            "rr": irsdk.PitSvFlags.rr_tire_change,
        }
        selected = [
            wheel for wheel, flag in service_flags.items()
            if pit_service_flags & flag
        ]
        if not pitstop_active and selected:
            self._pending_tire_selection = selected

        service_selection = selected or self._pending_tire_selection
        if pitstop_active and self._active_tire_service is None and service_selection:
            self._active_tire_service = {
                "car_name": car_name,
                "started_at": float(session_time),
                "selected": list(service_selection),
                "usage": dict(tire_usage),
                "recorded": False,
            }

        active = self._active_tire_service
        if active is not None and float(session_time) < active["started_at"]:
            self._active_tire_service = None
            return estimates

        if active is not None and not active["recorded"]:
            changed = all(
                isinstance(tire_usage.get(wheel), (int, float))
                and isinstance(active["usage"].get(wheel), (int, float))
                and tire_usage[wheel] > active["usage"][wheel]
                for wheel in active["selected"]
            )
            if changed:
                elapsed = float(session_time) - active["started_at"]
                self._record_tire_service_measurement(
                    active["car_name"],
                    len(active["selected"]),
                    elapsed,
                )
                active["recorded"] = True
                estimates = self._estimates_for_car(car_name)
                self._current_tire_estimates = estimates

        if active is not None and not pitstop_active:
            self._active_tire_service = None
            self._pending_tire_selection = []
        return estimates

    def connect(self):
        """Attempt to connect to iRacing."""
        if self.ir.startup():
            self.connected = True
            self._var_names = set(self.ir.var_headers_names or [])
            print("Connected to iRacing.")
            return True
        print("Failed to connect to iRacing. Make sure iRacing is running.")
        return False

    def disconnect(self):
        """Disconnect from iRacing."""
        if self.connected:
            self.ir.shutdown()
            self.connected = False
            print("Disconnected from iRacing.")

    def set_tire_change(self, wheel, enabled):
        """Select or clear one wheel for the next iRacing pit stop.

        iRacing can select one tire directly, but its clear-tires broadcast
        clears every wheel. Preserve and restore the other selections when a
        single wheel is disabled.
        """
        wheel = str(wheel or "").strip().lower()
        commands = {
            "lf": irsdk.PitCommandMode.lf,
            "rf": irsdk.PitCommandMode.rf,
            "lr": irsdk.PitCommandMode.lr,
            "rr": irsdk.PitCommandMode.rr,
        }
        selection_vars = {
            "lf": "dpLFTireChange",
            "rf": "dpRFTireChange",
            "lr": "dpLRTireChange",
            "rr": "dpRRTireChange",
        }
        service_flags = {
            "lf": irsdk.PitSvFlags.lf_tire_change,
            "rf": irsdk.PitSvFlags.rf_tire_change,
            "lr": irsdk.PitSvFlags.lr_tire_change,
            "rr": irsdk.PitSvFlags.rr_tire_change,
        }
        if wheel not in {*commands, "all"}:
            raise ValueError("Unsupported tire position")
        if not isinstance(enabled, bool):
            raise ValueError("enabled must be a boolean")
        if not self.is_connected():
            return False

        with self._pit_command_lock:
            if wheel == "all":
                if not enabled:
                    return bool(self.ir.pit_command(irsdk.PitCommandMode.clear_tires, 0))
                sent = True
                for position in ("lf", "rf", "lr", "rr"):
                    sent = bool(self.ir.pit_command(commands[position], 0)) and sent
                return sent

            if enabled:
                return bool(self.ir.pit_command(commands[wheel], 0))

            current_flags = self._get_var("PitSvFlags", 0)
            current_flags = current_flags if isinstance(current_flags, int) else 0
            selected_others = []
            for position, variable_name in selection_vars.items():
                if position == wheel:
                    continue
                selected = self._get_var(variable_name)
                if selected is None:
                    selected = bool(current_flags & service_flags[position])
                if bool(selected):
                    selected_others.append(position)

            sent = bool(self.ir.pit_command(irsdk.PitCommandMode.clear_tires, 0))
            for position in selected_others:
                sent = bool(self.ir.pit_command(commands[position], 0)) and sent
            return sent

    def set_windscreen_tearoff(self, enabled):
        """Select or clear the windscreen tear-off for the next pit stop."""
        if not isinstance(enabled, bool):
            raise ValueError("enabled must be a boolean")
        if not self.is_connected():
            return False

        command = (
            irsdk.PitCommandMode.ws
            if enabled
            else irsdk.PitCommandMode.clear_ws
        )
        with self._pit_command_lock:
            return bool(self.ir.pit_command(command, 0))

    def _get_session_key(
        self,
        session_id,
        subsession_id,
        session_num,
        session_time=None,
        race_started=False,
        is_replay=False,
    ):
        """Return a stable key without letting missing zero IDs join separate races."""
        normalized_session_num = session_num if session_num is not None else 0
        stable_session_id = next(
            (
                value
                for value in (subsession_id, session_id)
                if value is not None and str(value).strip() not in {"", "0"}
            ),
            None,
        )
        if stable_session_id is None:
            resolver = getattr(self._pit_store, "resolve_fallback_session_id", None)
            stable_session_id = (
                resolver(
                    normalized_session_num,
                    session_time,
                    bool(race_started),
                    bool(is_replay),
                )
                if resolver is not None
                else self._fallback_session_id
            )
        return f"{stable_session_id}:{normalized_session_num}"

    @staticmethod
    def _is_historical_replay(is_replay_playing, session_time, replay_session_time):
        if not is_replay_playing:
            return False
        try:
            return float(session_time) - float(replay_session_time) > 2.0
        except (TypeError, ValueError):
            return True

    def focus_camera_on_car(self, car_number):
        if not self.connected:
            return False

        # Preserve the active camera group and camera within that group. Passing
        # fixed values here would reset the user's angle every time a different
        # leaderboard row is selected.
        camera_group = self._get_var("CamGroupNumber", 1)
        camera_number = self._get_var("CamCameraNumber", 0)
        if not isinstance(camera_group, int) or camera_group < 0:
            camera_group = 1
        if not isinstance(camera_number, int) or camera_number < 0:
            camera_number = 0

        return self.ir.cam_switch_num(
            str(car_number),
            camera_group,
            camera_number,
        )

    def play_event_replay(self, car_number, session_num, session_time, before_seconds=5, after_seconds=7):
        if not self.connected:
            return False

        session_num = int(session_num)
        session_time = float(session_time)
        before_seconds = max(0.0, float(before_seconds))
        after_seconds = max(0.0, float(after_seconds))
        replay_start_ms = round(max(0.0, session_time - before_seconds) * 1000)
        replay_duration = before_seconds + after_seconds

        # A newly registered event does not yet have its requested +7 seconds
        # in iRacing's replay buffer. Starting immediately would hit the live
        # edge, where playback alternates between moving and pausing. Keep the
        # live feed visible until the complete clip is available.
        current_session_time = self._get_var("SessionTime")
        current_session_num = self._get_var("SessionNum", session_num)
        try:
            buffer_wait = (
                max(0.0, session_time + after_seconds + 0.25 - float(current_session_time))
                if int(current_session_num) == session_num
                else 0.0
            )
        except (TypeError, ValueError):
            buffer_wait = 0.0

        if buffer_wait > 0.05:
            self._schedule_event_replay_seek(
                buffer_wait,
                car_number,
                session_num,
                replay_start_ms,
                replay_duration,
            )
            return True

        return self._begin_event_replay(
            car_number,
            session_num,
            replay_start_ms,
            replay_duration,
        )

    def _begin_event_replay(self, car_number, session_num, replay_start_ms, replay_duration):
        if not self.connected:
            return False

        replay_start = replay_start_ms / 1000.0
        with self._replay_timer_lock:
            self._event_replay_state = {
                "session_num": session_num,
                "start": replay_start,
                "end": replay_start + replay_duration,
                "play_confirmed": False,
            }

        # Never send a pause command for an event replay. The seek is
        # asynchronous, and an immediate play command can cancel it in iRacing.
        # Playback starts only after telemetry confirms the requested frame.
        seeked = self.ir.replay_search_session_time(session_num, replay_start_ms)
        self.focus_camera_on_car(car_number)
        if not seeked:
            with self._replay_timer_lock:
                self._event_replay_state = None
        return bool(seeked)

    def _schedule_event_replay_seek(
        self,
        delay_seconds,
        car_number,
        session_num,
        replay_start_ms,
        replay_duration,
    ):
        with self._replay_timer_lock:
            for timer in (self._replay_seek_timer, self._replay_start_timer, self._replay_timer):
                if timer is not None:
                    timer.cancel()
            self._event_replay_state = None

            def seek_event():
                self._begin_event_replay(
                    car_number,
                    session_num,
                    replay_start_ms,
                    replay_duration,
                )

            self._replay_seek_timer = Timer(delay_seconds, seek_event)
            self._replay_seek_timer.daemon = True
            self._replay_seek_timer.start()

    def start_race_event_scan(self, session_num, speed=16):
        if not self.connected:
            return False
        # Session time zero is not necessarily present in a loaded replay and
        # iRacing may silently leave the playhead unchanged. The native
        # to-start command reliably selects the earliest available frame.
        seeked = self.ir.replay_search(irsdk.RpySrchMode.to_start)
        # Playback speed is applied by ReplayEventScanner only after telemetry
        # confirms that the asynchronous seek has completed.
        return bool(seeked)

    def set_replay_play_speed(self, speed):
        if not self.connected:
            return False
        return bool(self.ir.replay_set_play_speed(int(speed), False))

    def _update_event_replay_control(self, replay_session_time, replay_play_speed, session_num):
        """Drive event replay from confirmed iRacing telemetry, never a pause timer."""
        with self._replay_timer_lock:
            state = self._event_replay_state
            if state is None:
                return
            try:
                replay_time = float(replay_session_time)
                current_session_num = int(session_num)
            except (TypeError, ValueError):
                return
            if current_session_num != state["session_num"]:
                return

            seek_is_confirmed = state["start"] - 0.25 <= replay_time < state["end"]
            if not state["play_confirmed"]:
                # Until iRacing reports a frame inside the requested clip,
                # replay_time may still contain the much newer live position.
                # Never interpret that stale value as the end of the clip.
                if not seek_is_confirmed:
                    return
                self.ir.replay_set_play_speed(1, False)
                state["play_confirmed"] = True
                return

            if replay_time >= state["end"] - 0.05:
                self._event_replay_state = None
                self.ir.replay_search(irsdk.RpySrchMode.to_end)
                self.ir.replay_set_play_speed(1, False)
                return

            if int(replay_play_speed or 0) != 1:
                self.ir.replay_set_play_speed(1, False)

    def _has_var(self, name):
        return name in self._var_names

    def _get_var(self, name, default=None):
        if not self._has_var(name):
            return default
        try:
            return self.ir[name]
        except Exception:
            return default

    def _freeze_latest_var_buffer_without_wait(self):
        """Freeze the newest completed SDK buffer without waiting for another tick.

        The server loop already controls the sampling cadence. irsdk's public
        freeze helper waits for the next data event first, which adds a full
        simulator tick to every snapshot.
        """
        try:
            self.ir.unfreeze_var_buffer_latest()
            buffers = self.ir._header.var_buf
            latest = max(buffers, key=lambda buffer: buffer.tick_count)
            latest.freeze()
            self._latest_tick_count = latest.tick_count
            # IRSDK reads variables through this frozen-buffer reference.
            setattr(self.ir, "_IRSDK__var_buffer_latest", latest)
        except (AttributeError, TypeError, ValueError):
            self.ir.freeze_var_buffer_latest()

    @staticmethod
    def _humidity_percent(value):
        """Convert iRacing's 0-1 relative-humidity ratio to percent."""
        if not isinstance(value, (int, float)) or not math.isfinite(value):
            return None
        return value * 100.0 if 0.0 <= value <= 1.0 else value

    @staticmethod
    def _precipitation_percent(value):
        """Convert iRacing's percentage ratio to a clamped display percent."""
        if not isinstance(value, (int, float)) or not math.isfinite(value):
            return None
        percent = value * 100.0 if 0.0 <= value <= 1.0 else value
        return max(0.0, min(100.0, percent))

    @staticmethod
    def _wind_direction_degrees(value):
        """Convert iRacing's wind direction from radians to compass degrees."""
        if not isinstance(value, (int, float)) or not math.isfinite(value):
            return None
        return math.degrees(value) % 360.0

    @staticmethod
    def _race_has_started(session_type, session_state, session_flags):
        if not isinstance(session_type, str) or session_type.strip().casefold() != "race":
            return False

        racing_state = isinstance(session_state, (int, float)) and (
            irsdk.SessionState.racing <= session_state <= irsdk.SessionState.cool_down
        )
        flags = session_flags if isinstance(session_flags, int) else 0
        green_signal = bool(flags & (irsdk.Flags.green | irsdk.Flags.start_go))
        return racing_state or green_signal

    @staticmethod
    def _array_value(values, index, default=None):
        if not isinstance(values, list):
            return default
        if index is None or index < 0 or index >= len(values):
            return default
        return values[index]

    @staticmethod
    def _gap_between(ahead, behind):
        if not ahead or not behind:
            return None

        ahead_value = TelemetryReader._live_race_time(ahead)
        behind_value = TelemetryReader._live_race_time(behind)

        if ahead_value is None or behind_value is None:
            ahead_value = ahead.get("gap")
            behind_value = behind.get("gap")

        if ahead_value is None or behind_value is None:
            ahead_value = ahead.get("relative_time")
            behind_value = behind.get("relative_time")

        try:
            ahead_gap = float(ahead_value)
            behind_gap = float(behind_value)
        except (TypeError, ValueError):
            return None

        difference = abs(behind_gap - ahead_gap)
        return difference if difference < 30000 else None

    @staticmethod
    def _laps_behind(ahead, behind):
        if not ahead or not behind:
            return None

        ahead_laps = ahead.get("laps_completed")
        behind_laps = behind.get("laps_completed")
        if not isinstance(ahead_laps, (int, float)) or not isinstance(behind_laps, (int, float)):
            return None

        ahead_progress = ahead.get("lap_dist_pct")
        behind_progress = behind.get("lap_dist_pct")
        if isinstance(ahead_progress, (int, float)) and isinstance(behind_progress, (int, float)):
            difference = (ahead_laps + ahead_progress) - (behind_laps + behind_progress)
        else:
            difference = ahead_laps - behind_laps

        # A lap counter changes at the start/finish line. Requiring more than
        # one complete track length avoids marking cars on opposite sides of
        # that line as lapped.
        if difference <= 1:
            return None
        return max(1, int(difference))

    @staticmethod
    def _live_race_time(item):
        estimated_time = item.get("estimated_time")
        laps_completed = item.get("laps_completed")
        reference_lap_time = item.get("reference_lap_time")

        if not isinstance(estimated_time, (int, float)):
            return None
        if not isinstance(laps_completed, (int, float)):
            laps_completed = 0
        if not isinstance(reference_lap_time, (int, float)) or reference_lap_time <= 0:
            reference_lap_time = item.get("lap_time")
        if not isinstance(reference_lap_time, (int, float)) or reference_lap_time <= 0:
            return estimated_time

        return (laps_completed * reference_lap_time) + estimated_time

    @staticmethod
    def _get_class_id(driver):
        return driver.get("CarClassID") or driver.get("CarClassShortName") or driver.get("CarClassColor")

    @staticmethod
    def _get_incident_count(driver):
        counts = [
            value for value in (
                driver.get("TeamIncidentCount"),
                driver.get("CurDriverIncidentCount"),
            )
            if isinstance(value, (int, float)) and value >= 0
        ]
        return int(max(counts)) if counts else None

    @staticmethod
    def _get_class_name(driver):
        class_name = driver.get("CarClassShortName") or driver.get("CarClassName")
        if isinstance(class_name, str) and class_name.strip():
            class_name = class_name.strip()
            if class_name.casefold().endswith(" class"):
                class_name = class_name[:-6].rstrip()
            return class_name

        # Some iRacing sessions (notably AI/multiclass sessions) omit the class
        # name while still supplying CarClassID. Infer the common classes from
        # the model name instead of labelling every missing value as GT3.
        car_name = " ".join(str(driver.get(field) or "") for field in (
            "CarScreenName",
            "CarScreenNameShort",
            "CarPath",
        )).casefold()
        class_markers = (
            ("Porsche Cup", ("gt3 cup", "992 cup", "991 cup")),
            ("GTP", ("gtp", "arx-06", "m hybrid v8", "499p", "v-series.r", "porsche 963")),
            ("LMP2", ("lmp2",)),
            ("LMP3", ("lmp3",)),
            ("GT4", ("gt4",)),
            ("GT3", ("gt3",)),
            ("TCR", ("tcr",)),
            ("Supercars", ("supercar",)),
            ("NASCAR", ("nascar",)),
        )
        for inferred_name, markers in class_markers:
            if any(marker in car_name for marker in markers):
                return inferred_name

        return "--"

    @staticmethod
    def _normalize_class_position(value):
        if isinstance(value, int) and value >= 0:
            return value + 1
        return value

    def _update_pit_status(
        self,
        car_idx,
        is_on_pit_road,
        session_time,
        laps_completed=None,
        session_key=None,
    ):
        if car_idx is None or not isinstance(session_time, (int, float)):
            return {}

        history_key = (session_key, car_idx)
        status = self._pit_history.get(history_key)
        if status is None:
            stored_pit_lap = None
            stored_pit_duration = None
            pit_store = getattr(self, "_pit_store", None)
            if session_key and pit_store is not None:
                stored_pit_lap = pit_store.get_last_pit_lap(session_key, car_idx)
                stored_pit_duration = pit_store.get_last_pit_duration(session_key, car_idx)
            status = {
                "on_pit_road": False,
                "pit_in_time": None,
                "last_pit_duration": stored_pit_duration,
                "last_pit_lap": stored_pit_lap,
            }
            self._pit_history[history_key] = status

        was_on_pit_road = status["on_pit_road"]

        if is_on_pit_road and not was_on_pit_road:
            status["pit_in_time"] = session_time
            status["last_pit_duration"] = None
            if isinstance(laps_completed, (int, float)) and laps_completed >= 0:
                status["last_pit_lap"] = int(laps_completed)
                pit_store = getattr(self, "_pit_store", None)
                if session_key and pit_store is not None:
                    pit_store.save_last_pit_lap(session_key, car_idx, int(laps_completed))

        if not is_on_pit_road and was_on_pit_road and status["pit_in_time"] is not None:
            status["last_pit_duration"] = max(0, session_time - status["pit_in_time"])
            pit_store = getattr(self, "_pit_store", None)
            if (
                session_key
                and pit_store is not None
                and isinstance(status["last_pit_lap"], int)
            ):
                pit_store.save_last_pit_duration(
                    session_key,
                    car_idx,
                    status["last_pit_lap"],
                    status["last_pit_duration"],
                )

        status["on_pit_road"] = bool(is_on_pit_road)

        current_pit_duration = None
        if status["on_pit_road"] and status["pit_in_time"] is not None:
            current_pit_duration = max(0, session_time - status["pit_in_time"])

        laps_since_pit = None
        if (
            isinstance(laps_completed, (int, float))
            and isinstance(status["last_pit_lap"], int)
        ):
            laps_since_pit = max(0, int(laps_completed) - status["last_pit_lap"])

        return {
            "pit_in_time": status["pit_in_time"],
            "pit_duration": current_pit_duration if current_pit_duration is not None else status["last_pit_duration"],
            "laps_since_pit": laps_since_pit,
            "is_on_pit_road": status["on_pit_road"],
        }

    @staticmethod
    def _get_car_status(is_on_pit_road, track_location, reason_out=None):
        reason = reason_out.strip().lower() if isinstance(reason_out, str) else ""
        if reason and reason != "running":
            return "retired"
        if track_location == -1:
            return "garage"
        if is_on_pit_road:
            return "pit"
        return "track"

    def _get_timed_car_status(
        self,
        car_idx,
        is_on_pit_road,
        track_location,
        session_time,
        rpm=None,
        reason_out=None,
        session_key=None,
    ):
        """Keep a newly vacated car as PIT ROAD briefly before showing GARAGE."""
        reason = reason_out.strip().lower() if isinstance(reason_out, str) else ""
        if reason and reason != "running":
            return "retired"

        if not isinstance(session_time, (int, float)) or car_idx is None:
            return self._get_car_status(is_on_pit_road, track_location, reason_out)

        # NotInWorld is iRacing's definitive signal. For a vacant car that is
        # still represented in its pit stall, iRacing reports the CarIdxRPM
        # floor value (300 RPM in live sessions). A missing RPM channel is
        # deliberately not enough evidence on its own.
        not_in_world = track_location == -1
        no_driver = not_in_world or (
            bool(is_on_pit_road)
            and isinstance(rpm, (int, float))
            and rpm <= 300
        )
        history_key = (session_key, car_idx)
        absent_since = self._car_presence_history.get(history_key)

        if not no_driver:
            self._cars_observed_present.add(history_key)
            self._car_presence_history.pop(history_key, None)
            return "pit" if is_on_pit_road else "track"

        # Do not invent a recent pit arrival after Race-Engineer starts. If the
        # first telemetry already says the car is vacant, it belongs in the
        # garage immediately. The grace period only applies after this process
        # has actually observed the car occupied in the same session.
        if not_in_world or history_key not in self._cars_observed_present:
            return "garage"

        if absent_since is None or session_time < absent_since:
            self._car_presence_history[history_key] = session_time
            absent_since = session_time

        if session_time - absent_since > 60:
            return "garage"
        return "pit" if is_on_pit_road else "track"

    def _get_driver_info(self, car_idx):
        driver_info = self.ir["DriverInfo"] or {}
        drivers = driver_info.get("Drivers", []) if isinstance(driver_info, dict) else []

        if car_idx is None:
            return {}

        for driver in drivers:
            if driver.get("CarIdx") == car_idx:
                return driver
        return {}

    def _is_valid_driver(self, driver):
        return bool(driver) and driver.get("IsSpectator") != 1 and driver.get("CarIsPaceCar") != 1

    def _select_focus_car_idx(self, cam_car_idx, player_car_idx):
        for car_idx in (cam_car_idx, player_car_idx):
            if isinstance(car_idx, int) and car_idx >= 0 and self._is_valid_driver(self._get_driver_info(car_idx)):
                return car_idx

        driver_info = self.ir["DriverInfo"] or {}
        drivers = driver_info.get("Drivers", []) if isinstance(driver_info, dict) else []
        for driver in drivers:
            car_idx = driver.get("CarIdx")
            if isinstance(car_idx, int) and self._is_valid_driver(driver):
                return car_idx
        return None

    def _get_current_session(self):
        session_info = self.ir["SessionInfo"] or {}
        if not isinstance(session_info, dict):
            return {}

        current_session_num = session_info.get("CurrentSessionNum")
        sessions = session_info.get("Sessions", [])
        if not isinstance(sessions, list):
            return {}

        for session in sessions:
            if session.get("SessionNum") == current_session_num:
                return session

        return sessions[0] if sessions else {}

    @staticmethod
    def _valid_lap_count(value):
        if not isinstance(value, (int, float)):
            return None
        if value < 0 or value >= 30000:
            return None
        return int(value)

    @staticmethod
    def _parse_session_laps(value):
        if isinstance(value, (int, float)):
            return TelemetryReader._valid_lap_count(value)
        if isinstance(value, str):
            value = value.strip()
            if not value or value.lower() in ("unlimited", "unlimited laps"):
                return None
            try:
                return TelemetryReader._valid_lap_count(float(value))
            except ValueError:
                return None
        return None

    @staticmethod
    def _get_overall_leader_idx(car_positions):
        if not isinstance(car_positions, list):
            return None
        for car_idx, position in enumerate(car_positions):
            if position == 1:
                return car_idx
        return None

    def _get_race_lap_count(
        self,
        current_session,
        leader_laps_completed,
        leader_lap_progress,
        leader_best_lap,
        leader_last_lap,
        session_time_remain,
        session_flags,
    ):
        """Return the global race lap based on overall P1, never camera focus."""
        completed = self._valid_lap_count(leader_laps_completed)
        if completed is None:
            return None, None, None, False

        current_lap = completed + 1
        scheduled_laps = self._parse_session_laps((current_session or {}).get("SessionLaps"))
        if scheduled_laps is not None:
            return current_lap, scheduled_laps, max(0, scheduled_laps - completed), False

        flags = session_flags if isinstance(session_flags, int) else 0
        if flags & irsdk.Flags.checkered:
            return completed, completed, 0, False
        if flags & irsdk.Flags.white:
            # P1 receives white at the line and is now on the final lap.
            return current_lap, current_lap, 1, False

        reference_lap = next((
            value for value in (leader_best_lap, leader_last_lap)
            if isinstance(value, (int, float)) and value > 0
        ), None)
        if reference_lap is None or not isinstance(session_time_remain, (int, float)):
            return current_lap, None, None, False

        progress = self._clamp_progress(leader_lap_progress)
        progress = progress if progress is not None else 0.0
        # Once time expires, P1 finishes the active lap, receives white, and
        # completes one final lap. The final lap count is unknowable until
        # white is actually shown, so expose the calculated total together
        # with the estimated flag. The UI marks it with a leading tilde.
        continuous_laps_at_expiry = completed + progress + max(0.0, session_time_remain) / reference_lap
        estimated_total = math.ceil(continuous_laps_at_expiry - 1e-9) + 1
        estimated_total = max(current_lap, estimated_total)
        return current_lap, estimated_total, max(0, estimated_total - completed), True

    def _get_track_name(self):
        """Get the current track name from WeekendInfo."""
        weekend_info = self.ir["WeekendInfo"] or {}
        if not isinstance(weekend_info, dict):
            return None

        for key in ("TrackDisplayName", "TrackDisplayShortName", "TrackName", "TrackConfigName"):
            value = weekend_info.get(key)
            if isinstance(value, str):
                value = value.strip()
                if value:
                    return value
        return None

    @staticmethod
    def _describe_track_surface(surface_code, is_on_pit_road=False):
        if is_on_pit_road:
            return "Pit road"

        if surface_code is None:
            return "Unknown surface"

        surface_names = {
            0: "Tarmac",
            1: "Rumble strip",
            2: "Grass",
            3: "Dirt",
            4: "Sand",
            5: "Wet",
            6: "Ice",
            7: "Snow",
        }

        if isinstance(surface_code, (int, float)):
            surface_code = int(surface_code)
            return surface_names.get(surface_code, f"Surface {surface_code}")

        if isinstance(surface_code, str) and surface_code:
            return surface_code

        return "Unknown surface"

    @staticmethod
    def _clamp_progress(value):
        if not isinstance(value, (int, float)):
            return None
        if value < 0:
            return None
        return value % 1.0

    @staticmethod
    def _project_track_position(progress):
        if progress is None:
            return None

        import math

        # Keep car markers on the same center line as the SVG oval track.
        center_x = 260
        center_y = 190
        radius_x = 150
        radius_y = 130

        # Start from top-center and move clockwise around the map.
        angle = (progress * math.tau) - (math.pi / 2)
        x = center_x + math.cos(angle) * radius_x
        y = center_y + math.sin(angle) * radius_y
        return {"x": round(x, 2), "y": round(y, 2)}

    def _build_standings(
        self,
        drivers,
        lap_dist_pct,
        relative_times,
        estimated_times,
        laps_completed_values,
        best_lap_times,
        last_lap_times,
        on_pit_road_values,
        session_time,
        focus_car_idx,
        track_surface_values=None,
        tire_compound_values=None,
        rpm_values=None,
        session_key=None,
        race_started=True,
    ):
        if track_surface_values is None:
            track_surface_values = []
        if tire_compound_values is None:
            tire_compound_values = []
        if rpm_values is None:
            rpm_values = []
        drivers_by_idx = {
            driver.get("CarIdx"): driver
            for driver in drivers
            if driver.get("CarIdx") is not None
        }
        current_session = self._get_current_session()
        results_positions = current_session.get("ResultsPositions", [])

        standings = []

        def lock_to_pre_race_grid(items):
            if race_started:
                return items

            grid_key = session_key or "current-race"
            if getattr(self, "_pre_race_grid_key", None) != grid_key:
                self._pre_race_grid_key = grid_key
                self._pre_race_grid = {}

            grid = getattr(self, "_pre_race_grid", {})
            if not grid:
                qualifying_results = []
                ir = getattr(self, "ir", None)
                if ir is not None:
                    try:
                        qualify_info = ir["QualifyResultsInfo"] or {}
                    except (KeyError, TypeError):
                        qualify_info = {}
                    if isinstance(qualify_info, dict):
                        qualifying_results = qualify_info.get("Results", [])

                valid_qualifiers = [
                    result
                    for result in qualifying_results
                    if isinstance(result, dict)
                    and result.get("CarIdx") in drivers_by_idx
                    and isinstance(result.get("Position"), int)
                    and result.get("Position") >= 0
                ]
                valid_qualifiers.sort(key=lambda result: result["Position"])
                for position, result in enumerate(valid_qualifiers, start=1):
                    grid[result["CarIdx"]] = position

                # Cars without a qualifying result are appended in the order
                # first reported by iRacing. Once captured, this map is never
                # changed before green, even while cars move on the formation lap.
                next_position = len(grid) + 1
                for item in sorted(items, key=lambda entry: entry.get("position") or 9999):
                    car_idx = item.get("car_idx")
                    if car_idx not in grid:
                        grid[car_idx] = next_position
                        next_position += 1

                self._pre_race_grid = grid

            for item in items:
                item["position"] = grid.get(item.get("car_idx"), item.get("position"))

            # Derive class positions from the locked overall grid as well, so
            # the number in the first leaderboard column cannot jump pre-green.
            class_counts = {}
            for item in sorted(items, key=lambda entry: entry.get("position") or 9999):
                class_key = item.get("class_id") or item.get("class_name")
                class_counts[class_key] = class_counts.get(class_key, 0) + 1
                item["class_position"] = class_counts[class_key]
            return items

        def enrich_standings(items):
            items.sort(key=lambda item: item["position"] or 9999)
            reference_lap_times = [
                value
                for item in items
                for value in (item.get("best_lap_time"), item.get("lap_time"))
                if isinstance(value, (int, float)) and value > 0
            ]
            common_reference_lap_time = min(reference_lap_times) if reference_lap_times else None

            if common_reference_lap_time:
                for item in items:
                    item["reference_lap_time"] = common_reference_lap_time

            for index, item in enumerate(items):
                previous_item = items[index - 1] if index > 0 else None
                next_item = items[index + 1] if index + 1 < len(items) else None
                item["interval"] = self._gap_between(previous_item, item)
                item["interval_ahead"] = self._gap_between(previous_item, item)
                item["interval_behind"] = self._gap_between(item, next_item)
                item["interval_laps_ahead"] = self._laps_behind(previous_item, item)
                item["class_gap"] = None
                item["class_gap_laps"] = None

            for item in items:
                class_position = item.get("class_position")
                if class_position == 1:
                    item["class_gap"] = 0
                    continue

                same_class = [
                    candidate
                    for candidate in items
                    if candidate.get("class_position") == 1
                    and candidate.get("class_id") is not None
                    and candidate.get("class_id") == item.get("class_id")
                ]
                leader = same_class[0] if same_class else None
                item["class_gap"] = self._gap_between(leader, item)
                item["class_gap_laps"] = self._laps_behind(leader, item)

            return items

        if isinstance(results_positions, list) and results_positions:
            for result in results_positions:
                car_idx = result.get("CarIdx")
                driver = drivers_by_idx.get(car_idx, {})
                if not driver or driver.get("IsSpectator") == 1 or driver.get("CarIsPaceCar") == 1:
                    continue

                position = result.get("Position")
                if position is None or position <= 0:
                    continue

                standings.append({
                    "car_idx": car_idx,
                    "position": position,
                    "class_position": self._normalize_class_position(result.get("ClassPosition")),
                    "class_id": self._get_class_id(driver),
                    "class_name": self._get_class_name(driver),
                    "car_number": driver.get("CarNumber", "--"),
                    "driver_id": driver.get("UserID"),
                    "team_name": driver.get("TeamName") or "--",
                    "driver_name": driver.get("UserName") or driver.get("AbbrevName") or "Unknown driver",
                    "incident_count": self._get_incident_count(driver),
                    "car_name": driver.get("CarScreenName", "Unknown car"),
                    "tire_compound": self._array_value(tire_compound_values, car_idx),
                    "lap_time": result.get("LastTime"),
                    "best_lap_time": self._array_value(best_lap_times, car_idx),
                    "laps_completed": self._array_value(laps_completed_values, car_idx),
                    "lap_dist_pct": self._clamp_progress(self._array_value(lap_dist_pct, car_idx)),
                    "focused": car_idx == focus_car_idx,
                    "gap": result.get("Time"),
                    "relative_time": self._array_value(relative_times, car_idx),
                    "estimated_time": self._array_value(estimated_times, car_idx),
                    "reference_lap_time": (
                        self._array_value(best_lap_times, car_idx)
                        or result.get("LastTime")
                        or self._array_value(last_lap_times, car_idx)
                    ),
                    "car_status": self._get_timed_car_status(
                        car_idx,
                        self._array_value(on_pit_road_values, car_idx, False),
                        self._array_value(track_surface_values, car_idx),
                        session_time,
                        self._array_value(rpm_values, car_idx),
                        result.get("ReasonOutStr"),
                        session_key,
                    ),
                    **self._update_pit_status(
                        car_idx,
                        self._array_value(on_pit_road_values, car_idx, False),
                        session_time,
                        self._array_value(laps_completed_values, car_idx),
                        session_key,
                    ),
                })

            # Keep the complete field.  The UI builds its class filters from this
            # collection, so truncating it also hid every class whose first car
            # happened to be outside the top 24.
            return enrich_standings(lock_to_pre_race_grid(standings))

        # Fallback if session results are temporarily unavailable.
        for driver in drivers:
            car_idx = driver.get("CarIdx")
            if car_idx is None or driver.get("IsSpectator") == 1 or driver.get("CarIsPaceCar") == 1:
                continue

            progress = self._clamp_progress(self._array_value(lap_dist_pct, car_idx))
            standings.append({
                "car_idx": car_idx,
                "position": 999,
                "class_position": None,
                "class_id": self._get_class_id(driver),
                "class_name": self._get_class_name(driver),
                "car_number": driver.get("CarNumber", "--"),
                "driver_id": driver.get("UserID"),
                "team_name": driver.get("TeamName") or "--",
                "driver_name": driver.get("UserName") or driver.get("AbbrevName") or "Unknown driver",
                "incident_count": self._get_incident_count(driver),
                "car_name": driver.get("CarScreenName", "Unknown car"),
                "tire_compound": self._array_value(tire_compound_values, car_idx),
                "lap_time": self._array_value(last_lap_times, car_idx),
                "best_lap_time": self._array_value(best_lap_times, car_idx),
                "laps_completed": self._array_value(laps_completed_values, car_idx),
                "lap_dist_pct": progress,
                "focused": car_idx == focus_car_idx,
                "gap": None,
                "relative_time": self._array_value(relative_times, car_idx),
                "estimated_time": self._array_value(estimated_times, car_idx),
                "reference_lap_time": (
                    self._array_value(best_lap_times, car_idx)
                    or self._array_value(last_lap_times, car_idx)
                ),
                "car_status": self._get_timed_car_status(
                    car_idx,
                    self._array_value(on_pit_road_values, car_idx, False),
                    self._array_value(track_surface_values, car_idx),
                    session_time,
                    self._array_value(rpm_values, car_idx),
                    session_key=session_key,
                ),
                **self._update_pit_status(
                    car_idx,
                    self._array_value(on_pit_road_values, car_idx, False),
                    session_time,
                    self._array_value(laps_completed_values, car_idx),
                    session_key,
                ),
            })

        def total_race_progress(item):
            completed = item.get("laps_completed")
            progress = item.get("lap_dist_pct")
            try:
                completed_value = float(completed)
            except (TypeError, ValueError):
                completed_value = -1.0
            try:
                progress_value = float(progress)
            except (TypeError, ValueError):
                progress_value = -1.0
            return completed_value + max(0.0, progress_value)

        # Lap percentage wraps from ~1.0 to 0.0 at the finish line. Sorting by
        # it alone rotates the whole field and creates false position events.
        standings.sort(key=total_race_progress, reverse=True)
        for index, item in enumerate(standings, start=1):
            item["position"] = index
        return enrich_standings(lock_to_pre_race_grid(standings))

    def _build_track_map(
        self,
        drivers,
        positions,
        class_positions,
        lap_dist_pct,
        focus_car_idx,
        on_pit_road=None,
    ):
        cars = []

        for driver in drivers:
            car_idx = driver.get("CarIdx")
            if (
                car_idx is None
                or driver.get("IsSpectator") == 1
                or driver.get("CarIsPaceCar") == 1
            ):
                continue

            progress = self._clamp_progress(self._array_value(lap_dist_pct, car_idx))
            if progress is None:
                continue

            cars.append({
                "car_idx": car_idx,
                "car_number": driver.get("CarNumber", "--"),
                "driver_name": driver.get("UserName") or driver.get("AbbrevName") or "Unknown driver",
                "position": self._array_value(positions, car_idx),
                "class_position": self._normalize_class_position(self._array_value(class_positions, car_idx)),
                "class_id": self._get_class_id(driver),
                "class_name": self._get_class_name(driver),
                "is_on_pit_road": bool(self._array_value(
                    on_pit_road if on_pit_road is not None else [],
                    car_idx,
                    False,
                )),
                "lap_dist_pct": progress,
                **(self._project_track_position(progress) or {}),
                "focused": car_idx == focus_car_idx,
            })

        cars.sort(key=lambda item: item["position"] or 9999)
        return {
            "width": 520,
            "height": 380,
            "cars": cars,
        }

    def _estimate_next_pit_loss(self, is_player_car, pit_service_flags, pit_fuel):
        """Combine the track's base pit loss with the selected F4/F5 service."""
        base_loss = self._pit_loss_seconds
        flags = pit_service_flags if isinstance(pit_service_flags, int) else 0
        selected_fuel = (
            max(0.0, float(pit_fuel))
            if is_player_car and isinstance(pit_fuel, (int, float))
            else 0.0
        )
        fuel_seconds = selected_fuel / self._fuel_fill_rate_lps
        tire_mask = (
            irsdk.PitSvFlags.lf_tire_change
            | irsdk.PitSvFlags.rf_tire_change
            | irsdk.PitSvFlags.lr_tire_change
            | irsdk.PitSvFlags.rr_tire_change
        )
        tire_count = (flags & tire_mask).bit_count() if is_player_car else 0
        tire_seconds = getattr(
            self,
            "_current_tire_estimates",
            self._default_tire_estimates(),
        ).get(
            tire_count,
            self._tire_change_seconds * tire_count / 4,
        ) if tire_count else 0.0
        # iRacing normally performs fuel and tires concurrently; the longest
        # selected operation determines stationary service time.
        service_seconds = max(fuel_seconds, tire_seconds)
        return {
            "base_loss_seconds": round(base_loss, 3),
            "service_seconds": round(service_seconds, 3),
            "fuel_seconds": round(fuel_seconds, 3),
            "tire_seconds": round(tire_seconds, 3),
            "selected_fuel": round(selected_fuel, 3),
            "tire_count": tire_count,
            "pit_loss_seconds": round(base_loss + service_seconds, 3),
        }

    def _build_pit_exit_prediction(
        self,
        standings,
        track_map,
        focus_car_idx,
        pit_loss_details=None,
        estimated_lap_time=None,
    ):
        """Build a JRT-style ghost car at its expected post-stop location."""
        if focus_car_idx is None or not isinstance(standings, list):
            return None

        by_idx = {
            item.get("car_idx"): item
            for item in standings
            if item.get("car_idx") is not None
        }
        focused = by_idx.get(focus_car_idx)
        if not focused:
            return None

        def race_progress(item):
            laps = item.get("laps_completed")
            progress = item.get("lap_dist_pct")
            if not isinstance(laps, (int, float)) or not isinstance(progress, (int, float)):
                return None
            return float(laps) + (float(progress) % 1.0)

        valid_lap_times = [
            value
            for item in standings
            for value in (
                item.get("best_lap_time"),
                item.get("lap_time"),
                item.get("reference_lap_time"),
            )
            if isinstance(value, (int, float)) and value > 0
        ]
        if isinstance(estimated_lap_time, (int, float)) and estimated_lap_time > 0:
            valid_lap_times.append(estimated_lap_time)
        fallback_lap_time = min(valid_lap_times) if valid_lap_times else None
        focused_progress = race_progress(focused)
        if focused_progress is None or fallback_lap_time is None:
            return None

        details = dict(pit_loss_details or {})
        pit_loss = details.get("pit_loss_seconds", self._pit_loss_seconds)
        if not isinstance(pit_loss, (int, float)) or pit_loss < 0:
            pit_loss = self._pit_loss_seconds
        focused_lap_time = next(
            (
                value
                for value in (
                    focused.get("best_lap_time"),
                    focused.get("lap_time"),
                    focused.get("reference_lap_time"),
                    estimated_lap_time,
                    fallback_lap_time,
                )
                if isinstance(value, (int, float)) and value > 0
            ),
            None,
        )
        if focused_lap_time is None:
            return None
        ghost_progress = focused_progress - (pit_loss / focused_lap_time)

        active_opponents = [
            item for item in standings
            if item.get("car_idx") != focus_car_idx
            and item.get("car_status") not in {"retired", "garage"}
            and race_progress(item) is not None
        ]
        predicted_position = 1 + sum(
            race_progress(item) > ghost_progress + 1e-6 for item in active_opponents
        )

        projected_cars = []
        for car in (track_map or {}).get("cars", []):
            projected = dict(car)
            # Keep the camera-selected car identifiable on the pit-exit map.
            # The predicted pit-exit ghost is still rendered separately below.
            projected["focused"] = car.get("car_idx") == focus_car_idx
            projected["pit_exit"] = False
            projected_cars.append(projected)

        focused_car = next(
            (
                car for car in (track_map or {}).get("cars", [])
                if car.get("car_idx") == focus_car_idx
            ),
            None,
        )
        if focused_car:
            ghost = dict(focused_car)
            ghost["car_idx"] = f"pit-exit-{focus_car_idx}"
            ghost["lap_dist_pct"] = ghost_progress % 1.0
            ghost["focused"] = False
            ghost["pit_exit"] = True
            projected_cars.append(ghost)

        ordered = sorted(
            active_opponents,
            key=lambda item: race_progress(item),
            reverse=True,
        )
        car_ahead = next(
            (item for item in reversed(ordered) if race_progress(item) > ghost_progress),
            None,
        )
        car_behind = next(
            (item for item in ordered if race_progress(item) <= ghost_progress),
            None,
        )

        def traffic_car(item, projected_position):
            if not item:
                return None
            return {
                "car_number": item.get("car_number", "--"),
                "driver_name": item.get("driver_name", "Unknown driver"),
                # The focused car is removed from the live order and inserted
                # again at its predicted position.  Cars that are currently
                # behind it therefore move up one place before it rejoins.
                # Exposing their live position here made a predicted P16 read
                # as "after P16" instead of the correct "after P15".
                "position": projected_position,
            }

        return {
            "position": predicted_position,
            **details,
            "pit_loss_seconds": round(float(pit_loss), 3),
            "car_ahead": traffic_car(car_ahead, predicted_position - 1),
            "car_behind": traffic_car(car_behind, predicted_position + 1),
            "cars": projected_cars,
        }

    def get_telemetry_data(self):
        """Get telemetry for the currently focused camera car."""
        if not self.connected:
            return None

        self._freeze_latest_var_buffer_without_wait()

        try:
            cam_car_idx = self._get_var("CamCarIdx")
            player_car_idx = self._get_var("PlayerCarIdx")
            focus_car_idx = self._select_focus_car_idx(cam_car_idx, player_car_idx)
            driver = self._get_driver_info(focus_car_idx)
            player_driver = self._get_driver_info(player_car_idx)
            player_class_name = self._get_class_name(player_driver)
            player_is_gtp = "GTP" in str(player_class_name).upper()
            driver_info = self.ir["DriverInfo"] or {}
            drivers = driver_info.get("Drivers", []) if isinstance(driver_info, dict) else []
            is_player_car = focus_car_idx == player_car_idx

            car_positions = self._get_var("CarIdxPosition", [])
            class_positions = self._get_var("CarIdxClassPosition", [])
            last_lap_times = self._get_var("CarIdxLastLapTime", [])
            best_lap_times = self._get_var("CarIdxBestLapTime", [])
            laps_completed = self._get_var("CarIdxLapCompleted", [])
            on_pit_road = self._get_var("CarIdxOnPitRoad", [])
            lap_dist_pct = self._get_var("CarIdxLapDistPct", [])
            estimated_times = self._get_var("CarIdxEstTime", [])
            track_surface = self._get_var("CarIdxTrackSurface", [])
            focus_rpm_values = self._get_var("CarIdxRPM", [])
            focus_gear_values = self._get_var("CarIdxGear", [])
            focus_gap_values = self._get_var("CarIdxF2Time", [])
            focus_tire_compound_values = self._get_var("CarIdxTireCompound", [])
            focus_fast_repairs_values = self._get_var("CarIdxFastRepairsUsed", [])
            player_fast_repairs_used = self._array_value(
                focus_fast_repairs_values,
                player_car_idx,
            )
            session_time = self._get_var("SessionTime")
            session_time_of_day = self._get_var("SessionTimeOfDay")
            replay_session_time = self._get_var("ReplaySessionTime")
            session_num = self._get_var("SessionNum", 0)
            is_replay_playing = bool(self._get_var("IsReplayPlaying", False))
            historical_replay = self._is_historical_replay(
                is_replay_playing,
                session_time,
                replay_session_time,
            )
            replay_play_speed = self._get_var("ReplayPlaySpeed", 1)
            self._update_event_replay_control(
                replay_session_time,
                replay_play_speed,
                session_num,
            )
            session_time_remain = self._get_var("SessionTimeRemain")
            focused_laps_completed = self._array_value(laps_completed, focus_car_idx)
            focused_last_lap = self._array_value(last_lap_times, focus_car_idx)
            focused_best_lap = self._array_value(best_lap_times, focus_car_idx)
            current_session = self._get_current_session()
            session_flags = self._get_var("SessionFlags", 0)
            session_state = self._get_var("SessionState")
            session_type = current_session.get("SessionType")
            leader_car_idx = self._get_overall_leader_idx(car_positions)
            if leader_car_idx is None:
                leader_car_idx = focus_car_idx
            leader_laps_completed = self._array_value(laps_completed, leader_car_idx)
            leader_best_lap = self._array_value(best_lap_times, leader_car_idx)
            leader_last_lap = self._array_value(last_lap_times, leader_car_idx)
            leader_lap_progress = self._array_value(lap_dist_pct, leader_car_idx)
            (
                current_lap,
                session_laps_total,
                session_laps_remain,
                session_laps_remain_estimated,
            ) = self._get_race_lap_count(
                current_session,
                leader_laps_completed,
                leader_lap_progress,
                leader_best_lap,
                leader_last_lap,
                session_time_remain,
                session_flags,
            )

            player_fuel_level = self._get_var("FuelLevel")
            player_fuel_use_per_hour = self._get_var("FuelUsePerHour")
            player_rpm = self._get_var("RPM")
            fuel_level = player_fuel_level if is_player_car else None
            fuel_capacity = (
                driver_info.get("DriverCarFuelMaxLtr")
                if isinstance(driver_info, dict)
                else None
            )
            fuel_density = (
                driver_info.get("DriverCarFuelKgPerLtr")
                if isinstance(driver_info, dict)
                else None
            )
            rpm_limit = (
                driver_info.get("DriverCarRedLine")
                if isinstance(driver_info, dict)
                else None
            )
            air_temp = self._get_var("AirTemp")
            track_temp = self._get_var("TrackTemp")
            if track_temp is None:
                track_temp = self._get_var("TrackSurfaceTemp")
            track_wetness = self._get_var("TrackWetness")
            skies = self._get_var("Skies")
            weather_declared_wet = self._get_var("WeatherDeclaredWet")
            humidity = self._humidity_percent(self._get_var("RelativeHumidity"))
            precipitation = self._precipitation_percent(self._get_var("Precipitation"))
            # The iRacing SDK exposes wind velocity as WindVel (m/s) and wind
            # direction as WindDir (radians).
            wind_speed = self._get_var("WindVel")
            if wind_speed is None:
                wind_speed = self._get_var("WindSpeed")
            wind_direction = self._wind_direction_degrees(self._get_var("WindDir"))
            weather_type = self._get_var("WeatherType") or self._get_var("WeatherTypeName")
            rain_state = self._get_var("RainState")
            track_surface_code = self._array_value(track_surface, focus_car_idx)

            weekend_info = self.ir["WeekendInfo"] or {}
            if not isinstance(weekend_info, dict):
                weekend_info = {}
            weekend_options = weekend_info.get("WeekendOptions") or {}
            if not isinstance(weekend_options, dict):
                weekend_options = {}
            weather_type = (
                weekend_info.get("TrackWeatherType")
                or weekend_options.get("WeatherType")
                or weather_type
            )
            weather_date = weekend_options.get("Date") or weekend_info.get("Date")
            session_id = weekend_info.get("SessionID")
            subsession_id = weekend_info.get("SubSessionID")
            session_num = self._get_var("SessionNum", current_session.get("SessionNum"))
            race_started = self._race_has_started(session_type, session_state, session_flags)
            session_key = self._get_session_key(
                session_id,
                subsession_id,
                session_num,
                session_time,
                race_started,
                historical_replay,
            )
            pit_store = getattr(self, "_pit_store", None)
            if session_key and pit_store is not None and hasattr(pit_store, "activate_session"):
                pit_store.activate_session(session_key)

            track_name = self._get_track_name()
            if not track_name:
                track_name = (
                    weekend_info.get("TrackDisplayName")
                    or weekend_info.get("TrackDisplayShortName")
                    or weekend_info.get("TrackName")
                    or weekend_info.get("TrackConfigName")
                )
                if isinstance(track_name, str):
                    track_name = track_name.strip() or None
                else:
                    track_name = None

            track_id = weekend_info.get("TrackID")
            track_internal_name = weekend_info.get("TrackName")
            if isinstance(track_internal_name, str):
                track_internal_name = track_internal_name.strip() or None
            else:
                track_internal_name = None

            # Car positions are inexpensive to build and need to follow the
            # selected telemetry refresh rate. Standings remain throttled
            # because their gap/status enrichment is substantially heavier.
            live_track_map = self._build_track_map(
                drivers,
                car_positions,
                class_positions,
                lap_dist_pct,
                focus_car_idx,
                on_pit_road,
            )
            pit_service_flags = self._get_var("PitSvFlags", 0)
            pit_service_flags = pit_service_flags if isinstance(pit_service_flags, int) else 0
            player_car_name = player_driver.get("CarScreenName", "Unknown car")
            tire_usage = {
                "lf": self._get_var("LFTiresUsed"),
                "rf": self._get_var("RFTiresUsed"),
                "lr": self._get_var("LRTiresUsed"),
                "rr": self._get_var("RRTiresUsed"),
            }
            tire_change_estimates = self._update_tire_service_learning(
                player_car_name,
                session_time,
                bool(self._get_var("PitstopActive", False)),
                pit_service_flags,
                tire_usage,
            )
            now = time.monotonic()
            heavy_snapshot_key = (session_key, focus_car_idx, race_started)
            if (
                self._heavy_snapshot is None
                or self._heavy_snapshot_key != heavy_snapshot_key
                or now - self._heavy_snapshot_at >= 0.1
            ):
                standings = self._build_standings(
                    drivers,
                    lap_dist_pct,
                    focus_gap_values,
                    estimated_times,
                    laps_completed,
                    best_lap_times,
                    last_lap_times,
                    on_pit_road,
                    session_time,
                    focus_car_idx,
                    track_surface,
                    focus_tire_compound_values,
                    focus_rpm_values,
                    session_key,
                    race_started,
                )
                self._heavy_snapshot = {
                    "standings": standings,
                    "pit_exit_prediction": self._build_pit_exit_prediction(
                        standings,
                        live_track_map,
                        focus_car_idx,
                        self._estimate_next_pit_loss(
                            is_player_car,
                            pit_service_flags,
                            self._get_var("PitSvFuel", 0.0),
                        ),
                        driver_info.get("DriverCarEstLapTime"),
                    ),
                }
                self._heavy_snapshot_at = now
                self._heavy_snapshot_key = heavy_snapshot_key

            data = {
                "telemetry_tick": self._latest_tick_count,
                "focus_car_idx": focus_car_idx,
                "player_car_idx": player_car_idx,
                "is_player_car": is_player_car,
                "player_car_name": player_car_name,
                "player_class_name": player_class_name,
                "player_is_gtp": player_is_gtp,
                "session_key": session_key,
                "session_id": session_id,
                "subsession_id": subsession_id,
                "session_type": session_type,
                "session_state": session_state,
                "session_flags": session_flags,
                "race_started": race_started,
                "driver_count": len(drivers),
                "driver_name": driver.get("UserName") or driver.get("AbbrevName") or "Unknown driver",
                "car_number": driver.get("CarNumber", "--"),
                "car_name": driver.get("CarScreenName", "Unknown car"),
                "class_name": self._get_class_name(driver),
                "team_name": driver.get("TeamName", ""),
                "position": self._array_value(car_positions, focus_car_idx),
                "class_position": self._normalize_class_position(self._array_value(class_positions, focus_car_idx)),
                "lap_time": focused_last_lap,
                "best_lap_time": focused_best_lap,
                "laps_completed": focused_laps_completed,
                "lap_dist_pct": self._array_value(lap_dist_pct, focus_car_idx),
                "on_pit_road": self._array_value(on_pit_road, focus_car_idx, False),
                "track_surface": self._array_value(track_surface, focus_car_idx),
                "track_name": track_name,
                "track_id": track_id,
                "track_internal_name": track_internal_name,
                "focus_rpm": self._array_value(focus_rpm_values, focus_car_idx),
                "focus_gear": self._array_value(focus_gear_values, focus_car_idx),
                "focus_gap": self._array_value(focus_gap_values, focus_car_idx),
                "tire_compound": self._array_value(focus_tire_compound_values, focus_car_idx),
                "fast_repairs_used": self._array_value(focus_fast_repairs_values, focus_car_idx),
                "player_fast_repairs_used": player_fast_repairs_used,
                "fast_repairs_limit": weekend_options.get("FastRepairsLimit"),
                "fuel_level": fuel_level,
                "player_fuel_level": player_fuel_level,
                "player_fuel_use_per_hour": player_fuel_use_per_hour,
                "player_rpm": player_rpm,
                "fuel_capacity": fuel_capacity,
                "fuel_density": fuel_density,
                "rpm_limit": rpm_limit,
                "fuel_use_per_hour": player_fuel_use_per_hour if is_player_car else None,
                "weather": {
                    "air_temp": air_temp,
                    "track_temp": track_temp,
                    "humidity": humidity,
                    "precipitation": precipitation,
                    "wind_speed": wind_speed,
                    "wind_direction": wind_direction,
                    "track_wetness": track_wetness,
                    "skies": skies,
                    "weather_declared_wet": weather_declared_wet,
                    "weather_type": weather_type,
                    "date": weather_date,
                    "rain_state": rain_state,
                },
                "track_surface_code": track_surface_code,
                "track_status_description": self._describe_track_surface(
                    track_surface_code,
                    self._array_value(on_pit_road, focus_car_idx, False),
                ),
                "tire_wear": {
                    "lf": None,
                    "rf": None,
                    "lr": None,
                    "rr": None,
                },
                "tire_temperature": {"lf": None, "rf": None, "lr": None, "rr": None},
                "brake_temperature": {"lf": None, "rf": None, "lr": None, "rr": None},
                "tire_pressure": {"lf": None, "rf": None, "lr": None, "rr": None},
                "battery_voltage": None,
                "battery_soc": None,
                "engine_temperature": None,
                "session_time": session_time,
                "session_time_of_day": session_time_of_day,
                "replay_session_time": replay_session_time,
                "session_num": session_num,
                "is_replay_playing": is_replay_playing,
                "replay_play_speed": replay_play_speed,
                "current_lap": current_lap,
                "session_laps_total": session_laps_total,
                "session_laps_remain": session_laps_remain,
                "session_laps_remain_estimated": session_laps_remain_estimated,
                "session_time_remain": session_time_remain,
                "player_inputs": {
                    "speed_ms": self._get_var("Speed") if is_player_car else None,
                    "rpm": self._get_var("RPM") if is_player_car else None,
                    "gear": self._get_var("Gear") if is_player_car else None,
                    "throttle": self._get_var("Throttle") if is_player_car else None,
                    "brake": self._get_var("Brake") if is_player_car else None,
                    "clutch": self._get_var("Clutch") if is_player_car else None,
                    "steering_angle": self._get_var("SteeringWheelAngle") if is_player_car else None,
                },
                "standings": self._heavy_snapshot["standings"],
                "track_map": live_track_map,
                "pit_exit_prediction": self._heavy_snapshot["pit_exit_prediction"],
                "pit_tire_changes": {
                    "lf": bool(pit_service_flags & irsdk.PitSvFlags.lf_tire_change),
                    "rf": bool(pit_service_flags & irsdk.PitSvFlags.rf_tire_change),
                    "lr": bool(pit_service_flags & irsdk.PitSvFlags.lr_tire_change),
                    "rr": bool(pit_service_flags & irsdk.PitSvFlags.rr_tire_change),
                },
                "pit_windscreen_tearoff": bool(
                    pit_service_flags & irsdk.PitSvFlags.windshield_tearoff
                ),
                "tire_change_estimates": {
                    str(count): seconds
                    for count, seconds in tire_change_estimates.items()
                },
                "tire_change_estimate_source": "learned" if self._learned_tire_estimates.get(
                    self._tire_estimate_car_key(player_car_name)
                ) else "default",
            }

            # These scalar SDK channels always describe the player's car,
            # regardless of which car the camera currently follows. Car Status
            # is explicitly a player-car card, so keep it populated on camera changes.
            data["tire_wear"] = {
                "lf": self._get_var("LFwearL"),
                "rf": self._get_var("RFwearL"),
                "lr": self._get_var("LRwearL"),
                "rr": self._get_var("RRwearL"),
            }
            data["tire_temperature"] = {
                "lf": self._get_var("LFtempCM"),
                "rf": self._get_var("RFtempCM"),
                "lr": self._get_var("LRtempCM"),
                "rr": self._get_var("RRtempCM"),
            }
            data["brake_temperature"] = {
                "lf": self._get_var("LFbrakeTemp"),
                "rf": self._get_var("RFbrakeTemp"),
                "lr": self._get_var("LRbrakeTemp"),
                "rr": self._get_var("RRbrakeTemp"),
            }
            data["tire_pressure"] = {
                "lf": self._get_var("LFpressure"),
                "rf": self._get_var("RFpressure"),
                "lr": self._get_var("LRpressure"),
                "rr": self._get_var("RRpressure"),
            }
            data["battery_voltage"] = self._get_var("Voltage")
            data["battery_soc"] = self._get_var("EnergyERSBatteryPct")
            data["engine_temperature"] = self._get_var("WaterTemp")
            if data["engine_temperature"] is None:
                data["engine_temperature"] = self._get_var("OilTemp")

            return data
        finally:
            self.ir.unfreeze_var_buffer_latest()

    def is_connected(self):
        return self.connected and bool(self.ir.is_connected)
