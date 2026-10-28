// Captura dos prints do portfólio /cases.
//   imgs/cases/<id>.webp       capa 800x500 (primeira dobra, viewport 1440x900)
//   imgs/cases/full/<id>.webp  página inteira 720px de largura (rola no hover)
// Uso: node capture.mjs [id ...]   (sem ids = todos de content/cases.json sem print de página inteira)
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const DATA = path.join(ROOT, 'content/cases.json');
const OUT = path.join(ROOT, 'imgs/cases');
const MAX_H = 6000; // px CSS; acima disso a página é cortada
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

export async function launch() {
  // Chrome real toca vídeo mp4 de fundo; Chromium headless não.
  try { return await chromium.launch({ channel: 'chrome' }); }
  catch { return chromium.launch(); }
}

export async function capture(browser, { id, url }) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-BR', userAgent: UA, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    try { await page.waitForLoadState('networkidle', { timeout: 12000 }); } catch {}
    await page.waitForTimeout(3500);
    const cover = await page.screenshot({ type: 'png' });
    await sharp(cover).resize(800).webp({ quality: 70 }).toFile(path.join(OUT, `${id}.webp`));

    // Desce a página aos poucos para disparar lazy-load e animações de entrada.
    await page.evaluate(async (max) => {
      const step = 600;
      for (let y = 0; y < Math.min(document.documentElement.scrollHeight, max); y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 180));
      }
      window.scrollTo(0, 0);
    }, MAX_H);
    await page.waitForTimeout(1500);
    const h = Math.min(await page.evaluate(() => document.documentElement.scrollHeight), MAX_H);
    const full = await page.screenshot({ type: 'png', fullPage: true, clip: { x: 0, y: 0, width: 1440, height: h } });
    const info = await sharp(full).resize(720).webp({ quality: 62 }).toFile(path.join(OUT, 'full', `${id}.webp`));
    return { ok: true, h: info.height };
  } catch (e) {
    return { ok: false, err: String(e.message).split('\n')[0].slice(0, 140) };
  } finally {
    await ctx.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fs.mkdirSync(path.join(OUT, 'full'), { recursive: true });
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const ids = process.argv.slice(2);
  const todo = data.filter((c) => (ids.length ? ids.includes(c.id) : !c.h));
  const browser = await launch();
  const queue = [...todo];
  await Promise.all(Array.from({ length: 5 }, async () => {
    while (queue.length) {
      const c = queue.shift();
      const r = await capture(browser, c);
      if (r.ok) c.h = r.h;
      console.log(c.id, r.ok ? `ok ${r.h}px` : r.err);
      fs.writeFileSync(DATA, JSON.stringify(data, null, 1));
    }
  }));
  await browser.close();
}
