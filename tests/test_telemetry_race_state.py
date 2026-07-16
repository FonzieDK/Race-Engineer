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


if __name__ == "__main__":
    unittest.main()
