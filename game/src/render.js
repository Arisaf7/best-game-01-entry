// VOIDKEEPER — everything the player sees, drawn on one canvas.
// The background is a violet void with a drifting starfield and grid; the
// player and enemies are neon vector shapes with glow; the HUD, title and
// game-over screens are drawn here too, so every screenshot is one render.

import { PALETTE, POWERUPS, VIEW } from './config.js';

function glow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function noGlow(ctx) {
  ctx.shadowBlur = 0;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawPolygon(ctx, x, y, radius, sides, rotation) {
  ctx.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + (i / sides) * Math.PI * 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawShip(ctx, x, y, angle, radius, color, core) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  glow(ctx, color, 18);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(radius + 6, 0);
  ctx.lineTo(-radius * 0.7, radius * 0.75);
  ctx.lineTo(-radius * 0.35, 0);
  ctx.lineTo(-radius * 0.7, -radius * 0.75);
  ctx.closePath();
  ctx.fill();
  noGlow(ctx);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.moveTo(radius * 0.45, 0);
  ctx.lineTo(-radius * 0.3, radius * 0.32);
  ctx.lineTo(-radius * 0.12, 0);
  ctx.lineTo(-radius * 0.3, -radius * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEnemyShape(ctx, enemy) {
  const { x, y, radius, type, color, angle } = enemy;
  glow(ctx, color, 16);
  ctx.fillStyle = enemy.flash > 0 ? '#ffffff' : color;
  if (type === 'shard' || type === 'mini') {
    drawPolygon(ctx, x, y, radius, 4, angle);
    ctx.fill();
    noGlow(ctx);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    drawPolygon(ctx, x, y, radius * 0.55, 4, angle + 0.4);
    ctx.stroke();
  } else if (type === 'hex') {
    drawPolygon(ctx, x, y, radius, 6, angle);
    ctx.fill();
    noGlow(ctx);
    ctx.fillStyle = 'rgba(7,3,18,0.85)';
    drawPolygon(ctx, x, y, radius * 0.45, 6, angle);
    ctx.fill();
    ctx.fillStyle = '#ffd9a0';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'splitter') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * 0.5);
    ctx.fillRect(-radius * 0.8, -radius * 0.8, radius * 1.6, radius * 1.6);
    ctx.restore();
    noGlow(ctx);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.4, y);
    ctx.lineTo(x + radius * 0.4, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - radius * 0.4);
    ctx.lineTo(x, y + radius * 0.4);
    ctx.stroke();
  } else if (type === 'dasher') {
    const telegraph = enemy.dashing > 0;
    drawPolygon(ctx, x, y, radius, 3, enemy.dashAngle ?? angle);
    ctx.fill();
    noGlow(ctx);
    if (telegraph) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      drawPolygon(ctx, x, y, radius + 6, 3, enemy.dashAngle ?? angle);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(7,3,18,0.8)';
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPowerUpShape(ctx, powerUp) {
  const { x, y, radius, type } = powerUp;
  const color = PALETTE[type];
  const bobY = y + Math.sin(powerUp.bob) * 3;
  glow(ctx, color, 16);
  ctx.fillStyle = 'rgba(7,3,18,0.9)';
  ctx.beginPath();
  ctx.arc(x, bobY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  noGlow(ctx);
  ctx.fillStyle = color;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const letter = { spread: 'S', rapid: 'R', shield: 'H', nova: 'N' }[type];
  ctx.fillText(letter, x, bobY + 1);
}

function drawBackground(ctx, world) {
  const gradient = ctx.createRadialGradient(
    VIEW.width / 2, VIEW.height / 2, 80,
    VIEW.width / 2, VIEW.height / 2, 900,
  );
  gradient.addColorStop(0, PALETTE.backgroundEdge);
  gradient.addColorStop(1, PALETTE.background);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  ctx.strokeStyle = PALETTE.grid;
  ctx.lineWidth = 1;
  const cell = 64;
  const drift = (world.time * 6) % cell;
  ctx.beginPath();
  for (let x = -cell + drift; x <= VIEW.width; x += cell) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, VIEW.height);
  }
  for (let y = -cell + drift; y <= VIEW.height; y += cell) {
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW.width, y);
  }
  ctx.stroke();

  for (const star of world.stars) {
    const alpha = 0.35 + 0.35 * Math.sin(world.time * 1.5 + star.twinkle);
    ctx.fillStyle = `rgba(207, 198, 255, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = PALETTE.gridBright;
  ctx.lineWidth = 2;
  roundRect(ctx, 10, 10, VIEW.width - 20, VIEW.height - 20, 18);
  ctx.stroke();
}

function drawHud(ctx, world) {
  ctx.save();
  ctx.fillStyle = PALETTE.hudPanel;
  ctx.strokeStyle = PALETTE.hudBorder;
  ctx.lineWidth = 1;
  roundRect(ctx, 22, 20, 300, 74, 12);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('SCORE', 38, 44);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 30px system-ui, sans-serif';
  ctx.fillText(String(world.score).padStart(6, '0'), 38, 76);

  if (world.multiplier > 1) {
    const width = 120 * (world.comboTimer / 2.5);
    ctx.fillStyle = 'rgba(255, 215, 94, 0.25)';
    roundRect(ctx, 38, 84, 120, 6, 3);
    ctx.fill();
    ctx.fillStyle = PALETTE.combo;
    roundRect(ctx, 38, 84, Math.max(0, width), 6, 3);
    ctx.fill();
    ctx.font = '800 15px system-ui, sans-serif';
    ctx.fillText(`COMBO x${world.multiplier}`, 168, 92);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('WAVE', VIEW.width / 2, 44);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 30px system-ui, sans-serif';
  ctx.fillText(String(world.wave), VIEW.width / 2, 76);

  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('LIVES', VIEW.width - 38, 44);
  for (let i = 0; i < 3; i += 1) {
    const x = VIEW.width - 58 - i * 34;
    const y = 66;
    ctx.save();
    ctx.globalAlpha = i < world.lives ? 1 : 0.22;
    drawShip(ctx, x, y, -Math.PI / 2, 11, PALETTE.player, PALETTE.playerCore);
    ctx.restore();
  }

  const timers = [];
  if (world.player.spreadTimer > 0) timers.push(['SPREAD', world.player.spreadTimer / 12, PALETTE.spread]);
  if (world.player.rapidTimer > 0) timers.push(['RAPID', world.player.rapidTimer / 10, PALETTE.rapid]);
  if (world.player.shieldTimer > 0) timers.push(['SHIELD', world.player.shieldTimer / 20, PALETTE.shield]);
  timers.forEach(([label, fraction, color], i) => {
    const y = VIEW.height - 58 - i * 26;
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillText(label, 38, y + 4);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, 108, y - 6, 130, 8, 4);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, 108, y - 6, Math.max(0, 130 * fraction), 8, 4);
    ctx.fill();
  });

  if (world.player.novas > 0) {
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillText(`NOVA x${world.player.novas}  [E]`, VIEW.width - 38, VIEW.height - 36);
  }

  if (world.bannerTimer > 0) {
    const alpha = Math.min(1, world.bannerTimer);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.font = '800 54px system-ui, sans-serif';
    glow(ctx, PALETTE.player, 26);
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(world.banner, VIEW.width / 2, VIEW.height / 2 - 40);
    noGlow(ctx);
    ctx.restore();
  }

  if (world.state === 'playing' && world.wave === 1 && world.time < 7) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - (world.time - 5) / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillText('WASD move  ·  MOUSE aim  ·  HOLD CLICK fire  ·  E nova  ·  P pause', VIEW.width / 2, VIEW.height - 24);
    ctx.restore();
  }
}

function drawMenu(ctx, world) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 92px system-ui, sans-serif';
  glow(ctx, PALETTE.player, 34);
  ctx.fillText('VOIDKEEPER', VIEW.width / 2, 250);
  noGlow(ctx);
  ctx.fillStyle = PALETTE.combo;
  ctx.font = '600 24px system-ui, sans-serif';
  ctx.fillText('— NEON ARENA SURVIVAL —', VIEW.width / 2, 296);

  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '500 19px system-ui, sans-serif';
  ctx.fillText('Hold the void. Chain kills into combos. Survive the waves.', VIEW.width / 2, 350);

  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.player;
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText('CLICK OR PRESS ENTER TO START', VIEW.width / 2, 430);
  ctx.restore();

  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '500 17px system-ui, sans-serif';
  ctx.fillText('WASD / ARROWS — move      MOUSE — aim      HOLD CLICK / SPACE — fire', VIEW.width / 2, 500);
  ctx.fillText('E — nova bomb      P — pause      M — mute', VIEW.width / 2, 530);

  if (world.bestScore > 0) {
    ctx.fillStyle = PALETTE.combo;
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.fillText(`BEST SCORE  ${String(world.bestScore).padStart(6, '0')}`, VIEW.width / 2, 590);
  }
  ctx.restore();
}

function drawPaused(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(7, 3, 18, 0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 64px system-ui, sans-serif';
  glow(ctx, PALETTE.player, 24);
  ctx.fillText('PAUSED', VIEW.width / 2, VIEW.height / 2 - 10);
  noGlow(ctx);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '500 20px system-ui, sans-serif';
  ctx.fillText('Press P or click to resume', VIEW.width / 2, VIEW.height / 2 + 40);
  ctx.restore();
}

function drawGameOver(ctx, world) {
  const stats = world.gameOverStats || { score: world.score, wave: world.wave, kills: 0, accuracy: 0 };
  ctx.save();
  ctx.fillStyle = 'rgba(7, 3, 18, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.danger;
  ctx.font = '800 68px system-ui, sans-serif';
  glow(ctx, PALETTE.danger, 28);
  ctx.fillText('THE VOID CLAIMS YOU', VIEW.width / 2, 220);
  noGlow(ctx);

  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.fillText('FINAL SCORE', VIEW.width / 2, 290);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 56px system-ui, sans-serif';
  ctx.fillText(String(stats.score).padStart(6, '0'), VIEW.width / 2, 352);

  if (world.newBest) {
    ctx.fillStyle = PALETTE.combo;
    ctx.font = '800 22px system-ui, sans-serif';
    ctx.fillText('★ NEW BEST SCORE ★', VIEW.width / 2, 396);
  }

  ctx.fillStyle = PALETTE.text;
  ctx.font = '600 21px system-ui, sans-serif';
  ctx.fillText(`WAVE ${stats.wave}    ·    ${stats.kills} KILLS    ·    ${stats.accuracy}% ACCURACY`, VIEW.width / 2, 452);

  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.player;
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText('PRESS R OR CLICK TO FLY AGAIN', VIEW.width / 2, 540);
  ctx.restore();
  ctx.restore();
}

export function drawWorld(ctx, world) {
  ctx.save();
  if (world.shake > 0.2) {
    const magnitude = world.shake;
    ctx.translate((Math.random() - 0.5) * magnitude, (Math.random() - 0.5) * magnitude);
  }
  drawBackground(ctx, world);

  if (world.state === 'menu') {
    drawMenu(ctx, world);
    ctx.restore();
    return;
  }

  for (const powerUp of world.powerups) drawPowerUpShape(ctx, powerUp);

  for (const bullet of world.enemyBullets) {
    glow(ctx, PALETTE.enemyShot, 12);
    ctx.fillStyle = PALETTE.enemyShot;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  noGlow(ctx);

  for (const enemy of world.enemies) {
    drawEnemyShape(ctx, enemy);
    if (enemy.maxHp > 1 && enemy.hp < enemy.maxHp) {
      const width = enemy.radius * 2;
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, width, 4);
      ctx.fillStyle = PALETTE.danger;
      ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, width * (enemy.hp / enemy.maxHp), 4);
    }
  }

  for (const bullet of world.bullets) {
    glow(ctx, PALETTE.bullet, 10);
    ctx.fillStyle = PALETTE.bulletHot;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  noGlow(ctx);

  if (world.state !== 'gameover' && world.player.alive) {
    const player = world.player;
    const blink = player.invulnerable > 0 && Math.floor(world.time * 12) % 2 === 0;
    if (!blink) {
      if (player.shieldTimer > 0) {
        glow(ctx, PALETTE.shield, 20);
        ctx.strokeStyle = PALETTE.shield;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI * 2);
        ctx.stroke();
        noGlow(ctx);
      }
      const flame = 10 + Math.sin(world.time * 30) * 4;
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);
      glow(ctx, '#ff9a2a', 12);
      ctx.fillStyle = 'rgba(255, 154, 42, 0.85)';
      ctx.beginPath();
      ctx.moveTo(-player.radius * 0.7, 0);
      ctx.lineTo(-player.radius * 0.7 - flame, 5);
      ctx.lineTo(-player.radius * 0.7 - flame, -5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      drawShip(ctx, player.x, player.y, player.angle, player.radius, PALETTE.player, PALETTE.playerCore);
    }
  }

  for (const particle of world.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const floater of world.floaters) {
    ctx.globalAlpha = Math.max(0, floater.life / floater.maxLife);
    ctx.fillStyle = floater.color;
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(floater.text, floater.x, floater.y);
  }
  ctx.globalAlpha = 1;

  drawHud(ctx, world);
  if (world.state === 'paused') drawPaused(ctx, world);
  if (world.state === 'gameover') drawGameOver(ctx, world);
  ctx.restore();
}
