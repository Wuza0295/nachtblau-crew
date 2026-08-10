import { describe, expect, it } from "vitest";
import {
  MAX_VIDEO_BYTES,
  createPostSchema,
  initiateUploadSchema,
} from "@hybrixon/contracts";

describe("platform contracts", () => {
  it("accepts a media-only post", () => {
    expect(createPostSchema.parse({
      body: "",
      mediaIds: ["4c0a25a6-dbaa-49dc-9eab-dcc0f38e97a4"],
    }).mediaIds).toHaveLength(1);
  });

  it("rejects an empty post", () => {
    expect(() => createPostSchema.parse({ body: "", mediaIds: [] })).toThrow();
  });

  it("rejects video uploads above the configured limit", () => {
    expect(() => initiateUploadSchema.parse({
      filename: "too-large.mp4",
      mime: "video/mp4",
      size: MAX_VIDEO_BYTES + 1,
      kind: "video",
    })).toThrow(/zu groß/i);
  });
});
