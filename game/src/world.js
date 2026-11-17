// VOIDKEEPER — the game itself: state, waves, collisions, score.
// The world owns every list and every rule. Rendering reads it, input feeds
// it, and the screenshot helper drives it through the same update step.

import { COMBO, ENEMIES, FX, PALETTE, PLAYER, POWERUPS, VIEW, WAVES } from './config.js';
import { makeRandom } from './random.js';
import {
  createBullet, createEnemy, createFloater, createParticle, createPlayer,
  createPowerUp, firePlayerBullets, updateBullet, updateEnemy, updateFloater,
  updateParticle, updatePlayer, updatePowerUp,
} from './entities.js';

const WAVE_ROSTER = [
  ['shard'],
  ['shard', 'shard', 'shard', 'hex'],
  ['shard', 'shard', 'hex', 'splitter'],
  ['shard', 'hex', 'splitter', 'dasher'],
  ['shard', 'hex', 'splitter', 'dasher', 'dasher'],
];

const POWERUP_TYPES = ['spread', 'rapid', 'shield', 'nova'];

function bestScoreKey() {
  return 'voidkeeper-best-score';
}

export function loadBestScore() {
  try {
    return Number(window.localStorage.getItem(bestScoreKey())) || 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(score) {
  try {
    if (score > loadBestScore()) window.localStorage.setItem(bestScoreKey(), String(score));
  } catch {
    // A private window is fine: the best score just does not persist.
  }
}

export function createWorld(seed = 20261117) {
  const world = {
    seed,
    random: makeRandom(seed),
    state: 'menu',
    time: 0,
    player: createPlayer(VIEW.width / 2, VIEW.height / 2),
    bullets: [],
    enemyBullets: [],
    enemies: [],
    particles: [],
    powerups: [],
    floaters: [],
    stars: [],
    wave: 0,
    score: 0,
    bestScore: loadBestScore(),
    combo: 0,
    comboTimer: 0,
    multiplier: 1,
    maxCombo: 0,
    lives: PLAYER.lives,
    kills: 0,
    shotsFired: 0,
    shotsHit: 0,
    waveState: 'idle',
    spawnQueue: [],
    spawnTimer: 0,
    banner: '',
    bannerTimer: 0,
    shake: 0,
    gameOverStats: null,
    autopilot: false,
    autopilotAngle: 0,
    muted: false,
    newBest: false,

    start() {
      this.player = createPlayer(VIEW.width / 2, VIEW.height / 2);
      this.bullets = [];
      this.enemyBullets = [];
      this.enemies = [];
      this.particles = [];
      this.powerups = [];
      this.floaters = [];
      this.wave = 0;
      this.score = 0;
      this.combo = 0;
      this.comboTimer = 0;
      this.multiplier = 1;
      this.maxCombo = 0;
      this.lives = PLAYER.lives;
      this.kills = 0;
      this.shotsFired = 0;
      this.shotsHit = 0;
      this.gameOverStats = null;
      this.newBest = false;
      this.state = 'playing';
      this.nextWave();
    },

    nextWave() {
      this.wave += 1;
      const roster = WAVE_ROSTER[Math.min(this.wave - 1, WAVE_ROSTER.length - 1)];
      const count = WAVES.baseCount + (this.wave - 1) * WAVES.perWaveCount;
      this.spawnQueue = [];
      for (let i = 0; i < count; i += 1) {
        this.spawnQueue.push(this.random.pick(roster));
      }
      this.spawnTimer = 0.4;
      this.waveState = 'spawning';
      this.banner = `WAVE ${this.wave}`;
      this.bannerTimer = 1.8;
      return this.wave;
    },

    spawnEnemy(type) {
      const margin = 40;
      const side = this.random.int(0, 3);
      let x;
      let y;
      if (side === 0) { x = this.random.range(margin, VIEW.width - margin); y = -margin; }
      else if (side === 1) { x = this.random.range(margin, VIEW.width - margin); y = VIEW.height + margin; }
      else if (side === 2) { x = -margin; y = this.random.range(margin, VIEW.height - margin); }
      else { x = VIEW.width + margin; y = this.random.range(margin, VIEW.height - margin); }
      this.enemies.push(createEnemy(type, x, y, this.wave, this.random));
    },

    addScore(base, x, y) {
      const gained = base * this.multiplier;
      this.score += gained;
      this.floaters.push(createFloater(x, y, `+${gained}`, this.multiplier > 1 ? PALETTE.combo : PALETTE.text));
      return gained;
    },

    registerKill() {
      this.kills += 1;
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.comboTimer = COMBO.windowSeconds;
      this.multiplier = Math.min(COMBO.maxMultiplier, 1 + Math.floor(this.combo / 4));
    },

    dropPowerUp(x, y) {
      if (!this.random.chance(POWERUPS.dropChance)) return;
      this.powerups.push(createPowerUp(x, y, this.random.pick(POWERUP_TYPES), this.random));
    },

    killEnemy(enemy, index) {
      const { x, y, type, color, score } = enemy;
      this.enemies.splice(index, 1);
      this.registerKill();
      this.addScore(score, x, y);
      this.particles.push(...createParticle(x, y, color, FX.particlesPerKill, this.random));
      this.particles.push(...createParticle(x, y, '#ffffff', 6, this.random, 140));
      this.shake = Math.min(10, this.shake + FX.shakeOnKill);
      if (type === 'splitter') {
        for (let i = 0; i < 2; i += 1) {
          const mini = createEnemy('mini', x + this.random.range(-14, 14), y + this.random.range(-14, 14), this.wave, this.random);
          this.enemies.push(mini);
        }
      }
      this.dropPowerUp(x, y);
    },

    damagePlayer() {
      const player = this.player;
      if (player.invulnerable > 0 || this.state !== 'playing') return;
      if (player.shieldTimer > 0) {
        player.shieldTimer = 0;
        player.invulnerable = 1.2;
        this.floaters.push(createFloater(player.x, player.y - 30, 'SHIELD DOWN', PALETTE.shield));
        this.particles.push(...createParticle(player.x, player.y, PALETTE.shield, 22, this.random));
        return;
      }
      this.lives -= 1;
      this.combo = 0;
      this.multiplier = 1;
      this.comboTimer = 0;
      this.shake = FX.shakeOnHit;
      this.particles.push(...createParticle(player.x, player.y, PALETTE.player, 30, this.random, 340));
      player.invulnerable = PLAYER.invulnerableSeconds;
      const away = Math.atan2(player.y - VIEW.height / 2, player.x - VIEW.width / 2);
      player.vx += Math.cos(away) * PLAYER.hitKnockback;
      player.vy += Math.sin(away) * PLAYER.hitKnockback;
      if (this.lives <= 0) this.endGame();
    },

    detonateNova() {
      const player = this.player;
      if (player.novas <= 0 || this.state !== 'playing') return false;
      player.novas -= 1;
      this.shake = FX.shakeOnNova;
      this.particles.push(...createParticle(player.x, player.y, PALETTE.nova, 60, this.random, 520));
      this.particles.push(...createParticle(player.x, player.y, PALETTE.player, 30, this.random, 420));
      this.enemyBullets = [];
      for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
        const enemy = this.enemies[i];
        enemy.hp -= 3;
        enemy.flash = 0.3;
        if (enemy.hp <= 0) this.killEnemy(enemy, i);
      }
      this.floaters.push(createFloater(player.x, player.y - 40, 'NOVA!', PALETTE.nova));
      return true;
    },

    applyPowerUp(type) {
      const player = this.player;
      if (type === 'spread') player.spreadTimer = POWERUPS.spreadSeconds;
      if (type === 'rapid') player.rapidTimer = POWERUPS.rapidSeconds;
      if (type === 'shield') player.shieldTimer = POWERUPS.shieldSeconds;
      if (type === 'nova') player.novas = Math.min(POWERUPS.novaMax, player.novas + 1);
      const labels = { spread: 'SPREAD SHOT', rapid: 'RAPID FIRE', shield: 'SHIELD UP', nova: 'NOVA +1' };
      this.floaters.push(createFloater(player.x, player.y - 34, labels[type], PALETTE[type]));
    },

    endGame() {
      this.state = 'gameover';
      this.bannerTimer = 0;
      this.newBest = this.score > this.bestScore;
      if (this.newBest) {
        this.bestScore = this.score;
        saveBestScore(this.score);
      }
      const accuracy = this.shotsFired === 0 ? 0 : Math.min(100, Math.round((this.shotsHit / this.shotsFired) * 100));
      this.gameOverStats = {
        score: this.score,
        wave: this.wave,
        kills: this.kills,
        accuracy,
        bestCombo: this.maxCombo,
      };
    },

    autopilotInput() {
      this.autopilotAngle += 0.011;
      const targetX = VIEW.width / 2 + Math.cos(this.autopilotAngle) * 260;
      const targetY = VIEW.height / 2 + Math.sin(this.autopilotAngle * 1.3) * 150;
      let aim = { x: targetX + 200, y: targetY };
      let nearest = null;
      let nearestDistance = Infinity;
      for (const enemy of this.enemies) {
        const distance = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = enemy;
        }
      }
      if (nearest) aim = { x: nearest.x, y: nearest.y };
      const dx = targetX - this.player.x;
      const dy = targetY - this.player.y;
      const length = Math.hypot(dx, dy) || 1;
      const move = { x: dx / length, y: dy / length };
      if (Math.hypot(dx, dy) < 24) { move.x = 0; move.y = 0; }
      return { move, aim, firing: true };
    },

    update(dt, input, audio) {
      this.time += dt;
      this.shake = Math.max(0, this.shake - FX.shakeDecay * dt);
      this.bannerTimer = Math.max(0, this.bannerTimer - dt);
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.combo = 0;
          this.multiplier = 1;
        }
      }
      for (let i = this.particles.length - 1; i >= 0; i -= 1) {
        if (!updateParticle(this.particles[i], dt)) this.particles.splice(i, 1);
      }
      for (let i = this.floaters.length - 1; i >= 0; i -= 1) {
        if (!updateFloater(this.floaters[i], dt)) this.floaters.splice(i, 1);
      }
      if (this.state !== 'playing') return;
      if (audio) audio.updateMusic(dt, true);

      const drive = this.autopilot ? this.autopilotInput() : {
        move: input.moveVector(),
        aim: input.mouse,
        firing: input.firing(),
      };
      const player = this.player;
      const wantFire = updatePlayer(player, drive.move, drive.aim, drive.firing, dt);
      if (wantFire) {
        firePlayerBullets(player, this.bullets);
        this.shotsFired += 1;
        if (audio) audio.shoot();
      }
      if (!this.autopilot && (input.wasPressed('e') || input.wasPressed('nova'))) {
        if (this.detonateNova() && audio) audio.nova();
      }

      if (this.waveState === 'spawning') {
        this.spawnTimer -= dt;
        const interval = Math.max(WAVES.spawnIntervalMin, WAVES.spawnInterval - (this.wave - 1) * 0.05);
        if (this.spawnTimer <= 0 && this.spawnQueue.length > 0) {
          this.spawnEnemy(this.spawnQueue.shift());
          this.spawnTimer = interval;
        }
        if (this.spawnQueue.length === 0) this.waveState = 'fighting';
      } else if (this.waveState === 'fighting' && this.enemies.length === 0) {
        const bonus = WAVES.clearBonus * this.wave;
        this.score += bonus;
        this.floaters.push(createFloater(VIEW.width / 2, VIEW.height / 2 - 60, `WAVE CLEAR +${bonus}`, PALETTE.combo));
        if (audio) audio.waveStart();
        this.nextWave();
      }

      for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
        if (!updateBullet(this.bullets[i], dt)) this.bullets.splice(i, 1);
      }
      for (let i = this.enemyBullets.length - 1; i >= 0; i -= 1) {
        if (!updateBullet(this.enemyBullets[i], dt)) this.enemyBullets.splice(i, 1);
      }

      for (const enemy of this.enemies) {
        updateEnemy(enemy, player, dt, this.time);
        if (enemy.type === 'hex' && enemy.fireTimer <= 0 && this.state === 'playing') {
          enemy.fireTimer = 2.2;
          const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
          this.enemyBullets.push(createBullet(enemy.x, enemy.y, angle, 240, 1, false));
          if (audio) audio.enemyShoot();
        }
      }

      for (let i = this.powerups.length - 1; i >= 0; i -= 1) {
        const powerUp = this.powerups[i];
        if (!updatePowerUp(powerUp, player, dt)) {
          this.powerups.splice(i, 1);
          continue;
        }
        const distance = Math.hypot(powerUp.x - player.x, powerUp.y - player.y);
        if (distance < powerUp.radius + player.radius) {
          this.applyPowerUp(powerUp.type);
          this.powerups.splice(i, 1);
          if (audio) audio.powerup();
        }
      }

      this.collideBullets(audio);
      this.collidePlayer(audio);
    },

    collideBullets(audio) {
      for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
        const bullet = this.bullets[i];
        let consumed = false;
        for (let j = this.enemies.length - 1; j >= 0; j -= 1) {
          const enemy = this.enemies[j];
          const distance = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
          if (distance < bullet.radius + enemy.radius) {
            enemy.hp -= bullet.damage;
            enemy.flash = 0.12;
            this.shotsHit += 1;
            this.particles.push(...createParticle(bullet.x, bullet.y, enemy.color, 4, this.random, 120));
            consumed = true;
            if (enemy.hp <= 0) {
              this.killEnemy(enemy, j);
              if (audio) audio.explosion(enemy.type === 'splitter' || enemy.type === 'hex');
            }
            break;
          }
        }
        if (consumed) this.bullets.splice(i, 1);
      }
    },

    collidePlayer(audio) {
      const player = this.player;
      for (const enemy of this.enemies) {
        const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (distance < enemy.radius + player.radius - 4) {
          this.damagePlayer();
          if (audio) audio.playerHit();
          if (this.state !== 'playing') return;
          break;
        }
      }
      for (let i = this.enemyBullets.length - 1; i >= 0; i -= 1) {
        const bullet = this.enemyBullets[i];
        const distance = Math.hypot(bullet.x - player.x, bullet.y - player.y);
        if (distance < bullet.radius + player.radius - 4) {
          this.enemyBullets.splice(i, 1);
          this.damagePlayer();
          if (audio) audio.playerHit();
          if (this.state !== 'playing') return;
        }
      }
    },
  };

  for (let i = 0; i < 90; i += 1) {
    world.stars.push({
      x: world.random.range(0, VIEW.width),
      y: world.random.range(0, VIEW.height),
      radius: world.random.range(0.6, 2),
      twinkle: world.random.range(0, Math.PI * 2),
    });
  }
  return world;
}
