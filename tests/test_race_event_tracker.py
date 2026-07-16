import tempfile
import unittest
from pathlib import Path

from race_engineer.events.store import EventStore
from race_engineer.events.tracker import RaceEventTracker


class RaceEventTrackerTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.store = EventStore(Path(self.temp_dir.name) / "events.db")
        self.tracker = RaceEventTracker(self.store)

    def tearDown(self):
        self.temp_dir.cleanup()

    @staticmethod
    def snapshot(session_key="race-1", session_time=10.0, standings=None):
        return {
            "session_key": session_key,
            "race_started": True,
            "session_num": 0,
            "session_time": session_time,
            "replay_session_time": session_time,
            "is_replay_playing": False,
            "current_lap": 5,
            "standings": standings or [],
        }

    @staticmethod
    def car(
        car_idx,
        number,
        position,
        driver_id=1,
        driver="Driver",
        incidents=0,
        lap_dist_pct=None,
    ):
        return {
            "car_idx": car_idx,
            "car_number": number,
            "position": position,
            "driver_id": driver_id,
            "driver_name": driver,
            "incident_count": incidents,
            "laps_completed": 4,
            "lap_dist_pct": (
                lap_dist_pct if lap_dist_pct is not None else 0.5 - position * 0.01
            ),
            "class_id": 1,
            "is_on_pit_road": False,
        }

    def test_first_snapshot_establishes_baseline_without_fake_events(self):
        events = self.tracker.process(self.snapshot(
            standings=[self.car(1, "10", 1), self.car(2, "20", 2)],
        ))

        self.assertEqual(events, [])
        self.assertEqual(self.store.all("race-1"), [])

    def test_position_swap_creates_grouped_events_for_both_cars(self):
        self.tracker.process(self.snapshot(
            standings=[self.car(1, "10", 1), self.car(2, "20", 2)],
        ))
        events = self.tracker.process(self.snapshot(
            session_time=11.0,
            standings=[self.car(1, "10", 2), self.car(2, "20", 1)],
        ))

        self.assertEqual(len(events), 2)
        self.assertEqual({event["type"] for event in events}, {"pos"})
        self.assertEqual(len({event["groupId"] for event in events}), 1)
        self.assertEqual(len(self.store.all("race-1")), 2)
        self.assertEqual({event["source"] for event in events}, {"iracing-sdk-track-pass"})
        self.assertTrue(all(10.0 < event["sessionTime"] < 11.0 for event in events))

    def test_finish_line_position_update_without_physical_pass_is_not_an_event(self):
        self.tracker.process(self.snapshot(
            standings=[
                self.car(1, "10", 1, lap_dist_pct=0.60),
                self.car(2, "20", 2, lap_dist_pct=0.50),
            ],
        ))

        events = self.tracker.process(self.snapshot(
            session_time=11.0,
            standings=[
                self.car(1, "10", 2, lap_dist_pct=0.61),
                self.car(2, "20", 1, lap_dist_pct=0.51),
            ],
        ))

        self.assertEqual(events, [])

    def test_repeated_position_swap_on_same_lap_is_persisted(self):
        first = [self.car(1, "10", 1), self.car(2, "20", 2)]
        second = [self.car(1, "10", 2), self.car(2, "20", 1)]
        self.tracker.process(self.snapshot(standings=first))
        self.tracker.process(self.snapshot(session_time=11.0, standings=second))
        self.tracker.process(self.snapshot(session_time=12.0, standings=first))
        self.tracker.process(self.snapshot(session_time=13.0, standings=second))

        events = self.store.all("race-1")
        self.assertEqual(len(events), 6)
        self.assertEqual(len({event["groupId"] for event in events}), 3)

    def test_driver_swap_and_incident_are_recorded(self):
        self.tracker.process(self.snapshot(standings=[
            self.car(1, "10", 1, driver_id=7, driver="First", incidents=2),
        ]))
        events = self.tracker.process(self.snapshot(session_time=12.0, standings=[
            self.car(1, "10", 1, driver_id=8, driver="Second", incidents=6),
        ]))

        self.assertEqual({event["type"] for event in events}, {"swap", "inc"})
        incident = next(event for event in events if event["type"] == "inc")
        self.assertEqual(incident["incidentPoints"], 4)
        self.assertEqual(incident["incidentTotal"], 6)

    def test_new_race_preserves_previous_race_and_starts_with_clean_baseline(self):
        self.tracker.process(self.snapshot(
            standings=[self.car(1, "10", 1), self.car(2, "20", 2)],
        ))
        self.tracker.process(self.snapshot(
            session_time=11.0,
            standings=[self.car(1, "10", 2), self.car(2, "20", 1)],
        ))
        self.assertEqual(len(self.store.all("race-1")), 2)

        events = self.tracker.process(self.snapshot(
            session_key="race-2",
            session_time=1.0,
            standings=[self.car(1, "10", 1), self.car(2, "20", 2)],
        ))

        self.assertEqual(events, [])
        self.assertEqual(len(self.store.all("race-1")), 2)
        self.assertEqual(self.store.all("race-2"), [])

    def test_replay_does_not_capture_new_events_or_delete_live_history(self):
        live_baseline = self.snapshot(
            session_time=8.0,
            standings=[self.car(1, "10", 1), self.car(2, "20", 2)],
        )
        self.tracker.process(live_baseline)
        self.tracker.process(self.snapshot(
            session_time=9.0,
            standings=[self.car(1, "10", 2), self.car(2, "20", 1)],
        ))
        self.assertEqual(len(self.store.all("race-1")), 2)

        baseline = self.snapshot(
            session_time=100.0,
            standings=[self.car(1, "10", 1), self.car(2, "20", 2)],
        )
        baseline["is_replay_playing"] = True
        baseline["replay_session_time"] = 10.0
        self.assertEqual(self.tracker.process(baseline), [])
        changed = self.snapshot(
            session_time=101.0,
            standings=[self.car(1, "10", 2), self.car(2, "20", 1)],
        )
        changed["is_replay_playing"] = True
        changed["replay_session_time"] = 11.0
        self.assertEqual(self.tracker.process(changed), [])

        seeked = self.snapshot(
            session_time=102.0,
            standings=[self.car(1, "10", 1), self.car(2, "20", 2)],
        )
        seeked["is_replay_playing"] = True
        seeked["replay_session_time"] = 3.0
        self.assertEqual(self.tracker.process(seeked), [])
        self.assertEqual(len(self.store.all("race-1")), 2)

    def test_spectator_live_edge_still_captures_physical_overtake(self):
        baseline = self.snapshot(
            session_time=50.0,
            standings=[self.car(1, "10", 1), self.car(2, "20", 2)],
        )
        baseline["is_replay_playing"] = True
        baseline["replay_session_time"] = 49.0
        self.tracker.process(baseline)

        changed = self.snapshot(
            session_time=51.0,
            standings=[self.car(1, "10", 2), self.car(2, "20", 1)],
        )
        changed["is_replay_playing"] = True
        changed["replay_session_time"] = 50.0

        events = self.tracker.process(changed)

        self.assertEqual(len(events), 2)
        self.assertEqual({event["source"] for event in events}, {"iracing-sdk-track-pass"})


if __name__ == "__main__":
    unittest.main()
