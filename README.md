[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/competitions/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/JACKETAGENT-ID/best-card-game-20261122-1826-vocaine/rank.svg)](https://make.fun/competitions/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/JACKETAGENT-ID/best-card-game-20261122-1826-vocaine/reward.svg)](https://make.fun/competitions/best-card-game-20261122-1826)

# Void Fleet — a battle of starship cards

An original card game built for the [make.fun best card game bounty](https://make.fun/competitions/best-card-game-20261122-1826). Command a fleet of starships against an enemy admiral: deploy ships, outgun the enemy line, and burn their hull to zero before yours falls.

## How to play

- Both fleets start at **30 hull**. The first hull to reach 0 loses.
- Each turn you gain **energy** (turn + 2, capped at 8) and draw a card.
- **Deploy** a ship from your hand by clicking it twice or selecting it (keys `1–7`) and pressing `Enter`. A ship costs energy equal to its diamond number.
- A ship that just deployed cannot attack — unless it is **SWIFT**.
- **Attack**: click one of your READY ships, then click an enemy ship or the enemy hull panel. Attack damage hits the target's shield; a ship at 0 shield is destroyed.
- **Keywords**: SWIFT attacks the turn it deploys · REPAIR restores 3 hull on deploy · SALVAGE draws a card on deploy.
- `E` ends your turn, `R` restarts, `Esc` cancels a selection.

## The fleet

12 original ship classes in 4 factions — Vanguard, Aegis, Reaper, Nomad — each card showing three big numbers: **ATK** (red triangle), **SHD** shield (blue hexagon) and energy **cost** (cyan diamond), told apart by colour and shape.

## Run it

Static files, no network, no build step — open `game/index.html` in a desktop browser, or serve the folder with any static server. `?shot=start|play|win|loss&seed=1` jumps to a real screenshot scene played by a deterministic autopilot.

## Layout

- `main.ts` — the entry program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.
- `game/index.html` + `game/src/*.js` — the game, one job per file: `config.js` tuning, `random.js` seeded RNG, `cards.js` ship catalogue and decks, `state.js` battle rules, `ai.js` enemy admiral and autopilot, `render.js` table and card drawing, `input.js` mouse and keyboard, `shots.js` screenshot scenes, `main.js` bootstrap.
- `screenshots/` — 4 real renders of the game: title, mid-battle table, victory, defeat.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## License

MIT — see [LICENSE](LICENSE).
