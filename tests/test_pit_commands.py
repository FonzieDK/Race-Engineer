import unittest
import json
import tempfile
from pathlib import Path

import irsdk

from race_engineer.telemetry import TelemetryReader


class FakeIRSDK:
    def __init__(self, values=None):
        self.is_connected = True
        self.values = values or {}
        self.commands = []

    def __getitem__(self, name):
        return self.values.get(name)

    def pit_command(self, mode, value=0):
        self.commands.append((mode, value))
        return True


class PitCommandTests(unittest.TestCase):
    def make_reader(self, values=None):
        reader = TelemetryReader()
        reader.ir = FakeIRSDK(values)
        reader.connected = True
        reader._var_names = set((values or {}).keys())
        return reader

    def test_enabling_lf_sends_the_specific_iracing_command(self):
        reader = self.make_reader()

        self.assertTrue(reader.set_tire_change("lf", True))

        self.assertEqual(reader.ir.commands, [(irsdk.PitCommandMode.lf, 0)])

    def test_enabling_lr_sends_the_specific_iracing_command(self):
        reader = self.make_reader()

        self.assertTrue(reader.set_tire_change("lr", True))

        self.assertEqual(reader.ir.commands, [(irsdk.PitCommandMode.lr, 0)])

    def test_enabling_rf_sends_the_specific_iracing_command(self):
        reader = self.make_reader()

        self.assertTrue(reader.set_tire_change("rf", True))

        self.assertEqual(reader.ir.commands, [(irsdk.PitCommandMode.rf, 0)])

    def test_enabling_rr_sends_the_specific_iracing_command(self):
        reader = self.make_reader()

        self.assertTrue(reader.set_tire_change("rr", True))

        self.assertEqual(reader.ir.commands, [(irsdk.PitCommandMode.rr, 0)])

    def test_enabling_all_sends_each_tire_command(self):
        reader = self.make_reader()

        self.assertTrue(reader.set_tire_change("all", True))

        self.assertEqual(reader.ir.commands, [
            (irsdk.PitCommandMode.lf, 0),
            (irsdk.PitCommandMode.rf, 0),
            (irsdk.PitCommandMode.lr, 0),
            (irsdk.PitCommandMode.rr, 0),
        ])

    def test_disabling_all_clears_every_tire(self):
        reader = self.make_reader()

        self.assertTrue(reader.set_tire_change("all", False))

        self.assertEqual(reader.ir.commands, [
            (irsdk.PitCommandMode.clear_tires, 0),
        ])

    def test_disabling_lf_preserves_the_other_selected_tires(self):
        reader = self.make_reader({
            "dpLFTireChange": 1.0,
            "dpRFTireChange": 1.0,
            "dpLRTireChange": 0.0,
            "dpRRTireChange": 1.0,
            "PitSvFlags": 0,
        })

        self.assertTrue(reader.set_tire_change("lf", False))

        self.assertEqual(reader.ir.commands, [
            (irsdk.PitCommandMode.clear_tires, 0),
            (irsdk.PitCommandMode.rf, 0),
            (irsdk.PitCommandMode.rr, 0),
        ])

    def test_command_is_rejected_when_iracing_is_disconnected(self):
        reader = self.make_reader()
        reader.connected = False

        self.assertFalse(reader.set_tire_change("lf", True))
        self.assertEqual(reader.ir.commands, [])

    def test_enabling_windscreen_tearoff_sends_iracing_ws_command(self):
        reader = self.make_reader()

        self.assertTrue(reader.set_windscreen_tearoff(True))

        self.assertEqual(reader.ir.commands, [(irsdk.PitCommandMode.ws, 0)])

    def test_disabling_windscreen_tearoff_sends_clear_ws_command(self):
        reader = self.make_reader()

        self.assertTrue(reader.set_windscreen_tearoff(False))

        self.assertEqual(reader.ir.commands, [(irsdk.PitCommandMode.clear_ws, 0)])

    def test_selecting_dry_compound_requests_all_four_tires(self):
        reader = self.make_reader()

        self.assertTrue(reader.set_tire_compound("dry"))

        self.assertEqual(reader.ir.commands, [
            (irsdk.PitCommandMode.tc, 0),
            (irsdk.PitCommandMode.lf, 0),
            (irsdk.PitCommandMode.rf, 0),
            (irsdk.PitCommandMode.lr, 0),
            (irsdk.PitCommandMode.rr, 0),
        ])

    def test_selecting_wet_compound_requests_all_four_tires(self):
        reader = self.make_reader()

        self.assertTrue(reader.set_tire_compound("wet"))

        self.assertEqual(reader.ir.commands, [
            (irsdk.PitCommandMode.tc, 1),
            (irsdk.PitCommandMode.lf, 0),
            (irsdk.PitCommandMode.rf, 0),
            (irsdk.PitCommandMode.lr, 0),
            (irsdk.PitCommandMode.rr, 0),
        ])

    def test_compound_command_uses_the_cars_reported_tire_indices(self):
        reader = self.make_reader({
            "DriverInfo": {
                "DriverTires": [
                    {"TireIndex": 4, "TireCompoundType": "Wet"},
                    {"TireIndex": 7, "TireCompoundType": "Dry"},
                ],
            },
        })

        self.assertTrue(reader.set_tire_compound("dry"))

        self.assertEqual(
            reader.ir.commands[0],
            (irsdk.PitCommandMode.tc, 7),
        )

    def test_pit_fuel_rounds_up_for_a_safe_iracing_command(self):
        reader = self.make_reader()

        sent, liters = reader.set_pit_fuel(12.1)

        self.assertTrue(sent)
        self.assertEqual(liters, 13)
        self.assertEqual(reader.ir.commands, [(irsdk.PitCommandMode.fuel, 13)])

    def test_zero_pit_fuel_clears_the_selected_fuel(self):
        reader = self.make_reader()

        sent, liters = reader.set_pit_fuel(0)

        self.assertTrue(sent)
        self.assertEqual(liters, 0)
        self.assertEqual(reader.ir.commands, [(irsdk.PitCommandMode.clear_fuel, 0)])

    def test_invalid_pit_fuel_is_rejected(self):
        reader = self.make_reader()

        with self.assertRaises(ValueError):
            reader.set_pit_fuel(-0.1)
        with self.assertRaises(ValueError):
            reader.set_pit_fuel(float("nan"))

    def test_tire_service_time_is_learned_and_persisted_per_car_and_count(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            estimate_path = Path(temporary_directory) / "tire-estimates.json"
            reader = TelemetryReader(
                tire_change_seconds=20.0,
                tire_estimate_path=estimate_path,
            )
            flags = (
                irsdk.PitSvFlags.lf_tire_change
                | irsdk.PitSvFlags.rf_tire_change
            )

            reader._update_tire_service_learning(
                "Test Car", 100.0, False, flags,
                {"lf": 0, "rf": 0, "lr": 0, "rr": 0},
            )
            reader._update_tire_service_learning(
                "Test Car", 101.0, True, 0,
                {"lf": 0, "rf": 0, "lr": 0, "rr": 0},
            )
            estimates = reader._update_tire_service_learning(
                "Test Car", 108.5, True, 0,
                {"lf": 1, "rf": 1, "lr": 0, "rr": 0},
            )

            self.assertEqual(estimates[2], 7.5)
            self.assertEqual(
                json.loads(estimate_path.read_text(encoding="utf-8"))["test car"]["2"],
                {"samples": 1, "seconds": 7.5},
            )
            reloaded = TelemetryReader(
                tire_change_seconds=20.0,
                tire_estimate_path=estimate_path,
            )
            self.assertEqual(reloaded._estimates_for_car("Test Car")[2], 7.5)


if __name__ == "__main__":
    unittest.main()
