import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_CIRCLES, ensureCircles, runAppSeeds } from "./seed";
import { PULSE_TOPICS } from "../shared/site";

const mockInsert = vi.fn();
const mockValues = vi.fn();

vi.mock("./db", () => ({
  getDb: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

import { getDb } from "./db";

describe("AETHER seed & concept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValues.mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });
  });

  it("exports featured circles mixing social paradigms", () => {
    expect(DEFAULT_CIRCLES.length).toBeGreaterThanOrEqual(6);
    expect(DEFAULT_CIRCLES.some((c) => c.slug === "tech-pulse")).toBe(true);
    expect(DEFAULT_CIRCLES.some((c) => c.slug === "design-lab")).toBe(true);
    expect(DEFAULT_CIRCLES.every((c) => c.topic && c.coverGradient)).toBe(true);
  });

  it("defines 12 pulse topics for user-controlled algorithm", () => {
    expect(PULSE_TOPICS).toHaveLength(12);
    expect(PULSE_TOPICS.map((t) => t.id)).toContain("technologie");
    expect(PULSE_TOPICS.map((t) => t.id)).toContain("nature");
  });

  it("skips circle seed when data exists", async () => {
    vi.mocked(getDb).mockResolvedValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockResolvedValue([{ count: 3 }]),
      }),
      insert: mockInsert,
    } as never);

    await ensureCircles();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("seeds circles when empty", async () => {
    vi.mocked(getDb).mockResolvedValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
      insert: mockInsert,
    } as never);

    await ensureCircles();
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith([...DEFAULT_CIRCLES]);
  });

  it("runAppSeeds no-ops without database", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    await expect(runAppSeeds()).resolves.toBeUndefined();
  });
});
