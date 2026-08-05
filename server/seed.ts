import { SITE } from "../shared/site";

export async function runAppSeeds(): Promise<void> {
  // Social data lives in the in-memory socialStore (auto-seeded on import).
  console.log(`[seed] ${SITE.name} ready — in-memory demo data loaded.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAppSeeds().catch(console.error);
}
