/**
 * ALttP-style interaction: A talks / reads / opens before swinging the sword.
 */
import { TILE, DIR, TILES } from './constants.js';

const TALK_RANGE = 36;

export function facingOffset(dir) {
  return [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ][dir] || { x: 0, y: 1 };
}

/** Prefer NPC the player is facing; fall back to nearest in range. */
export function findNpc(player, npcs) {
  if (!npcs?.length) return null;
  const fo = facingOffset(player.dir);
  const faceX = player.cx + fo.x * 14;
  const faceY = player.cy + fo.y * 14;

  let best = null;
  let bestDist = TALK_RANGE;
  let facingBest = null;
  let facingDist = TALK_RANGE;

  for (const npc of npcs) {
    const nx = npc.x + npc.width / 2;
    const ny = npc.y + npc.height / 2;
    const dist = Math.hypot(player.cx - nx, player.cy - ny);
    if (dist < bestDist) {
      bestDist = dist;
      best = npc;
    }
    const fdist = Math.hypot(faceX - nx, faceY - ny);
    if (fdist < facingDist) {
      facingDist = fdist;
      facingBest = npc;
    }
  }
  return facingBest || best;
}

export function findSign(player, map, signText) {
  if (!signText || !map) return null;
  const cx = Math.floor(player.cx / TILE);
  const cy = Math.floor(player.cy / TILE);
  const fo = facingOffset(player.dir);
  const checks = [
    [cx, cy],
    [cx + fo.x, cy + fo.y],
    [cx + fo.x * 2, cy + fo.y * 2],
    [cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1],
  ];
  for (const [tx, ty] of checks) {
    if (map[ty]?.[tx] === TILES.SIGN) return signText;
  }
  return null;
}

export function createDialogState() {
  return {
    open: false,
    lines: [],
    page: 0,
    speaker: null,
  };
}

export function openDialog(state, text, speaker = null) {
  const maxLen = 34;
  const lines = [];
  let rest = String(text || '').trim();
  while (rest.length > 0) {
    if (rest.length <= maxLen) {
      lines.push(rest);
      break;
    }
    let cut = rest.lastIndexOf(' ', maxLen);
    if (cut < 10) cut = maxLen;
    lines.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  // Pages of up to 3 lines (ALttP-ish text box)
  const pages = [];
  for (let i = 0; i < lines.length; i += 3) {
    pages.push(lines.slice(i, i + 3));
  }
  state.open = true;
  state.pages = pages.length ? pages : [['…']];
  state.page = 0;
  state.speaker = speaker;
  return state;
}

export function advanceDialog(state) {
  if (!state.open) return false;
  if (state.page < state.pages.length - 1) {
    state.page++;
    return true; // still open
  }
  state.open = false;
  state.pages = [];
  state.page = 0;
  state.speaker = null;
  return false;
}

export function currentDialogLines(state) {
  if (!state.open) return [];
  return state.pages[state.page] || [];
}
