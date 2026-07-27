import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  DEFAULT_FORUM_CATEGORIES,
  WELCOME_THREAD,
  ensureForumCategories,
  ensureWelcomeThread,
} from "./seed";

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "./db";

describe("ensureForumCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValues.mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  it("exports six default forum categories", () => {
    expect(DEFAULT_FORUM_CATEGORIES).toHaveLength(6);
    expect(DEFAULT_FORUM_CATEGORIES[0].slug).toBe("allgemein");
    expect(DEFAULT_FORUM_CATEGORIES[5].slug).toBe("community");
  });

  it("skips seeding when categories already exist", async () => {
    vi.mocked(getDb).mockResolvedValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockResolvedValue([{ count: 2 }]),
      }),
      insert: mockInsert,
    } as never);

    await ensureForumCategories();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("seeds categories when table is empty", async () => {
    vi.mocked(getDb).mockResolvedValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
      insert: mockInsert,
    } as never);

    await ensureForumCategories();
    expect(mockInsert).toHaveBeenCalledWith(expect.anything());
    expect(mockValues).toHaveBeenCalledWith([...DEFAULT_FORUM_CATEGORIES]);
  });

  it("exports welcome thread content with external links", () => {
    expect(WELCOME_THREAD.title).toContain("Willkommen");
    expect(WELCOME_THREAD.content).toContain("nacht-blau.de");
    expect(WELCOME_THREAD.content).toContain("github.com");
  });

  it("no-ops when database is unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    await expect(ensureForumCategories()).resolves.toBeUndefined();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("ensureWelcomeThread", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no-ops when database is unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    await expect(ensureWelcomeThread()).resolves.toBeUndefined();
  });
});
