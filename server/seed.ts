import { getStore } from "./store";

/** Seeds are embedded in the memory store. DB seed is a no-op without DATABASE_URL. */
export async function runAppSeeds(): Promise<void> {
  const store = getStore();
  console.log(
    `[Seed] NAH bereit — ${store.users.length} Menschen, ${store.posts.length} Beiträge, ${store.spaces.length} Räume`
  );
}

const isDirectRun = process.argv[1]?.includes("seed.ts");
if (isDirectRun) {
  runAppSeeds()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
