/* Educação Básica Aberta — interface (sem dependências). O curso é um circuito. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
};
const COURSES = window.COURSES, SEMS = window.SEMS, AREAS = window.AREAS, UNIS = window.UNIS, LESSONS = window.LESSONS || {};
const BY = Object.fromEntries(COURSES.map(c => [c.id, c]));
const ORDER = COURSES.map(c => c.id);
const DEPS = {}; COURSES.forEach(c => c.pre.forEach(p => (DEPS[p] = DEPS[p] || []).push(c.id)));

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
/* ---------- language ---------- */
let L = store.get('eba.lang', (navigator.language || 'pt').slice(0, 2) === 'pt' ? 'pt' : 'en');
const T = {
  pt: {
    brand: 'Educação Básica Aberta', home: 'Trilho', net: 'Percurso', cat: 'Cadeiras', map: 'Mapa', about: 'Sobre',
    cont: 'Continuar', start: 'Começar', homeT: 'Da primeira letra ao primeiro dia de aula.', homeP: 'Uma licenciatura completa em Educação Básica, com lições, exercícios e um trilho que te diz sempre o que fazer a seguir. Juntámos o que ensinam a ESE de Lisboa, a ESE do Porto, a Universidade de Évora e o Politécnico de Leiria.',
    stepT: 'O teu próximo passo', nextLesson: (n, m) => `Lição ${n} de ${m}`, nextTask: (n, m) => `Tarefa ${n} de ${m}`, minutes: n => `${n} min de leitura`, noLesson: 'Lição em preparação, com recursos para estudar',
    after: 'Depois disto', allDone: 'Concluíste a licenciatura inteira. O passo seguinte é um mestrado em ensino.',
    howT: 'Como se usa', how: ['Segue o trilho pela ordem. Cada cadeira assenta nas anteriores, como num curso a sério.', 'Em cada tópico há uma lição com exemplos e exercícios resolvidos. Quando o dominares, marca-o.', 'O teu percurso ilumina-se à medida que aprendes, e o botão Continuar leva-te sempre ao passo seguinte.'],
    trailT: 'O trilho', trailP: 'Seis semestres e uma fase avançada, pela ordem em que se aprendem.', phaseDone: (a, b) => `${a} de ${b} cadeiras concluídas`, showPhase: 'Ver cadeiras', hidePhase: 'Esconder',
    st: { done: 'Concluída', doing: 'Em curso', ready: 'Pronta a começar', wait: 'Depois de' }, youAreHere: 'Estás aqui',
    statT: 'Onde estás', statTopics: 'tópicos dominados', statCourses: 'cadeiras concluídas', statPhase: 'fase atual',
    lessonsIn: 'Nesta cadeira', tasksLink: 'Tarefas práticas da cadeira', mastered: 'Dominei, seguinte', skip: 'Ainda não, seguinte', masteredLast: 'Dominei, voltar à cadeira', reading: 'Progresso de leitura',
    catT2: 'Todas as cadeiras', catP2: 'O catálogo completo, para procurar por tema ou material.', boardLink: 'Ver o curso em 3D',
    closeT: 'Educação Básica Aberta',
    netT: 'O teu percurso', netP: 'Cada cadeira é um cartão e os tópicos são as peças à volta dele. As linhas ligam-no às cadeiras de que depende. O que já dominas ilumina-se e envia impulsos para o que vem a seguir.', netHint: 'Arrasta para rodar o mapa, usa a roda ou dois dedos para aproximar e Shift ou o botão direito para deslizar. Toca num cartão para o abrir.', zin: 'Aproximar', zout: 'Afastar', zfit: 'Ver tudo', legHot: 'Dominado', legCold: 'Por aprender', legSyn: 'Pista: pré-requisito', legDen: 'Peça: tópico', openLesson: 'Abrir a lição',
    heroT: 'Da primeira letra ao primeiro dia de aula.',
    heroP: 'Uma licenciatura completa em Educação Básica, cadeira a cadeira. Cada uma junta o que ensinam a ESE de Lisboa, a ESE do Porto, a Universidade de Évora e o Politécnico de Leiria, com tarefas práticas, materiais e recursos gratuitos.',
    meterP: 'O teu progresso', items: (a, b) => `${a} de ${b} tópicos e tarefas`,
    boardT: 'O curso num mapa', boardP: 'Cada cartão é uma cadeira; as linhas ligam-na às que precisas de saber antes. Passa por cima de um cartão para veres o caminho.', openMap: 'Abrir o mapa completo',
    catT: 'Todas as cadeiras', catP: 'Pela ordem em que se costumam fazer.',
    search: 'Pesquisar cadeira, tema ou material', allSems: 'Todos os semestres', allDiff: 'Qualquer dificuldade',
    diff: 'Dificuldade', diffN: ['', 'Muito fácil', 'Fácil', 'Média', 'Difícil', 'Muito difícil'], allStatus: 'Qualquer estado', todo: 'Por começar', doing: 'Em curso', done: 'Concluídas',
    shown: n => `${n} cadeira${n === 1 ? '' : 's'}`, of: 'de', none: 'Nenhuma cadeira corresponde a estes filtros.', clear: 'Limpar filtros',
    unisN: n => `${n} universidades`, topics: 'O que vais aprender', topicsP: 'Pela ordem recomendada. Abre cada tópico para a lição e marca o que já dominas.',
    tasks: 'Tarefas práticas', tasksP: 'Aprende-se a fazer. Marca as que já fizeste.', tools: 'Materiais e ferramentas', toolsP: 'O que as universidades usam nesta cadeira.',
    res: 'Livros e cursos gratuitos', resP: 'Recursos abertos e legais, publicados pelos autores e pelas universidades.', kind: { b: 'Livro', c: 'Curso', p: 'Prática', d: 'Documentação' },
    unis: 'Nas escolas', unisP: 'A unidade curricular equivalente em cada escola. Clica no nome para ver o plano de estudos.', noEq: 'Sem cadeira obrigatória equivalente',
    pinIn: 'Precisas antes', pinOut: 'Abre caminho para', noIn: 'Nada: podes começar já', noOut: 'Fim deste ramo',
    prev: 'Cadeira anterior', nextC: 'Cadeira seguinte',
    mapT: 'Mapa do curso', mapP: 'As colunas são semestres. Escolhe um cartão para veres tudo o que a cadeira tem e o caminho que leva até ela.',
    pick: 'Escolhe um cartão no mapa para veres aqui os conteúdos da cadeira.', pickNet: 'Toca num cartão para veres aqui os tópicos, as tarefas e os livros da cadeira.', openCourse: 'Abrir a página da cadeira',
    lesson: 'Lição', lessonSoon: 'A lição deste tópico ainda está a ser escrita. Entretanto, estes recursos cobrem-no:', learned: 'Já domino este tópico', backCourse: 'Voltar à cadeira', prevT: 'Tópico anterior', nextT: 'Tópico seguinte',
    aboutT: 'Sobre este site', progress: 'O teu progresso', progressP: 'O progresso fica guardado só neste browser. Podes exportá-lo para um ficheiro e importá-lo noutro computador.',
    export: 'Exportar progresso', import: 'Importar progresso', reset: 'Apagar progresso', resetQ: 'Apagar todo o progresso?', imported: 'Progresso importado', exported: 'Progresso exportado', bad: 'Este ficheiro não é um progresso exportado deste site.',
    method: 'Como foi feito', sources: 'Fontes dos planos de estudos', foot: 'Projeto aberto. Os livros e cursos ligados pertencem aos seus autores; este site organiza-os e liga-os.', notFound: 'Esta cadeira não existe.', back: 'Ver todas as cadeiras', sem: 'Semestre', area: 'Área', done2: 'concluído'
  },
  en: {
    brand: 'Open Basic Education', home: 'Path', net: 'Journey', cat: 'Courses', map: 'Map', about: 'About',
    cont: 'Continue', start: 'Start', homeT: 'From the first letter to your first class.', homeP: 'A complete degree in Basic Education (primary teacher education), with lessons, exercises and a path that always tells you what to do next. It brings together what ESE Lisboa, ESE Porto, the University of Évora and the Polytechnic of Leiria teach.',
    stepT: 'Your next step', nextLesson: (n, m) => `Lesson ${n} of ${m}`, nextTask: (n, m) => `Task ${n} of ${m}`, minutes: n => `${n} min read`, noLesson: 'Lesson in preparation, with resources to study',
    after: 'After this', allDone: 'You finished the whole degree. The next step is a master’s in teaching.',
    howT: 'How it works', how: ['Follow the path in order. Each course builds on the earlier ones, like a real degree.', 'Every topic has a lesson with examples and solved exercises. Tick it when you have mastered it.', 'Your journey lights up as you learn, and the Continue button always takes you to the next step.'],
    trailT: 'The path', trailP: 'Six semesters and an advanced stage, in the order they are learned.', phaseDone: (a, b) => `${a} of ${b} courses completed`, showPhase: 'Show courses', hidePhase: 'Hide',
    st: { done: 'Completed', doing: 'In progress', ready: 'Ready to start', wait: 'After' }, youAreHere: 'You are here',
    statT: 'Where you are', statTopics: 'topics mastered', statCourses: 'courses completed', statPhase: 'current stage',
    lessonsIn: 'In this course', tasksLink: 'Hands-on tasks for this course', mastered: 'Mastered, next', skip: 'Not yet, next', masteredLast: 'Mastered, back to the course', reading: 'Reading progress',
    catT2: 'All courses', catP2: 'The full catalogue, to search by topic or material.', boardLink: 'See the degree in 3D',
    closeT: 'Open Basic Education',
    netT: 'Your journey', netP: 'Each course is a card and its topics are the pieces around it. Lines connect it to the courses it depends on. What you have mastered lights up and sends pulses to what comes next.', netHint: 'Drag to rotate the map, scroll or pinch to zoom, and use Shift or right-drag to pan. Tap a card to open it.', zin: 'Zoom in', zout: 'Zoom out', zfit: 'Show all', legHot: 'Mastered', legCold: 'To learn', legSyn: 'Trace: prerequisite', legDen: 'Piece: topic', openLesson: 'Open the lesson',
    heroT: 'From the first letter to your first class.',
    heroP: 'A complete degree in Basic Education, course by course. Each one brings together what ESE Lisboa, ESE Porto, the University of Évora and the Polytechnic of Leiria teach, with hands-on tasks, materials and free resources.',
    meterP: 'Your progress', items: (a, b) => `${a} of ${b} topics and tasks`,
    boardT: 'The degree as a map', boardP: 'Each card is a course; lines connect it to what you need to know first. Hover a card to see its path.', openMap: 'Open the full map',
    catT: 'All courses', catP: 'In the order they are usually taken.',
    search: 'Search a course, topic or material', allSems: 'All semesters', allDiff: 'Any difficulty',
    diff: 'Difficulty', diffN: ['', 'Very easy', 'Easy', 'Medium', 'Hard', 'Very hard'], allStatus: 'Any status', todo: 'Not started', doing: 'In progress', done: 'Completed',
    shown: n => `${n} course${n === 1 ? '' : 's'}`, of: 'of', none: 'No course matches these filters.', clear: 'Clear filters',
    unisN: n => `${n} universities`, topics: 'What you will learn', topicsP: 'In the recommended order. Open each topic for its lesson and tick what you know.',
    tasks: 'Hands-on tasks', tasksP: 'You learn by doing. Tick the ones you have done.', tools: 'Materials and tools', toolsP: 'What universities use in this course.',
    res: 'Free books and courses', resP: 'Open, legal resources published by their authors and universities.', kind: { b: 'Book', c: 'Course', p: 'Practice', d: 'Docs' },
    unis: 'At the schools', unisP: 'The equivalent course at each school. Click a name to see its study plan.', noEq: 'No equivalent required course',
    pinIn: 'You need first', pinOut: 'Leads to', noIn: 'Nothing: start now', noOut: 'End of this branch',
    prev: 'Previous course', nextC: 'Next course',
    mapT: 'Degree map', mapP: 'Columns are semesters. Pick a card to see everything the course contains and the path that leads to it.',
    pick: 'Pick a card on the map to see the course contents here.', pickNet: 'Tap a card to see the course topics, tasks and books here.', openCourse: 'Open the course page',
    lesson: 'Lesson', lessonSoon: 'The lesson for this topic is still being written. Meanwhile, these resources cover it:', learned: 'I know this topic', backCourse: 'Back to the course', prevT: 'Previous topic', nextT: 'Next topic',
    aboutT: 'About this site', progress: 'Your progress', progressP: 'Progress is saved in this browser only. You can export it to a file and import it on another computer.',
    export: 'Export progress', import: 'Import progress', reset: 'Delete progress', resetQ: 'Delete all progress?', imported: 'Progress imported', exported: 'Progress exported', bad: 'This file is not a progress export from this site.',
    method: 'How it was made', sources: 'Curriculum sources', foot: 'Open project. Linked books and courses belong to their authors; this site organises and links them.', notFound: 'This course does not exist.', back: 'See all courses', sem: 'Semester', area: 'Area', done2: 'complete'
  }
};
const t = k => T[L][k];
const nm = c => c[L];
const half = s => { const p = s.split('|'); return p[L === 'pt' ? 0 : 1] || p[0]; };
const desc = c => L === 'pt' ? c.dpt : c.den;

/* ---------- progress ---------- */
let P = store.get('eba.progress', {});
const prog = id => P[id] || (P[id] = { t: [], k: [] });
const pct = c => { const p = P[c.id]; if (!p) return 0; const tot = c.topics.length + c.tasks.length; return tot ? Math.round(100 * (p.t.length + p.k.length) / tot) : 0; };
const totals = () => { let a = 0, b = 0; COURSES.forEach(c => { const p = P[c.id]; b += c.topics.length + c.tasks.length; if (p) a += p.t.length + p.k.length; }); return [a, b]; };
const saveP = () => store.set('eba.progress', P);
function setDone(id, key, j, on) { const p = prog(id); p[key] = on ? [...new Set(p[key].concat(j))] : p[key].filter(x => x !== j); saveP(); if (typeof chrome === 'function') chrome(); }

/* ---------- guided path ---------- */
const doneTopic = (id, j) => !!(P[id] && P[id].t.includes(j));
function courseState(c) {
  const p = pct(c);
  if (p === 100) return { k: 'done' };
  if (p > 0) return { k: 'doing' };
  const missing = c.pre.filter(x => pct(BY[x]) < 50);
  return missing.length ? { k: 'wait', missing } : { k: 'ready' };
}
function nextStep() { // finish what you started first; otherwise the first unfinished course in order
  const started = COURSES.find(c => { const v = pct(c); return v > 0 && v < 100; });
  const c = started || COURSES.find(x => pct(x) < 100);
  if (!c) return null;
  const p = prog(c.id), j = c.topics.findIndex((_, i) => !p.t.includes(i));
  if (j >= 0) return { c, kind: 't', j, href: `#/l/${c.id}/${j + 1}` };
  const k = c.tasks.findIndex((_, i) => !p.k.includes(i));
  return { c, kind: 'k', j: k, href: `#/c/${c.id}` };
}
function upcoming(n) { // the next few topics after the next step, across courses
  const out = []; let first = true;
  for (const c of COURSES) { if (pct(c) === 100) continue; const p = prog(c.id); c.topics.forEach((s, j) => { if (!p.t.includes(j)) { if (first) { first = false; return; } if (out.length < n) out.push({ c, j }); } }); if (out.length >= n) break; }
  return out;
}
const readMin = (id, j) => { const l = lessonOf(id, j); return l ? Math.max(3, Math.round(l.split(/\s+/).length / 190)) : 0; };

/* ---------- filters ---------- */
let F = Object.assign({ q: '', sem: '', area: [], diff: '', st: '' }, store.get('eba.filters', {}));
const saveF = () => store.set('eba.filters', F);
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const HAY = Object.fromEntries(COURSES.map(c => [c.id, norm([c.pt, c.en, c.dpt, c.den, c.topics.join(' '), c.tasks.join(' '), c.tools.join(' '), Object.values(c.unis).join(' '), c.res.map(r => r[0] + ' ' + r[1]).join(' ')].join(' '))]));
function match(c) {
  if (F.sem && c.sem !== F.sem) return false;
  if (F.area.length && !F.area.includes(c.area)) return false;
  if (F.diff && c.diff !== +F.diff) return false;
  if (F.st) { const p = pct(c); if (F.st === 'todo' && p > 0) return false; if (F.st === 'doing' && (p === 0 || p === 100)) return false; if (F.st === 'done' && p < 100) return false; }
  if (F.q) return norm(F.q).split(/\s+/).filter(Boolean).every(w => HAY[c.id].includes(w));
  return true;
}

/* ---------- small pieces ---------- */
const areaC = c => AREAS[c.area].c;
const semName = id => SEMS.find(s => s.id === id)[L];
const sig = n => `<span class="sig" role="img" aria-label="${t('diff')}: ${t('diffN')[n]}" title="${t('diff')}: ${t('diffN')[n]}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
const charge = p => `<span class="charge" aria-hidden="true"><i style="width:${p}%"></i></span>`;
const KC = { b: '#e0a020', c: '#00a37a', p: '#8b5cf6', d: '#3d7bff' };
function toast(msg) { let el = $('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); } el.textContent = msg; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2400); }
const lessonOf = (id, j) => { const l = LESSONS[id] && LESSONS[id][j]; return l ? (l[L] || l.pt || l.en) : null; };

/* ---------- the board (map as a circuit) ---------- */
const G = { colW: 236, chipW: 178, chipH: 56, rowGap: 34, top: 54, left: 30 };
function boardSVG(id) {
  const cols = SEMS.map(s => COURSES.filter(c => c.sem === s.id));
  const pos = {};
  cols.forEach((cs, ci) => cs.forEach((c, ri) => { pos[c.id] = { x: G.left + ci * G.colW, y: G.top + ri * (G.chipH + G.rowGap), ci, ri }; }));
  const rows = Math.max(...cols.map(c => c.length));
  const W = G.left + SEMS.length * G.colW - (G.colW - G.chipW) + G.left, H = G.top + rows * (G.chipH + G.rowGap) - G.rowGap + 28;
  // pin slots: spread incoming pins on the left edge, outgoing on the right
  const pinY = (y, k, n) => y + (n <= 1 ? G.chipH / 2 : 14 + k * (G.chipH - 28) / (n - 1));
  const out = {}, inc = {};
  COURSES.forEach(c => { inc[c.id] = c.pre.slice().sort((a, b) => pos[a].y - pos[b].y); });
  COURSES.forEach(c => { out[c.id] = (DEPS[c.id] || []).slice().sort((a, b) => pos[a].y - pos[b].y); });
  const traces = [];
  let lane = 0;
  COURSES.forEach(c => c.pre.forEach(p => {
    const a = pos[p], b = pos[c.id];
    const x1 = a.x + G.chipW + 7, y1 = pinY(a.y, out[p].indexOf(c.id), out[p].length);
    const x2 = b.x - 7, y2 = pinY(b.y, inc[c.id].indexOf(p), inc[c.id].length);
    const l = (lane++ % 6);
    let d;
    if (b.ci - a.ci === 1) { const mx = x1 + 10 + l * 4.5; d = `M${x1} ${y1}H${mx}V${y2}H${x2}`; }
    else { // route through the gap row above the target, between chips
      const gx1 = x1 + 10 + l * 4.5, gy = b.y - G.rowGap / 2 - 6 + l * 2.4, gx2 = x2 - 12 - l * 3;
      d = `M${x1} ${y1}H${gx1}V${gy}H${gx2}V${y2}H${x2}`;
    }
    traces.push(`<path class="trace" data-from="${p}" data-to="${c.id}" d="${d}"/><circle class="via" data-from="${p}" data-to="${c.id}" cx="${x1}" cy="${y1}" r="2.6"/><circle class="via" data-from="${p}" data-to="${c.id}" cx="${x2}" cy="${y2}" r="2.6"/>`);
  }));
  const fit = s => { const max = 21; if (s.length <= max) return [s]; const w = s.split(' '); let a = ''; while (w.length && (a + ' ' + w[0]).trim().length <= max) a = (a + ' ' + w.shift()).trim(); let b = w.join(' '); if (b.length > max) b = b.slice(0, max - 1) + '…'; return [a || s.slice(0, max), b]; };
  const chips = COURSES.map(c => {
    const { x, y } = pos[c.id], p = pct(c), lines = fit(nm(c));
    const pins = [0, 1, 2].map(k => { const py = y + 14 + k * (G.chipH - 28) / 2; return `<line class="pin" x1="${x - 6}" y1="${py}" x2="${x}" y2="${py}"/><line class="pin" x1="${x + G.chipW}" y1="${py}" x2="${x + G.chipW + 6}" y2="${py}"/>`; }).join('');
    const ty = lines.length === 1 ? y + 31 : y + 24;
    return `<g class="chip" data-id="${c.id}" tabindex="0" role="button" aria-label="${esc(nm(c))}, ${esc(semName(c.sem))}, ${p}%">${pins}<rect class="body" x="${x}" y="${y}" width="${G.chipW}" height="${G.chipH}" rx="5"/><path class="notch" d="M${x + G.chipW / 2 - 7} ${y}a7 7 0 0 0 14 0"/><rect class="area" x="${x + 9}" y="${y + G.chipH - 9}" width="22" height="3" rx="1" fill="${areaC(c)}"/><rect class="slot" x="${x + 37}" y="${y + G.chipH - 9}" width="${G.chipW - 46}" height="3" rx="1"/>${p ? `<rect class="fill" x="${x + 37}" y="${y + G.chipH - 9}" width="${(G.chipW - 46) * p / 100}" height="3" rx="1"/>` : ''}<text x="${x + 11}" y="${ty}">${lines.map((s, i) => `<tspan x="${x + 11}" dy="${i ? 15 : 0}">${esc(s)}</tspan>`).join('')}</text></g>`;
  }).join('');
  const lanes = SEMS.map((s, i) => `<rect class="lane" x="${G.left + i * G.colW - 14}" y="40" width="${G.chipW + 28}" height="${H - 40}" rx="8"/><text class="layer" x="${G.left + i * G.colW}" y="26">${esc(s[L])}</text>`).join('');
  return `<svg class="map" id="${id}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(t('mapT'))}">${lanes}${traces.join('')}${chips}</svg>`;
}
const ancestors = (id, s = new Set()) => { BY[id].pre.forEach(p => { if (!s.has(p)) { s.add(p); ancestors(p, s); } }); return s; };
const descendants = (id, s = new Set()) => { (DEPS[id] || []).forEach(p => { if (!s.has(p)) { s.add(p); descendants(p, s); } }); return s; };
function bindBoard(svg, onPick, sticky) {
  let locked = sticky || null;
  const focus = id => {
    id = id || locked;
    if (!id) { svg.classList.remove('focus'); $$('.hl,.cur', svg).forEach(e => e.classList.remove('hl', 'cur')); return; }
    const on = new Set([id, ...ancestors(id), ...descendants(id)]);
    svg.classList.add('focus');
    $$('.chip', svg).forEach(n => { n.classList.toggle('hl', on.has(n.dataset.id)); n.classList.toggle('cur', n.dataset.id === id); });
    $$('.trace,.via', svg).forEach(e => e.classList.toggle('hl', on.has(e.dataset.from) && on.has(e.dataset.to)));
  };
  $$('.chip', svg).forEach(n => {
    const id = n.dataset.id;
    n.addEventListener('mouseenter', () => focus(id));
    n.addEventListener('mouseleave', () => focus(null));
    n.addEventListener('focus', () => focus(id));
    n.addEventListener('blur', () => focus(null));
    const pick = () => { if (onPick) { locked = id; focus(id); onPick(id); } else location.hash = '#/c/' + id; };
    n.addEventListener('click', pick);
    n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });
  if (locked) focus(locked);
  // one orchestrated moment: traces are drawn in on the first visit of the session
  let booted = false; try { booted = sessionStorage.getItem('eba.boot'); sessionStorage.setItem('eba.boot', '1'); } catch (e) { booted = true; }
  if (!booted && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('.trace', svg).forEach((p, i) => { const len = Math.ceil(p.getTotalLength()); p.style.setProperty('--len', len); p.style.setProperty('--d', (Math.min(i, 60) * 18) + 'ms'); });
    svg.classList.add('boot');
    setTimeout(() => svg.classList.remove('boot'), 2400);
  }
}
const legend = () => `<div class="legend">${Object.values(AREAS).map(a => `<span><i style="background:${a.c}"></i>${esc(a[L])}</span>`).join('')}</div>`;

/* ---------- home: the guided path ---------- */
const glyph = k => `<span class="glyph g-${k}" aria-hidden="true"></span>`;
function nextPanel() {
  const ns = nextStep();
  if (!ns) return `<section class="next rise"><h2>${t('stepT')}</h2><p class="next-title">${t('allDone')}</p></section>`;
  const c = ns.c, isT = ns.kind === 't', title = isT ? half(c.topics[ns.j]) : half(c.tasks[ns.j]);
  const mins = isT ? readMin(c.id, ns.j) : 0, fresh = totals()[0] === 0;
  const meta = [isT ? t('nextLesson')(ns.j + 1, c.topics.length) : t('nextTask')(ns.j + 1, c.tasks.length), mins ? t('minutes')(mins) : (isT ? t('noLesson') : '')].filter(Boolean);
  const after = upcoming(3).map(u => `<li><a href="#/l/${u.c.id}/${u.j + 1}"><span>${esc(half(u.c.topics[u.j]))}</span><small>${esc(nm(u.c))}</small></a></li>`).join('');
  return `<section class="next rise tilt" aria-labelledby="nxt"><div class="next-main"><h2 id="nxt">${t('stepT')}</h2>
      <p class="next-course"><a href="#/c/${c.id}">${esc(nm(c))}</a></p><p class="next-title">${esc(title)}</p>
      <p class="next-meta">${meta.map(esc).join('<span class="sep"></span>')}</p>
      <a class="btn-fire" href="${ns.href}">${fresh ? t('start') : t('cont')}</a>
      <div class="next-course-prog"><span>${esc(nm(c))}</span>${charge(pct(c))}<span>${pct(c)}%</span></div></div>
    ${after ? `<div class="next-after"><h3>${t('after')}</h3><ol>${after}</ol></div>` : ''}</section>`;
}
function statsStrip() {
  const [a] = totals(), nT = COURSES.reduce((x, c) => x + (P[c.id] ? P[c.id].t.length : 0), 0), allT = COURSES.reduce((x, c) => x + c.topics.length, 0);
  const doneC = COURSES.filter(c => pct(c) === 100).length, ns = nextStep();
  return `<section class="stats rise" aria-label="${t('statT')}"><div><b>${nT}<small>/${allT}</small></b><span>${t('statTopics')}</span></div><div><b>${doneC}<small>/${COURSES.length}</small></b><span>${t('statCourses')}</span></div><div><b class="phase">${esc(ns ? semName(ns.c.sem) : '—')}</b><span>${t('statPhase')}</span></div></section>`;
}
function howStrip() {
  if (totals()[0] > 0) return '';
  return `<section class="how rise" aria-labelledby="how"><h2 id="how">${t('howT')}</h2><div class="how-cols">${t('how').map(x => `<p>${esc(x)}</p>`).join('')}</div></section>`;
}
let openPhases = store.get('eba.open', null);
function trail() {
  const ns = nextStep(), cur = ns ? ns.c.sem : null;
  if (!openPhases) openPhases = cur ? [cur] : [];
  const phases = SEMS.map(s => {
    const cs = COURSES.filter(c => c.sem === s.id), doneN = cs.filter(c => pct(c) === 100).length, open = openPhases.includes(s.id), here = s.id === cur;
    const k = doneN === cs.length ? 'done' : (here ? 'doing' : (cs.some(c => pct(c) > 0) ? 'doing' : 'todo'));
    const steps = cs.map(c => {
      const st = courseState(c), v = pct(c), isNext = ns && ns.c.id === c.id;
      const label = st.k === 'wait' ? `${t('st').wait} ${st.missing.map(x => nm(BY[x])).join(', ')}` : t('st')[st.k];
      return `<li class="step s-${st.k}${isNext ? ' is-next' : ''}"><a href="#/c/${c.id}">${glyph(st.k)}<span class="step-name">${esc(nm(c))}</span><span class="step-state">${isNext ? `<b>${t('youAreHere')}</b>` : esc(label)}</span><span class="step-bar">${charge(v)}</span></a></li>`;
    }).join('');
    return `<li class="phase p-${k}${here ? ' here' : ''}"><div class="phase-head">${glyph(k)}<h3>${esc(s[L])}</h3><span class="phase-count">${t('phaseDone')(doneN, cs.length)}</span><button type="button" class="phase-toggle" data-ph="${s.id}" aria-expanded="${open}">${open ? t('hidePhase') : t('showPhase')}</button></div><ol class="steps-list"${open ? '' : ' hidden'}>${steps}</ol></li>`;
  }).join('');
  return `<section class="trail rise" aria-labelledby="trl"><div class="trail-head"><h2 id="trl">${t('trailT')}</h2><p>${t('trailP')}</p></div><ol class="phases">${phases}</ol></section>`;
}
function viewHome() {
  return `<section class="hero-net"><div class="hero-canvas" id="heroNet"></div><div class="hero-copy rise"><h1>${t('homeT')}</h1><p class="lead">${t('homeP')}</p></div></section>
  ${nextPanel()}${howStrip()}${statsStrip()}${trail()}`;
}
function bindHome() {
  $$('.phase-toggle').forEach(b => b.onclick = () => {
    const id = b.dataset.ph, list = b.closest('.phase').querySelector('.steps-list'), open = list.hidden;
    list.hidden = !open; b.setAttribute('aria-expanded', open); b.textContent = open ? t('hidePhase') : t('showPhase');
    openPhases = open ? [...new Set(openPhases.concat(id))] : openPhases.filter(x => x !== id); store.set('eba.open', openPhases);
  });
  placaReady(() => { if (NET || !$('#heroNet')) return; NET = window.Placa.mount($('#heroNet'), { ambient: true, lang: L, courses: COURSES, sems: SEMS, deps: DEPS, pct, isDone: doneTopic, name: nm, topicName: (c, j) => half(c.topics[j]), esc, reduced: REDUCED.matches, label: t('netT') }); });
}

/* ---------- home ---------- */
function viewCatalog() {
  const [a, b] = totals(), list = COURSES.filter(match);
  const semOpts = SEMS.map(s => `<option value="${s.id}" ${F.sem === s.id ? 'selected' : ''}>${esc(s[L])}</option>`).join('');
  const diffOpts = [1, 2, 3, 4, 5].map(d => `<option value="${d}" ${+F.diff === d ? 'selected' : ''}>${t('diffN')[d]}</option>`).join('');
  const stOpts = ['todo', 'doing', 'done'].map(s => `<option value="${s}" ${F.st === s ? 'selected' : ''}>${t(s)}</option>`).join('');
  const areaBtns = Object.entries(AREAS).map(([k, ar]) => `<button type="button" class="area-btn" data-area="${k}" aria-pressed="${F.area.includes(k)}"><i style="background:${ar.c}"></i>${esc(ar[L])}</button>`).join('');
  const any = F.q || F.sem || F.area.length || F.diff || F.st;
  return `<section class="page-head rise"><h1>${t('catT2')}</h1><p class="lead">${t('catP2')}</p><p><a class="textlink" href="#/rede">${t('boardLink')}</a></p></section>
  <section class="catalogue rise" aria-label="${esc(t('catT2'))}">
    <div class="filters" role="search">
      <label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="q" type="search" value="${esc(F.q)}" placeholder="${esc(t('search'))}" aria-label="${esc(t('search'))}"></label>
      <select id="fSem" aria-label="${t('sem')}"><option value="">${t('allSems')}</option>${semOpts}</select>
      <select id="fDiff" aria-label="${t('diff')}"><option value="">${t('allDiff')}</option>${diffOpts}</select>
      <select id="fSt" aria-label="${t('progress')}"><option value="">${t('allStatus')}</option>${stOpts}</select>
      <div class="areas" role="group" aria-label="${t('area')}">${areaBtns}</div>
    </div>
    <p class="count">${t('shown')(list.length)} ${t('of')} ${COURSES.length}${any ? ` <a href="#" id="clr">${t('clear')}</a>` : ''}</p>
    <div id="rows">${rowsHTML(list)}</div></section>`;
}
function rowsHTML(list) {
  if (!list.length) return `<div class="empty">${t('none')}</div>`;
  return SEMS.map(s => {
    const cs = list.filter(c => c.sem === s.id); if (!cs.length) return '';
    return `<div class="layer-block"><div class="layer-title"><h3>${esc(s[L])}</h3><span>${t('shown')(cs.length)}</span></div><ul class="rows">${cs.map(c => {
      const p = pct(c);
      return `<li class="row"><a href="#/c/${c.id}"><span class="sw" style="background:${areaC(c)}"></span><span><span class="row-name">${esc(nm(c))}</span><span class="row-desc">${esc(desc(c))}</span></span><span class="row-area">${esc(AREAS[c.area][L])}</span>${sig(c.diff)}<span class="row-unis">${t('unisN')(Object.keys(c.unis).length)}</span><span class="row-prog">${charge(p)}<span>${p}%</span></span></a></li>`;
    }).join('')}</ul></div>`;
  }).join('');
}
function bindCatalog() {
  const q = $('#q');
  const refresh = () => { $('#rows').innerHTML = rowsHTML(COURSES.filter(match)); const n = COURSES.filter(match).length; const any = F.q || F.sem || F.area.length || F.diff || F.st; $('.count').innerHTML = `${t('shown')(n)} ${t('of')} ${COURSES.length}${any ? ` <a href="#" id="clr">${t('clear')}</a>` : ''}`; bindClear(); };
  const bindClear = () => { const c = $('#clr'); if (c) c.onclick = e => { e.preventDefault(); F = { q: '', sem: '', area: [], diff: '', st: '' }; saveF(); render(); }; };
  q.addEventListener('input', () => { F.q = q.value; saveF(); refresh(); });
  $('#fSem').onchange = e => { F.sem = e.target.value; saveF(); refresh(); };
  $('#fDiff').onchange = e => { F.diff = e.target.value; saveF(); refresh(); };
  $('#fSt').onchange = e => { F.st = e.target.value; saveF(); refresh(); };
  $$('[data-area]').forEach(b => b.onclick = () => { const ar = b.dataset.area; F.area = F.area.includes(ar) ? F.area.filter(x => x !== ar) : F.area.concat(ar); b.setAttribute('aria-pressed', F.area.includes(ar)); saveF(); refresh(); });
  bindClear();
}

/* ---------- course ---------- */
const pinList = (ids, empty) => ids.length ? ids.map(x => `<div class="pin"><a href="#/c/${x}">${esc(nm(BY[x]))}</a></div>`).join('') : `<div class="pin"><span>${empty}</span></div>`;
const checkList = (c, arr, key, linkTopics) => { const p = prog(c.id); return `<ol class="checks">${arr.map((s, j) => `<li><label><input type="checkbox" data-c="${c.id}" data-k="${key}" data-i="${j}" ${p[key].includes(j) ? 'checked' : ''}><span class="n" aria-hidden="true"></span><span>${linkTopics ? `<a href="#/l/${c.id}/${j + 1}">${esc(half(s))}</a>` : esc(half(s))}</span></label></li>`).join('')}</ol>`; };
const resList = c => `<ul class="res">${c.res.map(r => `<li><span class="kind" style="--k:${KC[r[3]]}">${t('kind')[r[3]]}</span><div><a href="${esc(r[2])}" target="_blank" rel="noopener">${esc(r[0])}</a><small>${esc(r[1])}</small></div></li>`).join('')}</ul>`;
const codeSplit = v => { const m = /^((?:CS|Math|Stat|AM|Stat)\s?\d+[A-Za-z]?|\d{1,2}\.\d{3,4}[A-Z]?(?:\s?\/\s?[\d.]+)?|\d{2}-\d{3}(?:\/\d{2}-\d{3})?)\s+(.*)$/.exec(v); return m ? `<code>${esc(m[1])}</code>${esc(m[2])}` : esc(v); };
const uniTable = c => `<table class="unis">${UNIS.map(u => { const v = c.unis[u.id]; return `<tr><th scope="row"><a href="${esc(u.src)}" target="_blank" rel="noopener" title="${esc(u.full)}">${esc(u.n)}</a></th>${v ? `<td>${v.split('; ').map(codeSplit).join('<br>')}</td>` : `<td class="none">${t('noEq')}</td>`}</tr>`; }).join('')}</table>`;
function viewCourse(id) {
  const c = BY[id]; if (!c) return `<div class="empty" style="margin-top:40px">${t('notFound')} <a href="#/">${t('back')}</a></div>`;
  const i = ORDER.indexOf(id), prev = BY[ORDER[i - 1]], next = BY[ORDER[i + 1]], p = prog(c.id), cp = pct(c);
  return `<div class="crumbs"><a href="#/">${t('home')}</a> / ${esc(semName(c.sem))}</div>
  <header class="c-hero"><span class="sw" style="background:${areaC(c)}"></span><div><h1>${esc(nm(c))}</h1><p class="lead">${esc(desc(c))}</p>
    <ul class="facts"><li>${t('sem')}<b>${esc(semName(c.sem))}</b></li><li>${t('area')}<b><i style="width:14px;height:4px;border-radius:1px;background:${areaC(c)}"></i>${esc(AREAS[c.area][L])}</b></li><li>${t('diff')}<b>${sig(c.diff)} ${t('diffN')[c.diff]}</b></li><li>${t('progress')}<b id="cpct">${cp}% ${t('done2')}</b></li></ul></div></header>
  <section class="pinout" aria-label="${t('pinIn')} / ${t('pinOut')}">
    <div class="pins in"><h3>${t('pinIn')}</h3>${pinList(c.pre, t('noIn'))}</div>
    <div class="die tilt"><div class="die-legs" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div><b>${esc(nm(c))}</b><small>${t('items')(p.t.length + p.k.length, c.topics.length + c.tasks.length)}</small>${charge(cp)}</div></div>
    <div class="pins out"><h3>${t('pinOut')}</h3>${pinList(DEPS[c.id] || [], t('noOut'))}</div>
  </section>
  <div class="cols"><div>
    <section class="panel"><div class="panel-h"><h2>${t('topics')}</h2><span class="tally" id="tl-t">${p.t.length}/${c.topics.length}</span></div><p>${t('topicsP')}</p>${checkList(c, c.topics, 't', true)}</section>
    <section class="panel"><div class="panel-h"><h2>${t('tasks')}</h2><span class="tally" id="tl-k">${p.k.length}/${c.tasks.length}</span></div><p>${t('tasksP')}</p>${checkList(c, c.tasks, 'k')}</section>
    <section class="panel"><div class="panel-h"><h2>${t('res')}</h2></div><p>${t('resP')}</p>${resList(c)}</section>
  </div><div>
    <section class="panel"><div class="panel-h"><h2>${t('tools')}</h2></div><p>${t('toolsP')}</p><div class="tools">${c.tools.map(x => `<span class="tool">${esc(x)}</span>`).join('')}</div></section>
    <section class="panel"><div class="panel-h"><h2>${t('unis')}</h2></div><p>${t('unisP')}</p>${uniTable(c)}</section>
  </div></div>
  <nav class="steps" aria-label="${t('prev')} / ${t('nextC')}">${prev ? `<a href="#/c/${prev.id}"><small>${t('prev')}</small><b>${esc(nm(prev))}</b></a>` : ''}${next ? `<a class="next" href="#/c/${next.id}"><small>${t('nextC')}</small><b>${esc(nm(next))}</b></a>` : ''}</nav>`;
}
function bindChecks(root, after) {
  $$('.checks input', root).forEach(inp => inp.onchange = () => { setDone(inp.dataset.c, inp.dataset.k, +inp.dataset.i, inp.checked); after && after(inp.dataset.c, inp.dataset.k); });
}
function bindCourse(id) {
  const c = BY[id]; if (!c) return;
  bindChecks(document, (cid, k) => { const p = prog(cid); $('#tl-' + k).textContent = `${p[k].length}/${(k === 't' ? c.topics : c.tasks).length}`; $('#cpct').textContent = `${pct(c)}% ${t('done2')}`; $('.die small').textContent = t('items')(p.t.length + p.k.length, c.topics.length + c.tasks.length); $('.die .charge i').style.width = pct(c) + '%'; });
}

/* ---------- lesson (one topic) ---------- */
function md(src) { // small, safe Markdown subset: headings, paragraphs, lists, tables, code blocks, "??? Solutions" blocks, inline code, bold, italics, links
  const out = [], lines = src.replace(/\r/g, '').split('\n'); let i = 0;
  const inline = s => { const codes = []; s = s.replace(/``\s?(.+?)\s?``|`([^`]+)`/g, (m, a, b) => { codes.push(a || b); return `\u0000${codes.length - 1}\u0000`; }); return esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>').replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/\u0000(\d+)\u0000/g, (m, k) => `<code>${esc(codes[k])}</code>`); };
  const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  while (i < lines.length) {
    const l = lines[i];
    let m;
    if ((m = /^(`{3,})(.*)$/.exec(l))) { const fence = m[1], lang = m[2].trim(); const buf = []; i++; while (i < lines.length && lines[i].trim() !== fence) buf.push(lines[i++]); i++; out.push(`<pre class="code"${lang ? ` data-lang="${esc(lang)}"` : ''}><code>${esc(buf.join('\n'))}</code></pre>`); continue; }
    if ((m = /^\?\?\?\s*(.*)$/.exec(l)) && m[1]) { const buf = []; i++; while (i < lines.length && lines[i].trim() !== '???') buf.push(lines[i++]); i++; out.push(`<details class="sol"><summary>${inline(m[1])}</summary><div>${md(buf.join('\n'))}</div></details>`); continue; }
    if (/^\|.*\|\s*$/.test(l) && /^\|?\s*:?-{3,}/.test(lines[i + 1] || '')) { const head = cells(l); i += 2; const body = []; while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) body.push(cells(lines[i++])); out.push(`<div class="tbl"><table><thead><tr>${head.map(h => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue; }
    if ((m = /^(#{2,4})\s+(.*)/.exec(l))) { const n = m[1].length; out.push(`<h${n}>${inline(m[2])}</h${n}>`); i++; continue; }
    if (/^\s*[-*]\s+/.test(l)) { const buf = []; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) buf.push(`<li>${inline(lines[i++].replace(/^\s*[-*]\s+/, ''))}</li>`); out.push(`<ul>${buf.join('')}</ul>`); continue; }
    if (/^\s*\d+\.\s+/.test(l)) { const buf = []; while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) buf.push(`<li>${inline(lines[i++].replace(/^\s*\d+\.\s+/, ''))}</li>`); out.push(`<ol>${buf.join('')}</ol>`); continue; }
    if (/^>\s?/.test(l)) { const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, '')); out.push(`<aside class="note">${inline(buf.join(' '))}</aside>`); continue; }
    if (!l.trim()) { i++; continue; }
    const buf = []; while (i < lines.length && lines[i].trim() && !/^(```|#{2,4}\s|\s*[-*]\s|\s*\d+\.\s|>|\?\?\?|\|.*\|\s*$)/.test(lines[i])) buf.push(lines[i++]); out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('');
}
function viewLesson(id, n) {
  const c = BY[id], j = n - 1; if (!c || !c.topics[j]) return viewCourse(id);
  const body = lessonOf(id, j), p = prog(id), last = j === c.topics.length - 1, nextHref = last ? `#/c/${id}` : `#/l/${id}/${j + 2}`;
  const side = c.topics.map((s, i) => `<li class="${i === j ? 'cur' : ''} ${p.t.includes(i) ? 'ok' : ''}"><a href="#/l/${id}/${i + 1}"${i === j ? ' aria-current="page"' : ''}>${glyph(p.t.includes(i) ? 'done' : i === j ? 'doing' : 'todo')}<span>${esc(half(s))}</span></a></li>`).join('');
  const mins = readMin(id, j);
  return `<div class="readbar" aria-hidden="true"><i id="readbar"></i></div>
  <div class="lesson-grid"><aside class="lesson-side" aria-label="${t('lessonsIn')}"><p class="side-course"><a href="#/c/${id}">${esc(nm(c))}</a></p><h2>${t('lessonsIn')}</h2><ol>${side}</ol><a class="textlink" href="#/c/${id}">${t('tasksLink')}</a></aside>
  <article class="lesson rise"><header><p class="lesson-k">${esc(t('nextLesson')(n, c.topics.length))}${mins ? `<span class="sep"></span>${t('minutes')(mins)}` : ''}</p><h1>${esc(half(c.topics[j]))}</h1></header>
  <div class="prose">${body ? md(body) : `<p>${t('lessonSoon')}</p>${resList(c)}`}</div>
  <div class="lesson-end"><button type="button" class="btn-fire" id="mastered" data-next="${nextHref}">${last ? t('masteredLast') : t('mastered')}</button>${last ? '' : `<a class="textlink" href="${nextHref}">${t('skip')}</a>`}
  <label class="learned"><input type="checkbox" data-c="${id}" data-k="t" data-i="${j}" ${p.t.includes(j) ? 'checked' : ''}> ${t('learned')}</label></div></article></div>`;
}
let readRaf = 0;
function onReadScroll() { cancelAnimationFrame(readRaf); readRaf = requestAnimationFrame(() => { const bar = $('#readbar'); if (!bar) return; const a = $('.lesson'); const r = a.getBoundingClientRect(), total = r.height - innerHeight; bar.style.transform = `scaleX(${Math.max(0, Math.min(1, total > 0 ? -r.top / total : 1))})`; }); }
function bindLesson() {
  $$('.learned input').forEach(inp => inp.onchange = () => setDone(inp.dataset.c, 't', +inp.dataset.i, inp.checked));
  const m = $('#mastered'); if (m) m.onclick = () => { const inp = $('.learned input'); setDone(inp.dataset.c, 't', +inp.dataset.i, true); location.hash = m.dataset.next; };
  onReadScroll();
}
window.addEventListener('scroll', () => {
  if ($('#readbar')) onReadScroll();
  const hero = $('#heroNet'); if (hero && NET && NET.setScroll) NET.setScroll(Math.max(0, Math.min(1, scrollY / (hero.offsetHeight || 1))));
}, { passive: true });
// cards lean towards the pointer, a few degrees, only with a precise pointer and when motion is allowed
const FINE = window.matchMedia('(hover: hover) and (pointer: fine)');
document.addEventListener('pointermove', e => {
  if (!FINE.matches || REDUCED.matches) return;
  const el = e.target.closest && e.target.closest('.tilt'); $$('.tilt.tilting').forEach(x => { if (x !== el) { x.classList.remove('tilting'); x.style.transform = ''; } });
  if (!el) return; const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  el.classList.add('tilting'); el.style.transform = `perspective(1200px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
}, { passive: true });

/* ---------- full map with inspector ---------- */
let pickId = null;
function inspectorHTML(id) {
  if (!id) return `<div class="insp-empty">${t('pick')}</div>`;
  const c = BY[id], p = prog(id);
  return `<div class="insp-h"><span class="sw" style="background:${areaC(c)}"></span><div><small>${esc(semName(c.sem))}</small><h2>${esc(nm(c))}</h2></div></div>
  <p class="mut">${esc(desc(c))}</p><a class="btn-link" href="#/c/${id}">${t('openCourse')}</a>
  <div class="insp-sec"><div class="panel-h"><h3>${t('topics')}</h3><span class="tally" id="it-t">${p.t.length}/${c.topics.length}</span></div>${checkList(c, c.topics, 't', true)}</div>
  <div class="insp-sec"><div class="panel-h"><h3>${t('tasks')}</h3><span class="tally" id="it-k">${p.k.length}/${c.tasks.length}</span></div>${checkList(c, c.tasks, 'k')}</div>
  <div class="insp-sec"><h3>${t('tools')}</h3><div class="tools">${c.tools.map(x => `<span class="tool">${esc(x)}</span>`).join('')}</div></div>
  <div class="insp-sec"><h3>${t('res')}</h3>${resList(c)}</div>
  <div class="insp-sec"><h3>${t('pinIn')}</h3><div class="tools">${c.pre.map(x => `<a class="tool" href="#/mapa/${x}">${esc(nm(BY[x]))}</a>`).join('') || `<span class="mut">${t('noIn')}</span>`}</div>
  <h3 style="margin-top:14px">${t('pinOut')}</h3><div class="tools">${(DEPS[id] || []).map(x => `<a class="tool" href="#/mapa/${x}">${esc(nm(BY[x]))}</a>`).join('') || `<span class="mut">${t('noOut')}</span>`}</div></div>`;
}
function viewMap(id) {
  pickId = BY[id] ? id : null;
  return `<section class="hero map-hero"><div><h1>${t('mapT')}</h1><p class="lead">${t('mapP')}</p></div></section>
  <div class="mapgrid"><section class="board"><div class="board-scroll">${boardSVG('bigmap')}</div>${legend()}</section>
  <aside class="inspector" id="insp" aria-live="polite">${inspectorHTML(pickId)}</aside></div>`;
}
function bindInspector() {
  bindChecks($('#insp'), (cid, k) => { const p = prog(cid), c = BY[cid]; const el = $('#it-' + k); if (el) el.textContent = `${p[k].length}/${(k === 't' ? c.topics : c.tasks).length}`; const fill = $(`#bigmap .chip[data-id="${cid}"]`); if (fill) refreshChip(fill, c); if (NET) NET.refresh(); });
}
function refreshChip(g, c) { const p = pct(c), slot = $('.slot', g); let f = $('.fill', g); if (!f && p) { f = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); f.setAttribute('class', 'fill'); ['x', 'y', 'height', 'rx'].forEach(a => f.setAttribute(a, slot.getAttribute(a))); slot.after(f); } if (f) f.setAttribute('width', (+slot.getAttribute('width')) * p / 100); }
function bindMap() {
  const svg = $('#bigmap');
  bindBoard(svg, id => { pickId = id; history.replaceState(null, '', '#/mapa/' + id); swapInsp(inspectorHTML(id)); bindInspector(); if (window.innerWidth < 1000) $('#insp').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, pickId);
  bindInspector();
  if (pickId) { const g = $(`.chip[data-id="${pickId}"]`, svg), sc = $('.board-scroll'); if (g && sc) { const x = +$('.body', g).getAttribute('x'); sc.scrollLeft = Math.max(0, x - sc.clientWidth / 2 + G.chipW / 2); } }
}

/* ---------- neural network view ---------- */
function swapInsp(html) {
  const el = $('#insp'); el.innerHTML = html;
  if (!REDUCED.matches) { el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); }
}
function viewNet(id) {
  pickId = BY[id] ? id : null;
  return `<section class="net-hero"><h1>${t('netT')}</h1><p class="lead">${t('netP')}</p></section>
  <div class="netgrid"><section class="net" aria-label="${esc(t('netT'))}">
    <div class="net-stage" id="netStage"></div>
    <div class="net-ui"><button type="button" class="net-btn" id="zIn" aria-label="${t('zin')}">+</button><button type="button" class="net-btn" id="zOut" aria-label="${t('zout')}">−</button><button type="button" class="net-btn wide" id="zFit">${t('zfit')}</button></div>
    <div class="net-legend"><span><i class="dot hot"></i>${t('legHot')}</span><span><i class="dot cold"></i>${t('legCold')}</span><span><i class="ln syn"></i>${t('legSyn')}</span><span><i class="dot den"></i>${t('legDen')}</span></div>
    <p class="net-hint">${t('netHint')}</p>
  </section>
  <aside class="inspector net-insp" id="insp" aria-live="polite">${pickId ? inspectorHTML(pickId) : `<div class="insp-empty">${t('pickNet')}</div>`}</aside></div>`;
}
function showNetInsp(id, topic) {
  pickId = id || null;
  swapInsp(pickId ? inspectorHTML(pickId) : `<div class="insp-empty">${t('pickNet')}</div>`); bindInspector();
  if (id && topic != null) { const a = $(`#insp .checks a[href="#/l/${id}/${topic + 1}"]`); if (a) { a.closest('li').classList.add('flash'); a.focus({ preventScroll: true }); a.scrollIntoView({ block: 'nearest', behavior: REDUCED.matches ? 'auto' : 'smooth' }); } }
}
function bindNet() {
  const done = (cid, j) => prog(cid).t.includes(j);
  placaReady(() => { if (NET || !$('#netStage')) return; NET = window.Placa.mount($('#netStage'), { lang: L,
    courses: COURSES, sems: SEMS, deps: DEPS, pct, isDone: done, name: nm, topicName: (c, j) => half(c.topics[j]), esc,
    picked: pickId, reduced: REDUCED.matches, label: t('netT'),
    onPick: (id, topic) => { history.replaceState(null, '', id ? '#/rede/' + id : '#/rede'); showNetInsp(id, topic); if (id && window.innerWidth < 1000) $('#insp').scrollIntoView({ behavior: REDUCED.matches ? 'auto' : 'smooth', block: 'start' }); }
  });
  $('#zIn').onclick = () => NET.zoomIn(); $('#zOut').onclick = () => NET.zoomOut(); $('#zFit').onclick = () => NET.reset(); });
  bindInspector();
}

/* ---------- about ---------- */
function viewAbout() {
  const src = UNIS.map(u => `<li><a href="${esc(u.src)}" target="_blank" rel="noopener">${esc(u.full)}</a></li>`).join('');
  const nT = COURSES.reduce((a, c) => a + c.topics.length, 0), nK = COURSES.reduce((a, c) => a + c.tasks.length, 0), nR = COURSES.reduce((a, c) => a + c.res.length, 0);
  const nL = Object.values(LESSONS).reduce((a, x) => a + Object.keys(x).length, 0);
  const body = L === 'pt' ? `<p class="lead">Este site organiza a Licenciatura em Educação Básica em ${COURSES.length} cadeiras, com ${nT} tópicos (${nL} já com lição escrita), ${nK} tarefas e ${nR} livros, cursos e recursos gratuitos.</p>
   <h2>${t('method')}</h2><ul>
   <li>Partimos dos planos de estudos oficiais da Licenciatura em Educação Básica da ESE de Lisboa, da ESE do Porto, da Universidade de Évora e do Politécnico de Leiria, e das Aprendizagens Essenciais e do Perfil dos Alunos da DGE.</li>
   <li>Juntámos as unidades curriculares equivalentes, e a lista de tópicos de cada uma reúne o que essas escolas ensinam. Os semestres seguem a ordem mais comum. A licenciatura não dá habilitação para ensinar: para isso é preciso um mestrado em ensino ou em educação pré-escolar.</li>
   <li>Na tabela “Nas escolas” só aparecem equivalências encontradas nos planos de estudos. Os planos mudam de ano para ano; confirma sempre no site da escola.</li>
   <li>Todos os recursos são gratuitos e publicados pelos autores ou pelas universidades.</li></ul>`
    : `<p class="lead">This site organises the Portuguese degree in Basic Education into ${COURSES.length} courses, with ${nT} topics (${nL} with a written lesson so far), ${nK} tasks and ${nR} free books, courses and resources.</p>
   <h2>${t('method')}</h2><ul>
   <li>It starts from the official Basic Education study plans of ESE Lisboa, ESE Porto, the University of Évora and the Polytechnic of Leiria, and from the national curriculum.</li>
   <li>Equivalent courses were merged, and each topic list brings together what those schools teach. The degree alone does not qualify you to teach: a master’s in teaching or pre-school education is required.</li>
   <li>The “At the schools” table only shows equivalences found in the study plans. Plans change over time; always check the school’s own site.</li>
   <li>All resources are free and published by their authors or universities.</li></ul>`;
  return `<div class="about"><h1>${t('aboutT')}</h1>${body}
  <h2>${t('sources')}</h2><ul>${src}</ul>
  <h2>${t('progress')}</h2><p>${t('progressP')}</p>
  <div class="btns"><button class="btn" id="bExp" type="button">${t('export')}</button><label class="btn">${t('import')}<input id="bImp" type="file" accept="application/json" hidden></label><button class="btn danger" id="bRst" type="button">${t('reset')}</button></div></div>`;
}
function bindAbout() {
  $('#bExp').onclick = () => { const blob = new Blob([JSON.stringify({ v: 1, progress: P }, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'progresso-educacao-basica.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); toast(t('exported')); };
  $('#bImp').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(s => { const d = JSON.parse(s); if (!d || typeof d.progress !== 'object') throw 0; const clean = {}; Object.entries(d.progress).forEach(([k, v]) => { if (BY[k] && v && Array.isArray(v.t) && Array.isArray(v.k)) clean[k] = { t: v.t.filter(Number.isInteger), k: v.k.filter(Number.isInteger) }; }); P = clean; saveP(); toast(t('imported')); }).catch(() => toast(t('bad'))); };
  $('#bRst').onclick = () => { if (confirm(t('resetQ'))) { P = {}; saveP(); render(); } };
}

/* ---------- router ---------- */
function chrome() {
  document.documentElement.lang = L;
  $('#brandName').textContent = t('brand');
  $('#navHome').textContent = t('home'); $('#navNet').textContent = t('net'); $('#navCat').textContent = t('cat'); $('#navAbout').textContent = t('about');
  const ns = nextStep(), cb = $('#contBtn'); cb.href = ns ? ns.href : '#/'; cb.textContent = totals()[0] === 0 ? t('start') : t('cont');
  $('#langBtn').textContent = L === 'pt' ? 'EN' : 'PT';
  $('#foot').innerHTML = `<p class="close">${esc(t('closeT'))}</p><p>${esc(t('foot'))}</p>`;
}
let NET = null;
const placaReady = fn => { if (window.Placa) fn(); else window.addEventListener('placa-ready', fn, { once: true }); };
function render() {
  if (NET) { NET.destroy(); NET = null; }
  chrome();
  const h = location.hash.replace(/^#\/?/, ''), app = $('#app'), seg = h.split('/');
  let nav = 'home', title = '';
  if (seg[0] === 'c' && seg[1]) { app.innerHTML = viewCourse(seg[1]); bindCourse(seg[1]); nav = ''; title = BY[seg[1]] ? nm(BY[seg[1]]) : ''; }
  else if (seg[0] === 'l' && seg[1]) { app.innerHTML = viewLesson(seg[1], +seg[2] || 1); bindLesson(); bindCourse(seg[1]); nav = ''; title = BY[seg[1]] && BY[seg[1]].topics[(+seg[2] || 1) - 1] ? half(BY[seg[1]].topics[(+seg[2] || 1) - 1]) : ''; }
  else if (seg[0] === 'rede' || seg[0] === 'network') { app.innerHTML = viewNet(seg[1]); bindNet(); nav = 'net'; title = t('netT'); }
  else if (seg[0] === 'cadeiras' || seg[0] === 'courses') { app.innerHTML = viewCatalog(); bindCatalog(); nav = 'cat'; title = t('catT2'); }
  else if (seg[0] === 'mapa' || seg[0] === 'map') { app.innerHTML = viewMap(seg[1]); bindMap(); nav = 'cat'; title = t('mapT'); }
  else if (seg[0] === 'sobre' || seg[0] === 'about') { app.innerHTML = viewAbout(); bindAbout(); nav = 'about'; title = t('aboutT'); }
  else { app.innerHTML = viewHome(); bindHome(); }
  document.title = (title ? title + ' — ' : '') + t('brand');
  document.body.dataset.page = nav || seg[0] || 'home';
  $$('.rise', app).forEach((el, i) => el.style.setProperty('--i', i));
  $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === nav));
}
let lastPage = null;
const page = () => { const b = location.hash.split('/').slice(0, 2).join('/'); return b === '#/mapa' || b === '#/rede' ? b : location.hash; };
function go(fn) { // route changes cross-fade with the View Transitions API when the browser has it
  if (!document.startViewTransition || REDUCED.matches) { fn(); return; }
  document.startViewTransition(fn);
}
window.addEventListener('hashchange', () => {
  const pg = page(), same = pg === lastPage;
  if (same && (pg === '#/mapa' || pg === '#/rede')) { const id = location.hash.split('/')[2]; if (BY[id]) { if (pg === '#/rede') { NET && NET.focus(id); showNetInsp(id); return; } const g = $(`#bigmap .chip[data-id="${id}"]`); if (g) { g.dispatchEvent(new Event('click')); return; } } }
  lastPage = pg;
  go(() => { render(); if (!same) window.scrollTo(0, 0); });
});
$('#langBtn').onclick = () => { L = L === 'pt' ? 'en' : 'pt'; store.set('eba.lang', L); go(render); };
lastPage = page(); render();
})();
