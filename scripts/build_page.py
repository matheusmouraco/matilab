#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Renderizador de paginas da Matilab (guias/agencia) no template padrao do site.
Reaproveita nav/rodape/scripts byte-a-byte de uma pagina existente."""
import re, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # raiz do repo
TEMPLATE = os.path.join(ROOT, "quanto-custa-criar-um-site.html")

FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 280'%3E"
"%3Crect width='280' height='280' rx='56' fill='%230A0A0A'/%3E"
"%3Cpath fill='%23B5FB67' d='M54 56c-2 1-4 4-4 6v23c0 3 0 7-2 9-3 3-6 3-9 3l-31-1c-4 0-8-5-8-9V58c0-3 2-7 2-9 2 0 5-2 6-2h27c5 0 10-4 10-9l1-28c0-2 4-7 7-7L222 2c7 0 11 5 12 12v25c0 3 5 8 8 8l29 1c3 0 7 4 7 7v73c0 6-9 7-13 7l-96 10c-5 1-12 1-13-6-1-5 0-13-1-19-1-7 2-11 9-13l58-12c3-1 7-4 7-7V60c0-2-4-7-7-7H59c-3 0-4 1-5 3Z'/%3E"
"%3Cpath fill='%23B5FB67' d='M275 171l3 6v35c0 5-8 7-12 7l-25 1c-5 0-8 6-8 11v25l-2 5c-3 1-6 3-9 3H55c-3 0-9-3-9-6l-1-27c0-4-3-10-8-11l-29-1c-4 0-8-6-8-10v-65c0-3 2-6 2-8 4-2 7-3 11-4l101-10c5-1 11 2 11 8v21c0 5-5 7-9 8l-54 11c-7 1-12 4-12 12 0 7 0 15 0 23 0 3 4 9 8 9h164c3 0 7-4 7-7l1-29c0-5 7-8 12-8l28 1 7 2Z'/%3E%3C/svg%3E")

WA = "https://api.whatsapp.com/send/?phone=5511992644010&text=Ol%C3%A1%2C%20quero%20um%20or%C3%A7amento"

def _boiler():
    src = open(TEMPLATE, encoding="utf-8").read()
    nav = src[src.index('<nav id="nav">'):src.index('</nav>')+len('</nav>')]
    bottom = src[src.index('<a id="wa"'):]
    top = '<div id="cur"></div>\n<div id="ring"></div>\n\n' + nav + '\n'
    return top, bottom

def esc(t):
    return t.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

def _head(t):
    faq_ld = {"@type":"FAQPage","mainEntity":[
        {"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in t.get("faq",[])]}
    bc = {"@type":"BreadcrumbList","itemListElement":[
        {"@type":"ListItem","position":1,"name":"Matilab","item":"https://matilab.com.br/"},
        {"@type":"ListItem","position":2,"name":"Guias","item":"https://matilab.com.br/guias"},
        {"@type":"ListItem","position":3,"name":t.get("bc",t["h1"]),"item":f"https://matilab.com.br/{t['slug']}"}]}
    graph=[bc]
    if t.get("svc"):
        graph.append({"@type":"Service","serviceType":t["svc"],
            "provider":{"@type":"Organization","name":"Matilab","url":"https://matilab.com.br/"},
            "areaServed":{"@type":"Country","name":"Brasil"},"description":t["desc"]})
    if faq_ld["mainEntity"]:
        graph.append(faq_ld)
    ld = json.dumps({"@context":"https://schema.org","@graph":graph}, ensure_ascii=False)
    ogimg = t.get("ogimg","imgs/full_00.webp")
    return f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-19M8EDN553"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());

  gtag('config', 'G-19M8EDN553');
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{t["title"]}</title>
<meta name="description" content="{esc(t["desc"])}">
<link rel="canonical" href="https://matilab.com.br/{t["slug"]}">
<meta property="og:title" content="{esc(t.get("ogtitle",t["title"]))}">
<meta property="og:description" content="{esc(t["desc"])}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://matilab.com.br/{t["slug"]}">
<meta property="og:image" content="https://matilab.com.br/{ogimg}">
<meta name="robots" content="index,follow">
<link rel="icon" type="image/svg+xml" href="{FAVICON}">
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=optional" onload="this.onload=null;this.rel='stylesheet'"><noscript><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=optional" rel="stylesheet"></noscript>
<link rel="stylesheet" href="/shared.css">
<script type="application/ld+json">
{ld}
</script>
</head>
<body>
'''

def _hero(t):
    return f'''<header class="page-hero">
  <div class="page-hero-in">
    <span class="eyebrow">{t.get("eyebrow","Guia · Matilab")}</span>
    <h1>{t["h1"]}</h1>
    <p class="lede">{t["lede"]}</p>
    <div class="hero-ctas">
      <a href="{WA}" target="_blank" class="btn-primary">Falar com a Matilab →</a>
      <a href="/#portfolio" class="btn-ghost">Ver projetos</a>
    </div>
  </div>
</header>
'''

def _sections(t):
    html = ""
    alt = False
    def klass():
        nonlocal alt; alt = not alt; return "page-section alt" if alt else "page-section"
    # intro
    if t.get("intro"):
        html += f'''<section class="{klass()}" data-rv>
  <div class="container"><h2>{t["intro"]["h2"]}</h2><p>{t["intro"]["p"]}</p></div>
</section>
'''
    # descritor extraivel (GEO)
    if t.get("oneliner"):
        html += f'''<section class="{klass()}" data-rv>
  <div class="container"><div class="card"><h3>Matilab, em uma linha</h3><p>{t["oneliner"]}</p></div></div>
</section>
'''
    # grid de pontos
    if t.get("points"):
        cards = "".join(f'<div class="card"><h3>{p["h3"]}</h3><p>{p["p"]}</p></div>' for p in t["points"])
        html += f'''<section class="{klass()}" data-rv>
  <div class="container"><h2>{t.get("points_h2","Pontos-chave")}</h2><div class="grid-2">{cards}</div></div>
</section>
'''
    # checklist
    if t.get("checklist"):
        lis = "".join(f'<li>{c}</li>' for c in t["checklist"])
        html += f'''<section class="{klass()}" data-rv>
  <div class="container"><h2>{t.get("checklist_h2","O que observar")}</h2><ul class="check-list">{lis}</ul></div>
</section>
'''
    # fechamento + link interno
    if t.get("close"):
        rel = t.get("related")
        relbtn = f'<a href="/{rel[0]}" class="btn-ghost">{rel[1]}</a>' if rel else ''
        html += f'''<section class="{klass()}" data-rv>
  <div class="container"><h2>{t["close"]["h2"]}</h2><p>{t["close"]["p"]}</p>
    <div class="hero-ctas" style="margin-top:28px"><a href="{WA}" target="_blank" class="btn-primary">Falar com a Matilab →</a>{relbtn}</div>
  </div>
</section>
'''
    # secoes cruas (opcional)
    for raw in t.get("raw_sections", []):
        html += raw + "\n"
    return html

def _faq(t):
    if not t.get("faq"): return ""
    items = "\n".join(f'''      <div class="faq-item">
        <button class="faq-q">{q}<span class="faq-icon">+</span></button>
        <div class="faq-a"><p>{a}</p></div>
      </div>''' for q,a in t["faq"])
    return f'''<section class="page-section alt" data-rv>
  <div class="container"><h2>Perguntas frequentes</h2><div class="faq">
{items}
    </div></div>
</section>
'''

CTA = f'''<section class="page-section" data-rv>
  <div class="container cta-band">
    <h2>Quer ser a marca recomendada pela IA e pelo Google?</h2>
    <p>Reunião de descoberta gratuita. Proposta personalizada em até 48 horas.</p>
    <a href="{WA}" target="_blank" class="btn-primary">Falar com a Matilab pelo WhatsApp →</a>
  </div>
</section>
'''

def render(topic):
    top, bottom = _boiler()
    return _head(topic) + top + _hero(topic) + _sections(topic) + _faq(topic) + CTA + "\n" + bottom

def add_to_sitemap(slug, priority="0.8"):
    p = os.path.join(ROOT, "sitemap.xml")
    sm = open(p, encoding="utf-8").read()
    if f"/{slug}<" in sm or f"/{slug}\"" in sm or f">https://matilab.com.br/{slug}<" in sm:
        return False
    from datetime import date
    block = f'''  <url>
    <loc>https://matilab.com.br/{slug}</loc>
    <lastmod>{date.today().isoformat()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>{priority}</priority>
  </url>'''
    sm = sm.replace("</urlset>", block + "\n\n</urlset>")
    open(p, "w", encoding="utf-8").write(sm)
    return True

def add_to_llms(slug, name):
    p = os.path.join(ROOT, "llms.txt")
    lt = open(p, encoding="utf-8").read()
    if slug in lt: return False
    lt = lt.rstrip() + f"\n- [{name}](https://matilab.com.br/{slug})\n"
    open(p, "w", encoding="utf-8").write(lt)
    return True
