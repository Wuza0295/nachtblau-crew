import { TILE, SWORD_DURATION, CHEST_PAUSE, DIR, TILES } from './constants.js';
import { OVERWORLD, hasOverhead } from './maps.js';
import { Player, checkSwordHits, spawnDrop, SwordBeam, ThrownPot } from './entities.js';
import { World } from './world.js';
import {
  drawTile, drawPlayer, drawSword, drawEnemy, drawNpc,
  drawItem, drawHUD, drawMessage, drawTransition,
  drawCarriedPot, drawThrownPot, drawSwordBeam, drawParticles,
  drawBossProjectile, drawDungeonMap, drawHeldItem, drawDialogBox,
  drawAmbientWash,
} from './sprites.js';
import { getMovement, clearPressed, rumble, isGamepadConnected, getMenuNav } from './input.js';
import { createDungeonProgress, markRoomExplored, getDungeonId, readActions } from './dungeon-state.js';
import {
  createDialogState, openDialog, advanceDialog, currentDialogLines,
} from './interact.js';
import {
  createMenuState, moveMenu, currentOption,
  drawStartMenu, drawPauseMenu, refreshMenuLabels, getStartOptions, getPauseOptions,
} from './menus.js';
import { toggleFullscreen } from './display.js';

export const STATE = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
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
    this.heldItem = null;
    this.shake = 0;
    this.stairsTimer = 0;
    this.dialog = createDialogState();
    this.startMenu = createMenuState(getStartOptions());
    this.pauseMenu = createMenuState(getPauseOptions());
  }

  start() {
    this.state = STATE.PLAYING;
    this.world.init();
    this.player = new Player(OVERWORLD.startPos.x, OVERWORLD.startPos.y);
    this.rupees = 0;
    this.bombs = 3;
    this.dungeonProgress = createDungeonProgress();
    this.bombFlash = null;
    this.world.onBossDefeated = (id) => {
      this.dungeonProgress[id].bossDead = true;
      this.showMessage('Schatten gebrochen!');
      this.shake = 18;
      rumble(160, 0.5, 0.9);
    };
    this.message = null;
    this.messageTimer = 0;
    this.dialog = createDialogState();
    this.pauseMenu = createMenuState(getPauseOptions());
    openDialog(
      this.dialog,
      isGamepadConnected()
        ? 'Die Dämmerung ruft… A = Schwert & Reden. Stelle dich vor die Leute und drücke A. Start = Pause.'
        : 'Die Dämmerung ruft… Leertaste = Schwert & Reden. Esc = Pause. Stelle dich vor NPCs und sprich.',
    );
    this.lastRoomKey = null;
    this.beams = [];
    this.thrownPots = [];
    this.particles = [];
    this.chestPause = 0;
    this.heldItem = null;
    this.shake = 0;
    this.stairsTimer = 0;
    document.getElementById('title-screen')?.classList.add('hidden');
  }

  returnToTitle() {
    this.state = STATE.TITLE;
    this.startMenu = createMenuState(getStartOptions());
    this.pauseMenu = createMenuState(getPauseOptions());
    this.dialog = createDialogState();
    this.message = null;
    this.messageTimer = 0;
    document.getElementById('game-over')?.classList.add('hidden');
    document.getElementById('victory')?.classList.add('hidden');
    document.getElementById('title-screen')?.classList.add('hidden');
  }

  handleStartMenuSelect() {
    const menu = this.startMenu;
    if (menu.panel) {
      menu.panel = null;
      return;
    }
    const opt = currentOption(menu);
    if (!opt) return;
    if (opt.id === 'new') this.start();
    else if (opt.id === 'controls' || opt.id === 'lore') menu.panel = opt.id;
    else if (opt.id === 'fullscreen') {
      toggleFullscreen().then(() => refreshMenuLabels(this.startMenu, 'start'));
    }
  }

  handlePauseMenuSelect() {
    const menu = this.pauseMenu;
    if (menu.panel) {
      menu.panel = null;
      return;
    }
    const opt = currentOption(menu);
    if (!opt) return;
    if (opt.id === 'resume') this.state = STATE.PLAYING;
    else if (opt.id === 'controls') menu.panel = 'controls';
    else if (opt.id === 'fullscreen') {
      toggleFullscreen().then(() => refreshMenuLabels(this.pauseMenu, 'pause'));
    }
    else if (opt.id === 'title') this.returnToTitle();
  }

  damageEnemy(enemy, amount, dir) {
    if (!enemy.alive) return;
    enemy.takeDamage(amount, dir);
    spawnBurst(this.particles, enemy.x + 6, enemy.y + 4, 'rgba(255,220,120,ALPHA)');
    this.shake = Math.max(this.shake, 4);
    rumble(40, 0.2, 0.35);
    if (!enemy.alive) {
      this.world.notifyEnemyDeath(enemy);
      const drop = spawnDrop(
        enemy.type,
        Math.floor(enemy.x / TILE),
        Math.floor(enemy.y / TILE),
      );
      if (drop) this.world.items.push(drop);
      this.shake = Math.max(this.shake, 8);
      spawnBurst(this.particles, enemy.x + 6, enemy.y + 4, 'rgba(255,255,255,ALPHA)', 8);
    }
  }

  update() {
    this.frame++;
    const actions = readActions();
    const nav = getMenuNav();

    if (this.state === STATE.TITLE) {
      refreshMenuLabels(this.startMenu, 'start');
      if (nav) moveMenu(this.startMenu, nav);
      if (actions.confirm || actions.pause || actions.attack) this.handleStartMenuSelect();
      return;
    }
    if (this.state === STATE.GAME_OVER || this.state === STATE.VICTORY) {
      if (actions.confirm || actions.pause) this.returnToTitle();
      return;
    }

    if (this.state === STATE.PAUSED) {
      refreshMenuLabels(this.pauseMenu, 'pause');
      if (nav) moveMenu(this.pauseMenu, nav);
      if (this.pauseMenu.panel) {
        if (actions.confirm || actions.attack || actions.pause) this.pauseMenu.panel = null;
        return;
      }
      if (actions.pause) {
        this.state = STATE.PLAYING;
        return;
      }
      if (actions.confirm || actions.attack) this.handlePauseMenuSelect();
      return;
    }

    if (this.state !== STATE.PLAYING) return;

    if (actions.pause) {
      this.pauseMenu = createMenuState(getPauseOptions());
      this.state = STATE.PAUSED;
      return;
    }

    // Dialog open: freeze world, A/E advances or closes (ALttP text box)
    if (this.dialog?.open) {
      if (actions.attack || actions.interact || actions.confirm) {
        advanceDialog(this.dialog);
      }
      return;
    }

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
      if (this.chestPause <= 0) this.heldItem = null;
      for (const enemy of this.world.enemies) {
        enemy.update(map, this.player);
      }
      return;
    }

    if (this.shake > 0) this.shake--;

    if (this.bombFlash) {
      this.bombFlash.timer--;
      if (this.bombFlash.timer <= 0) this.bombFlash = null;
    }

    const move = getMovement();
    let attack = actions.attack;
    let didInteract = false;

    // ALttP: A / interact first talks, reads signs, opens chests — then sword
    if ((attack || actions.interact) && !this.player.carriedPot && this.player.swordTimer === 0) {
      const result = this.world.tryInteract(this.player, this.dungeonProgress);
      if (result) {
        didInteract = true;
        attack = false;
        if (result.type === 'chest') {
          this.chestPause = CHEST_PAUSE;
          this.heldItem = result.item;
          this.player.dir = DIR.DOWN;
          this.shake = 6;
          rumble(60, 0.3, 0.5);
          this.applyItem(result.item);
        } else if (result.type === 'npc') {
          openDialog(this.dialog, result.text, result.npc.type);
          rumble(30, 0.15, 0.2);
          return;
        } else if (result.type === 'sign') {
          openDialog(this.dialog, result.text, 'Schild');
          return;
        }
      }
    }

    if (attack && !this.player.carriedPot && this.player.swordTimer === 0 && !didInteract) {
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
        && this.player.swordTimer === 0 && !didInteract) {
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
          this.shake = 14;
          rumble(100, 0.5, 0.8);
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
          const map = this.world.getSavedMap();
          const wasBush = map[hit.y]?.[hit.x] === 3; // TILES.BUSH
          this.world.destroyTile(hit.x, hit.y);
          if (wasBush) {
            spawnBurst(this.particles, hit.x * TILE + 8, hit.y * TILE + 8, 'rgba(72,176,40,ALPHA)', 10);
            spawnBurst(this.particles, hit.x * TILE + 8, hit.y * TILE + 6, 'rgba(160,232,80,ALPHA)', 6);
          } else {
            spawnBurst(this.particles, hit.x * TILE + 8, hit.y * TILE + 8, 'rgba(160,120,80,ALPHA)');
          }
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
        const prevHp = this.player.hp;
        this.player.takeDamage(enemy.damage, kbDir);
        if (this.player.hp < prevHp) {
          this.shake = Math.max(this.shake, 10);
          rumble(90, 0.45, 0.75);
        }
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

    // Interact also via dedicated button if A didn't already handle it
    if (actions.interact && !didInteract) {
      const result = this.world.tryInteract(this.player, this.dungeonProgress);
      if (result?.type === 'chest') {
        this.chestPause = CHEST_PAUSE;
        this.heldItem = result.item;
        this.player.dir = DIR.DOWN;
        this.applyItem(result.item);
      } else if (result?.type === 'npc') {
        openDialog(this.dialog, result.text, result.npc.type);
        return;
      } else if (result?.type === 'sign') {
        openDialog(this.dialog, result.text, 'Schild');
        return;
      }
    }

    const stair = this.world.checkStairs(this.player);
    if (stair) {
      this.stairsTimer = (this.stairsTimer || 0) + 1;
      // Leaving an indoor room: walk onto exit stairs / press down
      const leaveIndoor = this.world.getCurrentRoom()?.indoor && (
        this.player.dir === DIR.DOWN
        || actions.stairs
        || actions.interact
        || this.stairsTimer > 8
      );
      // Enter house from the path south of the door (face up or wait briefly)
      const doorEnter = stair.kind === 'door' && !this.world.getCurrentRoom()?.indoor && (
        this.player.dir === DIR.UP
        || actions.interact
        || actions.confirm
        || this.stairsTimer > 6
      );
      const stairEnter = stair.kind !== 'door' && (
        actions.stairs || actions.interact || this.stairsTimer > 18
      );
      if (doorEnter || stairEnter || leaveIndoor) {
        this.stairsTimer = 0;
        const goingIn = stair.kind === 'door' && ['90', '100', '110', '120'].some((p) => String(stair.room).startsWith(`${p},`));
        this.world.useStairs(stair);
        if (stair.kind === 'door') {
          this.showMessage(goingIn ? 'Haus betreten…' : 'Hinaus…', 45);
        }
      }
    } else {
      this.stairsTimer = 0;
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
      case 'heart':
        this.player.heal(2);
        this.showMessage('Herz!');
        break;
      case 'rupee_blue':
        this.rupees += 5;
        this.showMessage('5 Rubine!');
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
      'overworld:-1,1': 'Die Hütte birgt Rüstzeug — die Schattenkrypta liegt im Osten.',
      'overworld:2,1': 'Treppe ↓ — Schattenkrypta (Haupteingang).',
      'overworld:2,2': 'Treppe ↓ — Nebelkathedrale der Dämmerung.',
      'overworld:3,3': 'Treppe ↓ — Eisengrube.',
      'overworld:-2,1': 'Apfelgarten im Zwielicht — Westen der Karte.',
      'overworld:4,1': 'Östliche Steppe — zum Adlerhorst.',
      'overworld:1,-1': 'Hochwiese — weit im Norden der Dämmerwelt.',
      'overworld:1,4': 'Muschelstrand — Südrand der Welt.',
      'dungeon:schattenkrypta:2,0': 'Kleiner Schlüssel für die Kristalltür!',
      'dungeon:schattenkrypta:2,2': 'Der Schattenwächter hütet den Kronenkristall!',
      'dungeon:nebelkathedrale:2,1': 'Nebelgeist — besiege ihn für die Aether-Klinge!',
      'dungeon:eisengrube:2,1': 'Erzkoloss — hol dir die Lebensessenz!',
    };
    const hintKey = dId ? `dungeon:${dId}:${this.world.getRoomKey()}` : key;
    const hint = hints[hintKey];
    this.showMessage(hint ? `— ${room.name} — ${hint}` : `— ${room.name} —`, 90);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 256, 224);

    if (this.state === STATE.TITLE) {
      drawStartMenu(ctx, this.startMenu, this.frame);
      return;
    }

    if (this.state === STATE.GAME_OVER || this.state === STATE.VICTORY) {
      // brief canvas backdrop under HTML overlay
      ctx.fillStyle = '#080818';
      ctx.fillRect(0, 0, 256, 224);
      return;
    }

    const map = this.world.getSavedMap();
    const room = this.world.getCurrentRoom();
    const tr = this.world.transition;

    ctx.save();
    if (this.shake > 0 && !(tr && tr.fromMap)) {
      const mag = Math.ceil(this.shake / 4);
      ctx.translate((Math.random() * 2 - 1) * mag, (Math.random() * 2 - 1) * mag);
    }

    // ALttP dual-screen scroll when changing rooms
    if (tr && tr.fromMap && tr.toMap && tr.dir !== 'fade') {
      const t = this.world.getTransitionProgress();
      let fox = 0;
      let foy = 0;
      let tox = 0;
      let toy = 0;
      if (tr.dir === 'right') { fox = -t * 256; tox = 256 + fox; }
      else if (tr.dir === 'left') { fox = t * 256; tox = fox - 256; }
      else if (tr.dir === 'down') { foy = -t * 224; toy = 224 + foy; }
      else if (tr.dir === 'up') { foy = t * 224; toy = foy - 224; }

      const paint = (tiles, ox, oy) => {
        ctx.save();
        ctx.translate(ox, oy);
        for (let y = 0; y < tiles.length; y++) {
          for (let x = 0; x < tiles[y].length; x++) {
            drawTile(ctx, tiles[y][x], x, y, this.frame, 'base', tiles);
          }
        }
        for (let y = 0; y < tiles.length; y++) {
          for (let x = 0; x < tiles[y].length; x++) {
            if (hasOverhead(tiles[y][x])) {
              drawTile(ctx, tiles[y][x], x, y, this.frame, 'overhead', tiles);
            }
          }
        }
        ctx.restore();
      };
      paint(tr.fromMap, fox, foy);
      paint(tr.toMap, tox, toy);

      if (this.player && tr.fromPlayer) {
        const entry = tr.entryPos;
        let px = tr.fromPlayer.x + fox;
        let py = tr.fromPlayer.y + foy;
        if (tr.dir === 'right') {
          px = (1 - t) * (tr.fromPlayer.x + fox) + t * (entry.x * TILE + 4 + tox);
          py = (1 - t) * (tr.fromPlayer.y + foy) + t * (entry.y * TILE + 2 + toy);
        } else if (tr.dir === 'left') {
          px = (1 - t) * (tr.fromPlayer.x + fox) + t * (entry.x * TILE + 4 + tox);
          py = (1 - t) * (tr.fromPlayer.y + foy) + t * (entry.y * TILE + 2 + toy);
        } else if (tr.dir === 'down' || tr.dir === 'up') {
          px = (1 - t) * (tr.fromPlayer.x + fox) + t * (entry.x * TILE + 4 + tox);
          py = (1 - t) * (tr.fromPlayer.y + foy) + t * (entry.y * TILE + 2 + toy);
        }
        drawPlayer(ctx, px, py, this.player.dir, this.frame, 'walk', 0);
      }
      ctx.restore();

      if (this.player && room) {
        drawHUD(ctx, this.player, room.name, this.rupees, {
          smallKeys: 0, bombs: this.bombs, bigKey: false,
          lowHp: this.player.hp <= 2, frame: this.frame,
        });
      }
      return;
    }

    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        drawTile(ctx, map[y][x], x, y, this.frame, 'base', map);
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
      const dist = this.player
        ? Math.hypot(this.player.cx - (npc.x + 6), this.player.cy - (npc.y + 7))
        : 99;
      drawables.push({
        feetY: npc.y + npc.height,
        draw: () => drawNpc(ctx, npc, this.frame, dist < 40 && !this.dialog?.open),
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
          const pose = this.heldItem ? 'itemget' : this.player.state;
          drawPlayer(
            ctx, this.player.x, this.player.y, this.player.dir,
            this.frame, pose, this.player.invincible,
          );
          if (this.heldItem) {
            drawHeldItem(ctx, this.player.x, this.player.y, this.heldItem, this.frame);
          } else if (this.player.carriedPot) {
            drawCarriedPot(ctx, this.player.x, this.player.y, this.player.dir);
          }
          if (this.player.state === 'attack' && !this.heldItem) {
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
          drawTile(ctx, map[y][x], x, y, this.frame, 'overhead', map);
        }
      }
    }

    ctx.restore();

    // Twilight atmosphere wash (after world, before HUD)
    if (!tr || tr.dir === 'fade') {
      drawAmbientWash(ctx, !!this.world.getCurrentRoom()?.indoor);
    }

    if (this.player && room) {
      const dId = getDungeonId(this.world);
      const prog = dId ? this.dungeonProgress[dId] : null;
      drawHUD(ctx, this.player, room.name, this.rupees, {
        smallKeys: prog?.smallKeys ?? 0,
        bombs: this.bombs,
        bigKey: prog?.bigKey ?? false,
        lowHp: this.player.hp <= 2,
        frame: this.frame,
      });
      if (dId && prog?.map) {
        drawDungeonMap(ctx, dId, prog, this.world.roomX, this.world.roomY);
      }
    }

    if (this.dialog?.open) {
      drawDialogBox(ctx, currentDialogLines(this.dialog), 1, true);
    } else if (this.message && this.messageTimer > 0) {
      drawMessage(ctx, this.message, Math.min(1, this.messageTimer / 20));
    }

    if (this.world.transition?.dir === 'fade') {
      drawTransition(ctx, this.world.getTransitionProgress(), this.world.transition.dir);
    }

    if (this.state === STATE.PAUSED) {
      drawPauseMenu(ctx, this.pauseMenu, this.frame, {
        rupees: this.rupees,
        bombs: this.bombs,
        hp: this.player?.hp ?? 0,
        maxHp: this.player?.maxHp ?? 0,
      });
    }
  }

  tick() {
    this.update();
    this.render();
    clearPressed();
  }
}
