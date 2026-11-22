// Void Fleet — the table renderer: one canvas, everything drawn by hand.
// Layout is fixed at 1280x800 and exported as hit rectangles so input and
// render always agree on where a card sits. Cards are legible at thumbnail
// size: huge ATK / SHD / cost numbers, told apart by colour AND shape.
import { TABLE_WIDTH, TABLE_HEIGHT, FACTIONS, COLORS } from './config.js';
import { mulberry32 } from './random.js';

const STARS = (() => {
  const rng = mulberry32(99);
  const stars = [];
  for (let i = 0; i < 110; i += 1) {
    stars.push({ x: rng() * TABLE_WIDTH, y: rng() * TABLE_HEIGHT, r: 0.6 + rng() * 1.7, a: 0.25 + rng() * 0.65 });
  }
  return stars;
})();

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawTriangle(ctx, cx, cy, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s * 0.9, cy + s * 0.7);
  ctx.lineTo(cx - s * 0.9, cy + s * 0.7);
  ctx.closePath();
  ctx.fill();
}

function drawHexagon(ctx, cx, cy, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    const px = cx + Math.cos(a) * s;
    const py = cy + Math.sin(a) * s;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawDiamond(ctx, cx, cy, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s, cy);
  ctx.lineTo(cx, cy + s);
  ctx.lineTo(cx - s, cy);
  ctx.closePath();
  ctx.fill();
}

// Faction glyph: a big shape in the middle of the card, one per faction.
function drawGlyph(ctx, glyph, cx, cy, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  if (glyph === 'dart') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx + s * 0.55, cy + s * 0.7);
    ctx.lineTo(cx, cy + s * 0.25);
    ctx.lineTo(cx - s * 0.55, cy + s * 0.7);
    ctx.closePath();
    ctx.fill();
  } else if (glyph === 'shield') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx + s * 0.8, cy - s * 0.5);
    ctx.lineTo(cx + s * 0.8, cy + s * 0.2);
    ctx.quadraticCurveTo(cx + s * 0.8, cy + s * 0.8, cx, cy + s);
    ctx.quadraticCurveTo(cx - s * 0.8, cy + s * 0.8, cx - s * 0.8, cy + s * 0.2);
    ctx.lineTo(cx - s * 0.8, cy - s * 0.5);
    ctx.closePath();
    ctx.fill();
  } else if (glyph === 'blade') {
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.2, cy - s);
    ctx.lineTo(cx + s * 0.6, cy + s * 0.2);
    ctx.lineTo(cx + s * 0.2, cy + s);
    ctx.lineTo(cx - s * 0.6, cy - s * 0.2);
    ctx.closePath();
    ctx.fill();
  } else {
    // wing: two swept arcs
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.5);
    ctx.quadraticCurveTo(cx - s, cy - s * 0.6, cx - s * 1.1, cy - s);
    ctx.quadraticCurveTo(cx - s * 0.3, cy - s * 0.2, cx, cy - s * 0.1);
    ctx.quadraticCurveTo(cx + s * 0.3, cy - s * 0.2, cx + s * 1.1, cy - s);
    ctx.quadraticCurveTo(cx + s, cy - s * 0.6, cx, cy + s * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const s = w / 150; // scale factor against the reference card size
  const faction = FACTIONS[card.faction];
  ctx.save();
  if (opts.lift) y -= 18 * s;
  roundRect(ctx, x, y, w, h, 10 * s);
  ctx.fillStyle = '#0d1330';
  ctx.fill();
  ctx.lineWidth = opts.selected ? 4 : 2;
  ctx.strokeStyle = opts.selected ? COLORS.gold : faction.color;
  ctx.stroke();
  if (opts.dim) {
    ctx.fillStyle = 'rgba(4,6,18,0.45)';
    ctx.fill();
  }

  // Name band.
  ctx.fillStyle = faction.dark;
  roundRect(ctx, x + 4 * s, y + 4 * s, w - 8 * s, 26 * s, 6 * s);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(14 * s)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(card.name.toUpperCase(), x + w / 2, y + 17 * s, w - 12 * s);

  // Energy cost: cyan diamond, top-left, big number.
  drawDiamond(ctx, x + 22 * s, y + 44 * s, 17 * s, COLORS.energy);
  ctx.fillStyle = '#062a33';
  ctx.font = `bold ${Math.round(17 * s)}px sans-serif`;
  ctx.fillText(String(card.cost), x + 22 * s, y + 45 * s);

  // Faction glyph in the middle.
  drawGlyph(ctx, faction.glyph, x + w / 2, y + h * 0.40, 30 * s, faction.color);

  // Keyword pill.
  if (card.keyword) {
    ctx.fillStyle = COLORS.gold;
    roundRect(ctx, x + w / 2 - 34 * s, y + h * 0.58, 68 * s, 18 * s, 9 * s);
    ctx.fill();
    ctx.fillStyle = '#231a04';
    ctx.font = `bold ${Math.round(11 * s)}px sans-serif`;
    ctx.fillText(card.keyword, x + w / 2, y + h * 0.58 + 9 * s);
  }

  // Flavor line, clear of the stat row below.
  ctx.fillStyle = COLORS.dim;
  ctx.font = `${Math.round(10 * s)}px sans-serif`;
  ctx.fillText(card.text, x + w / 2, y + h * 0.72, w - 14 * s);

  // ATK: red triangle + huge number, bottom-left. SHD: blue hexagon + huge
  // number, bottom-right. Shape + colour + number, never text alone.
  drawTriangle(ctx, x + 20 * s, y + h - 22 * s, 11 * s, COLORS.attack);
  ctx.fillStyle = COLORS.attack;
  ctx.font = `bold ${Math.round(26 * s)}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(String(card.atk), x + 36 * s, y + h - 22 * s);
  ctx.fillStyle = COLORS.dim;
  ctx.font = `bold ${Math.round(9 * s)}px sans-serif`;
  ctx.fillText('ATK', x + 36 * s, y + h - 40 * s);

  drawHexagon(ctx, x + w - 20 * s, y + h - 22 * s, 12 * s, COLORS.shield);
  ctx.fillStyle = COLORS.shield;
  ctx.font = `bold ${Math.round(26 * s)}px sans-serif`;
  ctx.textAlign = 'right';
  const shdText = card.shd === card.maxShd ? String(card.shd) : `${card.shd}/${card.maxShd}`;
  ctx.fillText(shdText, x + w - 36 * s, y + h - 22 * s);
  ctx.fillStyle = COLORS.dim;
  ctx.font = `bold ${Math.round(9 * s)}px sans-serif`;
  ctx.fillText('SHD', x + w - 36 * s, y + h - 40 * s);

  if (opts.ready) {
    ctx.fillStyle = COLORS.player;
    ctx.font = `bold ${Math.round(10 * s)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('READY', x + w / 2, y - 8 * s);
  }
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  const s = w / 60;
  roundRect(ctx, x, y, w, h, 8 * s);
  ctx.fillStyle = '#131c44';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#2b3a6e';
  ctx.stroke();
  drawDiamond(ctx, x + w / 2, y + h / 2 - 6 * s, 14 * s, COLORS.energy);
  ctx.fillStyle = COLORS.dim;
  ctx.font = `bold ${Math.round(9 * s)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('VOID', x + w / 2, y + h - 12 * s);
}

function drawHullPanel(ctx, x, y, w, h, label, hull, maxHull, color) {
  const shown = Math.max(0, hull);
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = COLORS.panel;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.dim;
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(label, x + 12, y + 14);
  ctx.fillStyle = color;
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`${shown}`, x + 12, y + 36);
  ctx.fillStyle = COLORS.dim;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`/ ${maxHull} HULL`, x + 62, y + 38);
  const barX = x + 130;
  const barW = w - 142;
  ctx.fillStyle = '#05070f';
  roundRect(ctx, barX, y + 26, barW, 14, 7);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, barX, y + 26, Math.max(4, (barW * shown) / maxHull), 14, 7);
  ctx.fill();
}

function drawBackground(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, TABLE_HEIGHT);
  grad.addColorStop(0, COLORS.spaceTop);
  grad.addColorStop(1, COLORS.spaceBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  for (const star of STARS) {
    ctx.globalAlpha = star.a;
    ctx.fillStyle = '#dbe4ff';
    ctx.fillRect(star.x, star.y, star.r, star.r);
  }
  ctx.globalAlpha = 1;
  // Nebula glow, top-left and bottom-right.
  const neb1 = ctx.createRadialGradient(180, 120, 10, 180, 120, 320);
  neb1.addColorStop(0, 'rgba(56,189,248,0.16)');
  neb1.addColorStop(1, 'rgba(56,189,248,0)');
  ctx.fillStyle = neb1;
  ctx.fillRect(0, 0, 520, 360);
  const neb2 = ctx.createRadialGradient(1120, 700, 10, 1120, 700, 340);
  neb2.addColorStop(0, 'rgba(244,114,182,0.14)');
  neb2.addColorStop(1, 'rgba(244,114,182,0)');
  ctx.fillStyle = neb2;
  ctx.fillRect(760, 380, 520, 420);
}

// Center a row of cards of width w inside the table.
function rowLayout(count, w, gap) {
  const total = count * w + Math.max(0, count - 1) * gap;
  const startX = (TABLE_WIDTH - total) / 2;
  const rects = [];
  for (let i = 0; i < count; i += 1) rects.push({ x: startX + i * (w + gap), w });
  return rects;
}

export function layoutFor(game) {
  const hand = rowLayout(game.player.hand.length, 150, 14).map((r) => ({ ...r, y: 596, h: 188 }));
  const field = rowLayout(game.player.field.length, 132, 12).map((r) => ({ ...r, y: 410, h: 176 }));
  const enemyField = rowLayout(game.enemy.field.length, 132, 12).map((r) => ({ ...r, y: 170, h: 176 }));
  // Enemy hand: face-down backs, right-aligned under the player hull panel.
  const backW = 60;
  const backGap = 8;
  const backTotal = game.enemy.hand.length * backW + Math.max(0, game.enemy.hand.length - 1) * backGap;
  const enemyHand = [];
  for (let i = 0; i < game.enemy.hand.length; i += 1) {
    enemyHand.push({ x: 1264 - backTotal + i * (backW + backGap), y: 76, w: backW, h: 82 });
  }
  return {
    hand,
    field,
    enemyField,
    enemyHand,
    enemyHull: { x: 16, y: 10, w: 300, h: 52 },
    playerHull: { x: 964, y: 10, w: 300, h: 52 },
    endTurn: { x: 1064, y: 356, w: 200, h: 44 },
  };
}

function drawTable(ctx, game, opts = {}) {
  const layout = layoutFor(game);
  drawBackground(ctx);

  // Hull panels: both totals always visible at the top.
  drawHullPanel(ctx, layout.enemyHull.x, layout.enemyHull.y, layout.enemyHull.w, layout.enemyHull.h,
    'ENEMY FLEET', game.enemy.hull, 30, COLORS.enemy);
  drawHullPanel(ctx, layout.playerHull.x, layout.playerHull.y, layout.playerHull.w, layout.playerHull.h,
    'YOUR FLEET', game.player.hull, 30, COLORS.player);

  // Turn / energy / kills score line, top centre.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText(
    `TURN ${game.turn}  ·  ENERGY ${game.player.energy}/${game.player.maxEnergy}  ·  DESTROYED ${game.player.kills}`,
    TABLE_WIDTH / 2, 36,
  );

  // Enemy hand: face-down backs.
  ctx.fillStyle = COLORS.dim;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'right';
  const handWord = game.enemy.hand.length === 1 ? 'CARD' : 'CARDS';
  ctx.fillText(`ENEMY HAND · ${game.enemy.hand.length} ${handWord}`, 1264, 70);
  layout.enemyHand.forEach((r) => drawCardBack(ctx, r.x, r.y, r.w, r.h));

  // Enemy field.
  ctx.fillStyle = COLORS.dim;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ENEMY FLEET', 16, 160);
  layout.enemyField.forEach((r, i) => {
    const ship = game.enemy.field[i];
    const targeted = game.selectedShip >= 0;
    drawCardFace(ctx, ship, r.x, r.y, r.w, r.h, { dim: !ship.canAttack, ready: false, selected: targeted });
  });

  // Centre strip: the message, and the End Turn button. A quiet table
  // (behind a win/loss overlay) hides the message and the hint line so the
  // end screen's own text never collides with them.
  if (!opts.quiet) {
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.message, TABLE_WIDTH / 2, 378, 900);
  }
  const end = layout.endTurn;
  roundRect(ctx, end.x, end.y, end.w, end.h, 8);
  ctx.fillStyle = game.selectedShip >= 0 ? '#3f6212' : '#1d4ed8';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('END TURN  [E]', end.x + end.w / 2, end.y + end.h / 2 + 1);

  // Player field.
  ctx.fillStyle = COLORS.dim;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('YOUR FLEET — click a READY ship, then an enemy ship or hull', 16, 400);
  layout.field.forEach((r, i) => {
    const ship = game.player.field[i];
    drawCardFace(ctx, ship, r.x, r.y, r.w, r.h, {
      dim: !ship.canAttack,
      ready: ship.canAttack,
      selected: game.selectedShip === i,
    });
  });

  // Player hand.
  layout.hand.forEach((r, i) => {
    const card = game.player.hand[i];
    drawCardFace(ctx, card, r.x, r.y, r.w, r.h, {
      selected: game.selectedCard === i,
      dim: game.player.energy < card.cost,
    });
  });
  ctx.fillStyle = COLORS.dim;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  if (!opts.quiet) {
    ctx.fillText('Keys 1–7 select a card · Enter deploys · click a ship to attack · E ends turn · R restarts', TABLE_WIDTH / 2, 789);
  }
}

function drawTitle(ctx, game) {
  drawBackground(ctx);
  // Three sample ships fanned behind the title.
  const samples = [
    { id: 'dread', name: 'Dreadnought', faction: 'nomad', atk: 8, shd: 8, maxShd: 8, cost: 6, keyword: null, text: 'The fleet-killer itself.' },
    { id: 'reaper', name: 'Reaper Fang', faction: 'reaper', atk: 7, shd: 4, maxShd: 4, cost: 5, keyword: null, text: 'A fang of the dark fleet.' },
    { id: 'bastion', name: 'Bastion', faction: 'aegis', atk: 3, shd: 8, maxShd: 8, cost: 4, keyword: null, text: 'Holds the line, always.' },
  ];
  ctx.save();
  ctx.globalAlpha = 0.9;
  drawCardFace(ctx, samples[0], 180, 430, 150, 208);
  drawCardFace(ctx, samples[1], 565, 450, 150, 208);
  drawCardFace(ctx, samples[2], 950, 430, 150, 208);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 84px sans-serif';
  ctx.fillText('VOID FLEET', TABLE_WIDTH / 2, 170);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('A battle of starship cards', TABLE_WIDTH / 2, 235);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '17px sans-serif';
  ctx.fillText('Command your fleet. Deploy ships, outgun the enemy admiral,', TABLE_WIDTH / 2, 285);
  ctx.fillText('and burn their hull to zero before yours falls.', TABLE_WIDTH / 2, 310);

  ctx.fillStyle = COLORS.energy;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('CLICK OR PRESS ENTER TO LAUNCH', TABLE_WIDTH / 2, 385);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '15px sans-serif';
  ctx.fillText('Mouse + keyboard · 1–7 select a card · Enter deploys · click a ship to attack · E ends turn · R restarts', TABLE_WIDTH / 2, 700);
  ctx.fillText('No network. No account. Just you, the void, and the enemy fleet.', TABLE_WIDTH / 2, 726);
}

function drawEndScreen(ctx, game, won) {
  drawTable(ctx, game, { quiet: true });
  ctx.fillStyle = won ? 'rgba(4,26,12,0.82)' : 'rgba(32,6,10,0.82)';
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = won ? COLORS.player : COLORS.enemy;
  ctx.font = 'bold 96px sans-serif';
  ctx.fillText(won ? 'VICTORY' : 'DEFEAT', TABLE_WIDTH / 2, 300);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(
    won ? 'Enemy flagship destroyed — the void is yours!' : 'Your flagship is gone — the fleet is lost.',
    TABLE_WIDTH / 2, 390,
  );
  ctx.fillStyle = COLORS.dim;
  ctx.font = '20px sans-serif';
  ctx.fillText(
    `Turns: ${game.turn}   ·   Ships destroyed: ${game.player.kills}   ·   Your hull: ${Math.max(0, game.player.hull)}   ·   Enemy hull: ${Math.max(0, game.enemy.hull)}`,
    TABLE_WIDTH / 2, 440,
  );
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('PRESS R TO PLAY AGAIN', TABLE_WIDTH / 2, 510);
}

export function drawGame(ctx, game) {
  ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  if (game.phase === 'title') drawTitle(ctx, game);
  else if (game.phase === 'win') drawEndScreen(ctx, game, true);
  else if (game.phase === 'loss') drawEndScreen(ctx, game, false);
  else drawTable(ctx, game);
}
