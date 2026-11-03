/* A placa de circuito do curso, em 3D.
   Cadeira = chip que se ergue da placa; tópico = componente pequeno à volta do chip;
   pré-requisito = pista de cobre entre chips. O que dominas acende cor de fogo e envia impulsos.
   Motor 3D próprio em Canvas 2D (projeção em perspetiva, faces visíveis, ordenação por profundidade),
   sem bibliotecas: leve, sem pedidos externos e com versão estática para quem reduz o movimento. */
(() => {
'use strict';
const TAU = Math.PI * 2;
const C = { cold: [58, 150, 255], hot: [255, 128, 48], board: '#070d1f', grid: 'rgba(90,140,255,0.07)', copper: [58, 150, 255] };
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOut = u => 1 - Math.pow(1 - u, 3);
const easeIO = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;

function sprite(c, size = 96) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d'), r = size / 2, grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, rgba(c, 1)); grad.addColorStop(.2, rgba(c, .55)); grad.addColorStop(.5, rgba(c, .12)); grad.addColorStop(1, rgba(c, 0));
  g.fillStyle = grad; g.fillRect(0, 0, size, size); return cv;
}

function mount(host, api) {
  const { courses, sems, deps, pct, isDone, name, topicName, reduced } = api;
  const ambient = !!api.ambient, onPick = api.onPick || (() => {});
  const small = () => Math.min(innerWidth, innerHeight) < 700;
  const canvas = document.createElement('canvas'); canvas.className = 'placa-canvas';
  if (ambient) canvas.setAttribute('aria-hidden', 'true'); else { canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', api.label); canvas.tabIndex = 0; }
  host.appendChild(canvas);
  const tip = document.createElement('div'); tip.className = 'rede-tip'; tip.hidden = true; if (!ambient) host.appendChild(tip);
  const ctx = canvas.getContext('2d');
  const GLOW = { hot: sprite(C.hot), cold: sprite(C.cold, 64) };

  /* ---------- layout on the board (x = semester, z = row) ---------- */
  const COLW = 260, ROWD = 150, CW = 116, CD = 72, CH = 16, TW = 13, TD = 7, TH = 6;
  const semIx = Object.fromEntries(sems.map((s, i) => [s.id, i]));
  const rowOf = {}, colCount = {}; courses.forEach(c => { rowOf[c.id] = colCount[c.sem] = (colCount[c.sem] || 0) + 1; });
  const order = Object.fromEntries(courses.map((c, i) => [c.id, i]));
  const chips = [], byId = {}, comps = [], traces = [];
  courses.forEach(c => {
    const x = (semIx[c.sem] - (sems.length - 1) / 2) * COLW, z = (rowOf[c.id] - 1 - (colCount[c.sem] - 1) / 2) * ROWD + (semIx[c.sem] % 2 ? ROWD * .35 : 0);
    const ch = { id: c.id, c, x, z, o: order[c.id], kind: 'chip' }; chips.push(ch); byId[c.id] = ch;
    const n = c.topics.length;
    c.topics.forEach((_, j) => { // components sit on a ring above and below the chip, connected by a short trace
      const top = j % 2 === 0, k = Math.floor(j / 2), m = Math.ceil(n / 2), span = CW - 14;
      const cx = x - span / 2 + (m > 1 ? k * span / (m - 1) : span / 2), cz = z + (top ? -1 : 1) * (CD / 2 + 26);
      comps.push({ id: c.id + '#' + j, c, j, chip: ch, x: cx, z: cz, kind: 'comp', o: order[c.id] });
    });
  });
  courses.forEach(c => c.pre.forEach(p => {
    const a = byId[p], b = byId[c.id]; const lane = (traces.length % 7) - 3;
    const x1 = a.x + CW / 2, x2 = b.x - CW / 2, mx = x1 + (x2 - x1) * .5 + lane * 7;
    const z1 = a.z + lane * 5, z2 = b.z - lane * 5;
    traces.push({ a, b, pts: [[x1, z1], [mx, z1], [mx, z2], [x2, z2]] });
  }));
  traces.forEach(t => { t.len = 0; for (let i = 1; i < t.pts.length; i++) t.len += Math.abs(t.pts[i][0] - t.pts[i - 1][0]) + Math.abs(t.pts[i][1] - t.pts[i - 1][1]); });
  let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
  chips.forEach(c => { bx0 = Math.min(bx0, c.x); bx1 = Math.max(bx1, c.x); bz0 = Math.min(bz0, c.z); bz1 = Math.max(bz1, c.z); });
  const PAD = 140; bx0 -= PAD + CW / 2; bx1 += PAD + CW / 2; bz0 -= PAD + 40; bz1 += PAD + 40;
  const center = [(bx0 + bx1) / 2, 0, (bz0 + bz1) / 2];

  /* ---------- camera ---------- */
  let W = 0, H = 0, dpr = 1, F = 1;
  const cam = { theta: ambient ? -.32 : -.16, phi: ambient ? .78 : .86, dist: 1, tx: center[0], tz: center[2] };
  let basis = null;
  function fitDist() { const bw = (bx1 - bx0), bd = (bz1 - bz0); const k = ambient ? (W > 900 ? .62 : .9) : 1.12; return Math.max(bw * F / W, bd * F / H * 1.4) * k; }
  function setBasis() {
    const cp = Math.cos(cam.phi), e = [cam.tx + cam.dist * cp * Math.sin(cam.theta), cam.dist * Math.sin(cam.phi), cam.tz + cam.dist * cp * Math.cos(cam.theta)];
    let f = [cam.tx - e[0], -e[1], cam.tz - e[2]]; const fl = Math.hypot(...f); f = f.map(v => v / fl);
    let r = [f[2], 0, -f[0]]; const rl = Math.hypot(...r) || 1; r = r.map(v => -v / rl);
    const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    basis = { e, f, r, u };
  }
  const shiftX = () => ambient && W > 900 ? W * .2 : 0;
  function P(x, y, z) { // world -> screen; returns [sx, sy, depth]
    const v = [x - basis.e[0], y - basis.e[1], z - basis.e[2]];
    const dz = v[0] * basis.f[0] + v[1] * basis.f[1] + v[2] * basis.f[2]; if (dz < 5) return null;
    const dx = v[0] * basis.r[0] + v[1] * basis.r[1] + v[2] * basis.r[2], dy = v[0] * basis.u[0] + v[1] * basis.u[1] + v[2] * basis.u[2];
    return [W / 2 + shiftX() + dx * F / dz, H / 2 - dy * F / dz, dz];
  }
  function resize() { const r = host.getBoundingClientRect(); dpr = Math.min(small() ? 1.5 : 2, devicePixelRatio || 1); W = r.width; H = r.height; F = H * 1.25; canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; }
  let touched = false, introDone = reduced;
  const ro = new ResizeObserver(() => { resize(); if (!touched) cam.dist = fitDist(); draw(performance.now()); }); ro.observe(host);

  /* ---------- focus ---------- */
  let hover = null, picked = api.picked ? byId[api.picked] : null, lit = null;
  function lineage(id) { const s = new Set([id]); const up = x => byId[x].c.pre.forEach(p => { if (!s.has(p)) { s.add(p); up(p); } }); const down = x => (deps[x] || []).forEach(p => { if (!s.has(p)) { s.add(p); down(p); } }); up(id); down(id); return s; }
  function setFocus() { const f = hover || picked; lit = f ? lineage(f.kind === 'chip' ? f.id : f.chip.id) : null; }
  setFocus();
  const dim = id => lit && !lit.has(id);

  /* ---------- pulses along copper ---------- */
  const pulses = [];
  function spawn(t) {
    if (reduced) return;
    traces.forEach(tr => { const p = pct(tr.a.c); const rate = p ? .004 + p / 100 * .012 : (ambient ? .0025 : 0); if (rate && Math.random() < rate) pulses.push({ tr, t0: t, dur: 900 + tr.len * 2.2, hot: !!p }); });
    if (pulses.length > 160) pulses.splice(0, pulses.length - 160);
  }
  function along(tr, u) { let d = u * tr.len; for (let i = 1; i < tr.pts.length; i++) { const a = tr.pts[i - 1], b = tr.pts[i], L = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]); if (d <= L) { const k = L ? d / L : 0; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; } d -= L; } const l = tr.pts[tr.pts.length - 1]; return [l[0], l[1]]; }

  /* ---------- drawing helpers ---------- */
  function poly(pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); }
  function box(x, z, w, d, h, col, alpha, glowTop) { // axis-aligned box standing on the board; draws the visible faces
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, e = basis.e;
    const q = (a, b, c) => P(a, b, c);
    const top = [q(x0, h, z0), q(x1, h, z0), q(x1, h, z1), q(x0, h, z1)]; if (top.some(p => !p)) return null;
    ctx.globalAlpha = alpha;
    const faces = [];
    if (e[0] > x1) faces.push([[x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0], .55]);
    if (e[0] < x0) faces.push([[x0, 0, z1], [x0, 0, z0], [x0, h, z0], [x0, h, z1], .55]);
    if (e[2] > z1) faces.push([[x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1], .75]);
    if (e[2] < z0) faces.push([[x1, 0, z0], [x0, 0, z0], [x0, h, z0], [x1, h, z0], .75]);
    faces.forEach(fc => { const pts = fc.slice(0, 4).map(p => q(...p)); if (pts.some(p => !p)) return; poly(pts); ctx.fillStyle = shade(col, fc[4]); ctx.fill(); });
    poly(top); ctx.fillStyle = glowTop || col; ctx.fill();
    return top;
  }
  function shade(hex, k) { const n = parseInt(hex.slice(1), 16); return `rgb(${(n >> 16 & 255) * k | 0},${(n >> 8 & 255) * k | 0},${(n & 255) * k | 0})`; }

  /* ---------- frame ---------- */
  const T0 = performance.now();
  let raf = 0, last = 0, alive = true, visible = true, scrollK = 0;
  const STEP = ambient ? 60 : 40, RISE = 520;
  function draw(t) {
    if (W < 2 || H < 2) return;
    // intro camera: from high and far, settles (ease-in-out: the view is already on screen)
    if (!introDone) { const u = clamp((t - T0) / 1600, 0, 1), k = easeIO(u); cam.phiIntro = 1.25 + (cam.phi - 1.25) * k; cam.distIntro = cam.dist * (1.5 - .5 * k); if (u >= 1) introDone = true; }
    const phi0 = cam.phi, d0 = cam.dist, th0 = cam.theta;
    if (!introDone) { cam.phi = cam.phiIntro; cam.dist = cam.distIntro; }
    if (ambient && !reduced) { cam.theta = th0 + Math.sin(t / 9000) * .22; cam.phi = clamp(cam.phi + scrollK * .35, .35, 1.3); }
    setBasis();
    cam.phi = phi0; cam.dist = d0; cam.theta = th0;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    // board
    const corners = [P(bx0, 0, bz0), P(bx1, 0, bz0), P(bx1, 0, bz1), P(bx0, 0, bz1)];
    if (corners.every(Boolean)) { poly(corners); ctx.fillStyle = C.board; ctx.fill(); ctx.strokeStyle = 'rgba(90,140,255,.18)'; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath();
    for (let gx = Math.ceil(bx0 / 60) * 60; gx <= bx1; gx += 60) { const a = P(gx, 0, bz0), b = P(gx, 0, bz1); if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } }
    for (let gz = Math.ceil(bz0 / 60) * 60; gz <= bz1; gz += 60) { const a = P(bx0, 0, gz), b = P(bx1, 0, gz); if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } }
    ctx.stroke();
    // silkscreen: semester names along the front edge
    if (!ambient) { ctx.font = '600 12px Figtree, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(170,185,225,.55)'; sems.forEach((s, i) => { const p = P((i - (sems.length - 1) / 2) * COLW, 0, bz1 - 34); if (p) ctx.fillText(s[api.lang] || s.pt, p[0], p[1]); }); }

    const rise = o => reduced ? 1 : easeOut(clamp((t - T0 - 250 - o * STEP) / RISE, 0, 1));
    // copper traces
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    traces.forEach(tr => {
      const ig = Math.min(rise(tr.a.o), rise(tr.b.o)); if (!ig) return;
      const off = dim(tr.a.id) || dim(tr.b.id), on = pct(tr.a.c) === 100, hl = lit && !off;
      const pts = tr.pts.map(p => P(p[0], .2, p[1])); if (pts.some(p => !p)) return;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.strokeStyle = rgba(on ? C.hot : C.copper, (off ? .07 : hl ? .9 : on ? .65 : .32) * ig); ctx.lineWidth = hl ? 2.6 : 1.6; ctx.stroke();
      [pts[0], pts[pts.length - 1]].forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], 2.4, 0, TAU); ctx.fillStyle = rgba(on ? C.hot : C.copper, (off ? .1 : .8) * ig); ctx.fill(); });
    });
    // short traces chip -> component
    ctx.lineWidth = 1;
    comps.forEach(cp => { const ig = rise(cp.o); if (!ig) return; const a = P(cp.x, .2, cp.chip.z + Math.sign(cp.z - cp.chip.z) * CD / 2), b = P(cp.x, .2, cp.z); if (!a || !b) return; const on = isDone(cp.c.id, cp.j); ctx.strokeStyle = rgba(on ? C.hot : C.copper, (dim(cp.chip.id) ? .05 : on ? .6 : .22) * ig); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); });

    // solids, far to near
    const solids = [];
    chips.forEach(ch => { const p = P(ch.x, 0, ch.z); if (p) solids.push([p[2], ch]); });
    comps.forEach(cp => { const p = P(cp.x, 0, cp.z); if (p) solids.push([p[2], cp]); });
    solids.sort((a, b) => b[0] - a[0]);
    const tops = [];
    solids.forEach(([, s]) => {
      const ig = rise(s.o); if (!ig) return;
      if (s.kind === 'comp') {
        const on = isDone(s.c.id, s.j), off = dim(s.chip.id);
        const top = box(s.x, s.z, TW, TD, TH * ig, on ? '#ff8030' : '#1c2a52', off ? .2 : 1);
        if (top) s.top = top;
        return;
      }
      const p = pct(s.c) / 100, off = dim(s.id), sel = picked === s || hover === s;
      const h = CH * ig;
      const top = box(s.x, s.z, CW, CD, h, p === 1 ? '#3a1d0c' : '#111a33', off ? .25 : 1, p === 1 ? '#ff8030' : (sel ? '#1d2d5c' : '#16224a'));
      if (!top) return;
      s.top = top; ctx.globalAlpha = off ? .25 : 1;
      // pins along the long sides
      ctx.strokeStyle = 'rgba(200,215,240,.55)'; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let k = 0; k < 7; k++) { const px = s.x - CW / 2 + 10 + k * (CW - 20) / 6; [[s.z - CD / 2, s.z - CD / 2 - 6], [s.z + CD / 2, s.z + CD / 2 + 6]].forEach(([za, zb]) => { const a = P(px, 2, za), b = P(px, .5, zb); if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } }); }
      ctx.stroke();
      // die marking: notch + progress bar on the top face
      if (p > 0 && p < 1) { const a = P(s.x - CW / 2 + 12, h + .3, s.z + CD / 2 - 12), b = P(s.x - CW / 2 + 12 + (CW - 24) * p, h + .3, s.z + CD / 2 - 12); if (a && b) { ctx.strokeStyle = '#ff8030'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } }
      const notch = P(s.x - CW / 2 + 10, h + .3, s.z - CD / 2 + 10); if (notch) { ctx.fillStyle = p === 1 ? '#1a0b00' : 'rgba(58,150,255,.8)'; ctx.beginPath(); ctx.arc(notch[0], notch[1], 2.5, 0, TAU); ctx.fill(); }
      if (sel) { poly(top); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.stroke(); }
      else if (lit && !off) { poly(top); ctx.strokeStyle = rgba(C.cold, .9); ctx.lineWidth = 1.4; ctx.stroke(); }
      tops.push(s);
    });
    ctx.globalAlpha = 1;

    // light: glow on mastered parts and travelling pulses (additive)
    ctx.globalCompositeOperation = 'lighter';
    chips.forEach(ch => { const p = pct(ch.c) / 100; if (!p || !ch.top || dim(ch.id)) return; const c = P(ch.x, CH * rise(ch.o), ch.z); if (!c) return; const s = 2.4 * F / c[2] * CW * (.5 + p * .6) / 1.6; ctx.globalAlpha = .35 + p * .45; ctx.drawImage(GLOW.hot, c[0] - s / 2, c[1] - s / 2, s, s); });
    for (let i = pulses.length - 1; i >= 0; i--) { const pl = pulses[i], u = (t - pl.t0) / pl.dur; if (u >= 1) { pulses.splice(i, 1); continue; } const off = dim(pl.tr.a.id) || dim(pl.tr.b.id); const [x, z] = along(pl.tr, u), p = P(x, 1, z); if (!p) continue; const s = 26 * F / p[2] * 2.2; ctx.globalAlpha = (off ? .1 : 1) * Math.sin(u * Math.PI) * (pl.hot ? 1 : .55); ctx.drawImage(pl.hot ? GLOW.hot : GLOW.cold, p[0] - s / 2, p[1] - s / 2, s, s); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

    // labels on the chips (screen space, always readable)
    if (!ambient) {
      tops.forEach(s => {
        const c = P(s.x, CH * rise(s.o), s.z); if (!c) return; const wpx = Math.abs(s.top[1][0] - s.top[0][0]) + Math.abs(s.top[2][0] - s.top[1][0]);
        const sel = picked === s || hover === s, off = dim(s.id); if (wpx < 46 && !sel) return;
        let label = name(s.c); const max = Math.max(8, Math.floor(wpx / 7.2)); if (label.length > max && !sel) label = label.slice(0, max - 1) + '…';
        ctx.font = `650 ${sel ? 13.5 : 12}px Figtree, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (pct(s.c) === 100) { ctx.fillStyle = off ? 'rgba(26,11,0,.4)' : '#1a0b00'; ctx.fillText(label, c[0], c[1]); return; }
        ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(3,6,16,.9)'; ctx.strokeText(label, c[0], c[1]);
        ctx.fillStyle = off ? 'rgba(200,215,240,.35)' : '#eef2ff'; ctx.fillText(label, c[0], c[1]);
      });
    }
  }
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }); io.observe(host);
  function loop(t) { if (!alive) return; if (visible && !document.hidden) { if (t - last > 120) { spawn(t); last = t; } draw(t); } raf = requestAnimationFrame(loop); }
  if (reduced) draw(performance.now()); else raf = requestAnimationFrame(loop);
  const redraw = () => { if (reduced) draw(performance.now()); };
  const control = { refresh: redraw, setScroll: k => { scrollK = k; }, destroy: () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); } };
  if (ambient) return control;

  /* ---------- interaction ---------- */
  const inPoly = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; };
  function hit(x, y) { // nearest solid first
    const list = chips.concat(comps).filter(s => s.top).map(s => [P(s.x, 0, s.z)[2], s]).sort((a, b) => a[0] - b[0]);
    for (const [, s] of list) if (inPoly(x, y, s.top)) return s; return null;
  }
  function showTip(s, x, y) {
    if (!s) { tip.hidden = true; return; } tip.hidden = false;
    tip.innerHTML = s.kind === 'chip' ? `<b>${api.esc(name(s.c))}</b><span>${pct(s.c)}%</span>` : `<b>${api.esc(topicName(s.c, s.j))}</b><span>${api.esc(name(s.c))}</span>`;
    const r = tip.getBoundingClientRect(); tip.style.transform = `translate(${Math.min(x + 14, W - r.width - 8)}px, ${Math.max(8, y - r.height - 12)}px)`;
  }
  let drag = null, moved = false; const ptrs = new Map();
  canvas.addEventListener('pointerdown', e => { touched = true; introDone = true; canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.offsetX, e.offsetY]); drag = { x: e.offsetX, y: e.offsetY, th: cam.theta, ph: cam.phi, tx: cam.tx, tz: cam.tz, pan: e.button === 2 || e.shiftKey, d: 0 }; moved = false; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointermove', e => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.offsetX, e.offsetY]);
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (drag.d) cam.dist = clamp(cam.dist * drag.d / d, 250, 6000); drag.d = d; moved = true; redraw(); return; }
    if (drag && ptrs.size === 1) {
      const dx = e.offsetX - drag.x, dy = e.offsetY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      if (moved) {
        if (drag.pan) { const k = cam.dist / F; const s = Math.sin(cam.theta), c = Math.cos(cam.theta); cam.tx = drag.tx - (dx * c - dy * s * 1.4) * k; cam.tz = drag.tz + (dx * s + dy * c * 1.4) * k; }
        else { cam.theta = drag.th - dx * .006; cam.phi = clamp(drag.ph + dy * .005, .28, 1.45); }
        canvas.style.cursor = 'grabbing'; showTip(null); redraw(); return;
      }
    }
    const s = hit(e.offsetX, e.offsetY); if (s !== hover) { hover = s; setFocus(); redraw(); } canvas.style.cursor = s ? 'pointer' : 'grab'; showTip(s, e.offsetX, e.offsetY);
  });
  const end = e => { ptrs.delete(e.pointerId); if (ptrs.size === 0) { if (!moved) { const s = hit(e.offsetX, e.offsetY); picked = s ? (s.kind === 'chip' ? s : s.chip) : null; setFocus(); redraw(); onPick(picked && picked.id, s && s.kind === 'comp' ? s.j : null); } drag = null; canvas.style.cursor = 'grab'; } };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', () => { if (!drag) { hover = null; setFocus(); showTip(null); redraw(); } });
  canvas.addEventListener('wheel', e => { e.preventDefault(); touched = true; introDone = true; cam.dist = clamp(cam.dist * Math.exp(e.deltaY * .0012), 250, 6000); redraw(); }, { passive: false });
  canvas.addEventListener('keydown', e => {
    const k = e.key; if (k === 'ArrowLeft') cam.theta += .08; else if (k === 'ArrowRight') cam.theta -= .08; else if (k === 'ArrowUp') cam.phi = clamp(cam.phi + .06, .28, 1.45); else if (k === 'ArrowDown') cam.phi = clamp(cam.phi - .06, .28, 1.45);
    else if (k === '+' || k === '=') return control.zoomIn(); else if (k === '-') return control.zoomOut(); else if (k === '0') return control.reset(); else return;
    e.preventDefault(); touched = true; redraw();
  });
  function flyTo(to, ms = 650) { // camera moves are on-screen motion: ease-in-out
    touched = true; introDone = true;
    if (reduced) { Object.assign(cam, to); redraw(); return; }
    const from = { theta: cam.theta, phi: cam.phi, dist: cam.dist, tx: cam.tx, tz: cam.tz }, t0 = performance.now();
    const step = now => { const u = clamp((now - t0) / ms, 0, 1), k = easeIO(u); for (const key in to) cam[key] = from[key] + (to[key] - from[key]) * k; if (u < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  Object.assign(control, {
    zoomIn: () => flyTo({ dist: clamp(cam.dist / 1.35, 250, 6000) }, 280),
    zoomOut: () => flyTo({ dist: clamp(cam.dist * 1.35, 250, 6000) }, 280),
    reset: () => flyTo({ theta: -.16, phi: .86, dist: fitDist(), tx: center[0], tz: center[2] }),
    focus: id => { const s = byId[id]; if (!s) return; picked = s; setFocus(); flyTo({ tx: s.x, tz: s.z, dist: Math.min(cam.dist, 900), phi: .85 }); }
  });
  if (picked) setTimeout(() => control.focus(picked.id), 900);
  return control;
}
window.Placa = { mount };
})();
