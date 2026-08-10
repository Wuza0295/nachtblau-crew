import { z } from "zod";

export const MAX_IMAGE_BYTES = 12_000_000;
export const MAX_VIDEO_BYTES = 500_000_000;
export const MAX_MEDIA_PER_POST = 15;
export const MULTIPART_PART_BYTES = 8 * 1024 * 1024;
export const MULTIPART_PARALLELISM = 4;

export const mediaKindSchema = z.enum(["image", "video"]);
export const mediaStatusSchema = z.enum([
  "initiated",
  "uploaded",
  "processing",
  "ready",
  "failed",
]);

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(24).regex(/^[A-Za-z0-9_]+$/),
  email: z.email().max(320),
  password: z.string().min(10).max(128),
  birthdate: z.iso.date(),
  legalAccepted: z.literal(true),
});

export const loginSchema = z.object({
  login: z.string().trim().min(1).max(320),
  password: z.string().min(1).max(128),
});

export const createPostSchema = z.object({
  body: z.string().trim().max(4_000).default(""),
  isAdult: z.boolean().default(false),
  visibility: z.enum(["public", "followers", "friends"]).default("public"),
  mediaIds: z.array(z.uuid()).max(MAX_MEDIA_PER_POST).default([]),
}).refine((value) => value.body.length > 0 || value.mediaIds.length > 0, {
  message: "Ein Beitrag benötigt Text oder Medien.",
});

export const initiateUploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  mime: z.string().trim().min(3).max(127),
  size: z.number().int().positive(),
  kind: mediaKindSchema,
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
}).superRefine((value, ctx) => {
  const max = value.kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (value.size > max) {
    ctx.addIssue({
      code: "custom",
      path: ["size"],
      message: `${value.kind === "video" ? "Video" : "Bild"} ist zu groß.`,
    });
  }
});

export const completeUploadSchema = z.object({
  parts: z.array(z.object({
    partNumber: z.number().int().min(1).max(10_000),
    etag: z.string().min(1).max(512),
  })).min(1).max(10_000),
});

export type MediaKind = z.infer<typeof mediaKindSchema>;
export type MediaStatus = z.infer<typeof mediaStatusSchema>;

export interface ApiUser {
  id: number;
  username: string;
  displayName: string;
  role: "user" | "admin";
  avatarUrl: string | null;
  bio: string;
}

export interface ApiMedia {
  id: string;
  kind: MediaKind;
  status: MediaStatus;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  originalUrl: string | null;
  posterUrl: string | null;
  playbackUrl: string | null;
}

export interface ApiPost {
  id: number;
  body: string;
  isAdult: boolean;
  visibility: "public" | "followers" | "friends";
  createdAt: string;
  author: ApiUser;
  media: ApiMedia[];
  likeCount: number;
  commentCount: number;
  likedByViewer: boolean;
}

export interface AuthResponse {
  user: ApiUser;
  accessToken: string;
  refreshToken?: string;
}

export interface FeedResponse {
  posts: ApiPost[];
  nextCursor: string | null;
}
