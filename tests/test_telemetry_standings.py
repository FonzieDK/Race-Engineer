import unittest

from telemetry import TelemetryReader


class TelemetryReaderStandingsTests(unittest.TestCase):
    def make_reader(self, results):
        reader = TelemetryReader.__new__(TelemetryReader)
        reader._pit_history = {}
        reader._car_presence_history = {}
        reader._get_current_session = lambda: {"ResultsPositions": results}
        return reader

    def test_keeps_complete_field_so_every_class_is_available(self):
        drivers = []
        results = []
        for index in range(30):
            class_name = "GT3" if index < 25 else "GT4"
            drivers.append({
                "CarIdx": index,
                "CarClassID": 10 if class_name == "GT3" else 20,
                "CarClassShortName": class_name,
                "CarNumber": str(index + 1),
                "UserName": f"Driver {index + 1}",
            })
            results.append({
                "CarIdx": index,
                "Position": index + 1,
                "ClassPosition": index if class_name == "GT3" else index - 25,
                "LastTime": 90.0,
                "Time": float(index),
            })

        reader = self.make_reader(results)
        standings = reader._build_standings(
            drivers=drivers,
            lap_dist_pct=[0.5] * 30,
            relative_times=[0.0] * 30,
            estimated_times=[0.0] * 30,
            laps_completed_values=[1] * 30,
            best_lap_times=[89.0] * 30,
            last_lap_times=[90.0] * 30,
            on_pit_road_values=[False] * 30,
            session_time=100.0,
            focus_car_idx=0,
        )

        self.assertEqual(len(standings), 30)
        self.assertEqual({entry["class_name"] for entry in standings}, {"GT3", "GT4"})

    def test_fallback_positions_do_not_rotate_when_a_car_crosses_finish_line(self):
        drivers = [
            {"CarIdx": 0, "CarNumber": "1", "UserName": "Just crossed"},
            {"CarIdx": 1, "CarNumber": "2", "UserName": "Approaching line"},
        ]
        reader = self.make_reader([])

        standings = reader._build_standings(
            drivers=drivers,
            lap_dist_pct=[0.01, 0.99],
            relative_times=[0.0, 0.0],
            estimated_times=[0.0, 0.0],
            laps_completed_values=[1, 0],
            best_lap_times=[89.0, 89.0],
            last_lap_times=[90.0, 90.0],
            on_pit_road_values=[False, False],
            session_time=100.0,
            focus_car_idx=0,
        )

        self.assertEqual([entry["car_number"] for entry in standings], ["1", "2"])
        self.assertEqual([entry["position"] for entry in standings], [1, 2])

    def test_pre_race_grid_does_not_move_before_green(self):
        drivers = [
            {"CarIdx": 0, "CarClassID": 10, "CarNumber": "1", "UserName": "First"},
            {"CarIdx": 1, "CarClassID": 10, "CarNumber": "2", "UserName": "Second"},
        ]
        results = [
            {"CarIdx": 0, "Position": 1, "ClassPosition": 0},
            {"CarIdx": 1, "Position": 2, "ClassPosition": 1},
        ]
        reader = self.make_reader(results)

        def build(race_started):
            return reader._build_standings(
                drivers=drivers,
                lap_dist_pct=[0.5, 0.4],
                relative_times=[0.0, 0.0],
                estimated_times=[0.0, 0.0],
                laps_completed_values=[0, 0],
                best_lap_times=[89.0, 89.0],
                last_lap_times=[-1.0, -1.0],
                on_pit_road_values=[False, False],
                session_time=10.0,
                focus_car_idx=0,
                session_key="race:0",
                race_started=race_started,
            )

        self.assertEqual([item["car_number"] for item in build(False)], ["1", "2"])
        results[0]["Position"], results[1]["Position"] = 2, 1
        results[0]["ClassPosition"], results[1]["ClassPosition"] = 1, 0

        locked = build(False)
        self.assertEqual([item["car_number"] for item in locked], ["1", "2"])
        self.assertEqual([item["class_position"] for item in locked], [1, 2])
        self.assertEqual([item["car_number"] for item in build(True)], ["2", "1"])

    def test_pre_race_grid_prefers_stable_qualifying_order(self):
        class FakeIr:
            def __getitem__(self, name):
                if name == "QualifyResultsInfo":
                    return {"Results": [
                        {"CarIdx": 0, "Position": 0},
                        {"CarIdx": 1, "Position": 1},
                    ]}
                return None

        drivers = [
            {"CarIdx": 0, "CarClassID": 10, "CarNumber": "1"},
            {"CarIdx": 1, "CarClassID": 10, "CarNumber": "2"},
        ]
        reader = self.make_reader([
            {"CarIdx": 0, "Position": 2, "ClassPosition": 1},
            {"CarIdx": 1, "Position": 1, "ClassPosition": 0},
        ])
        reader.ir = FakeIr()

        standings = reader._build_standings(
            drivers=drivers,
            lap_dist_pct=[0.1, 0.2],
            relative_times=[0.0, 0.0],
            estimated_times=[0.0, 0.0],
            laps_completed_values=[0, 0],
            best_lap_times=[89.0, 89.0],
            last_lap_times=[-1.0, -1.0],
            on_pit_road_values=[False, False],
            session_time=10.0,
            focus_car_idx=0,
            session_key="race:0",
            race_started=False,
        )

        self.assertEqual([item["car_number"] for item in standings], ["1", "2"])

    def test_includes_team_name_for_each_standing(self):
        drivers = [{
            "CarIdx": 0,
            "CarNumber": "7",
            "TeamName": "Example Racing",
            "UserName": "Example Driver",
        }]
        results = [{
            "CarIdx": 0,
            "Position": 1,
            "ClassPosition": 0,
            "LastTime": 90.0,
        }]
        reader = self.make_reader(results)

        standings = reader._build_standings(
            drivers=drivers,
            lap_dist_pct=[0.5],
            relative_times=[0.0],
            estimated_times=[0.0],
            laps_completed_values=[1],
            best_lap_times=[89.0],
            last_lap_times=[90.0],
            on_pit_road_values=[False],
            session_time=100.0,
            focus_car_idx=0,
            tire_compound_values=[2],
        )

        self.assertEqual(standings[0]["team_name"], "Example Racing")
        self.assertEqual(standings[0]["driver_name"], "Example Driver")
        self.assertEqual(standings[0]["tire_compound"], 2)

    def test_infers_multiclass_names_when_iracing_omits_them(self):
        drivers = [
            {"CarIdx": 0, "CarClassID": 4029, "CarScreenName": "Acura ARX-06"},
            {"CarIdx": 1, "CarClassID": 2708, "CarScreenName": "BMW M4 GT3 EVO"},
            {"CarIdx": 2, "CarClassID": 9999, "CarScreenName": "Mystery race car"},
        ]
        results = [
            {"CarIdx": index, "Position": index + 1, "ClassPosition": 0, "LastTime": 90.0}
            for index in range(3)
        ]

        reader = self.make_reader(results)
        standings = reader._build_standings(
            drivers=drivers,
            lap_dist_pct=[0.5] * 3,
            relative_times=[0.0] * 3,
            estimated_times=[0.0] * 3,
            laps_completed_values=[1] * 3,
            best_lap_times=[89.0] * 3,
            last_lap_times=[90.0] * 3,
            on_pit_road_values=[False] * 3,
            session_time=100.0,
            focus_car_idx=0,
        )

        self.assertEqual(
            [entry["class_name"] for entry in standings],
            ["GTP", "GT3", "--"],
        )

    def test_porsche_cup_is_not_mislabeled_as_gt3(self):
        self.assertEqual(
            TelemetryReader._get_class_name({"CarScreenName": "Porsche 911 GT3 Cup (992)"}),
            "Porsche Cup",
        )

    def test_incident_count_prefers_the_highest_valid_iracing_count(self):
        self.assertEqual(
            TelemetryReader._get_incident_count({
                "CurDriverIncidentCount": 4,
                "TeamIncidentCount": 8,
            }),
            8,
        )
        self.assertIsNone(TelemetryReader._get_incident_count({}))

    def test_interval_reports_lap_difference_to_car_ahead(self):
        drivers = [
            {"CarIdx": 0, "CarNumber": "1", "UserName": "Leader"},
            {"CarIdx": 1, "CarNumber": "2", "UserName": "Lapped car"},
        ]
        results = [
            {"CarIdx": 0, "Position": 1, "ClassPosition": 0, "LastTime": 90.0},
            {"CarIdx": 1, "Position": 2, "ClassPosition": 1, "LastTime": 90.0},
        ]
        reader = self.make_reader(results)

        standings = reader._build_standings(
            drivers=drivers,
            lap_dist_pct=[0.5, 0.5],
            relative_times=[0.0, 0.0],
            estimated_times=[0.0, 0.0],
            laps_completed_values=[12, 10],
            best_lap_times=[89.0, 89.0],
            last_lap_times=[90.0, 90.0],
            on_pit_road_values=[False, False],
            session_time=100.0,
            focus_car_idx=0,
        )

        self.assertIsNone(standings[0]["interval_laps_ahead"])
        self.assertEqual(standings[1]["interval_laps_ahead"], 2)

    def test_class_gap_reports_laps_only_when_more_than_one_lap_behind(self):
        drivers = [
            {"CarIdx": 0, "CarClassID": 10, "CarNumber": "1", "UserName": "Leader"},
            {"CarIdx": 1, "CarClassID": 10, "CarNumber": "2", "UserName": "One lap back"},
            {"CarIdx": 2, "CarClassID": 10, "CarNumber": "3", "UserName": "Two laps back"},
        ]
        results = [
            {"CarIdx": 0, "Position": 1, "ClassPosition": 0, "LastTime": 90.0},
            {"CarIdx": 1, "Position": 2, "ClassPosition": 1, "LastTime": 90.0},
            {"CarIdx": 2, "Position": 3, "ClassPosition": 2, "LastTime": 90.0},
        ]
        reader = self.make_reader(results)

        standings = reader._build_standings(
            drivers=drivers,
            lap_dist_pct=[0.6, 0.5, 0.4],
            relative_times=[0.0, 0.0, 0.0],
            estimated_times=[0.0, 0.0, 0.0],
            laps_completed_values=[12, 11, 10],
            best_lap_times=[89.0, 89.0, 89.0],
            last_lap_times=[90.0, 90.0, 90.0],
            on_pit_road_values=[False, False, False],
            session_time=100.0,
            focus_car_idx=0,
        )

        self.assertIsNone(standings[0]["class_gap_laps"])
        self.assertEqual(standings[1]["class_gap_laps"], 1)
        self.assertEqual(standings[2]["class_gap_laps"], 2)

    def test_car_status_distinguishes_retired_garage_and_pit_road(self):
        self.assertEqual(TelemetryReader._get_car_status(False, 3, "Mechanical"), "retired")
        self.assertEqual(TelemetryReader._get_car_status(False, -1, "Running"), "garage")
        self.assertEqual(TelemetryReader._get_car_status(True, 1, "Running"), "pit")
        self.assertEqual(TelemetryReader._get_car_status(False, 3, "Running"), "track")

    def test_track_map_marks_cars_on_pit_road(self):
        reader = self.make_reader([])
        track_map = reader._build_track_map(
            drivers=[
                {"CarIdx": 0, "CarNumber": "10", "UserName": "On track"},
                {"CarIdx": 1, "CarNumber": "20", "UserName": "In pit"},
            ],
            positions=[1, 2],
            class_positions=[0, 1],
            lap_dist_pct=[0.4, 0.5],
            focus_car_idx=0,
            on_pit_road=[False, True],
        )

        self.assertFalse(track_map["cars"][0]["is_on_pit_road"])
        self.assertTrue(track_map["cars"][1]["is_on_pit_road"])

    def test_vacant_car_changes_from_pit_road_to_garage_after_one_minute(self):
        reader = self.make_reader([])

        first_seen = reader._get_timed_car_status(7, True, 1, 100.0, 300, session_key="race:0")
        after_one_minute = reader._get_timed_car_status(7, True, 1, 160.0, 300, session_key="race:0")
        over_one_minute = reader._get_timed_car_status(7, True, 1, 160.1, 300, session_key="race:0")

        self.assertEqual(first_seen, "pit")
        self.assertEqual(after_one_minute, "pit")
        self.assertEqual(over_one_minute, "garage")

    def test_driver_return_resets_the_garage_timer(self):
        reader = self.make_reader([])

        reader._get_timed_car_status(7, True, 1, 100.0, 300, session_key="race:0")
        occupied = reader._get_timed_car_status(7, True, 1, 150.0, 3000, session_key="race:0")
        vacant_again = reader._get_timed_car_status(7, True, 1, 200.0, 300, session_key="race:0")

        self.assertEqual(occupied, "pit")
        self.assertEqual(vacant_again, "pit")

    def test_laps_since_pit_remains_available_after_leaving_pit(self):
        reader = self.make_reader([])

        in_pit = reader._update_pit_status(7, True, 100.0, 12, "session:0")
        after_pit = reader._update_pit_status(7, False, 130.0, 12, "session:0")
        two_laps_later = reader._update_pit_status(7, False, 310.0, 14, "session:0")

        self.assertEqual(in_pit["laps_since_pit"], 0)
        self.assertEqual(after_pit["laps_since_pit"], 0)
        self.assertEqual(two_laps_later["laps_since_pit"], 2)

    def test_pit_duration_is_restored_by_a_new_reader(self):
        class PitStore:
            def __init__(self):
                self.lap = None
                self.duration = None

            def get_last_pit_lap(self, session_key, car_idx):
                return self.lap

            def save_last_pit_lap(self, session_key, car_idx, lap):
                self.lap = lap

            def get_last_pit_duration(self, session_key, car_idx):
                return self.duration

            def save_last_pit_duration(self, session_key, car_idx, lap, duration):
                self.lap = lap
                self.duration = duration

        store = PitStore()
        reader = self.make_reader([])
        reader._pit_store = store
        reader._update_pit_status(7, True, 100.0, 12, "session:0")
        completed = reader._update_pit_status(7, False, 130.25, 12, "session:0")

        restored_reader = self.make_reader([])
        restored_reader._pit_store = store
        restored = restored_reader._update_pit_status(
            7, False, 140.0, 12, "session:0"
        )

        self.assertEqual(completed["pit_duration"], 30.25)
        self.assertEqual(restored["pit_duration"], 30.25)

    def test_pit_exit_prediction_advances_traffic_and_predicts_position(self):
        reader = self.make_reader([])
        reader._pit_loss_seconds = 25.0
        standings = [
            {
                "car_idx": 0, "car_number": "1", "position": 1, "laps_completed": 10,
                "lap_dist_pct": 0.50, "best_lap_time": 100.0,
                "lap_time": 101.0, "car_status": "track",
            },
            {
                "car_idx": 1, "car_number": "2", "position": 2, "laps_completed": 10,
                "lap_dist_pct": 0.40, "best_lap_time": 100.0,
                "lap_time": 101.0, "car_status": "track",
            },
            {
                "car_idx": 2, "car_number": "3", "position": 3, "laps_completed": 10,
                "lap_dist_pct": 0.20, "best_lap_time": 100.0,
                "lap_time": 101.0, "car_status": "track",
            },
        ]
        track_map = {"cars": [
            {"car_idx": 0, "car_number": "1", "lap_dist_pct": 0.50, "focused": True},
            {"car_idx": 1, "car_number": "2", "lap_dist_pct": 0.40, "focused": False},
            {"car_idx": 2, "car_number": "3", "lap_dist_pct": 0.20, "focused": False},
        ]}

        prediction = reader._build_pit_exit_prediction(standings, track_map, 0)

        self.assertEqual(prediction["position"], 2)
        self.assertEqual(prediction["pit_loss_seconds"], 25.0)
        cars = {car["car_idx"]: car for car in prediction["cars"]}
        self.assertEqual(cars[0]["lap_dist_pct"], 0.50)
        self.assertEqual(cars[1]["lap_dist_pct"], 0.40)
        self.assertAlmostEqual(cars["pit-exit-0"]["lap_dist_pct"], 0.25)
        self.assertTrue(cars["pit-exit-0"]["pit_exit"])
        self.assertTrue(cars[0]["focused"])
        self.assertEqual(prediction["car_ahead"]["car_number"], "2")
        self.assertEqual(prediction["car_behind"]["car_number"], "3")
        self.assertEqual(prediction["car_ahead"]["position"], 1)
        self.assertEqual(prediction["car_behind"]["position"], 3)

    def test_pit_exit_traffic_uses_post_stop_positions_at_back_of_field(self):
        reader = self.make_reader([])
        reader._pit_loss_seconds = 25.0
        standings = [
            {
                "car_idx": car_idx,
                "car_number": str(car_idx + 1),
                "position": car_idx + 1,
                "laps_completed": 4 if car_idx < 5 else 3,
                "lap_dist_pct": (0.30 - (car_idx * 0.02)) if car_idx < 5 else (0.75 - ((car_idx - 5) * 0.015)),
                "best_lap_time": 145.0,
                "car_status": "track",
            }
            for car_idx in range(16)
        ]
        # The focused P7 loses enough time to rejoin last. The live P16 car
        # becomes P15 when P7 pits, so the message must say "after P15".
        standings[6]["lap_dist_pct"] = 0.73
        track_map = {"cars": [
            {
                "car_idx": item["car_idx"],
                "car_number": item["car_number"],
                "lap_dist_pct": item["lap_dist_pct"],
            }
            for item in standings
        ]}

        prediction = reader._build_pit_exit_prediction(standings, track_map, 6)

        self.assertEqual(prediction["position"], 16)
        self.assertEqual(prediction["car_ahead"]["car_number"], "16")
        self.assertEqual(prediction["car_ahead"]["position"], 15)
        self.assertIsNone(prediction["car_behind"])

    def test_pit_exit_prediction_ignores_retired_cars_in_running_order(self):
        reader = self.make_reader([])
        reader._pit_loss_seconds = 25.0
        standings = [
            {"car_idx": 0, "laps_completed": 10, "lap_dist_pct": 0.50,
             "best_lap_time": 100.0, "car_status": "track"},
            {"car_idx": 1, "laps_completed": 10, "lap_dist_pct": 0.49,
             "best_lap_time": 100.0, "car_status": "retired"},
        ]

        prediction = reader._build_pit_exit_prediction(
            standings,
            {"cars": [{"car_idx": 0}, {"car_idx": 1}]},
            0,
        )

        self.assertEqual(prediction["position"], 1)

    def test_pit_exit_prediction_uses_estimated_time_before_first_timed_lap(self):
        reader = self.make_reader([])
        reader._pit_loss_seconds = 25.0
        standings = [
            {
                "car_idx": 0, "laps_completed": 0, "lap_dist_pct": 0.50,
                "best_lap_time": -1.0, "lap_time": -1.0, "car_status": "track",
            },
            {
                "car_idx": 1, "laps_completed": 0, "lap_dist_pct": 0.10,
                "best_lap_time": -1.0, "lap_time": -1.0, "car_status": "track",
            },
        ]
        track_map = {"cars": [
            {"car_idx": 0, "car_number": "1", "lap_dist_pct": 0.50},
            {"car_idx": 1, "car_number": "2", "lap_dist_pct": 0.10},
        ]}

        prediction = reader._build_pit_exit_prediction(
            standings,
            track_map,
            0,
            estimated_lap_time=100.0,
        )

        cars = {car["car_idx"]: car for car in prediction["cars"]}
        self.assertAlmostEqual(cars["pit-exit-0"]["lap_dist_pct"], 0.25)

    def test_pit_exit_prediction_rejects_negative_focused_lap_time(self):
        reader = self.make_reader([])
        reader._pit_loss_seconds = 25.0
        standings = [
            {
                "car_idx": 0, "laps_completed": 10, "lap_dist_pct": 0.50,
                "best_lap_time": -1.0, "lap_time": -1.0, "car_status": "track",
            },
            {
                "car_idx": 1, "laps_completed": 10, "lap_dist_pct": 0.40,
                "best_lap_time": 100.0, "lap_time": 101.0, "car_status": "track",
            },
        ]
        track_map = {"cars": [
            {"car_idx": 0, "car_number": "1", "lap_dist_pct": 0.50},
            {"car_idx": 1, "car_number": "2", "lap_dist_pct": 0.40},
        ]}

        prediction = reader._build_pit_exit_prediction(standings, track_map, 0)

        cars = {car["car_idx"]: car for car in prediction["cars"]}
        self.assertAlmostEqual(cars["pit-exit-0"]["lap_dist_pct"], 0.25)

    def test_next_pit_loss_uses_selected_fuel_and_tires(self):
        reader = self.make_reader([])
        reader._pit_loss_seconds = 25.0
        reader._fuel_fill_rate_lps = 2.0
        reader._tire_change_seconds = 20.0
        flags = (
            0x01 | 0x02 | 0x04 | 0x08 | 0x10
        )

        prediction = reader._estimate_next_pit_loss(True, flags, 50.0)

        self.assertEqual(prediction["fuel_seconds"], 25.0)
        self.assertEqual(prediction["tire_seconds"], 20.0)
        self.assertEqual(prediction["service_seconds"], 25.0)
        self.assertEqual(prediction["pit_loss_seconds"], 50.0)
        self.assertEqual(prediction["tire_count"], 4)


if __name__ == "__main__":
    unittest.main()
