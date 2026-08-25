/** Autic Treasures – eigenständige Marke, unabhängig von NachtBlau. */
export const SITE = {
  name: "Autic Treasures",
  shortName: "Autic",
  tagline: "TCG-Marktplatz für Pokémon, Yu-Gi-Oh!, Magic und mehr.",
  description:
    "Autic Treasures – Kaufe, verkaufe und bewerte Trading Cards. Merkliste, Warenkorb, Autic Coins und Verkäufer-Ratings.",
  maintenanceMode: false,
  maintenanceMessage: "",
  logoUrl: "/autic-treasures-logo.png",
  heroBgUrl: "/autic-treasures-hero.jpg",
  webspaceUrl: "https://autic-treasures.com",
  webspaceLabel: "Autic Treasures",
  hybrixonUrl: "https://autic-treasures.com",
  hybrixonLabel: "Autic Treasures",
  hybrixonAppUrl: "https://autic-treasures.com",
  githubUrl: "https://github.com/Wuza0295/nachtblau-crew",
  githubOrgUrl: "https://github.com/Wuza0295",
  githubLabel: "GitHub",
  contactEmail: "info@autic-treasures.com",
  gamerPowerUrl: "https://autic-treasures.com",
  freeGamesUrl: "/marktplatz",
  forumUrl: "/ueber-uns",
  socialPortalUrl: "/marktplatz",
  newsUrl: "/marktplatz",
} as const;

export const EXTERNAL_LINKS = [
  {
    href: SITE.webspaceUrl,
    label: SITE.webspaceLabel,
    description: "Autic Treasures TCG-Marktplatz",
    external: true,
  },
  {
    href: `mailto:${SITE.contactEmail}`,
    label: "Kontakt",
    description: "Schreib uns eine E-Mail.",
    external: true,
  },
] as const;

export const WEBSPACE_PROJECTS: readonly {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  host: string;
  note: string;
  live: boolean;
  status: "live" | "maintenance";
}[] = [];

export const MINECRAFT_SERVERS: readonly {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: string;
  note: string;
}[] = [];
