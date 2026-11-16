#!/usr/bin/env python3
"""Build the Privacy Policy and Terms of Service pages from scripts/legal-pages/*.json.

Writes the client bundles in public/assets and patches the server snapshots
(lib/offline-pages) with matching markup so the page
hydrates without a flash of the old layout. Styles live in public/legal-pages.css.

Run after editing the JSON: python3 scripts/build-legal-pages.py
"""
import html
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = {
    "privacy-policy": {"bundle": "privacy-policy-DH7UXs-g.js", "ar": "سياسة الخصوصية"},
    "terms-of-service": {"bundle": "terms-of-service-DdpDqCRf.js", "ar": "شروط الخدمة"},
}

COMPONENT = r'''import{U as o,J as t,g as n,j as e}from"./ui-components-krT5pv9S.js";const D=__DATA__;const B=(b,k)=>{const[y,x]=b;return y==="ul"?e.jsx("ul",{className:"legal-list",children:x.map((i,j)=>e.jsx("li",{children:i},j))},k):y==="h3"?e.jsx("h3",{className:"legal-h3",children:x},k):e.jsx("p",{children:x},k)};const N=i=>(i<9?"0":"")+(i+1);function a(){const i=o(r=>r.setBreadcrumbs),{isRTL:s}=t(),L=s?"ar":"en",[c,C]=n.useState(""),[m,M]=n.useState(!1);n.useLayoutEffect(()=>{i([{label:s?"الرئيسية":"Home",link:"/present"},{label:s?__AR__:D.title}])},[i,s]);n.useEffect(()=>{let f=0;const u=()=>{f=0;const h=window.innerHeight*.3;let v=D.sections[0].id;for(const x of D.sections){const el=document.getElementById(x.id);el&&el.getBoundingClientRect().top<=h&&(v=x.id)}C(v)},g=()=>{f||(f=requestAnimationFrame(u))};u();window.addEventListener("scroll",g,{passive:!0});window.addEventListener("resize",g);return()=>{window.removeEventListener("scroll",g);window.removeEventListener("resize",g);f&&cancelAnimationFrame(f)}},[]);const go=(v,id)=>{v.preventDefault();M(!1);const el=document.getElementById(id);el&&window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-110,behavior:"smooth"})},O="Read our "+D.other.label,H="/"+L+"/"+D.other.slug;return e.jsxs("div",{className:"x_padding inner_padding legal-page",dir:"ltr",children:[e.jsxs("header",{className:"legal-hero",children:[e.jsx("p",{className:"legal-eyebrow",children:"Legal"}),e.jsx("h1",{className:"legal-title",children:D.title}),e.jsx("p",{className:"legal-lead",children:D.lead}),e.jsxs("ul",{className:"legal-meta",children:[e.jsx("li",{children:D.meta.sections}),e.jsx("li",{children:D.meta.read}),e.jsx("li",{children:e.jsx("a",{href:H,children:O})})]})]}),e.jsxs("div",{className:"legal-layout",children:[e.jsxs("nav",{className:"legal-toc"+(m?" is-open":""),"aria-label":"On this page",children:[e.jsxs("button",{type:"button",className:"legal-toc__toggle","aria-expanded":m,onClick:()=>M(!m),children:[e.jsx("span",{children:"On this page"}),e.jsx("span",{className:"legal-toc__chev","aria-hidden":!0})]}),e.jsx("ol",{className:"legal-toc__list",children:D.sections.map((x,k)=>e.jsx("li",{children:e.jsxs("a",{href:"#"+x.id,className:"legal-toc__link"+(c===x.id?" is-active":""),onClick:v=>go(v,x.id),children:[e.jsx("span",{className:"legal-toc__num",children:N(k)}),e.jsx("span",{children:x.toc})]})},x.id))})]}),e.jsx("article",{className:"legal-body",children:D.sections.map((x,k)=>e.jsxs("section",{id:x.id,className:"legal-section",children:[e.jsxs("div",{className:"legal-section__head",children:[e.jsx("span",{className:"legal-section__num",children:N(k)}),e.jsx("h2",{children:x.h})]}),x.blocks.map(B),x.contact&&e.jsxs("div",{className:"legal-contact",children:[e.jsx("dl",{children:x.contact.rows.map((r,j)=>e.jsxs("div",{children:[e.jsx("dt",{children:r[0]}),e.jsx("dd",{children:r[2]?e.jsx("a",{href:r[2],children:r[1]}):r[1]})]},j))}),e.jsxs("div",{className:"legal-contact__actions",children:[e.jsx("a",{className:"legal-btn",href:"/"+L+"/contact",children:"Contact us"}),e.jsx("a",{className:"legal-link",href:H,children:O})]})]})]},x.id))})]})]})}function l(){return e.jsx(a,{})}export{l as component};'''


def esc(s):
    return html.escape(s, quote=True)


def num(i):
    return f"{i + 1:02d}"


def block_html(b):
    kind, x = b
    if kind == "ul":
        return '<ul class="legal-list">' + "".join(f"<li>{esc(i)}</li>" for i in x) + "</ul>"
    if kind == "h3":
        return f'<h3 class="legal-h3">{esc(x)}</h3>'
    return f"<p>{esc(x)}</p>"


def page_html(d, locale):
    """Server markup identical to what the component renders on first paint."""
    other = f"/{locale}/{d['other']['slug']}"
    other_label = esc("Read our " + d["other"]["label"])
    out = ['<div class="x_padding inner_padding legal-page" dir="ltr"><header class="legal-hero">',
           '<p class="legal-eyebrow">Legal</p>',
           f'<h1 class="legal-title">{esc(d["title"])}</h1>',
           f'<p class="legal-lead">{esc(d["lead"])}</p>',
           f'<ul class="legal-meta"><li>{esc(d["meta"]["sections"])}</li><li>{esc(d["meta"]["read"])}</li>'
           f'<li><a href="{other}">{other_label}</a></li></ul></header>',
           '<div class="legal-layout"><nav class="legal-toc" aria-label="On this page">'
           '<button type="button" class="legal-toc__toggle" aria-expanded="false"><span>On this page</span>'
           '<span class="legal-toc__chev" aria-hidden="true"></span></button><ol class="legal-toc__list">']
    for k, s in enumerate(d["sections"]):
        out.append(f'<li><a href="#{s["id"]}" class="legal-toc__link"><span class="legal-toc__num">{num(k)}</span>'
                   f'<span>{esc(s["toc"])}</span></a></li>')
    out.append('</ol></nav><article class="legal-body">')
    for k, s in enumerate(d["sections"]):
        out.append(f'<section id="{s["id"]}" class="legal-section"><div class="legal-section__head">'
                   f'<span class="legal-section__num">{num(k)}</span><h2>{esc(s["h"])}</h2></div>')
        out.extend(block_html(b) for b in s["blocks"])
        if s.get("contact"):
            out.append('<div class="legal-contact"><dl>')
            for label, value, href in s["contact"]["rows"]:
                dd = f'<a href="{esc(href)}">{esc(value)}</a>' if href else esc(value)
                out.append(f"<div><dt>{esc(label)}</dt><dd>{dd}</dd></div>")
            out.append(f'</dl><div class="legal-contact__actions"><a class="legal-btn" href="/{locale}/contact">Contact us</a>'
                       f'<a class="legal-link" href="{other}">{other_label}</a></div></div>')
        out.append("</section>")
    out.append("</article></div></div>")
    return "".join(out)


START = re.compile(r'<div class="x_padding (?:privacy-policy inner_padding flex flex-col gap-10|inner_padding legal-page)" dir="ltr">')


def replace_page_div(doc, new):
    m = START.search(doc)
    if not m:
        raise SystemExit("page markup not found")
    depth, pos = 0, m.start()
    for tag in re.finditer(r"<(/?)div\b", doc[m.start():]):
        depth += -1 if tag.group(1) else 1
        if depth == 0:
            end = doc.index(">", m.start() + tag.start()) + 1
            return doc[:m.start()] + new + doc[end:]
    raise SystemExit("unbalanced page markup")


def word_count(d):
    text = [d["lead"]]
    for s in d["sections"]:
        text.append(s["h"])
        for kind, x in s["blocks"]:
            text.extend(x if kind == "ul" else [x])
    return len(" ".join(text).split())


for slug, cfg in PAGES.items():
    d = json.loads((ROOT / "scripts/legal-pages" / f"{slug}.json").read_text())
    d["meta"] = {"sections": f"{len(d['sections'])} sections",
                 "read": f"{math.ceil(word_count(d) / 230)} min read"}
    js = COMPONENT.replace("__DATA__", json.dumps(d, ensure_ascii=False)).replace("__AR__", json.dumps(cfg["ar"], ensure_ascii=False))
    (ROOT / "public/assets" / cfg["bundle"]).write_text(js)

    for locale in ("en", "ar"):
        markup = page_html(d, locale)
        snap = ROOT / "lib/offline-pages" / f"{locale}__{slug}.json"
        raw = snap.read_text()
        doc = json.loads(raw)
        ascii_ = json.dumps(doc) == raw
        snap.write_text(json.dumps(replace_page_div(doc, markup), ensure_ascii=ascii_))
    print(slug, d["meta"])
