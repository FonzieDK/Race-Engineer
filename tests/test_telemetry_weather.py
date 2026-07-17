import math
import unittest

from race_engineer.telemetry import TelemetryReader


class TelemetryReaderWeatherTests(unittest.TestCase):
    def test_relative_humidity_ratio_is_returned_as_percent(self):
        self.assertAlmostEqual(TelemetryReader._humidity_percent(0.42), 42.0)
        self.assertEqual(TelemetryReader._humidity_percent(65.0), 65.0)

    def test_wind_direction_radians_are_returned_as_degrees(self):
        self.assertAlmostEqual(TelemetryReader._wind_direction_degrees(0.0), 0.0)
        self.assertAlmostEqual(TelemetryReader._wind_direction_degrees(math.pi), 180.0)

    def test_precipitation_ratio_is_returned_as_clamped_percent(self):
        self.assertAlmostEqual(TelemetryReader._precipitation_percent(0.42), 42.0)
        self.assertEqual(TelemetryReader._precipitation_percent(65.0), 65.0)
        self.assertEqual(TelemetryReader._precipitation_percent(150.0), 100.0)
        self.assertIsNone(TelemetryReader._precipitation_percent(None))


if __name__ == "__main__":
    unittest.main()
