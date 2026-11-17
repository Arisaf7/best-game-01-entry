// VOIDKEEPER — screenshot states for the entry's images.
// A ?shot= name in the page URL puts the game into a real state and plays it
// forward with a fixed seed and fixed steps, so the captured frame is a true
// render of the game's own code: the title, a mid-fight frame with its HUD,
// a late-wave brawl, and the game-over screen.

import { VIEW } from './config.js';

const FIXED_DT = 1 / 60;

function stepWorld(world, input, audio, ticks) {
  for (let i = 0; i < ticks; i += 1) {
    world.update(FIXED_DT, input, audio);
  }
}

function openMenu(world) {
  world.state = 'menu';
}

function openPlay(world, input, audio, wave) {
  world.autopilot = true;
  world.start();
  // Step until the target wave is busy: several enemies alive and the wave
  // banner gone, so the frame shows play in progress. If the autopilot dies
  // on the way, restart and try again.
  let guard = 0;
  while (guard < 1800) {
    stepWorld(world, input, audio, 30);
    guard += 1;
    if (world.state === 'gameover') {
      world.start();
      continue;
    }
    if (world.wave >= wave && world.enemies.length >= 6 && world.bannerTimer <= 0) break;
  }
  stepWorld(world, input, audio, 90);
}

function openEnd(world, input, audio) {
  world.autopilot = true;
  world.start();
  let guard = 0;
  while (world.wave < 4 && guard < 900) {
    stepWorld(world, input, audio, 30);
    guard += 1;
  }
  // Stage a hard-fought run's totals, then let the game end for real.
  world.score = 12450;
  world.kills = 87;
  world.wave = 6;
  world.shotsFired = 250;
  world.shotsHit = 170;
  world.lives = 0;
  world.endGame();
  stepWorld(world, input, audio, 30);
}

export function applyShot(world, input, audio, name) {
  if (name === 'start') {
    openMenu(world);
    return true;
  }
  if (name === 'play') {
    openPlay(world, input, audio, 2);
    return true;
  }
  if (name === 'action') {
    openPlay(world, input, audio, 5);
    world.player.spreadTimer = 8;
    world.player.rapidTimer = 6;
    world.combo = 18;
    world.comboTimer = 2.2;
    world.multiplier = 5;
    stepWorld(world, input, audio, 30);
    return true;
  }
  if (name === 'end') {
    openEnd(world, input, audio);
    return true;
  }
  return false;
}

export function shotList() {
  return [
    { name: '1-start.jpg', query: '?shot=start&seed=1' },
    { name: '2-play.jpg', query: '?shot=play&seed=1' },
    { name: '3-action.jpg', query: '?shot=action&seed=1' },
    { name: '4-end.jpg', query: '?shot=end&seed=1' },
  ];
}

export { VIEW };
