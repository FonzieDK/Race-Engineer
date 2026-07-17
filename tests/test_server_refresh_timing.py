import unittest
from unittest.mock import patch

import race_engineer.server as server


class ServerRefreshTimingTests(unittest.TestCase):
    def test_processing_time_counts_towards_refresh_period(self):
        self.assertAlmostEqual(
            server.refresh_wait_seconds(10.0, 1 / 60, now=10.010),
            (1 / 60) - 0.010,
        )

    def test_slow_processing_does_not_add_another_full_delay(self):
        self.assertEqual(
            server.refresh_wait_seconds(10.0, 1 / 60, now=10.025),
            0.0,
        )

    def test_windows_timer_resolution_is_enabled_and_released(self):
        class FakeWinMM:
            def __init__(self):
                self.begin_calls = []
                self.end_calls = []

            def timeBeginPeriod(self, milliseconds):
                self.begin_calls.append(milliseconds)
                return 0

            def timeEndPeriod(self, milliseconds):
                self.end_calls.append(milliseconds)
                return 0

        fake = FakeWinMM()
        fake_windll = type("FakeWindll", (), {"winmm": fake})()
        server.high_resolution_timer_enabled = False
        with patch.object(server.ctypes, "windll", fake_windll, create=True):
            self.assertTrue(server.enable_high_resolution_timer())
            server.disable_high_resolution_timer()
        self.assertEqual(fake.begin_calls, [1])
        self.assertEqual(fake.end_calls, [1])


if __name__ == "__main__":
    unittest.main()
