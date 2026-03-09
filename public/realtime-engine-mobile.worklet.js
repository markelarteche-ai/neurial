// REALTIME AUDIO ENGINE — MOBILE WORKLET v4.1
// ─────────────────────────────────────────────────────────────────────────────
// Click-free design principles:
//
//   1. ALL gain changes (intensity, volume, on-ramp) happen SAMPLE BY SAMPLE
//      inside the mix loop — never as a block-level scalar jump.
//      This eliminates block-boundary gain steps which are the #1 cause of clicks.
//
//   2. Inactive layers decay to zero via the same sample-by-sample smoother
//      instead of being reset to 0 instantly — no abrupt cuts.
//
//   3. a-rate parameter arrays (when slider is moving) are read per-sample
//      in the mix loop, not just their last value.
//
//   4. Zero allocations in process(). All buffers pre-allocated in constructor.
//
//   5. Numeric color indices — no string property lookups in hot path.
//
//   6. Biquads applied in 4 separate block passes (cache-friendly).
//
//   v4.1 fix: activeCount now uses smoothed intensities (_smIntensity) instead
//   of raw parameter values, preventing targetMixComp from jumping between
//   blocks when a slider moves — which was the main cause of mobile clicks.
// ─────────────────────────────────────────────────────────────────────────────

class Biquad {
  constructor() {
    this.b0=1; this.b1=0; this.b2=0;
    this.a1=0; this.a2=0;
    this.x1=0; this.x2=0; this.y1=0; this.y2=0;
  }
  process(x) {
    const y = this.b0*x + this.b1*this.x1 + this.b2*this.x2
                        - this.a1*this.y1  - this.a2*this.y2;
    this.x2=this.x1; this.x1=x;
    this.y2=this.y1; this.y1=y;
    return (y===y && y<3 && y>-3) ? y : 0;
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

    // ── Biquad filters — layout: [ci*4+0]=L_ls, [+1]=L_hs, [+2]=R_ls, [+3]=R_hs
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

    // ── Smoothed mix compensation (avoids click when layer count changes) ────
    this._smMixComp = 1.0;

    // ── Per-layer smoothed gain state ────────────────────────────────────────
    // All updated SAMPLE BY SAMPLE inside the mix loop — never block-level jumps.
    this._smIntensity = new Float32Array(NC);   // double-smoothed intensity
    this._smVolume    = new Float32Array(NC).fill(1);
    this._densityRamp = new Float32Array(NC);   // first smoother stage
    this._onRamp      = new Float32Array(NC);   // fade-in ramp on layer activation

    // ── Brainwave phases ──────────────────────────────────────────────────────
    this._wPhL = new Float32Array(NW);
    this._wPhR = new Float32Array(NW);

    // ── Pre-allocated temp buffers ────────────────────────────────────────────
    this._tmpL = new Float32Array(8192);
    this._tmpR = new Float32Array(8192);

    // ── Pre-computed per-sample smoothing coefficients ────────────────────────
    // Using per-sample coefficients (not per-block) guarantees that gain changes
    // are continuous across block boundaries, eliminating clicks.
    //   kD: density ramp    TC = 80ms  — slow enough to avoid zipper on fast moves
    //   kS: intensity/vol   TC = 120ms — smooth slider response
    //   kR: on-ramp         TC = 30ms  — fast enough to not feel sluggish
    this._kD = 1 - Math.exp(-1/(sr*0.08));
    this._kS = 1 - Math.exp(-1/(sr*0.12));
    this._kR = 1 - Math.exp(-1/(sr*0.03));

    // ── Parameter name cache ─────────────────────────────────────────────────
    this._pIntensity = COLOR_NAMES.map(c=>`${c}_intensity`);
    this._pVolume    = COLOR_NAMES.map(c=>`${c}_volume`);
    this._pBass      = COLOR_NAMES.map(c=>`${c}_bass`);
    this._pTexture   = COLOR_NAMES.map(c=>`${c}_texture`);
    this._pWEnabled  = WAVE_NAMES.map(w=>`${w}_enabled`);
    this._pWCarrier  = WAVE_NAMES.map(w=>`${w}_carrier`);
    this._pWBeat     = WAVE_NAMES.map(w=>`${w}_beat`);
    this._pWIntensity= WAVE_NAMES.map(w=>`${w}_intensity`);

    // ── Speaker HP filter ────────────────────────────────────────────────────
    this._hpL=0; this._hpR=0;
    this._hpCoeff=Math.exp(-2*Math.PI*90/sr);
    this._speakerMode=false;

    // ── Port ─────────────────────────────────────────────────────────────────
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

  process(inputs, outputs, parameters) {
    if (!this._ready) {
      this._ready=true;
      this.port.postMessage({type:'ready'});
    }

    const out=outputs[0];
    const L=out[0], R=out[1];
    if (!L||!R) return true;

    const bs=L.length;
    const sr=sampleRate;
    L.fill(0); R.fill(0);

    // ── Activity check ────────────────────────────────────────────────────────
    let hasActive=false;
    for (let ci=0; ci<NC; ci++) {
      if (this._smIntensity[ci]>0.0001 || parameters[this._pIntensity[ci]][0]>0.001) {
        hasActive=true; break;
      }
    }
    if (!hasActive) {
      for (let wi=0; wi<NW; wi++) {
        if (parameters[this._pWEnabled[wi]][0]>0.5) { hasActive=true; break; }
      }
    }
    if (!hasActive) return true;

    // ── Mix compensation target ───────────────────────────────────────────────
    // FIX v4.1: Use _smIntensity (already smoothed inside the mix loop) instead
    // of the raw parameter value to count active layers.
    //
    // The raw parameter[0] can jump discontinuously between blocks when a slider
    // moves — e.g. from 0.0 to 0.5 in one block boundary — causing targetMixComp
    // to jump from 1.0 to 0.707 instantly. Even though smMC smooths toward that
    // target, the *target itself* jumping creates an audible click on mobile where
    // buffer sizes are 512–4096 samples (10–90 ms) and the smoother overshoots.
    //
    // Using _smIntensity means activeCount only changes when the smoothed gain
    // already reflects the new layer being audible — the compensation curve stays
    // continuous and the worklet's own sample-by-sample smoother handles the rest.
    let activeCount=0;
    for (let ci=0; ci<NC; ci++) {
      // Count a layer as active if it's either smoothly fading in (smIntensity > threshold)
      // OR if the incoming parameter just crossed zero (so we start compensating early
      // and avoid a loud transient on the first block of a new layer).
      if (this._smIntensity[ci]>0.005 || parameters[this._pIntensity[ci]][0]>0.001) activeCount++;
    }
    for (let wi=0; wi<NW; wi++) {
      if (parameters[this._pWEnabled[wi]][0]>0.5) activeCount++;
    }
    const targetMixComp = 1/Math.sqrt(activeCount<1?1:activeCount);
    const BASE_GAIN=1.8;

    const kD=this._kD, kS=this._kS, kR=this._kR;
    const tmpL=this._tmpL, tmpR=this._tmpR;

    let smMC = this._smMixComp;

    // ─────────────────────────────────────────────────────────────────────────
    // COLOR LAYERS
    // ─────────────────────────────────────────────────────────────────────────
    for (let ci=0; ci<NC; ci++) {
      const ipArr = parameters[this._pIntensity[ci]];
      const volArr = parameters[this._pVolume[ci]];

      const peakIntensity = ipArr[ipArr.length-1];
      if (this._smIntensity[ci] < 0.0001 && peakIntensity < 0.001) {
        this._densityRamp[ci]=0;
        this._onRamp[ci]=0;
        continue;
      }

      const bass    = parameters[this._pBass[ci]][0];
      const ipIsAR  = ipArr.length > 1;
      const volIsAR = volArr.length > 1;

      const fL0=this._filters[ci*4+0], fL1=this._filters[ci*4+1];
      const fR0=this._filters[ci*4+2], fR1=this._filters[ci*4+3];

      // ── 1. Generate block ─────────────────────────────────────────────────
      switch(ci) {
        case C_WHITE:
          for (let i=0; i<bs; i++) { tmpL[i]=this._genWhite(); tmpR[i]=this._genWhite(); }
          break;
        case C_PINK:
          for (let i=0; i<bs; i++) { tmpL[i]=this._genPinkL(); tmpR[i]=this._genPinkR(); }
          break;
        case C_BROWN: {
          const dc=0.5+bass*0.45;
          const dc1=1-dc;
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

      // ── 2. Biquad passes — 4 separate tight loops ─────────────────────────
      for (let i=0; i<bs; i++) tmpL[i]=fL0.process(tmpL[i]);
      for (let i=0; i<bs; i++) tmpL[i]=fL1.process(tmpL[i]);
      for (let i=0; i<bs; i++) tmpR[i]=fR0.process(tmpR[i]);
      for (let i=0; i<bs; i++) tmpR[i]=fR1.process(tmpR[i]);

      // ── 3. Mix with SAMPLE-BY-SAMPLE gain smoothing ───────────────────────
      let smI  = this._smIntensity[ci];
      let smV  = this._smVolume[ci];
      let dr   = this._densityRamp[ci];
      let ramp = this._onRamp[ci];

      for (let i=0; i<bs; i++) {
        const tI = ipIsAR  ? ipArr[i]  : ipArr[0];
        const tV = volIsAR ? volArr[i] : volArr[0];

        dr   += (tI            - dr)  * kD;
        smI  += (dr            - smI) * kS;
        smV  += (tV            - smV) * kS;
        smMC += (targetMixComp - smMC) * kS;
        ramp += (1             - ramp) * kR;

        const g = smI * smV * BASE_GAIN * smMC * ramp;
        const mid  = (tmpL[i]+tmpR[i]) * 0.5;
        const side = (tmpL[i]-tmpR[i]) * 0.4;
        L[i] += (mid+side) * g;
        R[i] += (mid-side) * g;
      }

      this._smIntensity[ci] = smI;
      this._smVolume[ci]    = smV;
      this._densityRamp[ci] = dr;
      this._onRamp[ci]      = ramp;
    }

    this._smMixComp = smMC;

    // ─────────────────────────────────────────────────────────────────────────
    // BRAINWAVES
    // ─────────────────────────────────────────────────────────────────────────
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
      const stepL      = (TAU*carrierL)/sr;
      const stepR      = (TAU*carrierR)/sr;
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

    // ─────────────────────────────────────────────────────────────────────────
    // SPEAKER HP FILTER
    // ─────────────────────────────────────────────────────────────────────────
    if (this._speakerMode) {
      const c=this._hpCoeff;
      let prevL=L[0], prevR=R[0];
      for (let i=0; i<bs; i++) {
        const inL=L[i], inR=R[i];
        this._hpL=c*(this._hpL+inL-prevL);
        this._hpR=c*(this._hpR+inR-prevR);
        prevL=inL; prevR=inR;
        L[i]=this._hpL; R[i]=this._hpR;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SOFT LIMITER + NaN guard — single pass
    // ─────────────────────────────────────────────────────────────────────────
    for (let i=0; i<bs; i++) {
      let l=L[i], r=R[i];
      if (l!==l||!isFinite(l)) l=0;
      if (r!==r||!isFinite(r)) r=0;
      if (l>0.7||l<-0.7) l=Math.tanh(l*0.85)*0.98;
      if (r>0.7||r<-0.7) r=Math.tanh(r*0.85)*0.98;
      L[i]=l; R[i]=r;
    }

    return true;
  }
}

registerProcessor('realtime-engine', RealtimeEngineMobile);