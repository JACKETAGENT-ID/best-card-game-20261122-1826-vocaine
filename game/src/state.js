// Void Fleet — the battle state and the rules that move it.
// A battle: both fleets start at 30 hull. Each turn you gain energy (turn
// number + 2, capped at 8), draw a card, deploy ships to your field and
// attack with ready ships. A ship that just deployed cannot attack unless it
// is SWIFT. Attacking an enemy ship damages its shield; attacking the enemy
// hull damages its hull. The first hull to reach 0 loses the battle.
import { START_HULL, START_HAND, MAX_HAND, MAX_FIELD, MAX_ENERGY } from './config.js';
import { buildDeck, drawCard } from './cards.js';
import { mulberry32 } from './random.js';

export function createSide(rng) {
  return {
    hull: START_HULL,
    energy: 0,
    maxEnergy: 0,
    deck: buildDeck(rng),
    hand: [],
    field: [],
    kills: 0,
  };
}

export function createGame(seed) {
  const rng = mulberry32(seed);
  const game = {
    seed,
    rng,
    phase: 'title', // title | play | win | loss
    turn: 1,
    player: createSide(rng),
    enemy: createSide(rng),
    selectedCard: -1, // index into player hand, or -1
    selectedShip: -1, // index into player field, or -1
    message: 'Deploy a ship, then attack. First hull to 0 loses.',
    log: [],
  };
  for (let i = 0; i < START_HAND; i += 1) {
    drawCard(game.player);
    drawCard(game.enemy);
  }
  beginPlayerTurn(game);
  return game;
}

export function energyForTurn(turn) {
  return Math.min(turn + 2, MAX_ENERGY);
}

// Start of the player's turn: refill energy, draw, wake the fleet.
export function beginPlayerTurn(game) {
  const side = game.player;
  side.maxEnergy = energyForTurn(game.turn);
  side.energy = side.maxEnergy;
  for (const ship of side.field) ship.canAttack = true;
  drawCard(side);
  game.selectedCard = -1;
  game.selectedShip = -1;
  game.message = `Turn ${game.turn} — energy ${side.energy}. Deploy ships, then attack.`;
}

export function canDeploy(game, handIndex) {
  const card = game.player.hand[handIndex];
  if (!card) return false;
  if (game.player.field.length >= MAX_FIELD) return false;
  return game.player.energy >= card.cost;
}

// Move a hand card onto the player's field and pay its energy cost.
export function deployCard(game, handIndex) {
  const side = game.player;
  const card = side.hand[handIndex];
  if (!card || !canDeploy(game, handIndex)) return false;
  side.hand.splice(handIndex, 1);
  side.energy -= card.cost;
  card.canAttack = card.keyword === 'SWIFT';
  side.field.push(card);
  if (card.keyword === 'REPAIR') {
    side.hull = Math.min(START_HULL, side.hull + 3);
    game.message = `${card.name} repairs your hull +3.`;
  } else if (card.keyword === 'SALVAGE') {
    drawCard(side);
    game.message = `${card.name} salvages a card from the wreck.`;
  } else {
    game.message = `${card.name} deployed to your fleet.`;
  }
  game.log.push(`deploy ${card.name}`);
  return true;
}

export function canAttackWith(game, fieldIndex) {
  const ship = game.player.field[fieldIndex];
  return Boolean(ship && ship.canAttack);
}

// One ship attacks: an enemy ship ('ship', index) or the enemy hull ('hull').
export function attackWith(game, fieldIndex, target) {
  const attacker = game.player.field[fieldIndex];
  if (!attacker || !attacker.canAttack) return false;
  attacker.canAttack = false;
  if (target.kind === 'hull') {
    game.enemy.hull -= attacker.atk;
    game.message = `${attacker.name} hits the enemy hull for ${attacker.atk}!`;
    game.log.push(`attack hull ${attacker.atk}`);
  } else {
    const victim = game.enemy.field[target.index];
    if (!victim) return false;
    victim.shd -= attacker.atk;
    game.message = `${attacker.name} hits ${victim.name} for ${attacker.atk}.`;
    game.log.push(`attack ${victim.name} ${attacker.atk}`);
    if (victim.shd <= 0) {
      game.enemy.field.splice(target.index, 1);
      game.player.kills += 1;
      game.message = `${victim.name} destroyed!`;
    }
  }
  checkEnd(game);
  return true;
}

// Enemy ship attacks the player's side (mirror of attackWith, no selection).
export function enemyAttack(game, fieldIndex, target) {
  const attacker = game.enemy.field[fieldIndex];
  if (!attacker || !attacker.canAttack) return false;
  attacker.canAttack = false;
  if (target.kind === 'hull') {
    game.player.hull -= attacker.atk;
    game.log.push(`enemy hits hull ${attacker.atk}`);
  } else {
    const victim = game.player.field[target.index];
    if (!victim) return false;
    victim.shd -= attacker.atk;
    game.log.push(`enemy hits ${victim.name} ${attacker.atk}`);
    if (victim.shd <= 0) {
      game.player.field.splice(target.index, 1);
      game.enemy.kills += 1;
    }
  }
  checkEnd(game);
  return true;
}

export function checkEnd(game) {
  if (game.phase !== 'play') return;
  if (game.enemy.hull <= 0) {
    game.phase = 'win';
    game.message = 'Enemy flagship destroyed — the void is yours!';
  } else if (game.player.hull <= 0) {
    game.phase = 'loss';
    game.message = 'Your flagship is gone — the fleet is lost.';
  }
}

// End the player's turn: the enemy acts, then a fresh player turn begins.
export function endPlayerTurn(game, runEnemyTurn) {
  if (game.phase !== 'play') return;
  game.selectedCard = -1;
  game.selectedShip = -1;
  runEnemyTurn(game);
  if (game.phase !== 'play') return;
  game.turn += 1;
  beginPlayerTurn(game);
}

export function handSize(side) {
  return side.hand.length;
}

export function fieldCount(side) {
  return side.field.length;
}

export { MAX_HAND, MAX_FIELD };
