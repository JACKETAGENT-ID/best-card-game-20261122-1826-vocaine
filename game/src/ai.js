// Void Fleet — the enemy admiral and the screenshot autopilot.
// The enemy AI is a readable, deterministic admiral: each turn it refills
// energy, draws, deploys the strongest ships it can afford, then attacks —
// a ship that can sink one of yours does so, the rest hammer your hull.
// The autopilot plays the player's side the same careful way. Both use the
// seeded generator, so a seed replays the same battle every time.
import { MAX_FIELD } from './config.js';
import { drawCard } from './cards.js';
import { energyForTurn, enemyAttack, checkEnd, deployCard, attackWith } from './state.js';

export function runEnemyTurn(game) {
  const foe = game.enemy;
  foe.maxEnergy = energyForTurn(game.turn);
  foe.energy = foe.maxEnergy;
  for (const ship of foe.field) ship.canAttack = true;
  drawCard(foe);

  // Deploy: biggest affordable ship first, while the field has room.
  let deployed = true;
  while (deployed && foe.field.length < MAX_FIELD) {
    deployed = false;
    let best = -1;
    for (let i = 0; i < foe.hand.length; i += 1) {
      const card = foe.hand[i];
      if (card.cost > foe.energy) continue;
      if (best < 0 || card.cost > foe.hand[best].cost) best = i;
    }
    if (best >= 0) {
      const card = foe.hand.splice(best, 1)[0];
      foe.energy -= card.cost;
      card.canAttack = card.keyword === 'SWIFT';
      foe.field.push(card);
      if (card.keyword === 'REPAIR') foe.hull = Math.min(30, foe.hull + 3);
      if (card.keyword === 'SALVAGE') drawCard(foe);
      deployed = true;
    }
  }

  // Attack: sink a player ship when possible, otherwise strike the hull.
  for (let i = 0; i < foe.field.length; i += 1) {
    const ship = foe.field[i];
    if (!ship || !ship.canAttack) continue;
    let target = { kind: 'hull' };
    let weakest = -1;
    for (let j = 0; j < game.player.field.length; j += 1) {
      const victim = game.player.field[j];
      if (victim.shd <= ship.atk && (weakest < 0 || victim.shd < game.player.field[weakest].shd)) {
        weakest = j;
      }
    }
    if (weakest >= 0) target = { kind: 'ship', index: weakest };
    enemyAttack(game, i, target);
    if (game.phase !== 'play') return;
  }
  checkEnd(game);
}

// The autopilot plays the player's side the way a careful admiral would:
// deploy the best affordable ships, then strike the weakest enemy ship it
// can sink, otherwise the enemy hull. It plays through the real rules
// (deployCard / attackWith), so a screenshot scene is a real game state.
export function autopilotPlayerTurn(game) {
  const side = game.player;
  let deployed = true;
  while (deployed && side.field.length < MAX_FIELD) {
    deployed = false;
    let best = -1;
    for (let i = 0; i < side.hand.length; i += 1) {
      const card = side.hand[i];
      if (card.cost > side.energy) continue;
      if (best < 0 || card.cost > side.hand[best].cost) best = i;
    }
    if (best >= 0 && deployCard(game, best)) deployed = true;
  }
  for (let i = 0; i < side.field.length; i += 1) {
    const ship = side.field[i];
    if (!ship || !ship.canAttack) continue;
    let target = { kind: 'hull' };
    let weakest = -1;
    for (let j = 0; j < game.enemy.field.length; j += 1) {
      const victim = game.enemy.field[j];
      if (victim.shd <= ship.atk && (weakest < 0 || victim.shd < game.enemy.field[weakest].shd)) {
        weakest = j;
      }
    }
    if (weakest >= 0) target = { kind: 'ship', index: weakest };
    attackWith(game, i, target);
    if (game.phase !== 'play') return;
  }
}
