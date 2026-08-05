import { W, H, PHASE, LAPS, FIELD_COUNT } from './constants.js?v=8';
import { CHARACTERS, KART_CLASSES } from './characters.js?v=8';
import { initTracks, raceProgress } from './tracks.js?v=8';
import {
  createRenderer, renderMode7, project, drawKartSprite, drawHazardSprite,
  drawItemBox, drawHUD, drawMinimap, formatTime, drawPlayerKart,
} from './render.js?v=8';
import { createKart, resetKartPosition, updateKartPhysics } from './karts.js?v=8';
import { createItemWorld, resetItemWorld, updateItems, useItem, swapItems } from './items.js?v=8';
import { updateAI, gridPositions } from './ai.js?v=8';
import {
  initInput, wasPressed, steerAxis, throttle, isDrifting, isDown, clearPressed,
} from './input.js?v=8';

const AI_PAIRS = [
  ['shade', 'ember'],
  ['bolt', 'mira'],
  ['titan', 'rook'],
  ['spark', 'luma'],
  ['ember', 'bolt'],
  ['mira', 'shade'],
  ['rook', 'titan'],
];

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.r = createRenderer(canvas);
    this.phase = PHASE.MENU;
    this.menuIndex = 0;
    this.tracks = initTracks();
    this.trackIndex = 0;
    this.selectStep = 0; // 0 driver, 1 passenger, 2 kart
    this.charIndex = 0;
    this.driverId = 'luma';
    this.passengerId = 'shade';
    this.kartId = 'cruiser';
    this.world = createItemWorld();
    this.karts = [];
    this.player = null;
    this.countdown = 0;
    this.raceTime = 0;
    this.finishCount = 0;
    this.resultsTimer = 0;
    this.time = 0;
    this.last = performance.now();
    initInput(canvas);
  }

  start() {
    this.phase = PHASE.MENU;
  }

  tick() {
    const now = performance.now();
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.05) dt = 0.05;
    this.time += dt;

    if (this.phase === PHASE.MENU) this.tickMenu(dt);
    else if (this.phase === PHASE.SELECT) this.tickSelect(dt);
    else if (this.phase === PHASE.RACE) this.tickRace(dt);
    else if (this.phase === PHASE.RESULTS) this.tickResults(dt);

    this.draw();
  }

  tickMenu() {
    if (wasPressed('ArrowDown') || wasPressed('KeyS')) this.menuIndex = (this.menuIndex + 1) % 3;
    if (wasPressed('ArrowUp') || wasPressed('KeyW')) this.menuIndex = (this.menuIndex + 2) % 3;
    if (wasPressed('Enter') || wasPressed('Space') || wasPressed('KeyZ')) {
      if (this.menuIndex === 0) {
        this.phase = PHASE.SELECT;
        this.selectStep = 0;
        this.charIndex = CHARACTERS.findIndex((c) => c.id === this.driverId);
        clearPressed();
      } else if (this.menuIndex === 1) {
        this.trackIndex = (this.trackIndex + 1) % this.tracks.length;
      } else {
        this.menuIndex = 0; // Steuerung = stay, show hint via draw
      }
    }
  }

  tickSelect() {
    const list = this.selectStep < 2 ? CHARACTERS : KART_CLASSES;
    if (wasPressed('ArrowRight') || wasPressed('KeyD')) this.charIndex = (this.charIndex + 1) % list.length;
    if (wasPressed('ArrowLeft') || wasPressed('KeyA')) this.charIndex = (this.charIndex + list.length - 1) % list.length;
    if (wasPressed('Enter') || wasPressed('Space') || wasPressed('KeyZ')) {
      if (this.selectStep === 0) {
        this.driverId = CHARACTERS[this.charIndex].id;
        this.selectStep = 1;
        this.charIndex = CHARACTERS.findIndex((c) => c.id === this.passengerId);
        if (this.charIndex < 0 || this.passengerId === this.driverId) {
          this.charIndex = CHARACTERS.findIndex((c) => c.id !== this.driverId);
        }
      } else if (this.selectStep === 1) {
        const id = CHARACTERS[this.charIndex].id;
        if (id === this.driverId) return;
        this.passengerId = id;
        this.selectStep = 2;
        this.charIndex = KART_CLASSES.findIndex((k) => k.id === this.kartId);
      } else {
        this.kartId = KART_CLASSES[this.charIndex].id;
        this.beginRace();
      }
    }
    if (wasPressed('Escape') || wasPressed('Backspace')) {
      if (this.selectStep === 0) this.phase = PHASE.MENU;
      else this.selectStep -= 1;
    }
  }

  beginRace() {
    const track = this.tracks[this.trackIndex];
    const grid = gridPositions(track, FIELD_COUNT);
    this.karts = [];

    this.player = createKart({
      isPlayer: true,
      driverId: this.driverId,
      passengerId: this.passengerId,
      kartId: this.kartId,
      name: 'Du',
    });
    resetKartPosition(this.player, grid[0].x, grid[0].y, grid[0].angle);
    this.karts.push(this.player);

    for (let i = 1; i < FIELD_COUNT; i++) {
      const pair = AI_PAIRS[(i - 1) % AI_PAIRS.length];
      const kart = createKart({
        driverId: pair[0],
        passengerId: pair[1],
        kartId: KART_CLASSES[i % KART_CLASSES.length].id,
        name: `${CHARACTERS.find((c) => c.id === pair[0]).name} & ${CHARACTERS.find((c) => c.id === pair[1]).name}`,
      });
      resetKartPosition(kart, grid[i].x, grid[i].y, grid[i].angle);
      kart.aiTarget = 1;
      this.karts.push(kart);
    }

    resetItemWorld(this.world, track);
    this.countdown = 3.6;
    this.raceTime = 0;
    this.finishCount = 0;
    this.phase = PHASE.RACE;
    clearPressed();
  }

  tickRace(dt) {
    const track = this.tracks[this.trackIndex];

    if (this.countdown > 0) {
      this.countdown -= dt;
      // still allow slight display; freeze physics until <= 0
      if (this.countdown > 0) {
        this.updatePlaces(track);
        return;
      }
      this.countdown = 0;
    }

    this.raceTime += dt;

    // Player controls — Double Dash: Z driver item, X passenger item, Q swap
    // Mild auto-throttle (SNES often held accel); brake still works
    let thr = throttle();
    if (thr === 0) thr = 0.85;
    const ctrl = {
      throttle: thr,
      steer: steerAxis(),
      drift: isDrifting(),
    };
    this._lastSteer = ctrl.steer;
    updateKartPhysics(this.player, track, ctrl, dt);

    if (wasPressed('KeyZ') || wasPressed('KeyN')) useItem(this.player, 0, this.world, this.karts, track);
    if (wasPressed('KeyX') || wasPressed('KeyM')) useItem(this.player, 1, this.world, this.karts, track);
    if (wasPressed('KeyQ') || wasPressed('Tab')) {
      swapItems(this.player);
      this.player.activeSlot = this.player.activeSlot === 0 ? 1 : 0;
    }
    if (wasPressed('Digit1')) this.player.activeSlot = 0;
    if (wasPressed('Digit2')) this.player.activeSlot = 1;

    for (const k of this.karts) {
      if (!k.isPlayer) updateAI(k, track, this.karts, this.world, this.player, dt);
    }

    updateItems(this.world, this.karts, track, dt);
    this.updateLaps(track);
    this.updatePlaces(track);
    this.resolveKartBump();

    if (this.player.finished && this.finishCount >= Math.min(3, this.karts.length)) {
      this.resultsTimer = 0;
      this.phase = PHASE.RESULTS;
    }
    // Or when player finished and short wait
    if (this.player.finished) {
      this.resultsTimer = (this.resultsTimer || 0) + dt;
      if (this.resultsTimer > 4) this.phase = PHASE.RESULTS;
    }

    if (wasPressed('Escape')) {
      this.phase = PHASE.MENU;
    }
  }

  updateLaps(track) {
    const wps = track.waypoints;
    const n = wps.length;
    for (const kart of this.karts) {
      if (kart.finished) continue;
      const next = (kart.checkpoint + 1) % n;
      const target = wps[next];
      const d2 = (kart.x - target.x) ** 2 + (kart.y - target.y) ** 2;
      if (d2 > 75 * 75) continue;

      if (kart.checkpoint === n - 1 && next === 0) {
        kart.laps += 1;
        kart.checkpoint = 0;
        if (kart.laps >= LAPS) {
          kart.finished = true;
          kart.finishPlace = ++this.finishCount;
          kart.finishTime = this.raceTime;
          kart.speed = 0;
        }
      } else {
        kart.checkpoint = next;
      }
    }
  }

  updatePlaces(track) {
    const ranked = [...this.karts].sort((a, b) => {
      if (a.finished && b.finished) return a.finishPlace - b.finishPlace;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return raceProgress(track, b) - raceProgress(track, a);
    });
    ranked.forEach((k, i) => {
      k.place = i + 1;
    });
  }

  resolveKartBump() {
    for (let i = 0; i < this.karts.length; i++) {
      for (let j = i + 1; j < this.karts.length; j++) {
        const a = this.karts[i];
        const b = this.karts[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        const min = 18;
        if (d2 < min * min && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          const overlap = (min - d) * 0.5;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
          // weight check
          const aw = a.stats.weight;
          const bw = b.stats.weight;
          if (aw > bw * 1.15 && a.speed > 1.5) {
            b.spin = Math.max(b.spin, 0.35);
          } else if (bw > aw * 1.15 && b.speed > 1.5) {
            a.spin = Math.max(a.spin, 0.35);
          }
        }
      }
    }
  }

  tickResults() {
    if (wasPressed('Enter') || wasPressed('Space') || wasPressed('KeyZ')) {
      this.phase = PHASE.MENU;
      clearPressed();
    }
  }

  draw() {
    const ctx = this.r.ctx;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    if (this.phase === PHASE.MENU) this.drawMenu(ctx);
    else if (this.phase === PHASE.SELECT) this.drawSelect(ctx);
    else if (this.phase === PHASE.RACE) this.drawRace(ctx);
    else if (this.phase === PHASE.RESULTS) this.drawResults(ctx);
  }

  drawMenu(ctx) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#041018');
    g.addColorStop(0.5, '#0c1e38');
    g.addColorStop(1, '#02060c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.75, 70, 10, W * 0.75, 70, 120);
    glow.addColorStop(0, 'rgba(94,234,255,0.2)');
    glow.addColorStop(1, 'rgba(94,234,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(W * 0.5, 0, W * 0.5, 200);

    ctx.fillStyle = '#eef6ff';
    ctx.beginPath();
    ctx.arc(W * 0.78, 64, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0c1e38';
    ctx.beginPath();
    ctx.arc(W * 0.81, 58, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#a8e6ff';
    ctx.font = '800 52px Orbitron,sans-serif';
    ctx.shadowColor = '#5eeaff';
    ctx.shadowBlur = 18;
    ctx.fillText('BLUEPOLE', W / 2, 100);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#6b8aab';
    ctx.font = '500 14px Exo 2,sans-serif';
    ctx.fillText('NACHTBLAU RACING  ·  DOUBLE DASH', W / 2, 128);

    const items = [
      'Grand Prix starten',
      `Strecke: ${this.tracks[this.trackIndex].name}`,
      'Steuerung anzeigen',
    ];
    items.forEach((label, i) => {
      const y = 180 + i * 42;
      const selected = i === this.menuIndex;
      if (selected) {
        ctx.fillStyle = 'rgba(94,234,255,0.12)';
        ctx.strokeStyle = '#5eeaff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(W / 2 - 160, y - 26, 320, 38, 12);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = selected ? '#eef6ff' : '#6b8aab';
      ctx.font = selected ? '600 18px Exo 2,sans-serif' : '500 16px Exo 2,sans-serif';
      ctx.fillText(label, W / 2, y);
    });

    if (this.menuIndex === 2) {
      ctx.fillStyle = '#6b8aab';
      ctx.font = '400 13px Exo 2,sans-serif';
      ctx.fillText('WASD / Pfeile  ·  Shift Drift  ·  Z/X Items  ·  Q Tausch', W / 2, 320);
    }
    ctx.fillStyle = '#3a5a78';
    ctx.font = '500 12px Exo 2,sans-serif';
    ctx.fillText('NachtBlau Interactive', W / 2, 348);
    ctx.textAlign = 'left';
  }

  drawSelect(ctx) {
    ctx.fillStyle = '#040a14';
    ctx.fillRect(0, 0, W, H);
    const steps = ['Fahrer', 'Beifahrer', 'Kart'];
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a8e6ff';
    ctx.font = '700 24px Orbitron,sans-serif';
    ctx.fillText(`TEAM — ${steps[this.selectStep].toUpperCase()}`, W / 2, 48);
    ctx.fillStyle = '#6b8aab';
    ctx.font = '400 13px Exo 2,sans-serif';
    ctx.fillText('← → wählen  ·  Enter bestätigen  ·  Esc zurück', W / 2, 74);

    if (this.selectStep < 2) {
      const c = CHARACTERS[this.charIndex];
      const blocked = this.selectStep === 1 && c.id === this.driverId;
      const grd = ctx.createRadialGradient(W / 2, 160, 10, W / 2, 160, 80);
      grd.addColorStop(0, c.color);
      grd.addColorStop(1, '#0c1e38');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(W / 2, 160, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5eeaff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#eef6ff';
      ctx.font = '700 28px Orbitron,sans-serif';
      ctx.fillText(c.name, W / 2, 260);
      ctx.fillStyle = blocked ? '#ff6b6b' : '#6b8aab';
      ctx.font = '400 14px Exo 2,sans-serif';
      ctx.fillText(blocked ? 'bereits als Fahrer gewählt' : c.blurb, W / 2, 286);
      ctx.fillStyle = '#5eeaff';
      ctx.fillText(`Spezial: ${c.specialName}`, W / 2, 310);
      ctx.fillStyle = '#3a5a78';
      ctx.fillText(`Gewicht: ${c.weight}`, W / 2, 332);
    } else {
      const k = KART_CLASSES[this.charIndex];
      ctx.fillStyle = 'rgba(26,58,106,0.5)';
      ctx.strokeStyle = '#3a8fd4';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 120, 120, 240, 80, 16);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#a8e6ff';
      ctx.font = '700 28px Orbitron,sans-serif';
      ctx.fillText(k.name, W / 2, 170);
      ctx.fillStyle = '#6b8aab';
      ctx.font = '400 14px Exo 2,sans-serif';
      ctx.fillText(`Tempo ${k.topSpeed.toFixed(2)}   Accel ${k.accel.toFixed(2)}`, W / 2, 240);
      ctx.fillText(`Handling ${k.handling.toFixed(2)}   Drift ${k.drift.toFixed(2)}`, W / 2, 264);
    }

    ctx.fillStyle = '#3a5a78';
    ctx.font = '400 12px Exo 2,sans-serif';
    ctx.fillText(`${this.driverId} + ${this.passengerId}  /  ${this.kartId}`, W / 2, 350);
    ctx.textAlign = 'left';
  }

  drawRace(ctx) {
    const track = this.tracks[this.trackIndex];
    const cam = this.player;
    const camAngle = cam.angle;
    // camera slightly behind kart
    const camX = cam.x - Math.cos(camAngle) * 22;
    const camY = cam.y - Math.sin(camAngle) * 22;

    renderMode7(this.r, track, camX, camY, camAngle);

    // Collect billboards
    const sprites = [];
    for (const box of this.world.boxes) {
      const p = project(camX, camY, camAngle, box.x, box.y);
      if (p) sprites.push({ depth: p.depth, draw: () => drawItemBox(ctx, box, p, this.time) });
    }
    for (const h of this.world.hazards) {
      const p = project(camX, camY, camAngle, h.x, h.y);
      if (p) sprites.push({ depth: p.depth, draw: () => drawHazardSprite(ctx, h, p) });
    }
    for (const k of this.karts) {
      if (k.id === cam.id) continue;
      const p = project(camX, camY, camAngle, k.x, k.y);
      if (p) sprites.push({ depth: p.depth, draw: () => drawKartSprite(ctx, k, p) });
    }
    sprites.sort((a, b) => b.depth - a.depth);
    for (const s of sprites) s.draw();

    // Player kart — modern rear view
    drawPlayerKart(ctx, cam, this._lastSteer || 0);

    drawHUD(ctx, {
      player: this.player,
      countdown: this.countdown,
      raceTime: this.raceTime,
      track,
      laps: LAPS,
    });
    drawMinimap(ctx, track, this.karts, this.player);
  }

  drawResults(ctx) {
    ctx.fillStyle = 'rgba(4,10,20,0.94)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5eeaff';
    ctx.font = '800 36px Orbitron,sans-serif';
    ctx.shadowColor = '#5eeaff';
    ctx.shadowBlur = 16;
    ctx.fillText('ZIEL', W / 2, 56);
    ctx.shadowBlur = 0;
    ctx.font = '500 14px Exo 2,sans-serif';
    const sorted = [...this.karts].sort((a, b) => a.place - b.place);
    sorted.forEach((k, i) => {
      const y = 100 + i * 28;
      ctx.fillStyle = k.isPlayer ? '#a8e6ff' : '#6b8aab';
      const time = k.finished ? formatTime(k.finishTime) : '—';
      ctx.fillText(`${k.place}.  ${k.name}   ${time}`, W / 2, y);
    });
    ctx.fillStyle = '#3a5a78';
    ctx.fillText('Enter — Menü', W / 2, 340);
    ctx.textAlign = 'left';
  }
}

function nearestWp(kart, wps) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < wps.length; i++) {
    const d = (kart.x - wps[i].x) ** 2 + (kart.y - wps[i].y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}
