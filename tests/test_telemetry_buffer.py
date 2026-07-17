import unittest

from race_engineer.telemetry import TelemetryReader


class FakeBuffer:
    def __init__(self, tick_count):
        self.tick_count = tick_count
        self.frozen = False

    def freeze(self):
        self.frozen = True


class FakeIRSDK:
    def __init__(self):
        self._header = type("Header", (), {})()
        self._header.var_buf = [FakeBuffer(8), FakeBuffer(12), FakeBuffer(10)]
        self._IRSDK__var_buffer_latest = None
        self.unfreeze_calls = 0
        self.blocking_freeze_calls = 0

    def unfreeze_var_buffer_latest(self):
        self.unfreeze_calls += 1

    def freeze_var_buffer_latest(self):
        self.blocking_freeze_calls += 1


class TelemetryBufferTests(unittest.TestCase):
    def test_freezes_newest_completed_buffer_without_waiting_for_next_tick(self):
        reader = TelemetryReader()
        reader.ir = FakeIRSDK()

        reader._freeze_latest_var_buffer_without_wait()

        self.assertEqual(reader.ir.unfreeze_calls, 1)
        self.assertEqual(reader.ir.blocking_freeze_calls, 0)
        self.assertEqual(reader.ir._IRSDK__var_buffer_latest.tick_count, 12)
        self.assertTrue(reader.ir._IRSDK__var_buffer_latest.frozen)
        self.assertEqual(reader._latest_tick_count, 12)


if __name__ == "__main__":
    unittest.main()
