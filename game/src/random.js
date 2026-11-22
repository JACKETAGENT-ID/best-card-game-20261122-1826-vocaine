// Void Fleet — deterministic randomness: one seeded generator drives every
// shuffle and tie-break, so the same seed always replays the same battle.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle driven by the seeded generator (in place, returns deck).
export function shuffleDeck(deck, rng) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}

// Deterministic pick: the first element after a seeded roll, for AI tie-breaks.
export function pickRandom(list, rng) {
  if (list.length === 0) return null;
  return list[Math.floor(rng() * list.length)];
}
