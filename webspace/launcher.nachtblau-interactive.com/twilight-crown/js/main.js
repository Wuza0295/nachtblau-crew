import { initInput } from './input.js';
import { initDisplay } from './display.js';
import { Game } from './game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

initInput();
initDisplay();

// Canvas zeichnet Startmenü — HTML-Titel bleibt versteckt
document.getElementById('title-screen')?.classList.add('hidden');

function loop() {
  game.tick();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
