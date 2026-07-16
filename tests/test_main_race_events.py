import unittest

from race_engineer import server as main


class CurrentRaceSessionTests(unittest.TestCase):
    def setUp(self):
        with main.state_lock:
            self.original_telemetry = main.state.telemetry

    def tearDown(self):
        with main.state_lock:
            main.state.telemetry = self.original_telemetry

    def test_returns_key_for_started_race(self):
        with main.state_lock:
            main.state.telemetry = {
                "session_key": "subsession-42:3",
                "race_started": True,
            }

        self.assertEqual(main.current_race_session_key(), "subsession-42:3")

    def test_returns_none_before_green_flag(self):
        with main.state_lock:
            main.state.telemetry = {
                "session_key": "subsession-42:3",
                "race_started": False,
            }

        self.assertIsNone(main.current_race_session_key())

    def test_returns_none_without_telemetry(self):
        with main.state_lock:
            main.state.telemetry = None

        self.assertIsNone(main.current_race_session_key())


if __name__ == "__main__":
    unittest.main()
