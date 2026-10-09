const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  resolveHubUrl,
  isWindowsEntrypoint,
  isLinuxEntrypoint,
} = require("./resolve-hub-url.cjs");

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

  it("fällt von Bazzite/Linux auf Windows zurück wenn linux.html fehlt", () => {
    assert.equal(
      resolveHubUrl({ platform: "linux", cfg, failedPreferred: true }),
      cfg.windowsUrl,
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

describe("isLinuxEntrypoint", () => {
  it("erkennt linux.html und MultiViews /linux", () => {
    assert.equal(isLinuxEntrypoint(cfg.linuxUrl), true);
    assert.equal(
      isLinuxEntrypoint("https://launcher.nachtblau-interactive.com/linux"),
      true,
    );
    assert.equal(isLinuxEntrypoint(cfg.windowsUrl), false);
  });
});
