const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { resolveHubUrl, isWindowsEntrypoint } = require("./resolve-hub-url.cjs");

const cfg = {
  url: "https://launcher.nachtblau-interactive.com/",
  linuxUrl: "https://launcher.nachtblau-interactive.com/linux.html",
  windowsUrl: "https://launcher.nachtblau-interactive.com/windows.html",
  androidUrl: "https://launcher.nachtblau-interactive.com/android.html",
};

describe("resolveHubUrl", () => {
  it("nimmt die Windows-URL als bevorzugten Einstieg", () => {
    assert.equal(
      resolveHubUrl({ platform: "windows", cfg }),
      cfg.windowsUrl,
    );
  });

  it("nimmt die Bazzite/Linux-URL als bevorzugten Einstieg", () => {
    assert.equal(resolveHubUrl({ platform: "linux", cfg }), cfg.linuxUrl);
  });

  it("fällt von Windows auf Linux zurück wenn windows.html 404 ist", () => {
    assert.equal(
      resolveHubUrl({ platform: "windows", cfg, failedPreferred: true }),
      cfg.linuxUrl,
    );
  });

  it("respektiert NACHTBLAU_HUB_URL", () => {
    assert.equal(
      resolveHubUrl({
        platform: "windows",
        envUrl: "http://127.0.0.1:8765/",
        cfg,
      }),
      "http://127.0.0.1:8765/",
    );
  });
});

describe("isWindowsEntrypoint", () => {
  it("erkennt windows.html und MultiViews /windows", () => {
    assert.equal(isWindowsEntrypoint(cfg.windowsUrl), true);
    assert.equal(
      isWindowsEntrypoint("https://launcher.nachtblau-interactive.com/windows"),
      true,
    );
    assert.equal(isWindowsEntrypoint(cfg.linuxUrl), false);
  });
});
