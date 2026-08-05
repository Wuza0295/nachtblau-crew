import { updateKartPhysics } from './karts.js';
import { useItem } from './items.js';
import { progressAlongTrack } from './tracks.js';

/**
 * Simple waypoint AI with rubber-banding (SNES-ish).
 */
export function updateAI(kart, track, karts, world, player, dt) {
  if (kart.isPlayer || kart.finished) return;

  const wps = track.waypoints;
  let target = wps[kart.aiTarget % wps.length];
  let dx = target.x - kart.x;
  let dy = target.y - kart.y;
  let dist = Math.hypot(dx, dy);
  if (dist < 55) {
    kart.aiTarget = (kart.aiTarget + 1) % wps.length;
    target = wps[kart.aiTarget];
    dx = target.x - kart.x;
    dy = target.y - kart.y;
  }

  const desired = Math.atan2(dy, dx);
  let diff = desired - kart.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  const steer = Math.max(-1, Math.min(1, diff * 2.2));
  const sharp = Math.abs(diff) > 0.55;
  const drift = sharp && kart.speed > 1.2;

  // Rubber band vs player
  const myP = progressAlongTrack(track, kart.x, kart.y) + kart.laps * wps.length;
  const plP = progressAlongTrack(track, player.x, player.y) + player.laps * wps.length;
  let throttle = 1;
  if (myP > plP + 4) throttle = 0.82;
  if (myP < plP - 3) throttle = 1.08;

  kart.aiTimer -= dt;
  if (kart.aiTimer <= 0) {
    kart.aiTimer = 0.4 + Math.random() * 0.8;
    // use items opportunistically
    if (kart.items[0] && Math.random() < 0.55) useItem(kart, 0, world, karts, track);
    else if (kart.items[1] && Math.random() < 0.4) useItem(kart, 1, world, karts, track);
  }

  updateKartPhysics(kart, track, { throttle, steer, drift }, dt);
}

export function gridPositions(track, count) {
  const { x, y, angle } = track.start;
  const positions = [];
  const px = Math.cos(angle + Math.PI / 2);
  const py = Math.sin(angle + Math.PI / 2);
  const bx = Math.cos(angle + Math.PI);
  const by = Math.sin(angle + Math.PI);
  // Place on road just past start/finish, facing race direction
  const forward = 20;
  const fx = Math.cos(angle) * forward;
  const fy = Math.sin(angle) * forward;
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / 2);
    const col = i % 2 === 0 ? -1 : 1;
    positions.push({
      x: x + fx + bx * (18 + row * 30) + px * col * 20,
      y: y + fy + by * (18 + row * 30) + py * col * 20,
      angle,
    });
  }
  return positions;
}
