#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Monta o corpo do e-mail diário a partir dos slugs publicados na rodada.
Uso: python3 scripts/email_report.py <arquivo_com_slugs>  >> $GITHUB_OUTPUT
Imprime linhas no formato GITHUB_OUTPUT: has_new, subject e body (multilinha)."""
import sys, json, os

path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/pub.txt"
slugs = []
if os.path.exists(path):
    slugs = [l.strip() for l in open(path, encoding="utf-8") if l.strip()]

if not slugs:
    print("has_new=false")
    sys.exit(0)

titulo = {}
try:
    q = json.load(open("content/queue.json", encoding="utf-8"))
    titulo = {t["slug"]: (t.get("h1") or t.get("bc") or t["slug"]) for t in q["topics"]}
except Exception:
    pass

def li(s):
    nome = titulo.get(s, s)
    url = f"https://matilab.com.br/{s}"
    return (f'<li style="margin:0 0 14px">'
            f'<a href="{url}" style="color:#0b7;font-weight:600;text-decoration:none;font-size:16px">{nome}</a>'
            f'<br><a href="{url}" style="color:#888;font-size:12px;text-decoration:none">{url}</a></li>')

items = "".join(li(s) for s in slugs)
n = len(slugs)
plural = "s" if n > 1 else ""
body = (
 '<div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:560px">'
 '<h2 style="font-size:18px;margin:0 0 4px">Novo conteúdo no ar 🚀</h2>'
 f'<p style="color:#555;margin:0 0 16px">Saíram <b>{n} post{plural}</b> hoje no matilab.com.br:</p>'
 f'<ul style="padding-left:18px;margin:0 0 20px">{items}</ul>'
 '<p style="color:#999;font-size:12px;border-top:1px solid #eee;padding-top:12px;margin:0">'
 'Enviado automaticamente pelo motor de conteúdo diário da Matilab.</p>'
 '</div>'
)
subject = f"Matilab: {n} novo{plural} post{plural} no ar hoje"

print("has_new=true")
print(f"subject={subject}")
print("body<<MATILAB_EMAIL_EOF")
print(body)
print("MATILAB_EMAIL_EOF")
