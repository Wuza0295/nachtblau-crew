import { ACTION, wasActionPressed } from './input.js';

export function createDungeonProgress() {
  return {
    schattenkrypta: makeDungeonState(3, 3),
    nebelkathedrale: makeDungeonState(3, 2),
    eisengrube: makeDungeonState(3, 2),
  };
}

function makeDungeonState(cols, rows) {
  return {
    cols,
    rows,
    map: false,
    compass: false,
    smallKeys: 0,
    bigKey: false,
    bossDead: false,
    explored: new Set(),
    chests: new Set(),
    bossRoom: null,
  };
}

export function markRoomExplored(state, roomX, roomY) {
  state.explored.add(`${roomX},${roomY}`);
}

export function getDungeonId(world) {
  if (world.currentWorld !== 'dungeon') return null;
  return world.currentDungeonId || 'schattenkrypta';
}

export function shouldShowMap(game) {
  const id = getDungeonId(game.world);
  if (!id) return false;
  return game.dungeonProgress[id]?.map;
}

export function shouldShowCompass(game) {
  const id = getDungeonId(game.world);
  if (!id) return false;
  return game.dungeonProgress[id]?.compass;
}

export function readActions() {
  return {
    attack: wasActionPressed(ACTION.ATTACK),
    item: wasActionPressed(ACTION.ITEM),
    interact: wasActionPressed(ACTION.INTERACT),
    confirm: wasActionPressed(ACTION.CONFIRM),
    stairs: wasActionPressed(ACTION.STAIRS),
  };
}
