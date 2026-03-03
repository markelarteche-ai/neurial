importScripts('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js');

let mp3Encoder = null;

self.onmessage = (e) => {
  const { type, data } = e.data;

  if (type === 'init') {
    mp3Encoder = new lamejs.Mp3Encoder(2, data.sampleRate, data.kbps);
    self.postMessage({ type: 'ready' });
  }

  else if (type === 'encode') {
    const left = new Float32Array(data.left);
    const right = new Float32Array(data.right);
    const BLOCK = 1152;
    const n = left.length;
    const parts = [];
    let totalLen = 0;
    const lBlock = new Int16Array(BLOCK);
    const rBlock = new Int16Array(BLOCK);
    for (let i = 0; i < n; i += BLOCK) {
      const end = i + BLOCK < n ? i + BLOCK : n;
      const bs = end - i;
      for (let j = 0; j < bs; j++) {
        let l = left[i + j]; if (!Number.isFinite(l)) l = 0; l = l < -1 ? -1 : l > 1 ? 1 : l;
        let r = right[i + j]; if (!Number.isFinite(r)) r = 0; r = r < -1 ? -1 : r > 1 ? 1 : r;
        lBlock[j] = (l < 0 ? l * 32768 : l * 32767) | 0;
        rBlock[j] = (r < 0 ? r * 32768 : r * 32767) | 0;
      }
      const buf = mp3Encoder.encodeBuffer(
        bs === BLOCK ? lBlock : lBlock.subarray(0, bs),
        bs === BLOCK ? rBlock : rBlock.subarray(0, bs)
      );
      if (buf.length > 0) { parts.push(buf); totalLen += buf.length; }
    }
    const out = new Uint8Array(totalLen);
    let off = 0;
    for (const p of parts) { out.set(p, off); off += p.length; }
    self.postMessage({ type: 'encoded', id: data.id, buffer: out.buffer }, [out.buffer]);
  }

  else if (type === 'flush') {
    const tail = mp3Encoder.flush();
    const out = tail.length > 0 ? new Uint8Array(tail) : new Uint8Array(0);
    self.postMessage({ type: 'flushed', buffer: out.buffer }, [out.buffer]);
    mp3Encoder = null;
  }
};