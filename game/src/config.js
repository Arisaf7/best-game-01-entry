// VOIDKEEPER — tuning and palette.
// One file, one job: every number the game balances on lives here, so the
// rest of the code reads like the design instead of hiding magic numbers.

export const VIEW = { width: 1280, height: 720 };

export const PALETTE = {
  background: '#070312',
  backgroundEdge: '#0d0624',
  grid: 'rgba(124, 92, 255, 0.08)',
  gridBright: 'rgba(124, 92, 255, 0.16)',
  star: '#cfc6ff',
  player: '#35f0ff',
  playerCore: '#eafcff',
  bullet: '#bff6ff',
  bulletHot: '#ffffff',
  shard: '#ff3df0',
  hex: '#ff9a2a',
  splitter: '#59ff7a',
  dasher: '#b06bff',
  mini: '#ff7ae0',
  enemyShot: '#ff5d5d',
  spread: '#ffe14d',
  rapid: '#ff5da2',
  shield: '#4d9bff',
  nova: '#ffffff',
  combo: '#ffd75e',
  text: '#f2efff',
  textDim: '#a89fd6',
  danger: '#ff4d6a',
  hudPanel: 'rgba(10, 6, 32, 0.55)',
  hudBorder: 'rgba(140, 110, 255, 0.35)',
};

export const PLAYER = {
  radius: 16,
  speed: 360,
  accel: 2600,
  drag: 0.86,
  fireInterval: 0.16,
  bulletSpeed: 720,
  bulletRadius: 5,
  bulletDamage: 1,
  lives: 3,
  invulnerableSeconds: 2.0,
  hitKnockback: 320,
};

export const COMBO = {
  windowSeconds: 2.5,
  maxMultiplier: 8,
};

export const WAVES = {
  baseCount: 6,
  perWaveCount: 3,
  spawnInterval: 0.85,
  spawnIntervalMin: 0.34,
  clearBonus: 250,
  speedScale: 0.06,
  hpScaleEvery: 4,
};

export const ENEMIES = {
  shard: { hp: 1, speed: 132, radius: 16, score: 100, color: PALETTE.shard },
  hex: { hp: 3, speed: 82, radius: 20, score: 250, color: PALETTE.hex },
  splitter: { hp: 2, speed: 104, radius: 19, score: 200, color: PALETTE.splitter },
  dasher: { hp: 2, speed: 96, radius: 17, score: 300, color: PALETTE.dasher },
  mini: { hp: 1, speed: 190, radius: 10, score: 50, color: PALETTE.mini },
};

export const POWERUPS = {
  dropChance: 0.12,
  spreadSeconds: 12,
  rapidSeconds: 10,
  shieldSeconds: 20,
  novaMax: 3,
  fallSpeed: 55,
  radius: 15,
  magnetRadius: 150,
};

export const FX = {
  shakeDecay: 26,
  shakeOnHit: 14,
  shakeOnKill: 4,
  shakeOnNova: 22,
  particlesPerKill: 18,
  floaterRise: 46,
  floaterLife: 0.9,
};

export const AUDIO = {
  musicBpm: 112,
  bassNotes: [55, 55, 65.41, 49],
};
