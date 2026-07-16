import tempfile
import unittest
from pathlib import Path

from event_store import EventStore
from race_event_tracker import RaceEventTracker
from replay_event_scanner import ReplayEventScanner


class FakeReplayReader:
    def __init__(self):
        self.calls = []

    def start_race_event_scan(self, session_num, speed):
        self.calls.append(("scan", session_num, speed))
        return True

    def set_replay_play_speed(self, speed):
        self.calls.append(("speed", speed))
        return True


class ReplayEventScannerTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.store = EventStore(Path(self.temp_dir.name) / "events.db")
        self.tracker = RaceEventTracker(self.store)
        self.scanner = ReplayEventScanner(self.store, self.tracker, enabled=True)
        self.reader = FakeReplayReader()

    def tearDown(self):
        self.temp_dir.cleanup()

    @staticmethod
    def telemetry(replay_time, session_key="race-1", speed=1):
        return {
            "session_key": session_key,
            "session_num": 2,
            "race_started": True,
            "is_replay_playing": True,
            "replay_session_time": replay_time,
            "replay_play_speed": speed,
        }

    def test_empty_replay_is_scanned_from_start_and_restores_speed(self):
        started = self.scanner.update(self.telemetry(100.0, speed=2), self.reader)
        scanning = self.scanner.update(self.telemetry(0.5, speed=16), self.reader)
        completed = self.scanner.update(self.telemetry(99.5, speed=16), self.reader)

        self.assertEqual(started["status"], "seeking")
        self.assertEqual(scanning["status"], "scanning")
        self.assertEqual(completed["status"], "complete")
        self.assertEqual(self.reader.calls, [
            ("scan", 2, 16),
            ("speed", 16),
            ("speed", 2),
        ])

    def test_existing_current_race_history_is_not_scanned(self):
        self.store.add({
            "id": "existing",
            "sessionKey": "race-1",
            "type": "pos",
        })

        status = self.scanner.update(self.telemetry(100.0), self.reader)

        self.assertEqual(status["status"], "idle")
        self.assertEqual(self.reader.calls, [])

    def test_scanner_is_disabled_by_default_and_does_not_control_iracing(self):
        scanner = ReplayEventScanner(self.store, self.tracker)

        status = scanner.update(self.telemetry(100.0), self.reader)

        self.assertEqual(status["status"], "disabled")
        self.assertEqual(self.reader.calls, [])


if __name__ == "__main__":
    unittest.main()
