import unittest

from race_engineer.events.reconstructor import EventReconstructor


class EventReconstructorTests(unittest.TestCase):
    @staticmethod
    def snapshot(position_a=2, position_b=1, incidents=0):
        return {
            "session_key": "4242:0",
            "session_num": 0,
            "session_time": 20,
            "current_lap": 2,
            "standings": [
                {"car_idx": 7, "car_number": "7", "position": position_a,
                 "driver_id": 1, "driver_name": "A", "incident_count": incidents,
                 "laps_completed": 1},
                {"car_idx": 8, "car_number": "8", "position": position_b,
                 "driver_id": 2, "driver_name": "B", "incident_count": 0,
                 "laps_completed": 1},
            ],
        }

    def test_live_and_history_generate_identical_position_ids(self):
        live = EventReconstructor()
        history = EventReconstructor()
        live.process(self.snapshot(), "iracing-sdk")
        history.process(self.snapshot(), "iracing-results-lap-chart")

        live_events = live.process(self.snapshot(1, 2), "iracing-sdk")
        history_events = history.process(self.snapshot(1, 2), "iracing-results-lap-chart")

        self.assertEqual({event["id"] for event in live_events},
                         {event["id"] for event in history_events})
        self.assertEqual(
            {event["groupId"] for event in live_events},
            {"4242:0-pos-2-20.000-7-8"},
        )

    def test_repeated_position_change_on_same_lap_creates_new_events(self):
        reconstructor = EventReconstructor()
        reconstructor.process(self.snapshot(), "iracing-sdk")

        first_swap = self.snapshot(1, 2)
        first_swap["session_time"] = 20.5
        first_events = reconstructor.process(first_swap, "iracing-sdk")

        second_swap = self.snapshot(2, 1)
        second_swap["session_time"] = 21.0
        reconstructor.process(second_swap, "iracing-sdk")
        third_swap = self.snapshot(1, 2)
        third_swap["session_time"] = 21.5
        repeated_events = reconstructor.process(third_swap, "iracing-sdk")

        self.assertEqual(len(first_events), 2)
        self.assertEqual(len(repeated_events), 2)
        self.assertTrue(
            {event["id"] for event in first_events}.isdisjoint(
                {event["id"] for event in repeated_events}
            )
        )
        self.assertNotEqual(first_events[0]["groupId"], repeated_events[0]["groupId"])

    def test_position_loss_does_not_create_an_incident(self):
        reconstructor = EventReconstructor()
        reconstructor.process(self.snapshot(), "iracing-sdk")
        events = reconstructor.process(self.snapshot(4, 1), "iracing-sdk")

        self.assertEqual({event["type"] for event in events}, {"pos"})

    def test_position_chain_is_not_merged_into_one_large_group(self):
        reconstructor = EventReconstructor()
        baseline = self.snapshot()
        baseline["standings"].append({
            "car_idx": 9, "car_number": "9", "position": 3,
            "driver_id": 3, "driver_name": "C", "incident_count": 0,
            "laps_completed": 1,
        })
        reconstructor.process(baseline, "iracing-sdk")

        changed = self.snapshot(position_a=3, position_b=2)
        changed["standings"].append({
            "car_idx": 9, "car_number": "9", "position": 1,
            "driver_id": 3, "driver_name": "C", "incident_count": 0,
            "laps_completed": 1,
        })
        events = reconstructor.process(changed, "iracing-sdk")

        self.assertEqual(len(events), 3)
        self.assertEqual({event["groupId"] for event in events}, {None})

    def test_grouped_position_events_use_the_same_highest_lap(self):
        reconstructor = EventReconstructor()
        baseline = self.snapshot()
        reconstructor.process(baseline, "iracing-sdk")

        changed = self.snapshot(1, 2)
        changed["standings"][0]["laps_completed"] = 4
        changed["standings"][1]["laps_completed"] = 3
        events = reconstructor.process(changed, "iracing-sdk")

        self.assertEqual({event["lap"] for event in events}, {5})

    def test_event_contains_portable_schema_aliases(self):
        reconstructor = EventReconstructor()
        reconstructor.process(self.snapshot(), "iracing-sdk")
        event = reconstructor.process(self.snapshot(1, 2), "iracing-sdk")[0]

        self.assertEqual(event["raceId"], "4242:0")
        self.assertIn("fromPosition", event)
        self.assertIn("toPosition", event)
        self.assertIn("timestamp", event)
        self.assertEqual(event["source"], "iracing-sdk")


if __name__ == "__main__":
    unittest.main()
