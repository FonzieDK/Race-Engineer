# Race-Engineer

Race-Engineer is an Electron desktop app for real-time iRacing telemetry with a Python backend.

## Download

[Download **Race-Engineer.msi**](https://github.com/FonzieDK/Race-Engineer/releases/latest/download/Race-Engineer.msi)

## Requirements

- Windows 10 or 11 (64-bit)
- iRacing installed
- iRacing running when live telemetry is required

The MSI installer includes Electron, Node.js, and the Python runtime. Installed users
do not need to install these tools separately.

## Windows MSI installer

Build a 64-bit Windows installer from PowerShell:

```powershell
npm run make:msi
```

The build requires Python, Node.js LTS, and WiX Toolset 3.14 on the build PC. The
finished `.msi` is written below `out/make/`. Installed users do not need Python,
Node.js, Electron, or WiX. The installer creates Start-menu and desktop shortcuts.
Writable configuration, logs, and the event database are stored below the current
user's `%APPDATA%\Race-Engineer` directory rather than in `Program Files`.

To save local changes to GitHub, double-click `commit_to_github.bat`. Enter a commit
message, or press Enter to use the default. The script commits the changes, synchronizes
with `main`, and pushes them to `FonzieDK/Race-Engineer`.

The event collector keeps running after the Race-Engineer window is closed. It reads the local
iRacing SDK feed and stores events in `sql/events.db`, so closing the browser or Electron does
not interrupt collection. Its single-instance lock prevents duplicate collectors. The first
normal launch registers a collector-only Windows login start, so later reboots restart data
collection without opening the Race-Engineer window.

## OVERVIEW

### Features

- Live session information, including time remaining, in-game time, lap count, and track name
- Focused driver and car details with class position, completed laps, lap progress, gear, RPM, and speed
- Live race-engineering and strategy alerts
- Per-corner tyre temperatures, pressures, and wear with colour-coded status indicators
- Per-corner brake temperatures plus engine-temperature and RPM monitoring
- Live fuel level with an estimated fuel-empty lap
- GTP battery-voltage monitoring when supported by the selected car

## LEADERBOARDS

### Features

- Focused-car summary with current lap, position, last lap, and best lap
- Live standings with class position, car and team details, gaps, intervals, lap times, pit information, tyre compound, and race status
- Multi-class filtering with live car counts and class-specific colours
- Clickable and keyboard-accessible rows for changing the focused iRacing camera car
- Race-event feed for position changes, driver swaps, incidents, and saved events
- Event saving and timed replay playback with an automatic return to the live session
- Automatic replay scanning and import of official iRacing Results, Event Log, and Lap Chart JSON files

## TRACK MAP

### Features

- Official iRacing circuit layout with live, colour-coded car positions and car numbers
- Focused-car highlighting, pit-lane status, and multi-class map filtering
- Smooth 60 Hz map updates for close real-time tracking
- Pit-exit traffic prediction showing where the focused car is expected to rejoin
- Dynamic follow map with smooth rotation and speed-dependent zoom around the focused car
- Switchable large-map view between the track map, pit-exit prediction, and dynamic follow map
- Live weather and track conditions, including wind, temperature, humidity, wetness, skies, and declared-wet status

## Configuration

Edit `config.json` to adjust settings:
- `refresh_rate`: Update interval in seconds
- `fuel_warning_threshold`: Fuel level threshold for pit alerts
- `tire_wear_warning`: Tire wear threshold (0-1)
- `pit_loss_seconds`: Estimated net time lost to a pit stop, used for the pit-exit traffic prediction

## Importing missing race events

The event database records position changes, driver swaps, and incidents while the independent
collector is connected. Missing events from before the collector started can be added after a
session without controlling iRacing's replay:

1. Open the completed session in iRacing Results.
2. Download the JSON data for Results, Event Log, and Lap Chart.
3. Open the leaderboard screen and click the `+` button beside the event filters.
4. Select the downloaded JSON files together.

The importer recognizes the three official result payloads. Lap Chart snapshots and live SDK
snapshots pass through the same `EventReconstructor`, then merge into `sql/events.db` using
stable content-derived IDs. Re-importing the same data is safe. Incidents are only read from
iRacing incident totals or Event Log/Lap Chart incident data; position loss is never treated as
an incident. Direct downloads from the iRacing Data API require an iRacing OAuth client ID;
anonymous requests and legacy username/password authentication are intentionally not used.
- `fuel_fill_rate_lps`: Estimated refuelling speed in litres per second
- `tire_change_seconds`: Estimated stationary time when tires are selected in iRacing's F5 black box

## Future Enhancements

- Advanced pit strategy calculations
- Data logging and analysis
- Real-time strategy suggestions

## Troubleshooting

- Ensure iRacing is running before starting Race-Engineer.
- If connection fails, check that iRacing is not in replay mode.
- For issues with dependencies, try reinstalling with `python setup_iracing_env.py`.
- If Electron does not open, make sure Node.js is installed and run `npm install`.
