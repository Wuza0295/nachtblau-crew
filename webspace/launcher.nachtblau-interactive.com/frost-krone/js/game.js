import { SWORD_DURATION, TILE } from './constants.js';
import { OVERWORLD } from './maps.js';
import { Player, checkSwordHits, spawnDrop } from './entities.js';
import { World } from './world.js';
import {
  drawTile, drawPlayer, drawSword, drawEnemy,
  drawItem, drawHUD, drawMessage, drawTransition,
} from './sprites.js';
import { getMovement, wasPressed, clearPressed } from './input.js';

export const STATE = {
  TITLE: 'title',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
  PAUSED: 'paused',
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.state = STATE.TITLE;
    this.frame = 0;
    this.world = new World();
    this.player = null;
    this.shards = 0;
    this.keys = 0;
    this.message = null;
    this.messageTimer = 0;
    this.hasCrown = false;
    this.hitEnemies = new Set();
  }

  start() {
    this.state = STATE.PLAYING;
    this.world.init();
    this.player = new Player(OVERWORLD.startPos.x, OVERWORLD.startPos.y);
    this.shards = 0;
    this.keys = 0;
    this.hasCrown = false;
    this.message = 'Erkunde Frostheim! Finde den Eisschlüssel im Gletscher.';
    this.messageTimer = 200;
  }

  update() {
    this.frame++;

    if (this.state === STATE.TITLE) {
      if (wasPressed('Enter')) this.start();
      return;
    }
    if (this.state === STATE.GAME_OVER || this.state === STATE.VICTORY) {
      if (wasPressed('Enter')) {
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

    if (this.world.transition?.dir === 'fade') {
      this.world.updateStairsTransition(this.player);
      return;
    }

    if (this.world.transition) {
      this.world.updateTransition(this.player);
      return;
    }

    const move = getMovement();
    const attack = wasPressed('Space');
    const useItem = wasPressed('KeyZ');

    if (useItem) {
      const usedKey = this.world.tryOpenDoor(this.player, this.keys);
      if (usedKey) {
        this.keys--;
        this.showMessage('Eistür geöffnet!');
      } else if (this.world.doors[`${this.world.currentWorld}:${this.world.getRoomKey()}`]) {
        this.showMessage('Du brauchst einen Eisschlüssel!');
      }
    }

    const swordBox = this.player.update({ move, attack }, this.world.getSavedMap(), this.world.enemies);

    if (swordBox && this.player.swordTimer === 12) {
      this.hitEnemies.clear();
    }

    if (swordBox && this.player.swordTimer > 0) {
      const hits = checkSwordHits(swordBox, this.world.enemies, this.world.getSavedMap());
      for (const hit of hits) {
        if (hit.type === 'tile') {
          this.world.destroyTile(hit.x, hit.y);
        } else if (hit.type === 'enemy' && !this.hitEnemies.has(hit.enemy)) {
          this.hitEnemies.add(hit.enemy);
          hit.enemy.takeDamage(this.player.swordPower, swordBox.dir);
          if (!hit.enemy.alive) {
            const drop = spawnDrop(hit.enemy.type, Math.floor(hit.enemy.x / TILE), Math.floor(hit.enemy.y / TILE));
            if (drop) this.world.items.push(drop);
          }
        }
      }
    }

    for (const enemy of this.world.enemies) {
      enemy.update(this.world.getSavedMap(), this.player);
      if (enemy.touchesPlayer(this.player)) {
        this.player.takeDamage(enemy.damage);
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
        this.showMessage('Herz erhalten!');
      } else if (item.type === 'crystal_shard') {
        this.shards += item.value || 1;
      } else if (item.type === 'key') {
        this.keys++;
        this.showMessage('Eisschlüssel erhalten!');
      }
    }

    if (wasPressed('KeyE') || wasPressed('Enter')) {
      const item = this.world.openChest(this.player);
      if (item) this.applyItem(item);
    }

    const stair = this.world.checkStairs(this.player);
    if (stair && wasPressed('ArrowDown')) {
      this.world.useStairs(stair);
    }

    const sign = this.world.checkSign(this.player);
    if (sign && wasPressed('KeyE')) {
      this.showMessage(sign);
    }

    this.world.tryTransition(this.player);
  }

  applyItem(item) {
    switch (item) {
      case 'heart_container':
        this.player.addHeartContainer();
        this.showMessage('Frostherz! Max HP erhöht!');
        break;
      case 'sword_upgrade':
        this.player.swordPower = 2;
        this.showMessage('Eisklinge! Mehr Schaden!');
        break;
      case 'key':
        this.keys++;
        this.showMessage('Eisschlüssel erhalten!');
        break;
      case 'frost_crown':
        this.hasCrown = true;
        this.state = STATE.VICTORY;
        document.getElementById('victory')?.classList.remove('hidden');
        break;
      default:
        this.showMessage(`Item erhalten: ${item}`);
    }
  }

  showMessage(text) {
    this.message = text;
    this.messageTimer = 120;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 256, 224);

    if (this.state === STATE.TITLE) return;

    const map = this.world.getSavedMap();
    const room = this.world.getCurrentRoom();

    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        drawTile(ctx, map[y][x], x, y, this.frame);
      }
    }

    for (const item of this.world.items) {
      if (!item.collected) drawItem(ctx, item, this.frame);
    }

    for (const enemy of this.world.enemies) {
      if (enemy.alive) drawEnemy(ctx, enemy, this.frame);
    }

    if (this.player) {
      drawPlayer(ctx, this.player.x, this.player.y, this.player.dir, this.frame, this.player.state);
      if (this.player.state === 'attack') {
        drawSword(ctx, this.player.x, this.player.y, this.player.dir,
          SWORD_DURATION - this.player.swordTimer, this.player.swordPower);
      }
    }

    if (this.player && room) {
      drawHUD(ctx, this.player, room.name, this.shards, this.keys);
    }

    if (this.message && this.messageTimer > 0) {
      drawMessage(ctx, this.message, Math.min(1, this.messageTimer / 20));
    }

    if (this.world.transition) {
      const progress = this.world.getTransitionProgress();
      drawTransition(ctx, progress, this.world.transition.dir);
    }
  }

  tick() {
    this.update();
    this.render();
    clearPressed();
  }
}
