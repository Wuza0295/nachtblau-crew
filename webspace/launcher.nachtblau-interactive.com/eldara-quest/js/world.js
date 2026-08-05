import { TILE, TRANSITION_DURATION, TILES, DIR } from './constants.js';
import { OVERWORLD, DUNGEONS, getDungeonMeta, isBombable } from './maps.js';
import { Enemy, Npc } from './entities.js';

export class World {
  constructor() {
    this.currentWorld = 'overworld';
    this.currentDungeonId = 'schattenkrypta';
    this.roomX = 1;
    this.roomY = 1;
    this.rooms = {};
    this.enemies = [];
    this.npcs = [];
    this.items = [];
    this.chests = {};
    this.doors = {};
    this.signs = {};
    this.stairs = {};
    this.bossRooms = {};
    this.transition = null;
    this.frame = 0;
    this.onBossDefeated = null;
  }

  init() {
    this.loadWorld('overworld', OVERWORLD.startRoom, OVERWORLD.startPos);
  }

  getWorldData() {
    if (this.currentWorld === 'overworld') return OVERWORLD;
    return getDungeonMeta(this.currentDungeonId);
  }

  getRoomKey() {
    return `${this.roomX},${this.roomY}`;
  }

  getCurrentRoom() {
    const data = this.getWorldData();
    return data.rooms[this.getRoomKey()];
  }

  getMap() {
    const room = this.getCurrentRoom();
    return room ? room.map : [];
  }

  loadWorld(worldName, roomKey, startPos, dungeonId = 'schattenkrypta') {
    this.currentWorld = worldName;
    if (worldName === 'dungeon') this.currentDungeonId = dungeonId;
    const [rx, ry] = roomKey.split(',').map(Number);
    this.roomX = rx;
    this.roomY = ry;
    this.loadRoom(startPos);
  }

  loadRoom(entryPos) {
    const room = this.getCurrentRoom();
    if (!room) return null;

    const key = this.getRoomKey();
    const fullKey = `${this.currentWorld}:${this.currentDungeonId}:${key}`;

    if (!this.rooms[fullKey]) {
      this.rooms[fullKey] = {
        map: room.map.map((row) => [...row]),
        enemies: (room.enemies || []).map((e) => new Enemy(e.type, e.x, e.y)),
        npcs: (room.npcs || []).map((n) => new Npc(n)),
        items: (room.items || []).map((i) => ({ ...i, collected: false })),
      };

      if (room.chest) {
        this.chests[fullKey] = { ...room.chest };
      }
      if (room.door) {
        this.doors[fullKey] = { ...room.door, open: false };
      }
      if (room.sign) {
        this.signs[fullKey] = room.sign;
      }
      if (room.stairs) {
        this.stairs[fullKey] = room.stairs;
      }
      if (room.bossRoom) {
        this.bossRooms[fullKey] = true;
      }
    }

    const saved = this.rooms[fullKey];
    this.enemies = saved.enemies;
    this.npcs = saved.npcs || [];
    this.items = saved.items;

    return entryPos || { x: 8, y: 7 };
  }

  getSavedMap() {
    const fullKey = `${this.currentWorld}:${this.currentDungeonId}:${this.getRoomKey()}`;
    return this.rooms[fullKey]?.map || this.getMap();
  }

  getFullRoomKey() {
    return `${this.currentWorld}:${this.currentDungeonId}:${this.getRoomKey()}`;
  }

  tryTransition(player, dungeonProgress) {
    if (this.transition) return;

    const { x, y, width, height } = player;
    let dir = null;
    let nrx = this.roomX;
    let nry = this.roomY;

    if (y <= 20) { dir = 'up'; nry--; }
    else if (y + height >= 14 * TILE - 2) { dir = 'down'; nry++; }
    else if (x <= 4) { dir = 'left'; nrx--; }
    else if (x + width >= 16 * TILE - 4) { dir = 'right'; nrx++; }
    else return;

    const data = this.getWorldData();
    const nextKey = `${nrx},${nry}`;
    const nextRoom = data.rooms[nextKey];
    if (!nextRoom) return;

    if (this.currentWorld === 'dungeon' && nextRoom.requiresBigKey) {
      const prog = dungeonProgress?.[this.currentDungeonId];
      if (!prog?.bigKey) {
        return { blocked: 'big_key' };
      }
    }

    this.transition = {
      dir,
      timer: TRANSITION_DURATION,
      nextRoom: { x: nrx, y: nry },
      entryPos: this.getEntryPos(dir),
    };
    return null;
  }

  getEntryPos(fromDir) {
    switch (fromDir) {
      case 'up': return { x: 8, y: 12 };
      case 'down': return { x: 8, y: 2 };
      case 'left': return { x: 13, y: 7 };
      case 'right': return { x: 2, y: 7 };
      default: return { x: 8, y: 7 };
    }
  }

  updateTransition(player) {
    if (!this.transition) return false;

    this.transition.timer--;
    if (this.transition.timer <= 0) {
      this.roomX = this.transition.nextRoom.x;
      this.roomY = this.transition.nextRoom.y;
      const pos = this.loadRoom(this.transition.entryPos);
      player.x = pos.x * TILE + 4;
      player.y = pos.y * TILE + 2;
      this.transition = null;
      return true;
    }
    return false;
  }

  getTransitionProgress() {
    if (!this.transition) return 0;
    return 1 - this.transition.timer / TRANSITION_DURATION;
  }

  checkStairs(player) {
    const fullKey = this.getFullRoomKey();
    const stair = this.stairs[fullKey];
    if (!stair) return null;

    const tx = Math.floor(player.cx / TILE);
    const ty = Math.floor(player.cy / TILE);
    if (tx >= stair.x && tx <= stair.x + 1 && ty >= stair.y && ty <= stair.y + 1) {
      return stair;
    }
    return null;
  }

  useStairs(stair) {
    const dungeonId = stair.dungeonId || 'schattenkrypta';
    const data = stair.target === 'overworld' ? OVERWORLD : getDungeonMeta(dungeonId);
    this.transition = {
      dir: 'fade',
      timer: TRANSITION_DURATION * 1.5,
      nextWorld: stair.target,
      nextDungeonId: dungeonId,
      nextRoom: stair.room,
      entryPos: stair.entry || data.startPos,
    };
  }

  updateStairsTransition(player) {
    if (!this.transition || this.transition.dir !== 'fade') return false;

    this.transition.timer--;
    if (this.transition.timer <= 0) {
      if (this.transition.nextWorld) {
        this.loadWorld(
          this.transition.nextWorld,
          this.transition.nextRoom,
          this.transition.entryPos,
          this.transition.nextDungeonId || 'schattenkrypta',
        );
      }
      player.x = this.transition.entryPos.x * TILE + 4;
      player.y = this.transition.entryPos.y * TILE + 2;
      this.transition = null;
      return true;
    }
    return false;
  }

  openChest(player, dungeonProgress) {
    const fullKey = this.getFullRoomKey();
    const chest = this.chests[fullKey];
    if (!chest || chest.opened) return null;

    const tx = Math.floor(player.cx / TILE);
    const ty = Math.floor(player.cy / TILE);
    if (Math.abs(tx - chest.x) > 1 || Math.abs(ty - chest.y) > 1) return null;

    if (chest.requiresBoss) {
      const prog = dungeonProgress?.[this.currentDungeonId];
      const bossAlive = this.enemies.some((e) => e.alive && e.type.includes('boss'));
      if (bossAlive || !prog?.bossDead) return null;
    }

    chest.opened = true;
    const map = this.getSavedMap();
    map[chest.y][chest.x] = TILES.FLOOR;
    return chest.item;
  }

  tryOpenDoor(player, dungeonProgress) {
    const fullKey = this.getFullRoomKey();
    const door = this.doors[fullKey];
    if (!door || door.open) return { ok: false };

    const tx = Math.floor(player.cx / TILE);
    const ty = Math.floor(player.cy / TILE);
    if (Math.abs(tx - door.x) > 1 || Math.abs(ty - door.y) > 1) return { ok: false };

    const prog = dungeonProgress?.[this.currentDungeonId];
    if (door.keyRequired) {
      if (!prog || prog.smallKeys <= 0) return { ok: false, need: 'small_key' };
      prog.smallKeys--;
    }
    if (door.bigKey) {
      if (!prog?.bigKey) return { ok: false, need: 'big_key' };
    }

    door.open = true;
    const map = this.getSavedMap();
    map[door.y][door.x] = TILES.DOOR_OPEN;
    if (map[door.y + 1]?.[door.x] !== undefined) map[door.y + 1][door.x] = TILES.DOOR_OPEN;
    return { ok: true, usedSmallKey: door.keyRequired };
  }

  tryPlaceBomb(player, bombs) {
    if (bombs <= 0) return null;
    const { tx, ty } = this.getTileInFront(player);
    const map = this.getSavedMap();
    if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) return null;
    if (!isBombable(map[ty][tx])) return null;
    return { x: tx, y: ty };
  }

  explodeBomb(x, y) {
    const map = this.getSavedMap();
    if (!isBombable(map[y]?.[x])) return [];
    map[y][x] = TILES.FLOOR;
    const killed = [];
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const etx = Math.floor((enemy.x + 6) / TILE);
      const ety = Math.floor((enemy.y + 6) / TILE);
      if (Math.abs(etx - x) <= 1 && Math.abs(ety - y) <= 1) {
        enemy.takeDamage(4, DIR.DOWN);
        if (!enemy.alive) killed.push(enemy);
      }
    }
    return killed;
  }

  checkSign(player) {
    const fullKey = this.getFullRoomKey();
    const text = this.signs[fullKey];
    if (!text) return null;

    const tx = Math.floor(player.cx / TILE);
    const ty = Math.floor(player.cy / TILE);
    const map = this.getSavedMap();
    if (map[ty]?.[tx] === TILES.SIGN) return text;
    return null;
  }

  checkNpc(player) {
    for (const npc of this.npcs) {
      const dist = Math.hypot(
        player.cx - (npc.x + npc.width / 2),
        player.cy - (npc.y + npc.height / 2),
      );
      if (dist < 22) return npc.dialog;
    }
    return null;
  }

  collectItems(player) {
    const collected = [];
    for (const item of this.items) {
      if (item.collected) continue;
      const ix = item.x * TILE + 8;
      const iy = item.y * TILE + 8;
      const dist = Math.hypot(player.cx - ix, player.cy - iy);
      if (dist < 12) {
        item.collected = true;
        collected.push(item);
      }
    }
    return collected;
  }

  getTileInFront(player) {
    const cx = Math.floor(player.cx / TILE);
    const cy = Math.floor(player.cy / TILE);
    const offsets = [
      { x: 0, y: -1 }, { x: 1, y: 0 },
      { x: 0, y: 1 }, { x: -1, y: 0 },
    ];
    const o = offsets[player.dir];
    return { tx: cx + o.x, ty: cy + o.y };
  }

  tryLiftPot(player) {
    if (player.swordTimer > 0 || player.carriedPot) return null;
    const { tx, ty } = this.getTileInFront(player);
    const map = this.getSavedMap();
    if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) return null;
    if (map[ty][tx] !== TILES.POT) return null;
    const dist = Math.hypot(
      player.cx - (tx * TILE + 8),
      player.cy - (ty * TILE + 8),
    );
    if (dist > 28) return null;
    return { x: tx, y: ty };
  }

  removePotTile(x, y) {
    const map = this.getSavedMap();
    map[y][x] = this.currentWorld === 'dungeon' ? TILES.FLOOR : TILES.GRASS;
  }

  destroyTile(x, y) {
    const map = this.getSavedMap();
    const tile = map[y]?.[x];
    if (tile === TILES.BUSH) {
      map[y][x] = TILES.GRASS;
      if (Math.random() < 0.15) {
        this.items.push({ type: 'rupee', x, y, value: 1, collected: false });
      }
      if (Math.random() < 0.05) {
        this.items.push({ type: 'heart', x, y, collected: false });
      }
    } else if (tile === TILES.POT) {
      map[y][x] = this.currentWorld === 'dungeon' ? TILES.FLOOR : TILES.GRASS;
      if (Math.random() < 0.3) {
        this.items.push({ type: 'rupee', x, y, value: 2, collected: false });
      }
      if (Math.random() < 0.1) {
        this.items.push({ type: 'heart', x, y, collected: false });
      }
    } else if (tile === TILES.CRACKED) {
      map[y][x] = TILES.FLOOR;
    }
  }

  notifyEnemyDeath(enemy) {
    if (!enemy.type.includes('boss')) return;
    if (this.onBossDefeated) this.onBossDefeated(this.currentDungeonId);
  }
}
