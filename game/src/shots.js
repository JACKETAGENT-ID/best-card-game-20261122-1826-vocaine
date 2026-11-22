// Void Fleet — screenshot scenes: ?shot=start|play|win|loss&seed=1.
// Every scene is a real game state, reached by playing the actual rules
// forward from a fresh deck with a deterministic autopilot on a fixed seed:
// start shows the title, play stops mid-battle, win plays until the enemy
// hull falls, loss plays passively (never deploying, never attacking) until
// the enemy admiral burns the player's hull to zero.
import { createGame, endPlayerTurn } from './state.js';
import { runEnemyTurn, autopilotPlayerTurn } from './ai.js';

function playTurns(game, maxTurns, aggressive) {
  let turns = 0;
  while (game.phase === 'play' && turns < maxTurns) {
    if (aggressive) autopilotPlayerTurn(game);
    if (game.phase !== 'play') break;
    endPlayerTurn(game, runEnemyTurn);
    turns += 1;
  }
  return game;
}

export function applyShot(game, shot, seed) {
  if (shot === 'start') {
    game.phase = 'title';
    return game;
  }
  if (shot === 'play') {
    game.phase = 'play';
    // Six full turns: both fleets on the table, hands in play.
    playTurns(game, 6, true);
    if (game.phase !== 'play') {
      // A freak early finish would hide the table; replay fewer turns.
      const again = createGame(seed);
      again.phase = 'play';
      playTurns(again, 3, true);
      return again;
    }
    return game;
  }
  if (shot === 'win') {
    game.phase = 'play';
    playTurns(game, 60, true);
    return game;
  }
  if (shot === 'loss') {
    game.phase = 'play';
    playTurns(game, 60, false);
    return game;
  }
  return game;
}

// Parse the scene out of the page URL (?shot=play&seed=1).
export function shotFromUrl(url) {
  const params = new URLSearchParams(url.split('?')[1] || '');
  const shot = params.get('shot');
  const seed = Number.parseInt(params.get('seed') || '1', 10) || 1;
  if (!shot || !['start', 'play', 'win', 'loss'].includes(shot)) return null;
  return { shot, seed };
}
