import { TILE, TRANSITION_DURATION } from './constants.js';
import { OVERWORLD, DUNGEON, isSolid } from './maps.js';
import { Enemy } from './entities.js';

export class World {
  constructor() {
    this.currentWorld = 'overworld';
    this.roomX = 1;
    this.roomY = 1;
    this.rooms = {};
    this.enemies = [];
    this.items = [];
    this.chests = {};
    this.doors = {};
    this.signs = {};
    this.stairs = {};
    this.transition = null;
    this.frame = 0;
  }

  init() {
    this.loadWorld('overworld', OVERWORLD.startRoom, OVERWORLD.startPos);
  }

  getWorldData() {
    return this.currentWorld === 'overworld' ? OVERWORLD : DUNGEON;
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

  loadWorld(worldName, roomKey, startPos) {
    this.currentWorld = worldName;
    const data = worldName === 'overworld' ? OVERWORLD : DUNGEON;
    const [rx, ry] = roomKey.split(',').map(Number);
    this.roomX = rx;
    this.roomY = ry;
    this.loadRoom(startPos);
  }

  loadRoom(entryPos) {
    const room = this.getCurrentRoom();
    if (!room) return null;

    const key = this.getRoomKey();
    const fullKey = `${this.currentWorld}:${key}`;

    if (!this.rooms[fullKey]) {
      this.rooms[fullKey] = {
        map: room.map.map((row) => [...row]),
        enemies: (room.enemies || []).map((e) => new Enemy(e.type, e.x, e.y)),
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
    }

    const saved = this.rooms[fullKey];
    this.enemies = saved.enemies;
    this.items = saved.items;

    return entryPos || { x: 8, y: 7 };
  }

  getSavedMap() {
    const fullKey = `${this.currentWorld}:${this.getRoomKey()}`;
    return this.rooms[fullKey]?.map || this.getMap();
  }

  tryTransition(player) {
    if (this.transition) return;

    const cx = player.cx;
    const cy = player.cy;
    let dir = null;
    let nrx = this.roomX;
    let nry = this.roomY;

    if (cy < TILE + 8) { dir = 'up'; nry--; }
    else if (cy > 13 * TILE) { dir = 'down'; nry++; }
    else if (cx < TILE) { dir = 'left'; nrx--; }
    else if (cx > 15 * TILE) { dir = 'right'; nrx++; }
    else return;

    const data = this.getWorldData();
    const nextKey = `${nrx},${nry}`;
    if (!data.rooms[nextKey]) return;

    this.transition = {
      dir,
      timer: TRANSITION_DURATION,
      nextRoom: { x: nrx, y: nry },
      entryPos: this.getEntryPos(dir),
    };
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
    const fullKey = `${this.currentWorld}:${this.getRoomKey()}`;
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
    const data = stair.target === 'overworld' ? OVERWORLD : DUNGEON;
    this.transition = {
      dir: 'fade',
      timer: TRANSITION_DURATION * 1.5,
      nextWorld: stair.target,
      nextRoom: stair.room,
      entryPos: stair.entry || data.startPos,
    };
  }

  updateStairsTransition(player) {
    if (!this.transition || this.transition.dir !== 'fade') return false;

    this.transition.timer--;
    if (this.transition.timer <= 0) {
      if (this.transition.nextWorld) {
        this.loadWorld(this.transition.nextWorld, this.transition.nextRoom, this.transition.entryPos);
      }
      player.x = this.transition.entryPos.x * TILE + 4;
      player.y = this.transition.entryPos.y * TILE + 2;
      this.transition = null;
      return true;
    }
    return false;
  }

  openChest(player) {
    const fullKey = `${this.currentWorld}:${this.getRoomKey()}`;
    const chest = this.chests[fullKey];
    if (!chest || chest.opened) return null;

    const tx = Math.floor(player.cx / TILE);
    const ty = Math.floor(player.cy / TILE);
    if (Math.abs(tx - chest.x) > 1 || Math.abs(ty - chest.y) > 1) return null;

    chest.opened = true;
    const map = this.getSavedMap();
    map[chest.y][chest.x] = 8;
    return chest.item;
  }

  tryOpenDoor(player, keys) {
    const fullKey = `${this.currentWorld}:${this.getRoomKey()}`;
    const door = this.doors[fullKey];
    if (!door || door.open) return false;

    const tx = Math.floor(player.cx / TILE);
    const ty = Math.floor(player.cy / TILE);
    if (Math.abs(tx - door.x) > 1 || Math.abs(ty - door.y) > 1) return false;

    if (door.keyRequired && keys <= 0) return false;

    door.open = true;
    const map = this.getSavedMap();
    map[door.y][door.x] = 6;
    map[door.y + 1][door.x] = 6;
    return door.keyRequired;
  }

  checkSign(player) {
    const fullKey = `${this.currentWorld}:${this.getRoomKey()}`;
    const text = this.signs[fullKey];
    if (!text) return null;

    const tx = Math.floor(player.cx / TILE);
    const ty = Math.floor(player.cy / TILE);
    const map = this.getSavedMap();
    if (map[ty]?.[tx] === 15) return text;
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

  destroyTile(x, y) {
    const map = this.getSavedMap();
    const tile = map[y]?.[x];
    if (tile === 3) {
      map[y][x] = 0;
      if (Math.random() < 0.15) {
        this.items.push({ type: 'crystal_shard', x, y, value: 1, collected: false });
      }
      if (Math.random() < 0.05) {
        this.items.push({ type: 'heart', x, y, collected: false });
      }
    } else if (tile === 10) {
      map[y][x] = this.currentWorld === 'dungeon' ? 8 : 0;
      if (Math.random() < 0.3) {
        this.items.push({ type: 'crystal_shard', x, y, value: 2, collected: false });
      }
      if (Math.random() < 0.1) {
        this.items.push({ type: 'heart', x, y, collected: false });
      }
    }
  }
}
