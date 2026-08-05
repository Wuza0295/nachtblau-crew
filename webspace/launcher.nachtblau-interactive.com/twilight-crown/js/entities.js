import {
  TILE, DIR, PLAYER_SPEED, ENEMY_SPEED, SWORD_DURATION,
  SWORD_ACTIVE_FROM, SWORD_ACTIVE_TO, HURT_DURATION,
  KNOCKBACK_DURATION, KNOCKBACK_FORCE, SWORD_BEAM_SPEED,
} from './constants.js';
import { isSolid, isDestructible } from './maps.js';

export class Player {
  constructor(x, y) {
    this.x = x * TILE + 4;
    this.y = y * TILE + 2;
    this.dir = DIR.DOWN;
    this.hp = 6;
    this.maxHp = 6;
    this.speed = PLAYER_SPEED;
    this.state = 'idle';
    this.frame = 0;
    this.swordTimer = 0;
    this.hurtTimer = 0;
    this.invincible = 0;
    this.swordPower = 1;
    this.width = 12;
    this.height = 14;
    this.knockback = { x: 0, y: 0, timer: 0 };
    this.carriedPot = null;
  }

  get cx() { return this.x + this.width / 2; }
  get cy() { return this.y + this.height / 2; }

  get feetY() { return this.y + this.height; }

  update(input, map) {
    this.frame++;

    if (this.knockback.timer > 0) {
      this.knockback.timer--;
      this.x += this.knockback.x;
      this.y += this.knockback.y;
      this.knockback.x *= 0.6;
      this.knockback.y *= 0.6;
      this.state = 'hurt';
      this.clampToRoom();
      return null;
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer--;
      this.state = 'hurt';
      if (this.hurtTimer === 0) this.state = 'idle';
      return null;
    }

    if (this.swordTimer > 0) {
      this.swordTimer--;
      this.state = 'attack';
      return this.getSwordHitbox();
    }

    if (this.carriedPot) {
      this.state = 'carry';
      const { dx, dy } = input.move;
      if (dx !== 0 || dy !== 0) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.dir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
        } else {
          this.dir = dy > 0 ? DIR.DOWN : DIR.UP;
        }
        this.move(dx * this.speed * 0.55, dy * this.speed * 0.55, map);
      }
      if (input.attack || input.throw) {
        return { throwPot: true, dir: this.dir };
      }
      return null;
    }

    if (input.attack) {
      this.swordTimer = SWORD_DURATION;
      this.state = 'attack';
      return this.getSwordHitbox();
    }

    const { dx, dy } = input.move;
    if (dx !== 0 || dy !== 0) {
      this.state = 'walk';
      if (Math.abs(dx) > Math.abs(dy)) {
        this.dir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
      } else {
        this.dir = dy > 0 ? DIR.DOWN : DIR.UP;
      }
      this.move(dx * this.speed, dy * this.speed, map);
    } else {
      this.state = 'idle';
    }

    return null;
  }

  clampToRoom() {
    // Soft edges — player may reach screen border for ALttP transitions
    this.x = Math.max(-8, Math.min(this.x, 16 * TILE - this.width + 8));
    this.y = Math.max(8, Math.min(this.y, 14 * TILE - this.height + 6));
  }

  move(dx, dy, map) {
    const margin = 2;
    const nx = this.x + dx;
    const ny = this.y + dy;

    if (!this.collides(nx, this.y, map, margin)) this.x = nx;
    if (!this.collides(this.x, ny, map, margin)) this.y = ny;
    this.clampToRoom();
  }

  collides(x, y, map, margin = 0) {
    const points = [
      [x + margin, y + margin],
      [x + this.width - margin, y + margin],
      [x + margin, y + this.height - margin],
      [x + this.width - margin, y + this.height - margin],
    ];
    for (const [px, py] of points) {
      const tx = Math.floor(px / TILE);
      const ty = Math.floor(py / TILE);
      // Out-of-bounds is passable so screen-edge exits work (Zelda pattern)
      if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) continue;
      const localX = px - tx * TILE;
      const localY = py - ty * TILE;
      if (isSolid(map[ty][tx], localX, localY)) return true;
    }
    return false;
  }

  getSwordHitbox() {
    const frame = SWORD_DURATION - this.swordTimer;
    if (frame < SWORD_ACTIVE_FROM || frame > SWORD_ACTIVE_TO) return null;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const reach = this.swordPower > 1 ? 18 : 14;
    const size = 10;
    const offsets = {
      [DIR.UP]:    { x: cx - size / 2, y: cy - reach, w: size, h: reach },
      [DIR.DOWN]:  { x: cx - size / 2, y: cy, w: size, h: reach },
      [DIR.LEFT]:  { x: cx - reach, y: cy - size / 2, w: reach, h: size },
      [DIR.RIGHT]: { x: cx, y: cy - size / 2, w: reach, h: size },
    };
    return { ...offsets[this.dir], dir: this.dir };
  }

  takeDamage(amount, fromDir = null) {
    if (this.invincible > 0 || this.hurtTimer > 0 || this.knockback.timer > 0) return;
    this.hp -= amount;
    this.hurtTimer = HURT_DURATION;
    this.invincible = 90;
    this.swordTimer = 0;
    this.carriedPot = null;
    const d = fromDir ?? this.dir;
    const kb = KNOCKBACK_FORCE;
    const dirs = [
      { x: 0, y: -kb }, { x: kb, y: 0 },
      { x: 0, y: kb }, { x: -kb, y: 0 },
    ];
    this.knockback = { ...dirs[d], timer: KNOCKBACK_DURATION };
  }

  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }

  addHeartContainer() {
    this.maxHp += 2;
    this.hp = this.maxHp;
  }
}

export class Enemy {
  constructor(type, tx, ty) {
    this.type = type;
    this.x = tx * TILE + 2;
    this.y = ty * TILE + 2;
    this.alive = true;
    this.hurtTimer = 0;
    this.frame = 0;
    this.moveTimer = 0;
    this.moveDir = Math.floor(Math.random() * 4);
    this.knockback = { x: 0, y: 0 };
    this.width = 12;
    this.height = 12;
    this.phase = 0;
    this.attackTimer = 60;
    this.projectiles = [];

    const stats = {
      slime:   { hp: 2, damage: 1, speed: ENEMY_SPEED * 0.6 },
      bat:     { hp: 1, damage: 1, speed: ENEMY_SPEED * 1.4 },
      soldier: { hp: 4, damage: 2, speed: ENEMY_SPEED },
      ghost:   { hp: 3, damage: 2, speed: ENEMY_SPEED * 1.1 },
      wraith:  { hp: 4, damage: 2, speed: ENEMY_SPEED * 1.25 },
      boss:        { hp: 16, damage: 3, speed: ENEMY_SPEED * 0.8 },
      mist_boss:   { hp: 12, damage: 2, speed: ENEMY_SPEED * 1.1 },
      iron_boss:   { hp: 20, damage: 4, speed: ENEMY_SPEED * 0.65 },
    };
    const s = stats[type] || stats.slime;
    this.hp = s.hp;
    this.maxHp = s.hp;
    this.damage = s.damage;
    this.speed = s.speed;
  }

  update(map, player) {
    if (!this.alive) return;
    this.frame++;

    if (this.hurtTimer > 0) {
      this.hurtTimer--;
      this.x += this.knockback.x;
      this.y += this.knockback.y;
      this.knockback.x *= 0.5;
      this.knockback.y *= 0.5;
      return;
    }

    this.moveTimer++;
    const changeInterval = this.type === 'bat' ? 30 : 60;

    if (this.type === 'boss') {
      this.updateBoss(map, player);
    } else if (this.type === 'mist_boss') {
      this.updateMistBoss(map, player);
    } else if (this.type === 'iron_boss') {
      this.updateIronBoss(map, player);
    } else if (this.type === 'bat' || this.type === 'ghost' || this.type === 'wraith') {
      const chase = { bat: 0.55, ghost: 0.4, wraith: 0.65 };
      this.chasePlayer(map, player, chase[this.type]);
    } else {
      if (this.moveTimer > changeInterval) {
        this.moveTimer = 0;
        this.moveDir = Math.floor(Math.random() * 4);
      }
      const dirs = [
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
      ];
      const d = dirs[this.moveDir];
      this.tryMove(d.dx * this.speed, d.dy * this.speed, map);

      const dist = Math.hypot(player.cx - (this.x + 6), player.cy - (this.y + 6));
      if (dist < 80 && this.type === 'soldier') {
        this.chasePlayer(map, player, 0.35);
      }
    }
  }

  updateBoss(map, player) {
    this.attackTimer--;
    if (this.attackTimer <= 0) {
      this.attackTimer = 90;
      const dx = player.cx - (this.x + 6);
      const dy = player.cy - (this.y + 6);
      const dist = Math.hypot(dx, dy) || 1;
      for (let i = -1; i <= 1; i++) {
        const angle = Math.atan2(dy, dx) + i * 0.35;
        this.projectiles.push(new BossProjectile(
          this.x + 6, this.y + 6,
          Math.cos(angle) * 2.2, Math.sin(angle) * 2.2, 2,
        ));
      }
    }
    this.chasePlayer(map, player, 0.55);
  }

  updateMistBoss(map, player) {
    this.attackTimer--;
    if (this.attackTimer <= 0) {
      this.attackTimer = 70;
      this.phase = (this.phase + 1) % 4;
      const dirs = [
        { x: 0, y: -3 }, { x: 3, y: 0 },
        { x: 0, y: 3 }, { x: -3, y: 0 },
      ];
      const d = dirs[this.phase];
      this.x = Math.max(32, Math.min(this.x + d.x * 8, 16 * TILE - 44));
      this.y = Math.max(32, Math.min(this.y + d.y * 8, 14 * TILE - 44));
      this.projectiles.push(new BossProjectile(this.x + 6, this.y + 6, 0, 0, 1, 40));
    }
    if (this.moveTimer % 20 === 0) {
      this.chasePlayer(map, player, 0.35);
    }
  }

  updateIronBoss(map, player) {
    this.attackTimer--;
    if (this.attackTimer <= 0) {
      this.attackTimer = 110;
      const dx = player.cx - (this.x + 6);
      const dy = player.cy - (this.y + 6);
      const dist = Math.hypot(dx, dy) || 1;
      this.knockback = { x: (dx / dist) * 6, y: (dy / dist) * 6 };
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i;
        this.projectiles.push(new BossProjectile(
          this.x + 6, this.y + 6,
          Math.cos(a) * 1.8, Math.sin(a) * 1.8, 3,
        ));
      }
    } else if (this.attackTimer > 80) {
      this.chasePlayer(map, player, 1.1);
    }
  }

  chasePlayer(map, player, factor) {
    const dx = player.cx - (this.x + 6);
    const dy = player.cy - (this.y + 6);
    const dist = Math.hypot(dx, dy);
    if (dist > 4) {
      this.tryMove((dx / dist) * this.speed * factor, (dy / dist) * this.speed * factor, map);
    }
  }

  tryMove(dx, dy, map) {
    const nx = this.x + dx;
    const ny = this.y + dy;
    if (!this.collides(nx, this.y, map)) this.x = nx;
    if (!this.collides(this.x, ny, map)) this.y = ny;
  }

  collides(x, y, map) {
    const margin = 1;
    const points = [
      [x + margin, y + margin],
      [x + this.width - margin, y + margin],
      [x + margin, y + this.height - margin],
      [x + this.width - margin, y + this.height - margin],
    ];
    for (const [px, py] of points) {
      const tx = Math.floor(px / TILE);
      const ty = Math.floor(py / TILE);
      if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) continue;
      if (isSolid(map[ty][tx], px - tx * TILE, py - ty * TILE)) return true;
    }
    return false;
  }

  takeDamage(amount, dir) {
    if (this.hurtTimer > 0) return;
    this.hp -= amount;
    this.hurtTimer = 10;
    const kb = 4;
    const dirs = [
      { x: 0, y: -kb }, { x: kb, y: 0 },
      { x: 0, y: kb }, { x: -kb, y: 0 },
    ];
    this.knockback = { ...dirs[dir] };
    if (this.hp <= 0) {
      this.alive = false;
      this.projectiles = [];
    }
  }

  getActiveProjectiles() {
    return this.projectiles || [];
  }

  updateProjectiles(player, onHit) {
    if (!this.projectiles) return;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update();
      if (!p.alive) {
        this.projectiles.splice(i, 1);
        continue;
      }
      if (
        player.x < p.x + p.size &&
        player.x + player.width > p.x &&
        player.y < p.y + p.size &&
        player.y + player.height > p.y
      ) {
        onHit(p.damage);
        p.alive = false;
        this.projectiles.splice(i, 1);
      }
    }
  }

  touchesPlayer(player) {
    if (!this.alive || this.hurtTimer > 0) return false;
    return (
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y < this.y + this.height &&
      player.y + player.height > this.y
    );
  }
}

export function checkSwordHits(swordBox, enemies, map) {
  const hits = [];
  if (!swordBox) return hits;

  const tx1 = Math.floor(swordBox.x / TILE);
  const ty1 = Math.floor(swordBox.y / TILE);
  const tx2 = Math.floor((swordBox.x + swordBox.w) / TILE);
  const ty2 = Math.floor((swordBox.y + swordBox.h) / TILE);

  for (let ty = ty1; ty <= ty2; ty++) {
    for (let tx = tx1; tx <= tx2; tx++) {
      if (ty >= 0 && ty < map.length && tx >= 0 && tx < map[0].length) {
        if (isDestructible(map[ty][tx])) {
          hits.push({ type: 'tile', x: tx, y: ty });
        }
      }
    }
  }

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    if (
      swordBox.x < enemy.x + enemy.width &&
      swordBox.x + swordBox.w > enemy.x &&
      swordBox.y < enemy.y + enemy.height &&
      swordBox.y + swordBox.h > enemy.y
    ) {
      hits.push({ type: 'enemy', enemy });
    }
  }

  return hits;
}

export class BossProjectile {
  constructor(x, y, vx, vy, damage, life = 80) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.alive = true;
    this.life = life;
    this.size = 6;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    if (this.life <= 0) this.alive = false;
    if (this.x < 0 || this.x > 256 || this.y < 16 || this.y > 224) this.alive = false;
  }
}

export class SwordBeam {
  constructor(x, y, dir, power) {
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.power = power;
    this.alive = true;
    this.width = 10;
    this.height = 10;
    this.frame = 0;
    const v = SWORD_BEAM_SPEED;
    this.vx = [0, v, 0, -v][dir];
    this.vy = [-v, 0, v, 0][dir];
  }

  update(map, enemies) {
    this.frame++;
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > 16 * TILE || this.y < 16 || this.y > 14 * TILE) {
      this.alive = false;
      return [];
    }
    const tx = Math.floor((this.x + 5) / TILE);
    const ty = Math.floor((this.y + 5) / TILE);
    if (ty >= 0 && ty < map.length && tx >= 0 && tx < map[0].length) {
      const tile = map[ty][tx];
      if (isSolid(tile, 8, 8)) this.alive = false;
    }
    const hits = [];
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (
        this.x < enemy.x + enemy.width &&
        this.x + this.width > enemy.x &&
        this.y < enemy.y + enemy.height &&
        this.y + this.height > enemy.y
      ) {
        hits.push(enemy);
        this.alive = false;
        break;
      }
    }
    return hits;
  }
}

export class ThrownPot {
  constructor(x, y, dir) {
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.alive = true;
    this.frame = 0;
    this.width = 10;
    this.height = 10;
    const s = 2.5;
    this.vx = [0, s, 0, -s][dir];
    this.vy = [-s, 0, s, 0][dir];
  }

  update(map) {
    this.frame++;
    this.x += this.vx;
    this.y += this.vy;
    if (this.frame > 40) { this.alive = false; return null; }
    const tx = Math.floor((this.x + 5) / TILE);
    const ty = Math.floor((this.y + 5) / TILE);
    if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) {
      this.alive = false;
      return { x: tx, y: ty, impact: true };
    }
    if (isSolid(map[ty][tx], 8, 8)) {
      this.alive = false;
      return { x: tx, y: ty, impact: true };
    }
    return null;
  }
}

export function spawnDrop(type, x, y) {
  const drops = {
    slime:   [{ type: 'rupee', chance: 0.4, value: 1 }],
    bat:     [{ type: 'heart', chance: 0.2 }],
    soldier: [{ type: 'rupee', chance: 0.5, value: 3 }, { type: 'heart', chance: 0.15 }],
    ghost:   [{ type: 'rupee', chance: 0.35, value: 2 }, { type: 'heart', chance: 0.1 }],
    wraith:  [{ type: 'rupee', chance: 0.45, value: 4 }, { type: 'heart', chance: 0.2 }],
    boss:    [{ type: 'rupee', chance: 1, value: 50 }],
    mist_boss: [{ type: 'heart', chance: 1 }],
    iron_boss: [{ type: 'rupee', chance: 1, value: 30 }, { type: 'heart', chance: 0.5 }],
  };
  const table = drops[type] || [];
  for (const d of table) {
    if (Math.random() < d.chance) {
      return { type: d.type, x, y, value: d.value || 1, collected: false };
    }
  }
  return null;
}

export class Npc {
  constructor({ type, x, y, dir = DIR.DOWN, dialog }) {
    this.type = type;
    this.x = x * TILE + 4;
    this.y = y * TILE + 2;
    this.dir = dir;
    this.dialog = dialog;
    this.width = 12;
    this.height = 14;
  }
}
