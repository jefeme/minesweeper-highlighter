(() => {
  try { hileDurdur(); } catch (e) {}
  const TOTAL = { 81: 10, 256: 40, 480: 99 };
  let lastKey = '';
  const lf = [0]; for (let i = 1; i <= 600; i++) lf[i] = lf[i - 1] + Math.log(i);
  const binom = (n, k) => (k < 0 || k > n) ? 0 : Math.exp(lf[n] - lf[k] - lf[n - k]);

  function enumerate(vars, cons) {
    const byVar = new Map(vars.map(v => [v, []]));
    cons.forEach((q, j) => q.U.forEach(k => byVar.get(k).push(j)));
    const start = [...vars].sort((a, b) => byVar.get(b).length - byVar.get(a).length)[0];
    const order = [], seen = new Set([start]), qu = [start];
    while (qu.length) {
      const v = qu.shift(); order.push(v);
      for (const j of byVar.get(v)) for (const k of cons[j].U) if (!seen.has(k)) { seen.add(k); qu.push(k); }
    }
    const cv = order.map(v => byVar.get(v));
    const mine = cons.map(() => 0), left = cons.map(q => q.U.length);
    const val = [], N = {}, cnt = {};
    let steps = 0, abort = false, mc = 0;
    const t0 = performance.now();
    (function rec(i) {
      if (abort) return;
      if ((++steps & 0xfff) === 0 && performance.now() - t0 > 1500) { abort = true; return; }
      if (i === order.length) {
        N[mc] = (N[mc] || 0) + 1;
        const a = cnt[mc] || (cnt[mc] = new Array(order.length).fill(0));
        for (let x = 0; x < i; x++) if (val[x]) a[x]++;
        return;
      }
      for (const v of [0, 1]) {
        for (const j of cv[i]) { mine[j] += v; left[j]--; }
        let ok = true;
        for (const j of cv[i]) if (mine[j] > cons[j].n || mine[j] + left[j] < cons[j].n) { ok = false; break; }
        if (ok) { val[i] = v; mc += v; rec(i + 1); mc -= v; }
        for (const j of cv[i]) { mine[j] -= v; left[j]++; }
      }
    })(0);
    if (abort || !Object.keys(N).length) return null;
    return { order, N, cnt, ks: Object.keys(N).map(Number) };
  }

  function findCells() {
    const out = [];
    document.querySelectorAll('[id^="cell_"]').forEach(el => {
      const m = el.id.match(/^cell_(\d+)_(\d+)$/);
      if (m) out.push([+m[1], +m[2], el]);
    });
    return out;
  }

  function readCell(el) {
    const cl = String(el.className);
    if (/closed|flag|hidden|unopened/.test(cl)) return '#';
    const m = cl.match(/(?:type|num|number|n)[_-]?(\d+)(?!\d)/);
    if (m) { const n = +m[1]; return n >= 1 && n <= 8 ? n : (n === 0 ? 0 : '#'); }
    const t = (el.textContent || '').trim();
    if (/^[1-8]$/.test(t)) return +t;
    if (/open/.test(cl)) return 0;
    return '#';
  }

  let layer = null, items = [];
  function paint() {
    if (!layer) {
      layer = document.createElement('div');
      layer.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none';
      document.body.appendChild(layer);
    }
    layer.innerHTML = '';
    for (const it of items) {
      if (!/closed|flag/.test(it.el.className)) continue;
      const r = it.el.getBoundingClientRect();
      const b = document.createElement('div');
      const red = it.type === 'mine';
      b.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;box-sizing:border-box;` +
        (red ? 'border:3px solid #f00;background:rgba(255,0,0,.55)' : 'border:3px solid #ffd400;background:rgba(255,212,0,.6)') +
        ';display:flex;align-items:center;justify-content:center;font:bold 10px Arial;color:#000';
      if (it.text) b.textContent = it.text;
      layer.appendChild(b);
    }
  }
  const clearAll = () => { items = []; if (layer) layer.innerHTML = ''; };

  function tick() {
    const cells = findCells();
    if (!cells.length) return null;
    if (cells.some(([, , el]) => /hd_type(9|1\d)|mine|bomb|blast/.test(el.className))) { clearAll(); lastKey = ''; return 'skip'; }

    let C = 0, R = 0;
    const byPos = new Map();
    for (const [x, y, el] of cells) { C = Math.max(C, x + 1); R = Math.max(R, y + 1); byPos.set(y * 1000 + x, el); }
    const elOf = k => byPos.get(Math.floor(k / C) * 1000 + (k % C));

    const g = [];
    for (let r = 0; r < R; r++) { g[r] = []; for (let c = 0; c < C; c++) { const el = byPos.get(r * 1000 + c); g[r][c] = el ? readCell(el) : '#'; } }
    const key = g.map(r => r.join('')).join('|');
    if (key === lastKey) { paint(); return 'skip'; }
    lastKey = key;

    let cons = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const v = g[r][c]; if (typeof v !== 'number' || v === 0) continue;
      const U = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const a = r + dr, b = c + dc;
        if ((dr || dc) && a >= 0 && a < R && b >= 0 && b < C && g[a][b] === '#') U.push(a * C + b);
      }
      if (U.length) cons.push({ U, n: v });
    }

    // 1) hızlı mantık
    const M = new Set(), S = new Set();
    let changed = true;
    while (changed) {
      changed = false;
      const cur = [];
      for (const q of cons) {
        let n = q.n; const U = [];
        for (const k of q.U) { if (M.has(k)) n--; else if (!S.has(k)) U.push(k); }
        if (U.length) cur.push({ U, n });
      }
      for (const q of cur) {
        if (q.n === 0) q.U.forEach(k => { if (!S.has(k)) { S.add(k); changed = true; } });
        else if (q.n === q.U.length) q.U.forEach(k => { if (!M.has(k)) { M.add(k); changed = true; } });
      }
      if (changed) continue;
      for (const A of cur) for (const B of cur) {
        if (A === B || A.U.length >= B.U.length) continue;
        if (!A.U.every(k => B.U.includes(k))) continue;
        const diff = B.U.filter(k => !A.U.includes(k)), dn = B.n - A.n;
        if (dn === 0) diff.forEach(k => { if (!S.has(k)) { S.add(k); changed = true; } });
        else if (dn === diff.length) diff.forEach(k => { if (!M.has(k)) { M.add(k); changed = true; } });
      }
      cons = cur;
    }

    // 2) bölgeler
    const rest = cons.map(q => {
      let n = q.n; const U = [];
      for (const k of q.U) { if (M.has(k)) n--; else if (!S.has(k)) U.push(k); }
      return { U, n };
    }).filter(q => q.U.length);
    const parent = new Map();
    const find = k => { while (parent.get(k) !== k) { parent.set(k, parent.get(parent.get(k))); k = parent.get(k); } return k; };
    rest.forEach(q => q.U.forEach(k => { if (!parent.has(k)) parent.set(k, k); }));
    rest.forEach(q => q.U.forEach(k => parent.set(find(k), find(q.U[0]))));
    const groups = new Map();
    rest.forEach(q => { const rt = find(q.U[0]); if (!groups.has(rt)) groups.set(rt, []); groups.get(rt).push(q); });

    const comps = []; let aborted = 0; const inF = new Set();
    for (const gc of groups.values()) {
      const vars = [...new Set(gc.flatMap(q => q.U))];
      vars.forEach(v => inF.add(v));
      const res = enumerate(vars, gc);
      if (!res) { aborted++; continue; }
      comps.push(res);
    }

    // 3) olasılıklar
    let closed = 0;
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] === '#') closed++;
    const T0 = TOTAL[R * C];
    const T = T0 ? T0 - M.size : -1;
    const useT = T0 && T >= 0 && !aborted;
    const O = closed - M.size - S.size - inF.size;

    const P = new Map();
    S.forEach(k => P.set(k, 0));
    M.forEach(k => P.set(k, 1));

    let Ef = 0;
    comps.forEach((cp, i) => {
      const Wk = {};
      if (useT) {
        let oth = new Array(T + 1).fill(0); oth[0] = 1;
        comps.forEach((o, j) => {
          if (j === i) return;
          const nx = new Array(T + 1).fill(0);
          for (let s = 0; s <= T; s++) if (oth[s]) for (const k of o.ks) if (s + k <= T) nx[s + k] += oth[s] * o.N[k];
          oth = nx;
        });
        for (const k of cp.ks) {
          let w = 0;
          for (let s = 0; s <= T - k; s++) if (oth[s]) w += oth[s] * binom(O, T - k - s);
          Wk[k] = w;
        }
      } else cp.ks.forEach(k => Wk[k] = 1);
      let Z = 0; cp.ks.forEach(k => Z += cp.N[k] * Wk[k]);
      if (!(Z > 0)) return;
      cp.order.forEach((v, j) => {
        let s = 0; cp.ks.forEach(k => s += cp.cnt[k][j] * Wk[k]);
        const p = s / Z; P.set(v, p); Ef += p;
      });
    });

    if (O > 0) {
      let po = null;
      if (useT) po = Math.min(1, Math.max(0, (T - Ef) / O));
      else if (T0 && !aborted) po = Math.min(1, Math.max(0, (T0 - M.size - Ef) / O));
      if (po !== null) {
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
          const k = r * C + c;
          if (g[r][c] === '#' && !P.has(k)) P.set(k, po);
        }
      }
    }
    if (T0 && closed === T0) for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] === '#') P.set(r * C + c, 1);

    // 4) çiz: kırmızı = kesin mayın, sarı = en güvenli tahmin
    items = [];
    let best = 2; const cand = [];
    P.forEach((p, k) => {
      if (p > 1 - 1e-9) { const el = elOf(k); if (el) items.push({ el, type: 'mine' }); }
      else { cand.push([k, p]); if (p < best) best = p; }
    });
    const bestCells = cand.filter(([, p]) => p <= best + 1e-9).slice(0, 6);
    const hasMine = items.length > 0;
    if (bestCells.length && (best < 1 - 1e-9)) {
      for (const [k, p] of bestCells) {
        const el = elOf(k); if (!el) continue;
        items.push({ el, type: 'guess', text: p < 1e-9 ? '0%' : (p * 100 < 10 ? (p * 100).toFixed(1) : Math.round(p * 100)) + '%' });
      }
    }
    paint();
    const mc = items.filter(i => i.type === 'mine').length;
    return `Kesin mayın: ${mc} | en güvenli kare: ${best < 2 ? (best * 100).toFixed(1) + '% mayın riski' : '-'} | atlanan bölge: ${aborted}`;
  }

  const s = tick();
  if (!s) { console.log('Kare bulunamadı'); return; }
  if (s !== 'skip') console.log(s);
  window.hileDurdur = () => { clearInterval(window.__hileT); window.removeEventListener('scroll', paint, true); window.removeEventListener('resize', paint); clearAll(); };
  window.addEventListener('scroll', paint, true);
  window.addEventListener('resize', paint);
  window.__hileT = setInterval(() => {
    try { const r = tick(); if (r && r !== 'skip') console.log(r); }
    catch (e) { console.log('Hata:', e.message); }
  }, 250);
  console.log('Aktif. Durdurmak için hileDurdur()');
})();