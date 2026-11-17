# VOIDKEEPER — Neon Arena Survival

[![make.fun](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/Arisaf7/best-game-01-entry/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/Arisaf7/best-game-01-entry/reward.svg)](https://make.fun/bounty/best-game-01)

A complete, original neon arena survival shooter built for
[make.fun's best-game-01 bounty](https://make.fun/bounty/best-game-01) ($1,000).
Pilot the last Keeper ship in a violet void: blast waves of void shards, chain
kills into combos, grab power-ups, and survive as long as you can.

## How to play

- **WASD / Arrow keys** — move
- **Mouse** — aim
- **Hold click / Space** — fire
- **E or right-click** — nova bomb (clears the screen)
- **P** — pause · **M** — mute · **R** — restart after game over

Chain kills within 2.5 seconds to raise your combo multiplier (up to x8).
Enemies drop power-ups: **Spread Shot**, **Rapid Fire**, **Shield**, and
**Nova**. Each wave brings more, faster, tougher enemies — four kinds, each
with its own behaviour: chasing shards, shooting hexes, splitting squares,
and dashing triangles.

## Play it

Serve `game/` with any static server and open `index.html` in a desktop
browser — no build step, no network requests, all sounds synthesized with
WebAudio:

```sh
node serve.ts   # then open http://localhost:8080
```

## Layout

- `game/index.html` — the page, one canvas
- `game/src/config.js` — tuning and palette
- `game/src/random.js` — seeded RNG
- `game/src/audio.js` — synthesized sound effects and music
- `game/src/input.js` — keyboard and mouse
- `game/src/entities.js` — player, enemies, bullets, particles, power-ups
- `game/src/world.js` — state, waves, collisions, scoring
- `game/src/render.js` — all canvas drawing, HUD, menus
- `game/src/shots.js` — deterministic screenshot states
- `game/src/main.js` — boot and frame loop
- `main.ts` — the make.fun entrypoint (copies `game/` + `screenshots/` and
  writes `dossier.json`)
- `screenshots/` — 1-start, 2-play, 3-action, 4-end, real renders of the game
