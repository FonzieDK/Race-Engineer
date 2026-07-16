import unittest

import irsdk

from telemetry import TelemetryReader


class TelemetryReaderRaceStateTests(unittest.TestCase):
    def test_spectator_live_edge_is_not_treated_as_historical_replay(self):
        self.assertFalse(TelemetryReader._is_historical_replay(True, 598.0, 597.0))
        self.assertTrue(TelemetryReader._is_historical_replay(True, 598.0, 400.0))

    def test_session_key_prefers_subsession_id(self):
        reader = TelemetryReader()
        self.assertEqual(reader._get_session_key(123, 456, 2), "456:2")

    def test_session_key_falls_back_to_session_id_when_subsession_is_zero(self):
        reader = TelemetryReader()
        self.assertEqual(reader._get_session_key(123, 0, 2), "123:2")

    def test_session_key_does_not_reuse_zero_id_between_reader_instances(self):
        first_reader = TelemetryReader()
        second_reader = TelemetryReader()

        first_key = first_reader._get_session_key(0, 0, 0)
        second_key = second_reader._get_session_key(0, 0, 0)

        self.assertNotEqual(first_key, second_key)
        self.assertTrue(first_key.startswith("local-"))

    def test_race_is_locked_during_parade_laps(self):
        self.assertFalse(TelemetryReader._race_has_started("Race", irsdk.SessionState.parade_laps, 0))

    def test_race_starts_when_session_enters_racing_state(self):
        self.assertTrue(TelemetryReader._race_has_started("Race", irsdk.SessionState.racing, 0))

    def test_green_flag_starts_race(self):
        self.assertTrue(TelemetryReader._race_has_started("Race", None, irsdk.Flags.green))

    def test_start_go_signal_starts_race(self):
        self.assertTrue(TelemetryReader._race_has_started("Race", None, irsdk.Flags.start_go))

    def test_non_race_session_never_enables_race_events(self):
        self.assertFalse(TelemetryReader._race_has_started("Practice", irsdk.SessionState.racing, irsdk.Flags.green))

    def test_timed_race_lap_count_uses_leader_progress(self):
        reader = TelemetryReader()
        current, total, remaining, estimated = reader._get_race_lap_count(
            {"SessionLaps": "unlimited"},
            leader_laps_completed=30,
            leader_lap_progress=0.5,
            leader_best_lap=120.0,
            leader_last_lap=121.0,
            session_time_remain=600.0,
            session_flags=irsdk.Flags.green,
        )
        self.assertEqual(current, 31)
        self.assertEqual(total, 37)
        self.assertEqual(remaining, 7)
        self.assertTrue(estimated)

    def test_white_flag_locks_total_to_leaders_current_lap(self):
        reader = TelemetryReader()
        current, total, remaining, estimated = reader._get_race_lap_count(
            {"SessionLaps": "unlimited"},
            leader_laps_completed=35,
            leader_lap_progress=0.02,
            leader_best_lap=120.0,
            leader_last_lap=121.0,
            session_time_remain=0.0,
            session_flags=irsdk.Flags.white,
        )
        self.assertEqual((current, total, remaining, estimated), (36, 36, 1, False))

    def test_fixed_lap_race_keeps_scheduled_total(self):
        reader = TelemetryReader()
        current, total, remaining, estimated = reader._get_race_lap_count(
            {"SessionLaps": "60"},
            leader_laps_completed=30,
            leader_lap_progress=0.5,
            leader_best_lap=120.0,
            leader_last_lap=121.0,
            session_time_remain=600.0,
            session_flags=irsdk.Flags.green,
        )
        self.assertEqual((current, total, remaining, estimated), (31, 60, 30, False))


if __name__ == "__main__":
    unittest.main()
