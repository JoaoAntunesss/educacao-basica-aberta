/* O curso como um mapa de conceitos desenhado a lápis numa folha quadriculada.
   Cadeira = balão com aguarela da cor da área; tópico = quadradinho que se marca com um visto;
   pré-requisito = seta a lápis. O que já dominas fica sublinhado a marcador amarelo.
   SVG puro, sem bibliotecas. Mesma interface que a antiga placa: mount(host, api) -> { zoomIn, zoomOut, reset, focus, refresh, setScroll, destroy }. */
(() => {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeIO = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const hashS = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) % 2147483646 + 1; };
const rng = seed => () => (seed = seed * 16807 % 2147483647) / 2147483647;
const f1 = n => Math.round(n * 10) / 10;

/* a pencil stroke between two points: slight bow, slight overshoot at the ends */
function pLine(r, x1, y1, x2, y2, amp = 1) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / len, ny = (x2 - x1) / len, j = a => (r() - .5) * a;
  const bow = j(2 * amp) + j(len * .012);
  return `M${f1(x1 + j(amp))} ${f1(y1 + j(amp))}Q${f1((x1 + x2) / 2 + nx * bow)} ${f1((y1 + y2) / 2 + ny * bow)} ${f1(x2 + j(amp))} ${f1(y2 + j(amp))}`;
}
/* a hand-drawn rounded box: four bowed sides, rounded corners, the end overshoots the start like a real pencil loop */
function pBox(r, x, y, w, h, R = 14) {
  const j = a => f1((r() - .5) * a), b = a => f1((r() - .5) * a);
  return `M${f1(x + R) + j(3)} ${f1(y) + j(1.6)}` +
    `Q${f1(x + w / 2)} ${f1(y) + b(3)} ${f1(x + w - R) + j(3)} ${f1(y) + j(1.6)}Q${f1(x + w) + j(1.4)} ${f1(y) + j(1.4)} ${f1(x + w) + j(1.6)} ${f1(y + R) + j(3)}` +
    `Q${f1(x + w) + b(3)} ${f1(y + h / 2)} ${f1(x + w) + j(1.6)} ${f1(y + h - R) + j(3)}Q${f1(x + w) + j(1.4)} ${f1(y + h) + j(1.4)} ${f1(x + w - R) + j(3)} ${f1(y + h) + j(1.6)}` +
    `Q${f1(x + w / 2)} ${f1(y + h) + b(3)} ${f1(x + R) + j(3)} ${f1(y + h) + j(1.6)}Q${f1(x) + j(1.4)} ${f1(y + h) + j(1.4)} ${f1(x) + j(1.6)} ${f1(y + h - R) + j(3)}` +
    `Q${f1(x) + b(3)} ${f1(y + h / 2)} ${f1(x) + j(1.6)} ${f1(y + R) + j(3)}Q${f1(x) + j(1.4)} ${f1(y) + j(1.4)} ${f1(x + R + 8) + j(3)} ${f1(y - 1.5) + j(1.2)}`;
}
const wrap = (s, max = 22, lines = 3) => {
  const w = s.split(' '), out = []; let cur = '';
  for (const word of w) { if ((cur + ' ' + word).trim().length <= max) cur = (cur + ' ' + word).trim(); else { out.push(cur); cur = word; } }
  if (cur) out.push(cur);
  if (out.length > lines) { const keep = out.slice(0, lines); keep[lines - 1] = keep[lines - 1].replace(/\s*\S*$/, '') + '…'; return keep; }
  return out;
};

const NW = 200, COLW = 262, GAP = 30, TOP = 92, BOX = 10, BOXG = 4.6, LH = 17;

function mount(host, api) {
  const { courses, sems, pct, isDone, name, topicName, reduced } = api;
  const ambient = !!api.ambient, onPick = api.onPick || (() => {}), en = api.lang === 'en';
  const AREAS = window.AREAS || {};
  const semIx = Object.fromEntries(sems.map((s, i) => [s.id, i]));
  const byId = Object.fromEntries(courses.map(c => [c.id, c]));
  const deps = {}; courses.forEach(c => c.pre.forEach(p => (deps[p] = deps[p] || []).push(c.id)));
  const anc = (id, s = new Set()) => { byId[id].pre.forEach(p => { if (!s.has(p)) { s.add(p); anc(p, s); } }); return s; };
  const desc = (id, s = new Set()) => { (deps[id] || []).forEach(p => { if (!s.has(p)) { s.add(p); desc(p, s); } }); return s; };

  /* ---------- layout: one column per semester, balloons stacked and centred ---------- */
  const N = {}, cols = sems.map(s => courses.filter(c => c.sem === s.id));
  const perRow = Math.floor((NW - 24 + BOXG) / (BOX + BOXG));
  cols.forEach(cs => cs.forEach(c => {
    const lines = wrap(name(c)), rows = Math.max(1, Math.ceil(c.topics.length / perRow));
    N[c.id] = { c, lines, h: 16 + lines.length * LH + 10 + rows * (BOX + BOXG) - BOXG + 14 };
  }));
  const colH = cols.map(cs => cs.reduce((a, c) => a + N[c.id].h, 0) + GAP * Math.max(0, cs.length - 1));
  const maxH = Math.max(...colH);
  cols.forEach((cs, ci) => { let y = TOP + (maxH - colH[ci]) / 2; cs.forEach(c => { const n = N[c.id]; n.x = 40 + ci * COLW; n.y = y; n.ci = ci; y += n.h + GAP; }); });
  const W = 40 + sems.length * COLW - (COLW - NW) + 60, H = TOP + maxH + 70;

  /* ---------- svg scaffold ---------- */
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'cmap' + (ambient ? ' ambient' : ''));
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  if (ambient) svg.setAttribute('aria-hidden', 'true'); else { svg.setAttribute('role', 'group'); svg.setAttribute('aria-label', api.label || ''); }
  host.appendChild(svg);
  const tip = document.createElement('div'); tip.className = 'rede-tip'; tip.hidden = true; if (!ambient) host.appendChild(tip);

  const r0 = rng(7);
  const defs = `<defs>
    <pattern id="cm-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" class="cm-gridline"/></pattern>
    <filter id="cm-aguarela" x="-10%" y="-20%" width="120%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="9"/><feGaussianBlur stdDeviation=".7"/></filter>
    <filter id="cm-lapis"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="2" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>
  </defs>`;
  const heads = sems.map((s, i) => { const ls = wrap(s[en ? 'en' : 'pt'], 24, 2); return `<text class="cm-col" x="${40 + i * COLW}" y="${TOP - 34 - (ls.length - 1) * 20}">${ls.map((l, k) => `<tspan x="${40 + i * COLW}" dy="${k ? 21 : 0}">${api.esc(l)}</tspan>`).join('')}</text>`
    + `<path class="cm-under" d="${pLine(r0, 40 + i * COLW - 2, TOP - 22, 40 + i * COLW + Math.min(NW, Math.max(...ls.map(l => l.length)) * 9.4), TOP - 20, 1.2)}"/>`; }).join('');

  /* arrows from each prerequisite to the course: a pencil curve plus a two-stroke arrowhead */
  const edges = [];
  courses.forEach(c => c.pre.forEach((p, k) => {
    const a = N[p], b = N[c.id]; if (!a || !b) return;
    const r = rng(hashS(p + '>' + c.id));
    const x1 = a.x + NW + 4, y1 = a.y + a.h / 2 + (k - (c.pre.length - 1) / 2) * 6, x2 = b.x - 9, y2 = b.y + 22 + (k - (c.pre.length - 1) / 2) * 7;
    const dx = Math.max(60, (x2 - x1) * .5), wob = (r() - .5) * 18;
    const d = `M${f1(x1)} ${f1(y1)}C${f1(x1 + dx)} ${f1(y1 + wob)} ${f1(x2 - dx)} ${f1(y2 - wob)} ${f1(x2)} ${f1(y2)}`;
    const ang = Math.atan2(y2 - (y2 - wob), x2 - (x2 - dx)), al = 8;
    const hd = [ang + 2.6, ang - 2.6].map(t => `M${f1(x2 + 1)} ${f1(y2)}L${f1(x2 + Math.cos(t) * al + (r() - .5))} ${f1(y2 + Math.sin(t) * al + (r() - .5))}`).join('');
    edges.push({ from: p, to: c.id, d, hd, col: a.ci, len: Math.hypot(x2 - x1, y2 - y1) * 1.25 });
  }));

  function nodeSVG(n) {
    const c = n.c, r = rng(hashS(c.id)), p = pct(c), col = (AREAS[c.area] || {}).c || '#8a909c';
    const box = pBox(r, n.x, n.y, NW, n.h), box2 = pBox(r, n.x + .6, n.y - .4, NW - .8, n.h + .6);
    const ww = NW * (.5 + r() * .22), wh = n.h * (.55 + r() * .2), wash = pBox(r, n.x + 6 + r() * (NW - ww - 12), n.y + 5 + r() * (n.h - wh - 10), ww, wh, 20);
    const tx = n.x + 14, ty = n.y + 16 + 12;
    const marker = p ? n.lines.map((l, i) => { const w = Math.min(NW - 24, l.length * 7.6) * (p >= 100 ? 1 : p / 100); return w > 2 ? `<path class="cm-mark" d="M${f1(tx - 3)} ${f1(ty + i * LH - 4 + (r() - .5))}l${f1(w + 6)} ${f1((r() - .5) * 1.6)}"/>` : ''; }).join('') : '';
    const by = n.y + 16 + n.lines.length * LH + 10;
    const boxes = c.topics.map((_, j) => {
      const bx = tx + (j % perRow) * (BOX + BOXG), byy = by + Math.floor(j / perRow) * (BOX + BOXG), done = isDone(c.id, j);
      const rr = rng(hashS(c.id + j));
      return `<g class="cm-t${done ? ' done' : ''}" data-j="${j}"><rect class="cm-hit" x="${bx - 2}" y="${byy - 2}" width="${BOX + 4}" height="${BOX + 4}"/><path class="cm-tb" d="${pLine(rr, bx, byy, bx + BOX, byy, .5)}${pLine(rr, bx + BOX, byy, bx + BOX, byy + BOX, .5)}${pLine(rr, bx + BOX, byy + BOX, bx, byy + BOX, .5)}${pLine(rr, bx, byy + BOX, bx, byy, .5)}"/>${done ? `<path class="cm-tick" d="M${f1(bx + 1.5)} ${f1(byy + 5.5)}l${f1(2.8)} ${f1(3.4)}l${f1(6.2)} ${f1(-9.6)}"/>` : ''}</g>`;
    }).join('');
    const label = `${api.esc(name(c))}, ${p}%`;
    return `<g class="cm-node${p >= 100 ? ' full' : ''}" data-id="${c.id}" data-col="${n.ci}" style="--d:${n.ci * 260 + 120}ms"${ambient ? '' : ` tabindex="0" role="button" aria-label="${label}"`}>
      <path class="cm-paper" d="${box}"/><path class="cm-wash" d="${wash}" style="fill:${col}"/>${marker}
      <text class="cm-label">${n.lines.map((l, i) => `<tspan x="${tx}" y="${ty + i * LH}">${api.esc(l)}</tspan>`).join('')}</text>
      ${boxes}<path class="cm-line cm-out" d="${box}"/><path class="cm-line cm-out2" d="${box2}"/></g>`;
  }
  function draw() {
    svg.innerHTML = defs + `<rect class="cm-bg" x="-2000" y="-2000" width="${W + 4000}" height="${H + 4000}" fill="url(#cm-grid)"/>` + heads +
      `<g class="cm-edges">${edges.map(e => `<g class="cm-e" data-from="${e.from}" data-to="${e.to}" style="--len:${Math.ceil(e.len)};--d:${e.col * 260 + 380}ms"><path class="cm-arrow" d="${e.d}"/><path class="cm-head" d="${e.hd}"/></g>`).join('')}</g>` +
      `<g class="cm-nodes">${courses.map(c => nodeSVG(N[c.id])).join('')}</g>`;
    setFocus();
  }

  /* ---------- focus: hovering or picking a course shows the path to it and from it ---------- */
  let hover = null, picked = api.picked && byId[api.picked] ? api.picked : null;
  function setFocus() {
    const id = hover || picked;
    svg.classList.toggle('focus', !!id);
    if (!id) { svg.querySelectorAll('.hl,.cur').forEach(e => e.classList.remove('hl', 'cur')); return; }
    const on = new Set([id, ...anc(id), ...desc(id)]);
    svg.querySelectorAll('.cm-node').forEach(g => { g.classList.toggle('hl', on.has(g.dataset.id)); g.classList.toggle('cur', g.dataset.id === picked); });
    svg.querySelectorAll('.cm-e').forEach(g => g.classList.toggle('hl', on.has(g.dataset.from) && on.has(g.dataset.to)));
  }

  /* ---------- camera = viewBox ---------- */
  const vb = { x: 0, y: 0, w: W, h: H };
  const aspect = () => (host.clientWidth || 800) / (host.clientHeight || 500);
  function fitBox() {
    let x0 = 0, x1 = W, y0 = TOP - 80, y1 = H;
    if (ambient) { // the hero shows the first year and a half, where everyone starts
      const sel = courses.filter(c => semIx[c.sem] <= (aspect() < 1 ? 1 : 2)).map(c => N[c.id]);
      x0 = Math.min(...sel.map(n => n.x)) - 30; x1 = Math.max(...sel.map(n => n.x + NW)) + 30;
      y0 = Math.min(...sel.map(n => n.y)) - 90; y1 = Math.max(...sel.map(n => n.y + n.h)) + 30;
    }
    let w = x1 - x0, h = y1 - y0; const a = aspect();
    if (w / h > a) { const nh = w / a; y0 -= (nh - h) / 2; h = nh; } else { const nw = h * a; x0 -= (nw - w) / 2; w = nw; }
    return { x: x0, y: y0, w, h };
  }
  const apply = () => svg.setAttribute('viewBox', `${f1(vb.x)} ${f1(vb.y)} ${f1(vb.w)} ${f1(vb.h)}`);
  let anim = 0;
  function flyTo(to, ms = 520) {
    cancelAnimationFrame(anim);
    if (reduced || ambient) { Object.assign(vb, to); apply(); return; }
    const from = { ...vb }, t0 = performance.now();
    const step = now => { const u = clamp((now - t0) / ms, 0, 1), k = easeIO(u); for (const key in to) vb[key] = from[key] + (to[key] - from[key]) * k; apply(); if (u < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  const zoomAt = (f, cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2) => {
    const fit = fitBox(), w = clamp(vb.w * f, 260, fit.w * 1.6), k = w / vb.w;
    return { x: cx - (cx - vb.x) * k, y: cy - (cy - vb.y) * k, w, h: vb.h * k };
  };
  const toUser = (px, py) => { const b = svg.getBoundingClientRect(), s = Math.max(vb.w / b.width, vb.h / b.height); return [vb.x + (px - b.left - (b.width - vb.w / s) / 2) * s, vb.y + (py - b.top - (b.height - vb.h / s) / 2) * s, s]; };

  /* ---------- tooltip ---------- */
  function showTip(g, tg, e) {
    if (ambient) return;
    if (!g) { tip.hidden = true; return; }
    const c = byId[g.dataset.id]; const done = c.topics.filter((_, j) => isDone(c.id, j)).length;
    tip.innerHTML = tg ? `<b>${api.esc(topicName(c, +tg.dataset.j))}</b><span>${api.esc(name(c))}</span>` : `<b>${api.esc(name(c))}</b><span>${en ? `${done} of ${c.topics.length} topics` : `${done} de ${c.topics.length} tópicos`}</span>`;
    tip.hidden = false;
    const hb = host.getBoundingClientRect(); let x = e.clientX - hb.left + 14, y = e.clientY - hb.top + 16;
    if (x + 270 > hb.width) x = Math.max(8, x - 290); if (y + 70 > hb.height) y -= 80;
    tip.style.transform = `translate(${x}px,${y}px)`;
  }

  /* ---------- input ---------- */
  const ptrs = new Map(); let drag = null, moved = false, pinch = null, downT = null;
  const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); offs.push(() => el.removeEventListener(ev, fn, o)); };
  const offs = [];
  if (!ambient) {
    on(svg, 'pointerdown', e => {
      ptrs.set(e.pointerId, [e.clientX, e.clientY]); moved = false; downT = e.target; try { svg.setPointerCapture(e.pointerId); } catch (x) { }
      if (ptrs.size === 1) drag = { x: e.clientX, y: e.clientY, vb: { ...vb } };
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), vb: { ...vb }, c: toUser((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) }; }
    });
    on(svg, 'pointermove', e => {
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (pinch && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), k = clamp(pinch.d / d, .2, 5);
        const w = clamp(pinch.vb.w * k, 260, fitBox().w * 1.6), kk = w / pinch.vb.w, [cx, cy] = pinch.c;
        Object.assign(vb, { x: cx - (cx - pinch.vb.x) * kk, y: cy - (cy - pinch.vb.y) * kk, w, h: pinch.vb.h * kk }); apply(); moved = true; return;
      }
      if (drag && ptrs.size === 1) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.hypot(dx, dy) > 6) moved = true;
        if (moved) { const s = toUser(0, 0)[2]; vb.x = drag.vb.x - dx * s; vb.y = drag.vb.y - dy * s; apply(); svg.classList.add('panning'); tip.hidden = true; return; }
      }
      const tg = e.target.closest && e.target.closest('.cm-t'), g = e.target.closest && e.target.closest('.cm-node');
      const id = g ? g.dataset.id : null; if (id !== hover) { hover = id; setFocus(); }
      showTip(g, tg, e);
    });
    const end = e => {
      ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
      if (ptrs.size === 0) {
        svg.classList.remove('panning');
        if (!moved && e.type === 'pointerup' && downT) { const tg = downT.closest && downT.closest('.cm-t'), g = downT.closest && downT.closest('.cm-node'); picked = g ? g.dataset.id : null; setFocus(); onPick(picked, tg ? +tg.dataset.j : null); }
        drag = null;
      }
    };
    on(svg, 'pointerup', end); on(svg, 'pointercancel', end);
    on(svg, 'pointerleave', () => { if (!drag) { hover = null; setFocus(); tip.hidden = true; } });
    on(svg, 'wheel', e => { e.preventDefault(); const [cx, cy] = toUser(e.clientX, e.clientY); Object.assign(vb, zoomAt(Math.exp(e.deltaY * .0015), cx, cy)); apply(); }, { passive: false });
    on(svg, 'focusin', e => { const g = e.target.closest('.cm-node'); if (g) { hover = g.dataset.id; setFocus(); const n = N[hover]; if (n.x < vb.x || n.x + NW > vb.x + vb.w || n.y < vb.y || n.y + n.h > vb.y + vb.h) control.focus(hover, true); } });
    on(svg, 'focusout', () => { hover = null; setFocus(); });
    on(svg, 'keydown', e => {
      const g = e.target.closest && e.target.closest('.cm-node');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); picked = g.dataset.id; setFocus(); onPick(picked, null); }
      else if (e.key === '+' || e.key === '=') control.zoomIn(); else if (e.key === '-') control.zoomOut(); else if (e.key === '0') control.reset();
      else if (e.key === 'Escape') { picked = null; setFocus(); onPick(null, null); }
    });
  }
  let ro = null;
  const onResize = () => { const cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2, a = aspect(); if (ambient || !touched) { Object.assign(vb, fitBox()); } else { const h = vb.w / a; vb.y = cy - h / 2; vb.h = h; vb.x = cx - vb.w / 2; } apply(); };
  let touched = false;
  if (window.ResizeObserver) { ro = new ResizeObserver(onResize); ro.observe(host); }

  const control = {
    zoomIn: () => { touched = true; flyTo(zoomAt(1 / 1.35), 260); },
    zoomOut: () => { touched = true; flyTo(zoomAt(1.35), 260); },
    reset: () => { touched = false; flyTo(fitBox()); },
    focus: (id, soft) => {
      const n = N[id]; if (!n) return; touched = true;
      if (!soft) { picked = id; setFocus(); }
      const w = Math.min(vb.w, 980), h = w / aspect();
      flyTo({ x: n.x + NW / 2 - w / 2, y: n.y + n.h / 2 - h / 2, w, h });
    },
    refresh: () => { draw(); },
    setScroll: k => { if (ambient) host.style.setProperty('--sk', k.toFixed(3)); },
    destroy: () => { cancelAnimationFrame(anim); offs.forEach(f => f()); if (ro) ro.disconnect(); svg.remove(); tip.remove(); }
  };

  draw(); Object.assign(vb, fitBox()); apply();

  /* ---------- one orchestrated moment, once per session: the map is sketched while the headline is written ---------- */
  if (ambient) {
    let first = false; try { first = !sessionStorage.getItem('eba.sketch'); sessionStorage.setItem('eba.sketch', '1'); } catch (e) { first = false; }
    const hero = host.closest('.hero-net'), h1 = hero && hero.querySelector('h1');
    if (first && !reduced && hero) {
      if (h1 && !h1.querySelector('.hw')) { const words = h1.textContent.trim().split(/\s+/); h1.innerHTML = words.map((w, k) => `<span class="hw" style="--k:${k}">${api.esc(w)}</span>`).join(' '); }
      svg.querySelectorAll('.cm-out,.cm-out2').forEach(p => { const L = Math.ceil(p.getTotalLength()); p.style.setProperty('--len', L); });
      hero.classList.add('sketching'); svg.classList.add('sketch');
      setTimeout(() => { hero.classList.remove('sketching'); svg.classList.remove('sketch'); }, 4200);
    }
  } else if (picked) setTimeout(() => control.focus(picked), 60);
  return control;
}
window.Placa = { mount };
})();
