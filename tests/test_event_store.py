import tempfile
import unittest
from pathlib import Path

from event_store import EventStore


class EventStoreTests(unittest.TestCase):
    def test_fallback_session_identity_survives_store_recreation(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            database_path = Path(temp_dir) / "events.db"
            first = EventStore(database_path).resolve_fallback_session_id(
                0, 120.0, True
            )
            second = EventStore(database_path).resolve_fallback_session_id(
                0, 125.0, True
            )

            self.assertEqual(first, second)

    def test_fallback_session_adopts_latest_legacy_events(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            database_path = Path(temp_dir) / "events.db"
            store = EventStore(database_path)
            store.add({
                "id": "legacy-event",
                "sessionKey": "local-existing:0",
                "type": "pos",
                "createdAt": 5000,
            })

            restored_id = EventStore(database_path).resolve_fallback_session_id(
                0, 125.0, True
            )

            self.assertEqual(restored_id, "local-existing")

    def test_new_local_race_gets_a_new_fallback_identity(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = EventStore(Path(temp_dir) / "events.db")
            previous = store.resolve_fallback_session_id(0, 900.0, True)
            current = store.resolve_fallback_session_id(0, 2.0, True)

            self.assertNotEqual(previous, current)

    def test_replay_seek_keeps_the_same_fallback_identity(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = EventStore(Path(temp_dir) / "events.db")
            before_seek = store.resolve_fallback_session_id(0, 900.0, True, True)
            after_seek = store.resolve_fallback_session_id(0, 2.0, True, True)

            self.assertEqual(before_seek, after_seek)

    def test_last_pit_lap_survives_store_recreation(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            database_path = Path(temp_dir) / "events.db"
            EventStore(database_path).save_last_pit_lap("123:0", 7, 12)

            restored_store = EventStore(database_path)

            self.assertEqual(restored_store.get_last_pit_lap("123:0", 7), 12)
            self.assertIsNone(restored_store.get_last_pit_lap("other:0", 7))

    def test_last_pit_duration_survives_store_recreation(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            database_path = Path(temp_dir) / "events.db"
            store = EventStore(database_path)
            store.save_last_pit_duration("123:0", 7, 12, 30.25)

            restored_store = EventStore(database_path)

            self.assertEqual(restored_store.get_last_pit_duration("123:0", 7), 30.25)
            self.assertEqual(restored_store.get_last_pit_lap("123:0", 7), 12)

    def test_existing_pit_history_table_is_migrated_for_duration(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            database_path = Path(temp_dir) / "events.db"
            import sqlite3

            connection = sqlite3.connect(database_path)
            try:
                connection.execute(
                    """
                    CREATE TABLE pit_history (
                        session_key TEXT NOT NULL,
                        car_idx INTEGER NOT NULL,
                        last_pit_lap INTEGER NOT NULL,
                        PRIMARY KEY (session_key, car_idx)
                    )
                    """
                )
                connection.execute(
                    "INSERT INTO pit_history VALUES (?, ?, ?)",
                    ("123:0", 7, 12),
                )
                connection.commit()
            finally:
                connection.close()

            store = EventStore(database_path)
            store.save_last_pit_duration("123:0", 7, 12, 28.5)

            self.assertEqual(store.get_last_pit_duration("123:0", 7), 28.5)

    def test_events_survive_store_recreation_and_keep_latest_first(self):
        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "sql" / "events.db"
            store = EventStore(database)
            store.add({
                "id": "older",
                "sessionKey": "race-1",
                "type": "pos",
                "carNumber": "12",
                "lap": 4,
                "oldPosition": 3,
                "position": 2,
                "createdAt": 1000,
            })
            store.add({
                "id": "newer",
                "sessionKey": "race-1",
                "type": "swap",
                "carNumber": "7",
                "lap": 5,
                "oldPosition": 2,
                "position": 1,
                "createdAt": 2000,
            })

            reloaded = EventStore(database).all("race-1")

            self.assertEqual([event["id"] for event in reloaded], ["newer", "older"])
            self.assertEqual(reloaded[0]["carNumber"], "7")
            self.assertTrue(database.exists())

    def test_duplicate_event_id_is_only_stored_once(self):
        with tempfile.TemporaryDirectory() as directory:
            store = EventStore(Path(directory) / "events.db")
            event = {
                "id": "same",
                "sessionKey": "race-1",
                "type": "pos",
                "createdAt": 1000,
            }

            store.add(event)
            store.add(event)

            self.assertEqual(len(store.all()), 1)

    def test_starting_a_new_session_preserves_events_from_previous_session(self):
        with tempfile.TemporaryDirectory() as directory:
            store = EventStore(Path(directory) / "events.db")
            store.add({"id": "one", "sessionKey": "race-1", "type": "pos"})
            store.add({"id": "two", "sessionKey": "race-2", "type": "pos"})

            self.assertEqual([event["id"] for event in store.all("race-2")], ["two"])
            self.assertEqual([event["id"] for event in store.all("race-1")], ["one"])

    def test_starting_a_new_session_preserves_previous_pit_history(self):
        with tempfile.TemporaryDirectory() as directory:
            store = EventStore(Path(directory) / "events.db")
            store.save_last_pit_duration("race-1", 7, 12, 30.25)

            store.activate_session("race-2")

            self.assertEqual(store.get_last_pit_lap("race-1", 7), 12)
            self.assertEqual(store.get_last_pit_duration("race-1", 7), 30.25)

    def test_clear_session_removes_only_the_requested_session(self):
        with tempfile.TemporaryDirectory() as directory:
            store = EventStore(Path(directory) / "events.db")
            store.add({"id": "one", "sessionKey": "race-1", "type": "pos"})

            store.clear_session("race-1")

            self.assertEqual(store.all("race-1"), [])

    def test_driver_swap_names_are_persisted(self):
        with tempfile.TemporaryDirectory() as directory:
            store = EventStore(Path(directory) / "events.db")
            store.add({
                "id": "driver-swap",
                "sessionKey": "race-1",
                "type": "swap",
                "carNumber": "7",
                "lap": "42",
                "oldDriver": "First Driver",
                "newDriver": "Second Driver",
                "createdAt": 3000,
            })

            event = store.all("race-1")[0]
            self.assertEqual(event["oldDriver"], "First Driver")
            self.assertEqual(event["newDriver"], "Second Driver")

    def test_incident_points_and_total_are_persisted(self):
        with tempfile.TemporaryDirectory() as directory:
            store = EventStore(Path(directory) / "events.db")
            store.add({
                "id": "incident",
                "sessionKey": "race-1",
                "type": "inc",
                "carNumber": "9",
                "lap": "12",
                "incidentPoints": 4,
                "incidentTotal": 8,
                "createdAt": 4000,
            })

            event = store.all("race-1")[0]
            self.assertEqual(event["incidentPoints"], 4)
            self.assertEqual(event["incidentTotal"], 8)

    def test_overtake_group_is_persisted(self):
        with tempfile.TemporaryDirectory() as directory:
            store = EventStore(Path(directory) / "events.db")
            store.add({
                "id": "position-change",
                "sessionKey": "race-1",
                "type": "pos",
                "carNumber": "10",
                "lap": "24",
                "oldPosition": 14,
                "position": 13,
                "groupId": "overtake-10-6",
                "createdAt": 5000,
            })

            self.assertEqual(store.all("race-1")[0]["groupId"], "overtake-10-6")

    def test_replay_timing_is_persisted(self):
        with tempfile.TemporaryDirectory() as directory:
            store = EventStore(Path(directory) / "events.db")
            store.add({
                "id": "replay-event",
                "sessionKey": "race-1",
                "type": "inc",
                "carNumber": "33",
                "lap": "18",
                "sessionNum": 2,
                "sessionTime": 1542.75,
            })

            event = store.all("race-1")[0]
            self.assertEqual(event["sessionNum"], 2)
            self.assertEqual(event["sessionTime"], 1542.75)

    def test_import_description_is_persisted(self):
        with tempfile.TemporaryDirectory() as directory:
            store = EventStore(Path(directory) / "events.db")
            store.add({
                "id": "official-event",
                "sessionKey": "race-1",
                "type": "inc",
                "description": "2x Contact",
            })

            self.assertEqual(store.all("race-1")[0]["description"], "2x Contact")

    def test_live_and_imported_position_events_are_semantically_equivalent(self):
        with tempfile.TemporaryDirectory() as directory:
            store = EventStore(Path(directory) / "events.db")
            store.add({
                "id": "live-id",
                "sessionKey": "race-1",
                "type": "pos",
                "carNumber": "7",
                "lap": 12,
                "oldPosition": 3,
                "position": 2,
            })

            self.assertTrue(store.has_equivalent({
                "id": "official-id",
                "sessionKey": "race-1",
                "type": "pos",
                "carNumber": "7",
                "lap": 12,
                "oldPosition": 3,
                "position": 2,
            }))


if __name__ == "__main__":
    unittest.main()
