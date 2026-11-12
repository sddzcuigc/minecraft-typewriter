(()=>{"use strict";
const rows=window.HANZI_3500||[],notes=window.SZX_NOTES||{},lessonData=window.SZX_LESSON_DATA||{},E=window.SZX_TEACHER_ENGINE,root=document.getElementById("content"),shell=document.querySelector(".shell"),tabs=document.querySelector(".tabs");
if(!rows.length||!root||!tabs||!E)return;
const by=new Map(rows.map(r=>[r[0],r])),key="szx_world_v4",legacyKey="szx_world_v3";
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const core="一二三四五六七八九十人大小上下左右日月山水火木田口目耳手足心雨雪风云天地花草树木林森鸟鱼马牛羊虫天空海河田家门车书学老师明休尖看笑跑走吃喝红白青清晴请睛国中国朋友学校春夏秋冬东西多少开关早晚头发叶米饭".split("");
const memory={"休":"一个人靠着树木休息。这是帮助记忆的画面，不是严格的字源结论。","明":"太阳和月亮都能发光，用它们联想明亮。","林":"两棵树组成树林。","森":"三棵树组成茂密的森林。","尖":"上面小、下面大，可以联想铅笔尖。","看":"把手放在眼睛上方，远远地看。","晴":"日字旁让人想到太阳，右边青提供读音线索。","清":"三点水提示与水有关，右边青提供读音线索。","请":"言字旁提示说话，右边青提供读音线索。","睛":"目字旁提示眼睛，右边青提供读音线索。"};
const defaults=()=>({xp:0,mastered:[],progress:{},due:{},wrong:{},lessons:0,recentErrors:[]});
function load(){
 try{
  const current=JSON.parse(localStorage.getItem(key)||"null");
  if(current&&current.progress)return Object.assign(defaults(),current);
  const old=JSON.parse(localStorage.getItem(legacyKey)||"null");
  if(!old)return defaults();
  const db=Object.assign(defaults(),old),progress={};
  Object.keys(old.due||{}).forEach(c=>{const x=old.due[c]||{};progress[c]={level:Number(x.level)||0,streak:0,seen:1,correct:Number(x.level)||0,wrong:Number(old.wrong&&old.wrong[c])||0,hints:0,repairs:0,lapses:0,lastAt:Number(x.last)||0,nextAt:Number(x.next)||Date.now(),lastOutcome:"migrated"}});
  db.progress=progress;db.recentErrors=[];return db;
 }catch(e){return defaults()}
}
let db=load(),lesson=[],idx=0,results=[],question=null,attempt=0,phase="study",sessionPlan=null;
const save=()=>{try{localStorage.setItem(key,JSON.stringify(db))}catch(e){toast("浏览器存储空间不足，学习记录可能没有保存。")}};
const due=()=>Object.values(db.progress).filter(x=>x&&x.seen>0&&x.nextAt<=Date.now()).length;
function toast(s){const x=document.createElement("div");x.className="planet-toast";x.textContent=s;root.append(x);setTimeout(()=>x.remove(),2200)}
function info(c){
 const r=by.get(c)||[c,[],0,""],item=lessonData[c]||null,n=notes[c]||{},m=n.m&&n.m[0]&&n.m[0][1]||[];
 return {c,py:r[1]||[],st:r[2],rad:r[3],word:item&&item[0]||"",meaning:item&&item[1]||m.slice(0,2).join("；"),sentence:item&&item[2]||"",emoji:item&&item[3]||"✨",curated:!!item,sw:n.sw||null};
}
function syncProgress(c,p){
 db.progress[c]=p;db.due[c]={level:p.level,next:p.nextAt,last:p.lastAt};db.wrong[c]=p.wrong;
 if(p.level>=3&&p.streak>=3){if(!db.mastered.includes(c))db.mastered.push(c)}
 else db.mastered=db.mastered.filter(x=>x!==c);
}

function exportClassroomRecord(){
 const payload={format:"shizixingqiu-teacher-backup",version:1,exportedAt:new Date().toISOString(),record:db};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});
 const url=URL.createObjectURL(blob),link=document.createElement("a");
 link.href=url;link.download="shizixingqiu-classroom-"+new Date().toISOString().slice(0,10)+".json";
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 toast("课堂学习记录已导出。此文件不包含其他工具的单独记录。");
}
function parseClassroomBackup(text){
 const payload=JSON.parse(text);
 if(!payload||payload.format!=="shizixingqiu-teacher-backup"||payload.version!==1||!payload.record||typeof payload.record!=="object"||Array.isArray(payload.record))throw Error("文件不是受支持的课堂备份");
 const raw=payload.record,clean=defaults(),num=value=>Number.isFinite(Number(value))?Math.max(0,Number(value)):0;
 clean.xp=num(raw.xp);clean.lessons=num(raw.lessons);
 if(!raw.progress||typeof raw.progress!=="object"||Array.isArray(raw.progress))throw Error("备份缺少有效学习进度");
 for(const [char,p] of Object.entries(raw.progress)){
  if(!by.has(char)||!p||typeof p!=="object"||Array.isArray(p))continue;
  const progress={level:Math.min(5,num(p.level)),streak:num(p.streak),seen:num(p.seen),correct:num(p.correct),wrong:num(p.wrong),hints:num(p.hints),repairs:num(p.repairs),lapses:num(p.lapses),lastAt:num(p.lastAt),nextAt:num(p.nextAt),lastOutcome:String(p.lastOutcome||"imported").slice(0,32)};
  clean.progress[char]=progress;clean.due[char]={level:progress.level,next:progress.nextAt,last:progress.lastAt};clean.wrong[char]=progress.wrong;
  if(progress.level>=3&&progress.streak>=3)clean.mastered.push(char);
 }
 if(Array.isArray(raw.recentErrors))clean.recentErrors=raw.recentErrors.filter(x=>x&&by.has(x.char)&&typeof x==="object").slice(-100).map(x=>({char:x.char,target:String(x.target||"").slice(0,60),selected:String(x.selected||"").slice(0,60),mode:String(x.mode||"").slice(0,32),kind:String(x.kind||"").slice(0,32),at:num(x.at)}));
 return clean;
}
async function importClassroomRecord(event){
 const input=event.target,file=input.files&&input.files[0];if(!file)return;
 try{
  if(file.size>2*1024*1024)throw Error("备份文件超过 2 MB");
  const imported=parseClassroomBackup(await file.text());
  if(!window.confirm("导入将覆盖本浏览器现有的课堂学习记录。建议先导出当前记录，是否确认导入？"))return;
  db=imported;save();home();toast("课堂记录已恢复。其他学习工具的本地数据未更改。");
 }catch(e){toast("导入失败："+(e&&e.message||"文件格式错误"))}
 finally{input.value=""}
}

function home(){
 const mastered=db.mastered.length, dueNow=due();
 const featured=["山","水","日","月","木","林","森","明"].filter(c=>by.has(c));
 const progress=Math.min(100,Math.round(mastered/3500*100));
 root.innerHTML=`<div class="dashboard">
  <section class="welcome-hero">
   <div class="welcome-copy">
    <div class="eyebrow"><span class="eyebrow-dot"></span> HANZI PLANET · 每天一点点</div>
    <h2>让每个汉字，<br><em>都有自己的故事。</em></h2>
    <p>从看见字形开始，读懂声音、结构与意思。芽芽老师会记住你的学习节奏，也会在你卡住的时候换一种讲法。</p>
    <div class="welcome-actions"><button class="primary-action" id="startQuest">开始今天的课堂 <span>↗</span></button><span class="action-caption">约 5 分钟 · 5 个汉字</span></div>
    <div class="hero-trust"><span>本机保存学习进度</span><i></i><span>核心课程支持离线</span></div>
   </div>
   <div class="welcome-art" aria-label="山水与汉字的插画">
    <svg viewBox="0 0 520 360" role="img" aria-label="日月山水组成的汉字星球插画">
     <defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f4ead8"/><stop offset="1" stop-color="#e8eee3"/></linearGradient><linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#9bb39a"/><stop offset="1" stop-color="#6f8d79"/></linearGradient><linearGradient id="river" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c7d9d3"/><stop offset="1" stop-color="#91b5aa"/></linearGradient></defs>
     <rect x="42" y="24" width="436" height="302" rx="28" fill="url(#sky)"/>
     <circle cx="365" cy="100" r="38" fill="#d5a46c" opacity=".9"/>
     <path d="M65 242 L177 92 L278 229 L337 151 L455 270 L455 306 L65 306Z" fill="#b6c5aa"/>
     <path d="M112 260 L225 113 L319 252 L365 194 L455 282 L455 306 L112 306Z" fill="url(#hill)"/>
     <path d="M177 92 L205 132 L188 127 L177 142 L163 126 L149 132Z" fill="#f7f4e9"/>
     <path d="M225 113 L248 149 L231 145 L218 160 L204 143Z" fill="#f7f4e9"/>
     <path d="M65 262 Q145 231 214 260 T365 258 T455 269 L455 306 L65 306Z" fill="url(#river)"/>
     <path d="M80 278 Q160 252 238 278 T430 279" fill="none" stroke="#f5f2e9" stroke-width="4" stroke-linecap="round" opacity=".9"/>
     <path d="M99 228 Q108 191 135 183 M108 228 Q128 200 151 198" fill="none" stroke="#52745c" stroke-width="5" stroke-linecap="round"/>
     <path d="M95 201 Q80 184 93 170 Q115 171 115 193 M127 195 Q135 174 155 180 Q160 202 136 207" fill="#7e9e7e"/>
     <g transform="translate(86 63)"><rect width="76" height="76" rx="20" fill="#fffdf8" stroke="#e9dfcd"/><text x="38" y="54" text-anchor="middle" font-size="45" fill="#426b53" font-family="serif">山</text></g>
     <g transform="translate(365 188)"><rect width="68" height="68" rx="18" fill="#fffdf8" stroke="#e9dfcd"/><text x="34" y="48" text-anchor="middle" font-size="39" fill="#527d80" font-family="serif">水</text></g>
     <g transform="translate(315 37)"><rect width="58" height="58" rx="17" fill="#fffdf8" stroke="#e9dfcd"/><text x="29" y="41" text-anchor="middle" font-size="32" fill="#a46f45" font-family="serif">日</text></g>
     <path d="M73 309 Q260 332 450 309" fill="none" stroke="#78917d" stroke-width="1.5" opacity=".45"/>
    </svg>
    <div class="art-caption"><span>山</span><span>水</span><span>日</span><small>从一笔一画，认识这个世界</small></div>
   </div>
  </section>

  <section class="dashboard-overview">
   <div class="overview-intro"><span class="section-kicker">YOUR LEARNING JOURNEY</span><h3>今天的学习节奏</h3><p>不赶进度，先把学过的字记牢。</p></div>
   <div class="overview-metrics">
    <div class="metric"><span class="metric-label">连续掌握</span><strong>${mastered}<small> / 3500</small></strong><div class="metric-track"><i style="width:${progress}%"></i></div></div>
    <div class="metric"><span class="metric-label">待复习</span><strong>${dueNow}<small> 个字</small></strong><span class="metric-note">${dueNow?"先复习，再学新字":"今天没有到期复习"}</span></div>
    <div class="metric"><span class="metric-label">星星能量</span><strong>${db.xp}<small> ✦</small></strong><span class="metric-note">每次认真练习都算数</span></div>
   </div>
  </section>

  <div class="section-heading"><div><span class="section-kicker">START HERE</span><h3>选择今天的学习方式</h3></div><span class="section-aside">每个练习都围绕同一套汉字资料</span></div>
  <section class="learning-launches">
   <button class="launch-card launch-main" id="meetTeacher"><span class="launch-index">01 / CLASSROOM</span><span class="launch-icon teacher-mark">芽</span><strong>和芽芽老师上课</strong><small>讲字形、读音和词语。答错时，老师会换一种方式讲。</small><span class="launch-link">进入课堂 <b>↗</b></span></button>
   <button class="launch-card" data-tool="bank"><span class="launch-index">02 / DICTIONARY</span><span class="launch-icon">字</span><strong>汉字图鉴</strong><small>搜索 3500 个汉字，查看拼音、部首和笔画。</small><span class="launch-link">打开字库 <b>↗</b></span></button>
   <button class="launch-card" data-tool="pinyin"><span class="launch-index">03 / SOUND LAB</span><span class="launch-icon sound-mark">ā</span><strong>拼音工作室</strong><small>从声母、韵母到声调，把读音真正拆开练习。</small><span class="launch-link">开始练习 <b>↗</b></span></button>
   <button class="launch-card" data-tool="write"><span class="launch-index">04 / WRITING</span><span class="launch-icon write-mark">永</span><strong>硬笔书写</strong><small>描红、观察笔顺，在方格里练好每一笔。</small><span class="launch-link">进入书写 <b>↗</b></span></button>
  </section>

  <section class="discovery-section">
   <div class="section-heading"><div><span class="section-kicker">A LITTLE DISCOVERY</span><h3>今天认识这些字</h3></div><button class="quiet-link" id="seeAll">浏览全部汉字 <b>↗</b></button></div>
   <div class="featured-characters">${featured.map((c,i)=>{const d=info(c);return `<button class="featured-char" data-feature-char="${esc(c)}"><span class="featured-char-top">${String(i+1).padStart(2,"0")}</span><strong>${esc(c)}</strong><span class="featured-pinyin">${esc(d.py[0]||"")}</span><small>${esc(d.word||d.rad||"认识一个汉字")}</small></button>`}).join("")}</div>
  </section>

  <section class="studio-section"><div class="section-heading"><div><span class="section-kicker">LEARNING STUDIO</span><h3>学习工具与记忆方法</h3></div><span class="section-aside">按需要使用，不必一次学完</span></div>
   <div class="studio-links">
    <button data-tool="curve"><span>记忆曲线</span><small>把学过的字安排到合适的时间复习</small><b>↗</b></button>
    <button data-tool="memory"><span>联想记忆</span><small>字形联想、谐音空间与间架结构</small><b>↗</b></button>
    <button data-tool="textbook"><span>课文例句</span><small>把汉字放回真实语境中理解</small><b>↗</b></button>
    <button data-tool="images"><span>图画资料</span><small>查找、整理与保存汉字联想图</small><b>↗</b></button>
    <button data-tool="game"><span>拼音打字</span><small>看字输入拼音，练习从认识到表达</small><b>↗</b></button>
    <button data-tool="review"><span>错字本</span><small>回看容易混淆、需要再次练习的字</small><b>↗</b></button>
   </div>
  </section>
  <footer class="dashboard-foot"><span>识字星球 · 芽芽老师 · V5.0</span><div class="progress-backup"><button id="exportProgress" type="button">备份课堂记录</button><button id="importProgress" type="button">恢复课堂记录</button><input id="progressFile" type="file" accept="application/json,.json" hidden aria-label="选择课堂学习记录备份文件"></div><span>学习记录保存在当前设备 · 核心课堂支持离线</span></footer>
 </div>`;
 document.getElementById("exportProgress").onclick=exportClassroomRecord;
 document.getElementById("importProgress").onclick=()=>document.getElementById("progressFile").click();
 document.getElementById("progressFile").onchange=importClassroomRecord;
 document.getElementById("startQuest").onclick=start;
 document.getElementById("meetTeacher").onclick=start;
 document.getElementById("seeAll").onclick=()=>tool("bank");
 root.querySelectorAll("[data-zone]").forEach(b=>b.onclick=()=>{const i=Number(b.dataset.zone);if(i>0&&mastered<[0,10,25,50][i]){toast("先完成前面的探索，积累一些连续掌握的汉字。");return}start()});
 root.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>tool(b.dataset.tool));
 root.querySelectorAll("[data-feature-char]").forEach(b=>b.onclick=()=>{const c=b.dataset.featureChar;if(by.has(c)){sessionPlan={dueCount:0};lesson=[c];idx=0;results=[];teach()}});
}
function tool(t){const advanced=tabs.querySelector('[data-advanced="'+t+'"]');if(advanced){advanced.click();return}const basic=tabs.querySelector('[data-view="'+t+'"]')||tabs.querySelector('[data-view="bank"]');if(basic)basic.click()}
function start(){
 sessionPlan=E.planLesson(rows,db.progress,core,5,Date.now());lesson=sessionPlan.chars;idx=0;results=[];
 if(!lesson.length){completeEmpty();return}
 teach();
}
function completeEmpty(){
 root.innerHTML='<section class="finish-card"><div class="finish-medal">🌟</div><small>FOUNDATION COMPLETE</small><h2>今天没有需要学习的新字</h2><p>当前基础课程已经完成，也没有到期复习。可以从3500字图鉴中挑一个新字继续探索。</p><button class="planet-cta" id="goBank">打开汉字图鉴 →</button><button class="finish-secondary" id="goHome">回到星球</button></section>';
 document.getElementById("goBank").onclick=()=>tool("bank");document.getElementById("goHome").onclick=home;
}
function teach(){
 if(idx>=lesson.length){finish();return}
 phase="study";question=null;const d=info(lesson[idx]),p=db.progress[d.c]||null;
 const status=sessionPlan&&idx<sessionPlan.dueCount?"今日复习":"新字探索";
 root.innerHTML='<div class="lesson-shell"><div class="lesson-top"><button id="exitLesson">← 返回星球</button><b>'+status+'　'+(idx+1)+' / '+lesson.length+'</b><span>✦ ✦ ✦</span></div><div class="lesson-progress"><i style="width:'+idx/lesson.length*100+'%"></i></div><section class="lesson-card"><div class="lesson-guide"><span class="guide-avatar">芽</span><p><b>芽芽老师</b><br>我们来认识“'+esc(d.c)+'”。先观察字形，再把读音和词语联系起来。</p></div><div class="lesson-character"><div>'+esc(d.emoji)+'</div><strong>'+esc(d.c)+'</strong><b>'+esc(d.py.join(" · ")||"读音待核对")+'</b><small>'+d.st+'画　·　部首 '+esc(d.rad||"待补")+'</small></div><div class="lesson-knowledge"><div><small>认识这个字</small><p>'+esc(d.meaning||"暂无经过校订的现代释义。")+'</p><em>'+(d.curated?"精选常用字卡":"词典参考 · 尚未逐条人工校订")+'</em></div>'+(d.word?'<div><small>放进生活里</small><b>'+esc(d.word)+'</b><p>'+esc(d.sentence)+'</p></div>':'<div><small>观察练习</small><p>先读一遍这个字，再观察它的部首和笔画。暂时没有可靠的精选例句，不用猜。</p></div>')+(memory[d.c]?'<div class="memory-tip"><small>记形小妙招 · 创意联想</small><p>'+esc(memory[d.c])+'</p></div>':"")+(d.sw?'<details><summary>古籍资料（《说文解字》）</summary><p>'+esc(d.sw[1])+'</p><small>古籍解释不等同于现代字义。</small></details>':"")+'</div><div class="lesson-status">'+(p?'上次练习：'+p.correct+'次答对，'+p.wrong+'次答错。':'这是一个新字。')+'</div><button class="lesson-primary" id="ready">我看懂了，开始挑战 →</button></section></div>';
 document.getElementById("exitLesson").onclick=home;document.getElementById("ready").onclick=quiz;
}
function quiz(){
 const d=info(lesson[idx]),mode=d.word&&idx%2===1?"word_to_char":"char_to_pinyin";
 question=E.buildQuestion(d.c,rows,mode,"v4-"+idx+"-"+d.c,lessonData)||E.buildQuestion(d.c,rows,"char_to_pinyin","v4-fallback-"+idx,lessonData);
 if(!question){toast("这个字的读音数据需要校对，暂时跳过。");idx++;teach();return}
 attempt=0;phase="question";renderQuestion(question,null);
}
function renderQuestion(q,repair){
 const focus=q.mode==="word_to_char"?'<div class="quiz-word">'+esc(q.maskedWord)+'</div>':'<div class="quiz-focus"><strong>'+esc(q.targetChar)+'</strong></div>';
 const repairHtml=repair?'<div class="repair-explain"><small>'+esc(repair.title)+'</small><p>'+esc(repair.detail)+'</p>'+(repair.word?'<b class="repair-word">'+esc(repair.word)+'</b>':"")+(repair.meaning?'<p>'+esc(repair.meaning)+'</p>':"")+(repair.sentence?'<p class="repair-sentence">'+esc(repair.sentence)+'</p>':"")+'</div>':"";
 root.innerHTML='<div class="lesson-shell"><div class="lesson-top"><button id="exitLesson">← 暂停课程</button><b>芽芽老师的小挑战　'+(idx+1)+' / '+lesson.length+'</b><span>✦ ✦ ✦</span></div><div class="lesson-progress"><i style="width:'+(idx+.7)/lesson.length*100+'%"></i></div><section class="quiz-card"><small class="quiz-badge">'+(q.mode==="word_to_char"?"词语识字":"读音辨认")+'</small><div class="quiz-guide"><span class="guide-avatar">芽</span><p><b>芽芽老师：</b>'+esc(q.prompt)+'</p></div>'+repairHtml+focus+'<div class="quiz-options">'+q.options.map((o,i)=>'<button data-answer="'+i+'">'+esc(o.value)+'</button>').join("")+'</div><div class="quiz-feedback" aria-live="polite"></div><button class="lesson-primary" id="guided" hidden>换一种方式再试 →</button><button class="lesson-primary" id="next" hidden>继续下一个字 →</button></section></div>';
 document.getElementById("exitLesson").onclick=home;
 root.querySelectorAll("[data-answer]").forEach(b=>b.onclick=()=>choose(q.options[Number(b.dataset.answer)],b));
 const guided=document.getElementById("guided");if(guided)guided.onclick=retryDifferently;
 const next=document.getElementById("next");if(next)next.onclick=()=>{idx++;teach()};
}
function showFeedback(message,kind,nextLabel){
 const f=root.querySelector(".quiz-feedback");if(f){f.className="quiz-feedback "+(kind||"");f.textContent=message}
 root.querySelectorAll("[data-answer]").forEach(b=>b.disabled=true);
 const n=document.getElementById("next");if(n){n.hidden=false;n.textContent=nextLabel||"继续下一个字 →"}
}
function commit(kind,mistakes,selected){
 const c=question.targetChar,old=db.progress[c]||{},p=E.makeProgress(old,{kind,mistakes},Date.now());syncProgress(c,p);
 db.xp+=kind==="first"?10:kind==="hinted"?5:kind==="repaired"?2:0;
 if(mistakes>0){db.recentErrors.push({char:c,target:question.targetPinyin,selected:String(selected||""),mode:question.mode,kind,at:Date.now()});db.recentErrors=db.recentErrors.slice(-100)}
 save();results.push({char:c,kind,mistakes});
}
function choose(option,button){
 if(phase==="question"){
  if(option.correct){const kind=attempt===0?"first":"hinted";commit(kind,attempt,option.value);showFeedback(kind==="first"?"独立答对！这次不需要提示，老师会把下一次复习安排得更远。":"提示后答对了。你已经找到线索，明天再复习一次会更牢固。","good");return}
  if(attempt===0){
   attempt=1;if(button){button.disabled=true;button.classList.add("is-wrong")}
   const h=E.makeHint(question,option.value),f=root.querySelector(".quiz-feedback");f.className="quiz-feedback hint";f.textContent="先别着急。"+h.message+" 再选一次。";return;
  }
  if(button)button.classList.add("is-wrong");
  attempt=2;root.querySelectorAll("[data-answer]").forEach(b=>b.disabled=true);
  const f=root.querySelector(".quiz-feedback");f.className="quiz-feedback repair";f.textContent="我们换个方法，不急着记答案。先听老师拆开讲。";
  const repair=E.makeRepair(question,lessonData),panel=document.createElement("div");panel.className="repair-explain";panel.innerHTML='<small>'+esc(repair.title)+'</small><p>'+esc(repair.detail)+'</p>'+(repair.word?'<b class="repair-word">'+esc(repair.word)+'</b>':"")+(repair.meaning?'<p>'+esc(repair.meaning)+'</p>':"")+(repair.sentence?'<p class="repair-sentence">'+esc(repair.sentence)+'</p>':"");
  f.after(panel);document.getElementById("guided").hidden=false;return;
 }
 if(phase==="guided"){
  if(option.correct){commit("repaired",2,option.value);showFeedback("这次换一种方式答对了。先不急着算完全掌握，10分钟后老师会再安排一次短复习。","good");return}
  commit("failed",3,option.value);showFeedback("今天先到这里。正确答案是“"+(question.mode==="word_to_char"?question.targetChar:question.targetPinyin)+"”。老师已经把它放进10分钟后的复习队列。","repair");return;
 }
}
function retryDifferently(){
 const old=question,mode=old.mode==="word_to_char"?"char_to_pinyin":"word_to_char";
 let next=E.buildQuestion(old.targetChar,rows,mode,"repair-"+idx+"-"+old.targetChar,lessonData);
 if(!next)next=E.buildQuestion(old.targetChar,rows,"char_to_pinyin","repair-alt-"+idx,lessonData);
 if(!next){commit("failed",2,"");showFeedback("这道题暂时没有合适的第二种问法，老师会安排短时复习。","repair");return}
 question=next;phase="guided";renderQuestion(next,E.makeRepair(old,lessonData));
}
function finish(){
 db.lessons++;save();
 const first=results.filter(x=>x.kind==="first").length,hinted=results.filter(x=>x.kind==="hinted").length,repaired=results.filter(x=>x.kind==="repaired").length,failed=results.filter(x=>x.kind==="failed").length;
 root.innerHTML='<section class="finish-card"><div class="finish-medal">🏅</div><small>MISSION COMPLETED</small><h2>今天的星球探索完成啦！</h2><p>你和芽芽老师一起练习了 '+lesson.length+' 个汉字。答错不是失败，找到错误原因才是进步。</p><div class="finish-score"><div><b>+'+results.reduce((n,x)=>n+(x.kind==="first"?10:x.kind==="hinted"?5:x.kind==="repaired"?2:0),0)+'</b><small>星星能量</small></div><div><b>'+first+'</b><small>独立答对</small></div><div><b>'+(hinted+repaired)+'</b><small>提示后学会</small></div></div><p class="finish-message">需要再练的汉字：'+failed+' 个。老师已按错误情况安排短时复习。连续多次独立答对后，才会计入“连续掌握”。</p><button class="planet-cta" id="homeAgain">回到星球 →</button> <button class="finish-secondary" id="again">再探索一次</button></section>';
 document.getElementById("homeAgain").onclick=home;document.getElementById("again").onclick=start;
}
function init(){
 shell.classList.add("planet-app");[".intro",".stats",".searchbar","footer"].forEach(s=>document.querySelector(s)?.classList.add("legacy-hidden"));tabs.classList.add("planet-tools-nav");
 const b=document.createElement("button");b.className="tab planet-teacher-tab active";b.textContent="星球首页";b.onclick=()=>{shell.classList.add("planet-app");tabs.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");home()};tabs.insertBefore(b,tabs.firstChild);
 const all=[...tabs.querySelectorAll(".tab")],groups=[{label:"学习",ids:["planet-teacher-tab","learn","bank","game","pinyin"]},{label:"练习",ids:["write","wubi","curve","review"]},{label:"探索",ids:["memory","textbook","images"]}];
 const idOf=x=>x.classList.contains("planet-teacher-tab")?"planet-teacher-tab":x.dataset.view||x.dataset.advanced;
 groups.forEach(g=>{const wrap=document.createElement("div");wrap.className="nav-group";const label=document.createElement("div");label.className="nav-group-label";label.textContent=g.label;wrap.append(label);all.filter(x=>g.ids.includes(idOf(x))).forEach(x=>wrap.append(x));tabs.append(wrap)});
 tabs.classList.add("nav-grouped");
 tabs.addEventListener("click",e=>{if(e.target.closest(".tab")&&!e.target.closest(".planet-teacher-tab")){b.classList.remove("active");shell.classList.remove("planet-app")}});
 home();
}
init();
})();