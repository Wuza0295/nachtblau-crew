import { Game } from './game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.start();
window.__game = game;

function loop() {
  game.tick();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
