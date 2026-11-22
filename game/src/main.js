// Void Fleet — bootstrap: size the canvas, build the battle, run the loop.
// A ?shot= URL parameter jumps straight into a screenshot scene (see
// shots.js); otherwise the game opens on its title screen.
import { TABLE_WIDTH, TABLE_HEIGHT } from './config.js';
import { createGame } from './state.js';
import { drawGame } from './render.js';
import { attachInput } from './input.js';
import { applyShot, shotFromUrl } from './shots.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
canvas.width = TABLE_WIDTH;
canvas.height = TABLE_HEIGHT;
const ctx = canvas.getContext('2d');

let game = createGame(1);
const shot = shotFromUrl(window.location.search);
if (shot) {
  applyShot(game, shot.shot, shot.seed);
  // A scene is a still frame: draw once and stop the loop.
  drawGame(ctx, game);
  statusEl.textContent = `Void Fleet scene: ${shot.shot}.`;
} else {
  const hooks = {
    onChange() {
      statusEl.textContent = game.message;
    },
    onRestart() {
      game = createGame(1);
      game.phase = 'play';
      statusEl.textContent = game.message;
    },
  };
  attachInput(canvas, game, hooks);
  statusEl.textContent = 'Void Fleet: press Enter or click to launch your fleet.';

  function frame() {
    drawGame(ctx, game);
    requestAnimationFrame(frame);
  }
  frame();
}
