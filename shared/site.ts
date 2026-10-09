export const SITE = {
  name: "NachtBlau Crew",
  shortName: "NachtBlau",
  tagline: "Dein Community Launcher für PC, Konsolen, Steam und mehr.",
  description:
    "NachtBlau Crew Launcher – Free Games, Gaming-News und Community-Forum für PC, Konsolen, Steam und mehr.",
  maintenanceMode: true,
  maintenanceMessage:
    "Minecraft-Server auf dem Raspberry Pi wird eingerichtet. Join-Adressen unten – Dienste können noch offline sein.",
  logoUrl:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663739653758/PbtcqHtcftAKnwDnhmoduf/nachtblau-logo-Li7umgFb8XhrYaRtYVFm4Z.webp",
  heroBgUrl:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663739653758/PbtcqHtcftAKnwDnhmoduf/nachtblau-hero-bg-HgRTyjrF5BBTepdctiJ8Mj.webp",
  webspaceUrl: "https://nacht-blau.de",
  webspaceLabel: "NachtBlau Webspace",
  hybrixonUrl: "https://hybrixon.com",
  hybrixonLabel: "Hybrixon",
  hybrixonAppUrl: "https://hybrixon.com/app.php",
  githubUrl: "https://github.com/Wuza0295/nachtblau-crew",
  githubOrgUrl: "https://github.com/Wuza0295",
  githubLabel: "GitHub Repository",
  contactEmail: "info@nacht-blau.de",
  gamerPowerUrl: "https://www.gamerpower.com",
} as const;

const MAINTENANCE_NOTE =
  "Server vorübergehend nicht verfügbar – Wartungsarbeiten." as const;

/** Projekte auf dem ALL-INKL-Webspace (w02176b7.kasserver.com). Derzeit im Wartungsmodus. */
export const WEBSPACE_PROJECTS = [
  {
    id: "hybrixon",
    title: "Hybrixon",
    subtitle: "Social Network · Closer. Freer.",
    url: SITE.hybrixonUrl,
    host: "hybrixon.com",
    note: MAINTENANCE_NOTE,
    live: false,
    status: "maintenance" as const,
  },
  {
    id: "nachtblau-gbr",
    title: "NachtBlau GbR",
    subtitle: "Gesellschaftsseite",
    url: SITE.webspaceUrl,
    host: "nacht-blau.de",
    note: MAINTENANCE_NOTE,
    live: false,
    status: "maintenance" as const,
  },
  {
    id: "allxion",
    title: "Allxion",
    subtitle: "Hybrid-Social-Hub · NachtBlau Crew",
    url: `${SITE.webspaceUrl}/allxion/`,
    host: "nacht-blau.de",
    note: MAINTENANCE_NOTE,
    live: false,
    status: "maintenance" as const,
  },
  {
    id: "nachtblau-crew",
    title: "NachtBlau Crew",
    subtitle: "Gaming-Gilde",
    url: "https://nachtblau-crew.de",
    host: "nachtblau-crew.de",
    note: MAINTENANCE_NOTE,
    live: false,
    status: "maintenance" as const,
  },
  {
    id: "nachtblau-interactive",
    title: "NachtBlau Interactive",
    subtitle: "Game Studio & Publisher",
    url: "https://nachtblau-interactive.com",
    host: "nachtblau-interactive.com",
    note: MAINTENANCE_NOTE,
    live: false,
    status: "maintenance" as const,
  },
  {
    id: "nachtblau-hub",
    title: "NachtBlau Hub",
    subtitle: "Launcher · Web, Linux, Windows, Android",
    url: "https://launcher.nachtblau-interactive.com",
    host: "launcher.nachtblau-interactive.com",
    note: MAINTENANCE_NOTE,
    live: false,
    status: "maintenance" as const,
  },
  {
    id: "autic-treasures",
    title: "Autic Treasures",
    subtitle: "Trading-Card-Community",
    url: "https://autic-treasures.com",
    host: "autic-treasures.com",
    note: MAINTENANCE_NOTE,
    live: false,
    status: "maintenance" as const,
  },
  {
    id: "black-horizon",
    title: "Black Horizon",
    subtitle: "PROJECT: BLACK HORIZON",
    url: "https://blackhorizon.info",
    host: "blackhorizon.info",
    note: MAINTENANCE_NOTE,
    live: false,
    status: "maintenance" as const,
  },
  {
    id: "noxcast",
    title: "NoxCast",
    subtitle: "Startseite",
    url: "https://noxcast.com",
    host: "noxcast.com",
    note: MAINTENANCE_NOTE,
    live: false,
    status: "maintenance" as const,
  },
  {
    id: "ram-imbiss",
    title: "RAM-Imbiss",
    subtitle: "Imbisswagen",
    url: "https://ram-imbiss.at",
    host: "ram-imbiss.at",
    note: MAINTENANCE_NOTE,
    live: false,
    status: "maintenance" as const,
  },
  {
    id: "iron-front",
    title: "Iron Front",
    subtitle: "Panzer-Schlacht",
    url: "http://iron-front.nachtblau-interactive.com",
    host: "iron-front.nachtblau-interactive.com",
    note: MAINTENANCE_NOTE,
    live: false,
    status: "maintenance" as const,
  },
] as const;

/** Raspberry Pi 4 (NachtBlau Minecraft) – LAN im Heimnetz, WAN optional. */
export const PI_SERVER = {
  lanHost: "192.168.178.33",
  wanHost: "89.247.164.165",
  sshUser: "administrator",
  sshPort: 22,
  note: "SSH und Join im Heimnetz über LAN. WAN nur mit Portfreigabe (Minecraft-Ports separat von SSH).",
} as const;

/** Minecraft-/Spiele-Server auf dem Pi (Paper + Geyser + Bedrock). */
export const MINECRAFT_SERVERS = [
  {
    id: "java",
    name: "Java Edition (Paper)",
    port: 25565,
    protocol: "TCP",
    status: "setup" as const,
  },
  {
    id: "bedrock",
    name: "Bedrock Dedicated",
    port: 19132,
    protocol: "UDP",
    status: "setup" as const,
  },
  {
    id: "geyser",
    name: "Geyser (Crossplay)",
    port: 19134,
    protocol: "UDP",
    status: "setup" as const,
  },
] as const;

export const EXTERNAL_LINKS = [
  {
    href: SITE.webspaceUrl,
    label: SITE.webspaceLabel,
    description: "Offizielle Website der NachtBlau GbR mit Infos zum Projekt und Team.",
    external: true,
  },
  {
    href: SITE.hybrixonUrl,
    label: SITE.hybrixonLabel,
    description:
      "Hybrixon auf dem ALL-INKL-Webspace: Social Feed, App-Download, Shorts, Stories und Gruppen.",
    external: true,
  },
  {
    href: SITE.githubUrl,
    label: SITE.githubLabel,
    description: "Quellcode, Issues und Beiträge zur NachtBlau Crew App auf GitHub.",
    external: true,
  },
  {
    href: `mailto:${SITE.contactEmail}`,
    label: "Kontakt",
    description: "Schreib uns eine E-Mail an info@nacht-blau.de.",
    external: true,
  },
] as const;
