// Void Fleet — mouse and keyboard input.
// Click a hand card to select it, Enter (or a second click on your field)
// deploys it. Click one of your READY ships, then click an enemy ship or
// the enemy hull panel to attack. E ends the turn, R restarts, Enter starts.
import { deployCard, attackWith, endPlayerTurn, canDeploy } from './state.js';
import { runEnemyTurn } from './ai.js';
import { layoutFor } from './render.js';

function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
}

export function attachInput(canvas, game, hooks) {
  const layout = () => layoutFor(game);

  function startBattle() {
    game.phase = 'play';
    hooks.onChange();
  }

  function restart() {
    hooks.onRestart();
  }

  function handleClick(event) {
    const { x, y } = canvasPoint(canvas, event);
    if (game.phase === 'title') {
      startBattle();
      return;
    }
    if (game.phase === 'win' || game.phase === 'loss') {
      restart();
      return;
    }
    if (game.phase !== 'play') return;
    const L = layout();

    // End Turn button.
    if (pointInRect(x, y, L.endTurn)) {
      endPlayerTurn(game, runEnemyTurn);
      hooks.onChange();
      return;
    }

    // Attacking: a ship is selected, so this click picks its target.
    if (game.selectedShip >= 0) {
      if (pointInRect(x, y, L.enemyHull)) {
        attackWith(game, game.selectedShip, { kind: 'hull' });
        game.selectedShip = -1;
        hooks.onChange();
        return;
      }
      for (let i = 0; i < L.enemyField.length; i += 1) {
        if (pointInRect(x, y, L.enemyField[i])) {
          attackWith(game, game.selectedShip, { kind: 'ship', index: i });
          game.selectedShip = -1;
          hooks.onChange();
          return;
        }
      }
      // Clicked elsewhere: cancel the attack selection.
      game.selectedShip = -1;
      hooks.onChange();
      return;
    }

    // Select one of your ready field ships to attack with.
    for (let i = 0; i < L.field.length; i += 1) {
      if (pointInRect(x, y, L.field[i])) {
        const ship = game.player.field[i];
        if (ship && ship.canAttack) {
          game.selectedShip = i;
          game.selectedCard = -1;
          game.message = `${ship.name} ready — click an enemy ship or the enemy hull.`;
        } else {
          game.message = 'That ship already attacked this turn.';
        }
        hooks.onChange();
        return;
      }
    }

    // Select (or deploy) a hand card.
    for (let i = 0; i < L.hand.length; i += 1) {
      if (pointInRect(x, y, L.hand[i])) {
        if (game.selectedCard === i) {
          if (canDeploy(game, i)) deployCard(game, i);
          else game.message = 'Not enough energy — or the fleet is full.';
          game.selectedCard = -1;
        } else {
          game.selectedCard = i;
          game.message = game.player.hand[i].cost <= game.player.energy
            ? `${game.player.hand[i].name} selected — click again or press Enter to deploy.`
            : `${game.player.hand[i].name} costs ${game.player.hand[i].cost} energy — you have ${game.player.energy}.`;
        }
        hooks.onChange();
        return;
      }
    }
  }

  function handleKey(event) {
    const key = event.key.toLowerCase();
    if (game.phase === 'title' && (key === 'enter' || key === ' ')) {
      startBattle();
      return;
    }
    if ((game.phase === 'win' || game.phase === 'loss') && key === 'r') {
      restart();
      return;
    }
    if (game.phase !== 'play') return;
    if (key === 'r') {
      restart();
      return;
    }
    if (key === 'e') {
      endPlayerTurn(game, runEnemyTurn);
      hooks.onChange();
      return;
    }
    if (key === 'enter' || key === ' ') {
      if (game.selectedCard >= 0) {
        if (canDeploy(game, game.selectedCard)) deployCard(game, game.selectedCard);
        else game.message = 'Not enough energy — or the fleet is full.';
        game.selectedCard = -1;
        hooks.onChange();
      }
      return;
    }
    // Keys 1-7 select a hand card.
    const n = Number.parseInt(key, 10);
    if (n >= 1 && n <= 7 && n <= game.player.hand.length) {
      game.selectedCard = n - 1;
      game.selectedShip = -1;
      const card = game.player.hand[n - 1];
      game.message = `${card.name} selected — press Enter to deploy.`;
      hooks.onChange();
    }
    if (key === 'escape') {
      game.selectedCard = -1;
      game.selectedShip = -1;
      hooks.onChange();
    }
  }

  canvas.addEventListener('click', handleClick);
  window.addEventListener('keydown', handleKey);
}
