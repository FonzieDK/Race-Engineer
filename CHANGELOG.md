# Changelog

All notable changes to Race-Engineer are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-07-24

### Added

- Dedicated Car Setup - Pit and Fuel dashboard screens.
- Pit controls for tyres, supported compounds, target pressures, fuel and
  windscreen tear-off.
- Fuel strategy data with range, consumption, fuel-at-finish and recommended-add
  estimates.
- Independent always-on-top overlays for Overview, Leaderboard, Track Map and Pit
  Setup, including opacity, fullscreen and position-lock controls.
- Persistent user preferences for measurement units and dashboard refresh rate.
- Oil- and water-temperature history in the car-status view.
- Track-rubber and expanded live weather information.
- Automated linting, formatting and test checks for local development and CI.

### Changed

- Refined the Overview, Track Map, pit-exit and focused-car layouts.
- Improved focused-car speed, pit status and leaderboard telemetry.
- Bound the local control API explicitly to `127.0.0.1`.
- Made background start with Windows configurable in settings.

### Fixed

- Track-map direction, focus visibility, switching and follow-map zoom behaviour.
- Pit-exit map rendering and pit-command handling.
- UI and server-side input validation.

## [1.1.0] - 2026-07-16

### Added

- Windows MSI installer and direct latest-release download.
- Real-time Overview, Leaderboard and Track Map dashboards.
- Live iRacing telemetry through a local Python service.
- Multi-class standings, race-event collection, saved events and replay playback.
- Background event collector with persistent SQLite event storage.
- Official iRacing track maps, live car positions, pit-exit prediction and weather.

[Unreleased]: https://github.com/FonzieDK/Race-Engineer/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/FonzieDK/Race-Engineer/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/FonzieDK/Race-Engineer/releases/tag/v1.1.0
