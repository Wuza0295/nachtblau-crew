import { describe, expect, it } from "vitest";
import {
  defaultWebspaceBlocks,
  isValidWebspaceSlug,
  parseWebspaceBlocks,
} from "../shared/webspace";

describe("webspace shared helpers", () => {
  it("validates slugs", () => {
    expect(isValidWebspaceSlug("mein-clan")).toBe(true);
    expect(isValidWebspaceSlug("clan2024")).toBe(true);
    expect(isValidWebspaceSlug("www")).toBe(false);
    expect(isValidWebspaceSlug("-invalid")).toBe(false);
    expect(isValidWebspaceSlug("a")).toBe(false);
  });

  it("creates default blocks", () => {
    const blocks = defaultWebspaceBlocks("Test", "Tagline");
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].type).toBe("hero");
  });

  it("parses stored blocks safely", () => {
    const blocks = parseWebspaceBlocks(JSON.stringify(defaultWebspaceBlocks("X")));
    expect(blocks[0].type).toBe("hero");
    expect(parseWebspaceBlocks("not-json")).toEqual([]);
  });
});
