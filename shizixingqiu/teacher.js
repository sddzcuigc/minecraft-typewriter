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
function home(){
 const mastered=db.mastered.length,unlocks=[true,mastered>=10,mastered>=25,mastered>=50];
 root.innerHTML='<div class="planet-home"><section class="planet-hero"><div><small>WELCOME TO HANZI PLANET</small><h2>今天，去认识一个新世界。</h2><p>和芽芽老师一起探索汉字。答错了先给提示，再换一种方法讲解，不急着公布答案。</p><button class="planet-cta" id="startQuest">开始今日探索　→</button><div class="hero-foot">✦ 无需登录　　✦ 核心课堂完全离线　　✦ 复习优先的个性化课程</div></div><div class="planet-art"><div class="orbit"></div><div class="planet-core">字</div><span class="float-star">✦</span><i>山</i><b>月</b><em>水</em></div></section><div class="world-stats"><div><b>'+db.xp+'</b><small>星星能量</small></div><div><b>'+mastered+'</b><small>连续掌握</small></div><div><b>'+due()+'</b><small>今日待复习</small></div><div><b>'+db.lessons+'</b><small>完成课堂</small></div></div><section class="world-section"><div class="world-heading"><div><small>YOUR LEARNING JOURNEY</small><h3>探索地图</h3><p>先复习到期的字，再学习新字；基础字表完成后按笔画逐步扩展。</p></div><span>'+mastered+' / 3500 已连续掌握</span></div><div class="world-map">'+[
 ["🌱","启程森林","基础汉字 · 认识读音","开始探索"],
 ["🏞️","自然山谷","山川 · 日月 · 花草",unlocks[1]?"已解锁":"掌握10字解锁"],
 ["🏡","生活小镇","家庭 · 学校 · 日常",unlocks[2]?"已解锁":"掌握25字解锁"],
 ["🚀","表达星港","词语 · 句子 · 阅读",unlocks[3]?"已解锁":"掌握50字解锁"]
 ].map((x,i)=>'<button data-zone="'+i+'" '+(!unlocks[i]?'class="zone-locked"':'')+'><span>'+x[0]+'</span><b>'+x[1]+'</b><small>'+x[2]+'</small><i>'+x[3]+'</i></button>').join("")+'</div></section><section class="teacher-banner"><div class="teacher-face">芽</div><div><small>YOUR PERSONAL GUIDE</small><h3>芽芽老师 · 会根据错误调整讲法</h3><p>先给提示，再拆开读音或放进词语和句子里重新练习。</p></div><button id="meetTeacher">和老师见面 →</button></section><section class="tool-shelf"><small>LEARNING STUDIO</small><h3>学习工具箱</h3><div class="tool-grid"><button data-tool="bank">🗂️<b>汉字图鉴</b><small>搜索3500字</small></button><button data-tool="write">✍️<b>笔顺书写</b><small>描红与练习</small></button><button data-tool="pinyin">🔤<b>拼音练习</b><small>听音与辨读</small></button><button data-tool="curve">🌟<b>记忆花园</b><small>错题与复习</small></button></div></section><p class="local-note">学习记录只保存在这台设备的浏览器中。教学规则、字库和课程均可离线运行，不会上传孩子的学习数据。</p></div>';
 document.getElementById("startQuest").onclick=start;document.getElementById("meetTeacher").onclick=start;
 root.querySelectorAll("[data-zone]").forEach(b=>b.onclick=()=>{const i=Number(b.dataset.zone);if(!unlocks[i]){toast("先完成前面的探索，积累一些连续掌握的汉字。");return}start()});
 root.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>tool(b.dataset.tool));
}
function tool(t){const b=tabs.querySelector('[data-advanced="'+t+'"]');if(b)b.click();else{const x=tabs.querySelector('[data-view="bank"]');if(x)x.click()}}
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
 const b=document.createElement("button");b.className="tab planet-teacher-tab active";b.textContent="✦ 星球首页";b.onclick=()=>{shell.classList.add("planet-app");tabs.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");home()};tabs.insertBefore(b,tabs.firstChild);
 tabs.addEventListener("click",e=>{if(e.target.closest(".tab")&&!e.target.closest(".planet-teacher-tab")){b.classList.remove("active");shell.classList.remove("planet-app")}});
 home();
}
init();
})();