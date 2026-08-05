import { initInput } from './input.js';
import { Game } from './game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

initInput();

function loop() {
  game.tick();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// Hide title overlay when game starts
const origStart = game.start.bind(game);
game.start = function () {
  document.getElementById('title-screen')?.classList.add('hidden');
  origStart();
};
