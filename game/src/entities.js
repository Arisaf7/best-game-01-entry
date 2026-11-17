// VOIDKEEPER — the things that live in the arena.
// Factories build plain objects; the update functions below move them. The
// world owns the lists, this file owns what each kind of thing does.

import { ENEMIES, PLAYER, POWERUPS, VIEW } from './config.js';

export function createPlayer(x, y) {
  return {
    kind: 'player',
    x,
    y,
    vx: 0,
    vy: 0,
    radius: PLAYER.radius,
    angle: -Math.PI / 2,
    fireTimer: 0,
    invulnerable: 0,
    spreadTimer: 0,
    rapidTimer: 0,
    shieldTimer: 0,
    novas: 1,
    alive: true,
  };
}

export function createBullet(x, y, angle, speed, damage, friendly) {
  return {
    kind: 'bullet',
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: friendly ? PLAYER.bulletRadius : 7,
    damage,
    friendly,
    life: 1.6,
  };
}

export function createEnemy(type, x, y, wave, random) {
  const spec = ENEMIES[type];
  const speedScale = 1 + (wave - 1) * 0.06;
  const hpBonus = type === 'mini' ? 0 : Math.floor((wave - 1) / 4);
  return {
    kind: 'enemy',
    type,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: spec.radius,
    hp: spec.hp + hpBonus,
    maxHp: spec.hp + hpBonus,
    speed: spec.speed * speedScale * random.range(0.9, 1.1),
    score: spec.score,
    color: spec.color,
    angle: random.angle(),
    spin: random.range(-1.6, 1.6),
    fireTimer: random.range(1.2, 2.4),
    dashTimer: random.range(1.5, 3),
    dashing: 0,
    dashAngle: 0,
    flash: 0,
    wobble: random.range(0, Math.PI * 2),
  };
}

export function createParticle(x, y, color, count, random, speed = 260) {
  const particles = [];
  for (let i = 0; i < count; i += 1) {
    const angle = random.angle();
    const velocity = random.range(speed * 0.25, speed);
    particles.push({
      kind: 'particle',
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      radius: random.range(1.5, 4),
      color,
      life: random.range(0.35, 0.8),
      maxLife: 0.8,
    });
  }
  return particles;
}

export function createPowerUp(x, y, type, random) {
  return {
    kind: 'powerup',
    type,
    x,
    y,
    vx: random.range(-20, 20),
    vy: POWERUPS.fallSpeed,
    radius: POWERUPS.radius,
    life: 12,
    bob: random.range(0, Math.PI * 2),
  };
}

export function createFloater(x, y, text, color) {
  return { kind: 'floater', x, y, text, color, life: 0.9, maxLife: 0.9 };
}

export function updatePlayer(player, move, aim, firing, dt) {
  player.vx += move.x * PLAYER.accel * dt;
  player.vy += move.y * PLAYER.accel * dt;
  player.vx *= Math.pow(PLAYER.drag, dt * 60);
  player.vy *= Math.pow(PLAYER.drag, dt * 60);
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  const margin = player.radius + 4;
  if (player.x < margin) { player.x = margin; player.vx = Math.abs(player.vx) * 0.4; }
  if (player.x > VIEW.width - margin) { player.x = VIEW.width - margin; player.vx = -Math.abs(player.vx) * 0.4; }
  if (player.y < margin) { player.y = margin; player.vy = Math.abs(player.vy) * 0.4; }
  if (player.y > VIEW.height - margin) { player.y = VIEW.height - margin; player.vy = -Math.abs(player.vy) * 0.4; }
  player.angle = Math.atan2(aim.y - player.y, aim.x - player.x);
  player.fireTimer -= dt;
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.spreadTimer = Math.max(0, player.spreadTimer - dt);
  player.rapidTimer = Math.max(0, player.rapidTimer - dt);
  player.shieldTimer = Math.max(0, player.shieldTimer - dt);
  return firing && player.fireTimer <= 0;
}

export function playerFireInterval(player) {
  const base = PLAYER.fireInterval;
  return player.rapidTimer > 0 ? base / 2.2 : base;
}

export function firePlayerBullets(player, bullets) {
  const angles = player.spreadTimer > 0 ? [-0.22, 0, 0.22] : [0];
  for (const offset of angles) {
    const angle = player.angle + offset;
    bullets.push(createBullet(
      player.x + Math.cos(angle) * (player.radius + 8),
      player.y + Math.sin(angle) * (player.radius + 8),
      angle,
      PLAYER.bulletSpeed,
      PLAYER.bulletDamage,
      true,
    ));
  }
  player.fireTimer = playerFireInterval(player);
}

export function updateBullet(bullet, dt) {
  bullet.x += bullet.vx * dt;
  bullet.y += bullet.vy * dt;
  bullet.life -= dt;
  return bullet.life > 0
    && bullet.x > -20 && bullet.x < VIEW.width + 20
    && bullet.y > -20 && bullet.y < VIEW.height + 20;
}

export function updateEnemy(enemy, player, dt, time) {
  enemy.flash = Math.max(0, enemy.flash - dt);
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const distance = Math.hypot(dx, dy) || 1;
  const nx = dx / distance;
  const ny = dy / distance;
  enemy.angle += enemy.spin * dt;
  enemy.wobble += dt * 2;

  if (enemy.type === 'shard' || enemy.type === 'mini') {
    const wobble = Math.sin(enemy.wobble) * 0.35;
    enemy.vx = (nx + -ny * wobble) * enemy.speed;
    enemy.vy = (ny + nx * wobble) * enemy.speed;
  } else if (enemy.type === 'hex') {
    const want = 260;
    const toward = distance > want + 40 ? 1 : distance < want - 40 ? -0.7 : 0;
    enemy.vx = nx * enemy.speed * toward + -ny * 40;
    enemy.vy = ny * enemy.speed * toward + nx * 40;
    enemy.fireTimer -= dt;
  } else if (enemy.type === 'splitter') {
    enemy.vx = nx * enemy.speed;
    enemy.vy = ny * enemy.speed;
  } else if (enemy.type === 'dasher') {
    enemy.dashTimer -= dt;
    if (enemy.dashing > 0) {
      enemy.dashing -= dt;
      enemy.vx = Math.cos(enemy.dashAngle) * enemy.speed * 4.2;
      enemy.vy = Math.sin(enemy.dashAngle) * enemy.speed * 4.2;
    } else if (enemy.dashTimer <= 0) {
      enemy.dashing = 0.32;
      enemy.dashAngle = Math.atan2(dy, dx);
      enemy.dashTimer = 2.6;
    } else {
      enemy.vx = nx * enemy.speed * 0.55;
      enemy.vy = ny * enemy.speed * 0.55;
    }
  }
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
  if (enemy.x < enemy.radius) enemy.x = enemy.radius;
  if (enemy.x > VIEW.width - enemy.radius) enemy.x = VIEW.width - enemy.radius;
  if (enemy.y < enemy.radius) enemy.y = enemy.radius;
  if (enemy.y > VIEW.height - enemy.radius) enemy.y = VIEW.height - enemy.radius;
  return enemy;
}

export function updateParticle(particle, dt) {
  particle.x += particle.vx * dt;
  particle.y += particle.vy * dt;
  particle.vx *= Math.pow(0.92, dt * 60);
  particle.vy *= Math.pow(0.92, dt * 60);
  particle.life -= dt;
  return particle.life > 0;
}

export function updatePowerUp(powerUp, player, dt) {
  powerUp.bob += dt * 3;
  const dx = player.x - powerUp.x;
  const dy = player.y - powerUp.y;
  const distance = Math.hypot(dx, dy);
  if (distance < POWERUPS.magnetRadius && distance > 1) {
    const pull = 260 * (1 - distance / POWERUPS.magnetRadius);
    powerUp.vx += (dx / distance) * pull * dt;
    powerUp.vy += (dy / distance) * pull * dt;
  }
  powerUp.x += powerUp.vx * dt;
  powerUp.y += powerUp.vy * dt + Math.sin(powerUp.bob) * 8 * dt;
  powerUp.life -= dt;
  return powerUp.life > 0 && powerUp.y < VIEW.height + 30;
}

export function updateFloater(floater, dt) {
  floater.y -= 46 * dt;
  floater.life -= dt;
  return floater.life > 0;
}
