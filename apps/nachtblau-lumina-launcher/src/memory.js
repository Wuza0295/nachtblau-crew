'use strict';

/**
 * Client-RAM helpers for NachtBlau Lumina Launcher.
 *
 * Minecraft Java Client braucht typisch 4–8 GB — nicht 16–32 GB.
 * Zu viel Heap verlangsamt GC und Startup und lässt dem OS / Browser /
 * Discord zu wenig RAM (besonders auf Laptops).
 */

/** Hard upper bound for the client slider (GB). More rarely helps vanilla/modpacks. */
const CLIENT_HARD_CAP_GB = 16;

/** Never leave the OS with less than this many GB free in the slider max. */
const MIN_OS_RESERVE_GB = 4;

/** Fraction of physical RAM kept free for OS / Desktop / Browser. */
const OS_RESERVE_FRACTION = 0.25;

/**
 * @param {number} [totalBytes] physical RAM in bytes (default: os.totalmem)
 * @returns {number} total GiB floored
 */
function totalRamGb(totalBytes) {
  const bytes =
    totalBytes != null && Number.isFinite(Number(totalBytes))
      ? Number(totalBytes)
      : require('os').totalmem();
  return Math.floor(bytes / 1024 ** 3);
}

/**
 * Max GB the RAM slider / JVM may request.
 * Leaves ≥25% or ≥4 GB for OS, hard-caps at CLIENT_HARD_CAP_GB.
 *
 * Legacy (≤1.0.10): `min(32, totalGb - 2)` → on ~32 GB laptops the slider
 * stopped at ~29–30 GB (looks like "max", but is far too much for a client).
 *
 * @param {number} [totalBytes]
 * @returns {number}
 */
function maxAllowedMemoryGb(totalBytes) {
  const totalGb = totalRamGb(totalBytes);
  const reserve = Math.max(MIN_OS_RESERVE_GB, Math.ceil(totalGb * OS_RESERVE_FRACTION));
  return Math.max(2, Math.min(CLIENT_HARD_CAP_GB, totalGb - reserve));
}

/**
 * Sensible default / recommended client heap for a laptop.
 * @param {number} [totalBytes]
 * @returns {number}
 */
function recommendedMemoryGb(totalBytes) {
  const totalGb = totalRamGb(totalBytes);
  const max = maxAllowedMemoryGb(totalBytes);
  let recommended;
  // totalmem oft ~31 GiB auf „32-GB“-Geräten → Schwelle 24
  if (totalGb >= 24) recommended = 8;
  else if (totalGb >= 16) recommended = 6;
  else if (totalGb >= 12) recommended = 4;
  else if (totalGb >= 8) recommended = 4;
  else recommended = 2;
  return Math.max(2, Math.min(max, recommended));
}

/**
 * @param {unknown} memoryGb
 * @param {number} [totalBytes]
 * @returns {number}
 */
function clampMemoryGb(memoryGb, totalBytes) {
  const max = maxAllowedMemoryGb(totalBytes);
  const fallback = recommendedMemoryGb(totalBytes);
  const n = Number(memoryGb);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(2, Math.min(max, Math.round(n)));
}

/**
 * One-shot migration for settings saved by launcher ≤1.0.10 that parked the
 * slider near "all RAM" (harmful on laptops).
 *
 * @param {Record<string, unknown>} settings
 * @param {number} [totalBytes]
 * @returns {{ settings: Record<string, unknown>, migrated: boolean }}
 */
function migrateMemorySettings(settings, totalBytes) {
  const next = { ...(settings || {}) };
  const max = maxAllowedMemoryGb(totalBytes);
  const recommended = recommendedMemoryGb(totalBytes);
  let memoryGb = clampMemoryGb(next.memoryGb, totalBytes);
  let migrated = false;

  if (!next.memoryOptimizedV2) {
    // Old max was roughly total-2; anything above 12 GB client heap is almost
    // never intentional for vanilla Lumina — pull down to recommended.
    if (memoryGb > Math.max(recommended, 8) || memoryGb > max) {
      memoryGb = recommended;
      migrated = true;
    }
    next.memoryOptimizedV2 = true;
    migrated = true;
  }

  if (memoryGb !== next.memoryGb) {
    next.memoryGb = memoryGb;
    migrated = true;
  }

  return { settings: next, migrated };
}

/**
 * Cautious G1 client flags (Aikar-inspired, trimmed for clients — not full
 * server flags). AlwaysPreTouch only for modest heaps (faster cold start).
 *
 * @param {number} memoryGb clamped heap size
 * @returns {string[]}
 */
function clientJvmFlags(memoryGb) {
  const gb = Number(memoryGb) || 4;
  const flags = [
    '-XX:+UseG1GC',
    '-XX:+ParallelRefProcEnabled',
    '-XX:MaxGCPauseMillis=50',
    '-XX:+UnlockExperimentalVMOptions',
    '-XX:+DisableExplicitGC',
    '-XX:G1NewSizePercent=20',
    '-XX:G1MaxNewSizePercent=40',
    '-XX:G1HeapRegionSize=8M',
    '-XX:G1ReservePercent=20',
    '-XX:InitiatingHeapOccupancyPercent=15',
    '-XX:MaxTenuringThreshold=1',
    '-XX:+PerfDisableSharedMem',
    '-Dfml.ignorePatchDiscrepancies=true',
    '-Dfml.ignoreInvalidMinecraftCertificates=true',
  ];
  if (gb <= 8) {
    flags.push('-XX:+AlwaysPreTouch');
  }
  return flags;
}

/**
 * Min heap string for MCLC — small fixed floor, scales slightly with max.
 * @param {number} memoryGb
 * @returns {string}
 */
function minMemoryArg(memoryGb) {
  const gb = Number(memoryGb) || 4;
  return `${Math.max(1, Math.min(2, Math.floor(gb / 2)))}G`;
}

module.exports = {
  CLIENT_HARD_CAP_GB,
  MIN_OS_RESERVE_GB,
  OS_RESERVE_FRACTION,
  totalRamGb,
  maxAllowedMemoryGb,
  recommendedMemoryGb,
  clampMemoryGb,
  migrateMemorySettings,
  clientJvmFlags,
  minMemoryArg,
};
