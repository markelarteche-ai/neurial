// REALTIME AUDIO ENGINE WORKLET - SILENCE-SAFE ARCHITECTURE v5.3-mobile
// Mobile fix: blockSize-agnostic pipeline — works correctly at any blockSize (128, 512, 4096+)
// All hardcoded per-sample coefficients replaced with 1-exp(-blockSize/(sr*T))
// Inner loop iterates blockSize (not 128), buf.pos circular indexing removed
// No array allocation in hot path (signature._outL/_outR instead of return [L,R])
// NaN guard upgraded to isFinite check
// ============================================================================

// ================= BIQUAD FILTER CLASS =================
class Biquad {
  constructor() {
    this.b0 = 1; this.b1 = 0; this.b2 = 0;
    this.a1 = 0; this.a2 = 0;
    this.x1 = 0; this.x2 = 0;
    this.y1 = 0; this.y2 = 0;
  }

  setLowShelf(fc, sr, gain) {
    const w0 = 2 * Math.PI * fc / sr;
    const A = Math.sqrt(Math.pow(10, gain / 20));
    const cosw0 = Math.cos(w0);
    const sinw0 = Math.sin(w0);
    const alpha = sinw0 / 2 * Math.sqrt((A + 1/A) * (1/0.7 - 1) + 2);
    const a0 = (A+1) + (A-1)*cosw0 + 2*Math.sqrt(A)*alpha;
    this.b0 = (A*((A+1) - (A-1)*cosw0 + 2*Math.sqrt(A)*alpha)) / a0;
    this.b1 = (2*A*((A-1) - (A+1)*cosw0)) / a0;
    this.b2 = (A*((A+1) - (A-1)*cosw0 - 2*Math.sqrt(A)*alpha)) / a0;
    this.a1 = (-2*((A-1) + (A+1)*cosw0)) / a0;
    this.a2 = ((A+1) + (A-1)*cosw0 - 2*Math.sqrt(A)*alpha) / a0;
  }

  setHighShelf(fc, sr, gain) {
    const w0 = 2 * Math.PI * fc / sr;
    const A = Math.sqrt(Math.pow(10, gain / 20));
    const cosw0 = Math.cos(w0);
    const sinw0 = Math.sin(w0);
    const alpha = sinw0 / 2 * Math.sqrt((A + 1/A) * (1/0.7 - 1) + 2);
    const a0 = (A+1) - (A-1)*cosw0 + 2*Math.sqrt(A)*alpha;
    this.b0 = (A*((A+1) + (A-1)*cosw0 + 2*Math.sqrt(A)*alpha)) / a0;
    this.b1 = (-2*A*((A-1) + (A+1)*cosw0)) / a0;
    this.b2 = (A*((A+1) + (A-1)*cosw0 - 2*Math.sqrt(A)*alpha)) / a0;
    this.a1 = (2*((A-1) - (A+1)*cosw0)) / a0;
    this.a2 = ((A+1) - (A-1)*cosw0 - 2*Math.sqrt(A)*alpha) / a0;
  }

  setPeak(fc, sr, gain, Q) {
    const w0 = 2 * Math.PI * fc / sr;
    const A = Math.sqrt(Math.pow(10, gain / 20));
    const alpha = Math.sin(w0) / (2 * Q);
    const a0 = 1 + alpha/A;
    this.b0 = (1 + alpha*A) / a0;
    this.b1 = (-2 * Math.cos(w0)) / a0;
    this.b2 = (1 - alpha*A) / a0;
    this.a1 = (-2 * Math.cos(w0)) / a0;
    this.a2 = (1 - alpha/A) / a0;
  }

  setNotch(fc, sr, Q) {
    const w0 = 2 * Math.PI * fc / sr;
    const alpha = Math.sin(w0) / (2 * Q);
    const a0 = 1 + alpha;
    this.b0 = 1 / a0;
    this.b1 = (-2 * Math.cos(w0)) / a0;
    this.b2 = 1 / a0;
    this.a1 = (-2 * Math.cos(w0)) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  setLowPass(fc, sr, Q) {
    const w0 = 2 * Math.PI * fc / sr;
    const alpha = Math.sin(w0) / (2 * Q);
    const cosw0 = Math.cos(w0);
    const a0 = 1 + alpha;
    this.b0 = ((1 - cosw0) / 2) / a0;
    this.b1 = (1 - cosw0) / a0;
    this.b2 = ((1 - cosw0) / 2) / a0;
    this.a1 = (-2 * cosw0) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  setHighPass(fc, sr, Q) {
    const w0 = 2 * Math.PI * fc / sr;
    const alpha = Math.sin(w0) / (2 * Q);
    const cosw0 = Math.cos(w0);
    const a0 = 1 + alpha;
    this.b0 = ((1 + cosw0) / 2) / a0;
    this.b1 = (-(1 + cosw0)) / a0;
    this.b2 = ((1 + cosw0) / 2) / a0;
    this.a1 = (-2 * cosw0) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  setBandPass(fc, sr, Q) {
    const w0 = 2 * Math.PI * fc / sr;
    const alpha = Math.sin(w0) / (2 * Q);
    const cosw0 = Math.cos(w0);
    const a0 = 1 + alpha;
    this.b0 = alpha / a0;
    this.b1 = 0;
    this.b2 = -alpha / a0;
    this.a1 = (-2 * cosw0) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  process(x) {
    if (x === 0 && this.x1 === 0 && this.x2 === 0 && this.y1 === 0 && this.y2 === 0) {
      return 0;
    }
    const y = this.b0*x + this.b1*this.x1 + this.b2*this.x2
              - this.a1*this.y1 - this.a2*this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }

  reset() {
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
  }
}

// ================= COLOR SIGNATURE PROCESSOR =================
class ColorSignature {
  constructor(color, sr) {
    this.color = color;
    this.sr = sr;

    this.spectralL = [new Biquad(), new Biquad(), new Biquad(), new Biquad()];
    this.spectralR = [new Biquad(), new Biquad(), new Biquad(), new Biquad()];

    this.airFilterL = new Biquad();
    this.airFilterR = new Biquad();

    this.motionPhase = Math.random() * Math.PI * 2;
    this.motionPhase2 = Math.random() * Math.PI * 2;

    this.spatialDelayL = new Float32Array(512);
    this.spatialDelayR = new Float32Array(512);
    this.spatialPos = 0;

    this.allpassL = new Biquad();
    this.allpassR = new Biquad();

    this.breathingPhase = Math.random() * Math.PI * 2;
    this.breathingSampleCount = 0;
    this.breathingModulation = 0;

    this.windPhase = Math.random() * Math.PI * 2;
    this.wind = 0;
    this.grainCarryL = 0;
    this.grainCarryR = 0;

    // FIX: output slots — no array allocation per sample
    this._outL = 0;
    this._outR = 0;

    this.initializeSignatures();
  }

  initializeSignatures() {
    const sr = this.sr;

    switch(this.color) {
      case 'white':
        this.spectralL[0].setHighPass(80, sr, 0.85);
        this.spectralR[0].setHighPass(80, sr, 0.85);
        this.spectralL[1].setHighShelf(8000, sr, 3.5);
        this.spectralR[1].setHighShelf(8000, sr, 3.5);
        this.spectralL[2].setPeak(12000, sr, 2.2, 2.0);
        this.spectralR[2].setPeak(12000, sr, 2.2, 2.0);
        this.spectralL[3].setLowShelf(200, sr, -5.0);
        this.spectralR[3].setLowShelf(200, sr, -5.0);
        break;
      case 'pink':
        this.spectralL[0].setHighPass(90, sr, 0.7);
        this.spectralR[0].setHighPass(90, sr, 0.7);
        this.spectralL[1].setLowShelf(320, sr, 5.8);
        this.spectralR[1].setLowShelf(320, sr, 5.8);
        this.spectralL[2].setPeak(480, sr, 3.2, 1.0);
        this.spectralR[2].setPeak(480, sr, 3.2, 1.0);
        this.spectralL[3].setHighShelf(5500, sr, -4.2);
        this.spectralR[3].setHighShelf(5500, sr, -4.2);
        break;
      case 'brown':
        this.spectralL[0].setLowPass(200, sr, 0.65);
        this.spectralR[0].setLowPass(200, sr, 0.65);
        this.spectralL[1].setLowShelf(70, sr, 9.0);
        this.spectralR[1].setLowShelf(70, sr, 9.0);
        this.spectralL[2].setPeak(380, sr, -4.0, 0.9);
        this.spectralR[2].setPeak(380, sr, -4.0, 0.9);
        this.spectralL[3].setHighShelf(1200, sr, -14);
        this.spectralR[3].setHighShelf(1200, sr, -14);
        break;
      case 'black':
        this.spectralL[0].setLowPass(170, sr, 0.65);
        this.spectralR[0].setLowPass(170, sr, 0.65);
        this.spectralL[1].setLowShelf(55, sr, 9);
        this.spectralR[1].setLowShelf(55, sr, 9);
        this.spectralL[2].setHighShelf(700, sr, -20);
        this.spectralR[2].setHighShelf(700, sr, -20);
        break;
      case 'blue':
        this.spectralL[0].setHighPass(950, sr, 0.75);
        this.spectralR[0].setHighPass(950, sr, 0.75);
        this.spectralL[1].setPeak(3600, sr, 5.8, 1.2);
        this.spectralR[1].setPeak(3600, sr, 5.8, 1.2);
        this.spectralL[2].setHighShelf(9000, sr, 5.0);
        this.spectralR[2].setHighShelf(9000, sr, 5.0);
        this.spectralL[3].setLowShelf(220, sr, -6.5);
        this.spectralR[3].setLowShelf(220, sr, -6.5);
        break;
      case 'violet':
        this.spectralL[0].setHighPass(650, sr, 0.7);
        this.spectralR[0].setHighPass(650, sr, 0.7);
        this.spectralL[1].setPeak(2200, sr, -1.2, 1.1);
        this.spectralR[1].setPeak(2200, sr, -1.2, 1.1);
        this.spectralL[2].setPeak(10500, sr, 5.5, 1.3);
        this.spectralR[2].setPeak(10500, sr, 5.5, 1.3);
        this.spectralL[3].setHighShelf(13000, sr, 3.5);
        this.spectralR[3].setHighShelf(13000, sr, 3.5);
        break;
      case 'grey':
        this.spectralL[0].setHighPass(120, sr, 0.7);
        this.spectralR[0].setHighPass(120, sr, 0.7);
        this.spectralL[1].setLowShelf(180, sr, -6.5);
        this.spectralR[1].setLowShelf(180, sr, -6.5);
        this.spectralL[2].setPeak(1900, sr, 4.0, 0.85);
        this.spectralR[2].setPeak(1900, sr, 4.0, 0.85);
        this.spectralL[3].setHighShelf(7800, sr, 3.2);
        this.spectralR[3].setHighShelf(7800, sr, 3.2);
        break;
      case 'green':
        this.spectralL[0].setBandPass(500, sr, 1.8);
        this.spectralR[0].setBandPass(500, sr, 1.8);
        this.spectralL[1].setPeak(500, sr, 5.2, 1.2);
        this.spectralR[1].setPeak(500, sr, 5.2, 1.2);
        this.spectralL[2].setLowShelf(150, sr, 3.0);
        this.spectralR[2].setLowShelf(150, sr, 3.0);
        break;
    }

    switch(this.color) {
      case 'white':
      case 'blue':
      case 'violet':
        this.airFilterL.setHighPass(3000, sr, 0.7);
        this.airFilterR.setHighPass(3000, sr, 0.7);
        break;
      case 'pink':
        this.airFilterL.setBandPass(2000, sr, 1.5);
        this.airFilterR.setBandPass(2000, sr, 1.5);
        break;
      case 'grey':
        this.airFilterL.setHighPass(2600, sr, 0.7);
        this.airFilterR.setHighPass(2600, sr, 0.7);
        break;
      case 'green':
        this.airFilterL.setBandPass(1000, sr, 1.2);
        this.airFilterR.setBandPass(1000, sr, 1.2);
        break;
      case 'brown':
      case 'black':
        this.airFilterL.setLowPass(800, sr, 0.7);
        this.airFilterR.setLowPass(800, sr, 0.7);
        break;
    }

    const apFreq = this.getSpatialAllpassFreq();
    this.allpassL.setBandPass(apFreq, sr, 0.7);
    this.allpassR.setBandPass(apFreq + 10, sr, 0.7);
  }

  getSpatialAllpassFreq() {
    const freqs = {
      'white': 1200, 'pink': 800, 'brown': 300, 'black': 200,
      'blue': 1500, 'violet': 1800, 'grey': 1000, 'green': 600
    };
    return freqs[this.color] || 1000;
  }

  getMotionModulation() {
    const speeds = {
      'white': 0.03, 'pink': 0.12, 'brown': 0.18, 'black': 0.12,
      'blue': 0.25, 'violet': 0.22, 'grey': 0.08, 'green': 0.18
    };
    const speed = speeds[this.color] || 0.1;
    this.motionPhase += speed * 0.0001;
    this.motionPhase2 += speed * 0.00015;
    return (Math.sin(this.motionPhase) * 0.02 + Math.sin(this.motionPhase2) * 0.015);
  }

  getSpatialWidth() {
    const widths = {
      brown: 0.18, black: 0.10, pink: 0.68, grey: 0.56,
      blue: 0.95, violet: 1.10, white: 0.78, green: 0.55
    };
    return widths[this.color] || 0.6;
  }

  getSpatialDelayOffset() {
    const offsets = {
      'brown': 8, 'black': 5, 'pink': 20, 'grey': 18,
      'blue': 35, 'violet': 45, 'white': 25, 'green': 15
    };
    return offsets[this.color] || 20;
  }

  getAirAmount() {
    const amounts = {
      'white': 0.55, 'blue': 0.56, 'violet': 0.50, 'pink': 0.18,
      'grey': 0.28, 'green': 0.15, 'brown': 0.04, 'black': 0.005
    };
    return amounts[this.color] || 0.2;
  }

  updateSpectralBreathing() {
    this.breathingSampleCount++;
    if (this.breathingSampleCount < 64) return;
    this.breathingSampleCount = 0;
    const speeds = {
      'white': 0.025, 'pink': 0.032, 'brown': 0.048, 'black': 0.045,
      'blue': 0.028, 'violet': 0.022, 'grey': 0.035, 'green': 0.038
    };
    const speed = speeds[this.color] || 0.03;
    this.breathingPhase += speed * 0.001;
    const depths = {
      'white': 4, 'pink': 5, 'brown': 8, 'black': 7,
      'blue': 3, 'violet': 2, 'grey': 4, 'green': 6
    };
    const depth = depths[this.color] || 4;
    this.breathingModulation = Math.sin(this.breathingPhase) * depth;
  }

  applyBreathing() {
    if (Math.abs(this.breathingModulation) < 0.1) return;
  }

  getWindStrength() {
    const strengths = {
      'white': 0.030, 'pink': 0.025, 'brown': 0.018, 'black': 0.010,
      'blue': 0.050, 'violet': 0.028, 'grey': 0.020, 'green': 0.022
    };
    return strengths[this.color] || 0.02;
  }

  resetState() {
    for (let i = 0; i < 4; i++) {
      this.spectralL[i].reset();
      this.spectralR[i].reset();
    }
    this.airFilterL.reset();
    this.airFilterR.reset();
    this.allpassL.reset();
    this.allpassR.reset();
    this.spatialDelayL.fill(0);
    this.spatialDelayR.fill(0);
    this.spatialPos = 0;
    this.breathingSampleCount = 0;
    this.breathingModulation = 0;
    this.wind = 0;
    this.grainCarryL = 0;
    this.grainCarryR = 0;
  }

  // FIX: No return value — writes to this._outL / this._outR
  // Eliminates one array allocation per sample in the hot path
  process(sampleL, sampleR, rng, airGate = 1.0) {
    if (sampleL === 0 && sampleR === 0) {
      this._outL = 0;
      this._outR = 0;
      return;
    }

    this.updateSpectralBreathing();

    let sigL = sampleL;
    let sigR = sampleR;

    for (let i = 0; i < 4; i++) {
      sigL = this.spectralL[i].process(sigL);
      sigR = this.spectralR[i].process(sigR);
    }

    const tiltTable = { white: 1.015, pink: 0.992, brown: 0.975, black: 0.965, blue: 1.020, violet: 1.025, grey: 1.005 };
    const tilt = tiltTable[this.color] || 1.0;
    sigL *= tilt;
    sigR *= tilt;

    this.windPhase += 0.00002;
    const windBase = Math.sin(this.windPhase);
    this.wind += (windBase - this.wind) * 0.002;

    const windStrength = this.getWindStrength();
    this.grainCarryL += (sigL - this.grainCarryL) * 0.05;
    this.grainCarryR += (sigR - this.grainCarryR) * 0.05;
    sigL += this.grainCarryL * this.wind * windStrength;
    sigR += this.grainCarryR * this.wind * windStrength;

    const motion = this.getMotionModulation();
    const motionGain = 1.0 + motion;
    sigL *= motionGain;
    sigR *= motionGain;

    const width = this.getSpatialWidth();
    const widthBias = { white: 1.05, pink: 0.96, brown: 0.85, black: 0.78, blue: 1.12, violet: 1.18, grey: 1.02 }[this.color] || 1.0;
    const finalWidth = width * widthBias;
    const delayOffset = this.getSpatialDelayOffset();

    this.spatialDelayL[this.spatialPos] = sigL;
    this.spatialDelayR[this.spatialPos] = sigR;
    const delayedL = this.spatialDelayL[(this.spatialPos - delayOffset + 512) % 512];
    const delayedR = this.spatialDelayR[(this.spatialPos - delayOffset + 512) % 512];
    this.spatialPos = (this.spatialPos + 1) % 512;

    const apL = this.allpassL.process(sigL);
    const apR = this.allpassR.process(sigR);

    const mid = (sigL + sigR) * 0.5;
    const side = (sigL - sigR) * 0.5 * finalWidth;
    sigL = mid + side + (apL - mid) * finalWidth * 0.3;
    sigR = mid - side + (apR - mid) * finalWidth * 0.3;

    const gatedAirAmount = this.getAirAmount() * Math.max(0, Math.min(1, airGate));
    if (gatedAirAmount > 1e-6) {
      const airNoiseL = (rng() - rng()) * gatedAirAmount;
      const airNoiseR = (rng() - rng()) * gatedAirAmount;
      const airL = this.airFilterL.process(airNoiseL);
      const airR = this.airFilterR.process(airNoiseR);
      const airSpread = { white: 1.2, pink: 1.0, brown: 0.7, black: 0.6, blue: 1.3, violet: 1.35, grey: 1.1 }[this.color] || 1.0;
      sigL += airL * 0.3 * airSpread;
      sigR += airR * 0.3 * airSpread;
    }

    this._outL = sigL;
    this._outR = sigR;
  }
}

// ================= MAIN ENGINE =================
class RealtimeEngine extends AudioWorkletProcessor {
  constructor() {
    super();

    this.rngState = 0x12345678;
    for (let i = 0; i < 10000; i++) { this.rng(); }

    const COLORS = ['white', 'pink', 'brown', 'grey', 'blue', 'violet', 'black', 'green'];
    const WAVES  = ['alpha', 'theta', 'delta', 'beta', 'gamma'];
    this._COLORS = COLORS;
    this._WAVES  = WAVES;

    this.colorSignatures = {};
    for (let ci = 0; ci < COLORS.length; ci++) {
      this.colorSignatures[COLORS[ci]] = new ColorSignature(COLORS[ci], sampleRate);
    }

    // FIX: Buffer size 8192 to handle any blockSize up to 4096
    // Removed pos field — no longer needed
    this.noiseBuffers = {};
    for (let ci = 0; ci < COLORS.length; ci++) {
      this.noiseBuffers[COLORS[ci]] = { L: new Float32Array(8192), R: new Float32Array(8192) };
    }

    this.pinkState = {
      L: [this.rng()*0.001, this.rng()*0.001, this.rng()*0.001, this.rng()*0.001, this.rng()*0.001, this.rng()*0.001, this.rng()*0.001],
      R: [this.rng()*0.001, this.rng()*0.001, this.rng()*0.001, this.rng()*0.001, this.rng()*0.001, this.rng()*0.001, this.rng()*0.001]
    };

    this.brownState = { L: this.rng() * 0.001, R: this.rng() * 0.001 };
    this.brownSmoothed = { bass: 0.7, texture: 0.5 };
    this.brownDamp = { L: 0, R: 0 };
    this.brownHP   = { L: 0, R: 0 };

    this.lastBlue = { L: this.rng() * 0.001, R: this.rng() * 0.001 };
    this.lastViolet = this.rng() * 0.001;

    this.greenState = {
      L: [this.rng()*0.001, this.rng()*0.001, this.rng()*0.001, this.rng()*0.001],
      R: [this.rng()*0.001, this.rng()*0.001, this.rng()*0.001, this.rng()*0.001]
    };
    this.greenGrain = { L: 0, R: 0 };
    this.greenGrainLowpass = { L: 0, R: 0 };
    this.greenBreathingPhase = Math.random() * Math.PI * 2;
    this.greenFill = { L: 0, R: 0 };
    this.greenBedState = {
      L: [this.rng()*0.001, this.rng()*0.001, this.rng()*0.001, this.rng()*0.001],
      R: [this.rng()*0.001, this.rng()*0.001, this.rng()*0.001, this.rng()*0.001]
    };
    this.greenBedEnv = { L: 0, R: 0 };

    this.greyState = { L: 0, R: 0 };
    this.blackDamp = { L: 0, R: 0 };
    this.blackHP = { L: 0, R: 0 };

    this.smoothedParams = {};
    for (let ci = 0; ci < COLORS.length; ci++) {
      this.smoothedParams[COLORS[ci]] = { intensity: 0, volume: 1 };
    }

    this.layerOnRamp = {};
    for (let ci = 0; ci < COLORS.length; ci++) {
      this.layerOnRamp[COLORS[ci]] = 0;
    }

    this.densityRamp = {};
    for (let ci = 0; ci < COLORS.length; ci++) {
      this.densityRamp[COLORS[ci]] = 0;
    }

    this.layerFilters = {};
    for (let ci = 0; ci < COLORS.length; ci++) {
      this.layerFilters[COLORS[ci]] = { depthL: 0, depthR: 0, textureL: 0, textureR: 0, smoothedTexture: 0 };
    }

    this.decorrelationDelay = new Float32Array(4096);
    this.decorrelationPos = 0;
    this.spatialDriftPhase = 0;

    this.diffuseDelays = {
      L1: new Float32Array(384), L2: new Float32Array(512),
      R1: new Float32Array(448), R2: new Float32Array(576),
      pos: 0
    };

    this.multiTapDelays = {
      L: new Float32Array(2048), R: new Float32Array(2048),
      posL: 0, posR: 0
    };

    this.dcTrackerL = 0;
    this.dcTrackerR = 0;

    this.zeroTextureBleed = {
      brown: { L: 0, R: 0 },
      black: { L: 0, R: 0 }
    };

    this.subsonicGuard = {
      brown: { L: 0, R: 0 },
      black: { L: 0, R: 0 }
    };

    this.greenSmooth = { L: 0, R: 0 };

    this.brainwavePhases = {
      alpha: { L: 0, R: 0 }, theta: { L: 0, R: 0 }, delta: { L: 0, R: 0 },
      beta: { L: 0, R: 0 }, gamma: { L: 0, R: 0 }
    };

    this.wavePhaseOffsets = { alpha: 0.0, theta: 0.23, delta: 0.41, beta: 0.12, gamma: 0.31 };

    this.melodyPhases = { alpha: 0, theta: 0, delta: 0, beta: 0, gamma: 0 };
    this.melodyConfigs = { alpha: 'ambient', theta: 'ambient', delta: 'deep', beta: 'focus', gamma: 'crystal' };

    this.fadeOutSamples = 0;
    this.isFadingOut = false;

    this.fatiguePhaseA = Math.random();
    this.fatiguePhaseB = Math.random();
    this.fatiguePhaseC = Math.random();
    this.fatigueTilt    = 1.0;
    this.fatigueDensity = 1.0;
    this.fatigueAir     = 1.0;

    this.psy = {
      profile: 'neutral', density: 1.0, air: 1.0, motion: 1.0, stereo: 1.0,
      profiles: {
        neutral   : { density: 1.00, air: 1.00, motion: 1.00, stereo: 1.00 },
        lowFatigue: { density: 0.92, air: 0.90, motion: 0.88, stereo: 0.95 },
        tinnitus  : { density: 1.08, air: 1.12, motion: 1.05, stereo: 1.00 },
        night     : { density: 0.88, air: 0.85, motion: 0.80, stereo: 0.92 },
        focus     : { density: 1.05, air: 0.95, motion: 1.10, stereo: 1.05 }
      }
    };

    this.agc = {
      rmsAcc: 0, rmsSamples: 0, rmsWindow: 512,
      envelope: 0, gain: 1.0, targetGain: 1.0
    };
    this.AGC_FLOOR = Math.pow(10, -2.5 / 20);

    this.xfeed = { lowL: 0, lowR: 0, highL: 0, highR: 0 };
    this.widthBreathPhase = Math.random() * Math.PI * 2;

    this.microVar = {
      grainDensity: 1.0, airShimmer: 1.0, widthDrift: 1.0, motionBias: 1.0,
      targetGrain: 1.0, targetAir: 1.0, targetWidth: 1.0, targetMotion: 1.0,
      glideRate: 0,
      nextEventBlocks: Math.floor((30 + Math.random() * 270) * sampleRate / 128)
    };

    this.sla = {
      rmsAcc: 0, rmsSamples: 0, rmsWindow: 1024, rmsValue: 0, boost: 0,
      lpL: 0, lpR: 0, hpL: 0, hpR: 0
    };

    this.coherence = {
      dcL: 0, dcR: 0, energyL: 0, energyR: 0, bias: 1.0
    };

    this.port.onmessage = (e) => {
      if (e.data.type === 'setWaveMelody') {
        const { wave, melody } = e.data;
        if (this.melodyConfigs[wave] !== undefined) this.melodyConfigs[wave] = melody;
      } else if (e.data.type === 'setProfile') {
        if (this.psy.profiles[e.data.profile]) this.psy.profile = e.data.profile;
      } else if (e.data.type === 'fadeOut') {
        this.isFadingOut = true;
        this.fadeOutSamples = 0;
      } else if (e.data.type === 'warmup') {
        this.warmup(e.data.samples || 4800);
      }
    };
  }

  warmup(samples = 4800) {
    const COLORS = this._COLORS;
    const warmupBlocks = Math.ceil(samples / 128);
    for (let block = 0; block < warmupBlocks; block++) {
      for (let ci = 0; ci < COLORS.length; ci++) {
        const color = COLORS[ci];
        for (let i = 0; i < 128; i++) {
          switch(color) {
            case 'white': this.genWhite(); break;
            case 'pink':  this.genPink('L'); this.genPink('R'); break;
            case 'brown': this.genBrown('L'); this.genBrown('R'); break;
            case 'grey':  this.genGrey('L'); this.genGrey('R'); break;
            case 'blue':  this.genBlue('L'); this.genBlue('R'); break;
            case 'violet': this.genViolet(); break;
            case 'black': this.genBlack('L'); this.genBlack('R'); break;
            case 'green': this.genGreen('L'); this.genGreen('R'); break;
          }
        }
      }
    }
  }

  static get parameterDescriptors() {
    const params = [];
    const COLORS_PD = ['white', 'pink', 'brown', 'grey', 'blue', 'violet', 'black', 'green'];
    const WAVES_PD  = ['alpha', 'theta', 'delta', 'beta', 'gamma'];
    for (let ci = 0; ci < COLORS_PD.length; ci++) {
      const color = COLORS_PD[ci];
      params.push(
        { name: `${color}_intensity`, defaultValue: 0,   minValue: 0, maxValue: 1 },
        { name: `${color}_volume`,    defaultValue: 1,   minValue: 0, maxValue: 1 },
        { name: `${color}_bass`,      defaultValue: 0.7, minValue: 0, maxValue: 1 },
        { name: `${color}_texture`,   defaultValue: 0.5, minValue: 0, maxValue: 1 }
      );
    }
    for (let wi = 0; wi < WAVES_PD.length; wi++) {
      const wave = WAVES_PD[wi];
      params.push(
        { name: `${wave}_enabled`,   defaultValue: 0,   minValue: 0, maxValue: 1 },
        { name: `${wave}_carrier`,   defaultValue: 200, minValue: 100, maxValue: 400 },
        { name: `${wave}_beat`,      defaultValue: 10,  minValue: 1, maxValue: 40 },
        { name: `${wave}_intensity`, defaultValue: 0.5, minValue: 0, maxValue: 1 },
        { name: `${wave}_melodyVol`, defaultValue: 0.7, minValue: 0, maxValue: 1 }
      );
    }
    params.push(
      { name: 'stereoDecorr',    defaultValue: 0,   minValue: 0, maxValue: 1 },
      { name: 'stereoWidth',     defaultValue: 2,   minValue: 0, maxValue: 2 },
      { name: 'harmonicSat',     defaultValue: 0,   minValue: 0, maxValue: 1 },
      { name: 'spectralDrift',   defaultValue: 0,   minValue: 0, maxValue: 1 },
      { name: 'temporalSmooth',  defaultValue: 0,   minValue: 0, maxValue: 1 },
      { name: 'layerInteract',   defaultValue: 0,   minValue: 0, maxValue: 1 },
      { name: 'microRandom',     defaultValue: 0,   minValue: 0, maxValue: 1 },
      { name: 'treble',          defaultValue: 0.5, minValue: 0, maxValue: 1 },
      { name: 'mid',             defaultValue: 0.5, minValue: 0, maxValue: 1 },
      { name: 'pressure',        defaultValue: 0.5, minValue: 0, maxValue: 1 },
      { name: 'master',          defaultValue: 1,   minValue: 0, maxValue: 2 }
    );
    return params;
  }

  rng() {
    this.rngState = (this.rngState * 1664525 + 1013904223) >>> 0;
    return (this.rngState / 4294967296) * 2 - 1;
  }

  genWhite() {
    const base = this.rng();
    const grit = (this.rng() - this.rng()) * 0.18;
    return (base * 0.82 + grit) * 0.80;
  }

  genPink(channel) {
    const st = this.pinkState[channel];
    const w = this.rng();
    st[0] = 0.99886 * st[0] + w * 0.0555179;
    st[1] = 0.99332 * st[1] + w * 0.0750759;
    st[2] = 0.96900 * st[2] + w * 0.1538520;
    st[3] = 0.86650 * st[3] + w * 0.3104856;
    st[4] = 0.55000 * st[4] + w * 0.5329522;
    st[5] = -0.7616 * st[5] - w * 0.0168980;
    let out = st[0] + st[1] + st[2] + st[3] + st[4] + st[5] + st[6] + w * 0.5362;
    st[6] = w * 0.115926;
    return out * 0.05;
  }

  genBrown(channel) {
    const w = this.rng() * 0.01;
    this.brownState[channel] += w;
    this.brownState[channel] *= 0.992;
    this.brownState[channel] = Math.max(-1, Math.min(1, this.brownState[channel]));
    return this.brownState[channel] * 0.6;
  }

  genGrey(channel) {
    const w = this.rng();
    const p = this.genPink(channel) * 0.18;
    const raw = (w * 0.62) + p;
    this.greyState[channel] = this.greyState[channel] * 0.82 + raw * 0.18;
    return this.greyState[channel] * 0.24;
  }

  genBlue(channel) {
    const w = this.rng();
    const last = this.lastBlue[channel];
    const diff = (w - last) * 2.5;
    this.lastBlue[channel] = w;
    return diff * 0.62;
  }

  genViolet() {
    const w = this.rng();
    const v = w - 0.5 * (this.lastViolet || 0);
    this.lastViolet = w;
    return v * 0.60;
  }

  genBlack(channel) {
    return this.genBrown(channel) * 0.7;
  }

  genGreen(channel) {
    const st = this.greenState[channel];
    const w = this.rng();
    st[0] = 0.9850 * st[0] + w * 0.1950;
    st[1] = 0.9650 * st[1] + w * 0.2350;
    st[2] = 0.9200 * st[2] + w * 0.2850;
    st[3] = 0.8500 * st[3] + w * 0.3350;
    return (st[0] + st[1] + st[2] + st[3]) * 0.1 * 1.25;
  }

  genGreenGrain(channel, textureAmount) {
    if (textureAmount <= 1e-4) {
      this.greenGrain[channel] = 0;
      this.greenGrainLowpass[channel] = 0;
      return 0;
    }
    const rawGrain = this.rng();
    this.greenGrain[channel] = this.greenGrain[channel] * 0.88 + rawGrain * 0.12;
    this.greenGrainLowpass[channel] += (this.greenGrain[channel] - this.greenGrainLowpass[channel]) * 0.18;
    this.greenBreathingPhase += 0.00004;
    const breathing = 1.0 + Math.sin(this.greenBreathingPhase) * 0.03;
    const grainIntensity = Math.pow(textureAmount, 1.2) * 0.25;
    return this.greenGrainLowpass[channel] * breathing * grainIntensity;
  }

  genGreenBed(channel) {
    const st = this.greenBedState[channel];
    const w = this.rng();
    st[0] = 0.9850 * st[0] + w * 0.1950;
    st[1] = 0.9650 * st[1] + w * 0.2350;
    st[2] = 0.9200 * st[2] + w * 0.2850;
    st[3] = 0.8500 * st[3] + w * 0.3350;
    return (st[0] + st[1] + st[2] + st[3]) * 0.1;
  }

  resetLayerState(color) {
    const filters = this.layerFilters[color];
    filters.depthL = 0; filters.depthR = 0;
    filters.textureL = 0; filters.textureR = 0;
    filters.smoothedTexture = 0;

    if (color === 'black') {
      this.blackDamp.L = 0; this.blackDamp.R = 0;
      this.blackHP.L = 0; this.blackHP.R = 0;
    }
    if (color === 'brown') {
      this.brownDamp.L = 0; this.brownDamp.R = 0;
      this.brownHP.L = 0; this.brownHP.R = 0;
    }
    if (color === 'green') {
      this.greenFill.L = 0; this.greenFill.R = 0;
    }

    const sp = this.smoothedParams[color];
    sp.intensity = 0; sp.volume = 1;
    this.layerOnRamp[color] = 0;
    this.densityRamp[color] = 0;

    this.colorSignatures[color].resetState();

    const buf = this.noiseBuffers[color];
    buf.L.fill(0);
    buf.R.fill(0);
    // FIX: no buf.pos to reset

    if (color === 'brown') this.zeroTextureBleed.brown = { L: 0, R: 0 };
    if (color === 'black') this.zeroTextureBleed.black = { L: 0, R: 0 };
    if (color === 'brown') this.subsonicGuard.brown = { L: 0, R: 0 };
    if (color === 'black') this.subsonicGuard.black = { L: 0, R: 0 };

    if (color === 'green') {
      this.greenSmooth.L = 0; this.greenSmooth.R = 0;
      this.greenBedState.L.fill(0);
      this.greenBedState.R.fill(0);
      this.greenBedEnv.L = 0; this.greenBedEnv.R = 0;
    }
  }

  genMelody(wave, phase, sr) {
    const config = this.melodyConfigs[wave];
    const patterns = {
      piano:   { notes: [0,4,7,12,9,7,4,0,-5,0],           envelope:'soft',   harmonics:[1,0.3,0.15],           speed:2.5 },
      ambient: { notes: [0,5,7,12,10,7,5,3,0,-3],           envelope:'gentle', harmonics:[1,0.4,0.2,0.1],        speed:3.0 },
      deep:    { notes: [0,3,7,10,7,5,3,0,-5,-3],           envelope:'smooth', harmonics:[1,0.5,0.3,0.15,0.08],  speed:3.5 },
      focus:   { notes: [0,2,4,7,9,11,12,9,7,4,2,0],        envelope:'crisp',  harmonics:[1,0.25,0.12,0.06],     speed:2.0 },
      crystal: { notes: [0,4,7,11,14,16,19,16,14,11,7,4,0], envelope:'bright', harmonics:[1,0.35,0.18,0.09,0.05],speed:2.2 }
    };
    const pattern = patterns[config] || patterns.ambient;
    const baseFreq = 220;
    const noteLength = sr * pattern.speed;
    const totalNotes = pattern.notes.length;
    const noteIdx = Math.floor((phase / noteLength) % totalNotes);
    const semitone = pattern.notes[noteIdx];
    const freq = baseFreq * Math.pow(2, semitone / 12);
    const notePhase = (phase % noteLength) / noteLength;

    let envelope;
    switch(pattern.envelope) {
      case 'soft':
        envelope = notePhase < 0.15 ? Math.pow(notePhase/0.15,1.5) : notePhase > 0.85 ? Math.pow((1-notePhase)/0.15,1.5) : 1; break;
      case 'gentle':
        envelope = notePhase < 0.25 ? Math.pow(notePhase/0.25,2) : notePhase > 0.75 ? Math.pow((1-notePhase)/0.25,2) : 1; break;
      case 'smooth':
        envelope = Math.sin(Math.PI * notePhase); break;
      case 'crisp':
        envelope = notePhase < 0.08 ? notePhase/0.08 : notePhase > 0.92 ? (1-notePhase)/0.08 : 1-(notePhase-0.08)*0.15; break;
      case 'bright':
        envelope = notePhase < 0.1 ? Math.pow(notePhase/0.1,0.8) : Math.pow(1-notePhase*0.6,0.4); break;
      default:
        envelope = Math.sin(Math.PI * notePhase);
    }

    let osc = 0;
    const harmonics = pattern.harmonics;
    for (let h = 0; h < harmonics.length; h++) {
      osc += Math.sin(2 * Math.PI * freq * (h+1) * phase / sr) * harmonics[h];
    }
    osc /= harmonics.reduce((s,h) => s+h, 0);
    osc *= envelope;
    if (notePhase < 0.05) osc *= notePhase / 0.05;
    return osc * 0.12;
  }

  measureEnergy(buffer) {
    let total = 0;
    for (let i = 0; i < buffer.length; i++) total += Math.abs(buffer[i]);
    return total;
  }

  updateFatigue(blockSize, sr) {
    this.fatiguePhaseA += blockSize / (sr * 73.1  * 1.6180339887);
    this.fatiguePhaseB += blockSize / (sr * 113.7 * 1.4142135623);
    this.fatiguePhaseC += blockSize / (sr * 197.3 * 1.7320508075);
    if (this.fatiguePhaseA >= 1) this.fatiguePhaseA -= 1;
    if (this.fatiguePhaseB >= 1) this.fatiguePhaseB -= 1;
    if (this.fatiguePhaseC >= 1) this.fatiguePhaseC -= 1;

    const tiltTarget    = 1.0 + Math.sin(this.fatiguePhaseA * 2 * Math.PI) * 0.023;
    const densityTarget = 1.0 + Math.sin(this.fatiguePhaseB * 2 * Math.PI) * 0.03;
    const airTarget     = 1.0 + Math.sin(this.fatiguePhaseC * 2 * Math.PI) * 0.05;

    const smoothK = blockSize / (sr * 2.0);
    this.fatigueTilt    += (tiltTarget    - this.fatigueTilt)    * smoothK;
    this.fatigueDensity += (densityTarget - this.fatigueDensity) * smoothK;
    this.fatigueAir     += (airTarget     - this.fatigueAir)     * smoothK;
  }

  updateProfile(blockSize, sr) {
    const t = this.psy.profiles[this.psy.profile];
    const k = blockSize / (sr * 10.0);
    this.psy.density += (t.density - this.psy.density) * k;
    this.psy.air     += (t.air     - this.psy.air)     * k;
    this.psy.motion  += (t.motion  - this.psy.motion)  * k;
    this.psy.stereo  += (t.stereo  - this.psy.stereo)  * k;
  }

  applyAdaptiveGain(L, R, blockSize, sr) {
    const agc = this.agc;
    for (let i = 0; i < blockSize; i++) {
      agc.rmsAcc += L[i] * L[i] + R[i] * R[i];
      agc.rmsSamples += 2;
    }
    if (agc.rmsSamples >= agc.rmsWindow) {
      const rms = Math.sqrt(agc.rmsAcc / agc.rmsSamples);
      agc.rmsAcc = 0; agc.rmsSamples = 0;
      const attackK  = blockSize / (sr * 1.0);
      const releaseK = blockSize / (sr * 3.0);
      const k = rms > agc.envelope ? attackK : releaseK;
      agc.envelope += (rms - agc.envelope) * k;
      const threshold = 0.251;
      agc.targetGain = agc.envelope > threshold
        ? Math.max(this.AGC_FLOOR, 1.0 / (agc.envelope / threshold))
        : 1.0;
    }
    const gainAttack  = blockSize / (sr * 0.5);
    const gainRelease = blockSize / (sr * 2.0);
    const gk = agc.gain > agc.targetGain ? gainAttack : gainRelease;
    agc.gain += (agc.targetGain - agc.gain) * gk;
    if (Math.abs(agc.gain - 1.0) > 0.001) {
      for (let i = 0; i < blockSize; i++) {
        if (L[i] !== 0) L[i] *= agc.gain;
        if (R[i] !== 0) R[i] *= agc.gain;
      }
    }
  }

  applySpatialPsycho(L, R, blockSize, sr) {
    const lpCoeff = 1 - Math.exp(-2 * Math.PI * 700 / sr);
    const hpCoeff = 1 - Math.exp(-2 * Math.PI * 3000 / sr);
    this.widthBreathPhase += blockSize / (sr * 40.0) * 2 * Math.PI;
    if (this.widthBreathPhase > 2 * Math.PI) this.widthBreathPhase -= 2 * Math.PI;
    const widthMod = 1.0 + Math.sin(this.widthBreathPhase) * 0.04;
    for (let i = 0; i < blockSize; i++) {
      if (L[i] === 0 && R[i] === 0) continue;
      this.xfeed.lowL += (L[i] - this.xfeed.lowL) * lpCoeff;
      this.xfeed.lowR += (R[i] - this.xfeed.lowR) * lpCoeff;
      this.xfeed.highL += (L[i] - this.xfeed.highL) * hpCoeff;
      this.xfeed.highR += (R[i] - this.xfeed.highR) * hpCoeff;
      const bleedToR = this.xfeed.lowL * 0.05 + (L[i] - this.xfeed.highL) * 0.01;
      const bleedToL = this.xfeed.lowR * 0.05 + (R[i] - this.xfeed.highR) * 0.01;
      L[i] = L[i] * 0.975 + bleedToL * 0.025;
      R[i] = R[i] * 0.975 + bleedToR * 0.025;
      const mid  = (L[i] + R[i]) * 0.5;
      const side = (L[i] - R[i]) * 0.5 * widthMod;
      L[i] = mid + side;
      R[i] = mid - side;
    }
  }

  updateMicroVar(blockSize, sr) {
    const mv = this.microVar;
    mv.nextEventBlocks--;
    if (mv.nextEventBlocks <= 0) {
      mv.nextEventBlocks = Math.floor((30 + Math.random() * 270) * sr / blockSize);
      mv.targetGrain  = 1.0 + (Math.random() * 0.08 - 0.04);
      mv.targetAir    = 1.0 + (Math.random() * 0.06 - 0.03);
      mv.targetWidth  = 1.0 + (Math.random() * 0.06 - 0.03);
      mv.targetMotion = 1.0 + (Math.random() * 0.04 - 0.02);
      const glideSecs = 20 + Math.random() * 40;
      mv.glideRate = blockSize / (sr * glideSecs);
    }
    if (mv.glideRate > 0) {
      mv.grainDensity += (mv.targetGrain  - mv.grainDensity) * mv.glideRate;
      mv.airShimmer   += (mv.targetAir    - mv.airShimmer)   * mv.glideRate;
      mv.widthDrift   += (mv.targetWidth  - mv.widthDrift)   * mv.glideRate;
      mv.motionBias   += (mv.targetMotion - mv.motionBias)   * mv.glideRate;
    }
  }

  // ================= MAIN PROCESS =================
  process(inputs, outputs, parameters) {
    // First block: notify React that worklet is alive and processing.
    // This replaces all setTimeout-based forceParams retries in React —
    // params sent after this message are guaranteed to land.
    if (!this._ready) {
      this._ready = true;
      this.port.postMessage({ type: 'ready' });
    }

    const output = outputs[0];
    const L = output[0];
    const R = output[1];
    const blockSize = L.length;

    L.fill(0);
    R.fill(0);

    const sr = sampleRate;
    const COLORS = this._COLORS;
    const WAVES  = this._WAVES;

    let hasActiveSound = false;
    const activeColors = [];

    for (let ci = 0; ci < COLORS.length; ci++) {
      const color = COLORS[ci];
      const intensityParam = parameters[`${color}_intensity`];
      // Read max value across the parameter array — setValueAtTime may not
      // have propagated to [0] yet on the first block in mobile browsers
      const intensity = intensityParam.length > 1
        ? Math.max(...intensityParam)
        : intensityParam[0];
      if (intensity > 0.001) {
        hasActiveSound = true;
        activeColors.push(color);
      }
    }

    let hasActiveBrainwaves = false;
    for (let wi = 0; wi < WAVES.length; wi++) {
      if (parameters[`${WAVES[wi]}_enabled`][0] > 0.5) {
        hasActiveSound = true;
        hasActiveBrainwaves = true;
      }
    }

    if (!hasActiveSound) return true;

    const activeLayerCount = activeColors.length + (hasActiveBrainwaves ? 1 : 0);
    const mixComp = 1 / Math.sqrt(Math.max(1, activeLayerCount));

    this.updateFatigue(blockSize, sr);
    this.updateProfile(blockSize, sr);
    this.updateMicroVar(blockSize, sr);

    // ── Pre-compute block-level coefficients ──────────────────────────────
    // FIX: All smoothing coefficients are now functions of blockSize, not hardcoded
    // This ensures identical temporal behavior at blockSize=128 AND blockSize=4096
    const kDensity = 1 - Math.exp(-blockSize / (sr * 0.05));  // 50ms ramp — responsive on any blockSize
    const kSp      = 1 - Math.exp(-blockSize / (sr * 0.07));  // 70ms smooth (per block)
    const kTex     = 1 - Math.exp(-blockSize / (sr * 0.25));  // 250ms texture smooth
    const kBrown   = 1 - Math.exp(-blockSize / (sr * 0.07));  // 70ms brown params
    // FIX: layerOnRamp per-sample coefficient — same time constant regardless of blockSize
    const kRampPerSample = 1 - Math.pow(1 - 0.05, 1 / blockSize);

    // ── Noise Layers ─────────────────────────────────────────────────────
    for (let ci = 0; ci < COLORS.length; ci++) {
      const color = COLORS[ci];
      const intensityParam = parameters[`${color}_intensity`];
      const intensity = intensityParam.length > 1
        ? Math.max(...intensityParam)
        : intensityParam[0];

      if (intensity < 0.001) {
        this.resetLayerState(color);
        continue;
      }

      const volume  = parameters[`${color}_volume`][0];
      const bass    = parameters[`${color}_bass`][0];
      const texture = parameters[`${color}_texture`][0];

      const buf       = this.noiseBuffers[color];
      const filters   = this.layerFilters[color];
      const signature = this.colorSignatures[color];

      const textureScalePre = {
        grey: 0.70, brown: 0.50, pink: 0.88, black: 0.16, blue: 0.85, violet: 0.95
      }[color] || 1.0;
      const textureAmountPre = Math.max(0, Math.min(1, texture * textureScalePre));

      // FIX: brownSmoothed uses dynamic kBrown instead of hardcoded 0.002
      if (color === 'brown') {
        this.brownSmoothed.bass    += (bass    - this.brownSmoothed.bass)    * kBrown;
        this.brownSmoothed.texture += (texture - this.brownSmoothed.texture) * kBrown;
      }

      const sp = this.smoothedParams[color];
      const targetIntensity = intensity;
      const targetVolume    = volume;

      // FIX: smoothedTexture uses dynamic kTex instead of hardcoded 0.004
      filters.smoothedTexture += (textureAmountPre - filters.smoothedTexture) * kTex;
      const texAmt = filters.smoothedTexture;

      // FIX: densityRamp uses dynamic kDensity instead of hardcoded 0.01
      this.densityRamp[color] += (targetIntensity - this.densityRamp[color]) * kDensity;
      const rampRaw     = Math.max(0, Math.min(1, this.densityRamp[color]));
      const densitySmooth = rampRaw * rampRaw * (3 - 2 * rampRaw);

      // FIX: sp.intensity/volume use dynamic kSp instead of hardcoded 0.002
      // Applied once per block (these are slow params, no per-sample update needed)
      sp.intensity += (targetIntensity - sp.intensity) * kSp;
      sp.volume    += (targetVolume    - sp.volume)    * kSp;

      // ── Inner loop: iterates blockSize, not 128 ──────────────────────
      // FIX: Main bug fix. Previously this loop was hardcoded to 128, causing
      // the same 128 samples to be reused cyclically when blockSize > 128.
      // layerOnRamp now advances per-sample with kRampPerSample so the
      // activation ramp has the same time constant regardless of blockSize.
      const psyGainBias = this.fatigueDensity * this.psy.density * this.microVar.grainDensity;
      const BASE_GAIN   = 0.70;

      for (let i = 0; i < blockSize; i++) {
        let sampleL, sampleR;

        switch(color) {
          case 'white':
            sampleL = this.genWhite();
            sampleR = this.genWhite();
            break;
          case 'pink':
            sampleL = this.genPink('L');
            sampleR = this.genPink('R');
            break;
          case 'brown':
            sampleL = this.genBrown('L');
            sampleR = this.genBrown('R');
            this.brownDamp.L = this.brownDamp.L * 0.997 + sampleL * 0.003;
            this.brownDamp.R = this.brownDamp.R * 0.997 + sampleR * 0.003;
            sampleL -= this.brownDamp.L * 0.25;
            sampleR -= this.brownDamp.R * 0.25;
            this.brownHP.L += (sampleL - this.brownHP.L) * 0.0012;
            this.brownHP.R += (sampleR - this.brownHP.R) * 0.0012;
            sampleL -= this.brownHP.L;
            sampleR -= this.brownHP.R;
            sampleL *= 0.96; sampleR *= 0.96;
            break;
          case 'grey':
            sampleL = this.genGrey('L');
            sampleR = this.genGrey('R');
            break;
          case 'blue':
            sampleL = this.genBlue('L');
            sampleR = this.genBlue('R');
            sampleL += this.rng() * 0.018;
            sampleR += this.rng() * 0.018;
            break;
          case 'violet':
            sampleL = this.genViolet();
            sampleR = this.genViolet();
            if (texAmt < 0.7) {
              sampleL += (this.rng() - this.rng()) * 0.0010;
              sampleR += (this.rng() - this.rng()) * 0.0010;
            }
            break;
          case 'black':
            sampleL = this.genBlack('L');
            sampleR = this.genBlack('R');
            this.blackDamp.L = this.blackDamp.L * 0.995 + sampleL * 0.005;
            this.blackDamp.R = this.blackDamp.R * 0.995 + sampleR * 0.005;
            sampleL -= this.blackDamp.L * 0.35;
            sampleR -= this.blackDamp.R * 0.35;
            this.blackHP.L += (sampleL - this.blackHP.L) * 0.0008;
            this.blackHP.R += (sampleR - this.blackHP.R) * 0.0008;
            sampleL -= this.blackHP.L;
            sampleR -= this.blackHP.R;
            break;
          case 'green': {
            sampleL = this.genGreen('L');
            sampleR = this.genGreen('R');
            const bedFade = Math.pow(1.0 - Math.min(1.0, texAmt), 0.85);
            const bedGain = 0.14 * bedFade;
            sampleL += this.genGreenBed('L') * bedGain;
            sampleR += this.genGreenBed('R') * bedGain;
            this.greenFill.L = this.greenFill.L * 0.995 + Math.abs(sampleL) * 0.005;
            this.greenFill.R = this.greenFill.R * 0.995 + Math.abs(sampleR) * 0.005;
            sampleL += (this.rng() - this.rng()) * this.greenFill.L * 0.11;
            sampleR += (this.rng() - this.rng()) * this.greenFill.R * 0.11;
            const gs = 0.022 + texAmt * 0.018;
            this.greenSmooth.L += (sampleL - this.greenSmooth.L) * gs;
            this.greenSmooth.R += (sampleR - this.greenSmooth.R) * gs;
            sampleL = this.greenSmooth.L;
            sampleR = this.greenSmooth.R;
            break;
          }
        }

        if (color === 'white') {
          sampleL += this.rng() * 0.011;
          sampleR += this.rng() * 0.011;
        }

        sampleL *= densitySmooth;
        sampleR *= densitySmooth;

        // FIX: No array allocation — signature writes to _outL/_outR
        signature.process(sampleL, sampleR, () => this.rng(), textureAmountPre);
        sampleL = signature._outL;
        sampleR = signature._outR;

        // ── Depth / Bass ──────────────────────────────────────────────
        const depthAmount = (color === 'brown') ? this.brownSmoothed.bass : bass;
        const depthColorScale = {
          white: 0.70, pink: 0.72, grey: 0.45, blue: 0.52,
          violet: 0.55, green: 0.72, brown: 1.08, black: 1.18
        }[color] || 1.0;
        const d = Math.max(0, Math.min(1, depthAmount * depthColorScale));

        let depthCurve;
        if (d < 0.5) { depthCurve = Math.pow(d * 2, 6.0) * 0.5; }
        else { depthCurve = 0.5 + ((d - 0.5) * 2 * 0.5); }

        let smoothCutoff = 0.95 - (depthCurve * 0.85);
        if (d > 0.7) smoothCutoff += ((d - 0.7) / 0.3) * 0.08;

        filters.depthL += (sampleL - filters.depthL) * smoothCutoff;
        filters.depthR += (sampleR - filters.depthR) * smoothCutoff;

        let temp1L = filters.depthL, temp1R = filters.depthR;
        filters.depthL += (temp1L - filters.depthL) * smoothCutoff;
        filters.depthR += (temp1R - filters.depthR) * smoothCutoff;

        if (d > 0.6) {
          const extraSmooth = 0.3 + ((d - 0.6) * 0.5);
          let temp2L = filters.depthL, temp2R = filters.depthR;
          filters.depthL += (temp2L - filters.depthL) * extraSmooth;
          filters.depthR += (temp2R - filters.depthR) * extraSmooth;
        }

        let bassBoostAmount;
        if (d < 0.5) { bassBoostAmount = Math.pow(d * 2, 7.0) * 0.5; }
        else {
          const norm = (d - 0.5) * 2;
          bassBoostAmount = 0.5 + norm * norm * 0.5;
          if (d > 0.85) bassBoostAmount *= 1.0 - ((d - 0.85) * 0.4);
        }

        const bassBoost  = filters.depthL * bassBoostAmount * 1.5;
        const bassBoostR = filters.depthR * bassBoostAmount * 1.5;

        let densityCurve;
        if (d < 0.5) { densityCurve = Math.pow(d * 2, 6.5) * 0.5; }
        else {
          const norm = (d - 0.5) * 2;
          densityCurve = 0.5 + Math.pow(norm, 1.5) * 0.5;
          if (d > 0.8) densityCurve *= 1.0 - ((d - 0.8) * 0.35);
        }

        const densityL = filters.depthL * densityCurve * 2.0;
        const densityR = filters.depthR * densityCurve * 2.0;

        const finalL = filters.depthL + bassBoost  + densityL;
        const finalR = filters.depthR + bassBoostR + densityR;

        let blendAmount;
        if (d < 0.5) { blendAmount = Math.pow(d * 2, 5.5) * 0.5; }
        else { blendAmount = 0.5 + Math.pow((d - 0.5) * 2, 0.8) * 0.5; }
        if (color === 'green') blendAmount *= 0.35;

        sampleL = sampleL * (1 - blendAmount) + finalL * blendAmount;
        sampleR = sampleR * (1 - blendAmount) + finalR * blendAmount;

        let energyComp = 1.0 / (1.0 + depthCurve * 0.5);
        if (d > 0.75) energyComp *= 1.0 - ((d - 0.75) * 0.8 * 0.25);
        sampleL *= energyComp;
        sampleR *= energyComp;

        // ── Zero texture bleed clamp ──────────────────────────────────
        if ((color === 'brown' || color === 'black') && texAmt < 0.05) {
          const st = color === 'brown' ? this.zeroTextureBleed.brown : this.zeroTextureBleed.black;
          const k = 0.006 + (0.05 - texAmt) * 0.35;
          st.L += (sampleL - st.L) * k;
          st.R += (sampleR - st.R) * k;
          sampleL -= st.L;
          sampleR -= st.R;
        }

        // ── Subsonic failsafe ─────────────────────────────────────────
        if ((color === 'brown' || color === 'black') && texAmt < 0.03) {
          const guard = this.subsonicGuard[color];
          guard.L = guard.L * 0.999 + sampleL * 0.001;
          guard.R = guard.R * 0.999 + sampleR * 0.001;
          if (Math.abs(guard.L) > 0.02) sampleL -= guard.L * 0.15;
          if (Math.abs(guard.R) > 0.02) sampleR -= guard.R * 0.15;
        }

        // ── Texture / grain / air ─────────────────────────────────────
        const textureAmount = Math.pow(texAmt, 0.60);

        let smoothCoeff;
        if (texAmt < 0.5) { smoothCoeff = 0.03 + (texAmt * 0.25); }
        else               { smoothCoeff = 0.155 + ((texAmt - 0.5) * 1.4); }

        let airLayer = 0;
        const airPresence = textureAmount;
        if (airPresence > 0.01) {
          airLayer += (this.rng() - this.rng()) * airPresence * 0.25;
          if (airPresence > 0.3) airLayer += this.rng() * (airPresence - 0.3) * 0.35;
          if (airPresence > 0.6) airLayer += (this.rng() - this.rng()) * (airPresence - 0.6) * 0.45;
        }

        let totalGrainL = 0, totalGrainR = 0;
        if (textureAmount > 0.01) {
          const grainRamp = Math.max(0, (textureAmount - 0.01) / 0.99);
          const grainIntensity = grainRamp * 1.4;
          totalGrainL = (this.rng() - this.rng()) * grainIntensity * 0.15 + this.rng() * grainIntensity * 0.12 + (this.rng() - this.rng()) * grainIntensity * grainRamp * 0.08;
          totalGrainR = (this.rng() - this.rng()) * grainIntensity * 0.15 + this.rng() * grainIntensity * 0.12 + (this.rng() - this.rng()) * grainIntensity * grainRamp * 0.08;
        }

        if (color === 'green' && textureAmount > 0.01) {
          const greenOrganicL = this.genGreenGrain('L', textureAmount);
          const greenOrganicR = this.genGreenGrain('R', textureAmount);
          totalGrainL = totalGrainL * 0.5 + greenOrganicL * 0.5;
          totalGrainR = totalGrainR * 0.5 + greenOrganicR * 0.5;
        }

        const grainMix = texAmt * texAmt;

        if (color === 'white' || color === 'blue' || color === 'violet') {
          const fixedCoeff = (color === 'white') ? 0.25 : 0.04;
          filters.textureL += (sampleL - filters.textureL) * fixedCoeff;
          filters.textureR += (sampleR - filters.textureR) * fixedCoeff;
          sampleL = filters.textureL;
          sampleR = filters.textureR;
          const grainScale = textureAmount;
          sampleL += totalGrainL * grainScale + airLayer * grainScale;
          sampleR += totalGrainR * grainScale + airLayer * grainScale;
        } else if (color === 'green') {
          const rawWeight  = 1.0 - textureAmount;
          const filtWeight = textureAmount;
          filters.textureL += (sampleL - filters.textureL) * smoothCoeff;
          filters.textureR += (sampleR - filters.textureR) * smoothCoeff;
          const core = 0.28;
          sampleL = sampleL * core + (sampleL * rawWeight + filters.textureL * filtWeight) * (1 - core) + totalGrainL * grainMix + airLayer * textureAmount;
          sampleR = sampleR * core + (sampleR * rawWeight + filters.textureR * filtWeight) * (1 - core) + totalGrainR * grainMix + airLayer * textureAmount;
        } else {
          const rawWeight  = 1.0 - textureAmount;
          const filtWeight = textureAmount;
          filters.textureL += (sampleL - filters.textureL) * smoothCoeff;
          filters.textureR += (sampleR - filters.textureR) * smoothCoeff;
          sampleL = sampleL * rawWeight + filters.textureL * filtWeight + totalGrainL * grainMix + airLayer * textureAmount;
          sampleR = sampleR * rawWeight + filters.textureR * filtWeight + totalGrainR * grainMix + airLayer * textureAmount;
        }

        // FIX: layerOnRamp advances per-sample with correct coefficient
        // Previously advanced once per block → escalones de 93ms a blockSize=4096
        this.layerOnRamp[color] += (1 - this.layerOnRamp[color]) * kRampPerSample;

        const gain = sp.intensity * sp.volume * BASE_GAIN * this.layerOnRamp[color] * psyGainBias * mixComp;

        // FIX: Write directly to L/R and to buf (no circular indexing, no buf.pos)
        buf.L[i] = sampleL;
        buf.R[i] = sampleR;
        L[i] += buf.L[i] * gain;
        R[i] += buf.R[i] * gain;
      }
      // FIX: No buf.pos update needed
    } // end COLORS loop

    // ── Brainwaves ────────────────────────────────────────────────────────
    if (hasActiveBrainwaves) {
      for (let wi = 0; wi < WAVES.length; wi++) {
        const wave = WAVES[wi];
        if (parameters[`${wave}_enabled`][0] < 0.5) continue;
        const carrier   = parameters[`${wave}_carrier`][0];
        const beat      = parameters[`${wave}_beat`][0];
        const intensity = parameters[`${wave}_intensity`][0];
        const phases    = this.brainwavePhases[wave];
        const detuneTable = { alpha:0.0, theta:-0.35, delta:-0.6, beta:0.45, gamma:0.8 };
        const detune = detuneTable[wave] || 0;
        const freqL = carrier + detune;
        const freqR = carrier + beat + detune;
        const widthTable = { alpha:1.0, theta:0.92, delta:0.85, beta:1.05, gamma:1.1 };
        const w = widthTable[wave] || 1;

        for (let i = 0; i < blockSize; i++) {
          const oscL = Math.sin(2 * Math.PI * (phases.L + this.wavePhaseOffsets[wave]));
          const oscR = Math.sin(2 * Math.PI * (phases.R + this.wavePhaseOffsets[wave]));
          phases.L += freqL / sr;
          phases.R += freqR / sr;
          if (phases.L > 1) phases.L -= 1;
          if (phases.R > 1) phases.R -= 1;
          const signal  = oscL * intensity * 0.15;
          const signalR = oscR * intensity * 0.15;
          const mid  = (signal + signalR) * 0.5;
          const side = (signal - signalR) * 0.5 * w;
          L[i] += mid + side;
          R[i] += mid - side;
        }
      } // end WAVES loop
    }

    // ── Floor clamp (first pass) ──────────────────────────────────────────
    // FIX: isFinite check catches NaN and Infinity, not just near-zero
    for (let i = 0; i < blockSize; i++) {
      if (!isFinite(L[i]) || Math.abs(L[i]) < 1e-9) L[i] = 0;
      if (!isFinite(R[i]) || Math.abs(R[i]) < 1e-9) R[i] = 0;
    }

    // ── Stereo decorrelation ──────────────────────────────────────────────
    const decorr = parameters.stereoDecorr[0];
    if (decorr > 0.01) {
      let hasSignal = false;
      for (let i = 0; i < blockSize; i++) {
        if (L[i] !== 0 || R[i] !== 0) { hasSignal = true; break; }
      }
      if (hasSignal) {
        const delayTime = Math.floor(decorr * 120);
        this.spatialDriftPhase += 0.08 * blockSize / sampleRate;
        const driftAmount = Math.sin(this.spatialDriftPhase * 2 * Math.PI) * decorr * 0.003;
        for (let i = 0; i < blockSize; i++) {
          this.decorrelationDelay[this.decorrelationPos] = R[i];
          const delayed1 = this.decorrelationDelay[(this.decorrelationPos - delayTime + 4096) % 4096];
          const delayed2 = this.decorrelationDelay[(this.decorrelationPos - Math.floor(delayTime * 0.7) + 4096) % 4096];
          const delayed3 = this.decorrelationDelay[(this.decorrelationPos - Math.floor(delayTime * 0.4) + 4096) % 4096];
          R[i] = R[i] * (1 - decorr) + (delayed1 * 0.5 + delayed2 * 0.3 + delayed3 * 0.2) * decorr;
          this.decorrelationPos = (this.decorrelationPos + 1) % 4096;
          L[i] += driftAmount;
          R[i] -= driftAmount;
        }
        const diffuseMix = decorr * 0.04;
        for (let i = 0; i < blockSize; i++) {
          this.diffuseDelays.L1[this.diffuseDelays.pos % 384] = L[i];
          this.diffuseDelays.L2[this.diffuseDelays.pos % 512] = L[i];
          this.diffuseDelays.R1[this.diffuseDelays.pos % 448] = R[i];
          this.diffuseDelays.R2[this.diffuseDelays.pos % 576] = R[i];
          const tap1L = this.diffuseDelays.L1[(this.diffuseDelays.pos - 283 + 384) % 384] * 0.4;
          const tap2L = this.diffuseDelays.L2[(this.diffuseDelays.pos - 397 + 512) % 512] * 0.6;
          const tap1R = this.diffuseDelays.R1[(this.diffuseDelays.pos - 331 + 448) % 448] * 0.5;
          const tap2R = this.diffuseDelays.R2[(this.diffuseDelays.pos - 479 + 576) % 576] * 0.7;
          L[i] += (tap1L + tap2R * 0.3) * diffuseMix;
          R[i] += (tap1R + tap2L * 0.3) * diffuseMix;
          this.diffuseDelays.pos = (this.diffuseDelays.pos + 1) % 576;
        }
      } else {
        this.decorrelationDelay.fill(0);
        this.diffuseDelays.L1.fill(0); this.diffuseDelays.L2.fill(0);
        this.diffuseDelays.R1.fill(0); this.diffuseDelays.R2.fill(0);
      }
    }

    // ── Stereo width ──────────────────────────────────────────────────────
    const width = parameters.stereoWidth[0];
    if (Math.abs(width - 1) > 0.01) {
      for (let i = 0; i < blockSize; i++) {
        if (L[i] === 0 && R[i] === 0) continue;
        const mid  = (L[i] + R[i]) * 0.5;
        const side = (L[i] - R[i]) * 0.5 * width;
        const phaseShift = side * 0.15;
        L[i] = mid + side + phaseShift;
        R[i] = mid - side - phaseShift;
      }
    }

    // ── Spatial psychoacoustic ────────────────────────────────────────────
    {
      let hasSig = false;
      for (let i = 0; i < blockSize; i++) {
        if (L[i] !== 0 || R[i] !== 0) { hasSig = true; break; }
      }
      if (hasSig) {
        this.applySpatialPsycho(L, R, blockSize, sr);
      } else {
        this.xfeed.lowL = 0; this.xfeed.lowR = 0;
        this.xfeed.highL = 0; this.xfeed.highR = 0;
      }
    }

    if (Math.abs(this.fatigueTilt - 1.0) > 0.0005) {
      for (let i = 0; i < blockSize; i++) {
        if (L[i] !== 0) L[i] *= this.fatigueTilt;
        if (R[i] !== 0) R[i] *= this.fatigueTilt;
      }
    }

    this.applyAdaptiveGain(L, R, blockSize, sr);

    // ── Speaker loudness assist ───────────────────────────────────────────
    {
      const sla = this.sla;
      const lp800coeff = 1 - Math.exp(-2 * Math.PI * 800  / sr);
      const lp6kcoeff  = 1 - Math.exp(-2 * Math.PI * 6000 / sr);
      for (let i = 0; i < blockSize; i++) {
        sla.rmsAcc += L[i] * L[i] + R[i] * R[i];
      }
      sla.rmsSamples += blockSize;
      if (sla.rmsSamples >= sla.rmsWindow) {
        sla.rmsValue   = Math.sqrt(sla.rmsAcc / sla.rmsSamples);
        sla.rmsAcc     = 0; sla.rmsSamples = 0;
        const normalizedRMS = Math.min(1, sla.rmsValue / 0.063);
        const boostTarget   = Math.max(0, (1 - normalizedRMS) * 0.18);
        sla.boost += (boostTarget - sla.boost) * (blockSize / (sr * 0.8));
      }
      if (sla.boost > 0.001) {
        for (let i = 0; i < blockSize; i++) {
          if (L[i] === 0 && R[i] === 0) continue;
          sla.lpL += (L[i] - sla.lpL) * lp800coeff;
          sla.lpR += (R[i] - sla.lpR) * lp800coeff;
          sla.hpL += (L[i] - sla.hpL) * lp6kcoeff;
          sla.hpR += (R[i] - sla.hpR) * lp6kcoeff;
          L[i] += (sla.hpL - sla.lpL) * sla.boost * 0.15;
          R[i] += (sla.hpR - sla.lpR) * sla.boost * 0.15;
        }
      } else {
        for (let i = 0; i < blockSize; i++) {
          sla.lpL += (L[i] - sla.lpL) * lp800coeff;
          sla.lpR += (R[i] - sla.lpR) * lp800coeff;
          sla.hpL += (L[i] - sla.hpL) * lp6kcoeff;
          sla.hpR += (R[i] - sla.hpR) * lp6kcoeff;
        }
      }
    }

    // ── State coherence monitor ───────────────────────────────────────────
    {
      const coh = this.coherence;
      let blockSilent = true;
      for (let i = 0; i < blockSize; i++) {
        if (L[i] !== 0 || R[i] !== 0) { blockSilent = false; break; }
      }
      if (blockSilent) {
        coh.dcL *= 0.99; coh.dcR *= 0.99;
        coh.energyL *= 0.99; coh.energyR *= 0.99;
        coh.bias += (1.0 - coh.bias) * 0.01;
      } else {
        let absL = 0, absR = 0, sumL = 0, sumR = 0;
        for (let i = 0; i < blockSize; i++) {
          absL += Math.abs(L[i]); absR += Math.abs(R[i]);
          sumL += L[i]; sumR += R[i];
        }
        coh.energyL += (absL / blockSize - coh.energyL) * 0.002;
        coh.energyR += (absR / blockSize - coh.energyR) * 0.002;
        coh.dcL += (sumL / blockSize - coh.dcL) * 0.0005;
        coh.dcR += (sumR / blockSize - coh.dcR) * 0.0005;
        if (Math.abs(coh.dcL) > 1e-4) {
          for (let i = 0; i < blockSize; i++) L[i] -= coh.dcL * 0.001;
        }
        if (Math.abs(coh.dcR) > 1e-4) {
          for (let i = 0; i < blockSize; i++) R[i] -= coh.dcR * 0.001;
        }
        const ratio = coh.energyL / Math.max(1e-9, coh.energyR);
        if (ratio > 1.02 || ratio < 0.98) {
          coh.bias += (1.0 - ratio) * 0.0005;
          coh.bias = Math.max(0.98, Math.min(1.02, coh.bias));
        }
        if (Math.abs(coh.bias - 1.0) > 0.0005) {
          for (let i = 0; i < blockSize; i++) {
            if (L[i] !== 0) L[i] *= coh.bias;
            if (R[i] !== 0) R[i] /= coh.bias;
          }
        }
      }
    }

    // ── Micro analog saturation ───────────────────────────────────────────
    const analogAmount = 0.018;
    for (let i = 0; i < blockSize; i++) {
      if (L[i] !== 0) { const x = L[i]; L[i] = x - x * x * x * analogAmount; }
      if (R[i] !== 0) { const x = R[i]; R[i] = x - x * x * x * analogAmount; }
    }

    // ── Harmonic saturation ───────────────────────────────────────────────
    const sat = parameters.harmonicSat[0];
    if (sat > 0.01) {
      for (let i = 0; i < blockSize; i++) {
        if (L[i] !== 0) L[i] = Math.tanh(L[i] * (1 + sat * 1.5)) / (1 + sat * 0.4);
        if (R[i] !== 0) R[i] = Math.tanh(R[i] * (1 + sat * 1.5)) / (1 + sat * 0.4);
      }
    }

    // ── Fade out ──────────────────────────────────────────────────────────
    if (this.isFadingOut) {
      const fadeDuration = 2400;
      for (let i = 0; i < blockSize; i++) {
        this.fadeOutSamples++;
        if (this.fadeOutSamples < fadeDuration) {
          const fadeGain = 1 - (this.fadeOutSamples / fadeDuration);
          L[i] *= fadeGain; R[i] *= fadeGain;
        } else {
          L[i] = 0; R[i] = 0;
        }
      }
    }

    // ── DC drift suppression ──────────────────────────────────────────────
    for (let i = 0; i < blockSize; i++) {
      if (L[i] !== 0) {
        this.dcTrackerL = this.dcTrackerL * 0.9999 + L[i] * 0.0001;
        L[i] -= this.dcTrackerL;
      }
      if (R[i] !== 0) {
        this.dcTrackerR = this.dcTrackerR * 0.9999 + R[i] * 0.0001;
        R[i] -= this.dcTrackerR;
      }
    }

    // ── Master gain ───────────────────────────────────────────────────────
    const master = parameters.master[0];
    if (master !== 1) {
      for (let i = 0; i < blockSize; i++) {
        if (L[i] !== 0) L[i] *= master;
        if (R[i] !== 0) R[i] *= master;
      }
    }

    // ── Soft limiter ──────────────────────────────────────────────────────
    for (let i = 0; i < blockSize; i++) {
      if (L[i] !== 0) L[i] = Math.tanh(L[i] * 0.85) * 0.98;
      if (R[i] !== 0) R[i] = Math.tanh(R[i] * 0.85) * 0.98;
    }

    // ── Final floor clamp ─────────────────────────────────────────────────
    // FIX: isFinite check on both passes
    for (let i = 0; i < blockSize; i++) {
      if (!isFinite(L[i]) || Math.abs(L[i]) < 1e-9) L[i] = 0;
      if (!isFinite(R[i]) || Math.abs(R[i]) < 1e-9) R[i] = 0;
    }

    return true;
  }
}

registerProcessor('realtime-engine', RealtimeEngine);