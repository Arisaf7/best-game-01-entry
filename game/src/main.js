// VOIDKEEPER — boot and the frame loop.
// Sizes the canvas to the window with letterboxing, runs the world on a
// clamped timestep, handles the menu keys (Enter to start, P to pause, M to
// mute, R to restart, E to fire a nova), and renders every frame. A
// ?shot=start|play|action|end URL instead plays a fixed scene for a
// screenshot and then holds it still.

import { VIEW } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { drawWorld } from './render.js';
import { applyShot } from './shots.js';
import { createWorld } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? Math.floor(seedParam) : 20261117;

const world = createWorld(seed);
const input = createInput(canvas);
const audio = createAudio();
input.attach();

let viewScale = 1;
let viewOffsetX = 0;
let viewOffsetY = 0;

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  viewScale = Math.min(width / VIEW.width, height / VIEW.height);
  viewOffsetX = (width - VIEW.width * viewScale) / 2;
  viewOffsetY = (height - VIEW.height * viewScale) / 2;
  input.setView(viewScale, viewOffsetX, viewOffsetY);
}

window.addEventListener('resize', resize);
resize();

function describeState() {
  if (!statusLine) return;
  if (world.state === 'menu') statusLine.textContent = 'Voidkeeper menu. Press Enter to start.';
  else if (world.state === 'playing') statusLine.textContent = `Wave ${world.wave}, score ${world.score}, ${world.lives} lives.`;
  else if (world.state === 'paused') statusLine.textContent = 'Paused. Press P to resume.';
  else statusLine.textContent = `Game over. Score ${world.score}. Press R to play again.`;
}

function handleMenuKeys() {
  if (world.state === 'menu' && (input.wasPressed('enter') || input.mousePressed)) {
    audio.ensure();
    audio.click();
    world.start();
  } else if (world.state === 'gameover' && (input.wasPressed('r') || input.wasPressed('enter') || input.mousePressed)) {
    audio.ensure();
    audio.click();
    world.start();
  } else if (world.state === 'playing' && input.wasPressed('p')) {
    world.state = 'paused';
    audio.click();
  } else if (world.state === 'paused' && (input.wasPressed('p') || input.mousePressed)) {
    world.state = 'playing';
    audio.click();
  }
  if (input.wasPressed('m')) {
    audio.ensure();
    world.muted = !world.muted;
    audio.setMuted(world.muted);
  }
}

let lastTime = performance.now();
let lastState = world.state;

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  handleMenuKeys();
  if (world.state !== lastState) {
    lastState = world.state;
    describeState();
  }
  if (world.state === 'playing' || world.state === 'menu') {
    world.update(dt, input, audio);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#070312';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(viewScale, 0, 0, viewScale, viewOffsetX, viewOffsetY);
  drawWorld(ctx, world);
  input.endFrame();
  requestAnimationFrame(frame);
}

const shotName = params.get('shot');
if (shotName) {
  world.autopilot = true;
  if (applyShot(world, input, null, shotName)) {
    resize();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#070312';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(viewScale, 0, 0, viewScale, viewOffsetX, viewOffsetY);
    drawWorld(ctx, world);
    document.title = 'shot-ready';
  }
} else {
  describeState();
  requestAnimationFrame(frame);
}
