if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const rr = typeof r === 'number' ? r : 0;
    this.beginPath();
    this.moveTo(x + rr, y);
    this.arcTo(x + w, y, x + w, y + h, rr);
    this.arcTo(x + w, y + h, x, y + h, rr);
    this.arcTo(x, y + h, x, y, rr);
    this.arcTo(x, y, x + w, y, rr);
    this.closePath();
    return this;
  };
}

import { Game } from './game.js?v=8';

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.start();
window.__game = game;

function loop() {
  game.tick();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
