#!/usr/bin/env node
/**
 * Prepare Capacitor www/ as offline shell + point to live Android Webspace page.
 * Primary content: server.url → android.html on ALL-INKL.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const www = path.join(root, "www");
const hubUrl = path.join(root, "..", "hub-url.json");
const androidHtmlSrc = path.join(
  root,
  "..",
  "..",
  "..",
  "webspace",
  "launcher.nachtblau-interactive.com",
  "android.html",
);

let androidUrl = "https://launcher.nachtblau-interactive.com/android.html";
try {
  const cfg = JSON.parse(fs.readFileSync(hubUrl, "utf8"));
  if (cfg.androidUrl) androidUrl = cfg.androidUrl;
} catch {
  /* default */
}

fs.mkdirSync(www, { recursive: true });

// Prefer synced android.html from webspace mirror; else write redirect shell
if (fs.existsSync(androidHtmlSrc)) {
  fs.copyFileSync(androidHtmlSrc, path.join(www, "index.html"));
  fs.copyFileSync(androidHtmlSrc, path.join(www, "index.htm"));
  console.log("www/index.html ← webspace android.html");
} else {
  const shell = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0;url=${androidUrl}">
  <title>NachtBlau Hub</title>
  <script>location.replace(${JSON.stringify(androidUrl)});</script>
</head>
<body style="background:#030510;color:#fff;font-family:sans-serif;padding:2rem">
  <p>Lade NachtBlau Hub …</p>
  <p><a href="${androidUrl}" style="color:#7ec8ff">${androidUrl}</a></p>
</body>
</html>
`;
  fs.writeFileSync(path.join(www, "index.html"), shell);
  console.log("www/index.html ← redirect shell");
}

// Minimal assets so Capacitor sync has something if offline
const meta = {
  version: require("../package.json").version,
  androidUrl,
  updatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(www, "app-version.json"), JSON.stringify(meta, null, 2) + "\n");
console.log("Android App", meta.version, "→", androidUrl);
