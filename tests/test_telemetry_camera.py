import unittest

from race_engineer.telemetry import TelemetryReader


class FakeIRSDK:
    def __init__(self):
        self.calls = []

    def cam_switch_num(self, car_number, camera_group, camera_number):
        self.calls.append((car_number, camera_group, camera_number))
        return True

    def replay_search_session_time(self, session_num, session_time_ms):
        self.calls.append(("seek", session_num, session_time_ms))
        return True

    def replay_set_play_speed(self, speed, slow_motion):
        self.calls.append(("speed", speed, slow_motion))
        return True

    def replay_search(self, search_mode):
        self.calls.append(("search", search_mode))
        return True


class TelemetryReaderCameraTests(unittest.TestCase):
    def make_reader(self, values):
        reader = TelemetryReader.__new__(TelemetryReader)
        reader.connected = True
        reader.ir = FakeIRSDK()
        reader._replay_seek_timer = None
        reader._replay_start_timer = None
        reader._replay_timer = None
        reader._replay_timer_lock = __import__("threading").Lock()
        reader._event_replay_state = None
        reader._get_var = lambda name, default=None: values.get(name, default)
        return reader

    def test_switching_car_preserves_current_camera_angle(self):
        reader = self.make_reader({
            "CamGroupNumber": 4,
            "CamCameraNumber": 2,
        })

        switched = reader.focus_camera_on_car("09")

        self.assertTrue(switched)
        self.assertEqual(reader.ir.calls, [("09", 4, 2)])

    def test_switching_car_uses_safe_camera_defaults_when_values_are_invalid(self):
        reader = self.make_reader({
            "CamGroupNumber": None,
            "CamCameraNumber": -1,
        })

        reader.focus_camera_on_car("5")

        self.assertEqual(reader.ir.calls, [("5", 1, 0)])

    def test_event_replay_starts_five_seconds_before_and_runs_until_seven_seconds_after(self):
        reader = self.make_reader({
            "CamGroupNumber": 4,
            "CamCameraNumber": 2,
        })
        started = reader.play_event_replay("33", 2, 105.25)

        self.assertTrue(started)
        self.assertEqual(reader.ir.calls, [
            ("seek", 2, 100250),
            ("33", 4, 2),
        ])
        self.assertEqual(reader._event_replay_state, {
            "session_num": 2,
            "start": 100.25,
            "end": 112.25,
            "play_confirmed": False,
        })

    def test_event_replay_confirms_playback_without_sending_pause(self):
        reader = self.make_reader({})
        reader._event_replay_state = {
            "session_num": 2,
            "start": 100.25,
            "end": 112.25,
            "play_confirmed": False,
        }

        reader._update_event_replay_control(100.25, 0, 2)

        self.assertEqual(reader.ir.calls, [("speed", 1, False)])
        self.assertTrue(reader._event_replay_state["play_confirmed"])

    def test_stale_live_time_does_not_end_replay_before_seek_is_confirmed(self):
        reader = self.make_reader({})
        reader._event_replay_state = {
            "session_num": 2,
            "start": 100.25,
            "end": 112.25,
            "play_confirmed": False,
        }

        reader._update_event_replay_control(4063.0, 1, 2)

        self.assertEqual(reader.ir.calls, [])
        self.assertIsNotNone(reader._event_replay_state)
        self.assertFalse(reader._event_replay_state["play_confirmed"])

    def test_new_event_waits_until_seven_seconds_after_is_buffered(self):
        reader = self.make_reader({
            "SessionNum": 2,
            "SessionTime": 107.0,
        })
        scheduled = []
        reader._schedule_event_replay_seek = lambda *args: scheduled.append(args)

        started = reader.play_event_replay("33", 2, 105.25)

        self.assertTrue(started)
        self.assertEqual(reader.ir.calls, [])
        self.assertAlmostEqual(scheduled[0][0], 5.5)
        self.assertEqual(scheduled[0][1:], ("33", 2, 100250, 12.0))

    def test_event_replay_returns_to_live_at_normal_speed(self):
        reader = self.make_reader({})
        reader._event_replay_state = {
            "session_num": 2,
            "start": 100.25,
            "end": 112.25,
            "play_confirmed": True,
        }

        reader._update_event_replay_control(112.25, 1, 2)

        self.assertEqual(reader.ir.calls, [
            ("search", 1),
            ("speed", 1, False),
        ])
        self.assertIsNone(reader._event_replay_state)

    def test_race_event_scan_seeks_to_start_and_uses_fast_playback(self):
        reader = self.make_reader({})

        started = reader.start_race_event_scan(2)

        self.assertTrue(started)
        self.assertEqual(reader.ir.calls, [
            ("search", 0),
        ])


if __name__ == "__main__":
    unittest.main()
