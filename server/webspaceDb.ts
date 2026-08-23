import { and, desc, eq } from "drizzle-orm";
import { webspaceSites, type InsertWebspaceSite, type WebspaceSite } from "../drizzle/schema";
import {
  defaultWebspaceBlocks,
  parseWebspaceBlocks,
  type WebspaceBlock,
  type WebspaceSitePublic,
  type WebspaceTheme,
} from "../shared/webspace";
import { getDb } from "./db";

export async function getWebspaceSiteBySlug(slug: string): Promise<WebspaceSite | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(webspaceSites).where(eq(webspaceSites.slug, slug)).limit(1);
  return rows[0];
}

export async function getWebspaceSiteById(id: number): Promise<WebspaceSite | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(webspaceSites).where(eq(webspaceSites.id, id)).limit(1);
  return rows[0];
}

export async function getWebspaceSitesByOwner(ownerId: number): Promise<WebspaceSite[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(webspaceSites)
    .where(eq(webspaceSites.ownerId, ownerId))
    .orderBy(desc(webspaceSites.updatedAt));
}

export async function createWebspaceSite(input: {
  ownerId: number;
  slug: string;
  title: string;
  tagline?: string;
}): Promise<WebspaceSite> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");

  const blocks = defaultWebspaceBlocks(input.title, input.tagline);
  const values: InsertWebspaceSite = {
    ownerId: input.ownerId,
    slug: input.slug,
    title: input.title,
    tagline: input.tagline ?? null,
    blocks: JSON.stringify(blocks),
    theme: "midnight",
    status: "draft",
    kasProvisioned: false,
    kasProvisionError: null,
  };

  const result = await db.insert(webspaceSites).values(values);
  const id = Number(result[0].insertId);
  const site = await getWebspaceSiteById(id);
  if (!site) throw new Error("Webspace-Seite konnte nicht erstellt werden");
  return site;
}

export async function updateWebspaceSite(
  siteId: number,
  ownerId: number,
  input: {
    title?: string;
    tagline?: string;
    blocks?: WebspaceBlock[];
    theme?: WebspaceTheme;
    status?: "draft" | "published" | "archived";
    kasProvisioned?: boolean;
    kasProvisionError?: string | null;
    publishedAt?: Date | null;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");

  const updateSet: Partial<InsertWebspaceSite> = {};
  if (input.title !== undefined) updateSet.title = input.title;
  if (input.tagline !== undefined) updateSet.tagline = input.tagline;
  if (input.blocks !== undefined) updateSet.blocks = JSON.stringify(input.blocks);
  if (input.theme !== undefined) updateSet.theme = input.theme;
  if (input.status !== undefined) updateSet.status = input.status;
  if (input.kasProvisioned !== undefined) updateSet.kasProvisioned = input.kasProvisioned;
  if (input.kasProvisionError !== undefined) updateSet.kasProvisionError = input.kasProvisionError;
  if (input.publishedAt !== undefined) updateSet.publishedAt = input.publishedAt;

  await db
    .update(webspaceSites)
    .set(updateSet)
    .where(and(eq(webspaceSites.id, siteId), eq(webspaceSites.ownerId, ownerId)));
}

export function toPublicWebspaceSite(site: WebspaceSite): WebspaceSitePublic {
  return {
    slug: site.slug,
    title: site.title,
    tagline: site.tagline,
    theme: site.theme,
    blocks: parseWebspaceBlocks(site.blocks),
    publishedAt: site.publishedAt,
  };
}
