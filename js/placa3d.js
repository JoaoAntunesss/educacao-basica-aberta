/* A placa de circuito do curso, em WebGL (Three.js).
   Cadeira = circuito integrado; tópico = componente SMD à volta; pré-requisito = pista de cobre.
   O que dominas acende cor de fogo e envia impulsos. Na página inicial abre com uma sequência cinematográfica.
   Mesma interface que js/placa.js (a versão em Canvas 2D, usada quando não há WebGL). */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const HOT = new THREE.Color('#ff7a2e'), COLD = new THREE.Color('#3a96ff'), WHITE = new THREE.Color('#fff4e0');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const easeOut = u => 1 - Math.pow(1 - u, 4);
const COLW = 30, ROWD = 17, CW = 13, CD = 8, CH = 1.6;

function boardTexture() { // solder mask, grid and vias
  const s = 1024, cv = document.createElement('canvas'); cv.width = cv.height = s; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * .7); gr.addColorStop(0, '#0c1630'); gr.addColorStop(1, '#060b18');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
  g.strokeStyle = 'rgba(90,140,255,.07)'; g.lineWidth = 1;
  for (let i = 0; i <= s; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, s); g.moveTo(0, i); g.lineTo(s, i); g.stroke(); }
  for (let i = 0; i < 380; i++) { const x = Math.random() * s, y = Math.random() * s; g.fillStyle = 'rgba(160,190,255,.10)'; g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); g.fillStyle = '#060b18'; g.beginPath(); g.arc(x, y, 1, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 4); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function glowTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}
function shadowTexture() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 96; const g = cv.getContext('2d'); g.filter = 'blur(10px)';
  g.fillStyle = 'rgba(0,0,0,.85)'; g.fillRect(22, 20, 84, 56); return new THREE.CanvasTexture(cv);
}
function chipBody() { // rounded, bevelled IC package
  const w = CW, d = CD, r = .9, sh = new THREE.Shape();
  sh.moveTo(-w / 2 + r, -d / 2); sh.lineTo(w / 2 - r, -d / 2); sh.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r); sh.lineTo(w / 2, d / 2 - r);
  sh.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2); sh.lineTo(-w / 2 + r, d / 2); sh.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r); sh.lineTo(-w / 2, -d / 2 + r); sh.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: CH - .4, bevelEnabled: true, bevelThickness: .2, bevelSize: .2, bevelSegments: 3, curveSegments: 6 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, .2, 0); return geo;
}

function mount(host, api) {
  const { courses, sems, pct, isDone, name, topicName, esc } = api;
  const ambient = !!api.ambient, reduced = !!api.reduced, onPick = api.onPick || (() => {});
  const small = () => Math.min(innerWidth, innerHeight) < 700;
  // qualidade adaptativa: 2 = brilho + resolução 1.5x; 1 = brilho + resolução 1x; 0 = sem brilho. Fica guardada para a próxima visita.
  let Qlev = 2; try { const q = localStorage.getItem('eba.gl'); if (q != null) Qlev = Math.max(0, Math.min(2, +q)); } catch (e) { }
  if (((navigator.hardwareConcurrency || 4) <= 4 || small()) && Qlev > 1) Qlev = 1;
  const dprFor = q => Math.min(devicePixelRatio || 1, q >= 2 ? 1.5 : 1);
  const renderer = new THREE.WebGLRenderer({ antialias: Qlev === 0, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dprFor(Qlev));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement; canvas.className = 'placa-canvas placa-gl';
  if (ambient) canvas.setAttribute('aria-hidden', 'true'); else { canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', api.label); canvas.tabIndex = 0; }
  host.appendChild(canvas);
  const tip = document.createElement('div'); tip.className = 'rede-tip'; tip.hidden = true; if (!ambient) host.appendChild(tip);

  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2('#04060d', ambient ? .0042 : .0026);
  const camera = new THREE.PerspectiveCamera(ambient ? 38 : 42, 1, 1, 2000);
  scene.add(new THREE.HemisphereLight('#9fc0ff', '#05070f', 1.1));
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-60, 120, 80); scene.add(key);
  const rim = new THREE.PointLight('#7a5cff', 500, 260, 1.6); rim.position.set(80, 50, -80); scene.add(rim);

  /* ---------- layout ---------- */
  const semIx = Object.fromEntries(sems.map((s, i) => [s.id, i])), colCount = {}, rowOf = {};
  courses.forEach(c => { rowOf[c.id] = colCount[c.sem] = (colCount[c.sem] || 0) + 1; });
  const chips = [], byId = {};
  courses.forEach((c, i) => {
    const x = (semIx[c.sem] - (sems.length - 1) / 2) * COLW, z = (rowOf[c.id] - 1 - (colCount[c.sem] - 1) / 2) * ROWD + (semIx[c.sem] % 2 ? ROWD * .3 : 0);
    const ch = { id: c.id, c, i, x, z, lift: 0, liftT: 0, on: 1 }; chips.push(ch); byId[c.id] = ch;
  });
  let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
  chips.forEach(c => { bx0 = Math.min(bx0, c.x); bx1 = Math.max(bx1, c.x); bz0 = Math.min(bz0, c.z); bz1 = Math.max(bz1, c.z); });
  const center = new THREE.Vector3((bx0 + bx1) / 2, 0, (bz0 + bz1) / 2), spanX = bx1 - bx0 + 40, spanZ = bz1 - bz0 + 40;
  const origin = chips[0];
  chips.forEach(c => { c.dist = Math.hypot(c.x - origin.x, c.z - origin.z); });
  const maxDist = Math.max(...chips.map(c => c.dist)) + 20;

  /* ---------- board ---------- */
  const board = new THREE.Mesh(new THREE.PlaneGeometry(spanX * 3, spanZ * 3), new THREE.MeshStandardMaterial({ map: boardTexture(), roughness: .75, metalness: .25 }));
  board.rotation.x = -Math.PI / 2; board.position.copy(center); scene.add(board);

  /* ---------- chips ---------- */
  const bodyGeo = chipBody();
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#0d1220', roughness: .32, metalness: .2 });
  const bodyHot = bodyMat.clone(); bodyHot.emissive = new THREE.Color('#1a0800');
  const pinGeo = new THREE.BoxGeometry(.45, .5, 1.6), pinMat = new THREE.MeshStandardMaterial({ color: '#d8b25a', metalness: 1, roughness: .28 });
  const PINS = 8, pins = new THREE.InstancedMesh(pinGeo, pinMat, chips.length * PINS * 2); scene.add(pins);
  const shadowGeo = new THREE.PlaneGeometry(CW * 1.6, CD * 1.9), shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: .9 });
  const ledGeo = new THREE.SphereGeometry(.42, 12, 8);
  const glowTex = glowTexture();
  const pickables = [];
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3();

  function labelTexture(ch) {
    const cv = ch.cv || (ch.cv = document.createElement('canvas')); cv.width = 512; cv.height = 316; const g = cv.getContext('2d'), p = pct(ch.c);
    g.clearRect(0, 0, 512, 316);
    g.fillStyle = 'rgba(160,180,220,.55)'; g.font = '500 22px "JetBrains Mono", monospace';
    g.fillText('EBA-' + String(ch.i + 1).padStart(2, '0') + '  ·  ' + (sems[semIx[ch.c.sem]] ? ch.c.sem : ''), 34, 52);
    g.fillStyle = p >= 100 ? '#ffd9b8' : '#e8eefc'; g.font = '700 38px "Bricolage Grotesque", "Figtree", sans-serif';
    const words = name(ch.c).split(' '), lines = []; let line = '';
    words.forEach(w => { const tryL = line ? line + ' ' + w : w; if (g.measureText(tryL).width > 440 && line) { lines.push(line); line = w; } else line = tryL; }); lines.push(line);
    lines.slice(0, 3).forEach((l, k) => g.fillText(l, 34, 112 + k * 46));
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(34, 262, 444, 10);
    if (p) { const gr = g.createLinearGradient(34, 0, 478, 0); gr.addColorStop(0, '#ff5a1f'); gr.addColorStop(1, '#ffb066'); g.fillStyle = gr; g.fillRect(34, 262, 444 * p / 100, 10); }
    g.fillStyle = 'rgba(160,180,220,.6)'; g.font = '500 20px "JetBrains Mono", monospace'; g.textAlign = 'right'; g.fillText(p + '%', 478, 248); g.textAlign = 'left';
    g.beginPath(); g.arc(470, 46, 9, 0, 7); g.strokeStyle = 'rgba(160,180,220,.45)'; g.lineWidth = 3; g.stroke();
    if (ch.tex) ch.tex.needsUpdate = true; else { ch.tex = new THREE.CanvasTexture(cv); ch.tex.colorSpace = THREE.SRGBColorSpace; ch.tex.anisotropy = 8; }
    return ch.tex;
  }
  chips.forEach(ch => {
    const grp = new THREE.Group(); grp.position.set(ch.x, 0, ch.z); scene.add(grp); ch.grp = grp;
    const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.y = .05; grp.add(sh); ch.shadow = sh;
    const lift = new THREE.Group(); grp.add(lift); ch.liftG = lift;
    const body = new THREE.Mesh(bodyGeo, bodyMat); body.userData.chip = ch; lift.add(body); ch.body = body; pickables.push(body);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(CW - 1.2, (CW - 1.2) * 316 / 512), new THREE.MeshBasicMaterial({ map: labelTexture(ch), color: new THREE.Color(.82, .82, .82), transparent: true, toneMapped: false }));
    top.rotation.x = -Math.PI / 2; top.position.y = CH + .21; lift.add(top); ch.top = top;
    const led = new THREE.Mesh(ledGeo, new THREE.MeshBasicMaterial({ color: COLD, toneMapped: false })); led.position.set(-CW / 2 + 1.3, CH + .25, -CD / 2 + 1.2); led.scale.y = .4; lift.add(led); ch.led = led;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: HOT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    halo.scale.set(CW * 2.4, CW * 2.4, 1); halo.position.y = 1; grp.add(halo); ch.halo = halo;
  });
  function placePins() {
    let k = 0;
    chips.forEach(ch => { const y = ch.lift + .55; for (let s = -1; s <= 1; s += 2) for (let i = 0; i < PINS; i++) {
      const x = ch.x - CW / 2 + 1.4 + i * (CW - 2.8) / (PINS - 1);
      M.compose(V.set(x, y, ch.z + s * (CD / 2 + .55)), Q, S); pins.setMatrixAt(k++, M);
    } });
    pins.instanceMatrix.needsUpdate = true;
  }

  /* ---------- topic components (SMD parts) ---------- */
  const comps = []; chips.forEach(ch => ch.c.topics.forEach((_, j) => {
    const n = ch.c.topics.length, top = j % 2 === 0, k = Math.floor(j / 2), m = Math.ceil(n / 2), span = CW - 2;
    comps.push({ ch, j, x: ch.x - span / 2 + (m > 1 ? k * span / (m - 1) : span / 2), z: ch.z + (top ? -1 : 1) * (CD / 2 + 3.2) }); }));
  const compGeo = new THREE.BoxGeometry(1.1, .55, .6);
  const compCold = new THREE.InstancedMesh(compGeo, new THREE.MeshStandardMaterial({ color: '#1b2742', roughness: .4, metalness: .5, emissive: '#0a2a66', emissiveIntensity: .6 }), comps.length);
  const compHot = new THREE.InstancedMesh(compGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff8a3c').multiplyScalar(1.4), toneMapped: false }), comps.length);
  scene.add(compCold, compHot);
  function placeComps() {
    comps.forEach((cp, i) => {
      const on = isDone(cp.ch.id, cp.j), pop = cp.ch.lift * .35, y = .3 + pop, sc = cp.ch.on;
      M.compose(V.set(cp.x, y, cp.z), Q, S.set(sc, sc, sc)); (on ? compHot : compCold).setMatrixAt(i, M);
      M.compose(V.set(0, -99, 0), Q, S.set(0, 0, 0)); (on ? compCold : compHot).setMatrixAt(i, M);
    });
    S.set(1, 1, 1); compCold.instanceMatrix.needsUpdate = compHot.instanceMatrix.needsUpdate = true;
  }

  /* ---------- copper traces with travelling pulses (one merged ribbon) ---------- */
  const tPos = [], tU = [], tLen = [], tHot = [], tPair = [], tStart = [], tIdx = [], tInfo = [];
  let lane = 0;
  courses.forEach(c => c.pre.forEach(pid => {
    const a = byId[pid], b = byId[c.id]; if (!a || !b) return; const ln = (lane++ % 7) - 3;
    const x1 = a.x + CW / 2 + .8, x2 = b.x - CW / 2 - .8, mx = x1 + (x2 - x1) * .5 + ln * .8, z1 = a.z + ln * .55, z2 = b.z - ln * .55;
    const pts = [[x1, z1], [mx, z1], [mx, z2], [x2, z2]]; let u = 0; const total = pts.slice(1).reduce((s, p, i) => s + Math.abs(p[0] - pts[i][0]) + Math.abs(p[1] - pts[i][1]), 0);
    const hot = pct(a.c) / 100, w = .32, first = tPos.length / 3;
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az); if (L < .01) continue;
      const nx = -(bz - az) / L * w, nz = (bx - ax) / L * w, base = tPos.length / 3;
      tPos.push(ax + nx, .12, az + nz, ax - nx, .12, az - nz, bx + nx, .12, bz + nz, bx - nx, .12, bz - nz);
      [u, u, u + L, u + L].forEach(v => { tU.push(v); tLen.push(total); tHot.push(hot); tPair.push(a.i, b.i); tStart.push(a.dist); });
      tIdx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); u += L;
    }
    tInfo.push({ a, from: first, to: tPos.length / 3 });
  }));
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute(tPos, 3)); tg.setAttribute('aU', new THREE.Float32BufferAttribute(tU, 1));
  tg.setAttribute('aLen', new THREE.Float32BufferAttribute(tLen, 1)); tg.setAttribute('aHot', new THREE.Float32BufferAttribute(tHot, 1));
  tg.setAttribute('aPair', new THREE.Float32BufferAttribute(tPair, 2)); tg.setAttribute('aStart', new THREE.Float32BufferAttribute(tStart, 1)); tg.setIndex(tIdx);
  const traceMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uTime: { value: 0 }, uReveal: { value: 1e4 }, uFocus: { value: -1 }, uCold: { value: COLD }, uHot: { value: HOT } },
    vertexShader: `attribute float aU, aLen, aHot, aStart; attribute vec2 aPair; varying float vU, vLen, vHot, vStart, vFocus; uniform float uFocus;
      void main() { vU = aU; vLen = aLen; vHot = aHot; vStart = aStart; vFocus = uFocus < 0. ? 0. : ((abs(aPair.x - uFocus) < .5 || abs(aPair.y - uFocus) < .5) ? 1. : -1.);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `varying float vU, vLen, vHot, vStart, vFocus; uniform float uTime, uReveal; uniform vec3 uCold, uHot;
      void main() {
        float d = vStart + vU; if (d > uReveal) discard;
        float edge = smoothstep(uReveal - 6., uReveal, d);
        float speed = mix(9., 26., vHot), ph = fract((vU - uTime * speed) / 34.);
        float pulse = smoothstep(.0, .05, ph) * (1. - smoothstep(.05, .22, ph));
        vec3 base = mix(uCold, uHot, vHot) * (.16 + .3 * vHot);
        vec3 col = base + mix(uCold * 1.6, uHot * 2.6, vHot) * pulse * (.35 + vHot);
        col += vec3(1., .85, .6) * edge * 3.;
        float a = vFocus < 0. ? .18 : (vFocus > 0. ? 1.6 : 1.);
        gl_FragColor = vec4(col * a, 1.); }`
  });
  const traces = new THREE.Mesh(tg, traceMat); scene.add(traces);

  /* ---------- state from progress ---------- */
  function refresh() {
    chips.forEach(ch => {
      const p = pct(ch.c); labelTexture(ch);
      ch.body.material = p ? bodyHot : bodyMat;
      ch.led.material.color.copy(p >= 100 ? WHITE : p ? HOT : COLD).multiplyScalar(p ? 3 : 1.6);
      ch.haloBase = p >= 100 ? .55 : p ? .12 + p / 400 : 0;
    });
    const hot = tg.getAttribute('aHot');
    tInfo.forEach(ti => { const h = pct(ti.a.c) / 100; for (let v = ti.from; v < ti.to; v++) hot.setX(v, h); });
    hot.needsUpdate = true; placeComps();
  }
  refresh(); placePins();

  /* ---------- post-processing ---------- */
  let composer = null, bloom = null;
  function setupComposer() {
    composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), ambient ? .9 : .75, .55, .82); composer.addPass(bloom); composer.addPass(new OutputPass());
  }
  if (Qlev >= 1) setupComposer();

  /* ---------- camera ---------- */
  let W = 1, H = 1;
  const shiftX = () => ambient && W > 900 ? .22 : 0;
  function fitDist() { const asp = W / H, k = ambient ? (W > 900 ? .55 : .85) : .74; const fov = camera.fov * Math.PI / 180; return Math.max(spanZ / 2 / Math.tan(fov / 2), spanX / 2 / Math.tan(fov / 2) / asp) * k; }
  const pose = { theta: ambient ? -.38 : -.12, phi: ambient ? .72 : .95, dist: 100, target: center.clone() };
  function applyPose(p) {
    const cp = Math.cos(p.phi); camera.position.set(p.target.x + p.dist * cp * Math.sin(p.theta), p.dist * Math.sin(p.phi), p.target.z + p.dist * cp * Math.cos(p.theta));
    camera.lookAt(p.target); camera.setViewOffset(W, H, -W * shiftX(), 0, W, H);
  }
  function resize() {
    const r = host.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false); canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; camera.aspect = W / H; camera.updateProjectionMatrix();
    if (composer) { composer.setSize(W, H); bloom.resolution.set(W / 2, H / 2); }
    pose.dist = fitDist(); if (controls && !controls.userMoved) { setFromPose(); } wake();
  }

  /* ---------- interaction (full board only) ---------- */
  let controls = null;
  function setFromPose() { applyPose(pose); if (controls) { controls.target.copy(pose.target); controls.update(); } }
  if (!ambient) {
    controls = new OrbitControls(camera, canvas); controls.enableDamping = !reduced; controls.dampingFactor = .08;
    controls.maxPolarAngle = Math.PI * .44; controls.minDistance = 25; controls.maxDistance = 420; controls.screenSpacePanning = false;
    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    controls.addEventListener('start', () => { controls.userMoved = true; fly = null; }); controls.addEventListener('change', wake);
  }
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let hover = null, hoverComp = -1, focusId = api.picked || null;
  function pickAt(e) {
    const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
    const hc = ray.intersectObjects([compCold, compHot], false)[0]; if (hc) return { comp: hc.instanceId };
    const h = ray.intersectObjects(pickables, false)[0]; return h ? { chip: h.object.userData.chip } : {};
  }
  function showTip(e, html) { const r = host.getBoundingClientRect(); tip.innerHTML = html; tip.hidden = false; tip.style.transform = `translate(${Math.min(e.clientX - r.left + 16, r.width - 270)}px, ${e.clientY - r.top + 16}px)`; }
  let down = null;
  function onMove(e) {
    if (ambient) { pointer.tx = (e.clientX / innerWidth - .5); pointer.ty = (e.clientY / innerHeight - .5); wake(); return; }
    const p = pickAt(e); const ch = p.chip || (p.comp != null ? comps[p.comp].ch : null);
    hover = ch; hoverComp = p.comp != null ? p.comp : -1; canvas.style.cursor = ch ? 'pointer' : 'grab';
    if (p.comp != null) { const cp = comps[p.comp]; showTip(e, `<b>${esc(topicName(cp.ch.c, cp.j))}</b><span>${esc(name(cp.ch.c))}</span>`); }
    else if (ch) showTip(e, `<b>${esc(name(ch.c))}</b><span>${pct(ch.c)}% · ${ch.c.topics.length} ${api.lang === 'en' ? 'topics' : 'tópicos'}</span>`);
    else tip.hidden = true;
    wake();
  }
  function onDown(e) { down = [e.clientX, e.clientY]; }
  function onUp(e) {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) { down = null; return; } down = null;
    const p = pickAt(e);
    if (p.comp != null) { const cp = comps[p.comp]; focus(cp.ch.id); onPick(cp.ch.id, cp.j); }
    else if (p.chip) { focus(p.chip.id); onPick(p.chip.id); }
    else { focus(null); onPick(null); }
  }
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!ambient) { canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointerleave', () => { hover = null; tip.hidden = true; wake(); }); }
  else if (!reduced && matchMedia('(pointer: fine)').matches) addEventListener('pointermove', onMove, { passive: true });
  canvas.addEventListener('keydown', e => {
    if (!controls) return; const ids = chips.map(c => c.id), i = ids.indexOf(focusId);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); const id = ids[(i + 1) % ids.length]; focus(id); onPick(id); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); const id = ids[(i - 1 + ids.length) % ids.length]; focus(id); onPick(id); }
    if (e.key === 'Escape') { focus(null); onPick(null); }
  });

  /* ---------- camera flights ---------- */
  let fly = null;
  function flyTo(target, dist, dur = 1100) {
    if (!controls) return; const from = { t: controls.target.clone(), p: camera.position.clone() };
    const dir = camera.position.clone().sub(controls.target).normalize(); const to = { t: target.clone(), p: target.clone().add(dir.multiplyScalar(dist)) };
    if (reduced) { controls.target.copy(to.t); camera.position.copy(to.p); controls.update(); wake(); return; }
    fly = { from, to, t0: performance.now(), dur }; wake();
  }
  function focus(id) {
    focusId = id && byId[id] ? id : null; traceMat.uniforms.uFocus.value = focusId ? byId[focusId].i : -1;
    if (controls) { if (focusId) { const c = byId[focusId]; flyTo(new THREE.Vector3(c.x, 0, c.z), 46); } }
    wake();
  }

  /* ---------- cinematic intro (home page, once per session) ---------- */
  const heroWrap = host.closest('.hero-net'), copy = heroWrap && heroWrap.querySelector('.hero-copy');
  let introT0 = 0, intro = false;
  const seen = (() => { try { return sessionStorage.getItem('eba.intro') === '1'; } catch (e) { return true; } })();
  if (ambient && !reduced && !seen && heroWrap) {
    intro = true; document.documentElement.classList.add('intro-playing'); heroWrap.classList.add('intro');
    const h1 = copy && copy.querySelector('h1');
    if (h1 && !h1.querySelector('.w')) h1.innerHTML = h1.textContent.split(' ').map((w, i) => `<span class="w" style="--k:${i}"><span>${esc(w)}</span></span>`).join(' ');
    const bars = document.createElement('div'); bars.className = 'letterbox'; bars.innerHTML = '<i></i><i></i>'; heroWrap.appendChild(bars);
    const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'intro-skip'; skip.textContent = api.lang === 'en' ? 'Skip intro' : 'Saltar intro'; heroWrap.appendChild(skip);
    skip.addEventListener('click', endIntro); addEventListener('keydown', endIntro, { once: true }); addEventListener('wheel', endIntro, { once: true, passive: true });
    traceMat.uniforms.uReveal.value = 0; chips.forEach(c => { c.on = 0; });
  }
  const INTRO = 5200;
  function endIntro() {
    if (!intro) return; intro = false; try { sessionStorage.setItem('eba.intro', '1'); } catch (e) { }
    traceMat.uniforms.uReveal.value = 1e4; chips.forEach(c => { c.on = 1; }); placeComps();
    document.documentElement.classList.remove('intro-playing'); if (heroWrap) { heroWrap.classList.remove('intro'); heroWrap.classList.add('intro-done'); }
    wake();
  }
  function introCamera(u) { // macro shot over the first chip, then a crane move out to the whole board
    const k = ease(clamp((u - .08) / .82, 0, 1));
    const near = { theta: -1.05, phi: .2, dist: 26, target: new THREE.Vector3(origin.x + 4, 1.2, origin.z) };
    return { theta: near.theta + (pose.theta - near.theta) * k, phi: near.phi + (pose.phi - near.phi) * k, dist: near.dist + (pose.dist - near.dist) * Math.pow(k, 1.4), target: near.target.clone().lerp(pose.target, k) };
  }

  /* ---------- loop ---------- */
  let raf = 0, running = true, visible = true, scrollK = 0, idleUntil = 0, lastDraw = 0, ftAvg = 16, ftN = 0;
  function degrade() {
    Qlev--; ftN = 0; ftAvg = 16; try { localStorage.setItem('eba.gl', String(Qlev)); } catch (e) { }
    renderer.setPixelRatio(dprFor(Qlev));
    if (Qlev < 1 && composer) { composer.dispose(); composer = null; bloom = null; }
    resize();
  }
  const T0 = performance.now();
  function wake() { idleUntil = performance.now() + 1500; if (!raf && running && visible) raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    if (ambient && !intro && now - lastDraw < 30) { if (running && visible) raf = requestAnimationFrame(frame); return; }   // fundo animado: ~30 imagens por segundo chegam
    const dt = now - lastDraw; lastDraw = now;
    if (dt < 250) { ftAvg = ftAvg * .92 + dt * .08; if (++ftN > 45 && Qlev > 0 && ftAvg > (ambient ? 48 : 30)) degrade(); }
    const t = (now - T0) / 1000;
    traceMat.uniforms.uTime.value = reduced ? 0 : t;
    if (intro) {
      const u = (now - (introT0 || (introT0 = now))) / INTRO;
      traceMat.uniforms.uReveal.value = easeOut(clamp((u - .12) / .62, 0, 1)) * maxDist * 1.6;
      chips.forEach(c => { const on = clamp((traceMat.uniforms.uReveal.value - c.dist) / 18, 0, 1); if (on !== c.on) { c.on = on; c.flash = on > 0 && on < 1 ? 1 : (c.flash || 0) * .9; } });
      placeComps(); applyPose(introCamera(u));
      if (u > .62 && heroWrap && !heroWrap.classList.contains('intro-text')) heroWrap.classList.add('intro-text');
      if (u >= 1) endIntro();
    } else if (ambient) {
      pointer.x += (pointer.tx - pointer.x) * .05; pointer.y += (pointer.ty - pointer.y) * .05;
      const drift = reduced ? 0 : Math.sin(t / 11) * .16;
      applyPose({ theta: pose.theta + drift + pointer.x * .25, phi: clamp(pose.phi + scrollK * .45 - pointer.y * .08, .3, 1.3), dist: pose.dist * (1 + scrollK * .25), target: pose.target });
    } else if (fly) {
      const u = clamp((now - fly.t0) / fly.dur, 0, 1), k = ease(u);
      controls.target.lerpVectors(fly.from.t, fly.to.t, k); camera.position.lerpVectors(fly.from.p, fly.to.p, k); if (u >= 1) fly = null;
    }
    const moved = controls ? controls.update() : false;
    // chips: lift on hover / focus, glow from progress, power-on during intro
    let moving = false;
    chips.forEach(ch => {
      ch.liftT = (ch === hover || ch.id === focusId) ? 2.4 : 0;
      const d = ch.liftT - ch.lift; if (Math.abs(d) > .01) { ch.lift += d * (reduced ? 1 : .16); moving = true; }
      ch.liftG.position.y = ch.lift; ch.shadow.material.opacity = .9; ch.shadow.scale.setScalar(1 + ch.lift * .06);
      ch.liftG.visible = ch.on > .02; ch.liftG.scale.setScalar(.85 + .15 * ch.on);
      const dim = focusId && ch.id !== focusId ? .35 : 1;
      ch.top.material.opacity = ch.on * dim; ch.halo.material.opacity = ((ch.haloBase || 0) * (reduced ? 1 : (.85 + .15 * Math.sin(t * 2 + ch.i))) + (ch.flash || 0) * .8) * ch.on;
      ch.led.material.opacity = ch.on;
    });
    if (moving || hover) { placePins(); placeComps(); }
    if (composer) composer.render(); else renderer.render(scene, camera);
    const animate = !reduced && (ambient || intro || fly || moving || moved || now < idleUntil);
    if (animate && running && visible) raf = requestAnimationFrame(frame);
  }

  const ro = new ResizeObserver(resize); ro.observe(host);
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) wake(); }); io.observe(host);
  const onVis = () => { running = !document.hidden; if (running) wake(); }; document.addEventListener('visibilitychange', onVis);
  resize(); if (!ambient) { setFromPose(); if (focusId) focus(focusId); } wake();

  return {
    focus, refresh: () => { refresh(); wake(); },
    zoomIn: () => controls && flyTo(controls.target.clone(), camera.position.distanceTo(controls.target) * .7, 500),
    zoomOut: () => controls && flyTo(controls.target.clone(), camera.position.distanceTo(controls.target) * 1.4, 500),
    reset: () => { if (!controls) return; focus(null); onPick(null); controls.userMoved = false; const d = fitDist(); const dir = new THREE.Vector3(Math.sin(pose.theta) * Math.cos(pose.phi), Math.sin(pose.phi), Math.cos(pose.theta) * Math.cos(pose.phi)); flyTo(center.clone(), d); fly && (fly.to.p = center.clone().add(dir.multiplyScalar(d))); },
    setScroll: k => { scrollK = k; wake(); },
    destroy: () => {
      running = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', onVis); removeEventListener('pointermove', onMove);
      if (intro) endIntro(); if (controls) controls.dispose();
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } });
      if (composer) composer.dispose(); renderer.dispose(); canvas.remove(); tip.remove();
      if (heroWrap) heroWrap.querySelectorAll('.letterbox,.intro-skip').forEach(n => n.remove());
    }
  };
}

window.Placa = { mount, gl: true };
