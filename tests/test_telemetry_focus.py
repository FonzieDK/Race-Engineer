import unittest

from telemetry import TelemetryReader


class TelemetryReaderFocusTests(unittest.TestCase):
    def make_reader(self, drivers):
        reader = TelemetryReader.__new__(TelemetryReader)
        reader._drivers = drivers

        def get_driver_info(car_idx):
            for driver in reader._drivers:
                if driver.get("CarIdx") == car_idx:
                    return driver
            return {}

        reader._get_driver_info = get_driver_info
        reader.ir = {"DriverInfo": {"Drivers": drivers}}
        return reader

    def test_prefers_camera_car_when_available(self):
        reader = self.make_reader([
            {"CarIdx": 3, "UserName": "Camera Driver"},
            {"CarIdx": 7, "UserName": "Player Driver"},
        ])
        self.assertEqual(reader._select_focus_car_idx(3, 7), 3)

    def test_falls_back_to_player_car_when_camera_missing(self):
        reader = self.make_reader([
            {"CarIdx": 7, "UserName": "Player Driver"},
        ])
        self.assertEqual(reader._select_focus_car_idx(None, 7), 7)

    def test_falls_back_to_player_car_when_camera_driver_invalid(self):
        reader = self.make_reader([
            {"CarIdx": 3, "UserName": "Pace Car", "CarIsPaceCar": 1},
            {"CarIdx": 7, "UserName": "Player Driver"},
        ])
        self.assertEqual(reader._select_focus_car_idx(3, 7), 7)


if __name__ == "__main__":
    unittest.main()
