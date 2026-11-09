#!/usr/bin/env python3
"""Build short offline learning glosses and public-domain Shuowen source quotations."""
import json, re, urllib.request
from pathlib import Path
from collections import Counter

BASE = Path(__file__).resolve().parents[1]
M = "e804ada333b68afddfdccbe8dcc938a72da157a7"
S = "09a6873e46760f20027e20bf48814f5c5cc05d66"
sources = {
    "base": f"https://raw.githubusercontent.com/mapull/chinese-dictionary/{M}/character/common/char_common_base.json",
    "detail": f"https://raw.githubusercontent.com/mapull/chinese-dictionary/{M}/character/common/char_common_detail.json",
    "shuowen": f"https://raw.githubusercontent.com/gujilab/chinese-classical-corpus/{S}/output/shuowen.json",
}
def load(name):
    with urllib.request.urlopen(urllib.request.Request(sources[name], headers={"User-Agent":"shizixingqiu-offline-dictionary/1.0"}), timeout=90) as r:
        text = r.read().decode("utf-8-sig").strip()
    if text.startswith("["):
        return json.loads(text)
    return json.loads("[" + re.sub(r",\s*$", "", text) + "]")
def clean(value):
    t = re.sub(r"<[^>]+>", "", str(value or "")).replace("（", "(").replace("）", ")").strip(" 。;；")
    if t.startswith("("):
        m = re.search(r"本义\s*[:：]\s*([^。;；)]+)",t)
        t = m.group(1) if m else re.sub(r"^\([^)]{0,240}\)[。.;；]*", "", t).strip()
    return re.sub(r"\s+", " ", t)[:95].rstrip("，、；;。")
raw = (BASE/"data.js").read_text()
rows = json.loads(re.search(r"window\.HANZI_3500=(\[[\s\S]*\]);",raw).group(1))
assert len(rows)==3500 and len(set(x[0] for x in rows))==3500
valid=set(x[0] for x in rows)
base={x["char"]:x for x in load("base") if x.get("char") in valid}
detail={x["char"]:x for x in load("detail") if x.get("char") in valid}
sw={}
for x in load("shuowen"):
    if not isinstance(x,dict):continue
    c=x.get("char","")
    v=str(x.get("content") or "").strip()
    if len(c)==1 and len(v)>3 and "\u25a1" not in v and c not in sw:sw[c]=v
notes={}
coverage=Counter()
for row in rows:
    c=row[0]; b=base.get(c,{})
    val={}
    if b.get("structure"):val["s"]=b["structure"]
    t=b.get("traditional") or ""
    if t!=c and t:val["t"]=t
    senses=[]
    for pr in detail.get(c,{}).get("pronunciations") or []:
        if not isinstance(pr,dict):continue
        parts=[]
        for exp in pr.get("explanations") or []:
            if not isinstance(exp,dict):continue
            phrase=clean(exp.get("content"))
            if phrase and phrase not in parts and not phrase.startswith(("参见","详见","同“","与“")):parts.append(phrase)
        if parts:senses.append([pr.get("pinyin",""),parts[:3]])
    if senses:val["m"]=senses[:4];coverage["modernMeaning"]+=1
    src=c;original=sw.get(c)
    if not original and len(t)==1:src=t;original=sw.get(t)
    if original:
        val["sw"]=[src,original[:420]];coverage["shuowen"]+=1
        if src!=c:coverage["traditionalMatch"]+=1
    notes[c]=val
assert len(notes)==3500
print("COVERAGE",json.dumps(coverage,ensure_ascii=False),flush=True)
print("EXAMPLES",json.dumps({c:notes[c] for c in ["一","水","明","后","车","休","山","笑","国","爱","林","天"] if c in notes},ensure_ascii=False)[:4000],flush=True)
assert coverage["modernMeaning"]>=3000,"too few reliable dictionary entries"
assert coverage["shuowen"]>=1800,"Shuowen alignment failed"
(BASE/"notes.js").write_text("/* Derived glossary: mapull/chinese-dictionary MIT; historical Shuowen: gujilab CC0. Check ATTRIBUTION.md. */\nwindow.SZX_NOTES="+json.dumps(notes,ensure_ascii=False,separators=(",",":"))+";\n")
(BASE/"notes-stats.json").write_text(json.dumps({"coverage":coverage,"sourceVersions":sources},ensure_ascii=False,indent=2))
