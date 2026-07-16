import unittest

from iracing_results import IracingResultsImporter


class IracingResultsImporterTests(unittest.TestCase):
    def setUp(self):
        self.importer = IracingResultsImporter()

    @staticmethod
    def payload():
        return {
            "results": {
                "subsession_id": 4242,
                "start_time": "2026-07-15T10:00:00Z",
                "session_results": [],
            },
            "simsession_number": 0,
            "lap_chart_data": [
                {"group_id": 7, "cust_id": 101, "display_name": "First Driver", "car_number": "7", "lap_number": 1, "lap_position": 2, "session_time": 100000, "incident": False, "lap_events": []},
                {"group_id": 8, "cust_id": 201, "display_name": "Other Driver", "car_number": "8", "lap_number": 1, "lap_position": 1, "session_time": 100000, "incident": False, "lap_events": []},
                {"group_id": 7, "cust_id": 101, "display_name": "First Driver", "car_number": "7", "lap_number": 2, "lap_position": 1, "session_time": 200000, "incident": True, "lap_events": ["2x Contact"]},
                {"group_id": 8, "cust_id": 201, "display_name": "Other Driver", "car_number": "8", "lap_number": 2, "lap_position": 2, "session_time": 200000, "incident": False, "lap_events": []},
                {"group_id": 7, "cust_id": 102, "display_name": "Second Driver", "car_number": "7", "lap_number": 3, "lap_position": 1, "session_time": 300000, "incident": False, "lap_events": []},
            ],
            "event_log": [
                {"subsession_id": 4242, "simsession_number": 0, "event_seq": 9, "group_id": 7, "lap_number": 2, "session_time": 200000, "description": "2x Contact", "message": "Incident registered"},
            ],
        }

    def test_builds_position_swap_and_incident_events(self):
        session_key, events = self.importer.build_events(self.payload())

        self.assertEqual(session_key, "4242:0")
        self.assertEqual([event["type"] for event in events].count("pos"), 2)
        self.assertEqual([event["type"] for event in events].count("swap"), 1)
        self.assertEqual([event["type"] for event in events].count("inc"), 1)
        incident = next(event for event in events if event["type"] == "inc")
        self.assertEqual(incident["carNumber"], "7")
        self.assertEqual(incident["incidentPoints"], 2)
        self.assertEqual(incident["sessionTime"], 20.0)

    def test_ids_are_stable_across_reimport(self):
        _, first = self.importer.build_events(self.payload())
        _, second = self.importer.build_events(self.payload())

        self.assertEqual([event["id"] for event in first], [event["id"] for event in second])

    def test_rejects_payload_without_subsession(self):
        with self.assertRaisesRegex(ValueError, "subsession_id"):
            self.importer.build_events({"lap_chart_data": []})


if __name__ == "__main__":
    unittest.main()
