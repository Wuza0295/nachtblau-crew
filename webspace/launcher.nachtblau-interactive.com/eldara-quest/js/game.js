import { TILE, SWORD_DURATION, CHEST_PAUSE, DIR } from './constants.js';
import { OVERWORLD, hasOverhead } from './maps.js';
import { Player, checkSwordHits, spawnDrop, SwordBeam, ThrownPot } from './entities.js';
import { World } from './world.js';
import {
  drawTile, drawPlayer, drawSword, drawEnemy, drawNpc,
  drawItem, drawHUD, drawMessage, drawTransition,
  drawCarriedPot, drawThrownPot, drawSwordBeam, drawParticles,
  drawBossProjectile, drawDungeonMap,
} from './sprites.js';
import { getMovement, clearPressed } from './input.js';
import { createDungeonProgress, markRoomExplored, getDungeonId, readActions } from './dungeon-state.js';

export const STATE = {
  TITLE: 'title',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
};

function knockbackDir(fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? DIR.RIGHT : DIR.LEFT;
  return dy > 0 ? DIR.DOWN : DIR.UP;
}

function spawnBurst(particles, x, y, color, count = 6) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3 - 1,
      life: 12 + Math.floor(Math.random() * 8),
      maxLife: 20,
      size: 2,
      color,
    });
  }
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.state = STATE.TITLE;
    this.frame = 0;
    this.world = new World();
    this.player = null;
    this.rupees = 0;
    this.bombs = 0;
    this.dungeonProgress = createDungeonProgress();
    this.bombFlash = null;
    this.message = null;
    this.messageTimer = 0;
    this.hitEnemies = new Set();
    this.lastRoomKey = null;
    this.beams = [];
    this.thrownPots = [];
    this.particles = [];
    this.chestPause = 0;
  }

  start() {
    this.state = STATE.PLAYING;
    this.world.init();
    this.player = new Player(OVERWORLD.startPos.x, OVERWORLD.startPos.y);
    this.rupees = 0;
    this.bombs = 0;
    this.dungeonProgress = createDungeonProgress();
    this.bombFlash = null;
    this.world.onBossDefeated = (id) => {
      this.dungeonProgress[id].bossDead = true;
      this.showMessage('Boss besiegt!');
    };
    this.message = 'Die Krone wurde gestohlen! Drei Krypta-Eingänge — Karte & Kompass finden!';
    this.messageTimer = 210;
    this.lastRoomKey = null;
    this.beams = [];
    this.thrownPots = [];
    this.particles = [];
    this.chestPause = 0;
  }

  damageEnemy(enemy, amount, dir) {
    if (!enemy.alive) return;
    enemy.takeDamage(amount, dir);
    spawnBurst(this.particles, enemy.x + 6, enemy.y + 4, 'rgba(255,220,120,ALPHA)');
    if (!enemy.alive) {
      this.world.notifyEnemyDeath(enemy);
      const drop = spawnDrop(
        enemy.type,
        Math.floor(enemy.x / TILE),
        Math.floor(enemy.y / TILE),
      );
      if (drop) this.world.items.push(drop);
    }
  }

  update() {
    this.frame++;

    if (this.state === STATE.TITLE) {
      if (readActions().confirm) this.start();
      return;
    }
    if (this.state === STATE.GAME_OVER || this.state === STATE.VICTORY) {
      if (readActions().confirm) {
        this.state = STATE.TITLE;
        document.getElementById('game-over')?.classList.add('hidden');
        document.getElementById('victory')?.classList.add('hidden');
        document.getElementById('title-screen')?.classList.remove('hidden');
      }
      return;
    }

    if (this.state !== STATE.PLAYING) return;

    if (this.messageTimer > 0) this.messageTimer--;
    if (this.player.invincible > 0) this.player.invincible--;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life--;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    const prevTransition = this.world.transition;

    if (this.world.transition?.dir === 'fade') {
      this.world.updateStairsTransition(this.player);
      if (prevTransition && !this.world.transition) this.onRoomEnter();
      return;
    }

    if (this.world.transition) {
      this.world.updateTransition(this.player);
      if (prevTransition && !this.world.transition) this.onRoomEnter();
      return;
    }

    const map = this.world.getSavedMap();

    if (this.chestPause > 0) {
      this.chestPause--;
      for (const enemy of this.world.enemies) {
        enemy.update(map, this.player);
      }
      return;
    }

    if (this.bombFlash) {
      this.bombFlash.timer--;
      if (this.bombFlash.timer <= 0) this.bombFlash = null;
    }

    const actions = readActions();
    const move = getMovement();
    let attack = actions.attack;

    if (attack && !this.player.carriedPot && this.player.swordTimer === 0) {
      const pot = this.world.tryLiftPot(this.player);
      if (pot) {
        this.player.carriedPot = pot;
        this.world.removePotTile(pot.x, pot.y);
        attack = false;
      } else {
        this.hitEnemies.clear();
      }
    }

    if (attack && !this.player.carriedPot && this.player.hp >= this.player.maxHp
        && this.player.swordTimer === 0) {
      const cx = this.player.x + this.player.width / 2;
      const cy = this.player.y + this.player.height / 2;
      const spawn = [
        { x: cx - 5, y: cy - 18 },
        { x: cx + 10, y: cy - 5 },
        { x: cx - 5, y: cy + 10 },
        { x: cx - 18, y: cy - 5 },
      ][this.player.dir];
      this.beams.push(new SwordBeam(spawn.x, spawn.y, this.player.dir, this.player.swordPower));
    }

    const useItem = actions.item;

    if (useItem) {
      const doorResult = this.world.tryOpenDoor(this.player, this.dungeonProgress);
      if (doorResult.ok) {
        this.showMessage(doorResult.usedSmallKey ? 'Tür geöffnet!' : 'Kristalltür öffnet sich!');
      } else if (doorResult.need === 'small_key') {
        this.showMessage('Du brauchst einen Kleinen Schlüssel!');
      } else if (doorResult.need === 'big_key') {
        this.showMessage('Du brauchst den Großen Schlüssel!');
      } else {
        const bombSpot = this.world.tryPlaceBomb(this.player, this.bombs);
        if (bombSpot) {
          this.bombs--;
          const killed = this.world.explodeBomb(bombSpot.x, bombSpot.y);
          for (const e of killed) this.world.notifyEnemyDeath(e);
          this.bombFlash = { x: bombSpot.x, y: bombSpot.y, timer: 12 };
          spawnBurst(this.particles, bombSpot.x * TILE + 8, bombSpot.y * TILE + 8, 'rgba(255,160,64,ALPHA)', 10);
        }
      }
    }

    const swordResult = this.player.update({ move, attack, throw: attack }, map);

    if (swordResult?.throwPot && this.player.carriedPot) {
      const pot = this.player.carriedPot;
      const cx = this.player.x + this.player.width / 2;
      const cy = this.player.y + this.player.height / 2;
      this.thrownPots.push(new ThrownPot(cx - 5, cy - 5, swordResult.dir));
      this.player.carriedPot = null;
      spawnBurst(this.particles, cx, cy, 'rgba(200,220,255,ALPHA)', 4);
    }

    if (swordResult && swordResult.w && this.player.swordTimer > 0) {
      const hits = checkSwordHits(swordResult, this.world.enemies, map);
      for (const hit of hits) {
        if (hit.type === 'tile') {
          this.world.destroyTile(hit.x, hit.y);
          spawnBurst(this.particles, hit.x * TILE + 8, hit.y * TILE + 8, 'rgba(160,120,80,ALPHA)');
        } else if (hit.type === 'enemy' && !this.hitEnemies.has(hit.enemy)) {
          this.hitEnemies.add(hit.enemy);
          this.damageEnemy(hit.enemy, this.player.swordPower, swordResult.dir);
        }
      }
    }

    for (let i = this.beams.length - 1; i >= 0; i--) {
      const beam = this.beams[i];
      const hits = beam.update(map, this.world.enemies);
      for (const enemy of hits) {
        this.damageEnemy(enemy, beam.power, beam.dir);
      }
      if (!beam.alive) this.beams.splice(i, 1);
    }

    for (let i = this.thrownPots.length - 1; i >= 0; i--) {
      const pot = this.thrownPots[i];
      let hitEnemy = null;
      for (const enemy of this.world.enemies) {
        if (!enemy.alive) continue;
        if (
          pot.x < enemy.x + enemy.width &&
          pot.x + pot.width > enemy.x &&
          pot.y < enemy.y + enemy.height &&
          pot.y + pot.height > enemy.y
        ) {
          hitEnemy = enemy;
          pot.alive = false;
          break;
        }
      }
      const impact = pot.update(map);
      if (hitEnemy) {
        this.damageEnemy(hitEnemy, 2, pot.dir);
        spawnBurst(this.particles, pot.x + 4, pot.y + 4, 'rgba(56,104,200,ALPHA)', 8);
      } else if (impact?.impact) {
        spawnBurst(this.particles, impact.x * TILE + 8, impact.y * TILE + 8, 'rgba(56,104,200,ALPHA)', 8);
        if (Math.random() < 0.35) {
          this.world.items.push({ type: 'rupee', x: impact.x, y: impact.y, value: 2, collected: false });
        }
      }
      if (!pot.alive) this.thrownPots.splice(i, 1);
    }

    for (const enemy of this.world.enemies) {
      enemy.update(map, this.player);
      enemy.updateProjectiles(this.player, (dmg) => {
        const kbDir = knockbackDir(enemy.x + 6, enemy.y + 6, this.player.cx, this.player.cy);
        this.player.takeDamage(dmg, kbDir);
        if (this.player.hp <= 0) {
          this.state = STATE.GAME_OVER;
          document.getElementById('game-over')?.classList.remove('hidden');
        }
      });
      if (enemy.touchesPlayer(this.player)) {
        const kbDir = knockbackDir(enemy.x + 6, enemy.y + 6, this.player.cx, this.player.cy);
        this.player.takeDamage(enemy.damage, kbDir);
        if (this.player.hp <= 0) {
          this.state = STATE.GAME_OVER;
          document.getElementById('game-over')?.classList.remove('hidden');
        }
      }
    }

    const collected = this.world.collectItems(this.player);
    for (const item of collected) {
      if (item.type === 'heart') {
        this.player.heal(2);
        this.showMessage('Lebensenergie erhalten!');
      } else if (item.type === 'rupee') {
        this.rupees += item.value || 1;
      } else if (item.type === 'small_key') {
        const id = getDungeonId(this.world);
        if (id) {
          this.dungeonProgress[id].smallKeys++;
          this.showMessage('Kleiner Schlüssel erhalten!');
        }
      }
    }

    if (actions.interact) {
      const item = this.world.openChest(this.player, this.dungeonProgress);
      if (item) {
        this.chestPause = CHEST_PAUSE;
        this.applyItem(item);
      } else {
        const npcText = this.world.checkNpc(this.player);
        if (npcText) {
          this.showMessage(npcText);
        } else {
          const sign = this.world.checkSign(this.player);
          if (sign) this.showMessage(sign);
        }
      }
    }

    const stair = this.world.checkStairs(this.player);
    if (stair && actions.stairs) {
      this.world.useStairs(stair);
    }

    const block = this.world.tryTransition(this.player, this.dungeonProgress);
    if (block?.blocked === 'big_key') {
      this.showMessage('Der Große Schlüssel öffnet den Boss-Raum!');
    }
  }

  applyItem(item) {
    const dId = getDungeonId(this.world);
    const prog = dId ? this.dungeonProgress[dId] : null;
    switch (item) {
      case 'heart_container':
        this.player.addHeartContainer();
        this.showMessage('Lebensessenz! Max HP erhöht!');
        break;
      case 'sword_upgrade':
        this.player.swordPower = 2;
        this.showMessage('Aether-Klinge! Dein Schwert leuchtet stärker!');
        break;
      case 'small_key':
        if (prog) { prog.smallKeys++; this.showMessage('Kleiner Schlüssel erhalten!'); }
        break;
      case 'big_key':
        if (prog) { prog.bigKey = true; this.showMessage('Großer Schlüssel erhalten!'); }
        break;
      case 'dungeon_map':
        if (prog) { prog.map = true; this.showMessage('Karte erhalten! Erkundete Räume werden angezeigt.'); }
        break;
      case 'compass':
        if (prog) { prog.compass = true; this.showMessage('Kompass erhalten! Boss und Truhen sichtbar.'); }
        break;
      case 'bombs':
        this.bombs += 5;
        this.showMessage('Bomben erhalten! (+5)');
        break;
      case 'aether_crystal':
        this.state = STATE.VICTORY;
        document.getElementById('victory')?.classList.remove('hidden');
        this.showMessage('Twilight Crown — die Krone der Dämmerung ist zurück!');
        break;
      default:
        this.showMessage(`Item erhalten: ${item}`);
    }
  }

  showMessage(text, duration = 120) {
    this.message = text;
    this.messageTimer = duration;
  }

  onRoomEnter() {
    const room = this.world.getCurrentRoom();
    if (!room?.name) return;

    const key = `${this.world.currentWorld}:${this.world.getRoomKey()}`;
    if (key === this.lastRoomKey) return;
    this.lastRoomKey = key;
    this.beams = [];
    this.thrownPots = [];

    const dId = getDungeonId(this.world);
    if (dId) {
      markRoomExplored(this.dungeonProgress[dId], this.world.roomX, this.world.roomY);
    }

    const hints = {
      'overworld:-1,1': 'Die Hütte birgt Schätze — die Krypta liegt im Osten.',
      'overworld:2,1': 'Treppe ↓ — Schattenkrypta (Haupteingang).',
      'overworld:2,2': 'Treppe ↓ — Nebelkathedrale.',
      'overworld:3,3': 'Treppe ↓ — Eisengrube.',
      'dungeon:schattenkrypta:2,0': 'Kleiner Schlüssel für die Kristalltür!',
      'dungeon:schattenkrypta:2,2': 'Der Schattenwächter hütet den Kristall!',
      'dungeon:nebelkathedrale:2,1': 'Nebelgeist — besiege ihn für die Aether-Klinge!',
      'dungeon:eisengrube:2,1': 'Erzkoloss — hol dir die Lebensessenz!',
    };
    const hintKey = dId ? `dungeon:${dId}:${this.world.getRoomKey()}` : key;
    this.showMessage(hint ? `— ${room.name} — ${hint}` : `— ${room.name} —`, 90);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 256, 224);

    if (this.state === STATE.TITLE) return;

    const map = this.world.getSavedMap();
    const room = this.world.getCurrentRoom();

    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        drawTile(ctx, map[y][x], x, y, this.frame, 'base');
      }
    }

    const drawables = [];

    for (const item of this.world.items) {
      if (!item.collected) {
        drawables.push({
          feetY: item.y * TILE + 14,
          draw: () => drawItem(ctx, item, this.frame),
        });
      }
    }

    for (const enemy of this.world.enemies) {
      if (enemy.alive) {
        drawables.push({
          feetY: enemy.y + enemy.height,
          draw: () => drawEnemy(ctx, enemy, this.frame),
        });
      }
    }

    for (const npc of this.world.npcs) {
      drawables.push({
        feetY: npc.y + npc.height,
        draw: () => drawNpc(ctx, npc),
      });
    }

    for (const pot of this.thrownPots) {
      drawables.push({
        feetY: pot.y + pot.height,
        draw: () => drawThrownPot(ctx, pot),
      });
    }

    if (this.player) {
      drawables.push({
        feetY: this.player.feetY,
        draw: () => {
          drawPlayer(
            ctx, this.player.x, this.player.y, this.player.dir,
            this.frame, this.player.state, this.player.invincible,
          );
          if (this.player.carriedPot) {
            drawCarriedPot(ctx, this.player.x, this.player.y, this.player.dir);
          }
          if (this.player.state === 'attack') {
            drawSword(
              ctx, this.player.x, this.player.y, this.player.dir,
              SWORD_DURATION - this.player.swordTimer, this.player.swordPower,
            );
          }
        },
      });
    }

    drawables.sort((a, b) => a.feetY - b.feetY);
    for (const d of drawables) d.draw();

    for (const beam of this.beams) {
      drawSwordBeam(ctx, beam);
    }

    for (const enemy of this.world.enemies) {
      for (const p of enemy.getActiveProjectiles()) {
        drawBossProjectile(ctx, p);
      }
    }

    if (this.bombFlash) {
      const fx = this.bombFlash.x * TILE;
      const fy = this.bombFlash.y * TILE;
      ctx.fillStyle = `rgba(255,200,80,${this.bombFlash.timer / 12})`;
      ctx.fillRect(fx - 8, fy - 8, 48, 48);
    }

    drawParticles(ctx, this.particles);

    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        if (hasOverhead(map[y][x])) {
          drawTile(ctx, map[y][x], x, y, this.frame, 'overhead');
        }
      }
    }

    if (this.player && room) {
      const dId = getDungeonId(this.world);
      const prog = dId ? this.dungeonProgress[dId] : null;
      drawHUD(ctx, this.player, room.name, this.rupees, {
        smallKeys: prog?.smallKeys ?? 0,
        bombs: this.bombs,
        bigKey: prog?.bigKey ?? false,
      });
      if (dId && prog?.map) {
        drawDungeonMap(ctx, dId, prog, this.world.roomX, this.world.roomY);
      }
    }

    if (this.message && this.messageTimer > 0) {
      drawMessage(ctx, this.message, Math.min(1, this.messageTimer / 20));
    }

    if (this.world.transition) {
      drawTransition(ctx, this.world.getTransitionProgress(), this.world.transition.dir);
    }
  }

  tick() {
    this.update();
    this.render();
    clearPressed();
  }
}
