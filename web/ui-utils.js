(function exposeRaceEngineerUiUtils(globalObject) {
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  globalObject.raceEngineerUi = Object.freeze({ escapeHtml });
})(window);
