#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Publica 1 pagina/dia a partir da fila em content/queue.json.
Uso: python3 scripts/gen_daily_page.py  -> gera a proxima pagina 'pending'.
Imprime o slug publicado (ou 'NONE' se a fila acabou)."""
import os, json, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_page as B

ROOT = B.ROOT
QUEUE = os.path.join(ROOT, "content", "queue.json")

def main():
    data = json.load(open(QUEUE, encoding="utf-8"))
    topics = data["topics"]
    nxt = next((t for t in topics if t.get("status") != "published"), None)
    if not nxt:
        print("NONE")  # fila vazia
        return 0
    slug = nxt["slug"]
    out = os.path.join(ROOT, slug + ".html")
    if os.path.exists(out):
        # ja existe no site: pula pra nao sobrescrever, marca como published
        nxt["status"] = "published"
        json.dump(data, open(QUEUE, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        print("SKIP-EXISTS", slug)
        return 0
    html = B.render(nxt)
    open(out, "w", encoding="utf-8").write(html)
    B.add_to_sitemap(slug, nxt.get("priority", "0.8"))
    B.add_to_llms(slug, nxt.get("bc", nxt.get("h1", slug)))
    from datetime import date
    nxt["status"] = "published"
    nxt["published_at"] = date.today().isoformat()
    json.dump(data, open(QUEUE, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("PUBLISHED", slug)
    return 0

if __name__ == "__main__":
    sys.exit(main())
