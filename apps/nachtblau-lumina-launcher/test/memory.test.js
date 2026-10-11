'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  maxAllowedMemoryGb,
  recommendedMemoryGb,
  clampMemoryGb,
  migrateMemorySettings,
  clientJvmFlags,
  minMemoryArg,
  CLIENT_HARD_CAP_GB,
} = require('../src/memory');

const GiB = 1024 ** 3;

describe('maxAllowedMemoryGb', () => {
  it('caps ~32 GiB laptop at 16 with OS reserve (not total-2=29/30)', () => {
    // Windows often reports ~31 GiB usable on a "32 GB" machine
    const max31 = maxAllowedMemoryGb(31 * GiB);
    assert.equal(max31, 16);
    const max32 = maxAllowedMemoryGb(32 * GiB);
    assert.equal(max32, 16);
  });

  it('leaves ≥25% / ≥4 GB free on 16 GiB', () => {
    // reserve = max(4, ceil(16*0.25)=4) → 16-4=12, hard-cap 16 → 12
    assert.equal(maxAllowedMemoryGb(16 * GiB), 12);
  });

  it('never exceeds CLIENT_HARD_CAP_GB', () => {
    assert.ok(maxAllowedMemoryGb(128 * GiB) <= CLIENT_HARD_CAP_GB);
  });
});

describe('recommendedMemoryGb', () => {
  it('recommends 8 GB on 24+ GiB systems (incl. ~31 GiB “32 GB” laptops)', () => {
    assert.equal(recommendedMemoryGb(32 * GiB), 8);
    assert.equal(recommendedMemoryGb(31 * GiB), 8);
    assert.equal(recommendedMemoryGb(24 * GiB), 8);
  });

  it('recommends 6 GB on 16 GiB systems', () => {
    assert.equal(recommendedMemoryGb(16 * GiB), 6);
  });

  it('recommends 4 GB on 8–12 GiB systems', () => {
    assert.equal(recommendedMemoryGb(8 * GiB), 4);
    assert.equal(recommendedMemoryGb(12 * GiB), 4);
  });
});

describe('clampMemoryGb', () => {
  it('falls back to recommended for invalid input', () => {
    assert.equal(clampMemoryGb(undefined, 32 * GiB), 8);
    assert.equal(clampMemoryGb('nope', 16 * GiB), 6);
  });

  it('clamps above max down', () => {
    assert.equal(clampMemoryGb(29, 32 * GiB), 16);
  });
});

describe('migrateMemorySettings', () => {
  it('pulls legacy 29 GB slider down to recommended once', () => {
    const { settings, migrated } = migrateMemorySettings(
      { memoryGb: 29 },
      32 * GiB
    );
    assert.equal(migrated, true);
    assert.equal(settings.memoryGb, 8);
    assert.equal(settings.memoryOptimizedV2, true);
  });

  it('does not keep resetting after migration flag', () => {
    const { settings } = migrateMemorySettings(
      { memoryGb: 10, memoryOptimizedV2: true },
      32 * GiB
    );
    assert.equal(settings.memoryGb, 10);
  });
});

describe('clientJvmFlags / minMemoryArg', () => {
  it('includes G1GC and skips AlwaysPreTouch for huge heaps', () => {
    const small = clientJvmFlags(6);
    assert.ok(small.includes('-XX:+UseG1GC'));
    assert.ok(small.includes('-XX:+AlwaysPreTouch'));
    const big = clientJvmFlags(12);
    assert.ok(!big.includes('-XX:+AlwaysPreTouch'));
  });

  it('scales min heap modestly', () => {
    assert.equal(minMemoryArg(4), '2G');
    assert.equal(minMemoryArg(8), '2G');
    assert.equal(minMemoryArg(2), '1G');
  });
});
