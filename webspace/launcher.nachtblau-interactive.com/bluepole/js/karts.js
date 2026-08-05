import { isOnRoad } from './tracks.js?v=8';
import { buildTeamStats, getCharacter, getKartClass } from './characters.js?v=8';
import { ITEM } from './constants.js?v=8';

let nextId = 1;

/**
 * @param {object} opts
 */
export function createKart(opts) {
  const driver = getCharacter(opts.driverId);
  const passenger = getCharacter(opts.passengerId);
  const kartClass = getKartClass(opts.kartId || 'cruiser');
  const stats = buildTeamStats(driver, passenger, kartClass);
  return {
    id: nextId++,
    isPlayer: !!opts.isPlayer,
    name: opts.name || `${driver.name} & ${passenger.name}`,
    driver,
    passenger,
    kartClass,
    stats,
    x: opts.x || 0,
    y: opts.y || 0,
    angle: opts.angle || 0,
    speed: 0,
    steer: 0,
    drifting: false,
    driftDir: 0,
    driftCharge: 0,
    miniTurbo: 0,
    boost: 0,
    invuln: 0,
    spin: 0,
    shrink: 0,
    fireTrail: 0,
    guardWall: 0,
    mushroomsLeft: 0,
    items: [ITEM.NONE, ITEM.NONE], // Double Dash: slot 0 driver, slot 1 passenger
    activeSlot: 0,
    laps: 0,
    checkpoint: 0,
    finished: false,
    finishPlace: 0,
    finishTime: 0,
    place: 1,
    color: driver.color,
    accent: passenger.color,
    aiTarget: 0,
    aiTimer: 0,
    stun: 0,
  };
}

export function resetKartPosition(kart, x, y, angle) {
  kart.x = x;
  kart.y = y;
  kart.angle = angle;
  kart.speed = 0;
  kart.steer = 0;
  kart.drifting = false;
  kart.driftDir = 0;
  kart.driftCharge = 0;
  kart.miniTurbo = 0;
  kart.boost = 0;
  kart.invuln = 0;
  kart.spin = 0;
  kart.shrink = 0;
  kart.fireTrail = 0;
  kart.guardWall = 0;
  kart.mushroomsLeft = 0;
  kart.items = [ITEM.NONE, ITEM.NONE];
  kart.laps = 0;
  kart.checkpoint = 0;
  kart.finished = false;
  kart.finishPlace = 0;
  kart.finishTime = 0;
  kart.stun = 0;
}

/**
 * SNES feel + GC Double Dash drift/mini-turbo.
 * @param {object} kart
 * @param {object} track
 * @param {{throttle:number, steer:number, drift:boolean}} ctrl
 * @param {number} dt
 */
export function updateKartPhysics(kart, track, ctrl, dt) {
  if (kart.finished) return;
  if (kart.stun > 0) {
    kart.stun -= dt;
    kart.speed *= 0.92;
  }
  if (kart.spin > 0) {
    kart.spin -= dt;
    kart.angle += 0.25 * dt * 60;
    kart.speed *= 0.9;
    return;
  }

  const stats = kart.stats;
  const onRoad = isOnRoad(track, kart.x, kart.y);
  const surface = onRoad ? 1 : 0.42;
  const shrinkMul = kart.shrink > 0 ? 0.55 : 1;

  // Boost / mini-turbo (GC-style)
  if (kart.boost > 0) {
    kart.boost -= dt;
    kart.speed = Math.max(kart.speed, stats.topSpeed * 1.35 * shrinkMul);
  }
  if (kart.miniTurbo > 0) {
    kart.miniTurbo -= dt;
    kart.speed = Math.max(kart.speed, stats.topSpeed * 1.22 * shrinkMul);
  }
  if (kart.invuln > 0) kart.invuln -= dt;
  if (kart.shrink > 0) kart.shrink -= dt;
  if (kart.fireTrail > 0) kart.fireTrail -= dt;
  if (kart.guardWall > 0) kart.guardWall -= dt;

  const throttle = ctrl.throttle;
  const maxSpeed = stats.topSpeed * surface * shrinkMul * (kart.invuln > 0 ? 1.15 : 1);

  if (throttle > 0) {
    kart.speed += stats.accel * throttle * dt * 60 * (onRoad ? 1 : 0.5);
  } else if (throttle < 0) {
    kart.speed += stats.accel * throttle * 1.4 * dt * 60;
  } else {
    kart.speed *= Math.pow(0.985, dt * 60);
  }

  if (kart.speed > maxSpeed) kart.speed += (maxSpeed - kart.speed) * 0.08;
  if (kart.speed < -maxSpeed * 0.35) kart.speed = -maxSpeed * 0.35;

  // Drift (Double Dash / modern MK): hold drift + steer to charge mini-turbo
  const wantDrift = ctrl.drift && Math.abs(kart.speed) > stats.topSpeed * 0.35;
  if (wantDrift) {
    if (!kart.drifting) {
      kart.drifting = true;
      kart.driftDir = Math.sign(ctrl.steer) || kart.driftDir || 1;
      kart.driftCharge = 0;
    }
    const steerInto = ctrl.steer || kart.driftDir;
    if (Math.sign(steerInto) === Math.sign(kart.driftDir) || ctrl.steer === 0) {
      kart.driftCharge += dt * stats.drift * (1 + Math.abs(ctrl.steer) * 0.5);
    } else {
      // opposite steer = tighter drift, slightly more charge
      kart.driftCharge += dt * stats.drift * 1.35;
      kart.driftDir = Math.sign(ctrl.steer);
    }
    const driftSteer = kart.driftDir * 0.7 + ctrl.steer * 0.55;
    kart.angle += driftSteer * stats.handling * 1.35 * dt * 60 * Math.sign(Math.max(0.15, kart.speed));
  } else {
    if (kart.drifting) {
      // Release: mini-turbo tiers (GC-inspired)
      if (kart.driftCharge > 1.35) {
        kart.miniTurbo = 0.85;
        kart.boost = Math.max(kart.boost, 0.2);
      } else if (kart.driftCharge > 0.7) {
        kart.miniTurbo = 0.45;
      }
      kart.drifting = false;
      kart.driftCharge = 0;
    }
    kart.angle += ctrl.steer * stats.handling * dt * 60 * Math.sign(Math.max(0.12, Math.abs(kart.speed)));
  }

  kart.x += Math.cos(kart.angle) * kart.speed * dt * 60;
  kart.y += Math.sin(kart.angle) * kart.speed * dt * 60;

  // Soft world wrap within track canvas
  const S = 1024;
  if (kart.x < 40) kart.x = 40;
  if (kart.y < 40) kart.y = 40;
  if (kart.x > S - 40) kart.x = S - 40;
  if (kart.y > S - 40) kart.y = S - 40;
}

export function applyHit(kart, strength = 1) {
  if (kart.invuln > 0 || kart.guardWall > 0) return false;
  kart.spin = 0.55 * strength;
  kart.speed *= 0.25;
  if (kart.shrink > 0) {
    // already small — harsher
    kart.stun = 0.4;
  }
  return true;
}
