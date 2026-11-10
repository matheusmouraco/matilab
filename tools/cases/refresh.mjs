// Atualização periódica do /cases (roda a cada 15 dias no GitHub Actions e pode rodar à mão).
// Para cada case: abre o site, tira os prints de novo e só troca a imagem se o site mudou de verdade
// (assim o repositório não incha). Sites que não abrem entram no relatório de fora do ar.
// Uso: node refresh.mjs [id ...]   (sem ids = todos)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { ROOT, DATA, OUT, launch, capture } from './capture.mjs';

const LIMIAR = 4; // diferença média (0-255) na capa reduzida a partir da qual a imagem é trocada
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cases-'));
fs.mkdirSync(path.join(tmp, 'full'));

async function assinatura(file) {
  return sharp(file).resize(40, 25, { fit: 'fill' }).grayscale().raw().toBuffer();
}
async function mudou(id) {
  const velho = path.join(OUT, `${id}.webp`);
  if (!fs.existsSync(velho)) return true;
  const [a, b] = await Promise.all([assinatura(velho), assinatura(path.join(tmp, `${id}.webp`))]);
  let soma = 0;
  for (let i = 0; i < a.length; i++) soma += Math.abs(a[i] - b[i]);
  return soma / a.length > LIMIAR;
}

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const ids = process.argv.slice(2);
const fila = data.filter((c) => !ids.length || ids.includes(c.id));
const fora = [], trocados = [];
const browser = await launch();
await Promise.all(Array.from({ length: 4 }, async () => {
  while (fila.length) {
    const c = fila.shift();
    let r = await capture(browser, c, tmp);
    if (!r.ok) { await new Promise((ok) => setTimeout(ok, 8000)); r = await capture(browser, c, tmp); }
    if (!r.ok) { fora.push({ nome: c.nome, url: c.url, err: r.err }); console.log('FORA', c.id, r.err); continue; }
    if (await mudou(c.id)) {
      fs.copyFileSync(path.join(tmp, `${c.id}.webp`), path.join(OUT, `${c.id}.webp`));
      fs.copyFileSync(path.join(tmp, 'full', `${c.id}.webp`), path.join(OUT, 'full', `${c.id}.webp`));
      c.h = r.h;
      trocados.push(c.id);
      console.log('NOVO', c.id);
    } else console.log('igual', c.id);
  }
}));
await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });

fs.writeFileSync(DATA, JSON.stringify(data, null, 1));
execFileSync('python3', ['scripts/build_cases.py'], { cwd: ROOT, stdio: 'inherit' });
console.log(`\n${data.length} cases | ${trocados.length} prints novos | ${fora.length} fora do ar`);

// Saída para o e-mail do GitHub Actions
if (process.env.GITHUB_OUTPUT) {
  const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const linhas = fora.map((f) => `<li><b>${e(f.nome)}</b>: <a href="${e(f.url)}">${e(f.url)}</a><br><small>${e(f.err)}</small></li>`).join('');
  const body = `<p>Na checagem de hoje do portfólio matilab.com.br/cases, ${fora.length} ${fora.length === 1 ? 'site não abriu' : 'sites não abriram'} (testado duas vezes):</p><ul>${linhas}</ul><p>Eles continuam no /cases com o print antigo. Se estiverem fora do ar de vez, peça para tirar.</p><p>${trocados.length} prints foram atualizados nesta rodada.</p>`;
  const sub = `Cases Matilab: ${fora.length} ${fora.length === 1 ? 'site fora do ar' : 'sites fora do ar'}`;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_down=${fora.length > 0}\nsubject=${sub}\nbody<<FIM_EMAIL\n${body}\nFIM_EMAIL\n`);
}
