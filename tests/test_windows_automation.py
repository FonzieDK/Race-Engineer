import subprocess
import unittest
from unittest.mock import patch

from race_engineer.windows_automation import invoke_iracing_leave_seat, invoke_iracing_take_seat


class WindowsAutomationTests(unittest.TestCase):
    @patch("race_engineer.windows_automation.subprocess.run")
    def test_leave_seat_runs_encoded_powershell_automation(self, run):
        run.return_value = subprocess.CompletedProcess([], 0, "invoked\n", "")

        self.assertTrue(invoke_iracing_leave_seat())

        command = run.call_args.args[0]
        self.assertEqual(command[:3], ["powershell.exe", "-NoProfile", "-NonInteractive"])
        self.assertIn("-EncodedCommand", command)

    @patch("race_engineer.windows_automation.subprocess.run")
    def test_take_seat_runs_encoded_powershell_automation(self, run):
        run.return_value = subprocess.CompletedProcess([], 0, "invoked\n", "")

        self.assertTrue(invoke_iracing_take_seat())

        command = run.call_args.args[0]
        self.assertEqual(command[:3], ["powershell.exe", "-NoProfile", "-NonInteractive"])
        self.assertIn("-EncodedCommand", command)

    @patch("race_engineer.windows_automation._click_take_seat_at_relative_position")
    @patch("race_engineer.windows_automation.subprocess.run")
    def test_take_seat_uses_visual_fallback_when_control_is_not_accessible(self, run, click):
        run.return_value = subprocess.CompletedProcess([], 2, "", "not found")
        click.return_value = True

        self.assertTrue(invoke_iracing_take_seat())
        click.assert_called_once_with()

    @patch("race_engineer.windows_automation._click_take_seat_at_relative_position")
    @patch("race_engineer.windows_automation.subprocess.run")
    def test_take_seat_reports_when_both_methods_fail(self, run, click):
        run.return_value = subprocess.CompletedProcess([], 2, "", "not found")
        click.return_value = False

        with self.assertRaisesRegex(RuntimeError, "was not found"):
            invoke_iracing_take_seat()


if __name__ == "__main__":
    unittest.main()
