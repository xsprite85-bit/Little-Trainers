/* ===== מנוע ניתוח הקול: הכול רץ על המכשיר, שום הקלטה לא נשלחת החוצה ===== */
const Engine = (() => {
  const N = 2048, H = 1024;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const win = new Float32Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
  const rev = new Uint16Array(N);
  for (let i = 0, bits = Math.log2(N); i < N; i++) {
    let r = 0; for (let b = 0; b < bits; b++) if (i & (1 << b)) r |= 1 << (bits - 1 - b);
    rev[i] = r;
  }
  function fft(re, im) {
    for (let i = 0; i < N; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let size = 2; size <= N; size <<= 1) {
      const half = size >> 1, ang = -2 * Math.PI / size;
      for (let s = 0; s < N; s += size) for (let k = 0; k < half; k++) {
        const c = Math.cos(ang * k), sn = Math.sin(ang * k);
        const a = s + k, b = a + half;
        const tr = re[b] * c - im[b] * sn, ti = re[b] * sn + im[b] * c;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
      }
    }
  }
  function spectral(frame, sr) {
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) re[i] = frame[i] * win[i];
    fft(re, im);
    const lo = Math.max(2, Math.round(200 * N / sr)), hi = Math.min(N / 2 - 1, Math.round(6000 * N / sr));
    let lsum = 0, asum = 0, csum = 0, wsum = 0, n = 0;
    for (let k = lo; k <= hi; k++) {
      const p = re[k] * re[k] + im[k] * im[k] + 1e-12;
      lsum += Math.log(p); asum += p; n++;
      const f = k * sr / N; csum += f * p; wsum += p;
    }
    return { flat: Math.exp(lsum / n) / (asum / n), centroid: csum / wsum };
  }
  function pitch(frame, sr) {
    const minLag = Math.floor(sr / 2000), maxLag = Math.min(N / 2, Math.floor(sr / 70));
    let r0 = 0; for (let i = 0; i < N; i++) r0 += frame[i] * frame[i];
    if (r0 < 1e-9) return { f0: 0, strength: 0 };
    const r = new Float32Array(maxLag + 2);
    let best = 0;
    for (let lag = minLag; lag <= maxLag + 1; lag++) {
      let s = 0; for (let i = 0; i < N - lag; i++) s += frame[i] * frame[i + lag];
      r[lag] = s / r0; if (lag <= maxLag && r[lag] > best) best = r[lag];
    }
    if (best < 0.4) return { f0: 0, strength: best };
    let pick = -1;
    for (let lag = minLag + 1; lag <= maxLag; lag++) {
      if (r[lag] >= 0.9 * best && r[lag] >= r[lag - 1] && r[lag] >= r[lag + 1]) { pick = lag; break; }
    }
    if (pick < 0) return { f0: 0, strength: best };
    const a = r[pick - 1], b = r[pick], c = r[pick + 1], d = a - 2 * b + c;
    const off = d !== 0 ? 0.5 * (a - c) / d : 0;
    return { f0: sr / (pick + off), strength: best };
  }

  function analyze(x, sr) {
    const frames = [];
    for (let s = 0; s + N <= x.length; s += H) {
      let e = 0; for (let i = 0; i < N; i++) e += x[s + i] * x[s + i];
      frames.push({ s, rms: Math.sqrt(e / N) });
    }
    if (frames.length < 3) return { calls: 0, empty: true };
    const sorted = frames.map(f => f.rms).sort((a, b) => a - b);
    const maxRms = sorted[Math.floor(sorted.length * 0.97)];
    const floor = sorted[Math.floor(sorted.length * 0.2)];
    const thr = Math.max(floor * 3, maxRms * 0.22, 0.004);
    const act = frames.map(f => f.rms > thr);
    for (let i = 1; i < act.length - 1; i++) if (!act[i] && act[i - 1] && act[i + 1]) act[i] = true;
    const calls = []; let cur = null;
    act.forEach((a, i) => {
      if (a) { if (!cur) cur = { a: i, b: i }; else cur.b = i; }
      else if (cur) { calls.push(cur); cur = null; }
    });
    if (cur) calls.push(cur);
    const good = calls.filter(c => c.b - c.a >= 1);
    if (!good.length) return { calls: 0, empty: true, maxRms };
    const f0s = [], flats = [], cents = [];
    good.forEach(c => {
      for (let i = c.a; i <= c.b; i++) {
        const fr = x.subarray(frames[i].s, frames[i].s + N);
        const p = pitch(fr, sr); if (p.f0 > 0) f0s.push(p.f0);
        const sp = spectral(fr, sr); flats.push(sp.flat); cents.push(sp.centroid);
      }
    });
    const durs = good.map(c => ((c.b - c.a) * H + N) / sr);
    const starts = good.map(c => frames[c.a].s / sr);
    const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
    const med = a => { const b = [...a].sort((p, q) => p - q); return b[Math.floor(b.length / 2)]; };
    const f0 = f0s.length ? med(f0s) : 0;
    const f0cv = f0s.length > 2 ? Math.sqrt(mean(f0s.map(v => (v - mean(f0s)) ** 2))) / mean(f0s) : 0;
    const rate = good.length >= 2 ? (good.length - 1) / (starts[starts.length - 1] - starts[0]) : 0;
    return {
      calls: good.length, rate, meanDur: mean(durs), f0, f0cv,
      voiced: f0s.length / Math.max(1, flats.length),
      flat: med(flats), centroid: mean(cents),
      peakDb: 20 * Math.log10(Math.max(maxRms, 1e-6)),
      snr: 20 * Math.log10(Math.max(maxRms, 1e-6) / Math.max(floor, 1e-6)),
      seconds: x.length / sr
    };
  }

  const DEFAULT_F0 = { dog: 500, cat: 550 };
  function interpret(f, animal, baseline, calibrated) {
    if (f.empty || !f.calls) return { emotion: 'none', arousal: 0, confidence: 0 };
    const base = baseline || DEFAULT_F0[animal];
    const pr = f.f0 ? f.f0 / base : 1;
    const harsh = clamp((Math.log10(f.flat) + 3) / 2.6);
    const loud = clamp((f.peakDb + 50) / 40);
    const rateN = f.calls >= 2 ? clamp(f.rate / 4) : clamp(0.35 - f.meanDur * 0.2, 0, 0.35);
    const pitchN = clamp((pr - 0.8) / 0.8);
    const varN = clamp(f.f0cv / 0.3);
    const arousal = Math.round(100 * (0.15 * loud + 0.35 * rateN + 0.3 * pitchN + 0.2 * varN) / 1.0);
    const valence = clamp((0.5 - harsh) * 1.4 + clamp(pr - 1, -0.5, 0.5) * 0.4, -1, 1);
    let emotion;
    const long = f.meanDur > 0.5, frequent = f.calls >= 3 && f.rate >= 1.5;
    if (animal === 'dog') {
      if (arousal < 30 && harsh < 0.6 && !long) emotion = 'calm';
      else if (harsh > 0.55) emotion = (frequent && !long) ? 'alert' : 'angry';
      else if (long && f.rate < 2.5) emotion = (f.rate >= 1 || arousal >= 62) ? 'scared' : 'lonely';
      else if (frequent) emotion = 'playful';
      else emotion = arousal < 45 ? 'lonely' : 'playful';
    } else {
      if (arousal < 25 && harsh < 0.6) emotion = 'calm';
      else if (harsh > 0.6) emotion = 'angry';
      else if (long) emotion = arousal > 60 ? 'scared' : 'lonely';
      else emotion = 'playful';
    }
    let conf = 1;
    if (f.calls >= 3 && f.snr >= 12) conf = 2;
    if (calibrated && f.calls >= 3 && f.snr >= 18 && f.voiced > 0.5) conf = 3;
    if (f.calls < 2 || f.snr < 8) conf = 1;
    return {
      emotion, arousal, valence, confidence: conf,
      m: { calls: f.calls, rate: f.rate, dur: f.meanDur, f0: f.f0, pr, harsh, loud, cv: f.f0cv, db: f.peakDb },
      f0: f.f0
    };
  }

  /* ----- צלילי דוגמה מסונתזים, כדי שהאפליקציה תעבוד גם בלי מיקרופון ----- */
  const SR = 22050;
  function tone(n, f0fn, harms, harsh, ampFn, vibHz, vibDepth) {
    const out = new Float32Array(n); let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      let f = f0fn(i / n) * (1 + (vibHz ? vibDepth * Math.sin(2 * Math.PI * vibHz * t) : 0));
      ph += 2 * Math.PI * f / SR;
      let s = 0; for (let h = 1; h <= harms; h++) s += Math.sin(ph * h) / h;
      s = s * (1 - harsh) + (Math.random() * 2 - 1) * harsh * 1.6;
      out[i] = s * ampFn(i / n, t) * 0.35;
    }
    return out;
  }
  const env = (a = 0.08, p = 2) => u => u < a ? u / a : Math.pow(1 - (u - a) / (1 - a), p);
  function seq(parts, gaps) {
    let len = 0; parts.forEach((p, i) => len += p.length + Math.floor((gaps[i] || 0) * SR));
    const out = new Float32Array(len + SR * 0.4); let pos = Math.floor(SR * 0.2);
    parts.forEach((p, i) => { out.set(p, pos); pos += p.length + Math.floor((gaps[i] || 0) * SR); });
    return out;
  }
  const bark = (f0, dur, harsh, amp = 1) => { const e = env(0.06, 2); return tone(Math.floor(dur * SR), u => f0 * (1.12 - 0.2 * u), 8, harsh, (u) => e(u) * amp); };
  const SAMPLES = {
    dog: [
      { id: 'play', label: 'משחק', pic: '🎾', make: () => seq(Array.from({ length: 6 }, (_, i) => bark(700 + (i % 2) * 60, 0.12, 0.08)), Array(6).fill(0.17)) },
      { id: 'door', label: 'מישהו ליד הדלת', pic: '🚪', make: () => seq(Array.from({ length: 5 }, () => bark(420, 0.16, 0.55)), Array(5).fill(0.3)) },
      { id: 'growl', label: 'נהמה', pic: '😠', make: () => { const e = env(0.15, 0.6); return seq([tone(Math.floor(1.4 * SR), () => 115, 10, 0.5, (u, t) => e(u) * (0.65 + 0.35 * Math.sin(2 * Math.PI * 28 * t)), 0, 0)], [0]); } },
      { id: 'lonely', label: 'געגוע', pic: '🌙', make: () => { const e = env(0.2, 0.7); const w = () => tone(Math.floor(0.95 * SR), u => 850 + 250 * u, 5, 0.03, (u) => e(u), 6, 0.01); return seq([w(), w()], [0.7, 0]); } },
      { id: 'scared', label: 'פחד', pic: '😨', make: () => { const e = env(0.1, 0.8); const w = () => tone(Math.floor(0.55 * SR), u => 1150 - 150 * u, 5, 0.04, (u) => e(u), 9, 0.04); return seq([w(), w(), w()], [0.28, 0.28, 0]); } },
      { id: 'calm', label: 'רגוע', pic: '😴', make: () => seq([bark(480, 0.2, 0.1, 0.12)], [0]) }
    ],
    cat: [
      { id: 'hungry', label: 'אני רעבה', pic: '🍽️', make: () => { const e = env(0.15, 0.8); const m = () => tone(Math.floor(1.1 * SR), u => 480 + 260 * Math.sin(Math.PI * u), 6, 0.04, (u) => e(u), 5, 0.01); return seq([m(), m()], [0.8, 0]); } },
      { id: 'hello', label: 'שלום', pic: '👋', make: () => { const e = env(0.1, 1.2); const m = () => tone(Math.floor(0.3 * SR), u => 650 + 200 * u, 6, 0.04, (u) => e(u)); return seq([m(), m(), m()], [0.35, 0.35, 0]); } },
      { id: 'hiss', label: 'שורקת', pic: '💢', make: () => { const e = env(0.1, 1); return seq([tone(Math.floor(0.9 * SR), () => 300, 3, 0.85, (u) => e(u))], [0]); } },
      { id: 'calmcat', label: 'רגועה', pic: '😽', make: () => seq([tone(Math.floor(0.4 * SR), u => 520, 5, 0.05, env(0.2, 1.5), 0, 0).map(v => v * 0.12)], [0]) }
    ]
  };
  return { analyze, interpret, SAMPLES, SR, DEFAULT_F0 };
})();
if (typeof module !== 'undefined') module.exports = Engine;
