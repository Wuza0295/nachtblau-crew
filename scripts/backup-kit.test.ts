import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("ALL-INKL Backup-System", () => {
  it("sichert alle Domain-Ordner inklusive hybrixon.com und lässt SQLite-Daten zu", () => {
    const job = read("webspace-backup/job.php");
    expect(job).toContain("nb_backup_projects");
    expect(job).toContain("Archive_Tar");
    expect(job).not.toMatch(/ignore_names.*uploads/);
    expect(job).not.toMatch(/skip_roots.*hybrixon/);

    const ignore = read("webspace-backup/config.example.php");
    expect(ignore).toContain("'backup'");
    expect(ignore).toContain("'archiv'");
    expect(ignore).not.toContain("uploads");
    expect(ignore).not.toContain("hybrixon.sqlite");
  });

  it("bietet ein Cron-Ziel und ein FTPS-Deploy", () => {
    expect(read("webspace-backup/run.phpx")).toContain("nb_backup_run");
    expect(read("scripts/deploy-backup.py")).toContain("/nacht-blau.de/backup");
    expect(read("scripts/deploy-backup.py")).toContain("run.phpx?token=");
  });
});
