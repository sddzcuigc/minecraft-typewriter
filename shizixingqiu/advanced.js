(function(){
"use strict";
const rows=Array.isArray(window.HANZI_3500)?window.HANZI_3500:[];
const chars=rows.map(r=>({c:r[0],py:r[1]||[],strokes:r[2],radical:r[3],freq:r[4]}));
const byChar=Object.fromEntries(chars.map((x,i)=>[x.c,i]));
const $=id=>document.getElementById(id);
const root=$("content"),tabs=document.querySelector(".tabs");
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const read=(k,f)=>{try{const x=JSON.parse(localStorage.getItem(k));return x==null?f:x}catch(e){return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let active="learn",selectedChar="山",question=null,quizMode="char",strictTone=true,reviewQueue=[],reviewCurrent=null,strokeTimer=null,strokeIndex=-1,strokeCurrent=null,searchResults=[],savedImages=[];
const tabDefs=[["pinyin","拼音练习"],["curve","记忆曲线"],["write","硬笔书写"],["memory","记忆工坊"],["textbook","课文例句"],["images","图画找图"]];
tabs.insertAdjacentHTML("beforeend",tabDefs.map(x=>'<button class="tab" data-advanced="'+x[0]+'">'+x[1]+'</button>').join(""));
tabs.querySelectorAll("[data-advanced]").forEach(b=>b.addEventListener("click",()=>open(b.dataset.advanced)));tabs.addEventListener("click",e=>{const old=e.target.closest("[data-view]");if(old){active=old.dataset.view;tabs.querySelectorAll("[data-advanced]").forEach(b=>b.classList.remove("active"))}});
function setActive(){tabs.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.advanced===active||b.dataset.view===active))}
function open(v,ch){active=v;if(ch)selectedChar=ch;setActive();render();window.scrollTo({top:0,behavior:"smooth"})}
function getChar(){const el=document.querySelector(".big-char");return el?el.textContent.trim():selectedChar}
function pinyinBase(s){return String(s||"").toLowerCase().replace(/[üǖǘǚǜ]/g,"v").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[1-5]/g,"").replace(/[^a-zv]/g,"")}
const toneMap={"ā":["a",1],"á":["a",2],"ǎ":["a",3],"à":["a",4],"ē":["e",1],"é":["e",2],"ě":["e",3],"è":["e",4],"ī":["i",1],"í":["i",2],"ǐ":["i",3],"ì":["i",4],"ō":["o",1],"ó":["o",2],"ǒ":["o",3],"ò":["o",4],"ū":["u",1],"ú":["u",2],"ǔ":["u",3],"ù":["u",4],"ǖ":["v",1],"ǘ":["v",2],"ǚ":["v",3],"ǜ":["v",4],"ń":["n",2],"ň":["n",3],"ǹ":["n",4],"ḿ":["m",2]};
function toNumbered(s){return String(s||"").trim().toLowerCase().split(/\s+/).filter(Boolean).map(token=>{let tone=5,out="";for(const ch of token){if(toneMap[ch]){out+=toneMap[ch][0];tone=toneMap[ch][1]}else if(ch==="ü")out+="v";else out+=ch}if(/[1-4]$/.test(out))return out;if(/5$/.test(out))return out.slice(0,-1);return tone===5?out:out+tone}).join(" ")}
function normalizeTyped(s){return String(s||"").trim().toLowerCase().replace(/[，,;；]/g," ").replace(/\s+/g," ").split(" ").filter(Boolean).map(t=>toNumbered(t)).join(" ")}
const pinyinWords=[
["山水","shān shuǐ"],["小山","xiǎo shān"],["天上","tiān shàng"],["大人","dà rén"],["小人","xiǎo rén"],["开门","kāi mén"],["马车","mǎ chē"],["天气","tiān qì"],["火山","huǒ shān"],["大山","dà shān"],["小鸟","xiǎo niǎo"],["木头","mù tou"],["白云","bái yún"],["大雨","dà yǔ"],["红花","hóng huā"],["青草","qīng cǎo"],["水果","shuǐ guǒ"],["月亮","yuè liang"],["太阳","tài yáng"],["朋友","péng you"],["学校","xué xiào"],["老师","lǎo shī"],["读书","dú shū"],["写字","xiě zì"],["中国","zhōng guó"],["人民","rén mín"],["春天","chūn tiān"],["秋天","qiū tiān"],["森林","sēn lín"],["花朵","huā duǒ"]
];
const initials=["b","p","m","f","d","t","n","l","g","k","h","j","q","x","zh","ch","sh","r","z","c","s","y","w"];
const finals=["a","o","e","i","u","ü","ai","ei","ui","ao","ou","iu","ie","üe","er","an","en","in","un","ün","ang","eng","ing","ong"];
const whole=["zhi","chi","shi","ri","zi","ci","si","yi","wu","yu","ye","yue","yuan","yin","yun","ying"];
function renderPinyin(){
root.innerHTML='<section class="panel adv-panel"><div class="adv-head"><div><h2>拼音打字练习</h2><p>看汉字或词语，输入正确拼音。支持声调符号和数字声调。</p></div><span class="adv-pill">3500字联动</span></div><div class="adv-toolbar"><button class="adv-choice on" data-mode="char">单字拼音</button><button class="adv-choice" data-mode="word">词语拼音</button><label class="adv-check"><input type="checkbox" id="toneStrict" checked> 必须输入声调</label></div><div class="pinyin-quiz"><div class="quiz-label" id="quizLabel">请给这个字标注拼音</div><div class="quiz-target" id="quizTarget">山</div><div class="quiz-meta" id="quizMeta">第1题</div><input id="pinyinAnswer" class="adv-input" placeholder="输入拼音，例如 shān 或 shan1" autocomplete="off" autocapitalize="off" spellcheck="false"><div class="adv-actions"><button class="adv-btn primary" id="checkPinyin">检查答案</button><button class="adv-btn" id="nextPinyin">换一题</button><button class="adv-btn" id="showPinyin">显示答案</button></div><div id="pinyinFeedback" class="adv-feedback" aria-live="polite"></div></div><div class="pinyin-reference"><h3>拼音速查表</h3><div class="pinyin-columns"><div><b>声母（23个）</b><div class="sound-grid">'+initials.map(x=>'<button class="sound-chip" data-sound="'+x+'">'+x+'</button>').join("")+'</div></div><div><b>韵母（24个）</b><div class="sound-grid">'+finals.map(x=>'<button class="sound-chip" data-sound="'+x+'">'+x+'</button>').join("")+'</div></div><div><b>整体认读音节（16个）</b><div class="sound-grid">'+whole.map(x=>'<button class="sound-chip" data-sound="'+x+'">'+x+'</button>').join("")+'</div></div></div><div class="tone-row"><span>一声 ā</span><span>二声 á</span><span>三声 ǎ</span><span>四声 à</span><span>轻声 a</span></div><p class="adv-note">提示：输入法通常可以直接输入不带声调的字母；本练习默认要求声调，可关闭“必须输入声调”进行基础拼写练习。</p></div></section>';
let qnum=1,done=false;
function next(){done=false;const pool=quizMode==="word"?pinyinWords:chars.filter(x=>x.py.length===1);const x=pool[Math.floor(Math.random()*pool.length)];question=quizMode==="word"?{display:x[0],py:[x[1]],word:true}:{display:x.c,py:x.py,word:false};$("quizLabel").textContent=quizMode==="word"?"请给这个词语输入拼音":"请给这个汉字输入拼音";$("quizTarget").textContent=question.display;$("quizMeta").textContent="第 "+qnum+" 题 · "+(strictTone?"声调必填":"声调选填");$("pinyinAnswer").value="";$("pinyinFeedback").textContent="";$("pinyinFeedback").className="adv-feedback";$("pinyinAnswer").focus()}
function check(){if(done)return;const val=normalizeTyped($("pinyinAnswer").value);if(!val)return;const expected=question.py.map(normalizeTyped);const noTone=pinyinBase(val);const accepted=expected.some(x=>x===val||( !strictTone && pinyinBase(x)===noTone));if(accepted){done=true;$("pinyinFeedback").textContent="✓ 正确！"+question.py.join(" / ");$("pinyinFeedback").className="adv-feedback good";qnum++}else{$("pinyinFeedback").textContent="再试一次。提示：第一个音节以“"+pinyinBase(question.py[0]).charAt(0)+"”开头。";$("pinyinFeedback").className="adv-feedback bad"}}
$("toneStrict").onchange=e=>{strictTone=e.target.checked;next()};
$("content").querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{quizMode=b.dataset.mode;root.querySelectorAll("[data-mode]").forEach(x=>x.classList.toggle("on",x===b));next()});
$("checkPinyin").onclick=check;$("nextPinyin").onclick=()=>{qnum++;next()};$("showPinyin").onclick=()=>{$("pinyinFeedback").textContent="参考答案："+question.py.join(" / ");$("pinyinFeedback").className="adv-feedback";done=true};
$("pinyinAnswer").onkeydown=e=>{if(e.key==="Enter"){if(done){next();qnum++}else check()}};
root.querySelectorAll("[data-sound]").forEach(b=>b.onclick=()=>speak(b.dataset.sound));
next();
}
function speak(s){if(!("speechSynthesis" in window)){return}try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(s);u.lang="zh-CN";u.rate=.72;speechSynthesis.speak(u)}catch(e){}}
const srsKey="szx.srs.v1";
let srs=read(srsKey,{});
function srsSave(){write(srsKey,srs)}
function dueList(){const now=Date.now();return Object.keys(srs).filter(c=>srs[c].due<=now).sort((a,b)=>srs[a].due-srs[b].due)}
function addSrs(c){if(byChar[c]===undefined)return;if(!srs[c])srs[c]={due:Date.now(),interval:0,reps:0,ease:2.5,last:0,created:Date.now()};srsSave()}
function addNewCards(n){const candidates=chars.filter(x=>!srs[x.c]);for(let i=candidates.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]]}candidates.slice(0,n).forEach(x=>addSrs(x.c));reviewQueue=dueList();reviewCurrent=reviewQueue.shift()||null;renderCurve()}
function rateCard(score){if(!reviewCurrent)return;const c=reviewCurrent,o=srs[c]||{interval:0,reps:0,ease:2.5};if(score===0){o.reps=0;o.interval=0.01;o.ease=Math.max(1.3,o.ease-.2);o.due=Date.now()+10*60*1000}else if(score===3){o.interval=o.reps===0?1:Math.max(1,Math.round(o.interval*1.2));o.reps++;o.ease=Math.max(1.3,o.ease-.15);o.due=Date.now()+o.interval*86400000}else{o.interval=o.reps===0?1:o.reps===1?3:Math.max(1,Math.round(o.interval*o.ease));o.reps++;o.ease=Math.min(3.0,o.ease+.05);o.due=Date.now()+o.interval*86400000}o.last=Date.now();srs[c]=o;srsSave();reviewCurrent=reviewQueue.shift()||null;renderCurve()}
function renderCurve(){
 const due=dueList(),total=Object.keys(srs).length,learned=Object.values(srs).filter(x=>x.reps>=3).length;
 root.innerHTML='<section class="panel adv-panel"><div class="adv-head"><div><h2>记忆曲线 · 间隔复习</h2><p>按遗忘情况安排下一次复习，不靠“看过一遍就算会了”。</p></div><span class="adv-pill">本机保存</span></div><div class="curve-stats"><div><b>'+due.length+'</b><small>现在待复习</small></div><div><b>'+total+'</b><small>已加入记忆</small></div><div><b>'+learned+'</b><small>连续掌握3次以上</small></div></div><div class="curve-explain"><b>复习规则</b><p>忘记：10分钟后再看；模糊：按短间隔复习；记住：逐步延长至1天、3天及更长。每个字独立记录熟悉度与下次复习时间。</p></div><div id="reviewCardArea">'+(reviewCurrent?reviewCardHTML(reviewCurrent):'<div class="empty-adv">'+(due.length?"准备复习":"今天没有到期的字")+'</div>')+'</div><div class="adv-actions"><button class="adv-btn primary" id="startDue">'+(reviewCurrent?"重新开始本轮":"开始今日复习")+'</button><button class="adv-btn" id="add10">加入10个新字</button><button class="adv-btn" id="addCurrent">加入当前认字卡</button></div><div class="adv-list"><h3>已加入的字</h3><div class="review-list">'+Object.keys(srs).slice(0,80).map(c=>'<span>'+esc(c)+'<small>'+new Date(srs[c].due).toLocaleDateString()+'</small></span>').join("")+'</div></div></section>';
 const start=$("startDue");if(start)start.onclick=()=>{reviewQueue=dueList();reviewCurrent=reviewQueue.shift()||null;renderCurve()};
 $("add10").onclick=()=>addNewCards(10);$("addCurrent").onclick=()=>{addSrs(getChar());reviewQueue=dueList();reviewCurrent=reviewQueue.shift()||null;renderCurve()};
 root.querySelectorAll("[data-rate]").forEach(b=>b.onclick=()=>rateCard(Number(b.dataset.rate)));const reveal=$("revealPinyin");if(reveal)reveal.onclick=()=>{$("reviewPinyin").hidden=false;reveal.disabled=true;reveal.textContent="已显示";};
}
function reviewCardHTML(c){const row=chars[byChar[c]],p=row?row.py.join(" / "):"";return '<div class="review-card"><div class="review-char">'+esc(c)+'</div><div class="review-pinyin" id="reviewPinyin" hidden>'+esc(p)+'</div><button class="adv-btn" id="revealPinyin">显示拼音</button><div class="adv-actions rating-row"><button class="adv-btn bad-rate" data-rate="0">忘记</button><button class="adv-btn mid-rate" data-rate="3">模糊</button><button class="adv-btn good-rate" data-rate="5">记住</button></div></div>'}
const hintMap={
"明":["拆字联想","日 + 月 = 明。白天有太阳，夜里有月亮，光线充足就是明亮。"],
"休":["拆字故事","人靠在木旁休息。看到“亻”和“木”，想象一个人倚树歇脚。"],
"林":["拆字联想","两个木组成林，树木成片生长。"],
"森":["递进联想","三个木组成森，从两棵树到一片茂密森林。"],
"尖":["形状联想","上小下大，像针尖、山尖。"],
"从":["空间联想","两个人前后跟随，后面的人跟着前面的人走。"],
"众":["拆字联想","三个人聚在一起，人多就是众。"],
"清":["形旁提示","三点水提示与水有关，青提示读音线索，清水看起来清澈。"],
"晴":["形旁提示","日字旁表示天气与太阳有关，青提供读音线索，晴天有太阳。"],
"请":["形旁提示","言字旁表示说话，青提供读音线索，请求时要开口说。"],
"情":["形旁提示","竖心旁与内心感受有关，青提供读音线索，情感藏在心里。"],
"睛":["形旁提示","目字旁表示眼睛，青提供读音线索。"],
"家":["故事联想","屋顶下面有家人和生活，家是安心生活的地方。"],
"安":["空间联想","宝盖头像屋顶，下面有女，表示屋内安稳。"],
"看":["动作联想","手搭在眼睛上方向远处看，记住上部的手形。"]
};
const palaceSlots=["家门口","鞋柜旁","客厅沙发","餐桌","厨房水槽","书桌","书架","窗台","床头","阳台"];
let memories=read("szx.memories.v1",[]),palace=read("szx.palace.v1",[]);
function renderMemory(){
root.innerHTML='<section class="panel adv-panel"><div class="adv-head"><div><h2>记忆工坊 · 谐音与空间记忆</h2><p>把字形、声音、故事和熟悉的地点连起来。自己能想起，比看一百遍更重要。</p></div><span class="adv-pill">本机保存</span></div><div class="memory-examples"><h3>精选记忆线索</h3><div class="hint-grid">'+Object.keys(hintMap).map(c=>'<article class="hint-card"><b>'+esc(c)+'</b><span>'+esc(hintMap[c][0])+'</span><p>'+esc(hintMap[c][1])+'</p></article>').join("")+'</div></div><div class="memory-editor"><h3>创建自己的记忆线索</h3><div class="adv-form-row"><label>汉字<input id="memoryChar" maxlength="1" value="'+esc(selectedChar)+'"></label><label>记忆方法<select id="memoryType"><option>谐音联想</option><option>空间记忆</option><option>故事联想</option><option>拆字观察</option><option>动作联想</option></select></label></div><label class="full-label">你的联想<textarea id="memoryNote" rows="3" placeholder="例如：把“山”想象成家门口的一座小山……"></textarea></label><button class="adv-btn primary" id="saveMemory">保存记忆线索</button></div><div class="palace-editor"><h3>我的记忆宫殿</h3><p class="adv-note">按固定路线把字放进熟悉的地点。复习时沿路线回想。</p><div class="adv-form-row"><label>地点<select id="palaceSlot">'+palaceSlots.map(s=>'<option>'+s+'</option>').join("")+'</select></label><label>汉字<input id="palaceChar" maxlength="1" value="'+esc(selectedChar)+'"></label></div><label class="full-label">场景画面<textarea id="palaceNote" rows="2" placeholder="把这个字放进这个地点，描述一个夸张、清楚的画面。"></textarea></label><button class="adv-btn primary" id="savePalace">放进记忆宫殿</button><div class="palace-list">'+palace.map((x,i)=>'<div class="palace-item"><b>'+esc(x.slot)+'</b><strong>'+esc(x.char)+'</strong><span>'+esc(x.note)+'</span><button data-del-palace="'+i+'">删除</button></div>').join("")+'</div></div><div class="memory-saved"><h3>我的记忆线索</h3>'+(memories.length?memories.map((x,i)=>'<div class="memory-row"><b>'+esc(x.char)+'</b><span class="adv-pill">'+esc(x.type)+'</span><p>'+esc(x.note)+'</p><button data-del-memory="'+i+'">删除</button></div>').join(""):'<p class="adv-note">还没有自定义记忆线索。</p>')+'</div></section>';
$("saveMemory").onclick=()=>{const c=$("memoryChar").value.trim(),note=$("memoryNote").value.trim();if(!c||!note)return alert("请填写汉字和记忆线索");memories.unshift({char:c,type:$("memoryType").value,note,created:Date.now()});write("szx.memories.v1",memories);renderMemory()};
$("savePalace").onclick=()=>{const c=$("palaceChar").value.trim(),note=$("palaceNote").value.trim();if(!c||!note)return alert("请填写汉字和场景画面");palace.unshift({slot:$("palaceSlot").value,char:c,note,created:Date.now()});write("szx.palace.v1",palace);renderMemory()};
root.querySelectorAll("[data-del-memory]").forEach(b=>b.onclick=()=>{memories.splice(Number(b.dataset.delMemory),1);write("szx.memories.v1",memories);renderMemory()});
root.querySelectorAll("[data-del-palace]").forEach(b=>b.onclick=()=>{palace.splice(Number(b.dataset.delPalace),1);write("szx.palace.v1",palace);renderMemory()});
}
const structures=[
["独体结构","主笔突出，重心平稳。","中宫稳住，长短有度。","人、山、木、日"],
["左右结构","左右相让，宽窄有别。","左窄右宽看字势，左宽右窄也要稳。","河、林、明、休"],
["左中右结构","三部分靠拢，间距均匀。","中间收紧，两边呼应。","湖、树、谢"],
["上下结构","上下对正，重心相承。","上部宜收，下部能托；上下不要脱节。","尖、思、草"],
["上中下结构","中部收紧，上下照应。","三层排匀称，主笔要舒展。","意、章、蓝"],
["全包围结构","外框端正，内部居中。","先外后内再封口，框内留白要匀。","国、园、回"],
["半包围结构","包围部分有开口，内部靠拢。","外框留口，内外有照应。","同、区、近"],
["品字结构","上收下展，三角稳定。","上部居中，下部平稳，重心不偏。","品、森、晶"],
["穿插避让","笔画交错但不拥挤。","有穿有让，疏密相间。","爽、乘、舞"],
["主笔伸展","主笔舒展，其余笔画收敛。","主笔写开，其余收紧，字才有精神。","大、木、成"]
];
function renderWrite(){
const initial=selectedChar||"一";
root.innerHTML='<section class="panel adv-panel"><div class="adv-head"><div><h2>硬笔书写与笔顺</h2><p>先观察笔顺，再描红、临摹，最后独立书写。</p></div><span class="adv-pill">笔顺数据分批缓存</span></div><div class="write-toolbar"><label>练习汉字<input id="writeChar" maxlength="1" value="'+esc(initial)+'"></label><button class="adv-btn primary" id="loadWriteChar">切换汉字</button><label class="adv-check"><input type="checkbox" id="ghostToggle" checked> 显示描红字</label></div><div class="write-layout"><div class="write-stage"><div class="write-stage-head"><b>田字格 · 硬笔练习</b><span>支持鼠标、触屏和触控笔</span></div><div class="write-pad"><div class="ghost-char" id="ghostChar">'+esc(initial)+'</div><canvas id="writingCanvas" width="640" height="640" aria-label="硬笔书写练习区"></canvas></div><div class="adv-actions"><button class="adv-btn" id="clearCanvas">清空</button><button class="adv-btn" id="toggleGhost">描红 / 临摹</button><button class="adv-btn" id="saveCanvas">保存练习图片</button></div><p class="adv-note">描红字是系统字体轮廓参考，不是笔迹评分。练习作品保存在本机下载目录。</p></div><div class="stroke-stage"><div class="write-stage-head"><b>标准笔顺演示</b><span id="strokeCount">加载中</span></div><div id="strokeSvg" class="stroke-svg"><div class="stroke-placeholder">正在读取笔顺数据…</div></div><div class="stroke-controls"><button class="adv-btn" id="strokePrev">上一笔</button><button class="adv-btn primary" id="strokePlay">自动演示</button><button class="adv-btn" id="strokeNext">下一笔</button></div><p class="adv-note" id="strokeNote">笔顺数据来自开源汉字笔画轨迹；部分字需联网首次下载并缓存。</p></div></div><div class="structure-section"><h3>硬笔书法 · 间架结构口诀</h3><p class="adv-note">以下是便于儿童记忆的通用练字提示，属于教学口诀，不是国家标准原文；具体字形要结合范字观察。</p><div class="structure-grid">'+structures.map((s,i)=>'<article class="structure-card"><span>'+esc(s[0])+'</span><b>'+esc(s[1])+'</b><p>'+esc(s[2])+'</p><small>例字：'+esc(s[3])+'</small></article>').join("")+'</div></div></section>';
const canvas=$("writingCanvas"),ctx=canvas.getContext("2d"),ghost=$("ghostChar");
function grid(){ctx.clearRect(0,0,640,640);ctx.save();ctx.strokeStyle="#cbd8c8";ctx.lineWidth=2;ctx.setLineDash([]);ctx.strokeRect(20,20,600,600);ctx.setLineDash([9,8]);ctx.beginPath();ctx.moveTo(320,20);ctx.lineTo(320,620);ctx.moveTo(20,320);ctx.lineTo(620,320);ctx.moveTo(20,20);ctx.lineTo(620,620);ctx.moveTo(620,20);ctx.lineTo(20,620);ctx.stroke();ctx.restore()}
grid();let drawing=false,last=null;
canvas.onpointerdown=e=>{drawing=true;canvas.setPointerCapture(e.pointerId);const r=canvas.getBoundingClientRect();last={x:(e.clientX-r.left)*640/r.width,y:(e.clientY-r.top)*640/r.height};ctx.beginPath();ctx.moveTo(last.x,last.y)};
canvas.onpointermove=e=>{if(!drawing)return;const r=canvas.getBoundingClientRect(),p={x:(e.clientX-r.left)*640/r.width,y:(e.clientY-r.top)*640/r.height};ctx.strokeStyle="#263b31";ctx.lineWidth=12;ctx.lineCap="round";ctx.lineJoin="round";ctx.lineTo(p.x,p.y);ctx.stroke();last=p};
canvas.onpointerup=canvas.onpointercancel=()=>{drawing=false;last=null};
$("clearCanvas").onclick=grid;$("toggleGhost").onclick=()=>{ghost.style.opacity=ghost.style.opacity==="0"?"0.18":"0"};$("ghostToggle").onchange=e=>ghost.style.opacity=e.target.checked?".18":"0";
$("saveCanvas").onclick=()=>{const a=document.createElement("a");a.download="识字星球-"+$("writeChar").value+"-书写练习.png";a.href=canvas.toDataURL("image/png");a.click()};
$("loadWriteChar").onclick=()=>{const c=$("writeChar").value.trim();if(c){selectedChar=c;renderWrite()}};
loadStroke(initial);
$("strokePrev").onclick=()=>{if(strokeCurrent){clearInterval(strokeTimer);strokeIndex=Math.max(0,strokeIndex-1);drawStrokeFrame()}};
$("strokeNext").onclick=()=>{if(strokeCurrent){clearInterval(strokeTimer);strokeIndex=Math.min(strokeCurrent.strokes.length-1,strokeIndex+1);drawStrokeFrame()}};
$("strokePlay").onclick=()=>{if(!strokeCurrent)return;clearInterval(strokeTimer);strokeIndex=-1;drawStrokeFrame();strokeTimer=setInterval(()=>{strokeIndex++;if(strokeIndex>=strokeCurrent.strokes.length){clearInterval(strokeTimer);strokeTimer=null;return}drawStrokeFrame()},700)};
}
function openDB(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return reject(new Error("当前浏览器不支持本地缓存"));const req=indexedDB.open("shizixingqiu-v2",1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains("images"))db.createObjectStore("images",{keyPath:"id"});if(!db.objectStoreNames.contains("strokes"))db.createObjectStore("strokes",{keyPath:"char"})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function dbPut(store,value){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,"readwrite");tx.objectStore(store).put(value);tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function dbGet(store,key){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,"readonly"),r=tx.objectStore(store).get(key);r.onsuccess=()=>{db.close();resolve(r.result||null)};r.onerror=()=>{db.close();reject(r.error)}})}
async function dbAll(store){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,"readonly"),r=tx.objectStore(store).getAll();r.onsuccess=()=>{db.close();resolve(r.result||[])};r.onerror=()=>{db.close();reject(r.error)}})}
async function loadStroke(c){
clearInterval(strokeTimer);strokeTimer=null;strokeIndex=-1;strokeCurrent=null;
const area=$("strokeSvg");if(!area)return;
area.innerHTML='<div class="stroke-placeholder">正在读取 '+esc(c)+' 的笔顺…</div>';
let data=window.SZX_STROKES&&window.SZX_STROKES[c];
if(!data){try{const cached=await dbGet("strokes",c);if(cached)data=cached.data}catch(e){}}
if(!data&&navigator.onLine){try{const url="https://raw.githubusercontent.com/chanind/hanzi-writer-data/master/data/"+encodeURIComponent(c)+".json";const r=await fetch(url);if(!r.ok)throw new Error("未找到该字的笔顺数据");data=await r.json();await dbPut("strokes",{char:c,data})}catch(e){$("strokeNote").textContent="未能下载该字的笔顺。可先练习书写，联网后再试。";}}
if(!$("strokeSvg"))return;if(!data){area.innerHTML='<div class="stroke-placeholder">'+esc(c)+' 暂无离线笔顺数据<br>已提供田字格书写区</div>';$("strokeCount").textContent="待补数据";return}
strokeCurrent=data;strokeIndex=0;drawStrokeFrame();
$("strokeCount").textContent=data.strokes.length+" 笔";
$("strokeNote").textContent="数据来源：hanzi-writer-data / Make Me a Hanzi，采用 Arphic Public License。笔顺按来源数据展示，教学使用时仍建议与当前教材范字核对。";
}
function drawStrokeFrame(){
const area=$("strokeSvg");if(!area||!strokeCurrent)return;
const paths=strokeCurrent.strokes.map((d,i)=>'<path d="'+esc(d)+'" transform="translate(0 900) scale(1 -1)" fill="'+(i<=strokeIndex?"#26784e":"#e0e9df")+'" stroke="'+(i===strokeIndex?"#185d3a":"none")+'" stroke-width="4" stroke-linejoin="round"/>').join("");
area.innerHTML='<svg viewBox="0 0 1024 1024" role="img" aria-label="笔顺第 '+(strokeIndex+1)+' 笔，共 '+strokeCurrent.strokes.length+' 笔">'+paths+'</svg><div class="stroke-step">第 '+Math.max(0,strokeIndex+1)+' / '+strokeCurrent.strokes.length+' 笔</div>';
}
function renderTextbook(){
const entries=read("szx.textbook.v1",[]),grade=read("szx.textbook.grade", "四年级");
const q=read("szx.textbook.char",selectedChar);
root.innerHTML='<section class="panel adv-panel"><div class="adv-head"><div><h2>人教版小学课文例句</h2><p>把教材作为真实语境，不把自编句子冒充课文原文。</p></div><span class="adv-pill">本机教材夹</span></div><div class="pep-warning"><b>版权边界</b><p>人教版教材及其数字资源受版权保护。本版本不批量抓取、打包或转载整篇课文。可录入你合法持有教材中的短句/自备摘录，在本机检索；也可跳转人教社官方教材电子版。</p><a href="https://www.pep.com.cn/" target="_blank" rel="noopener">打开人民教育出版社官网 ↗</a></div><div class="textbook-form"><div class="adv-form-row"><label>年级<select id="bookGrade">'+["一年级","二年级","三年级","四年级","五年级","六年级"].map(x=>'<option '+(x===grade?"selected":"")+'>'+x+'</option>').join("")+'</select></label><label>学期<select id="bookTerm"><option>上册</option><option>下册</option></select></label><label>课次<input id="bookLesson" placeholder="例如：第1课"></label></div><label class="full-label">课文名称<input id="bookTitle" placeholder="课文标题"></label><label class="full-label">例句或短摘录<textarea id="bookText" rows="4" placeholder="粘贴你希望用于学习的短句。内容仅保存在本机浏览器。"></textarea></label><button class="adv-btn primary" id="saveBookText">保存到本机教材夹</button></div><div class="textbook-search"><h3>按汉字查找课文例句</h3><div class="adv-form-row"><label>查找汉字<input id="bookChar" maxlength="1" value="'+esc(q)+'"></label><button class="adv-btn" id="searchBook">查找</button></div><div id="bookResults">'+renderBookMatches(entries,q)+'</div></div><div class="original-examples"><h3>原创练习句（非教材原文）</h3><p>用来补充语境练习，不能标注为人教版课文句子。</p><div class="original-sentence">山脚下有一条清清的小河。</div><div class="original-sentence">春天来了，校园里的花都开了。</div><div class="original-sentence">我们要认真观察身边的事物。</div></div></section>';
$("saveBookText").onclick=()=>{const text=$("bookText").value.trim(),title=$("bookTitle").value.trim();if(!text||!title)return alert("请填写课文名称和短句");const item={grade:$("bookGrade").value,term:$("bookTerm").value,lesson:$("bookLesson").value.trim(),title,text,created:Date.now()};entries.unshift(item);write("szx.textbook.v1",entries);write("szx.textbook.grade",item.grade);renderTextbook()};
$("searchBook").onclick=()=>{const c=$("bookChar").value.trim();write("szx.textbook.char",c);$("bookResults").innerHTML=renderBookMatches(entries,c)};
}
function renderBookMatches(entries,q){const list=entries.filter(x=>!q||x.text.includes(q));if(!list.length)return '<p class="adv-note">没有找到本机导入的相关课文例句。先录入短句，或检查所选汉字。</p>';return list.slice(0,30).map(x=>'<article class="book-match"><div><b>'+esc(x.grade+" "+x.term+" "+x.lesson+" "+x.title)+'</b><small>本机导入 · '+new Date(x.created).toLocaleDateString()+'</small></div><p>'+esc(x.text)+'</p></article>').join("")}
function renderImages(){
root.innerHTML='<section class="panel adv-panel"><div class="adv-head"><div><h2>图画搜索与离线图册</h2><p>自动搜索 Wikimedia Commons，优先筛选可再利用许可，并记录作者、许可与原始页面。</p></div><span class="adv-pill">在线搜索 · 本机缓存</span></div><div class="image-searchbar"><input id="imageQuery" value="'+esc(selectedChar)+'" placeholder="输入汉字或事物，例如：山、苹果、蝴蝶"><button class="adv-btn primary" id="searchCommons">联网找图</button></div><p class="adv-note">搜索仅在联网时工作。选中的图片可缓存到本机，断网后继续查看。仅显示可识别的 CC BY、CC BY-SA、CC0 或公有领域条目；许可元数据仍需用户核对原始页面。</p><div id="imageResults"><div class="empty-adv">正在自动搜索“'+esc(selectedChar)+'”…</div></div><div class="saved-gallery"><div class="adv-head"><h3>我的离线图册</h3><button class="adv-btn" id="refreshSaved">刷新</button></div><div id="savedImages" class="image-grid"></div></div></section>';
$("searchCommons").onclick=()=>searchCommons($("imageQuery").value.trim());
$("refreshSaved").onclick=renderSavedImages;
searchCommons(selectedChar);
renderSavedImages();
}
function stripHTML(s){const d=document.createElement("div");d.innerHTML=String(s||"");return d.textContent||d.innerText||""}
function allowedLicense(s){const v=String(s||"");if(/non.?commercial|\bNC\b|no.?derivatives|\bND\b/i.test(v))return false;return /CC.?BY|CC0|public domain/i.test(v)}
async function searchCommons(q){
const target=$("imageResults");if(!target)return;if(!q){target.innerHTML='<p class="adv-note">请输入搜索关键词。</p>';return}
target.innerHTML='<div class="empty-adv">正在搜索开放许可图片…</div>';
try{
const url="https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent(q)+"&gsrnamespace=6&gsrlimit=18&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=420&format=json&origin=*";
const res=await fetch(url);if(!res.ok)throw new Error("图片搜索服务暂时不可用");const json=await res.json();const pages=Object.values((json.query&&json.query.pages)||{});
searchResults=pages.map(p=>{const info=p.imageinfo&&p.imageinfo[0];if(!info)return null;const m=info.extmetadata||{};const license=stripHTML(m.LicenseShortName&&m.LicenseShortName.value||m.License&&m.License.value);if(!allowedLicense(license))return null;return {id:p.title,title:stripHTML(m.ObjectName&&m.ObjectName.value||p.title.replace(/^File:/,"")),thumb:info.thumburl||info.url,url:info.url,source:info.descriptionurl,author:stripHTML(m.Artist&&m.Artist.value||m.Credit&&m.Credit.value||"作者信息未提供"),license,licenseUrl:stripHTML(m.LicenseUrl&&m.LicenseUrl.value||""),width:info.thumbwidth||0,height:info.thumbheight||0}}).filter(x=>x&&x.thumb&&x.source);
if(!searchResults.length){target.innerHTML='<p class="adv-note">没有找到许可信息符合筛选条件的图片。可以换一个关键词，或在 Wikimedia Commons 中手动查看其他许可。</p>';return}
target.innerHTML='<div class="image-grid">'+searchResults.map((x,i)=>'<article class="image-result"><a href="'+esc(x.source)+'" target="_blank" rel="noopener"><img loading="lazy" src="'+esc(x.thumb)+'" alt="'+esc(x.title)+'"></a><div class="image-meta"><b>'+esc(x.title)+'</b><small>作者：'+esc(x.author)+'</small><small>许可：'+esc(x.license)+'</small><a href="'+esc(x.licenseUrl||x.source)+'" target="_blank" rel="noopener">许可说明 ↗</a><button class="adv-btn" data-cache-image="'+i+'">缓存到离线图册</button></div></article>').join("")+'</div>';
target.querySelectorAll("[data-cache-image]").forEach(b=>b.onclick=()=>cacheImage(searchResults[Number(b.dataset.cacheImage)],b));
}catch(e){target.innerHTML='<div class="empty-adv">图片搜索失败：'+esc(e.message)+'。请检查网络，或稍后重试。</div>'}
}
async function cacheImage(item,button){
const old=button.textContent;button.disabled=true;button.textContent="正在缓存…";
try{const r=await fetch(item.thumb);if(!r.ok)throw new Error("图片下载失败");const blob=await r.blob();if(blob.size>6*1024*1024)throw new Error("图片超过6MB，未缓存");await dbPut("images",{id:item.id,blob,title:item.title,author:item.author,license:item.license,licenseUrl:item.licenseUrl,source:item.source,saved:Date.now()});button.textContent="已缓存 ✓";renderSavedImages()}catch(e){button.disabled=false;button.textContent=old;alert("缓存失败："+e.message+"。可打开原始图片页面手动保存。")}
}
async function renderSavedImages(){
const el=$("savedImages");if(!el)return;
try{savedImages=await dbAll("images");if(!savedImages.length){el.innerHTML='<p class="adv-note">离线图册还没有图片。联网搜索后，点击“缓存到离线图册”。</p>';return}
el.innerHTML=savedImages.map((x,i)=>'<article class="image-result"><img data-saved-img="'+i+'" alt="'+esc(x.title)+'"><div class="image-meta"><b>'+esc(x.title)+'</b><small>'+esc(x.author)+'</small><small>'+esc(x.license)+'</small><a href="'+esc(x.source)+'" target="_blank" rel="noopener">原始来源 ↗</a><button class="adv-btn" data-delete-image="'+i+'">删除缓存</button></div></article>').join("");
savedImages.forEach((x,i)=>{const img=el.querySelector('[data-saved-img="'+i+'"]');if(img&&x.blob)img.src=URL.createObjectURL(x.blob)});
el.querySelectorAll("[data-delete-image]").forEach(b=>b.onclick=async()=>{const item=savedImages[Number(b.dataset.deleteImage)];const db=await openDB();const tx=db.transaction("images","readwrite");tx.objectStore("images").delete(item.id);tx.oncomplete=()=>{db.close();renderSavedImages()}});
}catch(e){el.innerHTML='<p class="adv-note">当前浏览器无法读取离线图册缓存。</p>'}
}
function render(){setActive();if(active==="pinyin")renderPinyin();else if(active==="curve")renderCurve();else if(active==="write")renderWrite();else if(active==="memory")renderMemory();else if(active==="textbook")renderTextbook();else if(active==="images")renderImages()}
function decorateLearningCard(){
const actions=root.querySelector(".learning-grid > section .actions");
const el=document.querySelector(".big-char");
const c=el?el.textContent.trim():selectedChar;
if(actions&&!actions.querySelector("[data-add-curve]")){
selectedChar=c;
const b=document.createElement("button");b.className="subtle-btn";b.textContent="加入记忆曲线";b.dataset.addCurve="1";b.onclick=()=>{addSrs(c);alert("已加入记忆曲线："+c)};
const w=document.createElement("button");w.className="subtle-btn";w.textContent="练习书写";w.onclick=()=>open("write",c);
const m=document.createElement("button");m.className="subtle-btn";m.textContent="记忆方法";m.onclick=()=>open("memory",c);
const im=document.createElement("button");im.className="subtle-btn";im.textContent="找配图";im.onclick=()=>open("images",c);
actions.append(b,w,m,im);
}
}
const observer=new MutationObserver(decorateLearningCard);
observer.observe(root,{childList:true,subtree:true});
decorateLearningCard();
if(navigator.serviceWorker&&location.protocol!=="file:"){navigator.serviceWorker.register("./sw.js").catch(()=>{});}
})();


/* 扩展：3500字的来源化释义、联想结构图、同音记忆与《说文》 */
(function(){
"use strict";
var rows=window.HANZI_3500||[],notes=window.SZX_NOTES||{},app=document.getElementById("content"),tabs=document.querySelector(".tabs");
if(!rows.length||!app||!tabs)return;
var ix=new Map(rows.map((r,i)=>[r[0],i])),ex=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
var imagery={"一":"☝️","二":"✌️","三":"3️⃣","人":"🚶","口":"👄","日":"☀️","月":"🌙","山":"⛰️","水":"💧","火":"🔥","木":"🌳","土":"🪴","金":"🥇","田":"🌾","石":"🪨","目":"👁️","耳":"👂","牙":"🦷","心":"❤️","雨":"🌧️","雪":"❄️","风":"🌬️","云":"☁️","花":"🌸","草":"🌱","树":"🌲","林":"🌳","森":"🌲","叶":"🍃","果":"🍎","米":"🍚","麦":"🌾","瓜":"🍉","竹":"🎋","鸟":"🐦","鱼":"🐟","马":"🐎","牛":"🐂","羊":"🐑","猪":"🐖","狗":"🐕","猫":"🐈","鸡":"🐓","鸭":"🦆","兔":"🐇","虎":"🐅","龙":"🐉","蛇":"🐍","象":"🐘","鹿":"🦌","虫":"🐛","蝶":"🦋","星":"⭐","天":"🌤️","海":"🌊","河":"🏞️","桥":"🌉","车":"🚗","船":"⛵","门":"🚪","家":"🏠","书":"📚","笔":"✏️","画":"🎨","纸":"📄","校":"🏫","球":"⚽","手":"✋","眼":"👀","春":"🌷","夏":"☀️","秋":"🍂","冬":"⛄","红":"🟥","黄":"🟨","蓝":"🟦","绿":"🟩","笑":"😄","哭":"😢","跑":"🏃","走":"🚶","吃":"🍽️","喝":"🥤","写":"✍️"};
var radicalIcons={"氵":"💧","水":"💧","冫":"🧊","木":"🌳","艹":"🌿","禾":"🌾","火":"🔥","灬":"🔥","日":"☀️","月":"🌙","心":"❤️","忄":"❤️","扌":"✋","目":"👁️","耳":"👂","口":"👄","讠":"💬","言":"💬","亻":"🚶","人":"🚶","女":"👩","子":"🧒","宀":"🏠","广":"🏠","门":"🚪","辶":"🚶","走":"🚶","足":"🦶","车":"🚗","马":"🐎","牛":"🐂","犭":"🐕","鸟":"🐦","虫":"🐛","鱼":"🐟","贝":"🪙","金":"🥇","钅":"🥇","土":"⛰️","山":"⛰️","石":"🪨","王":"💎","玉":"💎","纟":"🧵","衤":"👕","饣":"🍚","疒":"🩺","竹":"🎋","刀":"✂️","刂":"✂️","田":"🌾","雨":"🌧️"};
var chosen={"山":"三座高峰排在一起，观察上升的竖线。","水":"想象水流在中间汇合，又向左右分开。","木":"树干、横枝和树根构成一棵树。","火":"想象中间的火苗和两边飞溅的火星。","休":"一个人倚着树木休息。","林":"两棵树站在一起，组成树林。","森":"三棵树挤成一片茂密的森林。","明":"太阳和月亮都能发光，用图画联想明亮。","众":"几个人聚在一起，就变成人多。","尖":"上面小下面大，像尖尖的铅笔头。","晴":"日字旁让人想到太阳，右边青提供读音线索。","请":"言字旁表示语言，青帮助记住读音。","睛":"目字旁提示眼睛，青帮助记住读音。","清":"三点水提示和水相关，右边青提供读音线索。","家":"想象家人住在一座有屋顶的房子里。"};
var stype={D:"独体",H:"左右",B:"上下",E:"上中下",M:"左中右",Q:"全包围",R:"半包围",A:"品字形"};
var sounds=new Map();
rows.forEach(r=>(r[1]||[]).forEach(p=>{if(!sounds.has(p))sounds.set(p,[]);sounds.get(p).push(r[0]);}));
function item(c){var n=notes[c]||{},r=rows[ix.get(c)]||[c,[],0,""];return {c:c,py:r[1]||[],rad:r[3]||"",stroke:r[2],s:n.s||"",m:n.m||[],sw:n.sw||null,t:n.t||""}}
function svg(d){
 var seed=d.c.codePointAt(0),bg=["#eaf6ec","#eef4ff","#fff3e1","#f5eefc"][seed%4],im=imagery[d.c]||radicalIcons[d.rad]||"✍️",kind=imagery[d.c]?"实物图标":radicalIcons[d.rad]?"部首联想":"字形联想";
 function rect(x,y,w,h,second){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="9" fill="'+(second?"#c2dfed":"#a5dfc0")+'" opacity=".65"/>'}
 var part=rect(23,25,105,105,0),type=d.s.charAt(0);
 if(type==="H")part=rect(23,25,45,105,0)+rect(73,25,55,105,1);
 if(type==="B")part=rect(23,25,105,48,0)+rect(23,79,105,51,1);
 if(type==="M")part=rect(23,25,30,105,0)+rect(57,25,31,105,1)+rect(92,25,36,105,0);
 if(type==="E")part=rect(23,25,105,30,0)+rect(23,60,105,30,1)+rect(23,95,105,35,0);
 if(type==="Q")part='<rect x="24" y="25" width="104" height="105" rx="8" fill="none" stroke="#a4d8bd" stroke-width="13"/>'+rect(50,52,50,50,1);
 return '<svg viewBox="0 0 480 300" role="img" aria-label="'+ex(d.c)+'字的联想示意图"><rect width="480" height="300" rx="22" fill="'+bg+'"/><g transform="translate(28 35)">'+part+'</g><text x="102" y="155" font-size="88" text-anchor="middle" font-weight="700" fill="#287555">'+ex(d.c)+'</text><circle cx="353" cy="108" r="73" fill="#ffffffaa"/><text x="353" y="134" font-size="78" text-anchor="middle">'+im+'</text><rect x="34" y="213" width="412" height="63" rx="14" fill="#ffffffaa"/><text x="50" y="236" font-size="15" fill="#416d52">'+kind+' · '+ex(stype[type]||"结构待核对")+'</text><text x="50" y="259" font-size="19" fill="#365d49">'+ex(d.py.join(" / "))+'</text></svg>'
}
function mnemonic(d){
 if(chosen[d.c])return chosen[d.c];
 if(radicalIcons[d.rad])return '先把部首“'+d.rad+'”和图标联系起来，再观察这个字的'+(stype[d.s[0]]||"整体")+'结构。这是记忆提示，不能仅根据部首判断字义。';
 return '先看“'+d.c+'”的'+(stype[d.s[0]]||"字形")+'结构，再按笔画顺序写一遍。这个字目前没有逐字设计的实物插画。';
}
function homophone(d){
 var py=d.py[0]||"",peer=(sounds.get(py)||[]).find(x=>x!==d.c);
 if(peer)return '“'+ex(d.c)+'”和“'+ex(peer)+'”可以读 '+ex(py)+'。想象把它们画在同一张卡片上，记住相同读音，再区分字形和意思。<small>同音字不代表同义或同源；多音字需要结合词语。</small>';
 return '读作 '+ex(py)+'。暂无适用的同音字示例，可以拆开声母、韵母和声调记音；不编造谐音故事。'
}
function makeCard(c){
 var d=item(c),meaning=d.m.length?d.m.map(x=>'<p><b>'+ex(x[0])+'</b> '+x[1].map(ex).join('；')+'</p>').join(''):'<p>此字暂缺可靠现代释义，请先学习读音与字形。</p>';
 var old=d.sw?'<b>《说文解字》原文：'+ex(d.sw[0])+'</b><blockquote>'+ex(d.sw[1])+'</blockquote><small>古籍解释的是古代文字形义，与现代简化字及现代常用义可能不同。</small>':'<b>《说文解字》参考</b><p>未可靠匹配到该字的古籍原文，不编造字源。</p>';
 return '<div class="szx-explain" data-szx-char="'+ex(c)+'"><div class="szx-two"><div class="szx-drawing">'+svg(d)+'<p><b>图形联想：</b>'+ex(mnemonic(d))+'</p></div><div class="szx-desc"><div><strong>现代字义 · 待人工逐字校验</strong>'+meaning+'<small>来源：开放词典。<a href="https://www.zdic.net/hans/'+encodeURIComponent(c)+'" target="_blank" rel="noopener">对照现代词典</a></small></div><div><strong>谐音记忆</strong><p>'+homophone(d)+'</p></div><div class="szx-classic">'+old+'</div></div></div><div class="szx-toolbar"><button class="subtle-btn szx-test" type="button">遮住字考考自己</button><span class="szx-message"></span></div></div>'
}
var style=document.createElement("style");style.textContent=".szx-explain{border-top:1px solid #e4ebe4;padding-top:16px;margin-top:18px}.szx-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:12px}.szx-drawing{background:#f1f7f2;border-radius:14px;overflow:hidden}.szx-drawing svg{width:100%;height:auto;display:block}.szx-drawing p{padding:10px;font-size:12px;line-height:1.7;margin:0}.szx-desc{display:grid;gap:9px}.szx-desc>div{border:1px solid #e3ebe2;border-radius:12px;padding:11px;font-size:12px;line-height:1.7}.szx-desc strong{display:block;color:#287452}.szx-desc p{margin:5px 0}.szx-desc small{display:block;color:#849387;font-size:11px}.szx-classic{background:#fff9ec}.szx-classic blockquote{border-left:3px solid #e7cf95;padding:7px 10px;margin:7px 0}.szx-toolbar{display:flex;gap:9px;align-items:center;margin-top:10px}.szx-message{font-size:12px;color:#358457}.szx-hide .szx-drawing svg text{opacity:0}.szx-hide .szx-desc{visibility:hidden}.szx-lookup{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px}.szx-lookup input{min-width:120px;flex:1;border:1px solid #dce8dc;padding:10px;border-radius:10px}@media(max-width:740px){.szx-two{grid-template-columns:1fr}.szx-desc>div{font-size:13px}}";document.head.appendChild(style);
function wire(p){p.querySelector(".szx-test").onclick=()=>{var hidden=p.classList.toggle("szx-hide");p.querySelector(".szx-test").textContent=hidden?"显示答案":"遮住字考考自己";p.querySelector(".szx-message").textContent=hidden?"现在读字、说字义、写一遍。":"看看有没有独立记住。"}}
function decorate(){
 var section=app.querySelector(".learning-grid > section"),c=section?.querySelector(".big-char")?.textContent.trim();if(!section||!ix.has(c))return;
 var old=section.querySelector(".szx-explain");if(old?.dataset.szxChar===c)return;if(old)old.remove();
 section.insertAdjacentHTML("beforeend",makeCard(c));wire(section.querySelector(".szx-explain"));
}
var obs=new MutationObserver(()=>{if(app.querySelector(".learning-grid"))decorate()});obs.observe(app,{subtree:true,childList:true});decorate();
var current=ix.get("山")||0;function explore(){
 var c=rows[current][0];app.innerHTML='<section class="panel"><div class="between"><h2>3500字联想图、谐音与说文参考</h2><span class="muted">'+(current+1)+' / '+rows.length+'</span></div><p class="small-note">每个字均可离线生成字形联想图。部分是物象图标，其他是字形示意，并非3500幅独立手绘插画；历史原文只在匹配到来源时显示。</p><div class="szx-lookup"><input id="szx-query" placeholder="输入汉字或拼音"><button class="primary-btn" id="szx-find">查找</button><button class="subtle-btn" id="szx-prev">上一个</button><button class="subtle-btn" id="szx-next">下一个</button></div>'+makeCard(c)+'</section>';
 wire(app.querySelector(".szx-explain"));
 app.querySelector("#szx-prev").onclick=()=>{current=(current+rows.length-1)%rows.length;explore()};
 app.querySelector("#szx-next").onclick=()=>{current=(current+1)%rows.length;explore()};
 function find(){var q=app.querySelector("#szx-query").value.trim();if(ix.has(q))current=ix.get(q);else{var found=q&&rows.findIndex(r=>r[1]?.some(p=>p.toLowerCase().includes(q.toLowerCase())));if(!q||found<0){app.querySelector(".szx-message").textContent="未找到，试试输入汉字或拼音。";return}current=found}explore()}
 app.querySelector("#szx-find").onclick=find;app.querySelector("#szx-query").onkeydown=e=>{if(e.key==="Enter")find()};
}
var btn=document.createElement("button");btn.className="tab";btn.textContent="🎨 字源联想";btn.onclick=()=>{var c=app.querySelector(".big-char")?.textContent.trim();if(ix.has(c))current=ix.get(c);tabs.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");explore()};tabs.appendChild(btn);
})();
