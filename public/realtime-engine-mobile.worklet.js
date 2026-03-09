// REALTIME AUDIO ENGINE - MOBILE WORKLET
// Designed for mobile browsers: same sound character as desktop,
// minimal DSP per sample to avoid audio thread underruns.
//
// What's kept vs desktop:
//   ✓ All 8 noise generators (identical algorithms)
//   ✓ All brainwave / binaural beat generators
//   ✓ Per-color spectral shaping (2 biquads instead of 4)
//   ✓ Stereo width (M/S processing)
//   ✓ Layer smoothing, density ramp, volume/intensity params
//   ✓ Warmup, ready message, same parameter interface
//
// What's simplified vs desktop:
//   ✗ No spatial delay lines (512-sample circular buffer per color)
//   ✗ No allpass filters per color
//   ✗ No air noise injection
//   ✗ No wind grain / motion modulation
//   ✗ No spectral breathing LFO
//   ✗ No stereo decorrelation diffuse delays
//   ✗ No ColorSignature class — inline per-color processing
// ============================================================================

// ── Minimal Biquad (same as desktop) ─────────────────────────────────────
class Biquad {
  constructor() {
    this.b0 = 1; this.b1 = 0; this.b2 = 0;
    this.a1 = 0; this.a2 = 0;
    this.x1 = 0; this.x2 = 0;
    this.y1 = 0; this.y2 = 0;
  }
  process(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2
                           - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x;
    this.y2 = this.y1; this.y1 = y;
    return isFinite(y) ? y : 0;
  }
  reset() { this.x1=0; this.x2=0; this.y1=0; this.y2=0; }
  setLP(freq, sr, Q = 0.707) {
    const w = 2 * Math.PI * freq / sr;
    const cosw = Math.cos(w), sinw = Math.sin(w);
    const alpha = sinw / (2 * Q);
    const b1 = 1 - cosw, b0 = b1 / 2;
    const a0 = 1 + alpha;
    this.b0 = b0/a0; this.b1 = b1/a0; this.b2 = b0/a0;
    this.a1 = (-2*cosw)/a0; this.a2 = (1-alpha)/a0;
  }
  setHP(freq, sr, Q = 0.707) {
    const w = 2 * Math.PI * freq / sr;
    const cosw = Math.cos(w), sinw = Math.sin(w);
    const alpha = sinw / (2 * Q);
    const b0 = (1 + cosw) / 2;
    const a0 = 1 + alpha;
    this.b0 = b0/a0; this.b1 = (-1-cosw)/a0; this.b2 = b0/a0;
    this.a1 = (-2*cosw)/a0; this.a2 = (1-alpha)/a0;
  }
  setLS(freq, sr, gainDB) {
    const A = Math.pow(10, gainDB / 40);
    const w = 2 * Math.PI * freq / sr;
    const cosw = Math.cos(w), sinw = Math.sin(w);
    const beta = Math.sqrt(A) / 0.707;
    const a0 = (A+1) + (A-1)*cosw + beta*sinw;
    this.b0 = A*((A+1) - (A-1)*cosw + beta*sinw) / a0;
    this.b1 = 2*A*((A-1) - (A+1)*cosw) / a0;
    this.b2 = A*((A+1) - (A-1)*cosw - beta*sinw) / a0;
    this.a1 = -2*((A-1) + (A+1)*cosw) / a0;
    this.a2 = ((A+1) + (A-1)*cosw - beta*sinw) / a0;
  }
  setHS(freq, sr, gainDB) {
    const A = Math.pow(10, gainDB / 40);
    const w = 2 * Math.PI * freq / sr;
    const cosw = Math.cos(w), sinw = Math.sin(w);
    const beta = Math.sqrt(A) / 0.707;
    const a0 = (A+1) - (A-1)*cosw + beta*sinw;
    this.b0 = A*((A+1) + (A-1)*cosw + beta*sinw) / a0;
    this.b1 = -2*A*((A-1) + (A+1)*cosw) / a0;
    this.b2 = A*((A+1) + (A-1)*cosw - beta*sinw) / a0;
    this.a1 = 2*((A-1) - (A+1)*cosw) / a0;
    this.a2 = ((A+1) - (A-1)*cosw - beta*sinw) / a0;
  }
}

// ── Main Engine ───────────────────────────────────────────────────────────
class RealtimeEngineMobile extends AudioWorkletProcessor {
  constructor(options) {
    super(options);

    const sr = sampleRate;
    this._sr = sr;
    this._ready = false;

    // ── RNG (identical to desktop — same noise character) ─────────────────
    this.rngState = 0x12345678;
    for (let i = 0; i < 10000; i++) this.rng();

    const COLORS = ['white','pink','brown','grey','blue','violet','black','green'];
    const WAVES  = ['alpha','theta','delta','beta','gamma'];
    this._COLORS = COLORS;
    this._WAVES  = WAVES;

    // ── Noise generator state (identical to desktop) ──────────────────────
    this.pinkState = {
      L: new Float32Array(7).map(() => this.rng()*0.001),
      R: new Float32Array(7).map(() => this.rng()*0.001)
    };
    this.brownState  = { L: this.rng()*0.001, R: this.rng()*0.001 };
    this.brownDamp   = { L: 0, R: 0 };
    this.brownHP     = { L: 0, R: 0 };
    this.lastBlue    = { L: this.rng()*0.001, R: this.rng()*0.001 };
    this.lastViolet  = this.rng()*0.001;
    this.greyState   = { L: 0, R: 0 };
    this.blackDamp   = { L: 0, R: 0 };
    this.blackHP     = { L: 0, R: 0 };
    this.greenState  = {
      L: new Float32Array(4).map(() => this.rng()*0.001),
      R: new Float32Array(4).map(() => this.rng()*0.001)
    };
    this.greenGrain       = { L: 0, R: 0 };
    this.greenGrainLP     = { L: 0, R: 0 };
    this.greenBreathPhase = Math.random() * Math.PI * 2;
    this.greenFill        = { L: 0, R: 0 };

    // ── Per-color spectral filters (2 biquads L+R per color) ─────────────
    // Each color gets: 1 low-shelf shaping + 1 high-shelf shaping
    // Tuned to match the tonal character of the desktop 4-biquad chain
    this.colorFilters = {};
    const colorFilterConfig = {
      white:  { ls: [120, -1.5], hs: [8000,  1.0] },
      pink:   { ls: [200,  2.0], hs: [6000, -1.5] },
      brown:  { ls: [300,  4.0], hs: [4000, -3.0] },
      grey:   { ls: [150,  1.0], hs: [7000, -1.0] },
      blue:   { ls: [100, -2.0], hs: [9000,  2.5] },
      violet: { ls: [80,  -3.0], hs: [12000, 3.5] },
      black:  { ls: [400,  5.0], hs: [3000, -4.0] },
      green:  { ls: [200,  2.5], hs: [5000, -2.0] }
    };
    for (let ci = 0; ci < COLORS.length; ci++) {
      const c = COLORS[ci];
      const cfg = colorFilterConfig[c];
      const fL1 = new Biquad(); fL1.setLS(cfg.ls[0], sr, cfg.ls[1]);
      const fL2 = new Biquad(); fL2.setHS(cfg.hs[0], sr, cfg.hs[1]);
      const fR1 = new Biquad(); fR1.setLS(cfg.ls[0], sr, cfg.ls[1]);
      const fR2 = new Biquad(); fR2.setHS(cfg.hs[0], sr, cfg.hs[1]);
      this.colorFilters[c] = { L: [fL1, fL2], R: [fR1, fR2] };
    }

    // ── Layer parameter smoothing ─────────────────────────────────────────
    this.smoothedParams = {};
    this.layerOnRamp    = {};
    this.densityRamp    = {};
    for (let ci = 0; ci < COLORS.length; ci++) {
      this.smoothedParams[COLORS[ci]] = { intensity: 0, volume: 1 };
      this.layerOnRamp[COLORS[ci]]    = 0;
      this.densityRamp[COLORS[ci]]    = 0;
    }

    // ── Brainwave oscillator state ────────────────────────────────────────
    this.brainwavePhases = {};
    for (let wi = 0; wi < WAVES.length; wi++) {
      this.brainwavePhases[WAVES[wi]] = { L: 0, R: 0 };
    }

    // ── Soft HP filter to protect mobile speakers (90Hz cutoff) ──────────
    this._hpL = 0; this._hpR = 0;
    this._hpCoeff = Math.exp(-2 * Math.PI * 90 / sr);
    this._speakerMode = false;

    // ── Message handler ───────────────────────────────────────────────────
    this.port.onmessage = (e) => {
      if (e.data.type === 'warmup') {
        // Warm up filter states with 4800 samples
        const samples = e.data.samples || 4800;
        for (let i = 0; i < samples; i++) {
          for (let ci = 0; ci < COLORS.length; ci++) {
            const c = COLORS[ci];
            switch(c) {
              case 'white':  this.genWhite(); break;
              case 'pink':   this.genPink('L'); this.genPink('R'); break;
              case 'brown':  this.genBrown('L'); this.genBrown('R'); break;
              case 'grey':   this.genGrey('L'); this.genGrey('R'); break;
              case 'blue':   this.genBlue('L'); this.genBlue('R'); break;
              case 'violet': this.genViolet(); break;
              case 'black':  this.genBlack('L'); this.genBlack('R'); break;
              case 'green':  this.genGreen('L'); this.genGreen('R'); break;
            }
          }
        }
      } else if (e.data.type === 'speakerMode') {
        this._speakerMode = !!e.data.active;
      }
    };
  }

  // ── Parameter descriptors (identical to desktop) ─────────────────────
  static get parameterDescriptors() {
    const params = [];
    const COLORS = ['white','pink','brown','grey','blue','violet','black','green'];
    const WAVES  = ['alpha','theta','delta','beta','gamma'];
    for (let ci = 0; ci < COLORS.length; ci++) {
      const c = COLORS[ci];
      params.push(
        { name: `${c}_intensity`, defaultValue: 0,   minValue: 0, maxValue: 1 },
        { name: `${c}_volume`,    defaultValue: 1,   minValue: 0, maxValue: 1 },
        { name: `${c}_bass`,      defaultValue: 0.7, minValue: 0, maxValue: 1 },
        { name: `${c}_texture`,   defaultValue: 0.5, minValue: 0, maxValue: 1 }
      );
    }
    for (let wi = 0; wi < WAVES.length; wi++) {
      const w = WAVES[wi];
      params.push(
        { name: `${w}_enabled`,   defaultValue: 0,   minValue: 0, maxValue: 1 },
        { name: `${w}_carrier`,   defaultValue: 200, minValue: 100, maxValue: 400 },
        { name: `${w}_beat`,      defaultValue: 10,  minValue: 1,   maxValue: 40 },
        { name: `${w}_intensity`, defaultValue: 0.5, minValue: 0,   maxValue: 1 },
        { name: `${w}_melodyVol`, defaultValue: 0.7, minValue: 0,   maxValue: 1 }
      );
    }
    params.push(
      { name: 'stereoDecorr',   defaultValue: 0,   minValue: 0, maxValue: 1 },
      { name: 'stereoWidth',    defaultValue: 2,   minValue: 0, maxValue: 2 },
      { name: 'harmonicSat',    defaultValue: 0,   minValue: 0, maxValue: 1 },
      { name: 'spectralDrift',  defaultValue: 0,   minValue: 0, maxValue: 1 },
      { name: 'temporalSmooth', defaultValue: 0,   minValue: 0, maxValue: 1 },
      { name: 'layerInteract',  defaultValue: 0,   minValue: 0, maxValue: 1 },
      { name: 'microRandom',    defaultValue: 0,   minValue: 0, maxValue: 1 },
      { name: 'treble',         defaultValue: 0.5, minValue: 0, maxValue: 1 },
      { name: 'mid',            defaultValue: 0.5, minValue: 0, maxValue: 1 },
      { name: 'pressure',       defaultValue: 0.5, minValue: 0, maxValue: 1 },
      { name: 'master',         defaultValue: 1,   minValue: 0, maxValue: 2 }
    );
    return params;
  }

  // ── RNG (identical to desktop) ────────────────────────────────────────
  rng() {
    this.rngState = (this.rngState * 1664525 + 1013904223) >>> 0;
    return (this.rngState / 4294967296) * 2 - 1;
  }

  // ── Noise generators (identical to desktop) ───────────────────────────
  genWhite() {
    const base = this.rng();
    const grit = (this.rng() - this.rng()) * 0.18;
    return (base * 0.82 + grit) * 0.80;
  }

  genPink(ch) {
    const st = this.pinkState[ch];
    const w = this.rng();
    st[0] = 0.99886*st[0] + w*0.0555179;
    st[1] = 0.99332*st[1] + w*0.0750759;
    st[2] = 0.96900*st[2] + w*0.1538520;
    st[3] = 0.86650*st[3] + w*0.3104856;
    st[4] = 0.55000*st[4] + w*0.5329522;
    st[5] = -0.7616*st[5] - w*0.0168980;
    const out = st[0]+st[1]+st[2]+st[3]+st[4]+st[5]+st[6]+w*0.5362;
    st[6] = w*0.115926;
    return out * 0.05;
  }

  genBrown(ch) {
    const w = this.rng() * 0.01;
    this.brownState[ch] += w;
    this.brownState[ch] *= 0.992;
    this.brownState[ch] = Math.max(-1, Math.min(1, this.brownState[ch]));
    return this.brownState[ch] * 0.6;
  }

  genGrey(ch) {
    const w = this.rng();
    const p = this.genPink(ch) * 0.18;
    const raw = w*0.62 + p;
    this.greyState[ch] = this.greyState[ch]*0.82 + raw*0.18;
    return this.greyState[ch] * 0.24;
  }

  genBlue(ch) {
    const w = this.rng();
    const diff = (w - this.lastBlue[ch]) * 2.5;
    this.lastBlue[ch] = w;
    return diff * 0.62;
  }

  genViolet() {
    const w = this.rng();
    const v = w - 0.5 * this.lastViolet;
    this.lastViolet = w;
    return v * 0.60;
  }

  genBlack(ch) {
    return this.genBrown(ch) * 0.7;
  }

  genGreen(ch) {
    const st = this.greenState[ch];
    const w = this.rng();
    st[0] = 0.9850*st[0] + w*0.1950;
    st[1] = 0.9650*st[1] + w*0.2350;
    st[2] = 0.9200*st[2] + w*0.2850;
    st[3] = 0.8500*st[3] + w*0.3350;
    return (st[0]+st[1]+st[2]+st[3]) * 0.1 * 1.25;
  }

  genGreenGrain(ch, textureAmount) {
    if (textureAmount <= 1e-4) { this.greenGrain[ch]=0; this.greenGrainLP[ch]=0; return 0; }
    const raw = this.rng();
    this.greenGrain[ch]   = this.greenGrain[ch]*0.88 + raw*0.12;
    this.greenGrainLP[ch] += (this.greenGrain[ch] - this.greenGrainLP[ch]) * 0.18;
    this.greenBreathPhase += 0.00004;
    const breathing = 1.0 + Math.sin(this.greenBreathPhase)*0.03;
    return this.greenGrainLP[ch] * breathing * Math.pow(textureAmount, 1.2) * 0.25;
  }

  // ── Main process ──────────────────────────────────────────────────────
  process(inputs, outputs, parameters) {
    // Notify React on first block
    if (!this._ready) {
      this._ready = true;
      this.port.postMessage({ type: 'ready' });
    }

    const output = outputs[0];
    const L = output[0];
    const R = output[1];
    if (!L || !R) return true;

    const blockSize = L.length;
    const sr = sampleRate;

    L.fill(0);
    R.fill(0);

    const COLORS = this._COLORS;
    const WAVES  = this._WAVES;

    // ── Check if anything is active ───────────────────────────────────
    let hasActive = false;
    for (let ci = 0; ci < COLORS.length; ci++) {
      const intensityParam = parameters[`${COLORS[ci]}_intensity`];
      const v = intensityParam.length > 1 ? Math.max(...intensityParam) : intensityParam[0];
      if (v > 0.001) { hasActive = true; break; }
    }
    if (!hasActive) {
      for (let wi = 0; wi < WAVES.length; wi++) {
        if (parameters[`${WAVES[wi]}_enabled`][0] > 0.5) { hasActive = true; break; }
      }
    }
    if (!hasActive) return true;

    // ── Block-level coefficients ──────────────────────────────────────
    const kDensity      = 1 - Math.exp(-blockSize / (sr * 0.05));
    const kSp           = 1 - Math.exp(-blockSize / (sr * 0.07));
    const kRampPerSample = 1 - Math.pow(1 - 0.05, 1 / blockSize);

    // Count active layers for mix compensation
    let activeCount = 0;
    for (let ci = 0; ci < COLORS.length; ci++) {
      if (parameters[`${COLORS[ci]}_intensity`][0] > 0.001) activeCount++;
    }
    for (let wi = 0; wi < WAVES.length; wi++) {
      if (parameters[`${WAVES[wi]}_enabled`][0] > 0.5) activeCount++;
    }
    const mixComp = 1 / Math.sqrt(Math.max(1, activeCount));
    const BASE_GAIN = 1.8;

    // ── Noise layers ──────────────────────────────────────────────────
    for (let ci = 0; ci < COLORS.length; ci++) {
      const color = COLORS[ci];

      const intensityParam = parameters[`${color}_intensity`];
      const intensity = intensityParam.length > 1
        ? Math.max(...intensityParam)
        : intensityParam[0];

      if (intensity < 0.001) {
        // Reset smoothing on inactive layers
        this.smoothedParams[color].intensity = 0;
        this.layerOnRamp[color] = 0;
        this.densityRamp[color] = 0;
        continue;
      }

      const volume  = parameters[`${color}_volume`][0];
      const bass    = parameters[`${color}_bass`][0];
      const texture = parameters[`${color}_texture`][0];

      const sp = this.smoothedParams[color];
      this.densityRamp[color] += (intensity - this.densityRamp[color]) * kDensity;
      sp.intensity += (this.densityRamp[color] - sp.intensity) * kSp;
      sp.volume    += (volume - sp.volume) * kSp;

      const filters = this.colorFilters[color];

      // Per-color bass bias (matches desktop character)
      const bassBoostDB = (bass - 0.5) * 12;

      for (let i = 0; i < blockSize; i++) {
        // Generate raw sample
        let sL, sR;
        switch(color) {
          case 'white':
            sL = this.genWhite(); sR = this.genWhite(); break;
          case 'pink':
            sL = this.genPink('L'); sR = this.genPink('R'); break;
          case 'brown': {
            const b = this.genBrown('L');
            const bR = this.genBrown('R');
            // Bass-controlled low-pass damping (matches desktop genBrown behavior)
            const dampCoeff = 0.5 + bass * 0.45;
            this.brownDamp.L = this.brownDamp.L * dampCoeff + b * (1 - dampCoeff);
            this.brownDamp.R = this.brownDamp.R * dampCoeff + bR * (1 - dampCoeff);
            sL = this.brownDamp.L; sR = this.brownDamp.R;
            break;
          }
          case 'grey':
            sL = this.genGrey('L'); sR = this.genGrey('R'); break;
          case 'blue':
            sL = this.genBlue('L'); sR = this.genBlue('R'); break;
          case 'violet': {
            const v = this.genViolet();
            sL = v; sR = v * 0.97 + this.rng() * 0.03; // slight stereo spread
            break;
          }
          case 'black': {
            const bk = this.genBlack('L');
            const bkR = this.genBlack('R');
            this.blackDamp.L = this.blackDamp.L * 0.85 + bk * 0.15;
            this.blackDamp.R = this.blackDamp.R * 0.85 + bkR * 0.15;
            sL = this.blackDamp.L; sR = this.blackDamp.R;
            break;
          }
          case 'green': {
            const g  = this.genGreen('L');
            const gR = this.genGreen('R');
            const grain  = this.genGreenGrain('L', texture);
            const grainR = this.genGreenGrain('R', texture);
            // Fill: smooth low-end bed
            this.greenFill.L += (g - this.greenFill.L) * 0.004;
            this.greenFill.R += (gR - this.greenFill.R) * 0.004;
            sL = g + grain + this.greenFill.L * 0.3;
            sR = gR + grainR + this.greenFill.R * 0.3;
            break;
          }
          default: sL = 0; sR = 0;
        }

        // Apply 2-biquad spectral shaping
        sL = filters.L[0].process(sL);
        sL = filters.L[1].process(sL);
        sR = filters.R[0].process(sR);
        sR = filters.R[1].process(sR);

        // Stereo width via M/S
        const width = 0.8;
        const mid  = (sL + sR) * 0.5;
        const side = (sL - sR) * 0.5 * width;
        sL = mid + side;
        sR = mid - side;

        // Advance layer ramp per sample
        this.layerOnRamp[color] += (1 - this.layerOnRamp[color]) * kRampPerSample;

        const gain = sp.intensity * sp.volume * BASE_GAIN * this.layerOnRamp[color] * mixComp;
        L[i] += sL * gain;
        R[i] += sR * gain;
      }
    }

    // ── Brainwaves (identical to desktop) ────────────────────────────
    for (let wi = 0; wi < WAVES.length; wi++) {
      const wave = WAVES[wi];
      if (parameters[`${wave}_enabled`][0] < 0.5) continue;

      const carrier   = parameters[`${wave}_carrier`][0];
      const beat      = parameters[`${wave}_beat`][0];
      const intensity = parameters[`${wave}_intensity`][0];
      const phases    = this.brainwavePhases[wave];
      const detuneTable = { alpha:0.0, theta:-0.35, delta:-0.6, beta:0.45, gamma:0.8 };
      const detune = detuneTable[wave] || 0;
      const carrierL = carrier * Math.pow(2, detune / 12);
      const carrierR = carrierL * Math.pow(2, beat / (carrierL * 12));
      const w = parameters.stereoWidth[0];

      for (let i = 0; i < blockSize; i++) {
        phases.L += (2 * Math.PI * carrierL) / sr;
        phases.R += (2 * Math.PI * carrierR) / sr;
        if (phases.L > 2*Math.PI) phases.L -= 2*Math.PI;
        if (phases.R > 2*Math.PI) phases.R -= 2*Math.PI;

        const oscL   = Math.sin(phases.L);
        const oscR   = Math.sin(phases.R);
        const signal = oscL * intensity * 0.15;
        const signalR = oscR * intensity * 0.15;
        const mid  = (signal + signalR) * 0.5;
        const side = (signal - signalR) * 0.5 * w;
        L[i] += mid + side;
        R[i] += mid - side;
      }
    }

    // ── Floor clamp (NaN/Inf guard) ───────────────────────────────────
    for (let i = 0; i < blockSize; i++) {
      if (!isFinite(L[i])) L[i] = 0;
      if (!isFinite(R[i])) R[i] = 0;
    }

    // ── Speaker HP filter (90Hz) — active when no headphones ─────────
    if (this._speakerMode) {
      const c = this._hpCoeff;
      let prevL = L[0], prevR = R[0];
      for (let i = 0; i < blockSize; i++) {
        const inL = L[i], inR = R[i];
        this._hpL = c * (this._hpL + inL - prevL);
        this._hpR = c * (this._hpR + inR - prevR);
        prevL = inL; prevR = inR;
        L[i] = this._hpL;
        R[i] = this._hpR;
      }
    }

    // ── Soft limiter ──────────────────────────────────────────────────
    for (let i = 0; i < blockSize; i++) {
  const absL = L[i] < 0 ? -L[i] : L[i];
  const absR = R[i] < 0 ? -R[i] : R[i];
  if (absL > 0.7) L[i] = Math.tanh(L[i] * 0.85) * 0.98;
  if (absR > 0.7) R[i] = Math.tanh(R[i] * 0.85) * 0.98;
}

    // ── Final floor clamp ─────────────────────────────────────────────
    for (let i = 0; i < blockSize; i++) {
      if (!isFinite(L[i])) L[i] = 0;
      if (!isFinite(R[i])) R[i] = 0;
    }

    return true;
  }
}

registerProcessor('realtime-engine', RealtimeEngineMobile);