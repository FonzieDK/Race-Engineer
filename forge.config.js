const path = require("path");

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "Race-Engineer",
    extraResource: [
      path.join(__dirname, "dist-python", "RaceEngineerRuntime"),
      path.join(__dirname, "web"),
      path.join(__dirname, "config.json"),
      path.join(__dirname, "tracks.json"),
    ],
    ignore: [
      /^\/(?:\.build-tools|\.git|build|dist-python|logs|out|sql|tests|venv)(?:\/|$)/,
      /^\/(?:commit_to_github\.bat|requirements-build\.txt|requirements\.txt|setup_iracing_env\.py|start_race_engineer\.bat)$/,
      /^\/.*\.py$/,
    ],
  },
  makers: [
    {
      name: "@electron-forge/maker-wix",
      config: {
        language: 1030,
        manufacturer: "InfiNxt",
        description: "Race-Engineer desktop app for iRacing telemetry",
        shortName: "Race-Engineer",
        shortcutName: "Race-Engineer",
        programFilesFolderName: "Race-Engineer",
        ui: {
          chooseDirectory: true,
        },
      },
    },
  ],
};

