import unittest

from race_engineer.telemetry import TelemetryReader


class FocusedSpeedTests(unittest.TestCase):
    def make_reader(self):
        reader = TelemetryReader.__new__(TelemetryReader)
        reader._focused_speed_sample = None
        reader._focused_speed_ms = None
        return reader

    def test_parses_iracing_track_length(self):
        self.assertEqual(TelemetryReader._track_length_metres("5.513 km"), 5513.0)
        self.assertAlmostEqual(
            TelemetryReader._track_length_metres("2.5 mi"),
            4023.36,
        )

    def test_estimates_speed_for_focused_camera_car(self):
        reader = self.make_reader()
        self.assertIsNone(reader._estimate_focused_speed(7, 0.10, 20.0, 5000))
        self.assertAlmostEqual(
            reader._estimate_focused_speed(7, 0.11, 21.0, 5000),
            50.0,
        )

    def test_handles_finish_line_and_resets_when_focus_changes(self):
        reader = self.make_reader()
        reader._estimate_focused_speed(7, 0.99, 20.0, 5000)
        self.assertAlmostEqual(
            reader._estimate_focused_speed(7, 0.01, 22.0, 5000),
            50.0,
        )
        self.assertIsNone(reader._estimate_focused_speed(8, 0.50, 23.0, 5000))


if __name__ == "__main__":
    unittest.main()
