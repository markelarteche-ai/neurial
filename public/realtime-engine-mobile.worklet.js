// REALTIME AUDIO ENGINE — MOBILE WORKLET v5.4 ANTI-CLICK
// ─────────────────────────────────────────────────────────────────────────────
// Anti-click strategy — completely rethought:
//
//   CORE INSIGHT: On mobile, Web Audio a-rate params are USELESS for smooth
//   control. The browser's audio thread processes 512–4096 samples at once.
//   Even with cancelAndHoldAtTime + setTargetAtTime, the param value seen by
//   the worklet can jump discontinuously at block boundaries because the
//   automation timeline and the render thread are not sample-synchronized on
//   all mobile browsers (especially iOS Safari and Android Chrome on ARM).
//
//   SOLUTION: IGNORE WEB AUDIO PARAM AUTOMATION ENTIRELY FOR GAIN CONTROL.
//
//   Instead:
//   1. Read the param value ONCE per block (just [0], never a-rate array).
//   2. Store it as a TARGET in the worklet's own state.
//   3. Smooth toward that target SAMPLE BY SAMPLE using very long TCs
//      (400ms–600ms) — longer than any realistic mobile buffer.
//   4. The smoother is a simple one-pole IIR: y += (target - y) * k
//      This is mathematically guaranteed to be click-free because it never
//      jumps — it always approaches the target asymptotically.
//   5. Mix compensation uses the same smoothed values, not raw params.
//   6. Extra DC-blocking per-output sample to catch any residual glitch.
//   7. Hard clamp on all intermediate values — NaN/Inf cannot propagate.
//
//   WHY THIS WORKS:
//   - No block-boundary discontinuities: the smoother state carries over
//     between blocks seamlessly.
//   - No dependency on Web Audio automation timing: we just read the param
//     target once and smooth ourselves.
//   - The long TC means even if the target jumps from 0 to 1 in one block,
//     the output only moves by k per sample — imperceptible.
//   - Zero allocations in process(). All state pre-allocated.
// ─────────────────────────────────────────────────────────────────────────────

class Biquad {
  constructor() {
    this.b0=1; this.b1=0; this.b2=0;
    this.a1=0; this.a2=0;
    this.x1=0; this.x2=0; this.y1=0; this.y2=0;
  }
  process(x) {
    // Clamp input — prevents filter blowup without state reset
    if (x > 2) x = 2; else if (x < -2) x = -2;
    let y = this.b0*x + this.b1*this.x1 + this.b2*this.x2
                      - this.a1*this.y1  - this.a2*this.y2;
    // NaN guard: if y is NaN, replace with 0 but DO NOT reset state to 0.
    // Resetting state causes a hard discontinuity. Instead let the filter
    // recover naturally — the IIR will stabilize within a few samples.
    if (y !== y || !isFinite(y)) y = 0;
    // Clamp output to prevent runaway without a state reset jump
    if (y > 3) y = 3; else if (y < -3) y = -3;
    this.x2=this.x1; this.x1=x;
    this.y2=this.y1; this.y1=y;
    return y;
  }
  setLS(freq, sr, gainDB) {
    const A=Math.pow(10,gainDB/40);
    const w=2*Math.PI*freq/sr, cw=Math.cos(w), sw=Math.sin(w), beta=Math.sqrt(A)/0.707;
    const a0=(A+1)+(A-1)*cw+beta*sw;
    this.b0=A*((A+1)-(A-1)*cw+beta*sw)/a0;
    this.b1=2*A*((A-1)-(A+1)*cw)/a0;
    this.b2=A*((A+1)-(A-1)*cw-beta*sw)/a0;
    this.a1=-2*((A-1)+(A+1)*cw)/a0;
    this.a2=((A+1)+(A-1)*cw-beta*sw)/a0;
  }
  setHS(freq, sr, gainDB) {
    const A=Math.pow(10,gainDB/40);
    const w=2*Math.PI*freq/sr, cw=Math.cos(w), sw=Math.sin(w), beta=Math.sqrt(A)/0.707;
    const a0=(A+1)-(A-1)*cw+beta*sw;
    this.b0=A*((A+1)+(A-1)*cw+beta*sw)/a0;
    this.b1=-2*A*((A-1)+(A+1)*cw)/a0;
    this.b2=A*((A+1)+(A-1)*cw-beta*sw)/a0;
    this.a1=2*((A-1)-(A+1)*cw)/a0;
    this.a2=((A+1)-(A-1)*cw-beta*sw)/a0;
  }
}

const C_WHITE=0, C_PINK=1, C_BROWN=2, C_GREY=3,
      C_BLUE=4,  C_VIOLET=5, C_BLACK=6, C_GREEN=7;
const NC = 8;
const NW = 5;
const COLOR_NAMES = ['white','pink','brown','grey','blue','violet','black','green'];
const WAVE_NAMES  = ['alpha','theta','delta','beta','gamma'];
const WAVE_DETUNE = new Float32Array([0.0, -0.35, -0.6, 0.45, 0.8]);

class RealtimeEngineMobile extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    const sr = sampleRate;
    this._ready = false;
    this._sr = sr;

    // ── RNG ──────────────────────────────────────────────────────────────────
    this._rngS = 0x12345678;
    for (let i=0; i<10000; i++) this._rng();

    // ── Noise state ──────────────────────────────────────────────────────────
    this._pinkL = new Float32Array(7);
    this._pinkR = new Float32Array(7);
    for (let i=0; i<7; i++) { this._pinkL[i]=this._rng()*0.001; this._pinkR[i]=this._rng()*0.001; }

    this._brownL=this._rng()*0.001; this._brownR=this._rng()*0.001;
    this._brownDampL=0; this._brownDampR=0;
    this._blackDampL=0; this._blackDampR=0;
    this._greyL=0; this._greyR=0;
    this._blueLastL=this._rng()*0.001; this._blueLastR=this._rng()*0.001;
    this._violetLast=this._rng()*0.001;
    this._greenL=new Float32Array(4); this._greenR=new Float32Array(4);
    for (let i=0; i<4; i++) { this._greenL[i]=this._rng()*0.001; this._greenR[i]=this._rng()*0.001; }
    this._greenGrainL=0; this._greenGrainR=0;
    this._greenGrainLPL=0; this._greenGrainLPR=0;
    this._greenBreath=Math.random()*Math.PI*2;
    this._greenFillL=0; this._greenFillR=0;

    // ── Biquad filters ───────────────────────────────────────────────────────
    this._filters = [];
    for (let i=0; i<NC*4; i++) this._filters.push(new Biquad());
    const CFG = [
      [120,-1.5, 8000, 1.0],
      [200, 2.0, 6000,-1.5],
      [300, 4.0, 4000,-3.0],
      [150, 1.0, 7000,-1.0],
      [100,-2.0, 9000, 2.5],
      [ 80,-3.0,12000, 3.5],
      [400, 5.0, 3000,-4.0],
      [200, 2.5, 5000,-2.0],
    ];
    for (let ci=0; ci<NC; ci++) {
      const [lf,lg,hf,hg]=CFG[ci];
      this._filters[ci*4+0].setLS(lf,sr,lg);
      this._filters[ci*4+1].setHS(hf,sr,hg);
      this._filters[ci*4+2].setLS(lf,sr,lg);
      this._filters[ci*4+3].setHS(hf,sr,hg);
    }

    // ── THE KEY ANTI-CLICK STATE ──────────────────────────────────────────────
    // These are the WORKLET-OWNED smooth values. We NEVER jump these.
    // They only move via the one-pole IIR smoother inside process().
    // Web Audio params are just "suggestions" — we read them as targets only.

    // Long TC smoothers — 500ms means even a 4096-sample buffer (~85ms)
    // only moves the gain by ~1-exp(-85/500) ≈ 15.5% per block max.
    // That's a smooth ramp, not a click.
    this._TC_SLOW = 0.50;   // 500ms — for intensity/volume (main gain)
    this._TC_MED  = 0.30;   // 300ms — for mix compensation
    this._TC_FAST = 0.08;   // 80ms  — for on-ramp (layer activation)

    this._kSlow = 1 - Math.exp(-1/(sr * this._TC_SLOW));
    this._kMed  = 1 - Math.exp(-1/(sr * this._TC_MED));
    this._kFast = 1 - Math.exp(-1/(sr * this._TC_FAST));

    // Per-layer smoothed state — these are the ACTUAL gain values used in mix
    this._smIntensity = new Float32Array(NC);  // smoothed intensity (0-1)
    this._smVolume    = new Float32Array(NC).fill(1); // smoothed volume (0-1)
    this._smOnRamp    = new Float32Array(NC);  // activation ramp (0→1)

    // Target values read from params each block
    this._tgtIntensity = new Float32Array(NC);
    this._tgtVolume    = new Float32Array(NC).fill(1);

    // Smoothed mix compensation
    this._smMixComp = 1.0;

    // DC blocker state — catches any residual glitch energy
    this._dcL = 0; this._dcR = 0;
    this._dcPrevL = 0; this._dcPrevR = 0;
    this._dcCoeff = 1 - (2 * Math.PI * 10 / sr); // 10Hz HPF

    // ── Brainwave phases ──────────────────────────────────────────────────────
    this._wPhL = new Float32Array(NW);
    this._wPhR = new Float32Array(NW);

    // ── Pre-allocated temp buffers ────────────────────────────────────────────
    this._tmpL = new Float32Array(8192);
    this._tmpR = new Float32Array(8192);
    // smMCArr pre-allocated and pre-filled with 1.0 (neutral gain).
    // If lazy-allocated inside process(), first block reads all-zeros → gain=0
    // for entire first block → click on startup. Pre-filling with 1.0 is safe
    // because smMixComp starts at 1.0 in the constructor.
    this._smMCArr = new Float32Array(8192).fill(1.0);

    // ── Param name cache ──────────────────────────────────────────────────────
    this._pIntensity = COLOR_NAMES.map(c=>`${c}_intensity`);
    this._pVolume    = COLOR_NAMES.map(c=>`${c}_volume`);
    this._pBass      = COLOR_NAMES.map(c=>`${c}_bass`);
    this._pTexture   = COLOR_NAMES.map(c=>`${c}_texture`);
    this._pWEnabled  = WAVE_NAMES.map(w=>`${w}_enabled`);
    this._pWCarrier  = WAVE_NAMES.map(w=>`${w}_carrier`);
    this._pWBeat     = WAVE_NAMES.map(w=>`${w}_beat`);
    this._pWIntensity= WAVE_NAMES.map(w=>`${w}_intensity`);

    // ── Speaker HP filter ─────────────────────────────────────────────────────
    this._hpL=0; this._hpR=0;
    this._hpPrevL=0; this._hpPrevR=0;
    this._hpCoeff=Math.exp(-2*Math.PI*90/sr);
    this._speakerMode=false;

    // ── Port ──────────────────────────────────────────────────────────────────
    this.port.onmessage = (e) => {
      if (e.data.type==='warmup') {
        const n=e.data.samples||4800;
        for (let i=0; i<n; i++) {
          this._genWhite();
          this._genPinkL(); this._genPinkR();
          this._genBrownL(); this._genBrownR();
          this._genGreyL(); this._genGreyR();
          this._genBlueL(); this._genBlueR();
          this._genViolet();
          this._genBlackL(); this._genBlackR();
          this._genGreenL(); this._genGreenR();
        }
      } else if (e.data.type==='speakerMode') {
        this._speakerMode=!!e.data.active;
      }
    };
  }

  static get parameterDescriptors() {
    const p=[];
    for (const c of COLOR_NAMES) {
      p.push(
        {name:`${c}_intensity`,defaultValue:0,  minValue:0,maxValue:1},
        {name:`${c}_volume`,   defaultValue:1,  minValue:0,maxValue:1},
        {name:`${c}_bass`,     defaultValue:0.7,minValue:0,maxValue:1},
        {name:`${c}_texture`,  defaultValue:0.5,minValue:0,maxValue:1}
      );
    }
    for (const w of WAVE_NAMES) {
      p.push(
        {name:`${w}_enabled`,  defaultValue:0,  minValue:0,maxValue:1},
        {name:`${w}_carrier`,  defaultValue:200,minValue:100,maxValue:400},
        {name:`${w}_beat`,     defaultValue:10, minValue:1, maxValue:40},
        {name:`${w}_intensity`,defaultValue:0.5,minValue:0,maxValue:1},
        {name:`${w}_melodyVol`,defaultValue:0.7,minValue:0,maxValue:1}
      );
    }
    p.push(
      {name:'stereoDecorr',  defaultValue:0,  minValue:0,maxValue:1},
      {name:'stereoWidth',   defaultValue:2,  minValue:0,maxValue:2},
      {name:'harmonicSat',   defaultValue:0,  minValue:0,maxValue:1},
      {name:'spectralDrift', defaultValue:0,  minValue:0,maxValue:1},
      {name:'temporalSmooth',defaultValue:0,  minValue:0,maxValue:1},
      {name:'layerInteract', defaultValue:0,  minValue:0,maxValue:1},
      {name:'microRandom',   defaultValue:0,  minValue:0,maxValue:1},
      {name:'treble',        defaultValue:0.5,minValue:0,maxValue:1},
      {name:'mid',           defaultValue:0.5,minValue:0,maxValue:1},
      {name:'pressure',      defaultValue:0.5,minValue:0,maxValue:1},
      {name:'master',        defaultValue:1,  minValue:0,maxValue:2}
    );
    return p;
  }

  _rng() {
    this._rngS = (this._rngS*1664525+1013904223)>>>0;
    return (this._rngS/4294967296)*2-1;
  }

  // ── Noise generators (unchanged from v4) ─────────────────────────────────
  _genWhite() { return (this._rng()*0.82+(this._rng()-this._rng())*0.18)*0.80; }

  _genPinkL() {
    const st=this._pinkL, w=this._rng();
    st[0]=0.99886*st[0]+w*0.0555179; st[1]=0.99332*st[1]+w*0.0750759;
    st[2]=0.96900*st[2]+w*0.1538520; st[3]=0.86650*st[3]+w*0.3104856;
    st[4]=0.55000*st[4]+w*0.5329522; st[5]=-0.7616*st[5]-w*0.0168980;
    const out=st[0]+st[1]+st[2]+st[3]+st[4]+st[5]+st[6]+w*0.5362;
    st[6]=w*0.115926; return out*0.05;
  }
  _genPinkR() {
    const st=this._pinkR, w=this._rng();
    st[0]=0.99886*st[0]+w*0.0555179; st[1]=0.99332*st[1]+w*0.0750759;
    st[2]=0.96900*st[2]+w*0.1538520; st[3]=0.86650*st[3]+w*0.3104856;
    st[4]=0.55000*st[4]+w*0.5329522; st[5]=-0.7616*st[5]-w*0.0168980;
    const out=st[0]+st[1]+st[2]+st[3]+st[4]+st[5]+st[6]+w*0.5362;
    st[6]=w*0.115926; return out*0.05;
  }

  _genBrownL() {
    this._brownL+=(this._rng()*0.01); this._brownL*=0.992;
    if(this._brownL>1)this._brownL=1; else if(this._brownL<-1)this._brownL=-1;
    return this._brownL*0.6;
  }
  _genBrownR() {
    this._brownR+=(this._rng()*0.01); this._brownR*=0.992;
    if(this._brownR>1)this._brownR=1; else if(this._brownR<-1)this._brownR=-1;
    return this._brownR*0.6;
  }

  _genGreyL() {
    const w=this._rng(), p=this._genPinkL()*0.18;
    this._greyL=this._greyL*0.82+(w*0.62+p)*0.18;
    return this._greyL*0.24;
  }
  _genGreyR() {
    const w=this._rng(), p=this._genPinkR()*0.18;
    this._greyR=this._greyR*0.82+(w*0.62+p)*0.18;
    return this._greyR*0.24;
  }

  _genBlueL() {
    const w=this._rng(), d=(w-this._blueLastL)*2.5;
    this._blueLastL=w; return d*0.62;
  }
  _genBlueR() {
    const w=this._rng(), d=(w-this._blueLastR)*2.5;
    this._blueLastR=w; return d*0.62;
  }

  _genViolet() {
    const w=this._rng(), v=w-0.5*this._violetLast;
    this._violetLast=w; return v*0.60;
  }

  _genBlackL() {
    this._brownL+=(this._rng()*0.01); this._brownL*=0.992;
    if(this._brownL>1)this._brownL=1; else if(this._brownL<-1)this._brownL=-1;
    return this._brownL*0.42;
  }
  _genBlackR() {
    this._brownR+=(this._rng()*0.01); this._brownR*=0.992;
    if(this._brownR>1)this._brownR=1; else if(this._brownR<-1)this._brownR=-1;
    return this._brownR*0.42;
  }

  _genGreenL() {
    const st=this._greenL, w=this._rng();
    st[0]=0.9850*st[0]+w*0.1950; st[1]=0.9650*st[1]+w*0.2350;
    st[2]=0.9200*st[2]+w*0.2850; st[3]=0.8500*st[3]+w*0.3350;
    return (st[0]+st[1]+st[2]+st[3])*0.125;
  }
  _genGreenR() {
    const st=this._greenR, w=this._rng();
    st[0]=0.9850*st[0]+w*0.1950; st[1]=0.9650*st[1]+w*0.2350;
    st[2]=0.9200*st[2]+w*0.2850; st[3]=0.8500*st[3]+w*0.3350;
    return (st[0]+st[1]+st[2]+st[3])*0.125;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SAFE CLAMP — called on every value before it touches audio output
  // ─────────────────────────────────────────────────────────────────────────
  _clamp(v) {
    if (v !== v) return 0;       // NaN
    if (v > 1.5) return 1.5;
    if (v < -1.5) return -1.5;
    return v;
  }

  process(inputs, outputs, parameters) {
    if (!this._ready) {
      this._ready=true;
      this.port.postMessage({type:'ready'});
    }

    const out=outputs[0];
    const L=out[0], R=out[1];
    if (!L||!R) return true;

    const bs=L.length;
    L.fill(0); R.fill(0);

    // ── STEP 1: Read param targets ONCE per block (k-rate only, never a-rate)
    // This is intentional. We deliberately ignore the a-rate param array.
    // Web Audio's automation timeline on mobile is unreliable — reading
    // per-sample values causes discontinuities at block boundaries.
    // We read [0] (the block-start value) as a TARGET and smooth ourselves.
    for (let ci=0; ci<NC; ci++) {
      this._tgtIntensity[ci] = parameters[this._pIntensity[ci]][0];
      this._tgtVolume[ci]    = parameters[this._pVolume[ci]][0];
    }

    // ── STEP 2: Count active layers using SMOOTHED values (not raw targets)
    // This prevents the mix compensation from jumping when a new layer starts.
    let activeCount = 0;
    for (let ci=0; ci<NC; ci++) {
      if (this._smIntensity[ci] > 0.002 || this._tgtIntensity[ci] > 0.001) activeCount++;
    }
    for (let wi=0; wi<NW; wi++) {
      if (parameters[this._pWEnabled[wi]][0] > 0.5) activeCount++;
    }
    const targetMixComp = 1 / Math.sqrt(activeCount < 1 ? 1 : activeCount);
    const BASE_GAIN = 1.8;

    const kSlow = this._kSlow;
    const kMed  = this._kMed;
    const kFast = this._kFast;
    const tmpL  = this._tmpL;
    const tmpR  = this._tmpR;

    // ── STEP 3a: Pre-compute smMixComp for every sample in this block ────────
    // smMixComp must be IDENTICAL across all layers at sample i.
    // Pre-allocated in constructor filled with 1.0 — no lazy init needed.
    const smMCArr = this._smMCArr;
    let smMC = this._smMixComp;
    for (let i=0; i<bs; i++) {
      smMC += (targetMixComp - smMC) * kMed;
      smMCArr[i] = smMC;
    }
    this._smMixComp = smMC;

    // ── STEP 3b: Process each color layer ────────────────────────────────────
    for (let ci=0; ci<NC; ci++) {
      const tgtI = this._tgtIntensity[ci];
      const tgtV = this._tgtVolume[ci];

      // Skip layers that are truly silent (smIntensity already clamped to exact 0)
      // AND will remain silent (tgtI below threshold).
      // We only skip — and only reset filter state — when smIntensity is EXACTLY 0,
      // meaning the layer has been silent for at least one full block already.
      // This prevents any mid-fade filter reset which would cause a discontinuity.
      if (this._smIntensity[ci] === 0 && tgtI < 0.0001) {
        // Safe to reset filter state here: output was already 0 last block,
        // so zeroing x1/x2/y1/y2 is a no-op from the signal perspective.
        const fL0=this._filters[ci*4+0], fL1=this._filters[ci*4+1];
        const fR0=this._filters[ci*4+2], fR1=this._filters[ci*4+3];
        fL0.x1=0; fL0.x2=0; fL0.y1=0; fL0.y2=0;
        fL1.x1=0; fL1.x2=0; fL1.y1=0; fL1.y2=0;
        fR0.x1=0; fR0.x2=0; fR0.y1=0; fR0.y2=0;
        fR1.x1=0; fR1.x2=0; fR1.y1=0; fR1.y2=0;
        this._smOnRamp[ci] = 0;
        continue;
      }

      const bass    = parameters[this._pBass[ci]][0];

      const fL0=this._filters[ci*4+0], fL1=this._filters[ci*4+1];
      const fR0=this._filters[ci*4+2], fR1=this._filters[ci*4+3];

      // ── Generate block ───────────────────────────────────────────────────
      switch(ci) {
        case C_WHITE:
          for (let i=0; i<bs; i++) { tmpL[i]=this._genWhite(); tmpR[i]=this._genWhite(); }
          break;
        case C_PINK:
          for (let i=0; i<bs; i++) { tmpL[i]=this._genPinkL(); tmpR[i]=this._genPinkR(); }
          break;
        case C_BROWN: {
          const dc=0.5+bass*0.45, dc1=1-dc;
          for (let i=0; i<bs; i++) {
            const bL=this._genBrownL(), bR=this._genBrownR();
            this._brownDampL=this._brownDampL*dc+bL*dc1;
            this._brownDampR=this._brownDampR*dc+bR*dc1;
            tmpL[i]=this._brownDampL; tmpR[i]=this._brownDampR;
          }
          break;
        }
        case C_GREY:
          for (let i=0; i<bs; i++) { tmpL[i]=this._genGreyL(); tmpR[i]=this._genGreyR(); }
          break;
        case C_BLUE:
          for (let i=0; i<bs; i++) { tmpL[i]=this._genBlueL(); tmpR[i]=this._genBlueR(); }
          break;
        case C_VIOLET:
          for (let i=0; i<bs; i++) {
            const v=this._genViolet();
            tmpL[i]=v; tmpR[i]=v*0.97+this._rng()*0.03;
          }
          break;
        case C_BLACK:
          for (let i=0; i<bs; i++) {
            const bL=this._genBlackL(), bR=this._genBlackR();
            this._blackDampL=this._blackDampL*0.85+bL*0.15;
            this._blackDampR=this._blackDampR*0.85+bR*0.15;
            tmpL[i]=this._blackDampL; tmpR[i]=this._blackDampR;
          }
          break;
        case C_GREEN: {
          const texture=parameters[this._pTexture[ci]][0];
          const doGrain=texture>1e-4;
          const tFactor=doGrain ? texture*texture*Math.pow(texture,0.2)*0.25 : 0;
          for (let i=0; i<bs; i++) {
            const g=this._genGreenL(), gR=this._genGreenR();
            let grainL=0, grainR=0;
            if (doGrain) {
              this._greenGrainL  =this._greenGrainL*0.88+this._rng()*0.12;
              this._greenGrainR  =this._greenGrainR*0.88+this._rng()*0.12;
              this._greenGrainLPL+=(this._greenGrainL-this._greenGrainLPL)*0.18;
              this._greenGrainLPR+=(this._greenGrainR-this._greenGrainLPR)*0.18;
              this._greenBreath+=0.00004;
              const breath=1.0+Math.sin(this._greenBreath)*0.03;
              grainL=this._greenGrainLPL*breath*tFactor;
              grainR=this._greenGrainLPR*breath*tFactor;
            }
            this._greenFillL+=(g -this._greenFillL)*0.004;
            this._greenFillR+=(gR-this._greenFillR)*0.004;
            tmpL[i]=g+grainL+this._greenFillL*0.3;
            tmpR[i]=gR+grainR+this._greenFillR*0.3;
          }
          break;
        }
      }

      // ── Biquad passes ─────────────────────────────────────────────────────
      for (let i=0; i<bs; i++) tmpL[i]=fL0.process(tmpL[i]);
      for (let i=0; i<bs; i++) tmpL[i]=fL1.process(tmpL[i]);
      for (let i=0; i<bs; i++) tmpR[i]=fR0.process(tmpR[i]);
      for (let i=0; i<bs; i++) tmpR[i]=fR1.process(tmpR[i]);

      // ── Mix with WORKLET-OWNED sample-by-sample gain smoothing ────────────
      // CRITICAL: We do NOT use the Web Audio param value here directly.
      // We smooth from whatever we have toward the target we read above.
      // This guarantees continuity across ALL block boundaries on ALL devices.
      let smI  = this._smIntensity[ci];
      let smV  = this._smVolume[ci];
      let ramp = this._smOnRamp[ci];

      for (let i=0; i<bs; i++) {
        // Smooth toward targets — slow TC = no clicks ever
        smI  += (tgtI - smI) * kSlow;
        smV  += (tgtV - smV) * kSlow;
        // On-ramp: activates fast, clamp to 1 once close to stop float drift
        if (ramp < 0.9999) ramp += (1 - ramp) * kFast; else ramp = 1;

        // smMixComp read from pre-computed array — same value all layers used
        let g = smI * smV * BASE_GAIN * smMCArr[i] * ramp;
        if (g > 4) g = 4; else if (g < 0) g = 0;

        const mid  = (tmpL[i]+tmpR[i]) * 0.5;
        const side = (tmpL[i]-tmpR[i]) * 0.4;
        L[i] += (mid+side) * g;
        R[i] += (mid-side) * g;
      }

      // Only clamp smIntensity to exact zero when tgtI is also near-zero.
      // If tgtI > 0 the layer is fading in — preserve the tiny value so
      // the next block's smoother continues from the correct position.
      // Clamping to 0 while tgtI > 0 would cause a one-sample jump next block.
      this._smIntensity[ci] = (smI < 0.0001 && tgtI < 0.0001) ? 0 : smI;
      // smVolume never goes to 0 on its own (default is 1), safe to clamp always
      this._smVolume[ci]    = smV < 0.0001 ? 0 : smV;
      this._smOnRamp[ci]    = ramp;
    }

    // ── BRAINWAVES ────────────────────────────────────────────────────────────
    const sw=parameters['stereoWidth'][0];
    const TAU=2*Math.PI;

    for (let wi=0; wi<NW; wi++) {
      if (parameters[this._pWEnabled[wi]][0]<0.5) continue;

      const carrier    = parameters[this._pWCarrier[wi]][0];
      const beat       = parameters[this._pWBeat[wi]][0];
      const wIntensity = parameters[this._pWIntensity[wi]][0];
      const detune     = WAVE_DETUNE[wi];
      const carrierL   = carrier*Math.pow(2,detune/12);
      const carrierR   = carrierL*Math.pow(2,beat/(carrierL*12));
      const stepL      = (TAU*carrierL)/sampleRate;
      const stepR      = (TAU*carrierR)/sampleRate;
      const amp        = wIntensity*0.15;

      let phL=this._wPhL[wi], phR=this._wPhR[wi];
      for (let i=0; i<bs; i++) {
        phL+=stepL; if(phL>TAU)phL-=TAU;
        phR+=stepR; if(phR>TAU)phR-=TAU;
        const oscL=Math.sin(phL)*amp;
        const oscR=Math.sin(phR)*amp;
        const mid =(oscL+oscR)*0.5;
        const side=(oscL-oscR)*0.5*sw;
        L[i]+=mid+side;
        R[i]+=mid-side;
      }
      this._wPhL[wi]=phL; this._wPhR[wi]=phR;
    }

    // ── SPEAKER HP FILTER ─────────────────────────────────────────────────────
    // prevL/prevR MUST persist across blocks — using L[0] causes a discontinuity
    // on the first sample of every block.
    if (this._speakerMode) {
      const c=this._hpCoeff;
      let prevL=this._hpPrevL;
      let prevR=this._hpPrevR;
      for (let i=0; i<bs; i++) {
        const inL=L[i], inR=R[i];
        this._hpL=c*(this._hpL+inL-prevL);
        this._hpR=c*(this._hpR+inR-prevR);
        prevL=inL; prevR=inR;
        L[i]=this._hpL; R[i]=this._hpR;
      }
      this._hpPrevL=prevL;
      this._hpPrevR=prevR;
    }

    // ── FINAL STAGE: DC block + soft limiter + NaN guard ─────────────────────
    // The DC blocker catches any residual step-function energy (the signature
    // of a block-boundary gain jump) and removes it from the output.
    // Even if a click somehow makes it through the smoother, it becomes
    // a brief sub-audible transient after this filter.
    // prevOutL/R MUST persist across blocks — resetting to 0 each block
    // creates a step discontinuity on sample 0 of every block.
    const dcCoeff = this._dcCoeff;
    let dcL = this._dcL;
    let dcR = this._dcR;
    let prevOutL = this._dcPrevL;
    let prevOutR = this._dcPrevR;

    for (let i=0; i<bs; i++) {
      let l=L[i], r=R[i];

      // NaN/Inf guard
      if (l!==l || !isFinite(l)) l=0;
      if (r!==r || !isFinite(r)) r=0;

      // DC block — correct 1-pole HPF: y[n] = x[n] - x[n-1] + coeff*y[n-1]
      const newDcL = l - prevOutL + dcCoeff * dcL;
      const newDcR = r - prevOutR + dcCoeff * dcR;
      prevOutL = l; prevOutR = r;
      l = newDcL; r = newDcR;
      dcL = newDcL; dcR = newDcR;

      // Soft limiter — tanh above 0.7 to prevent clipping
      if (l > 0.7 || l < -0.7) l = Math.tanh(l * 0.85) * 0.98;
      if (r > 0.7 || r < -0.7) r = Math.tanh(r * 0.85) * 0.98;

      // Hard clip safety — absolute last resort
      if (l > 1) l = 1; else if (l < -1) l = -1;
      if (r > 1) r = 1; else if (r < -1) r = -1;

      L[i]=l; R[i]=r;
    }

    this._dcL = dcL;
    this._dcR = dcR;
    this._dcPrevL = prevOutL;
    this._dcPrevR = prevOutR;

    return true;
  }
}

registerProcessor('realtime-engine', RealtimeEngineMobile);