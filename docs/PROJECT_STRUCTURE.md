# Project structure

```text
race_engineer_dashboard/
├── electron/        Electron main process and desktop integration
├── race_engineer/   Python telemetry, API server and race-event logic
├── web/             Dashboard HTML, CSS, JavaScript and images
│   └── IMG/         Images used by the dashboard
├── tests/           Python and JavaScript tests
├── scripts/         Setup, launch and packaging scripts
├── requirements/    Python dependency sets
├── docs/            Documentation and screenshots
├── vendor/
│   └── sdk/         Checked local copies of external SDK packages
├── sql/             Local runtime database location
├── config.json      Default application configuration
└── tracks.json      Track-specific configuration
```

Generated folders such as `node_modules`, `venv`, build output, logs and test
temporary data are intentionally ignored by Git and hidden in the recommended
VS Code workspace settings.

The top-level configuration files remain at the project root because Electron,
the Python runtime and the packaging scripts use them from that stable resource
location.
