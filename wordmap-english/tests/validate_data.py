import json, pathlib, collections, re
root=pathlib.Path(__file__).resolve().parents[1]
d=json.loads((root/"data/words.json").read_text(encoding="utf-8"))
ws=d["words"]; ids={w["id"] for w in ws}
assert len(ws)==113 and len(ids)==113
assert len(d["units"])==6
assert all(e["from"] in ids and e["to"] in ids and e["type"] and e["reason"] for e in d["edges"])
adj={}
for e in d["edges"]: adj.setdefault(e["from"],[]).append(e["to"])
seen={u["seed"] for u in d["units"]}; todo=list(seen)
while todo:
 x=todo.pop()
 for y in adj.get(x,[]):
  if y not in seen: seen.add(y); todo.append(y)
assert seen==ids, ids-seen
assert all(w.get("practiceExamples") and w["practiceExamples"][0].get("text") for w in ws)
exam_sources={x["id"]:x for x in d["sources"]["exam"]}; exam_counts=collections.Counter()
for w in ws:
 for ex in w.get("examExamples",[]):
  assert ex.get("sourceId") in exam_sources and ex.get("sourceUrl","").startswith("https://")
  exam_counts[ex["sourceId"]]+=len(ex["text"].split())
assert all(n<=25 for n in exam_counts.values()), exam_counts
book_count=sum(len(ex["text"].split()) for w in ws for ex in w.get("textbookExamples",[]))
assert book_count==25, book_count
assert sum(len(w.get("examExamples",[])) for w in ws)==15
assert sum(len(w.get("textbookExamples",[])) for w in ws)==6
app=(root/"app.js").read_text(encoding="utf-8"); html=(root/"index.html").read_text(encoding="utf-8")
for x in ["startDictation","handleDictationInput","scheduleAutoSpeak","renderExamples","schema:22"]: assert x in app, x
assert "includes(x.schema)" in app
assert 'scope==="due"' in app and "filter(due)" in app
assert "dictation.missedIds" in app and "dictation.boostRound" in app
assert "dictationRepeatMistakes" in app
sw=(root/"sw.js").read_text(encoding="utf-8")
manifest=json.loads((root/"manifest.webmanifest").read_text(encoding="utf-8"))
assert "wordmap-v3-1" in sw and "cache.addAll(ASSETS)" in sw
assert "navigator.serviceWorker.register" in html
assert len(manifest["icons"])==1 and manifest["icons"][0]["src"]=="icon.svg"
assert (root/"icon.svg").is_file()
assert 'data-page="dictation"' in html and 'id="dictationPage"' in html
assert "unitGrid" not in app
assert "https://cdn" not in html and '<script src="http' not in html
print(f"PASS: {len(ws)} words, {len(d['units'])} units, {len(d['edges'])} edges, {sum(len(w.get('practiceExamples',[])) for w in ws)} original examples, {sum(len(w.get('examExamples',[])) for w in ws)} sourced test-preview excerpts, {sum(len(w.get('textbookExamples',[])) for w in ws)} textbook excerpts.")
print("PASS: textbook excerpt words =",book_count,"; per-source exam excerpt budgets =",dict(exam_counts))
