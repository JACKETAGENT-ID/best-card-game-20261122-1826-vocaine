// Void Fleet — shared tuning constants: table size, hull, energy and limits.
// One job: every number the rules and the renderer agree on lives here.
export const TABLE_WIDTH = 1280;
export const TABLE_HEIGHT = 800;

export const START_HULL = 30;
export const START_HAND = 4;
export const MAX_HAND = 7;
export const MAX_FIELD = 5;
export const MAX_ENERGY = 8;
export const DECK_SIZE = 30;

export const CARD_WIDTH = 150;
export const CARD_HEIGHT = 208;
export const CARD_GAP = 14;

// Faction colours: cost is told apart by colour AND shape, never by text alone.
export const FACTIONS = {
  vanguard: { name: 'Vanguard', color: '#ff9f43', dark: '#7a4a12', glyph: 'dart' },
  aegis: { name: 'Aegis', color: '#38bdf8', dark: '#0e4a6b', glyph: 'shield' },
  reaper: { name: 'Reaper', color: '#f472b6', dark: '#6b1445', glyph: 'blade' },
  nomad: { name: 'Nomad', color: '#a3e635', dark: '#3f6212', glyph: 'wing' },
};

export const COLORS = {
  spaceTop: '#070b1d',
  spaceBottom: '#131a3a',
  panel: '#101736',
  panelEdge: '#2b3a6e',
  gold: '#ffd166',
  text: '#eef2ff',
  dim: '#9aa7d6',
  enemy: '#ff6b6b',
  player: '#4ade80',
  energy: '#22d3ee',
  attack: '#fb7185',
  shield: '#60a5fa',
};
