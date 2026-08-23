import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  WEBSPACE_BASE_DOMAIN,
  isValidWebspaceSlug,
  parseWebspaceBlocks,
  type WebspaceBlock,
} from "../../shared/webspace";
import { ENV } from "../_core/env";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { provisionKasSubdomain } from "../kas/client";
import {
  createWebspaceSite,
  getWebspaceSiteBySlug,
  getWebspaceSitesByOwner,
  toPublicWebspaceSite,
  updateWebspaceSite,
} from "../webspaceDb";

const blockSchema: z.ZodType<WebspaceBlock> = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("hero"),
    title: z.string().min(1).max(120),
    subtitle: z.string().max(240),
    imageUrl: z.string().url().optional(),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("text"),
    content: z.string().max(5000),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("links"),
    heading: z.string().max(80).optional(),
    items: z
      .array(
        z.object({
          label: z.string().min(1).max(80),
          url: z.string().url(),
        })
      )
      .max(12),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("image"),
    url: z.string().url(),
    alt: z.string().max(120).optional(),
    caption: z.string().max(240).optional(),
  }),
]);

const slugSchema = z
  .string()
  .min(3)
  .max(32)
  .transform((value) => value.toLowerCase())
  .refine(isValidWebspaceSlug, {
    message: "Ungültiger Subdomain-Name (nur a-z, 0-9, Bindestrich)",
  });

export const webspaceRouter = router({
  getConfig: publicProcedure.query(() => ({
    baseDomain: WEBSPACE_BASE_DOMAIN,
    kasEnabled: ENV.kasEnabled,
    previewPathPrefix: "/s/",
  })),

  getMySites: protectedProcedure.query(async ({ ctx }) => {
    const sites = await getWebspaceSitesByOwner(ctx.user.id);
    return sites.map((site) => ({
      id: site.id,
      slug: site.slug,
      title: site.title,
      tagline: site.tagline,
      theme: site.theme,
      status: site.status,
      kasProvisioned: site.kasProvisioned,
      kasProvisionError: site.kasProvisionError,
      publishedAt: site.publishedAt,
      updatedAt: site.updatedAt,
      publicUrl: `https://${site.slug}.${WEBSPACE_BASE_DOMAIN}`,
      previewUrl: `/s/${site.slug}`,
    }));
  }),

  getSiteForEdit: protectedProcedure
    .input(z.object({ slug: slugSchema }))
    .query(async ({ ctx, input }) => {
      const site = await getWebspaceSiteBySlug(input.slug);
      if (!site || site.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return {
        id: site.id,
        slug: site.slug,
        title: site.title,
        tagline: site.tagline,
        theme: site.theme,
        status: site.status,
        blocks: parseWebspaceBlocks(site.blocks),
        kasProvisioned: site.kasProvisioned,
        kasProvisionError: site.kasProvisionError,
        publicUrl: `https://${site.slug}.${WEBSPACE_BASE_DOMAIN}`,
      };
    }),

  getPublicSite: publicProcedure
    .input(z.object({ slug: slugSchema }))
    .query(async ({ input }) => {
      const site = await getWebspaceSiteBySlug(input.slug);
      if (!site || site.status !== "published") {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return toPublicWebspaceSite(site);
    }),

  createSite: protectedProcedure
    .input(
      z.object({
        slug: slugSchema,
        title: z.string().min(2).max(128),
        tagline: z.string().max(256).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await getWebspaceSiteBySlug(input.slug);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Diese Subdomain ist bereits vergeben",
        });
      }

      const site = await createWebspaceSite({
        ownerId: ctx.user.id,
        slug: input.slug,
        title: input.title,
        tagline: input.tagline,
      });

      return {
        id: site.id,
        slug: site.slug,
        previewUrl: `/s/${site.slug}`,
      };
    }),

  saveSite: protectedProcedure
    .input(
      z.object({
        slug: slugSchema,
        title: z.string().min(2).max(128),
        tagline: z.string().max(256).optional(),
        theme: z.enum(["midnight", "neon", "clean"]),
        blocks: z.array(blockSchema).min(1).max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const site = await getWebspaceSiteBySlug(input.slug);
      if (!site || site.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await updateWebspaceSite(site.id, ctx.user.id, {
        title: input.title,
        tagline: input.tagline,
        theme: input.theme,
        blocks: input.blocks,
      });

      return { success: true };
    }),

  publishSite: protectedProcedure
    .input(z.object({ slug: slugSchema }))
    .mutation(async ({ ctx, input }) => {
      const site = await getWebspaceSiteBySlug(input.slug);
      if (!site || site.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const provision = await provisionKasSubdomain(site.slug);
      await updateWebspaceSite(site.id, ctx.user.id, {
        status: "published",
        publishedAt: new Date(),
        kasProvisioned: provision.ok,
        kasProvisionError: provision.ok ? null : provision.error,
      });

      return {
        success: true,
        publicUrl: `https://${site.slug}.${WEBSPACE_BASE_DOMAIN}`,
        kasProvisioned: provision.ok,
        kasWarning: provision.ok ? null : provision.error,
      };
    }),

  unpublishSite: protectedProcedure
    .input(z.object({ slug: slugSchema }))
    .mutation(async ({ ctx, input }) => {
      const site = await getWebspaceSiteBySlug(input.slug);
      if (!site || site.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await updateWebspaceSite(site.id, ctx.user.id, {
        status: "draft",
      });

      return { success: true };
    }),
});
