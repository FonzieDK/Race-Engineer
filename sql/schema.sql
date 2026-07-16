CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    session_key TEXT,
    type TEXT NOT NULL CHECK (type IN ('pos', 'swap', 'inc')),
    car_number TEXT NOT NULL,
    lap TEXT NOT NULL,
    old_position INTEGER,
    position INTEGER,
    old_driver TEXT,
    new_driver TEXT,
    incident_points INTEGER,
    incident_total INTEGER,
    event_group TEXT,
    session_num INTEGER,
    session_time REAL,
    description TEXT,
    timestamp TEXT,
    source TEXT,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session_created_at
    ON events(session_key, created_at DESC);

CREATE TABLE IF NOT EXISTS pit_history (
    session_key TEXT NOT NULL,
    car_idx INTEGER NOT NULL,
    last_pit_lap INTEGER NOT NULL,
    last_pit_duration REAL,
    PRIMARY KEY (session_key, car_idx)
);
