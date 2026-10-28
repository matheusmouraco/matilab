// Adiciona um site ao portfólio /cases: confere duplicado, confere se está no ar, captura os prints,
// grava em content/cases.json e regera cases.html.
// Uso: node add.mjs <url> --nome "Nome do cliente" --setor "Saúde e Clínicas" [--tipo "Landing page"]
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { ROOT, DATA, launch, capture } from './capture.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(`--${k}`); return i > -1 ? args[i + 1] : undefined; };
const url = args.find((a) => /^https?:\/\//.test(a)) || (args[0] && !args[0].startsWith('--') ? `https://${args[0]}` : null);
if (!url) { console.error('uso: node add.mjs <url> --nome "..." --setor "..." [--tipo "..."]'); process.exit(1); }

const key = (u) => { const p = new URL(u); return (p.host.replace(/^www\./, '') + p.pathname.replace(/\/(home)?\/?$/, '')).toLowerCase(); };
const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));

let final = url, status = 0;
try {
  const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30000), headers: { 'user-agent': 'Mozilla/5.0 Chrome/130' } });
  status = r.status; final = r.url;
} catch (e) { console.log(`FORA_DO_AR ${url} (${e.cause?.code || e.name})`); process.exit(2); }

const dup = data.find((c) => [key(url), key(final)].includes(key(c.url)));
if (dup) { console.log(`JA_EXISTE ${dup.id} (${dup.nome}, ${dup.setor})`); process.exit(0); }
if (status !== 200) { console.log(`FORA_DO_AR ${url} (HTTP ${status})`); process.exit(2); }

const nome = opt('nome'), setor = opt('setor'), tipo = opt('tipo') || 'Site';
if (!nome || !setor) { console.error('faltou --nome ou --setor'); process.exit(1); }

const p = new URL(url);
const id = p.host.replace(/^www\./, '').replace(/\./g, '-') + (p.pathname.length > 1 ? '-' + p.pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 30) : '');
const entry = { id, nome, setor, tipo, url };

const browser = await launch();
const r = await capture(browser, entry);
await browser.close();
if (!r.ok) { console.log(`ERRO_CAPTURA ${r.err}`); process.exit(3); }
entry.h = r.h;

data.push(entry);
fs.writeFileSync(DATA, JSON.stringify(data, null, 1));
execFileSync('python3', ['scripts/build_cases.py'], { cwd: ROOT, stdio: 'inherit' });
console.log(`ADICIONADO ${id} em "${setor}"`);
