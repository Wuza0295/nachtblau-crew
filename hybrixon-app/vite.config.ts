import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(rootDir, "../webspace/hybrixon.com");

function moveIndexToSpa(): import("vite").Plugin {
  return {
    name: "hybrixon-move-index",
    closeBundle() {
      const built = path.join(siteRoot, "index.html");
      const spaDir = path.join(siteRoot, "spa");
      const target = path.join(spaDir, "index.html");
      fs.mkdirSync(spaDir, { recursive: true });
      if (fs.existsSync(built)) {
        fs.renameSync(built, target);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), moveIndexToSpa()],
  base: "/",
  build: {
    outDir: siteRoot,
    emptyOutDir: false,
    assetsDir: "spa-assets",
  },
});
