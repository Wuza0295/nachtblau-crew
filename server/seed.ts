/**
 * Liora seed — demo content lives in the in-memory social store.
 * DB persistence is optional; this keeps server boot compatible.
 */
export async function seedSocialPortal() {
  console.log("[Liora] Demo social state loaded via shared/social-data.ts");
  return { ok: true as const };
}

export async function runAppSeeds() {
  return seedSocialPortal();
}

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.js"));

if (isDirectRun) {
  seedSocialPortal().catch(console.error);
}
