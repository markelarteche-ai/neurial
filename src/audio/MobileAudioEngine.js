// MobileAudioEngine.js
// Pre-rendered loop-based audio engine for mobile.
// Uses identical playback architecture as nature sounds — no AudioWorklet, no real-time DSP.
// Each noise layer is an AudioBufferSourceNode → GainNode → masterGain → destination

const NOISE_URLS = {
  white:  '/sounds/mobile_loops/white_noise_loop.mp3',
  pink:   '/sounds/mobile_loops/pink_noise_loop.mp3',
  brown:  '/sounds/mobile_loops/brown_noise_loop.mp3',
  grey:   '/sounds/mobile_loops/grey_noise_loop.mp3',
  black:  '/sounds/mobile_loops/black_noise_loop.mp3',
  green:  '/sounds/mobile_loops/green_noise_loop.mp3',
  blue:   '/sounds/mobile_loops/blue_noise_loop.mp3',
  violet: '/sounds/mobile_loops/violet_noise_loop.mp3',
};

const XFADE_SAMPLES = 128;
const xfadeCurveOut = new Float32Array(XFADE_SAMPLES).map((_, i) =>
  Math.cos((i / XFADE_SAMPLES) * Math.PI * 0.5)
);
const xfadeCurveIn = new Float32Array(XFADE_SAMPLES).map((_, i) =>
  Math.sin((i / XFADE_SAMPLES) * Math.PI * 0.5)
);

// ─── IMPROVEMENT 1: module-level buffer cache ────────────────────────────────
// Buffers survive engine destroy/recreate within the same page session.
const _bufferCache  = {};   // url → { buffer, trimStart, playDuration }
const _loadingRefs  = {};   // url → pending Promise

export class MobileAudioEngine { buffers = {};
loadingPromise = null;
  constructor() {
    this.ctx          = null;
    this.masterGain   = null;
    this.layers       = {};   // type → loop state (same structure as nature sounds)
    this.gainNodes    = {};   // type → masterGain node per layer
    // IMPROVEMENT 6: one-shot resume listener refs
    this._resumeHandler = null;
    this._resumed       = false;
  }

  // ─── INIT ────────────────────────────────────────────────────────────────
  async init() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  this.ctx = new AudioCtx({ latencyHint: 'balanced', sampleRate: 44100 });

  this.masterGain = this.ctx.createGain();
  this.masterGain.gain.value = 1;
  this.masterGain.connect(this.ctx.destination);

  this._attachResumeListener();

  if (this.ctx.state === 'suspended') {
    try { await this.ctx.resume(); } catch (_) {}
  }

  await this._preloadAll();
}

  // ─── IMPROVEMENT 6: safe one-shot resume on user gesture ─────────────────
  _attachResumeListener() {
    if (this._resumeHandler) return;
    this._resumeHandler = () => {
      if (this._resumed || !this.ctx || this.ctx.state !== 'suspended') return;
      this.ctx.resume().then(() => { this._resumed = true; }).catch(() => {});
    };
    document.addEventListener('click',      this._resumeHandler, { passive: true });
    document.addEventListener('touchstart', this._resumeHandler, { passive: true });
  }

  _detachResumeListener() {
    if (!this._resumeHandler) return;
    document.removeEventListener('click',      this._resumeHandler);
    document.removeEventListener('touchstart', this._resumeHandler);
    this._resumeHandler = null;
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // ─── IMPROVEMENT 2: preload all loops in parallel ────────────────────────
  async _preloadAll() {

  const promises = Object.entries(NOISE_URLS).map(([type]) =>
    this._loadBuffer(type)
  );

  await Promise.all(promises);

  console.log("MobileAudioEngine: all noise buffers ready");

}

  // ─── BUFFER LOADER — IMPROVEMENT 1: module-level cache ───────────────────
  async _loadBuffer(type) {
    const url = NOISE_URLS[type];
    if (_bufferCache[url])  return _bufferCache[url];
    if (_loadingRefs[url])  return _loadingRefs[url];

    const promise = (async () => {
      const res    = await fetch(url);
      const arr    = await res.arrayBuffer();
      const buffer = await this.ctx.decodeAudioData(arr);
      // warm up buffer so first playback is instant
const src = this.ctx.createBufferSource();
src.buffer = buffer;
src.connect(this.ctx.destination);
src.start(0);
src.stop(this.ctx.currentTime + 0.001);

      const MAX_SEGMENT  = 120;
      const playDuration = Math.min(buffer.duration, MAX_SEGMENT);
      const maxOffset    = Math.max(0, buffer.duration - playDuration - 5);
      const trimStart    = maxOffset > 0 ? Math.random() * maxOffset : 0;

      const data = { buffer, trimStart, playDuration };
      _bufferCache[url] = data;
      delete _loadingRefs[url];
      return data;
    })();

    _loadingRefs[url] = promise;
    return promise;
  }

  // ─── PLAY LAYER ──────────────────────────────────────────────────────────
  // IMPROVEMENT 5: guard at top — no restart if already running
  playLayer(type, volume = 70) {
    const ctx = this.ctx;
if (!ctx || ctx.state === 'closed') return;
if (this.layers[type]) return;

// si no está running todavía, reintenta de forma segura
if (ctx.state !== 'running') {
  ctx.resume().then(() => {
    if (this.ctx !== ctx) return;
    if (!this.layers[type] && ctx.state === 'running') {
      this.playLayer(type, volume);
    }
  }).catch(() => {});
  return;
}

    const gain1      = ctx.createGain();
    const gain2      = ctx.createGain();
    const masterGain = ctx.createGain();

    // IMPROVEMENT 3: fade-in on first play — start at 0, ramp to target in 20 ms
    const targetVol = Math.max(0, Math.min(1, volume / 100));
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.02);

    gain1.connect(masterGain);
    gain2.connect(masterGain);
    masterGain.connect(this.masterGain);

    gain1.gain.value = 1;
    gain2.gain.value = 0;

    const XFADE     = 5.0;
    const LOOKAHEAD = 0.25;

    const state = {
      buffer: null, gain1, gain2, masterGain,
      src1: null, src2: null,
      currentPlayer: 1, timerId: null,
      trimStart: 0, playDuration: 0,
      cancelled: false,
      _killedByUser: false,
    };

    this.layers[type]    = state;
    this.gainNodes[type] = masterGain;

    const makeSource = (gainNode) => {
      const src  = ctx.createBufferSource();
      src.buffer = state.buffer;
      src.loop = true;
src.loopStart = state.trimStart;
src.loopEnd = state.trimStart + state.playDuration;
      src.connect(gainNode);
      return src;
    };

    const startPlayer = (which, when) => {
      const gainNode = which === 1 ? state.gain1 : state.gain2;
      const src      = makeSource(gainNode);
      if (which === 1) state.src1 = src; else state.src2 = src;
      const safeWhen = Math.max(ctx.currentTime + 0.05, when);
      if (state.cancelled) return src;
      src.start(safeWhen, state.trimStart);
      return src;
    };

    const scheduleNextCrossfade = (tLoopStart, activePlayer) => {
      if (state.cancelled || !state.buffer) return;
      const rawTX = tLoopStart + (state.playDuration - XFADE);
      const tX    = Math.max(ctx.currentTime + 0.01, rawTX);
      if (state.cancelled) return;

      const nextPlayer  = activePlayer === 1 ? 2 : 1;
      const currentGain = activePlayer === 1 ? state.gain1 : state.gain2;
      const nextGain    = activePlayer === 1 ? state.gain2 : state.gain1;
      const outgoingSrc = activePlayer === 1 ? state.src1  : state.src2;

      startPlayer(nextPlayer, tX);
      currentGain.gain.cancelScheduledValues(tX);
      currentGain.gain.setValueAtTime(1, tX);
      currentGain.gain.setValueCurveAtTime(xfadeCurveOut, tX, XFADE);
      nextGain.gain.cancelScheduledValues(tX);
      nextGain.gain.setValueAtTime(0, tX);
      nextGain.gain.setValueCurveAtTime(xfadeCurveIn, tX, XFADE);
      try { if (outgoingSrc) outgoingSrc.stop(tX + XFADE + 0.05); } catch {}

      state.currentPlayer = nextPlayer;
      const msUntilNext = Math.max(50, (tX + state.playDuration - XFADE - LOOKAHEAD - ctx.currentTime) * 1000);
      state.timerId = setTimeout(() => {
        if (state.cancelled || !this.layers[type]) return;
        scheduleNextCrossfade(tX, nextPlayer);
      }, msUntilNext);
    };

    this._loadBuffer(type)
      .then(({ buffer, trimStart, playDuration }) => {
        if (state._killedByUser || state.cancelled || !this.layers[type]) {
          try { gain1.disconnect(); } catch {}
          try { gain2.disconnect(); } catch {}
          try { masterGain.disconnect(); } catch {}
          return;
        }

        state.buffer       = buffer;
        state.trimStart    = trimStart;
        state.playDuration = playDuration;

        const schedulePlay = () => {
          gain1.gain.cancelScheduledValues(ctx.currentTime);
          gain1.gain.setValueAtTime(1, ctx.currentTime);
          gain2.gain.cancelScheduledValues(ctx.currentTime);
          gain2.gain.setValueAtTime(0, ctx.currentTime);
          const t0 = ctx.currentTime + 0.05;
          startPlayer(1, t0);
          scheduleNextCrossfade(t0, 1);
        };

        ctx.resume().then(schedulePlay).catch(() => schedulePlay());
      })
      .catch(err => {
        delete this.layers[type];
        delete this.gainNodes[type];
        console.error(`[MobileAudioEngine] ${type}: load error`, err);
      });
  }

  // ─── STOP LAYER — IMPROVEMENT 4: graceful fade-out ───────────────────────
  stopLayer(type, immediate = false) {
    const st = this.layers[type];
    if (!st) return;

    st.cancelled     = true;
    st._killedByUser = true;
    if (st.timerId) clearTimeout(st.timerId);

    const now = this.ctx?.currentTime ?? 0;

    if (immediate) {
      try { st.src1?.stop(0); } catch {}
      try { st.src2?.stop(0); } catch {}
      try { st.gain1?.disconnect(); } catch {}
      try { st.gain2?.disconnect(); } catch {}
      try { st.masterGain?.disconnect(); } catch {}
      delete this.layers[type];
      delete this.gainNodes[type];
    } else {
      // IMPROVEMENT 4: 50 ms linear fade-out before stopping sources
      const FADE = 0.05;
      try {
        if (st.masterGain) {
          st.masterGain.gain.cancelScheduledValues(now);
          st.masterGain.gain.setValueAtTime(st.masterGain.gain.value || 1, now);
          st.masterGain.gain.linearRampToValueAtTime(0, now + FADE);
        }
      } catch {}
      try { if (st.src1) st.src1.stop(now + FADE + 0.01); } catch {}
      try { if (st.src2) st.src2.stop(now + FADE + 0.01); } catch {}
      setTimeout(() => {
        try { st.gain1?.disconnect(); } catch {}
        try { st.gain2?.disconnect(); } catch {}
        try { st.masterGain?.disconnect(); } catch {}
        delete this.layers[type];
        delete this.gainNodes[type];
      }, (FADE + 0.05) * 1000);
    }
  }

  // ─── SET VOLUME ──────────────────────────────────────────────────────────
  setVolume(type, volume) {
    const gn = this.gainNodes[type];
    if (!gn || !this.ctx) return;
    gn.gain.setTargetAtTime(volume / 100, this.ctx.currentTime, 0.02);
  }

  // intensity (0–100) * volume (0–100) → combined gain
  setLayerGain(type, intensity, volume) {
    const combined = (intensity / 100) * (volume / 100);
    const gn = this.gainNodes[type];
    if (!gn || !this.ctx) return;
    gn.gain.setTargetAtTime(combined, this.ctx.currentTime, 0.02);
  }

  // ─── STOP ALL ────────────────────────────────────────────────────────────
  stopAll() {
    Object.keys(this.layers).forEach(type => this.stopLayer(type, true));
  }

  // ─── DESTROY ─────────────────────────────────────────────────────────────
  async destroy() {
    this._detachResumeListener();
    this.stopAll();
    try { this.masterGain?.disconnect(); } catch {}
    this.masterGain = null;
    if (this.ctx && this.ctx.state !== 'closed') {
      try { await this.ctx.close(); } catch {}
    }
    this.ctx    = null;
    this.layers = {};
    this.gainNodes = {};
  }

  // ─── MASTER VOLUME ───────────────────────────────────────────────────────
  setMasterVolume(v) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
    }
  }

  // ─── FADE OUT (for free-limit timer) ─────────────────────────────────────
  fadeOut(durationSec = 1.5) {
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value || 1, now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + durationSec);
    }
  }

  fadeToGain(target, durationSec = 0.5) {
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value || 1, now);
      this.masterGain.gain.linearRampToValueAtTime(target, now + durationSec);
    }
  }
}