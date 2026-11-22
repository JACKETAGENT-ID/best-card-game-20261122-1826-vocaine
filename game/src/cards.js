// Void Fleet — the ship catalogue and deck builder.
// Twelve original ship classes in four factions. Every card shows three big
// numbers: ATK (red triangle), SHD shield (blue hexagon) and energy cost
// (cyan diamond). Three classes carry one simple keyword each:
// SWIFT attacks the turn it is deployed, REPAIR restores hull on deploy,
// SALVAGE draws a card on deploy.
import { DECK_SIZE } from './config.js';

export const SHIP_CATALOG = [
  { id: 'dart', name: 'Scout Dart', faction: 'vanguard', atk: 2, shd: 1, cost: 1, keyword: 'SWIFT', text: 'Swift: attacks at once.' },
  { id: 'lancer', name: 'Lancer', faction: 'vanguard', atk: 3, shd: 2, cost: 2, keyword: null, text: 'Fast strike frigate.' },
  { id: 'raider', name: 'Void Raider', faction: 'vanguard', atk: 5, shd: 3, cost: 3, keyword: null, text: 'Raids the enemy line.' },
  { id: 'reaper', name: 'Reaper Fang', faction: 'reaper', atk: 7, shd: 4, cost: 5, keyword: null, text: 'A fang of the dark fleet.' },
  { id: 'blade', name: 'Blade Wing', faction: 'reaper', atk: 4, shd: 2, cost: 2, keyword: 'SWIFT', text: 'Swift: attacks at once.' },
  { id: 'mantis', name: 'Mantis Claw', faction: 'reaper', atk: 6, shd: 5, cost: 4, keyword: null, text: 'Cuts shields to ribbons.' },
  { id: 'bulwark', name: 'Bulwark', faction: 'aegis', atk: 2, shd: 6, cost: 3, keyword: null, text: 'A wall of plated hull.' },
  { id: 'bastion', name: 'Bastion', faction: 'aegis', atk: 3, shd: 8, cost: 4, keyword: null, text: 'Holds the line, always.' },
  { id: 'tender', name: 'Repair Tender', faction: 'aegis', atk: 1, shd: 3, cost: 2, keyword: 'REPAIR', text: 'Repair: restore 3 hull.' },
  { id: 'carrier', name: 'Hive Carrier', faction: 'nomad', atk: 3, shd: 7, cost: 5, keyword: null, text: 'Launches drone swarms.' },
  { id: 'salvager', name: 'Salvager', faction: 'nomad', atk: 2, shd: 2, cost: 2, keyword: 'SALVAGE', text: 'Salvage: draw a card.' },
  { id: 'dread', name: 'Dreadnought', faction: 'nomad', atk: 8, shd: 8, cost: 6, keyword: null, text: 'The fleet-killer itself.' },
];

const CATALOG_BY_ID = new Map(SHIP_CATALOG.map((ship) => [ship.id, ship]));

// One fresh card instance: a unique uid so two copies of one class stay distinct.
let nextUid = 1;
export function makeCard(shipId) {
  const base = CATALOG_BY_ID.get(shipId);
  return {
    uid: nextUid,
    id: base.id,
    name: base.name,
    faction: base.faction,
    atk: base.atk,
    shd: base.shd,
    maxShd: base.shd,
    cost: base.cost,
    keyword: base.keyword,
    text: base.text,
    canAttack: false,
  };
}

// A 30-card deck: three copies of the light ships, two of the heavy ones.
export function buildDeck(rng) {
  const counts = {
    dart: 3, lancer: 3, raider: 3, reaper: 2, blade: 3, mantis: 2,
    bulwark: 3, bastion: 2, tender: 3, carrier: 2, salvager: 3, dread: 1,
  };
  const deck = [];
  for (const ship of SHIP_CATALOG) {
    for (let i = 0; i < (counts[ship.id] || 0); i += 1) deck.push(makeCard(ship.id));
  }
  while (deck.length < DECK_SIZE) deck.push(makeCard('lancer'));
  // Shuffle with the seeded generator so a seed replays the same draw order.
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}

export function drawCard(side) {
  if (side.deck.length === 0 || side.hand.length >= 7) return null;
  const card = side.deck.pop();
  side.hand.push(card);
  return card;
}
