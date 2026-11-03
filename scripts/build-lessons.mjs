// Junta as lições escritas em conteudo/<cadeira>/<n>.md (e <n>.en.md, se existir) em js/lessons.js.
// Correr depois de editar lições:  node scripts/build-lessons.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
const root = 'conteudo', out = {};
for (const course of readdirSync(root, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)) {
  for (const f of readdirSync(`${root}/${course}`)) {
    const m = /^(\d+)(\.en)?\.md$/.exec(f); if (!m) continue;
    const idx = +m[1] - 1, lang = m[2] ? 'en' : 'pt';
    ((out[course] ||= {})[idx] ||= {})[lang] = readFileSync(`${root}/${course}/${f}`, 'utf8');
  }
}
writeFileSync('js/lessons.js', '/* Gerado por scripts/build-lessons.mjs — não editar à mão. */\nwindow.LESSONS = ' + JSON.stringify(out) + ';\n');
const n = Object.values(out).reduce((a, c) => a + Object.keys(c).length, 0);
console.log(`js/lessons.js: ${n} lições em ${Object.keys(out).length} cadeiras`);
