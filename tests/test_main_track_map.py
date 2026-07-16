import unittest
from unittest.mock import patch

from race_engineer import server as main


ACTIVE_SVG = """<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
<style>.st0{fill:#fff}</style><path class="st0" d="M10 10 L100 10 L100 100 Z M20 20 Z"/>
</svg>"""

LAYER_SVG = """<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
<path d="M10 10 L20 20"/>
</svg>"""


class OfficialTrackMapTests(unittest.TestCase):
    def setUp(self):
        main._official_track_svg_cache.clear()

    def test_invalid_track_metadata_uses_fallback(self):
        self.assertIsNone(main.build_official_track_svg(None, "spa 2024 combined"))
        self.assertIsNone(main.build_official_track_svg(525, None))

    def test_builds_exact_layout_url_and_dashboard_svg(self):
        requested_urls = []

        def fetch(url, timeout=4.0):
            requested_urls.append(url)
            return ACTIVE_SVG if url.endswith("/active.svg") else LAYER_SVG

        with patch.object(main, "_find_iracing_track_folder", return_value="spa"), patch.object(
            main, "_fetch_text", side_effect=fetch
        ):
            svg = main.build_official_track_svg(525, "spa 2024 combined")

        expected_base = (
            "https://members-assets.iracing.com/public/track-maps/"
            "tracks_spa/525-spa-2024-combined"
        )
        self.assertEqual(requested_urls[0], f"{expected_base}/active.svg")
        self.assertIn('viewBox="0 0 1920 1080"', svg)
        self.assertIn('id="track-path"', svg)
        self.assertIn('d="M10 10 L100 10 L100 100 Z"', svg)
        self.assertIn('id="track-path-inner"', svg)
        self.assertIn('d="M20 20 Z"', svg)
        self.assertIn('id="track-map-cars"', svg)

    def test_successful_map_is_cached_by_track_layout(self):
        with patch.object(main, "_find_iracing_track_folder", return_value="spa"), patch.object(
            main, "_fetch_text", return_value=ACTIVE_SVG
        ) as fetch:
            first = main.build_official_track_svg(525, "spa 2024 combined")
            second = main.build_official_track_svg(525, "spa 2024 combined")

        self.assertEqual(first, second)
        self.assertEqual(fetch.call_count, 5)


if __name__ == "__main__":
    unittest.main()
