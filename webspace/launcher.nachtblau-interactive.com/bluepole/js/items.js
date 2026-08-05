import { ITEM, ITEM_COLORS } from './constants.js?v=8';
import { applyHit } from './karts.js?v=8';
import { raceProgress } from './tracks.js?v=8';

/**
 * Double Dash item system: two slots, swap, character specials.
 */

const COMMON_TABLE = [
  ITEM.BANANA, ITEM.BANANA, ITEM.GREEN_SHELL, ITEM.GREEN_SHELL,
  ITEM.MUSHROOM, ITEM.RED_SHELL, ITEM.FAKE_BOX,
];

const MID_TABLE = [
  ITEM.GREEN_SHELL, ITEM.RED_SHELL, ITEM.MUSHROOM, ITEM.TRIPLE_MUSHROOM,
  ITEM.BANANA, ITEM.SPECIAL, ITEM.FAKE_BOX,
];

const BACK_TABLE = [
  ITEM.RED_SHELL, ITEM.STAR, ITEM.LIGHTNING, ITEM.TRIPLE_MUSHROOM,
  ITEM.SPECIAL, ITEM.MUSHROOM, ITEM.SPECIAL,
];

function pick(table) {
  return table[(Math.random() * table.length) | 0];
}

export function rollItem(kart, place, fieldCount) {
  const ratio = (place - 1) / Math.max(1, fieldCount - 1);
  if (ratio < 0.34) return pick(COMMON_TABLE);
  if (ratio < 0.67) return pick(MID_TABLE);
  return pick(BACK_TABLE);
}

export function giveItem(kart, item) {
  if (kart.items[0] == null) {
    kart.items[0] = item;
    return true;
  }
  if (kart.items[1] == null) {
    kart.items[1] = item;
    return true;
  }
  return false;
}

export function swapItems(kart) {
  const t = kart.items[0];
  kart.items[0] = kart.items[1];
  kart.items[1] = t;
}

export function createItemWorld() {
  return {
    boxes: [], // {x,y,alive,timer,id}
    hazards: [], // bananas, fake boxes, shells in flight, fire, walls
    effects: [],
  };
}

export function resetItemWorld(world, track) {
  world.boxes = track.itemBoxes.map((b, i) => ({
    id: i,
    x: b.x,
    y: b.y,
    alive: true,
    timer: 0,
  }));
  world.hazards = [];
  world.effects = [];
}

function spawnHazard(world, h) {
  world.hazards.push(h);
}

/**
 * Use item from slot (0 = driver / Z, 1 = passenger / X)
 */
export function useItem(kart, slot, world, karts, track) {
  const item = kart.items[slot];
  if (!item || kart.spin > 0 || kart.stun > 0) return;

  if (item === ITEM.SPECIAL) {
    fireSpecial(kart, slot, world, karts, track);
    kart.items[slot] = ITEM.NONE;
    return;
  }

  if (item === ITEM.BANANA) {
    spawnHazard(world, {
      type: 'banana',
      x: kart.x - Math.cos(kart.angle) * 28,
      y: kart.y - Math.sin(kart.angle) * 28,
      owner: kart.id,
      life: 25,
    });
  } else if (item === ITEM.FAKE_BOX) {
    spawnHazard(world, {
      type: 'fake',
      x: kart.x - Math.cos(kart.angle) * 30,
      y: kart.y - Math.sin(kart.angle) * 30,
      owner: kart.id,
      life: 30,
    });
  } else if (item === ITEM.GREEN_SHELL) {
    spawnHazard(world, {
      type: 'shell',
      color: 'green',
      x: kart.x + Math.cos(kart.angle) * 24,
      y: kart.y + Math.sin(kart.angle) * 24,
      angle: kart.angle,
      speed: 4.2,
      owner: kart.id,
      life: 8,
      homing: false,
    });
  } else if (item === ITEM.RED_SHELL) {
    const target = findKartAhead(kart, karts, track);
    spawnHazard(world, {
      type: 'shell',
      color: 'red',
      x: kart.x + Math.cos(kart.angle) * 24,
      y: kart.y + Math.sin(kart.angle) * 24,
      angle: kart.angle,
      speed: 4.0,
      owner: kart.id,
      life: 10,
      homing: true,
      targetId: target?.id ?? null,
    });
  } else if (item === ITEM.MUSHROOM) {
    kart.boost = Math.max(kart.boost, 0.7);
  } else if (item === ITEM.TRIPLE_MUSHROOM) {
    kart.boost = Math.max(kart.boost, 0.7);
    kart.mushroomsLeft = 2;
    kart.items[slot] = ITEM.MUSHROOM;
    return;
  } else if (item === ITEM.STAR) {
    kart.invuln = 4.5;
    kart.boost = Math.max(kart.boost, 0.5);
  } else if (item === ITEM.LIGHTNING) {
    for (const other of karts) {
      if (other.id === kart.id || other.finished) continue;
      if (other.invuln > 0) continue;
      other.shrink = 5.5;
      other.speed *= 0.4;
      other.spin = 0.35;
    }
  }

  kart.items[slot] = ITEM.NONE;
}

function fireSpecial(kart, slot, world, karts, track) {
  const special = kart.stats.specials[slot];
  switch (special) {
    case 'star_burst':
      kart.invuln = 2.2;
      kart.boost = 1.1;
      break;
    case 'shadow_shell': {
      const target = findKartAhead(kart, karts, track);
      spawnHazard(world, {
        type: 'shell',
        color: 'shadow',
        x: kart.x + Math.cos(kart.angle) * 24,
        y: kart.y + Math.sin(kart.angle) * 24,
        angle: kart.angle,
        speed: 4.6,
        owner: kart.id,
        life: 12,
        homing: true,
        targetId: target?.id ?? null,
      });
      break;
    }
    case 'fire_trail':
      kart.fireTrail = 3.5;
      break;
    case 'chain_zap': {
      const ahead = karts
        .filter((k) => k.id !== kart.id && !k.finished && k.place < kart.place)
        .sort((a, b) => a.place - b.place)
        .slice(0, 2);
      for (const t of ahead) {
        applyHit(t, 0.85);
        t.stun = 0.5;
      }
      break;
    }
    case 'boulder':
      spawnHazard(world, {
        type: 'boulder',
        x: kart.x + Math.cos(kart.angle) * 30,
        y: kart.y + Math.sin(kart.angle) * 30,
        angle: kart.angle,
        speed: 3.2,
        owner: kart.id,
        life: 6,
      });
      break;
    case 'mirror_box': {
      // steal a random item from nearest rival
      let nearest = null;
      let best = Infinity;
      for (const o of karts) {
        if (o.id === kart.id) continue;
        const d = (o.x - kart.x) ** 2 + (o.y - kart.y) ** 2;
        if (d < best) {
          best = d;
          nearest = o;
        }
      }
      if (nearest) {
        const idx = nearest.items[0] ? 0 : nearest.items[1] ? 1 : -1;
        if (idx >= 0) {
          giveItem(kart, nearest.items[idx]);
          nearest.items[idx] = ITEM.NONE;
        } else {
          giveItem(kart, ITEM.MUSHROOM);
        }
      }
      break;
    }
    case 'guard_wall':
      kart.guardWall = 4;
      spawnHazard(world, {
        type: 'wall',
        x: kart.x - Math.cos(kart.angle) * 22,
        y: kart.y - Math.sin(kart.angle) * 22,
        angle: kart.angle,
        owner: kart.id,
        life: 4,
        follow: true,
      });
      break;
    case 'warp_dash':
      kart.x += Math.cos(kart.angle) * 90;
      kart.y += Math.sin(kart.angle) * 90;
      kart.boost = 0.55;
      kart.invuln = Math.max(kart.invuln, 0.6);
      break;
    default:
      kart.boost = 0.8;
  }
}

function findKartAhead(kart, karts, track) {
  const myProg = raceProgress(track, kart);
  let best = null;
  let bestProg = Infinity;
  for (const o of karts) {
    if (o.id === kart.id || o.finished) continue;
    const p = raceProgress(track, o);
    if (p > myProg && p < bestProg) {
      bestProg = p;
      best = o;
    }
  }
  return best;
}

export function updateItems(world, karts, track, dt) {
  // Respawn boxes
  for (const box of world.boxes) {
    if (!box.alive) {
      box.timer -= dt;
      if (box.timer <= 0) box.alive = true;
    }
  }

  // Box pickup
  for (const box of world.boxes) {
    if (!box.alive) continue;
    for (const kart of karts) {
      if (kart.finished) continue;
      const d = (kart.x - box.x) ** 2 + (kart.y - box.y) ** 2;
      if (d < 26 * 26) {
        const hasRoom = kart.items[0] == null || kart.items[1] == null;
        if (hasRoom) {
          giveItem(kart, rollItem(kart, kart.place, karts.length));
          box.alive = false;
          box.timer = 4.5;
        }
      }
    }
  }

  // Fire trail deposits
  for (const kart of karts) {
    if (kart.fireTrail > 0) {
      if (Math.random() < dt * 12) {
        spawnHazard(world, {
          type: 'fire',
          x: kart.x - Math.cos(kart.angle) * 20,
          y: kart.y - Math.sin(kart.angle) * 20,
          owner: kart.id,
          life: 2.2,
        });
      }
    }
  }

  // Hazards
  for (let i = world.hazards.length - 1; i >= 0; i--) {
    const h = world.hazards[i];
    h.life -= dt;
    if (h.life <= 0) {
      world.hazards.splice(i, 1);
      continue;
    }

    if (h.type === 'shell' || h.type === 'boulder') {
      if (h.homing && h.targetId != null) {
        const target = karts.find((k) => k.id === h.targetId);
        if (target && !target.finished) {
          const desired = Math.atan2(target.y - h.y, target.x - h.x);
          let diff = desired - h.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          h.angle += Math.max(-0.08, Math.min(0.08, diff));
        }
      }
      h.x += Math.cos(h.angle) * h.speed * dt * 60;
      h.y += Math.sin(h.angle) * h.speed * dt * 60;
    }

    if (h.type === 'wall' && h.follow) {
      const owner = karts.find((k) => k.id === h.owner);
      if (owner) {
        h.x = owner.x - Math.cos(owner.angle) * 22;
        h.y = owner.y - Math.sin(owner.angle) * 22;
        h.angle = owner.angle;
      }
    }

    // Collisions
    for (const kart of karts) {
      if (kart.id === h.owner && (h.type === 'shell' || h.type === 'boulder') && h.life > 7.5) continue;
      if (kart.finished) continue;
      const rad = h.type === 'boulder' ? 30 : h.type === 'wall' ? 22 : 16;
      const d = (kart.x - h.x) ** 2 + (kart.y - h.y) ** 2;
      if (d < rad * rad) {
        if (h.type === 'wall') {
          if (kart.id !== h.owner) applyHit(kart, 0.7);
          continue;
        }
        applyHit(kart, h.type === 'boulder' ? 1.3 : 1);
        if (h.type === 'shell' || h.type === 'boulder' || h.type === 'banana' || h.type === 'fake' || h.type === 'fire') {
          world.hazards.splice(i, 1);
          break;
        }
      }
    }
  }
}

export function itemColor(item) {
  return ITEM_COLORS[item] || '#fff';
}
