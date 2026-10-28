#!/usr/bin/env python3
"""Gera /cases.html (portfólio por setor) a partir de content/cases.json.

Página clara própria (cases.css + cases.js), independente do tema escuro do resto do site.
Prints: imgs/cases/<id>.webp (capa) e imgs/cases/full/<id>.webp (página inteira, rola no hover).
Para adicionar um site: node tools/cases/add.mjs <url> --nome "..." --setor "..." [--tipo "..."]

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
WHATS = "https://api.whatsapp.com/send/?phone=5511992644010&text=Ol%C3%A1%2C%20vi%20os%20cases%20da%20Matilab%20e%20quero%20um%20site"
HERO_IDS = ["santoroarquitetura-com-br", "medrec-com-br", "vdarquitetura-com"]
OG_IMG = BASE + "/imgs/cases/og.jpg"  # 1200x630, colagem de capas (gerada uma vez)

# Setor do portfólio -> página de serviço do segmento (link interno para SEO).
SERVICO = {
    "Arquitetura e Interiores": ("site-para-escritorio-de-arquitetura", "Site para arquitetura"),
    "Construção, Pisos e Manutenção": ("site-para-construtora", "Site para construtora"),
    "Saúde e Clínicas": ("site-para-clinica", "Site para clínica"),
    "Igrejas e Projetos Sociais": ("site-para-igreja", "Site para igreja"),
    "Finanças e Contabilidade": ("site-para-contabilidade", "Site para contabilidade"),
    "Advocacia": ("site-para-advogado", "Site para advogado"),
    "Automotivo e Transportes": ("site-para-oficina-mecanica", "Site para oficina"),
    "Educação e Cursos": ("site-para-escola", "Site para escola"),
    "Logística e Comércio Exterior": ("site-para-transportadora", "Site para transportadora"),
    "Alimentação e Bebidas": ("site-para-restaurante", "Site para restaurante"),
    "Indústria e Têxtil": ("site-para-industria", "Site para indústria"),
    "Tecnologia": ("site-para-saas", "Site para SaaS"),
    "Viagem e Turismo": ("site-para-agencia-de-viagens", "Site para agência de viagens"),
    "Psicologia e Terapia": ("site-para-psicologo", "Site para psicólogo"),
    "Hotelaria": ("site-para-hotel-pousada", "Site para hotel e pousada"),
    "Casamentos e Eventos": ("site-para-buffet-eventos", "Site para eventos"),
    "Varejo e E-commerce": ("ecommerce-profissional", "E-commerce profissional"),
}

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

e = html.escape


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def dominio(url):
    p = urlparse(url)
    path = p.path.rstrip("/")
    return p.netloc.removeprefix("www.") + (path if path and path != "/home" else "")


def card(c, i):
    full = f' data-full="/imgs/cases/full/{e(c["id"])}.webp" data-h="{c["h"]}"' if c.get("h", 0) > 560 else ""
    return f"""      <a class="cs-card" href="{e(c['url'])}" target="_blank" rel="noopener" style="--i:{i % 3}" data-q="{e((c['nome'] + ' ' + dominio(c['url'])).lower())}">
        <div class="cs-frame"{full}>
          <img src="/imgs/cases/{e(c['id'])}.webp" alt="Site {e(c['nome'])}, criado pela Matilab" width="800" height="500" loading="lazy" decoding="async">
        </div>
        <div class="cs-meta">
          <div class="cs-txt"><h3>{e(c['nome'])}</h3><p>{e(dominio(c['url']))}<span>{e(c['tipo'])}</span></p></div>
          <span class="cs-go" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M8 7h9v9"/></svg></span>
        </div>
      </a>"""


def svc(setor):
    if setor not in SERVICO:
        return ""
    href, txt = SERVICO[setor]
    return f'<a class="cs-svc" href="/{href}">{e(txt)}</a>'


def main():
    cases = json.loads((ROOT / "content/cases.json").read_text())
    by_id = {c["id"]: c for c in cases}
    grupos = OrderedDict()
    for c in cases:
        grupos.setdefault(c["setor"], []).append(c)
    setores = sorted(grupos, key=lambda s: (ORDEM.index(s) if s in ORDEM else len(ORDEM), -len(grupos[s]), s))
    total, n_set = len(cases), len(setores)

    chips = "\n".join(
        f'      <button class="cs-chip" data-f="{slug(s)}">{e(s)}<b>{len(grupos[s])}</b></button>' for s in setores
    )
    secoes = "\n".join(
        f"""  <section class="cs-sec" id="{slug(s)}" data-s="{slug(s)}">
    <header class="cs-sh"><h2>{e(s)}</h2><span>{len(grupos[s])} {'projeto' if len(grupos[s]) == 1 else 'projetos'}</span>{svc(s)}</header>
    <div class="cs-grid">
{chr(10).join(card(c, i) for i, c in enumerate(grupos[s]))}
    </div>
  </section>"""
        for s in setores
    )
    hero_cols = "\n".join(
        f'      <div class="hv-col"><img src="/imgs/cases/full/{h}.webp" alt="" width="720" height="{by_id[h]["h"]}" fetchpriority="{"high" if n == 0 else "low"}"></div>'
        for n, h in enumerate(HERO_IDS) if by_id.get(h, {}).get("h")
    )

    desc = (f"Portfólio da Matilab: {total} sites, landing pages e plataformas no ar, organizados em "
            f"{n_set} setores. Arquitetura, saúde, construção, advocacia, igrejas e mais.")
    schema = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Início", "item": BASE + "/"},
                {"@type": "ListItem", "position": 2, "name": "Cases", "item": BASE + "/cases"},
            ]},
            {"@type": "CollectionPage", "url": BASE + "/cases", "name": "Cases e portfólio Matilab", "description": desc,
             "mainEntity": {"@type": "ItemList", "numberOfItems": total, "itemListElement": [
                 {"@type": "ListItem", "position": i + 1, "name": c["nome"], "url": c["url"]} for i, c in enumerate(cases)]}},
        ],
    }

    sobre = (ROOT / "sobre.html").read_text()
    gtag = sobre[: sobre.index("<meta charset")]
    logo = re.search(r"<svg height=\"18\".*?</svg>", sobre, re.S).group(0).replace('fill="white"', 'fill="currentColor"')

    page = f"""{gtag}<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cases e Portfólio | {total} sites criados pela Matilab</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{BASE}/cases">
<meta name="author" content="Matilab Creative House">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Matilab">
<meta property="og:title" content="Cases Matilab: {total} sites no ar, por setor">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{BASE}/cases">
<meta property="og:image" content="{OG_IMG}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Prints de sites criados pela Matilab">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Cases Matilab: {total} sites no ar, por setor">
<meta name="twitter:description" content="{e(desc)}">
<meta name="twitter:image" content="{OG_IMG}">
<meta name="theme-color" content="#F1F2EF">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/cases.css">
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
</head>
<body class="cs">

<nav class="cs-nav">
  <a href="/" class="cs-logo" aria-label="Matilab, página inicial">{logo}</a>
  <div class="cs-links">
    <a href="/">Início</a>
    <a href="/cases" aria-current="page">Cases</a>
    <a href="/sobre">Sobre</a>
    <a href="{WHATS}" target="_blank" rel="noopener" class="cs-btn">Fale conosco</a>
  </div>
</nav>

<header class="cs-hero">
  <div class="cs-hero-txt">
    <h1><strong>{total} sites</strong> no ar, feitos pela Matilab.</h1>
    <p>De escritórios de arquitetura a clínicas, indústrias e igrejas, em {n_set} setores. <span class="hov">Passe o mouse para percorrer cada site.</span><span class="tap">Role a lista e veja cada site se mover.</span></p>
    <a href="#lista" class="cs-btn cs-btn-lg">Ver os cases</a>
  </div>
  <div class="cs-hero-vis" aria-hidden="true">
{hero_cols}
  </div>
</header>

<div class="cs-bar" id="lista">
  <div class="cs-filter" role="toolbar" aria-label="Filtrar por setor">
    <label class="cs-search"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" placeholder="Buscar cliente" aria-label="Buscar cliente"></label>
    <div class="cs-chips">
      <button class="cs-chip on" data-f="">Todos<b>{total}</b></button>
{chips}
    </div>
  </div>
</div>

<main class="cs-main">
{secoes}
  <div class="cs-empty" hidden><p>Nenhum cliente com esse nome.</p><button type="button" class="cs-clear">Limpar busca</button></div>
</main>

<section class="cs-cta">
  <h2>O próximo case pode ser o seu.</h2>
  <p>Site sob medida, rápido e pronto para aparecer no Google e nas IAs.</p>
  <a href="{WHATS}" target="_blank" rel="noopener" class="cs-btn cs-btn-lg">Fale conosco</a>
</section>

<footer class="cs-foot">
  <a href="/" class="cs-logo" aria-label="Matilab">{logo}</a>
  <p>Vila Olímpia, São Paulo · <a href="mailto:contato@matilab.com.br">contato@matilab.com.br</a></p>
  <p>&copy; Matilab Creative House</p>
</footer>

<script src="/cases.js" defer></script>
</body>
</html>
"""
    (ROOT / "cases.html").write_text(page)
    print(f"cases.html: {total} cases em {n_set} setores")


if __name__ == "__main__":
    main()
