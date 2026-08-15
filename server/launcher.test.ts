import { describe, expect, it } from "vitest";
import { EXTERNAL_LINKS, LAUNCHER, SITE } from "@shared/site";

describe("NachtBlau Hub Android Launcher", () => {
  it("exposes live webspace URLs for web, Android and Linux", () => {
    expect(LAUNCHER.webUrl).toBe("https://launcher.nachtblau-interactive.com");
    expect(LAUNCHER.androidUrl).toBe(
      "https://launcher.nachtblau-interactive.com/android.html"
    );
    expect(LAUNCHER.linuxUrl).toBe(
      "https://launcher.nachtblau-interactive.com/linux.html"
    );
    expect(SITE.launcherUrl).toBe(LAUNCHER.webUrl);
    expect(SITE.launcherAndroidUrl).toBe(LAUNCHER.androidUrl);
  });

  it("uses the NachtBlau Hub application id and version 1.0.0", () => {
    expect(LAUNCHER.appId).toBe("de.nachtblau.hub");
    expect(LAUNCHER.name).toBe("NachtBlau Hub");
    expect(LAUNCHER.version).toBe("1.0.0");
    expect(LAUNCHER.versionCode).toBe(1);
  });

  it("exposes phone-install URLs for APK and live Android hub", () => {
    expect(LAUNCHER.apkUrl).toBe(
      "https://github.com/Wuza0295/nachtblau-crew/releases/download/launcher-android-preview/NachtBlau-Hub.apk"
    );
    expect(LAUNCHER.apkNightlyUrl).toContain("nightly.link");
    expect(LAUNCHER.apkNightlyUrl).toContain("nachtblau-hub-debug.zip");
    expect(LAUNCHER.actionsUrl).toContain("android-launcher.yml");
    expect(LAUNCHER.androidUrl).toContain("android.html");
    expect(LAUNCHER.codeAssistUrl).toContain("CODEASSIST-APK.md");
    expect(LAUNCHER.codeAssistZipUrl).toContain("nachtblau-hub-codeassist.zip");
  });

  it("lists the launcher in the NachtBlau network links", () => {
    const hrefs = EXTERNAL_LINKS.map((link) => link.href);
    expect(hrefs).toContain(SITE.launcherUrl);
    expect(hrefs).toContain(SITE.webspaceUrl);
    expect(hrefs).toContain(SITE.githubUrl);
  });
});
