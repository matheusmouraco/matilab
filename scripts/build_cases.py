#!/usr/bin/env python3
"""Gera /cases.html (portfólio por setor) a partir de content/cases.json.

Reaproveita nav, footer e scripts de sobre.html para manter o site consistente.
Screenshots ficam em imgs/cases/<id>.webp (800px de largura).

Uso: python3 scripts/build_cases.py
"""
import html
import json
import re
import unicodedata
from collections import OrderedDict
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://www.matilab.com.br"

# Ordem de exibição dos setores; setores fora da lista entram no fim, por tamanho.
ORDEM = [
    "Arquitetura e Interiores",
    "Construção, Pisos e Manutenção",
    "Saúde e Clínicas",
    "Agências e Marketing",
    "Igrejas e Projetos Sociais",
    "Finanças e Contabilidade",
    "Advocacia",
    "Automotivo e Transportes",
    "Política e Gestão Pública",
    "Educação e Cursos",
    "Logística e Comércio Exterior",
    "Ambiental e Sustentabilidade",
]


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def dominio(url):
    p = urlparse(url)
    host = p.netloc.removeprefix("www.")
    path = p.path.rstrip("/")
    return host + (path if path and path not in ("/home",) else "")


def card(c):
    e = html.escape
    return f"""      <a class="cs-card" href="{e(c['url'])}" target="_blank" rel="noopener" data-q="{e((c['nome'] + ' ' + dominio(c['url'])).lower())}">
        <div class="cs-shot">
          <div class="cs-bar"><i></i><i></i><i></i><span>{e(dominio(c['url']))}</span></div>
          <img src="/imgs/cases/{e(c['id'])}.webp" alt="Site {e(c['nome'])} criado pela Matilab" width="800" height="500" loading="lazy" decoding="async">
        </div>
        <div class="cs-meta">
          <div><h3>{e(c['nome'])}</h3><span class="cs-type">{e(c['tipo'])}</span></div>
          <span class="cs-go" aria-hidden="true">↗</span>
        </div>
      </a>"""


def main():
    cases = json.loads((ROOT / "content/cases.json").read_text())
    grupos = OrderedDict()
    for c in cases:
        grupos.setdefault(c["setor"], []).append(c)
    setores = sorted(
        grupos,
        key=lambda s: (ORDEM.index(s) if s in ORDEM else len(ORDEM), -len(grupos[s]), s),
    )

    chips = "\n".join(
        f'    <button class="cs-chip" data-f="{slug(s)}">{html.escape(s)} <b>{len(grupos[s])}</b></button>'
        for s in setores
    )
    secoes = "\n".join(
        f"""  <section class="cs-sec" id="{slug(s)}" data-s="{slug(s)}">
    <header class="cs-sh"><h2>{html.escape(s)}</h2><span>{len(grupos[s]):02d} {'projeto' if len(grupos[s]) == 1 else 'projetos'}</span></header>
    <div class="cs-grid">
{chr(10).join(card(c) for c in grupos[s])}
    </div>
  </section>"""
        for s in setores
    )

    total, n_setores = len(cases), len(setores)
    desc = (f"Portfólio da Matilab: {total} sites, landing pages e plataformas no ar, "
            f"organizados por setor. Arquitetura, saúde, construção, advocacia, igrejas e mais.")

    itemlist = {
        "@type": "ItemList",
        "name": "Portfólio Matilab",
        "numberOfItems": total,
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": c["nome"], "url": c["url"]}
            for i, c in enumerate(cases)
        ],
    }
    schema = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Início", "item": BASE + "/"},
                {"@type": "ListItem", "position": 2, "name": "Cases", "item": BASE + "/cases"},
            ]},
            {"@type": "CollectionPage", "url": BASE + "/cases", "name": "Cases e portfólio Matilab",
             "description": desc, "mainEntity": itemlist},
        ],
    }

    sobre = (ROOT / "sobre.html").read_text()
    gtag = sobre[: sobre.index("<meta charset")]
    head_tail = sobre[sobre.index('<link rel="icon"'): sobre.index('<link rel="stylesheet" href="/shared.css">')]
    nav = sobre[sobre.index("<body>"): sobre.index("</nav>") + len("</nav>")]
    tail = sobre[sobre.index('<a id="wa"'):]

    page = f"""{gtag}<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cases e Portfólio | {total} sites criados pela Matilab</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{BASE}/cases">
<meta property="og:title" content="Cases Matilab · {total} sites no ar, por setor">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{BASE}/cases">
<meta property="og:image" content="{BASE}/imgs/cases/{cases[0]['id']}.webp">
<meta name="robots" content="index,follow">
{head_tail}<link rel="stylesheet" href="/shared.css">
<link rel="stylesheet" href="/cases.css">
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
</head>
{nav}

<header class="page-hero cs-hero">
  <div class="page-hero-in">
    <span class="eyebrow">Portfólio · Cases</span>
    <h1>Sites que a gente colocou no ar</h1>
    <p class="lede">{total} projetos ativos, de escritórios de arquitetura a clínicas, indústrias e igrejas. Organizados por setor. Clique em qualquer um para visitar o site ao vivo.</p>
    <div class="stats-row">
      <div class="stat"><div class="stat-n">{total}</div><div class="stat-l">Sites no ar</div></div>
      <div class="stat"><div class="stat-n">{n_setores}</div><div class="stat-l">Setores</div></div>
      <div class="stat"><div class="stat-n">{len(grupos.get('Arquitetura e Interiores', []))}</div><div class="stat-l">Só de arquitetura</div></div>
    </div>
  </div>
</header>

<div class="cs-bar-wrap">
  <div class="cs-filter" role="toolbar" aria-label="Filtrar por setor">
    <label class="cs-search"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" placeholder="Buscar cliente" aria-label="Buscar cliente"></label>
    <button class="cs-chip on" data-f="">Todos <b>{total}</b></button>
{chips}
  </div>
</div>

<main class="cs-main">
{secoes}
  <p class="cs-empty" hidden>Nenhum projeto encontrado.</p>
</main>

<section class="cs-cta">
  <h2>O próximo case pode ser o seu.</h2>
  <p>Site sob medida, rápido e pronto para aparecer no Google e nas IAs.</p>
  <a href="https://api.whatsapp.com/send/?phone=5511992644010&text=Ol%C3%A1%2C%20vi%20os%20cases%20da%20Matilab%20e%20quero%20um%20site" target="_blank" rel="noopener" class="btn-primary">Quero um site assim →</a>
</section>

<script src="/cases.js" defer></script>
{tail}"""
    (ROOT / "cases.html").write_text(page)
    print(f"cases.html: {total} cases em {n_setores} setores")


if __name__ == "__main__":
    main()
