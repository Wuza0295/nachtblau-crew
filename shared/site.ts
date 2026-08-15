export const SITE = {
  name: "NachtBlau Crew",
  shortName: "NachtBlau",
  tagline: "Deine Gaming Community für PC, Konsolen, Steam und mehr.",
  description:
    "NachtBlau Crew – Deine Gaming Community für PC, Konsolen, Steam und mehr. Aktuelle News, kostenlose Spiele und ein aktives Forum.",
  logoUrl:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663739653758/PbtcqHtcftAKnwDnhmoduf/nachtblau-logo-Li7umgFb8XhrYaRtYVFm4Z.webp",
  heroBgUrl:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663739653758/PbtcqHtcftAKnwDnhmoduf/nachtblau-hero-bg-HgRTyjrF5BBTepdctiJ8Mj.webp",
  webspaceUrl: "https://nacht-blau.de",
  webspaceLabel: "NachtBlau Webspace",
  launcherUrl: "https://launcher.nachtblau-interactive.com",
  launcherAndroidUrl: "https://launcher.nachtblau-interactive.com/android.html",
  launcherLabel: "NachtBlau Hub",
  githubUrl: "https://github.com/Wuza0295/nachtblau-crew",
  githubOrgUrl: "https://github.com/Wuza0295",
  githubLabel: "GitHub Repository",
  contactEmail: "info@nacht-blau.de",
  gamerPowerUrl: "https://www.gamerpower.com",
} as const;

export const LAUNCHER = {
  name: "NachtBlau Hub",
  shortName: "NachtBlau",
  version: "1.0.0",
  versionCode: 1,
  appId: "de.nachtblau.hub",
  webUrl: SITE.launcherUrl,
  androidUrl: SITE.launcherAndroidUrl,
  linuxUrl: `${SITE.launcherUrl}/linux.html`,
  apkUrl: `${SITE.githubUrl}/releases/download/launcher-android-preview/NachtBlau-Hub.apk`,
  apkNightlyUrl:
    "https://nightly.link/Wuza0295/nachtblau-crew/workflows/android-launcher.yml/cursor/launcher-android-app-2a02/nachtblau-hub-debug.zip",
  actionsUrl: `${SITE.githubUrl}/actions/workflows/android-launcher.yml`,
  codeAssistFolderUrl: `${SITE.githubUrl}/tree/cursor/launcher-android-app-2a02/codeassist/NachtBlau-Hub`,
  codeAssistZipUrl: `${SITE.githubUrl}/raw/cursor/launcher-android-app-2a02/codeassist/NachtBlau-Hub.zip`,
  codeAssistUrl: `${SITE.githubUrl}/tree/cursor/launcher-android-app-2a02/codeassist/NachtBlau-Hub`,
  tagline: "Spiele, Bücher und Lumina — als App auf dem Handy.",
} as const;

export const EXTERNAL_LINKS = [
  {
    href: SITE.webspaceUrl,
    label: SITE.webspaceLabel,
    description: "Offizielle Website der NachtBlau GbR mit Infos zum Projekt und Team.",
    external: true,
  },
  {
    href: SITE.launcherUrl,
    label: SITE.launcherLabel,
    description: "NachtBlau Hub: Twilight Crown, Bluepole, Lumina und Symbiose — Web, Linux und Android.",
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
