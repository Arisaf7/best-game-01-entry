// VOIDKEEPER — every sound is synthesized with WebAudio, no audio files.
// Short oscillator blips for shots, a noise burst for explosions, little
// arpeggios for pickups, and a quiet bass pulse that keeps time while playing.

import { AUDIO } from './config.js';

function makeNoiseBuffer(context, seconds) {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  return buffer;
}

export function createAudio() {
  const audio = {
    context: null,
    master: null,
    muted: false,
    musicOn: false,
    musicTimer: 0,
    beat: 0,
    noise: null,

    ensure() {
      if (this.context) {
        if (this.context.state === 'suspended') this.context.resume().catch(() => {});
        return;
      }
      try {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) return;
        this.context = new Context();
        this.master = this.context.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.context.destination);
        this.noise = makeNoiseBuffer(this.context, 0.4);
      } catch {
        this.context = null;
      }
    },

    setMuted(muted) {
      this.muted = muted;
      if (this.master) this.master.gain.value = muted ? 0 : 0.5;
    },

    tone({ type = 'sine', from = 440, to = null, seconds = 0.12, volume = 0.2, when = 0 }) {
      if (!this.context || this.muted) return;
      try {
        const start = this.context.currentTime + when;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(from, start);
        if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + seconds);
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(start);
        osc.stop(start + seconds + 0.02);
      } catch {
        // Sound is garnish: never let it break the game.
      }
    },

    burst({ seconds = 0.3, volume = 0.3, frequency = 1200 }) {
      if (!this.context || this.muted || !this.noise) return;
      try {
        const start = this.context.currentTime;
        const source = this.context.createBufferSource();
        source.buffer = this.noise;
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(frequency, start);
        filter.frequency.exponentialRampToValueAtTime(120, start + seconds);
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        source.start(start);
        source.stop(start + seconds);
      } catch {
        // Sound is garnish: never let it break the game.
      }
    },

    shoot() {
      this.tone({ type: 'square', from: 880, to: 420, seconds: 0.07, volume: 0.08 });
    },

    enemyShoot() {
      this.tone({ type: 'sawtooth', from: 300, to: 180, seconds: 0.1, volume: 0.06 });
    },

    explosion(big = false) {
      this.burst({ seconds: big ? 0.45 : 0.25, volume: big ? 0.35 : 0.2, frequency: big ? 900 : 1600 });
      this.tone({ type: 'sine', from: big ? 160 : 220, to: 40, seconds: 0.3, volume: 0.22 });
    },

    playerHit() {
      this.tone({ type: 'sawtooth', from: 220, to: 55, seconds: 0.4, volume: 0.3 });
      this.burst({ seconds: 0.35, volume: 0.25, frequency: 700 });
    },

    powerup() {
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) => {
        this.tone({ type: 'triangle', from: frequency, seconds: 0.12, volume: 0.14, when: i * 0.06 });
      });
    },

    nova() {
      this.burst({ seconds: 0.7, volume: 0.4, frequency: 2400 });
      this.tone({ type: 'sine', from: 90, to: 28, seconds: 0.6, volume: 0.35 });
    },

    waveStart() {
      [392, 523.25, 659.25].forEach((frequency, i) => {
        this.tone({ type: 'triangle', from: frequency, seconds: 0.16, volume: 0.14, when: i * 0.09 });
      });
    },

    gameOver() {
      [392, 311.13, 233.08, 155.56].forEach((frequency, i) => {
        this.tone({ type: 'triangle', from: frequency, seconds: 0.3, volume: 0.16, when: i * 0.18 });
      });
    },

    click() {
      this.tone({ type: 'sine', from: 660, to: 880, seconds: 0.06, volume: 0.1 });
    },

    updateMusic(dt, playing) {
      if (!this.context || this.muted) return;
      this.musicTimer -= dt;
      if (!playing || this.musicTimer > 0) return;
      const beatSeconds = 60 / AUDIO.musicBpm / 2;
      this.musicTimer = beatSeconds;
      const note = AUDIO.bassNotes[this.beat % AUDIO.bassNotes.length];
      this.beat += 1;
      this.tone({ type: 'triangle', from: note, seconds: beatSeconds * 0.9, volume: 0.1 });
      if (this.beat % 8 === 0) {
        this.tone({ type: 'sine', from: note * 4, seconds: 0.2, volume: 0.04 });
      }
    },
  };
  return audio;
}
