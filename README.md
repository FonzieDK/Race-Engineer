# Race-Engineer

Race-Engineer is an Electron desktop app for real-time iRacing telemetry with a Python backend.

## Download

[Download **Race-Engineer.exe**](https://github.com/FonzieDK/Race-Engineer/releases/latest/download/Race-Engineer.exe)

## Requirements

- Windows OS
- Python 3.6+
- iRacing simulator installed and running
- Node.js (required for the Electron desktop app)

## Setup

1. Ensure Python 3.6 or higher is installed on your system.
2. Run the setup script: `python setup_iracing_env.py`
   - This creates a virtual environment, installs Python dependencies, and checks for iRacing.
3. If iRacing is not running, start it before launching Race-Engineer.
4. Install Electron dependencies: `npm install`

## Usage

1. Run `start_race_engineer.bat` to launch Race-Engineer.
2. Electron starts the Python backend and a detached event collector automatically.
3. The app window opens and loads Race-Engineer directly.

To save local changes to GitHub, double-click `commit_to_github.bat`. Enter a commit
message, or press Enter to use the default. The script commits the changes, synchronizes
with `main`, and pushes them to `FonzieDK/Race-Engineer`.

The event collector keeps running after the Race-Engineer window is closed. It reads the local
iRacing SDK feed and stores events in `sql/events.db`, so closing the browser or Electron does
not interrupt collection. Its single-instance lock prevents duplicate collectors. The first
normal launch registers a collector-only Windows login start, so later reboots restart data
collection without opening the Race-Engineer window.

## Features

- Live fuel level monitoring
- Lap time display
- Tire wear tracking
- Pit stop recommendations
- Configurable refresh rate and thresholds

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
