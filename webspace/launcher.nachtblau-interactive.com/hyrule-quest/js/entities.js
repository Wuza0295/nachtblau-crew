import { TILE, DIR, PLAYER_SPEED, ENEMY_SPEED, SWORD_DURATION, HURT_DURATION } from './constants.js';
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
  }

  get cx() { return this.x + this.width / 2; }
  get cy() { return this.y + this.height / 2; }

  update(input, map, enemies) {
    this.frame++;

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

  move(dx, dy, map) {
    const margin = 2;
    const nx = this.x + dx;
    const ny = this.y + dy;

    if (!this.collides(nx, this.y, map, margin)) this.x = nx;
    if (!this.collides(this.x, ny, map, margin)) this.y = ny;

    this.x = Math.max(TILE, Math.min(this.x, 15 * TILE - this.width));
    this.y = Math.max(TILE + 8, Math.min(this.y, 14 * TILE - this.height));
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
      if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) return true;
      if (isSolid(map[ty][tx])) return true;
    }
    return false;
  }

  getSwordHitbox() {
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

  takeDamage(amount) {
    if (this.invincible > 0 || this.hurtTimer > 0) return;
    this.hp -= amount;
    this.hurtTimer = HURT_DURATION;
    this.invincible = 60;
    this.swordTimer = 0;
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
    this.dir = DIR.DOWN;
    this.alive = true;
    this.hurtTimer = 0;
    this.frame = 0;
    this.moveTimer = 0;
    this.moveDir = Math.floor(Math.random() * 4);
    this.knockback = { x: 0, y: 0 };
    this.width = 12;
    this.height = 12;

    const stats = {
      slime:   { hp: 2, damage: 1, speed: ENEMY_SPEED * 0.6 },
      bat:     { hp: 1, damage: 1, speed: ENEMY_SPEED * 1.4 },
      soldier: { hp: 4, damage: 2, speed: ENEMY_SPEED },
      boss:    { hp: 12, damage: 3, speed: ENEMY_SPEED * 0.8 },
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
      this.chasePlayer(map, player, 0.7);
    } else if (this.type === 'bat') {
      this.chasePlayer(map, player, 0.5);
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
        this.chasePlayer(map, player, 0.3);
      }
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
      if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) return true;
      if (isSolid(map[ty][tx])) return true;
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
    if (this.hp <= 0) this.alive = false;
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

  // Check tile destruction
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
    const ex = enemy.x;
    const ey = enemy.y;
    if (
      swordBox.x < ex + enemy.width &&
      swordBox.x + swordBox.w > ex &&
      swordBox.y < ey + enemy.height &&
      swordBox.y + swordBox.h > ey
    ) {
      hits.push({ type: 'enemy', enemy });
    }
  }

  return hits;
}

export function spawnDrop(type, x, y) {
  const drops = {
    slime:   [{ type: 'rupee', chance: 0.4, value: 1 }],
    bat:     [{ type: 'heart', chance: 0.2 }],
    soldier: [{ type: 'rupee', chance: 0.5, value: 3 }, { type: 'heart', chance: 0.15 }],
    boss:    [{ type: 'rupee', chance: 1, value: 50 }],
  };
  const table = drops[type] || [];
  for (const d of table) {
    if (Math.random() < d.chance) {
      return { type: d.type, x, y, value: d.value || 1, collected: false };
    }
  }
  return null;
}
