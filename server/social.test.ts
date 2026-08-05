import { describe, expect, it } from "vitest";
import { getDailyMomentPrompt, extractHashtags } from "./socialDb";

describe("socialDb helpers", () => {
  it("extracts unique hashtags case-insensitively", () => {
    expect(extractHashtags("Hello #Tech and #tech #Community")).toEqual([
      "tech",
      "community",
    ]);
  });

  it("returns a daily moment prompt", () => {
    const prompt = getDailyMomentPrompt();
    expect(prompt.length).toBeGreaterThan(10);
  });
});

describe("social.getMomentPrompt", () => {
  it("returns prompt via router", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as never,
      res: {} as never,
    });
    const result = await caller.social.getMomentPrompt();
    expect(result.windowHours).toBe(24);
    expect(result.prompt).toBeTruthy();
  });
});
