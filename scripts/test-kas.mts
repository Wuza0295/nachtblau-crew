import { KasClient } from "../server/kas/client.ts";

async function main() {
  const login = process.env.KAS_LOGIN ?? "";
  const password = process.env.KAS_PASSWORD ?? "";
  if (!login || !password) {
    console.error("Missing KAS_LOGIN or KAS_PASSWORD");
    process.exit(1);
  }

  const client = new KasClient(login, password);
  await client.authenticate();
  console.log("AUTH_OK");

  const subs = await client.getSubdomains();
  console.log("SUBDOMAIN_COUNT", subs.length);

  const nachtblau = subs.filter((s) => s.domainName === "nacht-blau.de");
  console.log("NACHT_BLAU_SUBDOMAINS", nachtblau.length);
  if (nachtblau.length > 0) {
    console.log("SAMPLE", JSON.stringify(nachtblau.slice(0, 5)));
  }
}

main().catch((error) => {
  console.error("AUTH_FAIL", error instanceof Error ? error.message : error);
  process.exit(1);
});
