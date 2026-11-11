(function(root){
"use strict";
const INITIALS=["zh","ch","sh","b","p","m","f","d","t","n","l","g","k","h","j","q","x","z","c","s","r","y","w"];
const FINALS=new Set(["a","o","e","ai","ei","ao","ou","an","en","ang","eng","er","i","ia","ie","iao","iu","ian","in","iang","ing","iong","u","ua","uo","uai","ui","uan","un","uang","ong","v","ve","van","vn","ue"]);
const MARKS={"ā":["a",1],"á":["a",2],"ǎ":["a",3],"à":["a",4],"ē":["e",1],"é":["e",2],"ě":["e",3],"è":["e",4],"ī":["i",1],"í":["i",2],"ǐ":["i",3],"ì":["i",4],"ō":["o",1],"ó":["o",2],"ǒ":["o",3],"ò":["o",4],"ū":["u",1],"ú":["u",2],"ǔ":["u",3],"ù":["u",4],"ǖ":["v",1],"ǘ":["v",2],"ǚ":["v",3],"ǜ":["v",4]};
const TONE_NAMES={1:"一声，平平地读",2:"二声，声音向上扬",3:"三声，先降再升",4:"四声，干脆地下降",5:"轻声，读得轻而短"};
function parsePinyin(raw){
 const source=String(raw||"").trim().toLowerCase();if(!source)return null;
 let tone=0,s=source.replace(/[1-5]$/,"").replace(/u:/g,"ü");const digit=source.match(/([1-5])$/);if(digit)tone=Number(digit[1]);
 let base="";
 for(const ch of s){if(MARKS[ch]){base+=MARKS[ch][0];if(!tone)tone=MARKS[ch][1]}else if(ch==="ü"){base+="v"}else{base+=ch}}
 if(!/^[a-zv]+$/.test(base))return null;
 const initial=INITIALS.find(x=>base.indexOf(x)===0)||"",final=base.slice(initial.length);
 if(!FINALS.has(final))return null;
 return {raw:source,base,initial,final,tone:tone||5};
}
function hash(s){let h=2166136261;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function seededSort(list,seed){return list.slice().sort((a,b)=>hash(String(seed)+":"+a.value)-hash(String(seed)+":"+b.value))}
function validRowMap(rows){
 const map=new Map();
 for(const r of rows||[]){if(!Array.isArray(r)||typeof r[0]!=="string"||!Array.isArray(r[1])||r[1].length!==1)continue;const parsed=parsePinyin(r[1][0]);if(parsed)map.set(r[0],{char:r[0],pinyin:r[1][0],parsed,strokes:Number(r[2])||0,radical:r[3]||""})}
 return map;
}
function shuffle(list,seed){return seededSort(list.map((x,i)=>({value:x.value,correct:!!x.correct,meta:x.meta||null,_i:i})),seed).map(x=>({value:x.value,correct:x.correct,meta:x.meta}))}
function buildQuestion(targetChar,rows,mode,seed,lessonData){
 const map=validRowMap(rows),target=map.get(targetChar);if(!target)return null;
 if(mode==="word_to_char"){
  const item=lessonData&&lessonData[targetChar],word=item&&String(item[0]||"");
  if(!word||word.indexOf(targetChar)<0)return null;
  const masked=word.replace(targetChar,"□");
  let pool=(rows||[]).filter(r=>Array.isArray(r)&&typeof r[0]==="string"&&r[0]!==targetChar&&Number.isFinite(Number(r[2])));
  const targetStroke=target.strokes;
  pool.sort((a,b)=>{
   const da=Math.abs(Number(a[2])-targetStroke),db=Math.abs(Number(b[2])-targetStroke);
   const ra=(a[3]===target.radical?0:1),rb=(b[3]===target.radical?0:1);
   return da-db||ra-rb||hash(String(seed)+":"+a[0])-hash(String(seed)+":"+b[0]);
  });
  const distractors=[],seen=new Set([targetChar]);
  for(const r of pool){if(!seen.has(r[0])){seen.add(r[0]);distractors.push(r[0]);if(distractors.length===3)break}}
  if(distractors.length<3)return null;
  const options=shuffle([{value:targetChar,correct:true},...distractors.map(x=>({value:x,correct:false}))],seed||targetChar);
  return {mode:"word_to_char",targetChar,targetPinyin:target.pinyin,prompt:"给词语补上今天学习的汉字：",maskedWord:masked,word,meaning:item[1]||"",sentence:item[2]||"",options};
 }
 if(mode!=="char_to_pinyin")mode="char_to_pinyin";
 const pool=[],seenPy=new Set();
 for(const x of map.values()){if(x.pinyin!==target.pinyin&&!seenPy.has(x.pinyin)){seenPy.add(x.pinyin);pool.push(x)}}
 if(pool.length<3)return null;
 const groups=[
  pool.filter(x=>x.parsed.initial===target.parsed.initial&&x.parsed.final!==target.parsed.final),
  pool.filter(x=>x.parsed.final===target.parsed.final&&x.parsed.initial!==target.parsed.initial),
  pool.filter(x=>x.parsed.tone===target.parsed.tone&&x.parsed.base!==target.parsed.base),
  pool
 ];
 const chosen=[],used=new Set();
 for(let i=0;i<groups.length&&chosen.length<3;i++){
  const candidates=seededSort(groups[i].filter(x=>!used.has(x.pinyin)).map(x=>({value:x.pinyin,meta:x.char})),String(seed)+":g"+i);
  if(candidates.length){chosen.push(candidates[0].value);used.add(candidates[0].value)}
 }
 if(chosen.length<3){const rest=seededSort(pool.filter(x=>!used.has(x.pinyin)).map(x=>({value:x.pinyin,meta:x.char})),String(seed)+":fill");for(const x of rest){chosen.push(x.value);used.add(x.value);if(chosen.length===3)break}}
 if(chosen.length!==3)return null;
 const options=shuffle([{value:target.pinyin,correct:true},...chosen.map(x=>({value:x,correct:false}))],seed||targetChar);
 return {mode:"char_to_pinyin",targetChar,targetPinyin:target.pinyin,prompt:"仔细看这个字，选出它的读音：",options};
}
function errorKind(question,selected){
 if(question.mode==="word_to_char")return "word";
 const a=parsePinyin(selected),b=parsePinyin(question.targetPinyin);if(!a||!b)return "other";
 if(a.base===b.base&&a.tone!==b.tone)return "tone";
 if(a.initial===b.initial&&a.final!==b.final)return "final";
 if(a.final===b.final&&a.initial!==b.initial)return "initial";
 if(a.tone===b.tone)return "syllable";
 return "other";
}
function makeHint(question,selected){
 const kind=errorKind(question,selected);
 const messages={
  tone:"你选的读音和目标读音，声母、韵母相同，区别在声调。先把声调看清楚，再完整读一遍。",
  initial:"这两个音的韵母相同，但开头的声母不同。先读最前面的声母，再把它和韵母连起来。",
  final:"这两个音的声母相同，后面的韵母不同。先固定开头，再仔细看韵母。",
  syllable:"两个读音的声调相同，但音节并不相同。按“声母—韵母—声调”的顺序逐项检查。",
  word:"先把词语读完整，想想句子表达的意思，再观察空格前后字的组合。不要急着猜。",
  other:"先别急着选。把字形、读音和题目要求分开看，再检查一次。"
 };
 return {kind,message:messages[kind]};
}
function makeRepair(question,lessonData){
 const item=lessonData&&lessonData[question.targetChar];
 if(question.mode==="word_to_char"&&item){
  return {title:"把词语放回句子里",word:item[0]||"",meaning:item[1]||"",sentence:item[2]||"",answer:question.targetChar,detail:"这个词语中缺少的字是“"+question.targetChar+"”。把整个词语连起来读，再读一遍例句。"};
 }
 const p=parsePinyin(question.targetPinyin);
 if(!p)return {title:"重新观察读音",answer:question.targetPinyin,detail:"正确读音是 "+question.targetPinyin+"。"};
 const initial=p.initial||"无声母",final=p.final||"待核对",tone=TONE_NAMES[p.tone]||"声调待核对";
 const detail="正确读音是 "+question.targetPinyin+"。声母："+initial+"；韵母："+final+"；声调："+tone+"。先分开看，再连起来读。";
 if(item)return {title:"拆开读音，再放进词语和句子",word:item[0]||"",meaning:item[1]||"",sentence:item[2]||"",answer:question.targetPinyin,detail};
 return {title:"把读音拆成三部分",answer:question.targetPinyin,detail};
}
function makeProgress(old,outcome,now){
 const p=Object.assign({level:0,streak:0,seen:0,correct:0,wrong:0,hints:0,repairs:0,lapses:0,lastAt:0,nextAt:0,lastOutcome:"new"},old||{});
 const kind=outcome.kind,mistakes=Math.max(0,Number(outcome.mistakes)||0),intervals=[1,3,7,14,30];
 p.seen++;p.wrong+=mistakes;p.lastAt=now;p.lastOutcome=kind;
 if(kind==="first"){
  p.correct++;p.streak++;p.level=Math.min(5,p.level+1);p.nextAt=now+intervals[p.level-1]*86400000;
 }else if(kind==="hinted"){
  p.correct++;p.hints++;p.streak=0;p.level=Math.max(0,p.level-1);p.nextAt=now+86400000;
 }else if(kind==="repaired"){
  p.correct++;p.hints+=2;p.repairs++;p.lapses++;p.streak=0;p.level=0;p.nextAt=now+10*60*1000;
 }else{
  p.hints+=Math.min(2,mistakes);p.lapses++;p.streak=0;p.level=0;p.nextAt=now+10*60*1000;
 }
 return p;
}
function planLesson(rows,progress,core,count,now){
 const map=validRowMap(rows),n=Number(count)||5,t=Number(now)||Date.now(),p=progress||{},seen=new Set(Object.keys(p));
 const due=Object.keys(p).filter(c=>map.has(c)&&Number(p[c].nextAt)>0&&Number(p[c].nextAt)<=t).sort((a,b)=>Number(p[a].nextAt)-Number(p[b].nextAt)||a.localeCompare(b));
 const chars=due.slice(0,n),dueCount=chars.length;
 const add=c=>{if(chars.length<n&&map.has(c)&&!seen.has(c)){chars.push(c);seen.add(c)}};
 (core||[]).forEach(add);
 if(chars.length<n){
  const remaining=(rows||[]).filter(r=>Array.isArray(r)&&map.has(r[0])&&!seen.has(r[0])).slice().sort((a,b)=>Number(a[2])-Number(b[2])||String(a[0]).localeCompare(String(b[0])));
  remaining.forEach(r=>add(r[0]));
 }
 return {chars,dueCount,newCount:chars.length-dueCount,complete:chars.length===0};
}
root.SZX_TEACHER_ENGINE={parsePinyin,validRowMap,buildQuestion,errorKind,makeHint,makeRepair,makeProgress,planLesson,toneName:t=>TONE_NAMES[t]||"声调待核对"};
})(typeof window!=="undefined"?window:this);