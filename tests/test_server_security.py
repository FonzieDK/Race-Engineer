import io
import unittest
from http import HTTPStatus

from race_engineer.server import MAX_JSON_BODY_BYTES, RaceEngineerHandler


class ServerSecurityTests(unittest.TestCase):
    def test_json_body_limit_is_enforced_before_reading(self):
        handler = object.__new__(RaceEngineerHandler)
        handler.headers = {"Content-Length": str(MAX_JSON_BODY_BYTES + 1)}
        handler.rfile = io.BytesIO()
        with self.assertRaises(OverflowError):
            handler._read_json_body()

    def test_send_json_accepts_an_http_status(self):
        handler = object.__new__(RaceEngineerHandler)
        handler.wfile = io.BytesIO()
        statuses = []
        handler.send_response = statuses.append
        handler.send_header = lambda *_args: None
        handler.end_headers = lambda: None
        handler._send_json({"ok": False}, HTTPStatus.BAD_REQUEST)
        self.assertEqual(statuses, [HTTPStatus.BAD_REQUEST])


if __name__ == "__main__":
    unittest.main()
