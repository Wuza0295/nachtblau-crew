import { describe, expect, it } from "vitest";
import { EXTERNAL_LINKS, SITE, WEBSPACE_PROJECTS } from "./site";

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
});
