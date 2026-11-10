

(()=>{
"use strict";
const DATA=window.WORDMAP_DATA, BASE=DATA.words, EDGES=DATA.edges, UNITS=DATA.units;
const STORE="wordmap_product_v21", DAY=86400000, INTERVALS=[1,3,7,14,30];
let state=loadState(), currentId=UNITS[0].seed, mode="easy", easyKind="letters", page="practice";
let autoSpeechTimer=null, dictationTimer=null;
let dictation={queue:[],index:0,active:false,paused:false,wrongCounted:false,sessionCorrect:0,sessionWrong:0,sessionAttempts:0,pendingAdvance:false,missedIds:[],firstRoundMissedCount:0,boostRound:false,repeatMistakes:true};
let typed="", tiles=[], used=new Set(), selectedChunks=[], hintUsed=false, completed=false, hadErrorThisAttempt=false, lastBadValue="", autoTimer=null, showChunks=false;
function initialState(){
 const progress={};BASE.forEach(w=>progress[w.id]={unlocked:!!w.seed,level:0,attempts:0,correct:0,wrong:0,easyWins:0,hardWins:0,dueAt:0,lastSeenAt:0});
 return {version:2,progress,customWords:[],customEdges:[],mnemonics:{},settings:{dailyGoal:10,autoSpeak:true,autoSpeakExample:true,speechRate:.8,dictationRepeat:2,dictationRepeatMistakes:true},daily:{date:today(),attempts:0,correct:0,wrong:0}};
}
function loadState(){try{const s=JSON.parse(localStorage.getItem(STORE));if(!s||s.version!==2)return initialState();const f=initialState();f.progress={...f.progress,...(s.progress||{})};f.customWords=Array.isArray(s.customWords)?s.customWords:[];f.customEdges=Array.isArray(s.customEdges)?s.customEdges:[];f.mnemonics=s.mnemonics&&typeof s.mnemonics==="object"?s.mnemonics:{};f.settings={...f.settings,...(s.settings||{})};f.daily=s.daily||f.daily;BASE.forEach(w=>{if(w.seed)f.progress[w.id].unlocked=true;});return f;}catch(e){return initialState();}}
function save(){try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){toast("本机存储空间不足，请先导出备份。");}}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function ensureDay(){if(state.daily.date!==today())state.daily={date:today(),attempts:0,correct:0,wrong:0};}
function allWords(){return [...BASE,...state.customWords];}
function allEdges(){return [...EDGES,...state.customEdges];}
function byId(id){return allWords().find(w=>w.id===id);}
function progress(id){if(!state.progress[id])state.progress[id]={unlocked:false,level:0,attempts:0,correct:0,wrong:0,easyWins:0,hardWins:0,dueAt:0,lastSeenAt:0,pinyinAttempts:0,pinyinCorrect:0,pinyinWrong:0};const p=state.progress[id];p.pinyinAttempts=p.pinyinAttempts||0;p.pinyinCorrect=p.pinyinCorrect||0;p.pinyinWrong=p.pinyinWrong||0;return p;}
function unlocked(w){return !!progress(w.id).unlocked;}
function mastered(w){return progress(w.id).level>=5;}
function due(w){const p=progress(w.id);return p.unlocked&&p.dueAt>0&&p.dueAt<=Date.now()&&!mastered(w);}
function unit(id){return UNITS.find(u=>u.id===byId(id)?.unit);}
function word(){return byId(currentId);}
function letters(w){return w.en.toLowerCase().replace(/[^a-z]/g,"").split("");}
function chunks(w){return w.chunks&&w.chunks.length?w.chunks:[w.en];}
function outgoing(id){return allEdges().filter(e=>e.from===id);}
function neighbors(id){const out=outgoing(id).map(e=>({...e,neighbor:e.to,direction:"解锁"}));const inc=allEdges().filter(e=>e.to===id).map(e=>({...e,neighbor:e.from,direction:"关联"}));const seen=new Set();return [...out,...inc].filter(e=>{if(seen.has(e.neighbor))return false;seen.add(e.neighbor);return true;});}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(msg){const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove("show"),2200);}
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

const MNEMONIC_SEEDS={
 "sport":{pinyin:"sī-bō-tè（近似音）",homophone:"运动场上听到“斯波特”的声音，联想到 sport。",story:"运动员穿好运动服，跑进操场开始训练。",scene:"操场：跑步、跳跃、打球。",structure:"sport 是运动的总称。"},
 "jump":{pinyin:"zhà-mǔ-pǔ（近似音）",homophone:"想象小兔子突然一蹦，马上想到 jump。",story:"小兔子 jump 一下，跳过小水坑。",scene:"操场上的跳远沙坑。",structure:"jump high / jump far 是常见搭配。"},
 "high":{pinyin:"hāi（近似音）",homophone:"把手举得很 high，越举越高。",story:"跳起来摸高处的星星。",scene:"篮球架和跳高杆。",structure:"high 可表示高的，也可表示高高地。"},
 "far":{pinyin:"fā（近似音）",homophone:"风筝飞得 far，飞到很远的地方。",story:"小朋友把风筝放得越来越远。",scene:"远处的山和风筝。",structure:"jump far：跳得远。"},
 "ping-pong":{pinyin:"píng-pāng（近似音）",homophone:"乒乓球来回弹的声音，正好联想到 ping-pong。",story:"小球在球台两边 ping、pong 地弹来弹去。",scene:"体育课的乒乓球桌。",structure:"play ping-pong：打乒乓球。"},
 "volleyball":{pinyin:"wò-lì-bō-ěr（近似音）",homophone:"把 volley 和 ball 连起来，想象排球飞过球网。",story:"队员把 ball 击向对方场地。",scene:"操场上的排球网。",structure:"volley + ball，按词块理解。"},
 "wash":{pinyin:"wò-shí（近似音）",homophone:"洗手时记住 wash，边洗边读。",story:"Wash your hands：饭前认真洗手。",scene:"洗手池和肥皂泡。",structure:"wash hands / wash dishes。"},
 "water":{pinyin:"wò-tè（近似音）",homophone:"拿起 water 给花浇水。",story:"每天给小花 water，它慢慢长高。",scene:"花园和浇水壶。",structure:"water 可作名词“水”，也可作动词“浇水”。"},
 "tidy":{pinyin:"tài-dǐ（近似音）",homophone:"桌面整理得整整齐齐，tidy desk。",story:"把书本、铅笔放回原位，让桌面变 tidy。",scene:"整理前后对比的书桌。",structure:"tidy up：收拾整齐。"},
 "weather":{pinyin:"wèi-dhǔ（近似音）",homophone:"打开天气预报，先问天气 weather。",story:"早上看 weather，再决定带不带雨伞。",scene:"天气预报屏幕。",structure:"What's the weather like?"},
 "sunny":{pinyin:"sǎ-nǐ（近似音）",homophone:"太阳晒得暖洋洋，想起 sunny。",story:"A sunny day：太阳出来，大家去公园。",scene:"蓝天、太阳和草地。",structure:"sun + -ny 的拼写联想；标准读音以朗读为准。"},
 "rainy":{pinyin:"ruèi-nǐ（近似音）",homophone:"rain 下起来，变成 rainy day。",story:"下雨天穿雨衣、撑雨伞。",scene:"窗户上的雨滴。",structure:"rain + y：雨天的。"},
 "snowy":{pinyin:"sī-nō-yī（近似音）",homophone:"snow 覆盖地面，外面变 snowy。",story:"雪花落满操场，大家堆雪人。",scene:"白雪和雪人。",structure:"snow + y：下雪的。"},
 "summer":{pinyin:"sǎ-mò（近似音）",homophone:"想到夏天的太阳和暑假，联想 summer。",story:"Summer vacation：去海边玩水。",scene:"海滩、太阳和冰饮。",structure:"四季词汇之一。"},
 "winter":{pinyin:"wēn-tè（近似音）",homophone:"冬天 wind 很冷，记住 winter。",story:"Winter：戴上围巾、手套去看雪。",scene:"围巾、雪花和热饮。",structure:"四季词汇之一。"},
 "autumn":{pinyin:"ào-tè-mǔ（近似音）",homophone:"秋天树叶变色，联想 autumn。",story:"Autumn leaves：树叶从绿变黄。",scene:"落叶铺满小路。",structure:"英式英语常用 autumn。"},
 "teacher":{pinyin:"tī-chǔ（近似音）",homophone:"teacher 站在讲台上教大家。",story:"老师带大家读单词、做游戏。",scene:"教室和黑板。",structure:"teach + er：教书的人。"},
 "library":{pinyin:"lài-bǔ-rè-rǐ（近似音）",homophone:"想象 library 里有很多书。",story:"走进图书馆，借一本喜欢的书。",scene:"书架、借书卡和阅读桌。",structure:"library：图书馆。"},
 "cinema":{pinyin:"xī-ní-mǎ（近似音）",homophone:"cinema 里看电影，记住这个场所。",story:"周末和家人去 cinema 看电影。",scene:"电影院和大银幕。",structure:"cinema：电影院。"},
 "hospital":{pinyin:"huò-sī-pǐ-tǔ-ěr（近似音）",homophone:"看到医院标志，联想到 hospital。",story:"生病时去 hospital 看医生。",scene:"医院、医生和护士。",structure:"hospital：医院。"},
 "supermarket":{pinyin:"sū-pò-mā-kè-tǔ（近似音）",homophone:"super + market：东西很多的大市场。",story:"推着购物车在 supermarket 买水果。",scene:"货架、购物车和收银台。",structure:"super + market。"},
 "airport":{pinyin:"ài-ěr-bō-tè（近似音）",homophone:"飞机起降的地方就是 airport。",story:"在机场看见飞机，准备出发旅行。",scene:"机场大厅和飞机跑道。",structure:"air + port：航空港。"},
 "tomorrow":{pinyin:"tè-mǎ-rō（近似音）",homophone:"今天之后就是 tomorrow。",story:"把今天的计划写下来，明天继续完成。",scene:"日历上今天的下一格。",structure:"today / tomorrow 对比记忆。"},
 "favourite":{pinyin:"fèi-fó-ruì-tè（近似音）",homophone:"最喜欢的东西就是 favourite。",story:"说出 favourite colour、favourite sport。",scene:"最喜欢的玩具或颜色。",structure:"英式拼写 favourite，美式常写 favorite。"},
 "ice cream":{pinyin:"āi-sī kǔ-rī-mǔ（近似音）",homophone:"ice + cream：冰凉的奶油甜品。",story:"炎热夏天吃一支 ice cream。",scene:"冰淇淋甜品店。",structure:"两个词组成的短语。"},
 "good job":{homophone:"完成任务后，老师说 good job！",story:"孩子认真完成家务，得到一句 good job。",scene:"作业完成后的贴纸奖励。",structure:"表扬别人做得好。"},
 "helpful":{homophone:"help + ful：总愿意提供帮助的人。",story:"同学主动帮忙整理教室，大家说他 helpful。",scene:"同学互相帮助。",structure:"help + -ful。"},
 "rubbish":{homophone:"看到垃圾桶上的标签 rubbish，就想到垃圾。",story:"把 rubbish 扔进垃圾桶，保持房间整洁。",scene:"垃圾桶和分类标志。",structure:"rubbish：垃圾。"},
 "cloudy":{homophone:"cloud 加 y，天空有很多云就是 cloudy。",story:"云朵遮住太阳，今天是 cloudy day。",scene:"灰白色云层。",structure:"cloud + y。"},
 "windy":{homophone:"wind 加 y，风很大就是 windy。",story:"风吹动树叶，风筝飞起来。",scene:"飘动的树叶和风筝。",structure:"wind + y。"},
 "spring":{homophone:"春天万物开始生长，记住 spring。",story:"春天种下一颗种子，等待发芽。",scene:"嫩芽、花朵和草地。",structure:"四季词汇之一。"},
 "bus":{pinyin:"bǎ-sī（近似音）",homophone:"每天乘 bus 去学校。",story:"校车停在站台，孩子排队上车。",scene:"公交车站。",structure:"交通工具词汇。"},
 "car":{pinyin:"kā（近似音）",homophone:"看到 car 就想起汽车。",story:"汽车沿着道路开向公园。",scene:"停车场和道路。",structure:"交通工具词汇。"}
};
let pinyinCurrentId="",pinyinWrongCounted=false,pinyinTimer=null;
let selectedImageWordId="",currentImageResults=[],imageDbPromise=null,practiceImageUrl=null,imagePageUrl=null;
function getMnemonic(w){return Object.assign({},MNEMONIC_SEEDS[w.id]||{},state.mnemonics[w.id]||{});}
function pinyinWords(){const u=document.getElementById("pinyinUnitSelect").value;return allWords().filter(w=>u==="all"||w.unit===u);}
function renderPinyinPage(){
 const list=pinyinWords();if(!list.length){document.getElementById("pinyinWordList").innerHTML="当前单元没有词条。";return;}
 if(!pinyinCurrentId||!list.some(w=>w.id===pinyinCurrentId))pinyinCurrentId=list.find(w=>w.id===currentId)?.id||list[0].id;
 renderPinyinWord();document.getElementById("pinyinWordList").innerHTML=list.map(w=>'<button class="pinyin-word '+(w.id===pinyinCurrentId?'active':'')+'" data-pinyin-word="'+esc(w.id)+'">'+esc(w.en)+'<small>'+esc(w.zh)+'</small></button>').join("");
 document.querySelectorAll("[data-pinyin-word]").forEach(b=>b.onclick=()=>pickPinyinWord(b.dataset.pinyinWord));
}
function pickPinyinWord(id){pinyinCurrentId=id;pinyinWrongCounted=false;clearTimeout(pinyinTimer);renderPinyinPage();document.getElementById("pinyinInput").focus();}
function renderPinyinWord(){
 const w=byId(pinyinCurrentId);if(!w)return;const m=getMnemonic(w);
 document.getElementById("pinyinUnitName").textContent=(unit(w.id)?.title||"自定义词");
 document.getElementById("pinyinMeaning").textContent=w.zh;
 document.getElementById("pinyinEnglishLength").textContent=letters(w).length+" 个字母 · 直接输入英文，不需要提交";
 document.getElementById("pinyinCue").innerHTML=m.pinyin?'<b>拼音近音钩子</b><span>'+esc(m.pinyin)+'</span><small>仅作联想提示，不是英语音标；先听标准英语发音。</small>':'<b>拼音近音钩子尚未填写</b><span>先按下面的拼写块回忆</span><small>可以到“记忆中心”给这个词添加自己的拼音联想。</small>';
 document.getElementById("pinyinChunks").innerHTML=chunks(w).map(c=>'<span class="chunk">'+esc(c.toUpperCase())+'</span>').join("");
 document.getElementById("pinyinInput").value="";document.getElementById("pinyinInput").disabled=false;
 document.getElementById("pinyinFeedback").textContent="看中文和拼音联想，键入英文单词。";
 renderPinyinSlots("","");if(state.settings.autoSpeak!==false)setTimeout(()=>speakText(w.en.replace(/-/g," ")),120);
}
function renderPinyinSlots(raw,target){
 const w=byId(pinyinCurrentId);if(!w)return;target=target||letters(w).join("");let out="";
 for(let i=0;i<target.length;i++){const cls=i<raw.length?(raw[i]===target[i]?"hit":"miss"):"";out+='<span class="pinyin-slot '+cls+'">'+(raw[i]?esc(raw[i].toUpperCase()):"·")+'</span>';}
 document.getElementById("pinyinSlots").innerHTML=out;
 const pct=target.length?Math.round(Math.min(raw.length,target.length)/target.length*100):0;
 document.getElementById("pinyinProgress").style.width=pct+"%";
 document.getElementById("pinyinProgressText").textContent="拼写进度 "+pct+"%";
}
function handlePinyinInput(){
 const w=byId(pinyinCurrentId);if(!w)return;const input=document.getElementById("pinyinInput"),target=letters(w).join(""),raw=input.value.toLowerCase().replace(/[^a-z]/g,"");
 if(input.value!==raw)input.value=raw;renderPinyinSlots(raw,target);
 if(!target.startsWith(raw)){
  if(!pinyinWrongCounted){pinyinWrongCounted=true;const p=progress(w.id);p.pinyinAttempts=(p.pinyinAttempts||0)+1;p.pinyinWrong=(p.pinyinWrong||0)+1;save();}
  document.getElementById("pinyinFeedback").textContent="这里有字母不对，按退格键修改。";document.getElementById("pinyinFeedback").className="feedback bad";return;
 }
 document.getElementById("pinyinFeedback").className="feedback";
 if(raw.length===target.length){
  const p=progress(w.id);if(!pinyinWrongCounted)p.pinyinAttempts=(p.pinyinAttempts||0)+1;p.pinyinCorrect=(p.pinyinCorrect||0)+1;p.lastPinyinAt=Date.now();save();
  document.getElementById("pinyinFeedback").className="feedback good";document.getElementById("pinyinFeedback").textContent="拼对了！"+w.en+" · "+w.zh+"。准备下一个词。";
  input.disabled=true;clearTimeout(pinyinTimer);pinyinTimer=setTimeout(nextPinyinWord,950);
 }else document.getElementById("pinyinFeedback").textContent=raw.length?"继续，已经输入 "+raw.length+" / "+target.length+" 个字母。":"看提示开始拼写。";
}
function nextPinyinWord(){
 const list=pinyinWords();if(!list.length)return;let i=list.findIndex(w=>w.id===pinyinCurrentId);pinyinCurrentId=list[(i+1+list.length)%list.length].id;pinyinWrongCounted=false;renderPinyinPage();document.getElementById("pinyinInput").focus();
}
function renderMemoryPage(){
 const sel=document.getElementById("memoryWordSelect");if(!sel.options.length)sel.innerHTML=allWords().map(w=>'<option value="'+esc(w.id)+'">'+esc(w.en)+' · '+esc(w.zh)+'</option>').join("");
 if(!byId(sel.value))sel.value=currentId;renderMemoryCurve();renderMemoryWord();
}
function renderMemoryCurve(){
 const all=allWords(),dueList=all.filter(due).sort((a,b)=>progress(a.id).dueAt-progress(b.id).dueAt),reviewed=all.filter(w=>progress(w.id).attempts>0).length,done=all.filter(mastered).length;
 document.getElementById("memoryStats").innerHTML='<div class="memory-stat"><b>'+dueList.length+'</b><small>今日到期</small></div><div class="memory-stat"><b>'+reviewed+'</b><small>练习过</small></div><div class="memory-stat"><b>'+done+'</b><small>稳定掌握</small></div><div class="memory-stat"><b>'+all.length+'</b><small>总词条</small></div>';
 document.getElementById("memoryCurve").innerHTML='<svg viewBox="0 0 640 220" role="img" aria-label="记忆保持率示意曲线"><path d="M42 25 C100 35 115 80 190 105 S330 150 590 188" fill="none" stroke="#5578e8" stroke-width="5" stroke-linecap="round"/><path d="M42 25 L42 188 L590 188" fill="none" stroke="#dce4f1" stroke-width="2"/><g fill="#5578e8"><circle cx="42" cy="25" r="6"/><circle cx="135" cy="75" r="5"/><circle cx="230" cy="119" r="5"/><circle cx="330" cy="148" r="5"/><circle cx="450" cy="171" r="5"/><circle cx="590" cy="188" r="5"/></g><g fill="#7b879d" font-size="13"><text x="35" y="210">学习</text><text x="121" y="210">1天</text><text x="216" y="210">3天</text><text x="316" y="210">7天</text><text x="436" y="210">14天</text><text x="575" y="210">30天</text><text x="45" y="17">保持</text></g></svg><p class="memory-note">示意曲线：记忆会随时间衰减，按时主动回忆可以重新巩固。下方复习队列来自本机真实学习记录。</p>';
 document.getElementById("memoryIntervals").innerHTML=[1,3,7,14,30].map((d,i)=>'<span class="interval-chip">第 '+(i+1)+' 轮 · '+d+' 天</span>').join("");
 document.getElementById("memoryDueList").innerHTML=dueList.length?dueList.slice(0,15).map(w=>'<button class="memory-due" data-memory-due="'+esc(w.id)+'"><b>'+esc(w.en)+'</b><small>'+esc(w.zh)+' · '+new Date(progress(w.id).dueAt).toLocaleString()+'</small></button>').join(""):'<p class="memory-note">当前没有到期词。答错的词会进入短期复习，到期后出现在这里。</p>';
 document.querySelectorAll("[data-memory-due]").forEach(b=>b.onclick=()=>setCurrent(b.dataset.memoryDue));
}
function renderMemoryWord(){
 const w=byId(document.getElementById("memoryWordSelect").value);if(!w)return;const m=getMnemonic(w),p=progress(w.id);
 document.getElementById("memoryWordInfo").innerHTML='<b>'+esc(w.en)+'</b><span>'+esc(w.zh)+'</span><small>'+esc(unit(w.id)?.title||"自定义词")+' · 掌握等级 '+p.level+'/5</small>';
 document.getElementById("memoryChunks").innerHTML=chunks(w).map(c=>'<span class="chunk">'+esc(c.toUpperCase())+'</span>').join("");
 document.getElementById("memoryPinyin").value=m.pinyin||"";document.getElementById("memoryHomophone").value=m.homophone||"";
 document.getElementById("memoryStory").value=m.story||"";document.getElementById("memoryScene").value=m.scene||"";document.getElementById("memoryStructure").value=m.structure||"";
}
function saveMnemonic(){
 const id=document.getElementById("memoryWordSelect").value;if(!byId(id))return;
 state.mnemonics[id]={pinyin:document.getElementById("memoryPinyin").value.trim(),homophone:document.getElementById("memoryHomophone").value.trim(),story:document.getElementById("memoryStory").value.trim(),scene:document.getElementById("memoryScene").value.trim(),structure:document.getElementById("memoryStructure").value.trim(),updatedAt:Date.now()};
 save();toast("这张记忆卡已保存在本机。");if(pinyinCurrentId===id&&page==="pinyin")renderPinyinWord();
}
function openImageDB(){
 if(!("indexedDB" in window))return Promise.reject(new Error("浏览器不支持 IndexedDB"));
 if(imageDbPromise)return imageDbPromise;
 imageDbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open("wordmap_images_v1",1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains("images"))db.createObjectStore("images",{keyPath:"wordId"});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error("打开图片缓存失败"));});
 return imageDbPromise;
}
function putImageRecord(record){return openImageDB().then(db=>new Promise((resolve,reject)=>{const tx=db.transaction("images","readwrite");tx.objectStore("images").put(record);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error);}));}
function getImageRecord(id){return openImageDB().then(db=>new Promise((resolve,reject)=>{const req=db.transaction("images","readonly").objectStore("images").get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);}));}
function getAllImageRecords(){return openImageDB().then(db=>new Promise((resolve,reject)=>{const req=db.transaction("images","readonly").objectStore("images").getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);}));}
function stripHtml(s){const el=document.createElement("div");el.innerHTML=s||"";return (el.textContent||el.innerText||"").trim();}
async function renderWordImagePreview(){
 const host=document.getElementById("wordImagePreview");if(!host)return;const id=currentId,w=byId(id);if(!w)return;
 host.innerHTML='<div class="word-image-empty">本机图片缓存：检查中…</div>';
 try{const rec=await getImageRecord(id);if(currentId!==id)return;if(rec&&rec.blob){if(practiceImageUrl)URL.revokeObjectURL(practiceImageUrl);practiceImageUrl=URL.createObjectURL(rec.blob);host.innerHTML='<img src="'+practiceImageUrl+'" alt="'+esc(w.en)+'" loading="lazy"><small>'+esc(rec.license||"许可信息待核验")+' · <a href="'+esc(rec.page||"#")+'" target="_blank" rel="noopener">图片来源</a></small>';}else host.innerHTML='<div class="word-image-empty">还没有缓存图片。联网后可自动搜索，保存后断网也能看。</div>';}
 catch(e){host.innerHTML='<div class="word-image-empty">图片缓存暂不可用；文字、拼写和复习不受影响。</div>';}
}
async function renderImagePage(autoSearch){
 const sel=document.getElementById("imageWordSelect");if(!sel.options.length)sel.innerHTML=allWords().map(w=>'<option value="'+esc(w.id)+'">'+esc(w.en)+' · '+esc(w.zh)+'</option>').join("");
 if(!selectedImageWordId||!byId(selectedImageWordId))selectedImageWordId=currentId;sel.value=selectedImageWordId;
 await renderCachedImage();if(autoSearch!==false)searchCommonsImages();
}
async function renderCachedImage(){
 const host=document.getElementById("imageCachedPreview"),w=byId(selectedImageWordId);if(!host||!w)return;
 host.innerHTML='<p class="memory-note">正在检查本机图片缓存…</p>';
 try{const rec=await getImageRecord(w.id);if(imagePageUrl)URL.revokeObjectURL(imagePageUrl);imagePageUrl=null;
  if(rec&&rec.blob){imagePageUrl=URL.createObjectURL(rec.blob);host.innerHTML='<img class="cached-image" src="'+imagePageUrl+'" alt="'+esc(w.en)+'"><div class="image-attribution">已缓存 · '+esc(rec.license||"许可信息待核验")+' · '+esc(rec.artist||"作者未标注")+' · <a href="'+esc(rec.page||"#")+'" target="_blank" rel="noopener">查看原始页面</a></div>';}
  else host.innerHTML='<div class="image-empty">该词还没有离线图片。联网搜索后点击“保存到本机”。</div>';
 }catch(e){host.innerHTML='<div class="image-empty">本机图片库暂不可用：'+esc(e.message||"未知错误")+'</div>';}
}
async function searchCommonsImages(){
 const w=byId(selectedImageWordId);if(!w)return;const status=document.getElementById("imageSearchStatus"),host=document.getElementById("imageResults");
 status.textContent="正在 Wikimedia Commons 搜索图片…";host.innerHTML="";
 if(navigator.onLine===false){status.textContent="当前离线。可以查看已缓存图片，联网后再搜索。";return;}
 try{
  const params=new URLSearchParams({action:"query",generator:"search",gsrsearch:w.en.replace(/-/g," "),gsrnamespace:"6",gsrlimit:"8",prop:"imageinfo",iiprop:"url|extmetadata",iiurlwidth:"480",iiextmetadatafilter:"LicenseShortName|Artist|Credit|UsageTerms",format:"json",origin:"*"});
  const response=await fetch("https://commons.wikimedia.org/w/api.php?"+params.toString(),{headers:{Accept:"application/json"}});
  if(!response.ok)throw new Error("图片搜索服务返回 "+response.status);
  const json=await response.json(),pages=Object.values(json.query?.pages||{});
  currentImageResults=pages.map(p=>{const ii=p.imageinfo&&p.imageinfo[0],meta=ii?.extmetadata||{};return ii&&ii.thumburl?{title:p.title.replace(/^File:/,""),thumburl:ii.thumburl,page:ii.descriptionurl||"",license:stripHtml(meta.LicenseShortName?.value)||"许可信息未标注",artist:stripHtml(meta.Artist?.value||meta.Credit?.value)||"作者未标注"}:null;}).filter(Boolean);
  if(!currentImageResults.length){status.textContent="没有找到可显示的图片。可以换一个词或稍后重试。";return;}
  status.textContent="找到 "+currentImageResults.length+" 张图片。优先选择许可清楚、含义准确的图片。";
  host.innerHTML=currentImageResults.map((im,i)=>'<article class="image-result"><img src="'+esc(im.thumburl)+'" alt="'+esc(im.title)+'" loading="lazy"><div class="image-result-body"><b>'+esc(im.title)+'</b><small>'+esc(im.license)+' · '+esc(im.artist)+'</small><a href="'+esc(im.page)+'" target="_blank" rel="noopener">查看来源与许可</a><button class="soft" data-cache-image="'+i+'">保存到本机离线图片库</button></div></article>').join("");
  document.querySelectorAll("[data-cache-image]").forEach(b=>b.onclick=()=>cacheImageByIndex(Number(b.dataset.cacheImage)));
 }catch(e){status.textContent="联网搜索失败："+(e.message||"网络或 CORS 限制")+". 已缓存图片仍可离线使用。";}
}
async function cacheImageByIndex(index){
 const im=currentImageResults[index],w=byId(selectedImageWordId);if(!im||!w)return;
 try{const response=await fetch(im.thumburl,{mode:"cors"});if(!response.ok)throw new Error("图片下载失败 "+response.status);const blob=await response.blob();if(!blob.type.startsWith("image/"))throw new Error("返回内容不是图片");
  await putImageRecord({wordId:w.id,blob,title:im.title,page:im.page,license:im.license,artist:im.artist,savedAt:Date.now()});
  toast("图片已保存到本机，断网后仍可查看。");await renderCachedImage();if(currentId===w.id)renderWordImagePreview();
 }catch(e){toast("图片未能缓存："+(e.message||"浏览器限制"));}}
function blobToDataURL(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});}
function dataURLToBlob(data){const parts=data.split(","),mime=(parts[0].match(/:(.*?);/)||[])[1]||"image/jpeg",bin=atob(parts[1]),arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return new Blob([arr],{type:mime});}
async function exportImagePack(){
 try{const records=await getAllImageRecords();if(!records.length){toast("本机还没有缓存图片。");return;}
  const images=[];for(const r of records)images.push({wordId:r.wordId,title:r.title,page:r.page,license:r.license,artist:r.artist,data:await blobToDataURL(r.blob)});
  const blob=new Blob([JSON.stringify({app:"WordMapImages",version:1,exportedAt:new Date().toISOString(),images},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="WordMap-离线图片包.json";a.click();URL.revokeObjectURL(a.href);toast("已导出 "+images.length+" 张缓存图片。");
 }catch(e){toast("图片包导出失败："+(e.message||"未知错误"));}}
async function importImagePack(e){
 const file=e.target.files?.[0];if(!file)return;try{const pack=JSON.parse(await file.text());if(pack.app!=="WordMapImages"||!Array.isArray(pack.images))throw new Error("文件格式不正确");
  for(const x of pack.images){if(!byId(x.wordId)||!x.data)continue;await putImageRecord({wordId:x.wordId,blob:dataURLToBlob(x.data),title:x.title||"",page:x.page||"",license:x.license||"",artist:x.artist||"",savedAt:Date.now()});}
  toast("离线图片包导入完成。");await renderCachedImage();renderWordImagePreview();
 }catch(err){toast("导入失败："+(err.message||"图片包无效"));}e.target.value="";
}

function setPage(next){
 if(page==="dictation"&&next!=="dictation"&&dictation.active)stopDictation(false);
 if(page==="practice"&&next!=="practice"){clearTimeout(autoSpeechTimer);if("speechSynthesis" in window)speechSynthesis.cancel();}
 if(next!=="pinyin")clearTimeout(pinyinTimer);page=next;["practice","dictation","pinyin","images","memory","map","parent"].forEach(id=>document.getElementById(id+"Page").classList.toggle("hidden",id!==next));
 document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===next));
 if(next==="map")renderMap();if(next==="parent")renderParent();if(next==="practice")renderPractice();if(next==="dictation")renderDictationPage();if(next==="pinyin")renderPinyinPage();if(next==="images"){selectedImageWordId=currentId;renderImagePage(true);}if(next==="memory")renderMemoryPage();window.dispatchEvent(new CustomEvent("wordmap:page",{detail:{page:next}}));
}
document.querySelectorAll(".nav button").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.page)));
document.getElementById("easyMode").onclick=()=>setMode("easy");
document.getElementById("hardMode").onclick=()=>setMode("hard");
document.getElementById("letterKind").onclick=()=>{easyKind="letters";typed="";used=new Set();selectedChunks=[];tiles=shuffle(letters(word()).map((ch,i)=>({ch,id:i})));renderPractice();};
document.getElementById("chunkKind").onclick=()=>{easyKind="chunks";typed="";used=new Set();selectedChunks=[];tiles=shuffle(chunks(word()).map((ch,i)=>({ch,id:i})));renderPractice();};
document.getElementById("hintBtn").onclick=hint;
document.getElementById("chunksBtn").onclick=()=>{showChunks=!showChunks;renderPractice();};
document.getElementById("speakBtn").onclick=speak;
document.getElementById("speakExampleBtn").onclick=speakExample;
document.getElementById("autoSpeakToggle").onclick=()=>{state.settings.autoSpeak=!state.settings.autoSpeak;save();renderPractice();};
document.getElementById("mapCurrentBtn").onclick=()=>setPage("map");
document.getElementById("wordImageBtn").onclick=()=>{selectedImageWordId=currentId;setPage("images");};
document.getElementById("wordMemoryBtn").onclick=()=>{document.getElementById("memoryWordSelect").value=currentId;setPage("memory");};
document.getElementById("pinyinUnitSelect").onchange=()=>{pinyinCurrentId="";renderPinyinPage();};
document.getElementById("pinyinInput").addEventListener("input",handlePinyinInput);
document.getElementById("pinyinInput").addEventListener("keydown",e=>{if(e.key==="Enter")e.preventDefault();});
document.getElementById("pinyinSpeakBtn").onclick=()=>{const w=byId(pinyinCurrentId);if(w)speakText(w.en.replace(/-/g," "));};
document.getElementById("pinyinNextBtn").onclick=nextPinyinWord;
document.getElementById("imageWordSelect").onchange=e=>{selectedImageWordId=e.target.value;renderImagePage(true);};
document.getElementById("imageSearchBtn").onclick=searchCommonsImages;
document.getElementById("imageExportBtn").onclick=exportImagePack;
document.getElementById("imageImportInput").onchange=importImagePack;
document.getElementById("memoryWordSelect").onchange=renderMemoryWord;
document.getElementById("saveMnemonicBtn").onclick=saveMnemonic;
document.getElementById("memoryReviewBtn").onclick=startDueReview;
document.getElementById("memoryToPracticeBtn").onclick=()=>{const id=document.getElementById("memoryWordSelect").value;if(unlocked(byId(id)))setCurrent(id);else toast("这个词尚未解锁，可先在记忆中心保存联想卡。");};
document.getElementById("reviewBtn").onclick=startDueReview;
document.getElementById("unitSelect").onchange=e=>startUnit(e.target.value);
document.getElementById("addCustomBtn").onclick=addCustom;
document.getElementById("exportBtn").onclick=exportBackup;
document.getElementById("importFile").onchange=importBackup;
document.getElementById("clearBtn").onclick=clearData;
document.getElementById("dailyGoal").onchange=e=>{state.settings.dailyGoal=Math.max(1,Math.min(50,Number(e.target.value)||10));save();renderStats();};
document.getElementById("autoSpeakSetting").onchange=e=>{state.settings.autoSpeak=e.target.checked;save();if(page==="practice")scheduleAutoSpeak();};
document.getElementById("autoExampleSetting").onchange=e=>{state.settings.autoSpeakExample=e.target.checked;save();};
document.getElementById("speechRateSetting").onchange=e=>{state.settings.speechRate=Number(e.target.value)||.8;save();};
document.getElementById("dictationRepeat").onchange=e=>{state.settings.dictationRepeat=Number(e.target.value)||2;save();};
document.getElementById("dictationRepeatMistakes").onchange=e=>{state.settings.dictationRepeatMistakes=e.target.checked;save();};
document.getElementById("dictationRate").onchange=e=>{state.settings.speechRate=Number(e.target.value)||.8;document.getElementById("speechRateSetting").value=e.target.value;save();};
document.getElementById("dictationStart").onclick=startDictation;
document.getElementById("dictationPause").onclick=toggleDictationPause;
document.getElementById("dictationReplay").onclick=()=>dictationSpeakCurrent();
document.getElementById("dictationStop").onclick=stopDictation;
document.getElementById("dictationInput").addEventListener("input",handleDictationInput);
document.getElementById("dictationInput").addEventListener("keydown",e=>{if(e.key==="Enter")e.preventDefault();});
if("speechSynthesis" in window){speechSynthesis.onvoiceschanged=updateVoiceStatus;setTimeout(updateVoiceStatus,200);}
const keyboard=document.getElementById("keyboardInput");
keyboard.addEventListener("input",handleKeyboard);
keyboard.addEventListener("keydown",e=>{if(e.key==="Enter")e.preventDefault();});
function setMode(m){mode=m;typed="";used=new Set();selectedChunks=[];hintUsed=false;completed=false;hadErrorThisAttempt=false;lastBadValue="";if(m==="easy")tiles=shuffle((easyKind==="chunks"?chunks(word()):letters(word())).map((ch,i)=>({ch,id:i})));document.getElementById("easyMode").classList.toggle("active",m==="easy");document.getElementById("hardMode").classList.toggle("active",m==="hard");renderPractice();if(m==="hard")setTimeout(()=>keyboard.focus(),50);}
function setCurrent(id){const w=byId(id);if(!w)return;if(!unlocked(w)){toast("先完成相连的词，再来解锁它。");return;}clearTimeout(autoTimer);clearTimeout(autoSpeechTimer);if("speechSynthesis" in window)speechSynthesis.cancel();currentId=id;typed="";used=new Set();selectedChunks=[];hintUsed=false;completed=false;hadErrorThisAttempt=false;lastBadValue="";tiles=shuffle((easyKind==="chunks"?chunks(w):letters(w)).map((ch,i)=>({ch,id:i})));setPage("practice");window.dispatchEvent(new CustomEvent("wordmap:current",{detail:{id:currentId,word:word()}}));}
function startUnit(unitId){const u=UNITS.find(x=>x.id===unitId);if(!u)return;const w=BASE.find(x=>x.unit===unitId&&unlocked(x)&&!mastered(x))||byId(u.seed);setCurrent(w.id);}
function startDueReview(){const list=allWords().filter(due).sort((a,b)=>progress(a.id).dueAt-progress(b.id).dueAt);if(!list.length){toast("今天没有到期复习词。可以继续探索新词。");return;}setCurrent(list[0].id);toast(`进入到期复习：${list.length} 个词待复习。`);}
function renderPractice(){
 const w=word(),u=unit(currentId),p=progress(currentId);
 document.getElementById("wordEmoji").textContent=w.emoji||"🔤";
 document.getElementById("meaning").textContent=w.zh;
 document.getElementById("unitTitle").textContent=u?u.title:"家长自定义词库";
 document.getElementById("wordMeta").textContent=`${w.en.length} 个字符 · ${u?u.name:"自定义"} · ${w.curriculumLevel==="teaching_aid_candidate"?"教辅补充·待教材核验 · ":""}${mastered(w)?"稳定掌握":p.level>0?"复习中":"新词"}`;
 document.getElementById("chunkRow").classList.toggle("hidden",!showChunks);
 document.getElementById("chunkRow").innerHTML=chunks(w).map(c=>`<span class="chunk">${esc(c.toUpperCase())}</span>`).join("");
 document.getElementById("chunksBtn").textContent=showChunks?"隐藏拼写块":"显示拼写块";
 document.getElementById("autoSpeakToggle").textContent=state.settings.autoSpeak?"自动朗读：开":"自动朗读：关";
 document.getElementById("answerLabel").textContent=mode==="hard"?"直接用键盘输入，逐字母判断，不需要提交":easyKind==="letters"?"按顺序点击字母，拼出英文单词":"按顺序点击拼写块，组合成完整单词";
 document.getElementById("tileArea").classList.toggle("hidden",mode!=="easy");
 document.getElementById("keyboardArea").classList.toggle("hidden",mode!=="hard");
 document.getElementById("easySubmode").classList.toggle("hidden",mode!=="easy");
 document.getElementById("tipText").textContent=mode==="easy"?(easyKind==="letters"?"点错不会显示正确字母，再观察中文和拼写提示。":"点击拼写块，理解单词由哪些部分组成。"):"可以用退格键修改。提示后答对不计入稳定掌握进度。";
 document.getElementById("letterKind").classList.toggle("active",easyKind==="letters");
 document.getElementById("chunkKind").classList.toggle("active",easyKind==="chunks");
 if(mode==="easy"){
  const parts=easyKind==="chunks"?chunks(w):letters(w);
  if(!tiles.length)tiles=shuffle(parts.map((ch,i)=>({ch,id:i})));
  document.getElementById("tileArea").innerHTML=tiles.map((t,i)=>`<button class="tile ${used.has(t.id)?"used":""}" data-tile="${i}" ${used.has(t.id)?"disabled":""}>${esc(t.ch.toUpperCase())}</button>`).join("");
  document.querySelectorAll("[data-tile]").forEach(b=>b.addEventListener("click",()=>clickTile(Number(b.dataset.tile))));
 }else keyboard.value=typed;
 renderSlots();renderSide();renderStats();renderExamples();renderWordImagePreview();scheduleAutoSpeak();
}
function renderSlots(badIndex=-1,badChar=""){
 const w=word(),target=letters(w),area=document.getElementById("assembled");
 let html="",idx=0;
 for(const c of w.en){if(!/[a-z]/i.test(c)){html+=`<span class="hyphen">${c===' '?'<span style="display:inline-block;width:13px"></span>':esc(c)}</span>`;continue;}let val=typed[idx]||"";const bad=idx===badIndex;if(bad)val=badChar;html+=`<span class="slot ${val?"":"empty"} ${bad?"bad":""}">${val?esc(val.toUpperCase()):"·"}</span>`;idx++;}
 area.innerHTML=html;
 const pct=Math.round(Math.min(typed.length,target.length)/target.length*100);
 document.getElementById("wordProgress").style.width=pct+"%";document.getElementById("wordProgressLabel").textContent=`拼写进度 ${pct}%`;
}
function countError(){hadErrorThisAttempt=true;
 const p=progress(currentId),now=Date.now();p.wrong++;p.attempts++;p.dueAt=now+4*60*60*1000;state.daily.wrong++;state.daily.attempts++;save();renderStats();
}
function clickTile(i){
 if(completed)return;const t=tiles[i];if(!t||used.has(t.id))return;
 if(easyKind==="letters"){
  const expected=letters(word())[typed.length];
  if(t.ch.toLowerCase()===expected){typed+=t.ch.toLowerCase();used.add(t.id);renderSlots();if(typed.length===letters(word()).length)complete(true);}
  else{countError();document.getElementById("feedback").className="feedback bad";document.getElementById("feedback").textContent="这个位置不对，再观察一下。";const b=document.querySelector(`[data-tile="${i}"]`);if(b){b.classList.add("bad");setTimeout(()=>b.classList.remove("bad"),300);}}
 }else{
  const expected=chunks(word())[typedChunkCount()];
  if(t.ch.toLowerCase()===expected.toLowerCase()){typed+=t.ch.toLowerCase();used.add(t.id);selectedChunks.push(t.ch);renderChunkSlots();if(used.size===chunks(word()).length)complete(true);}
  else{countError();document.getElementById("feedback").className="feedback bad";document.getElementById("feedback").textContent="拼写块顺序不对，再想一想。";const b=document.querySelector(`[data-tile="${i}"]`);if(b){b.classList.add("bad");setTimeout(()=>b.classList.remove("bad"),300);}}
 }
}
function typedChunkCount(){return used.size;}
function renderChunkSlots(){
 const area=document.getElementById("assembled"),arr=chunks(word()),selected=selectedChunks;
 area.innerHTML=arr.map((c,i)=>`<span class="slot ${i<selected.length?"":"empty"}" style="width:auto;min-width:40px;padding:0 6px">${i<selected.length?esc(selected[i].toUpperCase()):"·"}</span>`).join('<span class="hyphen">+</span>');
 const pct=Math.round(selected.length/arr.length*100);document.getElementById("wordProgress").style.width=pct+"%";document.getElementById("wordProgressLabel").textContent=`拼写块进度 ${pct}%`;
}
function handleKeyboard(){
 if(mode!=="hard"||completed)return;const target=letters(word()).join("");
 const raw=keyboard.value.toLowerCase().replace(/[^a-z]/g,"").slice(0,target.length);
 if(raw!==keyboard.value)keyboard.value=raw;typed=raw;
 let bad=-1;for(let i=0;i<raw.length;i++){if(raw[i]!==target[i]){bad=i;break;}}
 if(bad>=0){if(raw!==lastBadValue){countError();lastBadValue=raw;}document.getElementById("feedback").className="feedback bad";document.getElementById("feedback").textContent="这里有一个字母不对，按退格键修改。";renderSlots(bad,raw[bad]);return;}
 lastBadValue="";document.getElementById("feedback").className="feedback";document.getElementById("feedback").textContent=raw.length?"继续，拼对的字母会保留。":"";renderSlots();if(raw.length===target.length)complete(false);
}
function unlockChildren(fromId=currentId){
 const opened=[];outgoing(fromId).forEach(e=>{const p=progress(e.to);if(!p.unlocked){p.unlocked=true;opened.push(byId(e.to));}});return opened.filter(Boolean);
}
function complete(isEasy){
 if(completed)return;completed=true;const w=word(),p=progress(currentId),now=Date.now();
 p.correct++;p.attempts++;p.lastSeenAt=now;state.daily.correct++;state.daily.attempts++;
 if(isEasy)p.easyWins++;
 else{
  p.hardWins++;
  if(!hintUsed&&!hadErrorThisAttempt&&(p.level===0||now>=p.dueAt)){p.level=Math.min(5,p.level+1);p.dueAt=now+INTERVALS[Math.min(p.level-1,INTERVALS.length-1)]*DAY;}
  else if(hintUsed&&(!p.dueAt||p.dueAt<now))p.dueAt=now+DAY;
 }
 const opened=unlockChildren();save();renderStats();renderSide();renderMapIfVisible();
 const msg=isEasy?"拼对了！关联词已解锁。":hintUsed?"拼对了，但使用了提示。下次无提示回忆才推进掌握进度。":p.level>=5?"完成五轮间隔回忆，这个词已稳定掌握。":`拼对了！无提示回忆进度 ${p.level}/5。${opened.length?`新解锁 ${opened.length} 个关联词。`:"继续巩固。"}`;
 document.getElementById("feedback").className="feedback good";document.getElementById("feedback").textContent=msg;
 document.querySelectorAll(".tile").forEach(b=>b.disabled=true);keyboard.blur();autoTimer=setTimeout(nextWord,1150);
}
function nextWord(){
 let next=allWords().filter(due).sort((a,b)=>progress(a.id).dueAt-progress(b.id).dueAt)[0];
 if(!next)next=outgoing(currentId).map(e=>byId(e.to)).filter(w=>w&&unlocked(w)&&!mastered(w)).sort((a,b)=>progress(a.id).attempts-progress(b.id).attempts)[0];
 if(!next)next=allWords().filter(w=>w.unit===word().unit&&unlocked(w)&&!mastered(w)&&w.id!==currentId).sort((a,b)=>progress(a.id).attempts-progress(b.id).attempts)[0];
 if(!next)next=allWords().filter(w=>unlocked(w)&&!mastered(w)&&w.id!==currentId).sort((a,b)=>progress(a.id).attempts-progress(b.id).attempts)[0];
 if(!next)next=allWords().find(w=>unlocked(w)&&w.id!==currentId)||word();setCurrent(next.id);
}
function hint(){hintUsed=true;document.getElementById("feedback").className="feedback";document.getElementById("feedback").textContent=`提示：第一个字母是 ${letters(word())[0].toUpperCase()}。想想它的发音和拼写。`;}
function speechRate(){return Math.max(.55,Math.min(1.2,Number(state.settings.speechRate)||.8));}
function updateVoiceStatus(){
 const el=document.getElementById("dictationVoiceStatus");if(!el)return;
 if(!( "speechSynthesis" in window)){el.textContent="浏览器不支持语音";el.className="dictation-badge bad";return;}
 const voices=speechSynthesis.getVoices()||[],en=voices.filter(v=>/^en([-_]|$)/i.test(v.lang)),local=en.find(v=>v.localService);
 if(local){el.textContent="已发现本机英语语音";el.className="dictation-badge good";}
 else if(en.length){el.textContent="发现英语语音，离线状态未知";el.className="dictation-badge";}
 else{el.textContent="未发现英语语音包";el.className="dictation-badge bad";}
}
function speakText(text,lang="en-GB",onend){
 if(!( "speechSynthesis" in window)){toast("当前浏览器不支持语音朗读。");return false;}
 try{const u=new SpeechSynthesisUtterance(String(text||"").replace(/-/g," "));u.lang=lang;u.rate=speechRate();
  const voices=speechSynthesis.getVoices()||[],matches=voices.filter(v=>/^en([-_]|$)/i.test(v.lang));u.voice=matches.find(v=>v.localService)||matches[0]||null;
  u.onend=()=>{if(typeof onend==="function")onend();};u.onerror=()=>updateVoiceStatus();speechSynthesis.speak(u);return true;
 }catch(e){updateVoiceStatus();toast("本机英语语音暂不可用。");return false;}
}
function speakSequence(texts){
 if(!( "speechSynthesis" in window)){toast("当前浏览器不支持语音朗读。");return;}
 speechSynthesis.cancel();const queue=(texts||[]).filter(Boolean);let i=0;
 const play=()=>{if(i>=queue.length)return;const t=queue[i++];speakText(t,"en-GB",()=>{if(i<queue.length)setTimeout(play,350);});};play();
}
function speak(){if("speechSynthesis" in window){speechSynthesis.cancel();speakText(word().en);}else toast("当前浏览器没有语音朗读能力。");}
function speakExample(){const ex=(word().practiceExamples||[])[0];if(ex){if("speechSynthesis" in window)speechSynthesis.cancel();speakText(ex.text);}else toast("这个词还没有例句。");}
function scheduleAutoSpeak(){
 clearTimeout(autoSpeechTimer);if(!state.settings.autoSpeak||page!=="practice")return;const id=currentId;
 autoSpeechTimer=setTimeout(()=>{if(page!=="practice"||currentId!==id)return;const w=word(),texts=[w.en];if(state.settings.autoSpeakExample&&(w.practiceExamples||[])[0])texts.push(w.practiceExamples[0].text);speakSequence(texts);},420);
}
function renderExamples(){
 const w=word(),host=document.getElementById("examplesContent");if(!host)return;
 const textbook=w.textbookExamples||[],exam=w.examExamples||[],practiceList=w.practiceExamples||[];let html="";
 if(w.curriculumLevel==="teaching_aid_candidate"){
   html+=`<div class="example-card" style="grid-column:1/-1;border-color:#f1d6ac;background:#fffaf2"><div class="example-head"><b>教辅补充词／短语，待课本核验</b><span class="example-tag pending">非官方完整词表</span></div><p class="example-muted">${esc(w.status||"")} · <a href="${esc(w.sourceUrl||"#")}" target="_blank" rel="noopener">查看参考教辅资料</a></p></div>`;
 }
 html+=`<div class="example-card textbook"><div class="example-head"><b>课本原句</b><span class="example-tag ${textbook.length?"source":"pending"}">${esc(w.textbookStatus||"待核验")}</span></div>`;
 if(textbook.length){html+=textbook.map(x=>`<p class="example-en">${esc(x.text)}</p><p class="example-zh">${esc(x.translation||"")}</p><small>${esc(x.page||"课本位置待补")} · <a href="${esc(x.sourceUrl||"#")}" target="_blank" rel="noopener">查看电子课本来源</a></small>`).join("");html+=`<p class="example-muted">${esc(w.textbookNote||"建议与纸质课本复核。")}</p>`;}
 else html+=`<p class="example-muted">${esc(w.textbookNote||"尚未录入可核验的课本原句。")}</p>`;html+=`</div>`;
 if(exam.length){html+=`<div class="example-card exam"><div class="example-head"><b>公开配套试卷摘句</b><span class="example-tag source">有来源</span></div>`;
 html+=exam.map((x,i)=>`<div class="example-item"><p class="example-en">${esc(x.text)}</p><p class="example-zh">${esc(x.translation||"")}</p><div class="example-source">${esc(x.questionType||"试题")} · ${esc(x.sourceTitle||"来源待补")} <a href="${esc(x.sourceUrl||"#")}" target="_blank" rel="noopener">查看来源</a></div><button class="mini-speak" data-exam-speak="${i}">🔊 朗读</button></div>`).join("");
 html+=`<p class="example-muted">说明：摘句来自第三方公开配套练习/试卷预览，部分文字经 OCR 校正，不等同于教育部门统一统考真题。</p></div>`;
 }else html+=`<div class="example-card exam"><div class="example-head"><b>公开配套试卷摘句</b><span class="example-tag pending">暂无已核验来源</span></div><p class="example-muted">暂未找到可确认来源的该词试卷原句。这里不会把原创句冒充真题。</p></div>`;
 if(practiceList.length){html+=`<div class="example-card practice-example"><div class="example-head"><b>拓展练习例句</b><span class="example-tag original">原创</span></div>`;
 html+=practiceList.map((x,i)=>`<div class="example-item"><p class="example-en">${esc(x.text)}</p><p class="example-zh">${esc(x.translation||"")}</p><button class="mini-speak" data-practice-speak="${i}">🔊 朗读</button></div>`).join("");html+=`</div>`;}
 host.innerHTML=html;
 document.querySelectorAll("[data-exam-speak]").forEach(b=>b.onclick=()=>{const x=exam[Number(b.dataset.examSpeak)];if(x){if("speechSynthesis" in window)speechSynthesis.cancel();speakText(x.text);}});
 document.querySelectorAll("[data-practice-speak]").forEach(b=>b.onclick=()=>{const x=practiceList[Number(b.dataset.practiceSpeak)];if(x){if("speechSynthesis" in window)speechSynthesis.cancel();speakText(x.text);}});
}
function renderDictationPage(){
 updateVoiceStatus();const active=dictation.active;
 document.getElementById("dictationPause").disabled=!active;document.getElementById("dictationReplay").disabled=!active;document.getElementById("dictationStop").disabled=!active;
 document.getElementById("dictationStart").disabled=active;document.getElementById("dictationPause").textContent=dictation.paused?"继续":"暂停";
}
function dictationCurrent(){return dictation.queue[dictation.index]||null;}
function startDictation(){
 stopDictation(false);const unitId=document.getElementById("dictationUnit").value,scope=document.getElementById("dictationScope").value;let pool=allWords().slice();
 if(["unit","unitWrong","due"].includes(scope)&&unitId!=="all")pool=pool.filter(w=>w.unit===unitId);
 if(scope==="unitWrong"||scope==="wrong")pool=pool.filter(w=>progress(w.id).wrong>0);
 else if(scope==="due")pool=pool.filter(due);
 else if(scope==="unmastered")pool=pool.filter(w=>!mastered(w));
 if(!pool.length){document.getElementById("dictationFeedback").textContent=scope==="due"?"当前没有到期复习词。":"这个范围里没有单词。";return;}
 dictation={queue:shuffle(pool),index:0,active:true,paused:false,wrongCounted:false,sessionCorrect:0,sessionWrong:0,sessionAttempts:0,pendingAdvance:false,missedIds:[],firstRoundMissedCount:0,boostRound:false,repeatMistakes:document.getElementById("dictationRepeatMistakes").checked};
 document.getElementById("dictationSummary").textContent="";renderDictationPage();nextDictationWord();
}
function nextDictationWord(){
 clearTimeout(dictationTimer);if(!dictation.active||dictation.paused)return;
 if(dictation.index>=dictation.queue.length){
  if(!dictation.boostRound&&dictation.repeatMistakes&&dictation.missedIds.length){
   dictation.firstRoundMissedCount=dictation.missedIds.length;
   dictation.queue=shuffle([...new Set(dictation.missedIds)].map(byId).filter(Boolean));
   dictation.missedIds=[];dictation.index=0;dictation.boostRound=true;
   document.getElementById("dictationFeedback").textContent=`首轮完成：${dictation.firstRoundMissedCount} 个错词进入强化轮。`;
   document.getElementById("dictationSummary").textContent="只重练刚才答错的词。";
   nextDictationWord();return;
  }
  if(!dictation.boostRound)dictation.firstRoundMissedCount=dictation.missedIds.length;
  const remaining=dictation.missedIds.length;
  const summary=dictation.boostRound
   ?`听写完成：首轮错词 ${dictation.firstRoundMissedCount} 个，强化后仍错 ${remaining} 个；共正确 ${dictation.sessionCorrect} 次。`
   :`听写完成：本轮错词 ${dictation.firstRoundMissedCount} 个；共正确 ${dictation.sessionCorrect} 次。`;
  document.getElementById("dictationCount").textContent="本轮完成";document.getElementById("dictationHint").textContent="这一轮已经结束。";
  document.getElementById("dictationProgressBar").style.width="100%";document.getElementById("dictationInput").value="";document.getElementById("dictationInput").disabled=true;
  document.getElementById("dictationFeedback").textContent=summary;document.getElementById("dictationSummary").textContent=remaining?`仍需加强：${[...new Set(dictation.missedIds)].map(id=>byId(id)?.en).filter(Boolean).join("、")}`:dictation.boostRound?"本轮错词已全部在强化轮中拼对。":"本轮没有需要回炉的错词。";
  dictation.active=false;renderDictationPage();return;
 }
 const w=dictationCurrent(),p=progress(w.id);dictation.wrongCounted=false;dictation.pendingAdvance=false;dictation.sessionAttempts++;
 p.attempts++;p.lastSeenAt=Date.now();state.daily.attempts++;save();
 document.getElementById("dictationCount").textContent=`${dictation.boostRound?"错词强化轮 · ":""}第 ${dictation.index+1} / ${dictation.queue.length} 个`;
 document.getElementById("dictationHint").textContent=`${unit(w.unit)?.name||"自定义词"} · ${dictation.boostRound?"错词再记一次":"听音拼写"}`;
 document.getElementById("dictationProgressBar").style.width=`${Math.round(dictation.index/dictation.queue.length*100)}%`;
 document.getElementById("dictationInput").value="";document.getElementById("dictationInput").disabled=false;
 document.getElementById("dictationFeedback").textContent="正在朗读，请听清后输入。";dictationSpeakCurrent();
}
function dictationSpeakCurrent(){
 const w=dictationCurrent();if(!w||!dictation.active)return;
 if(!( "speechSynthesis" in window)){document.getElementById("dictationFeedback").textContent="浏览器不支持语音朗读。请安装支持英语语音的浏览器/系统语音包。";return;}
 clearTimeout(dictationTimer);speechSynthesis.cancel();if(dictation.paused)return;
 let count=0,repeats=Number(document.getElementById("dictationRepeat").value)||2;
 const play=()=>{if(!dictation.active||dictation.paused)return;count++;
  const u=new SpeechSynthesisUtterance(w.en.replace(/-/g," "));u.lang="en-GB";u.rate=Number(document.getElementById("dictationRate").value)||.8;
  const voices=speechSynthesis.getVoices()||[],en=voices.filter(v=>/^en([-_]|$)/i.test(v.lang));u.voice=en.find(v=>v.localService)||en[0]||null;
  u.onend=()=>{if(!dictation.active||dictation.paused)return;if(count<repeats)dictationTimer=setTimeout(play,650);else{document.getElementById("dictationFeedback").textContent="听写开始，直接输入单词。";document.getElementById("dictationInput").focus();}};
  u.onerror=()=>{updateVoiceStatus();document.getElementById("dictationFeedback").textContent="语音播放失败：请检查系统英语语音包。";};speechSynthesis.speak(u);
 };play();
}
function handleDictationInput(){
 if(!dictation.active||dictation.paused)return;const w=dictationCurrent();if(!w)return;const input=document.getElementById("dictationInput"),target=w.en.toLowerCase().replace(/[^a-z]/g,""),raw=input.value.toLowerCase().replace(/[^a-z]/g,"");
 if(raw!==input.value)input.value=raw;
 if(!target.startsWith(raw)){
  if(!dictation.wrongCounted){dictation.wrongCounted=true;dictation.sessionWrong++;if(!dictation.missedIds.includes(w.id))dictation.missedIds.push(w.id);const p=progress(w.id);p.wrong++;p.dueAt=Date.now()+4*60*60*1000;state.daily.wrong++;save();renderStats();}
  document.getElementById("dictationFeedback").textContent="有字母不对，按退格键修改。可以重播，不会自动显示答案。";return;
 }
 document.getElementById("dictationFeedback").textContent=raw.length?`正确字母 ${raw.length} / ${target.length}，继续输入。`:"听清后开始拼写。";
 if(raw.length===target.length){
  const p=progress(w.id),now=Date.now();p.correct++;p.hardWins++;dictation.sessionCorrect++;state.daily.correct++;
  if(!dictation.wrongCounted&&(p.level===0||now>=p.dueAt)){p.level=Math.min(5,p.level+1);p.dueAt=now+INTERVALS[Math.min(p.level-1,INTERVALS.length-1)]*DAY;}
  else if(dictation.wrongCounted&&(!p.dueAt||p.dueAt<now))p.dueAt=now+DAY;
  const opened=unlockChildren(w.id);save();renderStats();renderSide();renderMapIfVisible();
  document.getElementById("dictationFeedback").textContent=`正确！${w.en} · ${w.zh}${opened.length?`，新解锁 ${opened.length} 个关联词。`:"，马上进入下一个词。"}`;
  input.disabled=true;dictation.index++;dictation.pendingAdvance=true;dictationTimer=setTimeout(()=>{if(dictation.active&&!dictation.paused)nextDictationWord();},850);
 }
}
function toggleDictationPause(){
 if(!dictation.active)return;
 if(!dictation.paused){dictation.paused=true;clearTimeout(dictationTimer);if("speechSynthesis" in window)speechSynthesis.pause();document.getElementById("dictationFeedback").textContent="已暂停。点击“继续”恢复。";}
 else{dictation.paused=false;if(dictation.pendingAdvance)nextDictationWord();else if("speechSynthesis" in window&&speechSynthesis.paused)speechSynthesis.resume();else dictationSpeakCurrent();}
 renderDictationPage();
}
function stopDictation(showSummary=true){
 clearTimeout(dictationTimer);if("speechSynthesis" in window)speechSynthesis.cancel();
 if(dictation.active&&showSummary)document.getElementById("dictationSummary").textContent=`本轮提前结束：正确 ${dictation.sessionCorrect} 个，出现错误 ${dictation.sessionWrong} 个。`;
 dictation.active=false;dictation.paused=false;dictation.pendingAdvance=false;const input=document.getElementById("dictationInput");if(input)input.disabled=true;
 if(document.getElementById("dictationStart"))renderDictationPage();
}

function renderSide(){
 const w=word(),u=unit(currentId),list=allWords().filter(x=>x.unit===w.unit),done=list.filter(mastered).length;
 document.getElementById("sideUnit").textContent=u?u.title:"自定义词库";document.getElementById("unitCount").textContent=`${done}/${list.length}`;document.getElementById("unitBar").style.width=(list.length?done/list.length*100:0)+"%";
 document.getElementById("dueSide").textContent=allWords().filter(due).length+" 个";
 const rel=outgoing(currentId);document.getElementById("relatedList").innerHTML=rel.length?rel.map(e=>{const x=byId(e.to),cls=mastered(x)?"done":unlocked(x)?"open":"locked";return `<button class="relation ${cls}" data-rel="${esc(x.id)}" ${unlocked(x)?"":"disabled"}>${esc(x.en)}<small>${esc(e.type)} · ${esc(e.reason)}</small></button>`;}).join(""):'<span class="muted" style="font-size:11px">暂无后续关联。</span>';
 document.querySelectorAll("[data-rel]").forEach(b=>b.onclick=()=>setCurrent(b.dataset.rel));
}
function renderStats(){
 ensureDay();const all=allWords(),open=all.filter(unlocked).length,done=all.filter(mastered).length,dueN=all.filter(due).length;
 document.getElementById("statOpen").textContent=open;document.getElementById("statDone").textContent=done;document.getElementById("statDue").textContent=dueN;
 document.getElementById("statAccuracy").textContent=state.daily.attempts?Math.round(state.daily.correct/state.daily.attempts*100)+"%":"—";
 document.getElementById("streak").textContent=`今日正确 ${state.daily.correct} 次`;document.getElementById("todayProgress").textContent=`目标 ${state.settings.dailyGoal} 次`;window.dispatchEvent(new CustomEvent("wordmap:stats",{detail:{open:open,done:done,due:dueN,correct:state.daily.correct,goal:state.settings.dailyGoal}}));
}
function renderMap(){
 const w=word(),ns=neighbors(currentId).slice(0,10),canvas=document.getElementById("mapCanvas"),W=800,H=340,cx=400,cy=170,rx=285,ry=125;let lines="",nodes="";
 ns.forEach((e,i)=>{const a=-Math.PI/2+Math.PI*2*i/Math.max(ns.length,1),x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry,other=byId(e.neighbor),cls=mastered(other)?"done":unlocked(other)?"open":"locked",color=cls==="done"?"#48b78e":cls==="open"?"#8099ed":"#cbd4e2";lines+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${color}" stroke-width="2" stroke-dasharray="${e.direction==="关联"?"5 5":"0"}" opacity=".75"/>`;nodes+=`<button class="map-node ${cls}" style="left:${x/W*100}%;top:${y/H*100}%" data-mapnode="${esc(other.id)}" ${unlocked(other)?"":"disabled"}><b>${esc(other.en)}</b><small>${esc(other.zh.split("；")[0])}</small></button>`;});
 canvas.innerHTML=`<svg class="map-lines" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${lines}</svg><button class="map-node center" style="left:50%;top:50%"><b>${esc(w.en)}</b><small>${esc(w.zh)}</small></button>${nodes}`;
 document.querySelectorAll("[data-mapnode]").forEach(b=>b.onclick=()=>setCurrent(b.dataset.mapnode));
 document.getElementById("mapContext").textContent=`${w.emoji||"🔤"} ${w.en}：${w.zh}。连线表示词义、场景、词形、搭配或故事关系。`;
 document.getElementById("mapDetails").innerHTML=neighbors(currentId).map(e=>`<div class="edge-card"><b>${e.direction==="解锁"?"→":"↔"} ${esc(byId(e.neighbor).en)} · ${esc(e.type)}</b><p>${esc(e.reason)}</p></div>`).join("")||'<span class="muted">暂无关联</span>';
}
function renderMapIfVisible(){if(page==="map")renderMap();}
function renderParent(){
 document.getElementById("dailyGoal").value=state.settings.dailyGoal;
 document.getElementById("autoSpeakSetting").checked=state.settings.autoSpeak!==false;
 document.getElementById("autoExampleSetting").checked=state.settings.autoSpeakExample!==false;
 document.getElementById("speechRateSetting").value=String(state.settings.speechRate||.8);
 document.getElementById("customList").innerHTML=state.customWords.length?state.customWords.map(w=>`<span class="custom-item">${esc(w.en)} · ${esc(w.zh)} <button data-delcustom="${esc(w.id)}">删除</button></span>`).join(""):'<span class="muted" style="font-size:11px">暂无自定义单词。</span>';
 document.querySelectorAll("[data-delcustom]").forEach(b=>b.onclick=()=>deleteCustom(b.dataset.delcustom));
 const miss=allWords().filter(w=>progress(w.id).wrong>0&&!mastered(w)).sort((a,b)=>progress(b.id).wrong-progress(a.id).wrong);
 document.getElementById("mistakeList").innerHTML=miss.length?miss.slice(0,30).map(w=>`<button class="mistake" data-mistake="${esc(w.id)}">${esc(w.en)} · 错 ${progress(w.id).wrong} 次</button>`).join(""):'<span class="muted" style="font-size:11px">暂无错词。</span>';
 document.querySelectorAll("[data-mistake]").forEach(b=>b.onclick=()=>setCurrent(b.dataset.mistake));
 document.getElementById("reportTable").innerHTML=UNITS.map(u=>{const list=BASE.filter(w=>w.unit===u.id);return `<tr><td>${esc(u.title)}</td><td>${list.filter(unlocked).length}/${list.length}</td><td>${list.filter(mastered).length}</td><td>${list.filter(due).length}</td></tr>`;}).join("");
}
function addCustom(){
 const en=document.getElementById("customEn").value.trim().toLowerCase().replace(/\s+/g,"-"),zh=document.getElementById("customZh").value.trim();
 if(!/^[a-z]+(?:-[a-z]+)*$/.test(en)||!zh){toast("请输入英文单词和中文意思。");return;}
 if(allWords().some(w=>w.en.toLowerCase()===en)){toast("这个单词已经存在。");return;}
 const id="custom_"+en.replace(/[^a-z0-9]+/g,"_"),w={id,en,zh,unit:"custom",emoji:"🔤",chunks:en.split("-"),seed:true,custom:true,source:"家长自定义",practiceExamples:[],textbookExamples:[],examExamples:[],textbookStatus:"自定义词"};
 state.customWords.push(w);state.progress[id]={unlocked:true,level:0,attempts:0,correct:0,wrong:0,easyWins:0,hardWins:0,dueAt:0,lastSeenAt:0};
 const parentId=document.getElementById("linkCustom").checked?currentId:"";
 if(parentId)state.customEdges.push({from:parentId,to:id,type:"家长关联",reason:`家长把“${word().en}”与“${en}”关联`});
 document.getElementById("customEn").value="";document.getElementById("customZh").value="";document.getElementById("linkCustom").checked=true;
 save();renderParent();renderStats();toast("自定义词已添加。");
}
function deleteCustom(id){
 if(!confirm("确定删除这个自定义词吗？"))return;
 state.customWords=state.customWords.filter(w=>w.id!==id);delete state.progress[id];state.customEdges=state.customEdges.filter(e=>e.from!==id&&e.to!==id);
 if(currentId===id){currentId=UNITS[0].seed;typed="";tiles=[];renderPractice();}
 save();renderParent();renderStats();
}
function exportBackup(){
 const payload={app:"WordMap",schema:22,exportedAt:new Date().toISOString(),curriculum:DATA.curriculum,progress:state.progress,customWords:state.customWords,customEdges:state.customEdges,mnemonics:state.mnemonics,settings:state.settings,daily:state.daily};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="WordMap-学习记录备份.json";a.click();URL.revokeObjectURL(a.href);toast("备份文件已生成。");
}
function importBackup(e){
 const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(x.app!=="WordMap"||![21,22].includes(x.schema)||!x.progress)throw 0;if(!confirm("导入将覆盖当前学习记录，建议先导出备份。继续吗？"))return;const f=initialState();state={...f,progress:{...f.progress,...x.progress},customWords:Array.isArray(x.customWords)?x.customWords:[],customEdges:Array.isArray(x.customEdges)?x.customEdges:[],settings:{...f.settings,...x.settings},daily:x.daily||f.daily,mnemonics:x.mnemonics&&typeof x.mnemonics==="object"?x.mnemonics:{}};BASE.forEach(w=>{if(w.seed)progress(w.id).unlocked=true;});save();renderParent();renderStats();renderPractice();toast("学习记录恢复成功。");}catch(err){toast("备份文件无效，未修改当前记录。");}e.target.value="";};r.readAsText(file);
}
function clearData(){if(!confirm("确定清空本机全部学习记录和自定义词库？此操作不可撤销。"))return;state=initialState();currentId=UNITS[0].seed;typed="";tiles=[];used=new Set();selectedChunks=[];save();renderPractice();renderParent();renderStats();toast("本机数据已清空。");}
function init(){
 document.getElementById("unitSelect").innerHTML=UNITS.map(u=>`<option value="${u.id}">${esc(u.title)}</option>`).join("");
 document.getElementById("dictationUnit").innerHTML='<option value="all">全册</option>'+UNITS.map(u=>`<option value="${u.id}">${esc(u.title)}</option>`).join("");
 document.getElementById("pinyinUnitSelect").innerHTML='<option value="all">全册</option>'+UNITS.map(u=>'<option value="'+u.id+'">'+esc(u.title)+'</option>').join("");
 document.getElementById("imageWordSelect").innerHTML=allWords().map(w=>'<option value="'+esc(w.id)+'">'+esc(w.en)+' · '+esc(w.zh)+'</option>').join("");
 document.getElementById("memoryWordSelect").innerHTML=allWords().map(w=>'<option value="'+esc(w.id)+'">'+esc(w.en)+' · '+esc(w.zh)+'</option>').join("");
 document.getElementById("dictationRepeat").value=String(state.settings.dictationRepeat||2);
 document.getElementById("dictationRepeatMistakes").checked=state.settings.dictationRepeatMistakes!==false;
 document.getElementById("dictationRate").value=String(state.settings.speechRate||.8);
 tiles=shuffle(letters(word()).map((ch,i)=>({ch,id:i})));renderPractice();renderStats();
}
window.WordMapUI={setPage:setPage,setCurrent:setCurrent,getCurrentWord:function(){return word();},getWords:function(){return allWords();},getUnits:function(){return UNITS;},getProgress:function(id){return Object.assign({},progress(id));},isUnlocked:function(id){var w=typeof id==="string"?byId(id):id;return !!w&&unlocked(w);},isMastered:function(id){var w=typeof id==="string"?byId(id):id;return !!w&&mastered(w);},getStats:function(){ensureDay();var all=allWords();return {open:all.filter(unlocked).length,done:all.filter(mastered).length,due:all.filter(due).length,correct:state.daily.correct,goal:state.settings.dailyGoal};}};
init();
})();

