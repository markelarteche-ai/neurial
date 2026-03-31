import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Download, Waves } from 'lucide-react';
import { MobileAudioEngine } from './audio/MobileAudioEngine';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Mobile noise loop URLs — used both for playback and export
const MOBILE_NOISE_URLS = {
  white:  '/sounds/mobile_loops/white_noise_loop.mp3',
  pink:   '/sounds/mobile_loops/pink_noise_loop.mp3',
  brown:  '/sounds/mobile_loops/brown_noise_loop.mp3',
  grey:   '/sounds/mobile_loops/grey_noise_loop.mp3',
  black:  '/sounds/mobile_loops/black_noise_loop.mp3',
  green:  '/sounds/mobile_loops/green_noise_loop.mp3',
  blue:   '/sounds/mobile_loops/blue_noise_loop.mp3',
  violet: '/sounds/mobile_loops/violet_noise_loop.mp3',
};

// ===================== EXPORT PROGRESS BAR =====================
const ExportProgressBar = ({ exportProgress, formatTime, NT }) => {
  const [localElapsed, setLocalElapsed] = React.useState(0);
  const startedAtRef = React.useRef(null);
  const intervalRef  = React.useRef(null);

  React.useEffect(() => {
    const isActive = exportProgress.stage !== '' && exportProgress.stage !== 'complete';
    if (isActive) {
      if (!startedAtRef.current) {
        startedAtRef.current = Date.now();
        setLocalElapsed(0);
      }
      intervalRef.current = setInterval(() => {
        setLocalElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);
    } else {
      clearInterval(intervalRef.current);
      if (exportProgress.stage === '') {
        startedAtRef.current = null;
        setLocalElapsed(0);
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [exportProgress.stage]);

  const isComplete     = exportProgress.stage === 'complete';
  const displayElapsed = isComplete && exportProgress.elapsedTime > 0
    ? exportProgress.elapsedTime : localElapsed;

  return (
    <div style={{
      margin: isMobile ? '0 16px 24px 16px' : '0 32px 24px 32px',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid rgba(250,204,21,0.25)',
      background: 'rgba(15,23,42,0.8)',
      boxShadow: '0 20px 25px rgba(0,0,0,0.4)'
    }}>
      <style>{`
        @keyframes xp-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes xp-dot { 0%,100%{opacity:1} 50%{opacity:0.2} }
      `}</style>

      {/* Top accent */}
      <div style={{
        height: '2px',
        width: '100%',
        background: isComplete
          ? 'linear-gradient(90deg,#166534,#4ade80,#166534)'
          : 'linear-gradient(90deg,#92400e,#facc15,#fef08a,#facc15,#92400e)',
      }} />

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, display: 'inline-block',
              backgroundColor: isComplete ? '#4ade80' : '#facc15',
              animation: isComplete ? 'none' : 'xp-dot 1.2s ease-in-out infinite',
            }} />
            <span style={{ color: '#fef08a', fontWeight: 600, fontSize: '14px', letterSpacing: '0.05em' }}>
              {exportProgress.stage === 'loading nature sounds' && '🌿 Loading nature sounds…'}
              {exportProgress.stage === 'loading noise layers'  && '🎨 Loading noise layers…'}
              {exportProgress.stage === 'rendering'             && '🎵 Rendering audio…'}
              {exportProgress.stage === 'complete'              && '✅ Export complete!'}
              {!['loading nature sounds','loading noise layers','rendering','complete'].includes(exportProgress.stage) && '⏳ Processing…'}
            </span>
          </div>
          {isComplete && (
            <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '1.75rem', lineHeight: 1, color: '#4ade80' }} {...NT}>100%</span>
          )}
        </div>

        {/* Bar */}
        <div style={{ position: 'relative', height: '20px', width: '100%', borderRadius: '9999px', overflow: 'hidden', background: '#1e293b', border: '1px solid rgba(71,85,105,0.6)' }}>
          {isComplete ? (
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: '9999px',
              background: 'linear-gradient(90deg,#166534,#4ade80)',
              boxShadow: '0 0 16px rgba(74,222,128,0.5)',
            }} />
          ) : (
            <>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: '9999px',
                background: 'linear-gradient(90deg,#92400e,#d97706)',
                opacity: 0.35,
              }} />
              <div style={{
                position: 'absolute', top: 0, bottom: 0, borderRadius: '9999px',
                width: '45%',
                background: 'linear-gradient(90deg,transparent,#facc15,#fef08a,#facc15,transparent)',
                animation: 'xp-sweep 1.6s ease-in-out infinite',
                boxShadow: '0 0 12px rgba(250,204,21,0.6)',
              }} />
            </>
          )}
          {isComplete && (
            <span style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: 'rgba(0,0,0,0.55)'
            }} {...NT}>100%</span>
          )}
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(71,85,105,0.5)' }}>
            <span style={{ color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '9px', opacity: 0.4 }}>Chunk</span>
            <span style={{ color: '#fef9c3', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '1.05rem', lineHeight: 1.2 }} {...NT}>
              {exportProgress.currentChunk}
              <span style={{ fontWeight: 400, fontSize: '12px', color: 'rgba(254,240,138,0.3)' }}> / {exportProgress.totalChunks}</span>
            </span>
          </div>
          <div style={{ borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(71,85,105,0.5)' }}>
            <span style={{ color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '9px', opacity: 0.4 }}>Elapsed</span>
            <span style={{ color: '#fef9c3', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '1.05rem', lineHeight: 1.2 }} {...NT}>
              {formatTime(displayElapsed)}
            </span>
          </div>
        </div>

        {!isComplete && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px', padding: '8px 12px',
            background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.18)',
          }}>
            <span style={{ fontSize: '0.85rem' }}>⚠️</span>
            <p style={{ fontSize: '12px', color: 'rgba(254,240,138,0.55)', margin: 0 }}>Keep this tab open until the export finishes</p>
          </div>
        )}
      </div>

      {/* Bottom accent */}
      <div style={{
        height: '2px', width: '100%', opacity: 0.5,
        background: isComplete
          ? 'linear-gradient(90deg,#166534,#4ade80,#166534)'
          : 'linear-gradient(90deg,#92400e,#facc15,#fef08a,#facc15,#92400e)',
      }} />
    </div>
  );
};

// ===================== PRESET LABEL FORMATTER =====================
const formatPresetName = (key) => {
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
};

// ===================== MAIN COMPONENT =====================
const AdvancedSoundEngine = ({ isPro: isPropPro = false, user = null, onSignOut = null }) => {

  const ADMIN_EMAILS = ['markelarteche@gmail.com', 'pruebaneurial@gmail.com'];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  const [serverIsPro, setServerIsPro] = useState(isPropPro);
  useEffect(() => {
    if (isAdmin) { setServerIsPro(true); return; }
    if (!user) return;
    const checkSub = async () => {
      try {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/subscription-status', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setServerIsPro(data.isPro ?? false);
      } catch {}
    };
    checkSub();
  }, [user, isAdmin]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
      if (!isAdmin && user) {
        const recheckSub = async () => {
          try {
            const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
            const supabase = createClient(
              import.meta.env.VITE_SUPABASE_URL,
              import.meta.env.VITE_SUPABASE_ANON_KEY
            );
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch('/api/subscription-status', {
              headers: { Authorization: `Bearer ${session.access_token}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            setServerIsPro(data.isPro ?? false);
          } catch {}
        };
        recheckSub();
      }
    }
  }, []);

  const isPro = serverIsPro || isAdmin;
  const isLimited = !isPro;

  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const limitTimerRef = useRef(null);
  const accumulatedTimeRef = useRef(0);
  const sessionStartRef = useRef(null);

  useEffect(() => {
    document.documentElement.style.cssText = 'margin:0;padding:0;width:100%;';
    document.body.style.cssText = 'margin:0;padding:0;width:100%;min-height:100vh;overflow-x:hidden;';
    const root = document.getElementById('root');
    if (root) root.style.cssText = 'margin:0;padding:0;width:100%;min-height:100vh;';

    const style = document.createElement('style');
    style.id = 'neurial-reset';
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box !important; }
      html { margin: 0 !important; padding: 0 !important; width: 100% !important; }
      body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-height: 100vh !important; overflow-x: hidden !important; }
      #root { margin: 0 !important; padding: 0 !important; width: 100% !important; min-height: 100vh !important; display: block !important; max-width: none !important; }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('neurial-reset');
      if (el) el.remove();
    };
  }, []);

  const FREE_LIMIT_MS = 600000;
  const FADE_WARNING_MS = 30000;

  const startLimitTimer = () => {
    if (!isLimited) return;
    clearInterval(limitTimerRef.current);
    sessionStartRef.current = Date.now();
    limitTimerRef.current = setInterval(() => {
      const elapsed = accumulatedTimeRef.current + (Date.now() - sessionStartRef.current);
      const remaining = FREE_LIMIT_MS - elapsed;

      if (remaining <= FADE_WARNING_MS && remaining > 0) {
        setIsFadingOut(true);
        const ctx = audioContextRef.current;
        const gain = gainNodeRef.current;
        if (gain && ctx && ctx.state === 'running') {
          try {
            const fadeProgress = 1 - (remaining / FADE_WARNING_MS);
            const targetGain = Math.max(0.05, 1 - fadeProgress * 0.95);
            gain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.5);
          } catch {}
        }
      }

      if (elapsed >= FREE_LIMIT_MS) {
        clearInterval(limitTimerRef.current);
        setIsFadingOut(false);
        isPlayingRef.current = false;
        setIsPlaying(false);
        killAllNatureNow();
        const ctx = audioContextRef.current;
        const gain = gainNodeRef.current;
        if (gain && ctx) {
          try {
            gain.gain.cancelScheduledValues(ctx.currentTime);
            gain.gain.setValueAtTime(gain.gain.value || 1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
          } catch (e) {}
          setTimeout(async () => {
            try { if (mixerNodeRef.current) mixerNodeRef.current.disconnect(); } catch {}
            try { if (filterNodesRef.current.inGain) filterNodesRef.current.inGain.disconnect(); } catch {}
            try { if (filterNodesRef.current.lpf) filterNodesRef.current.lpf.disconnect(); } catch {}
            try { if (filterNodesRef.current.bass) filterNodesRef.current.bass.disconnect(); } catch {}
            try { if (gain) gain.disconnect(); } catch {}
            filterNodesRef.current = {};
            mixerNodeRef.current = null;
            if (ctx && ctx.state !== 'closed') { try { await ctx.close(); } catch {} }
            audioContextRef.current = null;
            setIsGenerating(false);
          }, 1600);
        }
        accumulatedTimeRef.current = 0;
        setShowLimitModal(true);
      }
    }, 500);
  };

  const pauseLimitTimer = () => {
    if (sessionStartRef.current !== null) {
      accumulatedTimeRef.current += Date.now() - sessionStartRef.current;
      sessionStartRef.current = null;
    }
    clearInterval(limitTimerRef.current);
    setIsFadingOut(false);
  };

  const resetLimitTimer = () => {
    clearInterval(limitTimerRef.current);
    accumulatedTimeRef.current = 0;
    sessionStartRef.current = null;
  };

  const [activeTab, setActiveTab] = useState('layers');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activePreset, setActivePreset] = useState(null);

  const [exportProgress, setExportProgress] = useState({
    isExporting: false,
    currentChunk: 0,
    totalChunks: 0,
    percentage: 0,
    elapsedTime: 0,
    estimatedTimeLeft: 0,
    stage: ''
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  const audioContextRef = useRef(null);
  const isApplyingPresetRef = useRef(false);
  const mixerNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const filterNodesRef = useRef({});
  const natureAudioRefs = useRef({});
  const natureGainNodes = useRef({});
  const natureToggleLock = useRef(false);
  const natureBufferCacheRef = useRef({});
  const brainwaveOscRefs = useRef({});
  const brainwaveGainRefs = useRef({});
  const mobileEngineRef = useRef(null);

  // ── AUTO-PLAY guard: prevents concurrent ensurePlaying calls ──
  const autoPlayPendingRef = useRef(false);

  useEffect(() => {
    if (!isMobile) return;
    const preload = async () => {
      let engine = mobileEngineRef.current;
      if (!engine) {
        engine = new MobileAudioEngine();
        await engine.init();
      }
      mobileEngineRef.current = engine;
      const ctx = engine?.ctx;
      if (!ctx) return;
      const keys = Object.keys(NATURE_SOUND_URLS);
      await Promise.all(keys.map(k => loadNatureBufferRealtime(ctx, k)));
    };
    preload();
  }, []);

  const NT = { translate: 'no', className: 'notranslate' };

  const [layers, setLayers] = useState({
    white: { intensity: 0, bass: 50, volume: 50, texture: 50, brightness: 50 },
    pink: { intensity: 0, bass: 50, volume: 50, texture: 50, brightness: 50 },
    brown: { intensity: 60, bass: 50, volume: 50, texture: 50, brightness: 50 },
    grey: { intensity: 0, bass: 50, volume: 50, texture: 50, brightness: 50 },
    blue: { intensity: 0, bass: 50, volume: 50, texture: 50, brightness: 50 },
    violet:{ intensity: 0, bass: 50, volume: 50, texture: 50, brightness: 50 },
    black: { intensity: 0, bass: 50, volume: 50, texture: 50, brightness: 50 },
    green: { intensity: 0, bass: 50, volume: 50, texture: 50, brightness: 50 }
  });

  // Justo después de const [layers, setLayers] = useState({...})
const [mobileLayerActive, setMobileLayerActive] = useState({
  white: false, pink: false, brown: true,
  grey: false, blue: false, violet: false, black: false, green: false
});

  const [brainwaves, setBrainwaves] = useState({
    alpha: { enabled:false, carrier:200, beat:10, intensity:50 },
    theta: { enabled:false, carrier:200, beat:6, intensity:50 },
    delta: { enabled:false, carrier:200, beat:2, intensity:50 },
    beta: { enabled:false, carrier:200, beat:20, intensity:50 },
    gamma: { enabled:false, carrier:200, beat:40, intensity:50 }
  });

  const [processing, setProcessing] = useState({
    bass:50, treble:55, mid:55, stereoWidth:120, pressure:50,
    stereoDecorr:35, harmonicSat:0, spectralDrift:0,
    temporalSmooth:0, layerInteract:0, microRandom:0
  });

  const [natureSounds, setNatureSounds] = useState({
    rain: { enabled: false, volume: 70 },
    storm: { enabled: false, volume: 70 },
    ocean: { enabled: false, volume: 70 },
    wind: { enabled: false, volume: 70 },
    fire: { enabled: false, volume: 70 },
    waterfall: { enabled: false, volume: 70 },
    river: { enabled: false, volume: 70 },
    nightforest: { enabled: false, volume: 70 },
    nightingale: { enabled: false, volume: 70 }
  });

  const natureSoundsRef = useRef(natureSounds);
  useEffect(() => { natureSoundsRef.current = natureSounds; }, [natureSounds]);

  const isPlayingRef = useRef(false);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Keep a ref to layers so ensurePlaying callbacks can read current values
  const layersRef = useRef(layers);
  useEffect(() => { layersRef.current = layers; }, [layers]);

  useEffect(() => {
    if (showLimitModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [showLimitModal]);

  const NATURE_SOUND_URLS = {
    rain: '/sounds/rain2.mp3',
    ocean: '/sounds/Calm Ocean Waves With Birds.mp3',
    fire: '/sounds/Campfire.wav',
    storm: '/sounds/Thunderstorm.mp3',
    wind: '/sounds/viento2.wav',
    waterfall: '/sounds/waterfall2.mp3',
    river: '/sounds/River in forest.mp3',
    nightforest: '/sounds/night-forest-with-insects-.wav',
    nightingale: '/sounds/Pure Sound Of The Nightingale Song In The Forest.mp3'
  };

  const XFADE_SAMPLES = 128;
  const xfadeCurveOut = new Float32Array(XFADE_SAMPLES).map((_, i) =>
    Math.cos((i / XFADE_SAMPLES) * Math.PI * 0.5)
  );
  const xfadeCurveIn = new Float32Array(XFADE_SAMPLES).map((_, i) =>
    Math.sin((i / XFADE_SAMPLES) * Math.PI * 0.5)
  );

  const syncAllRealtimeParams = (ctx) => {
    const node = mixerNodeRef.current;
    if (!ctx || !node || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const TC = 0.05;
    Object.entries(layers).forEach(([k, c]) => {
      node.parameters.get(`${k}_intensity`)?.setTargetAtTime((c.intensity ?? 0) / 100, t, TC);
      node.parameters.get(`${k}_volume`)?.setTargetAtTime((c.volume ?? 100) / 100, t, TC);
      node.parameters.get(`${k}_bass`)?.setTargetAtTime((c.bass ?? 50) / 100, t, TC);
      node.parameters.get(`${k}_texture`)?.setTargetAtTime((c.texture ?? 50) / 100, t, TC);
    });
    Object.entries(brainwaves).forEach(([k, c]) => {
      node.parameters.get(`${k}_enabled`)?.setTargetAtTime(c.enabled ? 1 : 0, t, TC);
      node.parameters.get(`${k}_carrier`)?.setTargetAtTime(c.carrier ?? 200, t, TC);
      node.parameters.get(`${k}_beat`)?.setTargetAtTime(c.beat ?? 10, t, TC);
      node.parameters.get(`${k}_intensity`)?.setTargetAtTime((c.intensity ?? 50) / 100, t, TC);
    });
    node.parameters.get('stereoDecorr')?.setTargetAtTime((processing.stereoDecorr ?? 0) / 100, t, TC);
    node.parameters.get('stereoWidth')?.setTargetAtTime((processing.stereoWidth ?? 100) / 50, t, TC);
    node.parameters.get('harmonicSat')?.setTargetAtTime((processing.harmonicSat ?? 0) / 100, t, TC);
    node.parameters.get('spectralDrift')?.setTargetAtTime((processing.spectralDrift ?? 0) / 100, t, TC);
    node.parameters.get('temporalSmooth')?.setTargetAtTime((processing.temporalSmooth ?? 0) / 100, t, TC);
    node.parameters.get('layerInteract')?.setTargetAtTime((processing.layerInteract ?? 0) / 100, t, TC);
    node.parameters.get('microRandom')?.setTargetAtTime((processing.microRandom ?? 0) / 100, t, TC);
    node.parameters.get('treble')?.setTargetAtTime((processing.treble ?? 55) / 100, t, TC);
    node.parameters.get('mid')?.setTargetAtTime((processing.mid ?? 55) / 100, t, TC);
    node.parameters.get('pressure')?.setTargetAtTime((processing.pressure ?? 50) / 100, t, TC);
    node.parameters.get('master')?.setTargetAtTime(1, t, TC);
  };

  const ensureStableChain = (ctx) => {
    const f = filterNodesRef.current;
    if (!f.inGain) f.inGain = ctx.createGain();
    if (!f.lpf) {
      f.lpf = ctx.createBiquadFilter();
      f.lpf.type = 'lowpass';
      f.lpf.frequency.value = 800;
    }
    if (!f.bass) {
      f.bass = ctx.createBiquadFilter();
      f.bass.type = 'lowshelf';
      f.bass.frequency.value = 200;
    }
    if (!f._wired) {
      f.inGain.connect(f.lpf);
      f.lpf.connect(f.bass);
      f.bass.connect(gainNodeRef.current);
      f._wired = true;
    }
    return f;
  };

  const sendParam = (name, value) => {
    const node = mixerNodeRef.current;
    const ctx = audioContextRef.current;
    if (!node || !ctx || ctx.state !== 'running') return;
    node.parameters.get(name)?.setTargetAtTime(value, ctx.currentTime, 0.08);
  };

  const syncThrottleRef = useRef(null);
  useEffect(() => {
    if (!isPlaying) return;
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (syncThrottleRef.current) clearTimeout(syncThrottleRef.current);
    syncThrottleRef.current = setTimeout(() => {
      syncAllRealtimeParams(ctx);
      const f = ensureStableChain(ctx);
      const t = ctx.currentTime;
      f.bass.gain.setTargetAtTime((processing.bass-50)/5, t, 0.05);
    }, 30);
  }, [layers, brainwaves, processing, isPlaying]);

  useEffect(() => {
    Object.entries(natureSounds).forEach(([soundKey, cfg]) => {
      const masterGain = natureGainNodes.current[soundKey];
      if (masterGain) {
        masterGain.gain.setTargetAtTime(cfg.volume / 100, audioContextRef.current?.currentTime ?? 0, 0.02);
      }
    });
  }, [
    natureSounds.rain.volume, natureSounds.storm.volume, natureSounds.ocean.volume,
    natureSounds.wind.volume, natureSounds.fire.volume, natureSounds.waterfall.volume,
    natureSounds.river.volume, natureSounds.nightforest.volume, natureSounds.nightingale.volume
  ]);

  useEffect(() => {
  if (!isMobile) return;

  async function initBrainwavesMobile() {
    const engine = mobileEngineRef.current;
    const ctx = engine?.ctx;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch {}
    }
    if (ctx.state !== 'running') return;

    Object.entries(brainwaves).forEach(([type, cfg]) => {
      if (cfg.enabled) {
        if (!brainwaveOscRefs.current[type]) {
          const oscL = ctx.createOscillator();
          const oscR = ctx.createOscillator();
          const gain = ctx.createGain();
          const panL = ctx.createStereoPanner();
          const panR = ctx.createStereoPanner();
          panL.pan.value = -1;
          panR.pan.value = 1;
          oscL.frequency.value = cfg.carrier;
          oscR.frequency.value = cfg.carrier + cfg.beat;
          gain.gain.value = (cfg.intensity / 100) * 0.2;
          oscL.connect(panL); panL.connect(gain);
          oscR.connect(panR); panR.connect(gain);
          gain.connect(engine.masterGain);
          oscL.start();
          oscR.start();
          brainwaveOscRefs.current[type] = { oscL, oscR };
          brainwaveGainRefs.current[type] = gain;
        } else {
          const { oscL, oscR } = brainwaveOscRefs.current[type];
          const gain = brainwaveGainRefs.current[type];
          const t = ctx.currentTime;
          oscL.frequency.setTargetAtTime(cfg.carrier, t, 0.05);
          oscR.frequency.setTargetAtTime(cfg.carrier + cfg.beat, t, 0.05);
          if (gain) gain.gain.setTargetAtTime((cfg.intensity / 100) * 0.2, t, 0.05);
        }
      } else {
        const osc = brainwaveOscRefs.current[type];
        if (osc) {
          try { osc.oscL.stop(); } catch {}
          try { osc.oscR.stop(); } catch {}
          delete brainwaveOscRefs.current[type];
          delete brainwaveGainRefs.current[type];
        }
      }
    });
  }

  initBrainwavesMobile();
}, [brainwaves, isPlaying]);

  useEffect(() => {
    if (!isMobile || !isPlaying || !mobileEngineRef.current) return;
    const engine = mobileEngineRef.current;
    Object.entries(layers).forEach(([type, cfg]) => {
      const volume = cfg.volume;
      if (volume > 0) {
        if (!engine.layers[type]) {
          engine.playLayer(type, volume);
        } else {
          engine.setVolume(type, volume);
        }
      } else {
        if (engine.layers[type]) {
          engine.stopLayer(type);
        }
      }
    });
  }, [layers, isPlaying]);

  const natureLoadingRef = useRef({});

  const loadNatureBufferRealtime = async (ctx, soundKey) => {
    const url = NATURE_SOUND_URLS[soundKey];
    if (natureBufferCacheRef.current[soundKey]) {
      return natureBufferCacheRef.current[soundKey];
    }
    if (natureLoadingRef.current[soundKey]) {
      return natureLoadingRef.current[soundKey];
    }
    const promise = (async () => {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      const buffer = await ctx.decodeAudioData(arr);
      const trimStart = 0;
      const trimEnd = buffer.duration;
      const playDuration = trimEnd - trimStart;
      const data = { buffer, trimStart, trimEnd, playDuration };
      natureBufferCacheRef.current[soundKey] = data;
      delete natureLoadingRef.current[soundKey];
      return data;
    })();
    natureLoadingRef.current[soundKey] = promise;
    return promise;
  };

  const startNatureSound = (soundKey, volume) => {
    const ctx = isMobile ? mobileEngineRef.current?.ctx : audioContextRef.current;
    const destination = isMobile ? mobileEngineRef.current?.masterGain : (gainNodeRef.current ?? ctx?.destination);
    if (!ctx || ctx.state === 'closed') return;
    if (natureAudioRefs.current[soundKey]) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        if (!natureAudioRefs.current[soundKey] && (isMobile ? mobileEngineRef.current?.ctx : audioContextRef.current) === ctx) {
          startNatureSound(soundKey, natureSoundsRef.current[soundKey]?.volume ?? volume);
        }
      }).catch(err => console.error('ctx.resume failed:', err));
      return;
    }

    const gain1      = ctx.createGain();
    const gain2      = ctx.createGain();
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume / 100;
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    masterGain.connect(destination ?? ctx.destination);
    gain1.gain.value = 1;
    gain2.gain.value = 0;

    const XFADE     = 5.0;
    const LOOKAHEAD = 0.25;

    const state = {
      buffer: null, gain1, gain2, masterGain,
      src1: null, src2: null,
      currentPlayer: 1, timerId: null,
      trimStart: 0, trimEnd: 0, playDuration: 0,
      cancelled: false,
      _killedByUser: false
    };

    natureAudioRefs.current[soundKey] = state;
    natureGainNodes.current[soundKey] = masterGain;

    const makeSource = (gainNode) => {
      const src = ctx.createBufferSource();
      src.buffer = state.buffer;
      src.loop = false;
      src.connect(gainNode);
      return src;
    };

    const startPlayer = (which, when) => {
      const gainNode = which === 1 ? state.gain1 : state.gain2;
      const src = makeSource(gainNode);
      if (which === 1) state.src1 = src;
      else             state.src2 = src;
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
      try { if (outgoingSrc) outgoingSrc.stop(tX + XFADE + 0.05); } catch (e) {}
      state.currentPlayer = nextPlayer;
      const msUntilNext = Math.max(50, (tX + state.playDuration - XFADE - LOOKAHEAD - ctx.currentTime) * 1000);
      state.timerId = setTimeout(() => {
        if (state.cancelled || !natureAudioRefs.current[soundKey]) return;
        scheduleNextCrossfade(tX, nextPlayer);
      }, msUntilNext);
    };

    loadNatureBufferRealtime(ctx, soundKey)
      .then(({ buffer, trimStart, trimEnd, playDuration }) => {
        if (state._killedByUser || state.cancelled || !natureAudioRefs.current[soundKey]) {
          try { gain1.disconnect(); } catch (e) {}
          try { gain2.disconnect(); } catch (e) {}
          try { masterGain.disconnect(); } catch (e) {}
          return;
        }
        const MAX_SEGMENT = 120;
        const effectiveDuration = playDuration > MAX_SEGMENT ? MAX_SEGMENT : playDuration;
        const maxOffset = Math.max(0, playDuration - effectiveDuration - XFADE);
        const startOffset = maxOffset > 0 ? Math.random() * maxOffset : 0;
        state.buffer       = buffer;
        state.trimStart    = startOffset;
        state.trimEnd      = startOffset + effectiveDuration;
        state.playDuration = effectiveDuration;
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
        delete natureAudioRefs.current[soundKey];
        delete natureGainNodes.current[soundKey];
        console.error(`[nature] ${soundKey}: load error`, err);
      });
  };

  const stopNatureSoundImperative = (soundKey, immediate = false) => {
    const st = natureAudioRefs.current[soundKey];
    if (!st) return;
    st.cancelled = true;
    st._killedByUser = true;
    if (st.timerId) clearTimeout(st.timerId);
    const ctx = isMobile ? mobileEngineRef.current?.ctx : audioContextRef.current;
    const now = ctx?.currentTime ?? 0;
    if (immediate) {
      try { st.src1?.stop(0); } catch {}
      try { st.src2?.stop(0); } catch {}
      try { st.gain1?.disconnect(); } catch {}
      try { st.gain2?.disconnect(); } catch {}
      try { st.masterGain?.disconnect(); } catch {}
      delete natureAudioRefs.current[soundKey];
      delete natureGainNodes.current[soundKey];
    } else {
      try { if (st.masterGain) st.masterGain.gain.setTargetAtTime(0, now, 0.1); } catch (e) {}
      try { if (st.src1) st.src1.stop(now + 0.25); } catch (e) {}
      try { if (st.src2) st.src2.stop(now + 0.25); } catch (e) {}
      setTimeout(() => {
        try { st.gain1?.disconnect(); } catch {}
        try { st.gain2?.disconnect(); } catch {}
        try { st.masterGain?.disconnect(); } catch {}
        delete natureAudioRefs.current[soundKey];
        delete natureGainNodes.current[soundKey];
      }, 300);
    }
  };

  const killAllNatureNow = () => {
    Object.keys(natureAudioRefs.current).forEach((key) => {
      const st = natureAudioRefs.current[key];
      if (!st) return;
      st._killedByUser = true;
      st.cancelled = true;
      if (st.timerId) clearTimeout(st.timerId);
      try { st.src1?.stop(0); } catch {}
      try { st.src2?.stop(0); } catch {}
      try { st.gain1?.disconnect(); } catch {}
      try { st.gain2?.disconnect(); } catch {}
      try { st.masterGain?.disconnect(); } catch {}
    });
    natureAudioRefs.current = {};
    natureGainNodes.current = {};
  };

  const preloadAllNatureBuffers = (ctx) => {
    Object.keys(NATURE_SOUND_URLS).forEach(soundKey => {
      if (!natureBufferCacheRef.current[soundKey] && !natureLoadingRef.current[soundKey]) {
        loadNatureBufferRealtime(ctx, soundKey).catch(() => {});
      }
    });
  };

  const startAllEnabledNatureSounds = () => {
    const sounds = natureSoundsRef.current;
    Object.entries(sounds).forEach(([soundKey, cfg]) => {
      if (cfg.enabled && !natureAudioRefs.current[soundKey]) {
        startNatureSound(soundKey, cfg.volume);
      }
    });
  };

  // ══════════════════════════════════════════════════════════════
  // AUTO-PLAY: start audio if not already playing.
  // Protected by autoPlayPendingRef to prevent concurrent calls
  // when sliders are moved quickly.
  // ══════════════════════════════════════════════════════════════
  const ensurePlaying = async () => {
    if (isPlayingRef.current || isTransitioning || isGenerating) return;
    if (autoPlayPendingRef.current) return;
    autoPlayPendingRef.current = true;
    try {
      await play();
    } finally {
      autoPlayPendingRef.current = false;
    }
  };

  const handleNatureToggle = (soundKey, checked) => {
    if (natureToggleLock.current) return;
    natureToggleLock.current = true;
    setTimeout(() => { natureToggleLock.current = false; }, 300);

    setNatureSounds(prev => ({
      ...prev,
      [soundKey]: { ...prev[soundKey], enabled: checked }
    }));

    if (checked) {
      if (!isPlayingRef.current) {
        // Start playback first, then attach the nature sound once the engine is ready
        ensurePlaying().then(() => {
          const ctx = isMobile ? mobileEngineRef.current?.ctx : audioContextRef.current;
          if (ctx && ctx.state !== 'closed' && !natureAudioRefs.current[soundKey]) {
            const currentVolume = natureSoundsRef.current[soundKey]?.volume ?? 70;
            startNatureSound(soundKey, currentVolume);
          }
        });
      } else {
        const ctx = isMobile ? mobileEngineRef.current?.ctx : audioContextRef.current;
        if (ctx && ctx.state !== 'closed' && !natureAudioRefs.current[soundKey]) {
          const currentVolume = natureSoundsRef.current[soundKey]?.volume ?? 70;
          startNatureSound(soundKey, currentVolume);
        }
      }
    } else {
      if (natureAudioRefs.current[soundKey]) {
        stopNatureSoundImperative(soundKey, false);
      }
    }
  };

  const lastPlayTimestamp = useRef(0);
  const workletLoadedRef = useRef(false);

  const play = async () => {
    const now = Date.now();
    if (now - lastPlayTimestamp.current < 700) return;
    lastPlayTimestamp.current = now;
    if (isTransitioning) return;
    if (isPlaying) {
      stopSound();
      return;
    }

    setIsTransitioning(true);
    if (!workletLoadedRef.current) setIsGenerating(true);

    try {
      if (isMobile) {
        if (mobileEngineRef.current) {
          try { await mobileEngineRef.current.destroy(); } catch {}
          mobileEngineRef.current = null;
        }
        const engine = new MobileAudioEngine();
        await engine.init();
        if (engine.ctx && engine.ctx.state === 'suspended') {
          try { await engine.ctx.resume(); } catch {}
        }
        mobileEngineRef.current = engine;

        // Play layers that have volume > 0 (volume IS the intensity on mobile)
        Object.entries(layersRef.current).forEach(([type, cfg]) => {
          if (cfg.volume > 0) { engine.playLayer(type, cfg.volume); }
        });

        setIsPlaying(true);
        isPlayingRef.current = true;
        if (isLimited) startLimitTimer();
        startAllEnabledNatureSounds();
        setIsGenerating(false);
        setIsTransitioning(false);
        return;
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx({ latencyHint: 'interactive', sampleRate: 44100, channelCount: 2 });
      if (ctx.state === 'suspended') { await ctx.resume(); }
      audioContextRef.current = ctx;
      const masterGain = ctx.createGain();
      masterGain.gain.value = 1;
      gainNodeRef.current = masterGain;
      await ctx.audioWorklet.addModule('/realtime-engine.worklet.js');
      workletLoadedRef.current = true;
      if (ctx.state === 'suspended') { await ctx.resume(); }
      const engine = new AudioWorkletNode(ctx, 'realtime-engine', {
        numberOfOutputs: 1,
        outputChannelCount: [2],
        processorOptions: { renderQuantumSize: 128 }
      });
      mixerNodeRef.current = engine;
      const f = ensureStableChain(ctx);
      engine.connect(f.inGain);
      masterGain.connect(ctx.destination);
      if (ctx.state === 'suspended') { await ctx.resume(); }
      const forceParams = () => {
        const node = mixerNodeRef.current;
        if (!node || ctx.state !== 'running') return;
        const t = ctx.currentTime;
        // Use layersRef so we always have latest values even if called from ensurePlaying
        Object.entries(layersRef.current).forEach(([k, c]) => {
          node.parameters.get(`${k}_intensity`)?.setValueAtTime((c.intensity ?? 0) / 100, t);
          node.parameters.get(`${k}_volume`)?.setValueAtTime((c.volume ?? 100) / 100, t);
          node.parameters.get(`${k}_bass`)?.setValueAtTime((c.bass ?? 50) / 100, t);
          node.parameters.get(`${k}_texture`)?.setValueAtTime((c.texture ?? 50) / 100, t);
        });
        if (gainNodeRef.current) gainNodeRef.current.gain.setValueAtTime(1, t);
      };
      engine.port.postMessage({ type: 'warmup', samples: 4800 });
      forceParams();
      setTimeout(() => { forceParams(); syncAllRealtimeParams(ctx); }, 80);
      setTimeout(() => { forceParams(); syncAllRealtimeParams(ctx); }, 300);
      setTimeout(() => syncAllRealtimeParams(ctx), 800);
      setIsPlaying(true);
      isPlayingRef.current = true;
      if (isLimited) startLimitTimer();
      preloadAllNatureBuffers(ctx);
      startAllEnabledNatureSounds();
    } catch (err) {
      console.error('Play error:', err);
      try {
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      } catch(e) {}
    } finally {
      setIsGenerating(false);
      setIsTransitioning(false);
    }
  };

  const stopSound = () => {
    if (isMobile) {
      pauseLimitTimer();
      const engine = mobileEngineRef.current;
      mobileEngineRef.current = null;
      killAllNatureNow();
      // Stop brainwave oscillators
      Object.keys(brainwaveOscRefs.current).forEach(type => {
        const osc = brainwaveOscRefs.current[type];
        if (osc) {
          try { osc.oscL.stop(); } catch {}
          try { osc.oscR.stop(); } catch {}
        }
      });
      brainwaveOscRefs.current = {};
      brainwaveGainRefs.current = {};
      setIsPlaying(false);
      isPlayingRef.current = false;
      setIsGenerating(false);
      setIsTransitioning(true);
      (async () => {
        if (engine) {
          try { engine.fadeOut(0.08); } catch {}
          await new Promise(resolve => setTimeout(resolve, 120));
          try { engine.stopAll(); } catch {}
          try { await engine.destroy(); } catch {}
        }
        setIsTransitioning(false);
      })();
      return;
    }

    pauseLimitTimer();
    const ctx = audioContextRef.current;
    const gain = gainNodeRef.current;
    if (!ctx || !gain) {
      killAllNatureNow();
      mixerNodeRef.current = null;
      audioContextRef.current = null;
      filterNodesRef.current = {};
      setIsPlaying(false);
      isPlayingRef.current = false;
      setIsGenerating(false);
      setIsTransitioning(false);
      return;
    }
    if (!isPlaying) return;
    setIsPlaying(false);
    isPlayingRef.current = false;
    setIsTransitioning(true);
    const fadeTime = 0.1;
    const now = ctx.currentTime;
    try {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value || 1, now);
      gain.gain.linearRampToValueAtTime(0, now + fadeTime);
    } catch (e) {}
    killAllNatureNow();
    setTimeout(async () => {
      try {
        if (mixerNodeRef.current) mixerNodeRef.current.disconnect();
        if (filterNodesRef.current.inGain) filterNodesRef.current.inGain.disconnect();
        if (filterNodesRef.current.lpf) filterNodesRef.current.lpf.disconnect();
        if (filterNodesRef.current.bass) filterNodesRef.current.bass.disconnect();
        if (gain) gain.disconnect();
      } catch {}
      filterNodesRef.current = {};
      mixerNodeRef.current = null;
      if (ctx && ctx.state !== 'closed') { await ctx.close(); }
      audioContextRef.current = null;
      setIsGenerating(false);
      setIsTransitioning(false);
    }, fadeTime * 1000 + 100);
    setTimeout(() => {
      setIsTransitioning(false);
      setIsGenerating(false);
    }, fadeTime * 1000 + 500);
  };

  const [exportConfig, setExportConfig] = useState({ format: 'wav24_48', duration: 60 });

  const quickDurations = [
    { label: '1 min', seconds: 60 },
    { label: '5 min', seconds: 300 },
    { label: '10 min', seconds: 600 },
    { label: '30 min', seconds: 1800 },
    { label: '1 hour', seconds: 3600 },
    { label: '2 hours', seconds: 7200 },
    { label: '4 hours', seconds: 14400 },
    { label: '8 hours', seconds: 28800 }
  ];

  const exportTimeEstimates = {
    60:    { wav: '~15s',    mp3: '~30s' },
    300:   { wav: '~45s',    mp3: '~2min' },
    600:   { wav: '~1m30s',  mp3: '~3min' },
    1800:  { wav: '~4min',   mp3: '~10min' },
    3600:  { wav: '~9min',   mp3: '~20min' },
    7200:  { wav: '~18min',  mp3: '~40min' },
    14400: { wav: '~36min',  mp3: '~1h20m' },
    28800: { wav: '~1h12m',  mp3: '~2h30m' },
  };

  const isWavFormat = (fmt) => fmt === 'wav24_44' || fmt === 'wav24_48';
  const getEstimateForDuration = (seconds, fmt) => {
    const est = exportTimeEstimates[seconds];
    if (!est) return null;
    return isWavFormat(fmt) ? est.wav : est.mp3;
  };

  const buildWavHeader = (totalFrames, sr) => {
    const nc = 2, bps = 3, ba = nc * bps, br = sr * ba;
    const dataSize = totalFrames * ba;
    const buf = new ArrayBuffer(44);
    const v = new DataView(buf);
    let o = 0;
    const ws = (s) => { for (let i = 0; i < s.length; i++) v.setUint8(o++, s.charCodeAt(i)); };
    ws('RIFF'); v.setUint32(o, 36 + dataSize, true); o += 4;
    ws('WAVE'); ws('fmt '); v.setUint32(o, 16, true); o += 4;
    v.setUint16(o, 1, true); o += 2;
    v.setUint16(o, nc, true); o += 2;
    v.setUint32(o, sr, true); o += 4;
    v.setUint32(o, br, true); o += 4;
    v.setUint16(o, ba, true); o += 2;
    v.setUint16(o, 24, true); o += 2;
    ws('data'); v.setUint32(o, dataSize, true);
    return new Uint8Array(buf);
  };

  const floatStereoToPCM24 = (left, right) => {
    const frames = left.length;
    const out = new Uint8Array(frames * 6);
    for (let i = 0, o = 0; i < frames; i++, o += 6) {
      let l = left[i] < -1 ? -1 : left[i] > 1 ? 1 : left[i];
      let r = right[i] < -1 ? -1 : right[i] > 1 ? 1 : right[i];
      let li = (l < 0 ? l * 8388608 : l * 8388607) | 0;
      let ri = (r < 0 ? r * 8388608 : r * 8388607) | 0;
      out[o]     =  li        & 0xFF;
      out[o + 1] = (li >> 8)  & 0xFF;
      out[o + 2] = (li >> 16) & 0xFF;
      out[o + 3] =  ri        & 0xFF;
      out[o + 4] = (ri >> 8)  & 0xFF;
      out[o + 5] = (ri >> 16) & 0xFF;
    }
    return out;
  };

  const initMP3Worker = (sampleRate, kbps) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker('/mp3-worker.js');
      worker.onmessage = (e) => { if (e.data.type === 'ready') resolve(worker); };
      worker.onerror = (err) => reject(err);
      worker.postMessage({ type: 'init', data: { sampleRate, kbps } });
    });
  };

  const encodeChunkWithWorker = (worker, left, right, id) => {
    return new Promise((resolve) => {
      const leftCopy = new Float32Array(left);
      const rightCopy = new Float32Array(right);
      const handler = (e) => {
        if (e.data.type === 'encoded' && e.data.id === id) {
          worker.removeEventListener('message', handler);
          resolve(new Uint8Array(e.data.buffer));
        }
      };
      worker.addEventListener('message', handler);
      worker.postMessage(
        { type: 'encode', data: { left: leftCopy.buffer, right: rightCopy.buffer, id } },
        [leftCopy.buffer, rightCopy.buffer]
      );
    });
  };

  const flushMP3Worker = (worker) => {
    return new Promise((resolve) => {
      worker.onmessage = (e) => {
        if (e.data.type === 'flushed') {
          resolve(new Uint8Array(e.data.buffer));
          worker.terminate();
        }
      };
      worker.postMessage({ type: 'flush' });
    });
  };

  const mp3WorkerRef = useRef(null);

  const loadNatureBuffer = async (url) => {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    const tmpCtx = new OfflineAudioContext(2, 1, 44100);
    return await tmpCtx.decodeAudioData(arr);
  };

  const expSoundChunked = async (totalDuration, sampleRate, isMP3, formatType, formatDetail) => {
    let chunkDuration;
    if (isMP3) {
      chunkDuration = 600;
    } else {
      if (totalDuration <= 3600) chunkDuration = 1200;
      else if (totalDuration <= 7200) chunkDuration = 600;
      else if (totalDuration <= 14400) chunkDuration = 480;
      else chunkDuration = 300;
    }

    const numChunks = Math.ceil(totalDuration / chunkDuration);
    const startTime = Date.now();

    setExportProgress({ isExporting: true, currentChunk: 0, totalChunks: numChunks, percentage: 0, elapsedTime: 0, estimatedTimeLeft: 0, stage: 'rendering' });

    let mp3Worker = null;
    if (isMP3) {
      const kbps = parseInt(formatDetail);
      mp3Worker = await initMP3Worker(sampleRate, kbps);
    }

    const blobParts = [];
    let totalFrames = 0;

    // ── Load nature sound buffers ──────────────────────────────────
    const enabledNatureBuffers = {};
    const enabledNatureEntries = Object.entries(natureSounds).filter(([, cfg]) => cfg.enabled);
    if (enabledNatureEntries.length > 0) {
      setExportProgress(prev => ({ ...prev, stage: 'loading nature sounds' }));
      await Promise.all(
        enabledNatureEntries.map(async ([soundKey, cfg]) => {
          try {
            const url = NATURE_SOUND_URLS[soundKey];
            enabledNatureBuffers[soundKey] = { buffer: await loadNatureBuffer(url), volume: cfg.volume };
          } catch (err) {
            console.error(`Failed to load nature sound buffer for export: ${soundKey}`, err);
          }
        })
      );
    }

    // ── Load mobile noise layer buffers (only on mobile) ──────────
    // On mobile the worklet DSP is not used; noise is pre-rendered MP3 loops.
    // We load those same loops here so they appear in the exported file.
    const enabledNoiseBuffers = {};
    if (isMobile) {
      const activeNoiseEntries = Object.entries(layers).filter(([, cfg]) => cfg.volume > 0);
      if (activeNoiseEntries.length > 0) {
        setExportProgress(prev => ({ ...prev, stage: 'loading noise layers' }));
        await Promise.all(
          activeNoiseEntries.map(async ([noiseKey, cfg]) => {
            try {
              const url = MOBILE_NOISE_URLS[noiseKey];
              if (!url) return;
              const res  = await fetch(url);
              const arr  = await res.arrayBuffer();
              // Decode at a throwaway sample rate first, then we'll resample
              // via OfflineAudioContext during rendering if needed.
              const tmpCtx = new OfflineAudioContext(2, 1, sampleRate);
              const buffer = await tmpCtx.decodeAudioData(arr);
              enabledNoiseBuffers[noiseKey] = { buffer, volume: cfg.volume / 100 };
            } catch (err) {
              console.error(`Failed to load noise buffer for export: ${noiseKey}`, err);
            }
          })
        );
      }
    }

    setExportProgress(prev => ({ ...prev, stage: 'rendering' }));

    let pendingEncode = null;

    for (let chunkIndex = 0; chunkIndex < numChunks; chunkIndex++) {
      const isLastChunk = chunkIndex === numChunks - 1;
      const currentChunkDuration = isLastChunk ? totalDuration - (chunkIndex * chunkDuration) : chunkDuration;

      // On mobile we skip the worklet render entirely — the output IS the
      // noise loops + nature sounds mixed together.
      // On desktop we keep the original worklet render path.
      const extraDiscard = (!isMobile && chunkIndex === 0) ? 1.0 : 0;
      const renderDuration = currentChunkDuration + extraDiscard;
      const renderSamples  = Math.floor(sampleRate * renderDuration);

      const preElapsed = Math.floor((Date.now() - startTime) / 1000);
      const preProgress = Math.floor((chunkIndex / numChunks) * 100);
      const preAvg = chunkIndex > 0 ? preElapsed / chunkIndex : 0;
      const preETA = preAvg > 0 ? Math.floor(preAvg * (numChunks - chunkIndex)) : 0;
      setExportProgress(prev => ({ ...prev, currentChunk: chunkIndex, percentage: preProgress, elapsedTime: preElapsed, estimatedTimeLeft: preETA }));
      await new Promise(resolve => setTimeout(resolve, 0));

      const offlineCtx = new OfflineAudioContext(2, renderSamples, sampleRate);

      // Master gain for this chunk
      const masterGain = offlineCtx.createGain();
      masterGain.gain.value = 1.0;
      masterGain.connect(offlineCtx.destination);

      if (!isMobile) {
        // ── Desktop path: AudioWorklet DSP ──────────────────────
        await offlineCtx.audioWorklet.addModule('/realtime-engine.worklet.js');
        const engineNode = new AudioWorkletNode(offlineCtx, 'realtime-engine', { numberOfOutputs: 1, outputChannelCount: [2] });
        const inGain = offlineCtx.createGain(); inGain.gain.value = 1.0;
        const lpf = offlineCtx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 800; lpf.Q.value = 1;
        const bassFilter = offlineCtx.createBiquadFilter(); bassFilter.type = 'lowshelf'; bassFilter.frequency.value = 200; bassFilter.gain.value = (processing.bass - 50) / 5;
        engineNode.connect(inGain); inGain.connect(lpf); lpf.connect(bassFilter); bassFilter.connect(masterGain);

        const t = offlineCtx.currentTime;
        Object.entries(layers).forEach(([k, c]) => {
          engineNode.parameters.get(`${k}_intensity`)?.setValueAtTime((c.intensity ?? 0) / 100, t);
          engineNode.parameters.get(`${k}_volume`)?.setValueAtTime((c.volume ?? 100) / 100, t);
          engineNode.parameters.get(`${k}_bass`)?.setValueAtTime((c.bass ?? 50) / 100, t);
          engineNode.parameters.get(`${k}_texture`)?.setValueAtTime((c.texture ?? 50) / 100, t);
        });
        Object.entries(brainwaves).forEach(([k, c]) => {
          engineNode.parameters.get(`${k}_enabled`)?.setValueAtTime(c.enabled ? 1 : 0, t);
          engineNode.parameters.get(`${k}_carrier`)?.setValueAtTime(c.carrier ?? 200, t);
          engineNode.parameters.get(`${k}_beat`)?.setValueAtTime(c.beat ?? 10, t);
          engineNode.parameters.get(`${k}_intensity`)?.setValueAtTime((c.intensity ?? 50) / 100, t);
        });
        engineNode.parameters.get('stereoDecorr')?.setValueAtTime((processing.stereoDecorr ?? 0) / 100, t);
        engineNode.parameters.get('stereoWidth')?.setValueAtTime((processing.stereoWidth ?? 100) / 50, t);
        engineNode.parameters.get('harmonicSat')?.setValueAtTime((processing.harmonicSat ?? 0) / 100, t);
        engineNode.parameters.get('spectralDrift')?.setValueAtTime((processing.spectralDrift ?? 0) / 100, t);
        engineNode.parameters.get('temporalSmooth')?.setValueAtTime((processing.temporalSmooth ?? 0) / 100, t);
        engineNode.parameters.get('layerInteract')?.setValueAtTime((processing.layerInteract ?? 0) / 100, t);
        engineNode.parameters.get('microRandom')?.setValueAtTime((processing.microRandom ?? 0) / 100, t);
        engineNode.parameters.get('treble')?.setValueAtTime((processing.treble ?? 55) / 100, t);
        engineNode.parameters.get('mid')?.setValueAtTime((processing.mid ?? 55) / 100, t);
        engineNode.parameters.get('pressure')?.setValueAtTime((processing.pressure ?? 50) / 100, t);
        engineNode.parameters.get('master')?.setValueAtTime(1.0, t);
      } else {
        // ── Mobile path: noise loops via BufferSourceNode ────────
        // Each active noise layer is a looping BufferSource at the
        // same gain the user set (volume / 100).
        if (Object.keys(enabledNoiseBuffers).length > 0) {
          const noiseBus = offlineCtx.createGain();
          noiseBus.gain.value = 0.85; // match worklet BASE_GAIN
          noiseBus.connect(masterGain);

          const chunkStartSec = chunkIndex * chunkDuration;
          Object.entries(enabledNoiseBuffers).forEach(([, { buffer, volume }]) => {
            const bufDuration = buffer.duration;
            const loopOffset  = chunkStartSec % bufDuration;
            const src = offlineCtx.createBufferSource();
            src.buffer    = buffer;
            src.loop      = true;
            src.loopStart = 0;
            src.loopEnd   = bufDuration;
            const g = offlineCtx.createGain();
            g.gain.value  = volume;
            src.connect(g);
            g.connect(noiseBus);
            src.start(0, loopOffset, renderDuration);
          });
        }

        // Brainwaves on mobile: binaural oscillators
        Object.entries(brainwaves).forEach(([, cfg]) => {
          if (!cfg.enabled) return;
          const oscL  = offlineCtx.createOscillator();
          const oscR  = offlineCtx.createOscillator();
          const panL  = offlineCtx.createStereoPanner();
          const panR  = offlineCtx.createStereoPanner();
          const bGain = offlineCtx.createGain();
          panL.pan.value = -1;
          panR.pan.value =  1;
          oscL.frequency.value = cfg.carrier;
          oscR.frequency.value = cfg.carrier + cfg.beat;
          bGain.gain.value = (cfg.intensity / 100) * 0.2;
          oscL.connect(panL); panL.connect(bGain);
          oscR.connect(panR); panR.connect(bGain);
          bGain.connect(masterGain);
          oscL.start(0); oscR.start(0);
          oscL.stop(renderDuration); oscR.stop(renderDuration);
        });
      }

      // ── Nature sounds (both desktop and mobile) ──────────────────
      if (Object.keys(enabledNatureBuffers).length > 0) {
        const natureBus = offlineCtx.createGain();
        natureBus.gain.value = 1.0;
        natureBus.connect(masterGain);
        const chunkStartSec = chunkIndex * chunkDuration;
        Object.entries(enabledNatureBuffers).forEach(([, { buffer, volume }]) => {
          const bufDuration = buffer.duration;
          const loopOffset = chunkStartSec % bufDuration;
          const src = offlineCtx.createBufferSource();
          src.buffer = buffer;
          src.loop = true;
          src.loopStart = 0;
          src.loopEnd = bufDuration;
          const g = offlineCtx.createGain();
          g.gain.value = volume / 100;
          src.connect(g);
          g.connect(natureBus);
          src.start(0, loopOffset, renderDuration);
        });
      }

      if (pendingEncode) {
        const mp3Part = await pendingEncode.promise;
        if (mp3Part.length > 0) blobParts.push(mp3Part);
        pendingEncode = null;
      }

      let renderedBuffer = await offlineCtx.startRendering();
      let leftData  = renderedBuffer.getChannelData(0);
      let rightData = renderedBuffer.getChannelData(1);
      renderedBuffer = null;
      try { if (offlineCtx.close) { await offlineCtx.close(); } } catch {}

      // Discard warmup samples (desktop only, first chunk)
      if (!isMobile && chunkIndex === 0 && extraDiscard > 0) {
        const discardSamples = Math.floor(sampleRate * extraDiscard);
        leftData  = leftData.slice(discardSamples);
        rightData = rightData.slice(discardSamples);
      }

      const chunkLength = leftData.length;
      if (chunkIndex === 0) {
        const fadeInSamples = Math.floor(sampleRate * 0.02);
        for (let j = 0; j < fadeInSamples && j < chunkLength; j++) { const g = j / fadeInSamples; leftData[j] *= g; rightData[j] *= g; }
      }
      if (isLastChunk) {
        const fadeOutSamples = Math.floor(sampleRate * 0.05);
        const fadeStart = Math.max(0, chunkLength - fadeOutSamples);
        for (let j = fadeStart; j < chunkLength; j++) { const g = 1 - ((j - fadeStart) / fadeOutSamples); leftData[j] *= g; rightData[j] *= g; }
      }

      if (isMP3) {
        pendingEncode = { promise: encodeChunkWithWorker(mp3Worker, leftData, rightData, chunkIndex) };
        leftData = null; rightData = null;
      } else {
        blobParts.push(floatStereoToPCM24(leftData, rightData));
        totalFrames += chunkLength;
        leftData = null; rightData = null;
      }

      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const chunksCompleted = chunkIndex + 1;
      const progress = Math.floor((chunksCompleted / numChunks) * 100);
      const avgTimePerChunk = elapsedSeconds / chunksCompleted;
      const estimatedSecondsLeft = (numChunks - chunksCompleted) > 0 ? Math.floor(avgTimePerChunk * (numChunks - chunksCompleted)) : 0;
      setExportProgress({ isExporting: true, currentChunk: chunksCompleted, totalChunks: numChunks, percentage: Math.min(99, progress), elapsedTime: elapsedSeconds, estimatedTimeLeft: estimatedSecondsLeft, stage: 'rendering' });
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    if (pendingEncode) {
      const mp3Part = await pendingEncode.promise;
      if (mp3Part.length > 0) blobParts.push(mp3Part);
      pendingEncode = null;
    }

    setExportProgress(prev => ({ ...prev, stage: 'complete', percentage: 100 }));
    await new Promise(resolve => setTimeout(resolve, 80));

    let finalBlob, filename, mimeType;
    if (isMP3) {
      const tail = await flushMP3Worker(mp3Worker);
      if (tail.length > 0) blobParts.push(tail);
      mp3Worker = null;
      mimeType = 'audio/mpeg';
      filename = `sound-export-${Date.now()}.mp3`;
      finalBlob = new Blob(blobParts, { type: mimeType });
    } else {
      const header = buildWavHeader(totalFrames, sampleRate);
      mimeType = 'audio/wav';
      filename = `sound-export-${Date.now()}.wav`;
      finalBlob = new Blob([header, ...blobParts], { type: mimeType });
    }

    const url = URL.createObjectURL(finalBlob);
    finalBlob = null;
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 3000);

    const totalElapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    setExportProgress({ isExporting: false, currentChunk: numChunks, totalChunks: numChunks, percentage: 100, elapsedTime: totalElapsedSeconds, estimatedTimeLeft: 0, stage: 'complete' });

    if (notificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('🎵 Export Complete!', { body: `Your ${formatTime(totalDuration)} audio file is ready!\nFile: ${filename}`, icon: '/favicon.ico', tag: 'export-complete' });
    }
    setTimeout(() => { alert(`✅ Export complete!\n\nFile: ${filename}\nDuration: ${totalDuration}s\nChunks: ${numChunks}\nTime: ${totalElapsedSeconds}s`); }, 100);
    setTimeout(() => { setExportProgress({ isExporting: false, currentChunk: 0, totalChunks: 0, percentage: 0, elapsedTime: 0, estimatedTimeLeft: 0, stage: '' }); }, 8000);
  };

  const expSound = async () => {
    if (exportProgress.isExporting || isGenerating) return;
    const fmt = exportConfig.format;
    let sampleRate, isMP3, formatType, formatDetail;
    switch (fmt) {
      case 'wav24_44': sampleRate = 44100; isMP3 = false; formatType = 'wav'; formatDetail = '24'; break;
      case 'wav24_48': sampleRate = 48000; isMP3 = false; formatType = 'wav'; formatDetail = '24'; break;
      case 'mp3_320':  sampleRate = 44100; isMP3 = true;  formatType = 'mp3'; formatDetail = '320'; break;
      case 'mp3_256':  sampleRate = 44100; isMP3 = true;  formatType = 'mp3'; formatDetail = '256'; break;
      case 'mp3_192':  sampleRate = 44100; isMP3 = true;  formatType = 'mp3'; formatDetail = '192'; break;
      case 'mp3_160':  sampleRate = 44100; isMP3 = true;  formatType = 'mp3'; formatDetail = '160'; break;
      case 'mp3_128':  sampleRate = 44100; isMP3 = true;  formatType = 'mp3'; formatDetail = '128'; break;
      default:         sampleRate = 48000; isMP3 = false; formatType = 'wav'; formatDetail = '24'; break;
    }
    setIsGenerating(true);
    try {
      await expSoundChunked(exportConfig.duration, sampleRate, isMP3, formatType, formatDetail);
    } catch (err) {
      console.error('Export failed:', err);
      alert(`❌ Export failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const PRESETS = {
    DeepSleep: {
      layers: {
        pink:  { intensity: 62, volume: 55,  texture: 18, bass: 50, brightness: 50 },
        brown: { intensity: 100, volume: 87, texture: 15, bass: 50, brightness: 50 },
        grey:  { intensity: 100, volume: 87, texture: 15, bass: 50, brightness: 50 },
      },
      brainwaves: {},
      natureSounds: { storm: { enabled: true, volume: 7 } },
      processing: { bass: 50, treble: 55, mid: 55, stereoWidth: 120, pressure: 50, stereoDecorr: 35 }
    },
    CalmMind: {
      layers: {
        pink:  { intensity: 48, volume: 44,  texture: 22, bass: 50, brightness: 50 },
        brown: { intensity: 87, volume: 100, texture: 14, bass: 50, brightness: 50 },
        grey:  { intensity: 50, volume: 83,  texture: 18, bass: 50, brightness: 50 },
        green: { intensity: 46, volume: 60,  texture: 26, bass: 50, brightness: 50 },
      },
      brainwaves: { alpha: { enabled: true, carrier: 180, beat: 10, intensity: 14 } },
      natureSounds: { rain: { enabled: true, volume: 1 } },
      processing: { bass: 50, treble: 55, mid: 55, stereoWidth: 120, pressure: 50, stereoDecorr: 35 }
    },
    DeepFocus: {
      layers: {
        white: { intensity: 46, volume: 42,  texture: 18, bass: 50, brightness: 50 },
        pink:  { intensity: 50, volume: 100, texture: 16, bass: 50, brightness: 50 },
        brown: { intensity: 87, volume: 100, texture: 50, bass: 50, brightness: 50 },
        blue:  { intensity: 50, volume: 100, texture: 24, bass: 50, brightness: 50 },
      },
      brainwaves: { beta: { enabled: true, carrier: 220, beat: 13, intensity: 16 } },
      natureSounds: {},
      processing: { bass: 50, treble: 55, mid: 55, stereoWidth: 120, pressure: 50, stereoDecorr: 35 }
    },
    ADHDSupport: {
      layers: {
        white: { intensity: 38, volume: 100, texture: 20, bass: 50, brightness: 50 },
        pink:  { intensity: 44, volume: 40,  texture: 24, bass: 50, brightness: 50 },
        brown: { intensity: 90, volume: 100, texture: 18, bass: 50, brightness: 50 },
        green: { intensity: 64, volume: 100, texture: 30, bass: 50, brightness: 50 },
      },
      brainwaves: {},
      natureSounds: { rain: { enabled: true, volume: 4 } },
      processing: { bass: 50, treble: 55, mid: 55, stereoWidth: 120, pressure: 50, stereoDecorr: 35 }
    },
    MeditationFlow: {
      layers: {
        pink:  { intensity: 78,  volume: 100, texture: 22, bass: 50, brightness: 50 },
        brown: { intensity: 100, volume: 100, texture: 16, bass: 50, brightness: 50 },
        green: { intensity: 87,  volume: 100, texture: 30, bass: 50, brightness: 50 },
      },
      brainwaves: { theta: { enabled: true, carrier: 160, beat: 6, intensity: 14 } },
      natureSounds: {},
      processing: { bass: 50, treble: 55, mid: 55, stereoWidth: 120, pressure: 50, stereoDecorr: 35 }
    },
    TinnitusMasking: {
      layers: {
        white:  { intensity: 100, volume: 100, texture: 100, bass: 50, brightness: 50 },
        blue:   { intensity: 100, volume: 100, texture: 100, bass: 50, brightness: 50 },
        violet: { intensity: 100, volume: 100, texture: 100, bass: 50, brightness: 50 },
      },
      brainwaves: {},
      natureSounds: { waterfall: { enabled: true, volume: 50 } },
      processing: { bass: 50, treble: 55, mid: 55, stereoWidth: 120, pressure: 50, stereoDecorr: 35 }
    },
    DeepSpace: {
      layers: {
        pink:  { intensity: 72,  volume: 100, texture: 12,  bass: 50, brightness: 50 },
        brown: { intensity: 100, volume: 100, texture: 55,  bass: 50, brightness: 50 },
        blue:  { intensity: 71,  volume: 100, texture: 28,  bass: 50, brightness: 50 },
        black: { intensity: 100, volume: 100, texture: 100, bass: 50, brightness: 50 },
      },
      brainwaves: { theta: { enabled: true, carrier: 150, beat: 5, intensity: 12 } },
      natureSounds: {},
      processing: { bass: 50, treble: 55, mid: 55, stereoWidth: 120, pressure: 50, stereoDecorr: 35 }
    },
    MentalReset: {
      layers: {
        white: { intensity: 45,  volume: 100, texture: 18, bass: 50, brightness: 50 },
        pink:  { intensity: 46,  volume: 100, texture: 22, bass: 50, brightness: 50 },
        brown: { intensity: 100, volume: 100, texture: 14, bass: 50, brightness: 50 },
        blue:  { intensity: 100, volume: 100, texture: 69, bass: 50, brightness: 50 },
        green: { intensity: 75,  volume: 100, texture: 30, bass: 50, brightness: 50 },
      },
      brainwaves: {},
      natureSounds: { wind: { enabled: true, volume: 40 } },
      processing: { bass: 50, treble: 55, mid: 55, stereoWidth: 120, pressure: 50, stereoDecorr: 35 }
    },
  };

  const applyPreset = async (k) => {
    if (isApplyingPresetRef.current) return;
    isApplyingPresetRef.current = true;
    const p = PRESETS[k];
    if (!p) { isApplyingPresetRef.current = false; return; }

    const resetLayer = () => ({
      intensity: 0, bass: 50,
      volume: isMobile ? 0 : 100,
      texture: 50, brightness: 50
    });

    if (activePreset === k) {
      setActivePreset(null);
      setLayers(prev => { const reset = {}; Object.keys(prev).forEach(k => reset[k] = resetLayer()); return reset; });
      setBrainwaves(prev => { const reset = {}; Object.keys(prev).forEach(k => reset[k] = { ...prev[k], enabled:false }); return reset; });
      killAllNatureNow();
      setNatureSounds(prev => { const reset = {}; Object.keys(prev).forEach(k => reset[k] = { ...prev[k], enabled:false }); return reset; });
      if (isMobile) {
        setMobileLayerActive({ white: false, pink: false, brown: false, grey: false, blue: false, violet: false, black: false, green: false });
      }
      if (isPlaying) play();
      setTimeout(() => { isApplyingPresetRef.current = false; }, 600);
      return;
    }

    setActivePreset(k);
    setLayers(prev => { const reset = {}; Object.keys(prev).forEach(k => reset[k] = resetLayer()); return reset; });

    setTimeout(() => {
      setLayers(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(layerKey => {
          const presetLayer = p.layers?.[layerKey];
          if (!presetLayer) { next[layerKey] = resetLayer(); return; }
          if (isMobile) {
            next[layerKey] = { ...prev[layerKey], volume: presetLayer.intensity || 0 };
          } else {
            next[layerKey] = presetLayer;
          }
        });
        return next;
      });

      if (isMobile) {
        setMobileLayerActive(prev => {
          const next = {};
          Object.keys(prev).forEach(layerKey => {
            next[layerKey] = !!(p.layers?.[layerKey]?.intensity > 0);
          });
          return next;
        });
      }

      setBrainwaves(prev => {
        const merged = { ...prev };
        Object.keys(merged).forEach(k => merged[k] = { ...merged[k], enabled: false });
        if (p.brainwaves) {
          Object.keys(p.brainwaves).forEach(k => {
            if (merged[k]) merged[k] = { ...merged[k], ...p.brainwaves[k] };
          });
        }
        return merged;
      });

      if (p.natureSounds) {
        if (isMobile) {
          Object.keys(natureAudioRefs.current).forEach(sk => { stopNatureSoundImperative(sk, true); });
        }
        setNatureSounds(prev => {
          const next = {};
          Object.keys(prev).forEach(sk => {
            const presetSound = p.natureSounds?.[sk];
            if (presetSound) { next[sk] = { ...prev[sk], ...presetSound }; }
            else { next[sk] = { ...prev[sk], enabled: false }; }
          });
          return next;
        });
        if (isPlayingRef.current) {
          Object.entries(p.natureSounds).forEach(([sk, cfg]) => {
            if (cfg.enabled) { startNatureSound(sk, cfg.volume ?? 70); }
          });
        }
      }

      if (!isPlaying) play();
      setTimeout(() => { isApplyingPresetRef.current = false; }, 600);
    }, 150);
  };

  const getLayerDesc = (k) => {
    const d = {
      white: '✨ Bright, constant - Crystal clear focus',
      pink: '🌸 Balanced, natural - Like gentle rain',
      brown: '🌊 Deep, warm - Like distant ocean waves',
      grey: '☁️ Smooth, neutral - Easy listening comfort',
      blue: '💎 Crisp, airy - Fresh mountain breeze',
      violet: '⚡ Sharp, clean - High energy clarity',
      black: '🌑 Ultra-deep - Very calming depths',
      green: '🌿 Nature-like - Forest ambience'
    };
    return d[k] || '';
  };

  const getBrainDesc = (k) => {
    const d = {
      alpha: '🧘 Relaxed focus & creativity (10 Hz)',
      theta: '💭 Deep meditation & intuition (6 Hz)',
      delta: '😴 Deep sleep & healing (2 Hz)',
      beta: '🎯 Active thinking & alertness (20 Hz)',
      gamma: '⚡ Peak performance & insight (40 Hz)'
    };
    return d[k] || '';
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  // ── Responsive helpers ──────────────────────────────────────────
  const px = isMobile ? '16px' : '32px';
  const headerPy = isMobile ? '14px' : '24px';

  const ExportDurationButtons = ({ format }) => {
    const estimate = getEstimateForDuration(exportConfig.duration, format);
    return (
      <div>
        {estimate && (
          <div style={{ textAlign: 'left', marginBottom: '8px' }}>
            <span style={{ color: '#fde047', fontWeight: 600, fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
              {estimate} approx
            </span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: isMobile ? '6px' : '8px', marginBottom: '16px' }}>
          {quickDurations.map((option) => (
            <button
              key={option.label}
              onClick={() => setExportConfig(pr => ({ ...pr, duration: option.seconds }))}
              style={exportConfig.duration === option.seconds ? {
                background: 'linear-gradient(to right,#facc15,#fde047)',
                color: '#000', border: '2px solid #eab308',
                boxShadow: '0 4px 6px rgba(250,204,21,0.5)',
                padding: isMobile ? '8px 4px' : '12px',
                borderRadius: '8px', fontSize: isMobile ? '11px' : '12px',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s',
              } : {
                background: '#0f172a', color: '#fef9c3',
                border: '2px solid rgba(250,204,21,0.3)',
                padding: isMobile ? '8px 4px' : '12px',
                borderRadius: '8px', fontSize: isMobile ? '11px' : '12px',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ================= UI =================
  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'linear-gradient(135deg,#020617,#0f172a,#020617)', overflowX: 'hidden' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box !important; }
        html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; }
        @keyframes neurialWaveMotion {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        input[type=range] {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 8px; border-radius: 8px;
          background: rgba(51,65,85,0.5); cursor: pointer; outline: none; display: block;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: #facc15; cursor: pointer; box-shadow: 0 0 4px rgba(250,204,21,0.6);
        }
        input[type=range]::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: #facc15; cursor: pointer; border: none; box-shadow: 0 0 4px rgba(250,204,21,0.6);
        }
        input[type=checkbox] { accent-color: #facc15; width: 16px; height: 16px; cursor: pointer; }
      `}</style>

      <div style={{ width: '100%', minHeight: '100vh', background: 'linear-gradient(to bottom,rgba(15,23,42,0.97),rgba(2,6,23,0.97))' }}>

        {/* ── HEADER ── */}
        <div style={{
          padding: `${headerPy} ${px}`,
          borderBottom: '1px solid rgba(250,204,21,0.2)',
          background: 'linear-gradient(to right,rgba(15,23,42,0.5),rgba(30,41,59,0.5))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isMobile ? '2px' : '4px' }}>
                <a href="/" style={{ textDecoration: 'none' }}>
                  <h1 style={{
                    fontSize: isMobile ? '24px' : '30px',
                    fontWeight: 700, margin: 0,
                    background: 'linear-gradient(to right,#fef9c3,#fde047,#facc15)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'neurialWaveMotion 4s ease-in-out infinite', cursor: 'pointer'
                  }}>NEURIAL</h1>
                </a>
                <Waves style={{ width: isMobile ? '22px' : '30px', height: isMobile ? '22px' : '30px', color: '#fde047', animation: 'pulse 2s ease-in-out infinite', flexShrink: 0 }} />
              </div>
              {!isMobile && (
                <p style={{ fontSize: '14px', color: 'rgba(254,240,138,0.8)', margin: 0 }}>✨ Professional 3D audio with crystal-clear quality</p>
              )}
            </div>

            {isPro ? (
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: isMobile ? '10px' : '20px' }}>
                {!isMobile && <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{user?.email || 'markelarteche@gmail.com'}</span>}
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#facc15', whiteSpace: 'nowrap' }}>⚡ PRO</span>
                <button onClick={onSignOut} style={{ padding: isMobile ? '5px 10px' : '6px 12px', borderRadius: '8px', fontSize: '12px', color: '#94a3b8', border: '1px solid #475569', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>Sign out</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: isMobile ? '8px' : '20px' }}>
                {!isMobile && user?.email && <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{user.email}</span>}
                <button
                  onClick={() => window.location.href = `https://buy.stripe.com/bJebJ1eMgdmxcPf5r8b3q00?success_url=${encodeURIComponent(window.location.origin + '?upgraded=true')}`}
                  style={{ padding: isMobile ? '7px 12px' : '8px 16px', borderRadius: '12px', fontWeight: 700, fontSize: isMobile ? '13px' : '14px', background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000', border: '2px solid rgba(234,179,8,0.5)', boxShadow: '0 4px 6px rgba(250,204,21,0.3)', cursor: 'pointer', transition: 'all 0.3s', whiteSpace: 'nowrap' }}
                >
                  {isMobile ? 'Upgrade' : '⚡ Upgrade'}
                </button>
                {!isMobile && onSignOut && <button onClick={onSignOut} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', color: '#94a3b8', border: '1px solid #475569', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>Sign out</button>}
              </div>
            )}
          </div>
        </div>

        {/* ── PRESETS ── */}
        <div style={{ padding: `${isMobile ? '16px' : '24px'} ${px}`, borderBottom: '1px solid rgba(250,204,21,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '6px' : '8px', isolation: 'isolate' }}>
            {['DeepSleep', 'DeepSpace', 'CalmMind', 'MentalReset', 'DeepFocus', 'TinnitusMasking', 'ADHDSupport', 'MeditationFlow'].map(p => (
              <button
                key={p}
                onClick={() => { if (isTransitioning) return; applyPreset(p); }}
                style={activePreset === p ? {
                  padding: isMobile ? '10px 8px' : '12px 16px',
                  borderRadius: '8px', fontSize: isMobile ? '12px' : '14px',
                  fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s',
                  background: 'linear-gradient(to right,#facc15,#fde047)',
                  color: '#000', border: '2px solid #eab308',
                  boxShadow: '0 4px 6px rgba(250,204,21,0.5)',
                  outline: '2px solid rgba(250,204,21,0.5)', outlineOffset: '2px'
                } : {
                  padding: isMobile ? '10px 8px' : '12px 16px',
                  borderRadius: '8px', fontSize: isMobile ? '12px' : '14px',
                  fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s',
                  background: 'linear-gradient(to right,#1e293b,#0f172a)',
                  color: '#fff', border: '2px solid rgba(250,204,21,0.3)'
                }}
              >
                {formatPresetName(p)}
              </button>
            ))}
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ marginTop: isMobile ? '12px' : '16px', padding: `0 ${px}` }}>
          <div style={{ display: 'flex', gap: isMobile ? '6px' : '8px', paddingBottom: '12px', borderBottom: '1px solid rgba(250,204,21,0.1)' }}>
            {['layers', 'nature', 'brainwaves', 'export'].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={activeTab === t ? {
                  flex: 1, padding: isMobile ? '9px 4px' : '12px',
                  borderRadius: '12px', fontWeight: 600,
                  fontSize: isMobile ? '12px' : '14px',
                  cursor: 'pointer', transition: 'all 0.3s',
                  background: 'linear-gradient(to right,#facc15,#fde047)',
                  color: '#000', border: '2px solid #eab308',
                  boxShadow: '0 4px 6px rgba(250,204,21,0.5)'
                } : {
                  flex: 1, padding: isMobile ? '9px 4px' : '12px',
                  borderRadius: '12px', fontWeight: 600,
                  fontSize: isMobile ? '12px' : '14px',
                  cursor: 'pointer', transition: 'all 0.3s',
                  background: 'linear-gradient(to right,#1e293b,#0f172a)',
                  color: '#fff', border: '2px solid rgba(250,204,21,0.2)'
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ padding: `${isMobile ? '16px' : '24px'} ${px}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ===== LAYERS TAB ===== */}
            {activeTab === 'layers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderRadius: '8px', padding: '16px', marginBottom: '16px', background: 'linear-gradient(90deg,rgba(250,204,21,0.1),rgba(253,224,71,0.1))', border: '2px solid rgba(250,204,21,0.3)' }}>
                  <p style={{ color: '#fef08a', fontSize: '12px', margin: 0 }}>
                    🎨 <strong>Sound Colors:</strong> Each noise type has a unique frequency profile. Mix and match to create your perfect soundscape with crystal-clear 3D audio.
                    {isMobile ? (
                      <span style={{ display: 'block', marginTop: '6px' }}>🎧 Best experienced with headphones on</span>
                    ) : (
                      <span> &nbsp;·&nbsp; 🎧 Best experienced with headphones on</span>
                    )}
                  </p>
                </div>
                {Object.entries(layers).map(([t, c]) => {
  const isMobileActive = isMobile ? mobileLayerActive[t] : false;
  return (
    <div key={t} style={{
      padding: '16px', borderRadius: '8px', transition: 'all 0.3s',
      background: 'rgba(30,41,59,0.5)',
      border: isMobile
        ? `2px solid ${isMobileActive ? 'rgba(250,204,21,0.7)' : 'rgba(250,204,21,0.2)'}`
        : '2px solid rgba(250,204,21,0.2)',
      overflow: 'visible', textAlign: 'left'
    }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <h4 style={{ color: '#fef08a', fontWeight: 500, fontSize: '14px', textTransform: 'capitalize', margin: '0 0 4px 0' }}>{t} Noise</h4>
          <p style={{ fontSize: '12px', color: 'rgba(254,240,138,0.6)', margin: '0 0 8px 0' }}>{getLayerDesc(t)}</p>
        </div>
        {isMobile && (
          <button
            onClick={() => {
              const nowActive = !mobileLayerActive[t];
              setMobileLayerActive(prev => ({ ...prev, [t]: nowActive }));
              if (nowActive) {
                const vol = c.volume > 0 ? c.volume : 70;
                setLayers(pr => ({ ...pr, [t]: { ...pr[t], volume: vol } }));
                ensurePlaying();
              } else {
                setLayers(pr => ({ ...pr, [t]: { ...pr[t], volume: 0 } }));
              }
            }}
            style={{
              flexShrink: 0,
              marginLeft: '10px',
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.25s',
              background: isMobileActive
                ? 'linear-gradient(to right,#facc15,#fde047)'
                : 'rgba(51,65,85,0.8)',
              color: isMobileActive ? '#000' : '#94a3b8',
              boxShadow: isMobileActive ? '0 0 8px rgba(250,204,21,0.4)' : 'none',
            }}
          >
            {isMobileActive ? 'ON' : 'OFF'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!isMobile && (
          <div style={{ paddingBottom: '4px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: 'rgba(254,240,138,0.7)' }}>
              Intensity: <span {...NT}>{c.intensity}%</span>
            </label>
            <input
              type="range" min="0" max="100" value={c.intensity}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                const wasZero = layers[t].intensity === 0;
                setLayers(pr => ({ ...pr, [t]: { ...pr[t], intensity: v } }));
                sendParam(`${t}_intensity`, v / 100);
                if (wasZero && v > 0) ensurePlaying();
              }}
            />
          </div>
        )}

        {(isMobile ? isMobileActive : c.intensity > 0) && (
          <>
            <div style={{ paddingBottom: '4px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: 'rgba(254,240,138,0.7)' }}>
                Volume: <span {...NT}>{c.volume}%</span>
              </label>
              <input
                type="range" min="0" max="100" value={c.volume}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  const wasZero = isMobile && layers[t].volume === 0;
                  setLayers(pr => ({ ...pr, [t]: { ...pr[t], volume: v } }));
                  sendParam(`${t}_volume`, v / 100);
                  if (isMobile && wasZero && v > 0) ensurePlaying();
                }}
              />
            </div>
            {!isMobile && (
              <div style={{ paddingBottom: '4px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: 'rgba(254,240,138,0.7)' }}>
                  Texture: <span {...NT}>{c.texture}%</span>
                </label>
                <input
                  type="range" min="0" max="100" value={c.texture}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    setLayers(pr => ({ ...pr, [t]: { ...pr[t], texture: v } }));
                    sendParam(`${t}_texture`, v / 100);
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
    );
})}
              </div>
            )}


            {/* ===== NATURE TAB ===== */}
            {activeTab === 'nature' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderRadius: '8px', padding: '16px', marginBottom: '16px', background: 'linear-gradient(90deg,rgba(250,204,21,0.1),rgba(253,224,71,0.1))', border: '2px solid rgba(250,204,21,0.3)' }}>
                  <p style={{ color: '#fef08a', fontSize: '12px', margin: 0 }}>🌿 <strong>Nature Sounds:</strong> Add realistic nature ambience to your mix. These are your own high-quality recordings that loop seamlessly. &nbsp;·&nbsp; 🎧 Headphones bring every detail to life</p>
                </div>
                {['rain', 'storm', 'ocean', 'wind', 'fire', 'waterfall', 'river', 'nightforest', 'nightingale'].map((soundKey) => {
                  const soundConfig = natureSounds[soundKey];
                  const soundNames = {
                    rain: { name: '🌧️ Rain', desc: 'Gentle rain sounds' },
                    storm: { name: '⛈️ Thunderstorm', desc: 'Intense thunderstorm' },
                    ocean: { name: '🌊 Ocean Waves', desc: 'Calm ocean waves with birds' },
                    wind: { name: '💨 Wind', desc: 'Soft wind breeze' },
                    fire: { name: '🔥 Campfire', desc: 'Crackling fire sounds' },
                    waterfall: { name: '💧 Waterfall', desc: 'Flowing waterfall' },
                    river: { name: '🏞️ River in Forest', desc: 'River flowing through forest' },
                    nightforest: { name: '🌙 Night Forest', desc: 'Forest at night with insects' },
                    nightingale: { name: '🐦 Nightingale', desc: 'Pure nightingale song in forest' }
                  };
                  const info = soundNames[soundKey];
                  return (
                    <div
                      key={soundKey}
                      style={{
                        padding: '16px', borderRadius: '8px', transition: 'all 0.3s',
                        background: 'rgba(30,41,59,0.5)',
                        border: soundConfig.enabled ? '2px solid rgba(250,204,21,0.8)' : '2px solid rgba(250,204,21,0.2)',
                        overflow: 'visible', textAlign: 'left', cursor: 'pointer'
                      }}
                      onClick={() => handleNatureToggle(soundKey, !soundConfig.enabled)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <h4 style={{ color: '#fef08a', fontWeight: 500, fontSize: '14px', margin: '0 0 2px 0' }}>{info.name}</h4>
                          <p style={{ fontSize: '12px', color: 'rgba(254,240,138,0.6)', margin: 0 }}>{info.desc}</p>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={soundConfig.enabled}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleNatureToggle(soundKey, e.target.checked)} />
                          <span style={{ fontSize: '12px', color: 'rgba(254,240,138,0.7)' }}>Enable</span>
                        </label>
                      </div>
                      {soundConfig.enabled && (
                        <div style={{ marginTop: '12px', paddingBottom: '4px' }}>
                          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'rgba(254,240,138,0.7)' }}>Volume: <span {...NT}>{soundConfig.volume}%</span></label>
                          <input type="range" min="0" max="100" value={soundConfig.volume}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setNatureSounds(prev => ({ ...prev, [soundKey]: { ...prev[soundKey], volume: parseInt(e.target.value) } }))} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ===== BRAINWAVES TAB ===== */}
            {activeTab === 'brainwaves' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderRadius: '8px', padding: '16px', marginBottom: '16px', background: 'linear-gradient(90deg,rgba(250,204,21,0.1),rgba(253,224,71,0.1))', border: '2px solid rgba(250,204,21,0.3)' }}>
                  <p style={{ color: '#fef08a', fontSize: '12px', margin: 0 }}>
                    🧠 <strong>Brainwave Entrainment:</strong> Binaural beats that guide your brain into specific states.
                    {isMobile ? (
                      <span style={{ display: 'block', marginTop: '6px' }}>🎧 Headphones enhance the binaural effect</span>
                    ) : (
                      <span> &nbsp;·&nbsp; 🎧 Headphones enhance the binaural effect</span>
                    )}
                  </p>
                </div>
                {Object.entries(brainwaves).map(([t, c]) => (
                  <div
                    key={t}
                    style={{ padding: '16px', borderRadius: '8px', transition: 'all 0.3s', background: 'rgba(30,41,59,0.5)', border: '2px solid rgba(250,204,21,0.2)', overflow: 'visible', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => {
                      const willEnable = !brainwaves[t].enabled;
                      setBrainwaves(pr => ({ ...pr, [t]: { ...pr[t], enabled: !pr[t].enabled } }));
                      // Auto-play when enabling a brainwave
                      if (willEnable) ensurePlaying();
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ color: '#fef08a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', textTransform: 'capitalize' }}>
                        <input type="checkbox" checked={c.enabled}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            setBrainwaves(pr => ({ ...pr, [t]: { ...pr[t], enabled: e.target.checked } }));
                            if (e.target.checked) ensurePlaying();
                          }} />
                        {t} Wave
                      </label>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(254,240,138,0.6)', margin: '0 0 12px 0' }}>{getBrainDesc(t)}</p>
                    {c.enabled && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ paddingBottom: '4px' }}>
                          <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: 'rgba(254,240,138,0.7)' }}>Carrier Frequency: <span {...NT}>{c.carrier} Hz</span></label>
                          <input type="range" min="100" max="400" value={c.carrier}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => { const v = parseInt(e.target.value); setBrainwaves(pr => ({ ...pr, [t]: { ...pr[t], carrier: v } })); sendParam(`${t}_carrier`, v); }} />
                        </div>
                        <div style={{ paddingBottom: '4px' }}>
                          <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: 'rgba(254,240,138,0.7)' }}>Beat Frequency: <span {...NT}>{c.beat} Hz</span></label>
                          <input type="range" min="1" max="40" value={c.beat}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => { const v = parseInt(e.target.value); setBrainwaves(pr => ({ ...pr, [t]: { ...pr[t], beat: v } })); sendParam(`${t}_beat`, v); }} />
                        </div>
                        <div style={{ paddingBottom: '4px' }}>
                          <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: 'rgba(254,240,138,0.7)' }}>Wave Intensity: <span {...NT}>{c.intensity}%</span></label>
                          <input type="range" min="0" max="100" value={c.intensity}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => { const v = parseInt(e.target.value); setBrainwaves(pr => ({ ...pr, [t]: { ...pr[t], intensity: v } })); sendParam(`${t}_intensity`, v / 100); }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ===== EXPORT TAB ===== */}
            {activeTab === 'export' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {isLimited ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', textAlign: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '48px' }}>🔒</div>
                    <div>
                      <p style={{ color: '#fef08a', fontWeight: 700, fontSize: '18px', margin: '0 0 4px 0' }}>Export is a Pro feature</p>
                      <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>Upgrade to export unlimited audio in WAV 24-bit or MP3 at any duration.</p>
                    </div>
                    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left' }}>
                      <div style={{ borderRadius: '12px', padding: '16px', background: 'rgba(30,41,59,0.7)', border: '2px solid rgba(71,85,105,0.5)' }}>
                        <p style={{ fontWeight: 700, fontSize: '12px', color: '#cbd5e1', margin: '0 0 10px 0' }}>FREE</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                          <li style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#94a3b8' }}><span style={{ color: '#64748b', flexShrink: 0 }}>•</span>10 minute sessions</li>
                          <li style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#94a3b8' }}><span style={{ color: '#64748b', flexShrink: 0 }}>•</span>Basic sound layers</li>
                          <li style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#64748b' }}><span style={{ color: '#f87171', flexShrink: 0 }}>✕</span>No audio export</li>
                          <li style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#64748b' }}><span style={{ color: '#f87171', flexShrink: 0 }}>✕</span>Limited generator access</li>
                          <li style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#64748b' }}><span style={{ color: '#f87171', flexShrink: 0 }}>✕</span>No commercial usage</li>
                        </ul>
                      </div>
                      <div style={{ borderRadius: '12px', padding: '16px', position: 'relative', background: 'rgba(250,204,21,0.1)', border: '2px solid rgba(250,204,21,0.6)' }}>
                        <div style={{ position: 'absolute', borderRadius: '9999px', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#facc15', color: '#000', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', whiteSpace: 'nowrap' }}>RECOMMENDED</div>
                        <p style={{ fontWeight: 700, fontSize: '12px', color: '#fde047', margin: '0 0 2px 0' }}>PRO</p>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(250,204,21,0.8)', margin: '0 0 10px 0' }}>9.99€/month</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                          <li style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#e2e8f0' }}><span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>Unlimited sessions</li>
                          <li style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#e2e8f0' }}><span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>Unlimited audio export</li>
                          <li style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#e2e8f0' }}><span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>Export WAV 24-bit or MP3</li>
                          <li style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#e2e8f0' }}><span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>Commercial usage allowed</li>
                          <li style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#e2e8f0' }}><span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>Royalty-free audio</li>
                          <li style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#e2e8f0' }}><span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>High-quality rendering</li>
                          <li style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#e2e8f0' }}><span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>Priority feature updates</li>
                        </ul>
                      </div>
                    </div>
                    <button
                      onClick={() => window.location.href = `https://buy.stripe.com/bJebJ1eMgdmxcPf5r8b3q00?success_url=${encodeURIComponent(window.location.origin + '?upgraded=true')}`}
                      style={{ width: '100%', padding: '16px', borderRadius: '12px', fontWeight: 700, fontSize: '18px', background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000', border: '2px solid rgba(234,179,8,0.5)', boxShadow: '0 4px 6px rgba(250,204,21,0.3)', cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      ⚡ Upgrade to Pro — 9.99€/month
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(30,41,59,0.5)', border: '2px solid rgba(250,204,21,0.2)' }}>
                      <label style={{ display: 'block', color: '#fef08a', fontWeight: 500, fontSize: '14px', marginBottom: '12px', textAlign: 'left' }}>Quality</label>
                      <select
                        value={exportConfig.format}
                        onChange={(e) => setExportConfig(pr => ({ ...pr, format: e.target.value }))}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', background: '#0f172a', color: '#fef9c3', border: '2px solid rgba(250,204,21,0.3)', outline: 'none', boxSizing: 'border-box' }}
                      >
                        <option value="wav24_44">WAV 24-bit / 44.1kHz</option>
                        <option value="wav24_48">WAV 24-bit / 48kHz</option>
                        <option value="mp3_320">MP3 / 320 kbps</option>
                        <option value="mp3_256">MP3 / 256 kbps</option>
                        <option value="mp3_192">MP3 / 192 kbps</option>
                        <option value="mp3_160">MP3 / 160 kbps</option>
                        <option value="mp3_128">MP3 / 128 kbps</option>
                      </select>
                    </div>
                    <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(30,41,59,0.5)', border: '2px solid rgba(250,204,21,0.2)' }}>
                      <label style={{ display: 'block', color: '#fef08a', fontWeight: 500, fontSize: '14px', marginBottom: '12px', textAlign: 'left' }}>Duration</label>
                      <ExportDurationButtons format={exportConfig.format} />
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: 'rgba(254,240,138,0.7)', textAlign: 'left' }}>Custom (seconds): <span {...NT}>{exportConfig.duration}</span></label>
                        <input
                          type="number" value={exportConfig.duration}
                          onChange={(e) => setExportConfig(pr => ({ ...pr, duration: parseInt(e.target.value) || 60 }))}
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', background: '#0f172a', color: '#fef9c3', border: '2px solid rgba(250,204,21,0.3)', outline: 'none', boxSizing: 'border-box' }}
                          min="10" max="28800"
                        />
                        <p style={{ fontSize: '12px', color: 'rgba(254,240,138,0.6)', margin: '8px 0 0 0', textAlign: 'left' }}>Range: <span {...NT}>10</span> seconds to <span {...NT}>8</span> hours</p>
                      </div>
                    </div>
                    {typeof Notification !== 'undefined' && Notification.permission !== 'granted' && (
                      <button onClick={requestNotificationPermission} style={{ width: '100%', padding: '12px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', background: 'linear-gradient(to right,#1e293b,#0f172a)', color: '#fff', border: '2px solid rgba(250,204,21,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s', boxSizing: 'border-box' }}>
                        🔔 Enable notifications (recommended for long exports)
                      </button>
                    )}
                    {notificationsEnabled && (
                      <div style={{ borderRadius: '8px', padding: '16px', background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(74,222,128,0.3)' }}>
                        <p style={{ fontSize: '12px', textAlign: 'center', color: '#bbf7d0', margin: 0 }}>✅ Notifications enabled - You'll be notified when export completes</p>
                      </div>
                    )}
                    <button
                      onClick={expSound} disabled={isGenerating}
                      style={{ width: '100%', padding: '16px 24px', borderRadius: '12px', fontWeight: 700, fontSize: '18px', background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000', border: '2px solid rgba(234,179,8,0.5)', boxShadow: '0 4px 6px rgba(250,204,21,0.3)', cursor: isGenerating ? 'not-allowed' : 'pointer', opacity: isGenerating ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'all 0.3s', boxSizing: 'border-box' }}
                    >
                      {isGenerating
                        ? (<><div style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Exporting...</>)
                        : (<><Download style={{ width: '24px', height: '24px' }} />Export</>)
                      }
                    </button>
                  </>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ── EXPORT PROGRESS BAR ── */}
        {(exportProgress.stage !== '' || exportProgress.percentage === 100) && (
          <ExportProgressBar exportProgress={exportProgress} formatTime={formatTime} NT={NT} />
        )}

        {/* ── FADE OUT WARNING ── */}
        {isFadingOut && isLimited && (
          <div style={{
            margin: `0 ${px} 0 ${px}`,
            padding: '12px 20px', borderRadius: '12px',
            background: 'linear-gradient(90deg, rgba(250,204,21,0.15), rgba(234,179,8,0.1))',
            border: '1px solid rgba(250,204,21,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <p style={{ fontSize: '13px', color: '#fef08a', margin: 0 }}>
              ⏳ <strong>Sesión terminando...</strong> El audio se está desvaneciendo. Actualiza a Pro para continuar.
            </p>
            <button
              onClick={() => { window.location.href = `https://buy.stripe.com/bJebJ1eMgdmxcPf5r8b3q00?success_url=${encodeURIComponent(window.location.origin + '?upgraded=true')}`; }}
              style={{ padding: '6px 14px', borderRadius: '8px', background: '#facc15', color: '#000', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              ⚡ Upgrade
            </button>
          </div>
        )}

        {/* ── PLAY/STOP BUTTON ── */}
        <div style={{ padding: `${isMobile ? '16px' : '24px'} ${px}`, borderTop: '1px solid rgba(250,204,21,0.2)', background: 'linear-gradient(to top,rgba(2,6,23,0.5),rgba(15,23,42,0.5))' }}>
          <button
            onClick={play}
            disabled={isGenerating || isTransitioning}
            style={isPlaying ? {
              width: '100%', padding: isMobile ? '14px' : '16px',
              borderRadius: '12px', fontWeight: 700, fontSize: isMobile ? '16px' : '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              cursor: isGenerating || isTransitioning ? 'not-allowed' : 'pointer',
              opacity: isGenerating || isTransitioning ? 0.5 : 1, transition: 'all 0.3s',
              background: 'linear-gradient(to right,#dc2626,#ef4444)', color: '#fff',
              border: '2px solid rgba(239,68,68,0.5)', boxShadow: '0 4px 6px rgba(239,68,68,0.3)', boxSizing: 'border-box',
            } : {
              width: '100%', padding: isMobile ? '14px' : '16px',
              borderRadius: '12px', fontWeight: 700, fontSize: isMobile ? '16px' : '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              cursor: isGenerating || isTransitioning ? 'not-allowed' : 'pointer',
              opacity: isGenerating || isTransitioning ? 0.5 : 1, transition: 'all 0.3s',
              background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000',
              border: '2px solid rgba(234,179,8,0.5)', boxShadow: '0 4px 6px rgba(250,204,21,0.5)', boxSizing: 'border-box',
            }}
          >
            {isGenerating
              ? (<><div style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Preparing...</>)
              : isPlaying
                ? (<><Square style={{ width: '24px', height: '24px' }} />Stop</>)
                : (<><Play style={{ width: '24px', height: '24px' }} />Play</>)
            }
          </button>
          <div style={{ marginTop: '12px', fontSize: '12px', textAlign: 'center', color: 'rgba(254,240,138,0.6)' }}>✨ All changes update in real-time while playing</div>
        </div>

      </div>

      {/* ── FREE LIMIT MODAL ── */}
      {showLimitModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div style={{ borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '512px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: '#0f172a', border: '2px solid rgba(250,204,21,0.4)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#facc15', margin: '0 0 24px 0' }}>⏳ Free Limit Reached</h2>
            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ borderRadius: '12px', padding: '16px', textAlign: 'left', background: 'rgba(30,41,59,0.7)', border: '2px solid rgba(71,85,105,0.5)' }}>
                <p style={{ fontWeight: 700, fontSize: '13px', color: '#cbd5e1', margin: '0 0 10px 0' }}>FREE</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#94a3b8' }}><span style={{ color: '#64748b', flexShrink: 0 }}>•</span>10 minute sessions</li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#94a3b8' }}><span style={{ color: '#64748b', flexShrink: 0 }}>•</span>Basic sound layers</li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#64748b' }}><span style={{ color: '#f87171', flexShrink: 0 }}>✕</span>No audio export</li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#64748b' }}><span style={{ color: '#f87171', flexShrink: 0 }}>✕</span>Limited generator access</li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#64748b' }}><span style={{ color: '#f87171', flexShrink: 0 }}>✕</span>No commercial usage</li>
                </ul>
              </div>
              <div style={{ borderRadius: '12px', padding: '16px', textAlign: 'left', position: 'relative', background: 'rgba(250,204,21,0.1)', border: '2px solid rgba(250,204,21,0.6)' }}>
                <div style={{ position: 'absolute', borderRadius: '9999px', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#facc15', color: '#000', fontSize: '0.65rem', fontWeight: 700, padding: '2px 10px', whiteSpace: 'nowrap' }}>RECOMMENDED</div>
                <p style={{ fontWeight: 700, fontSize: '13px', color: '#fde047', margin: '0 0 2px 0' }}>PRO</p>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(250,204,21,0.8)', margin: '0 0 10px 0' }}>9.99€ / month</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#e2e8f0' }}><span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>Unlimited sessions</li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#e2e8f0' }}><span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>Unlimited audio export</li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#e2e8f0' }}><span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>Export WAV 24-bit or MP3</li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#e2e8f0' }}><span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>Commercial usage allowed</li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#e2e8f0' }}><span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>Royalty-free audio</li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#e2e8f0' }}><span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>High-quality rendering</li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#e2e8f0' }}><span style={{ color: '#facc15', flexShrink: 0 }}>✓</span>Priority feature updates</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => window.location.href = `https://buy.stripe.com/bJebJ1eMgdmxcPf5r8b3q00?success_url=${encodeURIComponent(window.location.origin + '?upgraded=true')}`}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', fontWeight: 700, fontSize: '18px', textAlign: 'center', background: 'linear-gradient(to right,#facc15,#fde047)', color: '#000', border: '2px solid rgba(234,179,8,0.5)', boxShadow: '0 4px 6px rgba(250,204,21,0.3)', cursor: 'pointer', transition: 'all 0.3s', boxSizing: 'border-box' }}
            >
              ⚡ Upgrade to Pro — 9.99€/month
            </button>
            <button
              onClick={() => setShowLimitModal(false)}
              style={{ marginTop: '16px', fontSize: '14px', color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Continue in Free
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdvancedSoundEngine;