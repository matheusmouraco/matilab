#!/usr/bin/env python3
"""Aplica o header (ilha de vidro), o menu mobile e o rodapé da home em todas as páginas.

Fonte da verdade: index.html (a home). Rode depois de mudar a home:
    python3 scripts/apply_chrome.py
Gera /home/chrome.css e /home/chrome.js e troca, em cada página, o <nav id="nav"> antigo,
o #mobile-menu e o <footer> pelo markup novo (classes com prefixo mx- para não colidir com o CSS antigo).
Rodar de novo é seguro: os blocos ficam entre marcadores <!--mx:...-->."""
import re, sys, hashlib
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
home = (REPO / 'index.html').read_text()

# ── markup da home
logo_defs = re.search(r'<svg width="0" height="0"[\s\S]*?</svg>', home).group(0)
header = re.search(r'<header class="nav"[\s\S]*?</header>', home).group(0)
menu = re.search(r'<div class="menu" id="menu"[\s\S]*?\n</div>', home).group(0)
footer = re.search(r'<footer[\s\S]*?</footer>', home).group(0)

SECTION_LINKS = {'#servicos': '/#servicos', '#portfolio': '/cases', '#sobre': '/sobre', '#faq': '/#faq'}

def prefix(markup):
    def cls(m):
        return 'class="' + ' '.join('mx-' + c for c in m.group(1).split()) + '"'
    markup = re.sub(r'class="([^"]+)"', cls, markup)
    markup = re.sub(r'<nav( [^>]*)?>', lambda m: '<div role="navigation"' + (m.group(1) or '') + '>', markup)
    markup = markup.replace('</nav>', '</div>')
    markup = re.sub(r' data-nav="[^"]*"', '', markup)
    markup = markup.replace('id="menu"', 'id="mx-menu"').replace('aria-controls="menu"', 'aria-controls="mx-menu"')
    for a, b in SECTION_LINKS.items():
        markup = markup.replace(f'href="{a}"', f'href="{b}"')
    return markup

HEADER = prefix(header).replace('<header class="mx-nav"', '<header class="mx-nav" id="nav"', 1)
MENU = prefix(menu)
FOOTER = prefix(footer)

BLOCK_TOP_NOID = f'<!--mx:top-->\n{logo_defs}\n{prefix(header)}\n{MENU}\n<!--/mx:top-->'
BLOCK_TOP = f'<!--mx:top-->\n{logo_defs}\n{HEADER}\n{MENU}\n<!--/mx:top-->'
BLOCK_FOOT = f'<!--mx:foot-->\n{FOOTER}\n<!--/mx:foot-->'
# ── CSS: regras de nav/menu/botões/rodapé da home, com prefixo mx-
css_src = (REPO / 'home' / 'home.css').read_text()
WANT = re.compile(r'(^|[\s,.>])(btn|bi|btn-lime|nav|nav-logo|nav-links|burger|menu|m-link|menu-close|footer|wrap|ft-[\w-]+|i)\b')
CLASSES = {'btn', 'bi', 'btn-lime', 'nav', 'on-light', 'on-lime', 'hide', 'nav-logo', 'nav-links', 'burger', 'menu', 'm-link', 'menu-close',
           'footer', 'wrap', 'i', 'ft-top', 'ft-brand', 'ft-social', 'ft-col', 'ft-seo', 'ft-places', 'ft-bot'}

def rewrite_sel(sel):
    sel = sel.replace('.menu-open ', '.mx-open ')
    sel = re.sub(r'(?<![\w.#-])nav(?![\w-])', '[role=navigation]', sel)
    return re.sub(r'\.([a-zA-Z][\w-]*)', lambda m: '.mx-' + m.group(1) if m.group(1) in CLASSES else m.group(0), sel)

def pick(block):
    out = []
    for sel, decl in re.findall(r'([^{}]+)\{([^{}]*)\}', block):
        s = sel.strip()
        if s.startswith('@') or not WANT.search(s) or s.startswith('.wall') or '.hero' in s:
            continue
        if any(x in s for x in ('.btn-ghost', '.btn-ink', '.svc', '.case', '.cell', '.quote', '.member', '.faq', '.cta', '.manifesto', '.logos', '.marquee', '.bento', '.pillar')):
            continue
        out.append(rewrite_sel(s) + '{' + decl.strip() + '}')
    return out

top = re.split(r'@media', css_src)[0]
rules = pick(top)
medias = []
for m in re.finditer(r'@media([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\s*\}', css_src):
    r = pick(m.group(2))
    if r:
        medias.append('@media' + m.group(1).rstrip() + '{\n  ' + '\n  '.join(r) + '\n}')

fonts = '\n'.join(re.findall(r'@font-face\{[^}]*\}', css_src))
tokens = re.search(r':root\{([^}]*)\}', css_src).group(1)
SCOPE = '.mx-nav,.mx-menu,.mx-footer'
chrome_css = f"""/* Header, menu e rodapé da home aplicados no site todo. Gerado por scripts/apply_chrome.py, não editar à mão. */
{fonts}
{SCOPE}{{{tokens.strip()}
  font-family:"Host Grotesk",system-ui,-apple-system,"Segoe UI",sans-serif;font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-feature-settings:"ss01","cv11";letter-spacing:normal;text-align:left}}
  :where(.mx-nav,.mx-menu,.mx-footer) *{{box-sizing:border-box}}
:where(.mx-nav,.mx-menu,.mx-footer) a{{color:inherit;text-decoration:none;font-family:inherit}}
:where(.mx-nav,.mx-menu) button{{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;margin:0}}
:where(.mx-footer) :is(h3,p,address){{margin:0}}
:where(.mx-footer) img{{display:block;max-width:100%;height:auto}}
.mx-nav svg.mx-i,.mx-menu svg.mx-i,.mx-footer svg.mx-i{{width:1.15em;height:1.15em;flex:none;display:inline-block;vertical-align:-.2em}}
footer.mx-footer{{background:var(--ink);color:var(--t-light);border-top:1px solid var(--line-d);margin:0;position:relative;z-index:1}}
html.mx-open{{overflow:hidden}}
.mx-nav.mx-nav{{z-index:10000}}.mx-menu.mx-menu{{z-index:10001}}
{chr(10).join(rules)}
{chr(10).join(medias)}
@media (prefers-reduced-transparency:reduce){{.mx-nav{{background:var(--ink-2);backdrop-filter:none}}.mx-menu{{background:var(--ink);backdrop-filter:none}}}}
@media (prefers-reduced-motion:reduce){{.mx-nav,.mx-menu,.mx-menu a,.mx-burger span{{transition:none!important}}}}
"""
(REPO / 'home' / 'chrome.css').write_text(chrome_css)

chrome_js = """/* Menu mobile e nav que some ao descer. Gerado por scripts/apply_chrome.py. */
(function () {
  var doc = document.documentElement, nav = document.querySelector('.mx-nav'), menu = document.getElementById('mx-menu');
  if (!nav || !menu) return;
  var burger = nav.querySelector('.mx-burger');
  function set(open) {
    doc.classList.toggle('mx-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) menu.querySelector('a').focus({ preventScroll: true });
  }
  burger.addEventListener('click', function () { set(!doc.classList.contains('mx-open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a') || e.target.closest('.mx-menu-close')) set(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && doc.classList.contains('mx-open')) { set(false); burger.focus(); } });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var last = scrollY, ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = scrollY;
      if (!doc.classList.contains('mx-open')) nav.classList.toggle('mx-hide', y > last && y > 400);
      last = y; ticking = false;
    });
  }, { passive: true });
})();
"""
(REPO / 'home' / 'chrome.js').write_text(chrome_js)

V = hashlib.md5((chrome_css + chrome_js).encode()).hexdigest()[:10]
HEAD_TAGS = (f'<!--mx:head--><link rel="preload" href="/fonts/host-grotesk-500.woff2" as="font" type="font/woff2" crossorigin>'
             f'<link rel="stylesheet" href="/home/chrome.css?v={V}"><script defer src="/home/chrome.js?v={V}"></script><!--/mx:head-->')

# ── aplicar nas páginas
SKIP = {'index.html', 'home-v2.html', 'links.html'}
done, skipped = [], []
for f in sorted(REPO.glob('*.html')):
    if f.name in SKIP:
        continue
    s = f.read_text()
    orig = s
    # cabeçalho
    if '<!--mx:top-->' in s:
        blk = BLOCK_TOP if "getElementById('nav').classList" in s else BLOCK_TOP_NOID
        s = re.sub(r'<!--mx:top-->[\s\S]*?<!--/mx:top-->', lambda m: blk, s)
    elif re.search(r'<nav id="nav">', s):
        s = re.sub(r'<nav id="nav">[\s\S]*?</nav>', lambda m: BLOCK_TOP, s, count=1)
        s = re.sub(r'<div id="mobile-menu"[\s\S]*?</div>\s*</div>\n?', '', s, count=1)
    elif '<nav class="cs-nav">' in s:
        s = re.sub(r'<nav class="cs-nav">[\s\S]*?</nav>', lambda m: BLOCK_TOP_NOID, s, count=1)
        s = re.sub(r'<footer class="cs-foot">', '<footer>', s, count=1)
    elif '<header class="nav on-dark" id="nav"' in s:
        s = re.sub(r'<header class="nav on-dark" id="nav"[\s\S]*?</header>', lambda m: BLOCK_TOP_NOID, s, count=1)
    elif f.name == '404.html':
        s = s.replace('<body>', '<body>\n' + BLOCK_TOP_NOID, 1)
    else:
        skipped.append(f.name); continue
    # rodapé
    if '<!--mx:foot-->' in s:
        s = re.sub(r'<!--mx:foot-->[\s\S]*?<!--/mx:foot-->', lambda m: BLOCK_FOOT, s)
    else:
        s, n = re.subn(r'<footer[^>]*>[\s\S]*?</footer>', lambda m: BLOCK_FOOT, s, count=1)
        if not n:
            s = s.replace('</body>', BLOCK_FOOT + '\n</body>', 1)
    # head
    if '<!--mx:head-->' in s:
        s = re.sub(r'<!--mx:head-->[\s\S]*?<!--/mx:head-->', lambda m: HEAD_TAGS, s)
    else:
        s = s.replace('</head>', HEAD_TAGS + '\n</head>', 1)
    if s != orig:
        f.write_text(s); done.append(f.name)
print(f'chrome aplicado em {len(done)} páginas; puladas ({len(skipped)}): {", ".join(skipped)}')
