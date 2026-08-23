import { describe, expect, it } from "vitest";
import { EXTERNAL_LINKS, MINECRAFT_SERVERS, SITE, WEBSPACE_PROJECTS } from "./site";

describe("Wartungsmodus", () => {
  it("ist global aktiviert", () => {
    expect(SITE.maintenanceMode).toBe(true);
    expect(SITE.maintenanceMessage).toContain("Wartungsarbeiten");
  });

  it("markiert alle Minecraft-Server als offline", () => {
    expect(MINECRAFT_SERVERS).toHaveLength(3);
    expect(MINECRAFT_SERVERS.every((s) => s.status === "maintenance")).toBe(true);
    expect(MINECRAFT_SERVERS.map((s) => s.port)).toEqual([25565, 19132, 19134]);
  });
});

describe("WEBSPACE_PROJECTS", () => {
  it("nimmt hybrixon.com als eigenes Webspace-Projekt mit auf", () => {
    const hybrixon = WEBSPACE_PROJECTS.find((project) => project.id === "hybrixon");
    expect(hybrixon).toBeDefined();
    expect(hybrixon?.url).toBe("https://hybrixon.com");
    expect(hybrixon?.host).toBe("hybrixon.com");
    expect(WEBSPACE_PROJECTS[0]?.id).toBe("hybrixon");
  });

  it("verlinkt Hybrixon im NachtBlau-Netzwerk", () => {
    expect(SITE.hybrixonUrl).toBe("https://hybrixon.com");
    expect(EXTERNAL_LINKS.some((link) => link.href === SITE.hybrixonUrl)).toBe(true);
  });

  it("listet alle 11 Webspace-Domains im Wartungsmodus", () => {
    expect(WEBSPACE_PROJECTS).toHaveLength(11);
    expect(WEBSPACE_PROJECTS.every((p) => p.status === "maintenance")).toBe(true);
    expect(WEBSPACE_PROJECTS.every((p) => !p.live)).toBe(true);
    const hosts = WEBSPACE_PROJECTS.map((p) => p.host);
    expect(hosts).toContain("hybrixon.com");
    expect(hosts).toContain("nacht-blau.de");
    expect(hosts).toContain("launcher.nachtblau-interactive.com");
    expect(hosts).toContain("iron-front.nachtblau-interactive.com");
  });
});
