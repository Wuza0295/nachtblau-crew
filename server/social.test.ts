import { describe, expect, it } from "vitest";
import { socialStore } from "./socialStore";

describe("socialStore", () => {
  it("returns manifesto pillars from research synthesis", () => {
    const m = socialStore.getManifesto();
    expect(m.workingName).toBe("FLUX");
    expect(m.namePending).toBe(true);
    expect(m.pillars.length).toBeGreaterThanOrEqual(6);
  });

  it("serves chronik feed with authors", () => {
    const feed = socialStore.getFeed("chronik");
    expect(feed.length).toBeGreaterThan(0);
    expect(feed[0].author).toBeDefined();
    expect(feed[0].author.handle).toBeTruthy();
  });

  it("toggles resonance on a post", () => {
    const feed = socialStore.getFeed("entdecken");
    const id = feed[0].id;
    const before = feed[0].resonance;
    const after = socialStore.resonate(id);
    expect(after?.resonance).toBe(before + 1);
    expect(after?.userResonated).toBe(true);
    const undone = socialStore.resonate(id);
    expect(undone?.resonance).toBe(before);
  });

  it("applies radar prompt mehr/weniger", () => {
    const radar = socialStore.applyRadarPrompt("mehr Architektur, weniger drama");
    const arch = radar.find((r) => r.topic.toLowerCase().includes("architektur"));
    const drama = radar.find((r) => r.topic.toLowerCase() === "drama");
    expect(arch?.weight).toBeGreaterThan(0);
    expect(drama?.weight).toBeLessThan(0);
  });

  it("lists circles with hybrid channels", () => {
    const circles = socialStore.getCircles();
    expect(circles.some((c) => c.channels.some((ch) => ch.kind === "live"))).toBe(true);
    expect(circles.some((c) => c.channels.some((ch) => ch.kind === "thread"))).toBe(true);
  });

  it("crystallizes moments past threshold", () => {
    const moments = socialStore.getMoments();
    const target = moments.find((m) => m.resonance >= m.crystallizeThreshold - 5) ?? moments[0];
    const need = Math.max(0, target.crystallizeThreshold - target.resonance);
    for (let i = 0; i < need + 1; i++) socialStore.addMomentResonance(target.id);
    const feed = socialStore.getFeed("chronik");
    expect(feed.some((p) => p.crystallized && p.id.includes(target.id))).toBe(true);
  });
});
