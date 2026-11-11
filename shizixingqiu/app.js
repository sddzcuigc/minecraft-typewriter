(function(){
"use strict";
const src=Array.isArray(window.HANZI_3500)?window.HANZI_3500:[];
const lesson={
"一":["一个","数字一，表示数量。","我有一个书包。","☝️"],
"二":["两个","数字二，表示数量。","桌上有两个苹果。","✌️"],
"三":["三只","数字三，表示数量。","树上有三只小鸟。","3️⃣"],
"四":["四季","数字四，表示数量。","一年有四个季节。","4️⃣"],
"五":["五个","数字五，表示数量。","我数出五颗星星。","🖐️"],
"六":["六一","数字六，表示数量。","六一儿童节到了。","6️⃣"],
"七":["七彩","数字七，表示数量。","雨后出现七彩的虹。","🌈"],
"八":["八只","数字八，表示数量。","八只小鸭排成一队。","🦆"],
"九":["九月","数字九，表示数量。","九月我们开学了。","9️⃣"],
"十":["十个","数字十，表示数量。","盒子里有十支笔。","🔟"],
"人":["大人","指人类。","大人和孩子一起读书。","🧑"],
"口":["门口","嘴，也表示出入口。","我们在门口排队。","👄"],
"日":["日出","太阳，也表示一天。","我们去海边看日出。","☀️"],
"月":["月亮","月球，也表示月份。","月亮挂在夜空中。","🌙"],
"山":["高山","地面上高耸的部分。","远处有一座高山。","⛰️"],
"水":["河水","生命需要的液体。","小河里的水清清的。","💧"],
"火":["火苗","燃烧时产生光和热。","小火苗慢慢熄灭了。","🔥"],
"木":["木头","树木，也指木材。","这张桌子是木头做的。","🌳"],
"土":["泥土","地面上的土壤。","小草从泥土里钻出来。","🪴"],
"金":["黄金","一种金属，也指金色。","金色的阳光照在田野上。","🥇"],
"田":["田野","种植庄稼的土地。","农民在田里种稻谷。","🌾"],
"石":["石头","坚硬的矿物块。","小石头躺在河边。","🪨"],
"手":["双手","人的手。","洗手后再吃饭。","🖐️"],
"足":["足球","人的脚。","我们在操场踢足球。","⚽"],
"目":["目光","眼睛，也表示看。","他的目光看向远方。","👀"],
"耳":["耳朵","听声音的器官。","我用耳朵听音乐。","👂"],
"牙":["牙齿","用来咀嚼的牙。","每天早晚都要刷牙。","🦷"],
"心":["爱心","心脏，也表示情感。","我画了一颗爱心。","❤️"],
"头":["头发","身体最上面的部分。","小猫轻轻抬起头。","🧠"],
"眼":["眼睛","用来看东西的器官。","我们要爱护眼睛。","👁️"],
"鼻":["鼻子","用来呼吸和闻气味的器官。","小狗的鼻子很灵敏。","👃"],
"发":["头发","人体头部生长的毛发。","妈妈帮我梳头发。","💇"],
"雨":["下雨","从云中降落的水滴。","窗外下起了小雨。","🌧️"],
"雪":["白雪","天空降下的白色冰晶。","冬天飘起了白雪。","❄️"],
"风":["大风","空气流动形成的风。","风吹动树叶。","🌬️"],
"云":["白云","天空中的水汽凝结物。","白云在天空飘动。","☁️"],
"雷":["打雷","云层放电时发出的响声。","雷雨天要注意安全。","⛈️"],
"电":["闪电","电能或电的现象。","天空中出现一道闪电。","⚡"],
"冰":["冰块","水凝固成的固体。","杯子里有一块冰。","🧊"],
"光":["阳光","能够使人看见物体的光。","阳光照进房间。","🌞"],
"花":["鲜花","植物上开出的花。","花园里开满鲜花。","🌸"],
"草":["小草","一种草本植物。","小草在春天发芽。","🌱"],
"树":["大树","高大的木本植物。","大树下面可以乘凉。","🌲"],
"林":["树林","许多树生长在一起。","小鸟住在树林里。","🌳"],
"森":["森林","树木茂密的地方。","森林里有许多动物。","🌲"],
"叶":["树叶","植物枝条上的叶子。","秋天树叶变黄了。","🍃"],
"果":["水果","植物结出的果实。","多吃水果有益健康。","🍎"],
"米":["大米","常见的粮食。","碗里盛着大米饭。","🍚"],
"麦":["小麦","一种粮食作物。","田里的小麦成熟了。","🌾"],
"豆":["豆子","豆类植物的种子。","碗里有几颗豆子。","🫘"],
"瓜":["西瓜","瓜类植物的果实。","夏天我爱吃西瓜。","🍉"],
"菜":["蔬菜","可以食用的植物。","我们要多吃蔬菜。","🥬"],
"竹":["竹子","有节的常绿植物。","熊猫喜欢吃竹子。","🎋"],
"鸟":["小鸟","有羽毛和翅膀的动物。","小鸟在树上唱歌。","🐦"],
"鱼":["小鱼","生活在水里的脊椎动物。","小鱼在池塘里游。","🐟"],
"马":["小马","一种常见的哺乳动物。","小马在草地上奔跑。","🐎"],
"牛":["黄牛","一种家畜。","黄牛正在吃草。","🐂"],
"羊":["绵羊","一种家畜。","草地上有一只羊。","🐑"],
"猪":["小猪","一种常见家畜。","小猪在泥地里玩。","🐷"],
"狗":["小狗","一种常见的家养动物。","小狗摇着尾巴。","🐕"],
"猫":["小猫","常见的家养动物。","小猫睡在沙发上。","🐱"],
"鸡":["母鸡","一种家禽。","母鸡带着小鸡散步。","🐔"],
"鸭":["鸭子","一种水禽。","鸭子在池塘里游泳。","🦆"],
"兔":["兔子","耳朵长的动物。","小兔子爱吃青草。","🐰"],
"虎":["老虎","一种大型猫科动物。","老虎在森林里活动。","🐅"],
"龙":["长龙","中国传统文化中的神话动物。","舞龙活动热闹极了。","🐉"],
"蛇":["小蛇","身体细长的爬行动物。","小蛇从草丛爬过。","🐍"],
"象":["大象","有长鼻子的大型动物。","大象用鼻子吸水。","🐘"],
"鹿":["梅花鹿","一种有蹄的哺乳动物。","梅花鹿在林间行走。","🦌"],
"虫":["虫子","昆虫等小动物的统称。","我在叶子上发现小虫。","🐛"],
"蜂":["蜜蜂","一种会采蜜的昆虫。","蜜蜂飞向花朵。","🐝"],
"蝶":["蝴蝶","有漂亮翅膀的昆虫。","蝴蝶在花间飞舞。","🦋"],
"星":["星星","天空中发光的星体。","夜空中有很多星星。","⭐"],
"天":["天空","地面上方的广阔空间。","今天的天空很蓝。","🌤️"],
"地":["土地","地面，地球表面。","花草在土地上生长。","🌍"],
"海":["大海","广阔的海洋。","大海里有很多鱼。","🌊"],
"河":["小河","天然流动的水道。","一条小河流过村庄。","🏞️"],
"湖":["湖水","陆地上的大片积水。","湖面像镜子一样平静。","🏞️"],
"桥":["小桥","跨越河流或道路的建筑。","我们从桥上走过。","🌉"],
"车":["汽车","在道路上行驶的车辆。","汽车停在路边。","🚗"],
"船":["小船","在水上行驶的交通工具。","小船在湖上慢慢前进。","⛵"],
"机":["飞机","机器，也用于飞机等词。","飞机从头顶飞过。","✈️"],
"路":["马路","供人和车辆通行的道路。","过马路要看红绿灯。","🛣️"],
"门":["大门","房屋的出入口。","请轻轻关上大门。","🚪"],
"房":["房子","供人居住的建筑。","我们的房子很温暖。","🏠"],
"家":["家庭","共同生活的亲人组成的家庭。","我爱我的家。","🏡"],
"校":["学校","学习知识的地方。","我们每天去学校上课。","🏫"],
"书":["书本","写有文字或图画的册子。","我喜欢读故事书。","📚"],
"笔":["铅笔","写字或画画的工具。","我用铅笔写字。","✏️"],
"纸":["白纸","写字画画用的薄片。","请拿一张白纸。","📄"],
"画":["图画","用线条和色彩表现形象。","我画了一幅风景画。","🎨"],
"字":["汉字","记录语言的文字。","我们每天认识新汉字。","🔠"],
"钟":["时钟","指示时间的器具。","时钟指向八点。","🕰️"],
"表":["手表","计时工具，也有表示的意思。","爸爸戴着手表。","⌚"],
"衣":["衣服","人穿着的衣物。","冬天要穿暖和的衣服。","👕"],
"帽":["帽子","戴在头上的衣饰。","太阳大时要戴帽子。","🧢"],
"鞋":["鞋子","穿在脚上的用品。","出门前穿好鞋子。","👟"],
"球":["皮球","用于运动或游戏的圆形物体。","小朋友在拍皮球。","🏀"],
"门":["大门","房屋的出入口。","进屋后请关门。","🚪"],
"灯":["电灯","照明用的器具。","天黑了，打开电灯。","💡"],
"床":["小床","睡觉用的家具。","小猫躺在床上。","🛏️"],
"桌":["桌子","放东西的家具。","书放在桌子上。","🪑"],
"椅":["椅子","供人坐的家具。","请坐在椅子上。","🪑"],
"钟":["时钟","指示时间的器具。","时钟指向八点。","🕒"],
"伞":["雨伞","挡雨或遮阳的用品。","下雨时带上雨伞。","☂️"],
"杯":["水杯","喝水的容器。","水杯里装满了温水。","🥛"],
"碗":["饭碗","盛饭菜的容器。","请把饭碗放好。","🥣"],
"饭":["米饭","煮熟的食物。","中午我们吃米饭。","🍚"],
"面":["面条","用面粉制成的食物。","我喜欢吃面条。","🍜"],
"蛋":["鸡蛋","一种常见食品。","早餐吃一个鸡蛋。","🥚"],
"奶":["牛奶","哺乳动物分泌的乳汁。","我每天喝牛奶。","🥛"],
"茶":["喝茶","一种饮品。","爷爷喜欢喝热茶。","🍵"],
"笑":["微笑","表示高兴的面部表情。","她开心地笑了。","😄"],
"哭":["哭泣","因为难过等而流泪。","弟弟摔倒后哭了。","😢"],
"跑":["跑步","快速移动的一种方式。","我们在操场上跑步。","🏃"],
"走":["走路","用脚步移动。","放学后走路回家。","🚶"],
"跳":["跳高","双脚或单脚离开地面。","小兔子跳得很高。","🦘"],
"飞":["飞翔","在空中运动。","小鸟飞向远方。","🕊️"],
"游":["游泳","在水里活动。","夏天我们去游泳。","🏊"],
"吃":["吃饭","把食物送入口中咀嚼。","要按时吃饭。","🍽️"],
"喝":["喝水","饮用液体。","运动后要喝水。","🥤"],
"看":["看书","用眼睛观察。","我坐在窗边看书。","👀"],
"听":["听歌","用耳朵感知声音。","我们一起听音乐。","👂"],
"说":["说话","用语言表达想法。","请轻声说话。","💬"],
"唱":["唱歌","用声音表现歌曲。","大家一起唱歌。","🎤"],
"读":["读书","看文字并理解或念出。","每天读一会儿书。","📖"],
"写":["写字","用笔书写文字。","我认真地写字。","✍️"],
"早":["早晨","一天刚开始的时候。","早晨的空气很清新。","🌅"],
"晚":["晚上","一天临近结束的时候。","晚上我们一起读书。","🌆"],
"春":["春天","一年四季中的第一季。","春天花儿开放了。","🌷"],
"夏":["夏天","天气炎热的季节。","夏天可以吃西瓜。","🌞"],
"秋":["秋天","一年中收获的季节。","秋天树叶变黄。","🍂"],
"冬":["冬天","一年中寒冷的季节。","冬天有时会下雪。","⛄"],
"红":["红色","像红旗一样的颜色。","苹果变红了。","🟥"],
"黄":["黄色","像柠檬一样的颜色。","太阳画成黄色。","🟨"],
"蓝":["蓝色","像晴天天空一样的颜色。","天空蓝蓝的。","🟦"],
"绿":["绿色","像草叶一样的颜色。","草地绿油油的。","🟩"],
"白":["白色","像雪一样的颜色。","云朵是白色的。","⬜"],
"黑":["黑色","像夜空一样深的颜色。","小猫长着黑色的毛。","⬛"]
};
window.SZX_LESSON_DATA=lesson;
const wubi={"日":["J","JJJJ"],"月":["E","EEEE"],"山":["M","MMMM"],"水":["I","IIII"],"火":["O","OOOO"],"木":["S","SSSS"],"口":["K","KKKK"],"人":["W","WWWW"]};
const chars=src.map(function(r){return {c:r[0],py:r[1],strokes:r[2],radical:r[3],freq:r[4],lesson:lesson[r[0]]||null,wubi:wubi[r[0]]||null}});
const byChar=Object.fromEntries(chars.map(function(x,i){return [x.c,i]}));
const $=function(id){return document.getElementById(id)};
const esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
const plain=function(s){return String(s).replace(/ɡ/g,"g").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ü/g,"v").toLowerCase()};
let learned=[],wrong=[],correct=0;
try{learned=JSON.parse(localStorage.getItem("szx.learned")||"[]");wrong=JSON.parse(localStorage.getItem("szx.wrong")||"[]");correct=Number(localStorage.getItem("szx.correct")||0)}catch(e){}
if(!Array.isArray(learned))learned=[];if(!Array.isArray(wrong))wrong=[];
learned=learned.filter(function(c){return Object.prototype.hasOwnProperty.call(byChar,c)});
wrong=wrong.filter(function(c){return Object.prototype.hasOwnProperty.call(byChar,c)});
let view="learn",current=byChar["山"]||0,tier="all",search="",page=0,gameMode="pinyin",gameChar=null,gameDone=false,streak=0;
const PAGE=48;
function save(){try{localStorage.setItem("szx.learned",JSON.stringify(learned));localStorage.setItem("szx.wrong",JSON.stringify(wrong));localStorage.setItem("szx.correct",String(correct))}catch(e){}}
function stats(){$("learnedStat").textContent=learned.length+" / "+chars.length;$("correctStat").textContent=correct;$("wrongStat").textContent=wrong.length;$("letterCount").textContent=chars.length+" 字"}
function activate(){document.querySelectorAll("[data-view]").forEach(function(b){b.classList.toggle("active",b.dataset.view===view)})}
function goto(v){view=v;activate();render();window.scrollTo({top:0,behavior:"smooth"})}
function pic(d){if(d.lesson&&d.lesson[3])return '<div class="picture emoji-picture" role="img" aria-label="'+esc(d.lesson[1])+'">'+esc(d.lesson[3])+'<small>联想图标</small></div>';return '<div class="picture glyph-picture" role="img" aria-label="'+esc(d.c)+'字形卡"><b>'+esc(d.c)+'</b><small>尚无专属插画 · 展示字形</small></div>'}
function choose(i){current=i;goto("learn")}
function sound(d){if(!("speechSynthesis" in window)){alert("这个浏览器不支持朗读功能。");return;}try{window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(d.c);u.lang="zh-CN";u.rate=0.72;window.speechSynthesis.speak(u)}catch(e){alert("朗读失败，请检查设备中文语音包。")}}
function renderLearn(){
 const d=chars[current],pys=d.py.map(esc).join(" / ");
 const chips=['<span class="chip">笔画：'+d.strokes+'</span>','<span class="chip">部首：'+esc(d.radical||"待补")+'</span>','<span class="chip">字库编号：'+(current+1)+'</span>'];
 let html='<div class="learning-grid"><section class="panel"><div class="between"><h2>认字卡</h2><span class="muted">第 '+(current+1)+' / '+chars.length+' 字</span></div><div class="hero">'+pic(d)+'<div class="char-info"><div class="big-char">'+esc(d.c)+'</div><div class="pinyin">'+pys+'</div><button class="subtle-btn" id="readAloud">🔊 读给我听</button></div></div><div class="chips">'+chips.join("")+'</div>';
 if(d.lesson){html+='<section class="info"><div class="mini-title">认识这个字</div><p>'+esc(d.lesson[1])+'</p><div class="word"><b>'+esc(d.lesson[0])+'</b></div><div class="example">'+esc(d.lesson[2])+'</div></section>'}
 else{html+='<section class="info"><div class="mini-title">拼音和字形</div><p>这个字已经收录了拼音、笔画和部首，词语释义和插画尚在补充中。多音字请结合具体词语选择读音。</p></section>'}
 if(d.wubi){html+='<div class="wubi-info"><b>五笔86 · 键名字根</b><div><span class="kbd">'+d.wubi[0]+'</span> <strong>'+d.wubi[1]+'</strong></div><small>键名字根按键四次。这是特殊规则，不代表普通汉字也这样编码。</small></div>'}
 else{html+='<div class="wubi-info"><b>五笔86拆分</b><div class="muted">本字尚未录入经过校验的字根拆分与编码。</div></div>'}
 html+='<div class="actions"><button class="primary-btn" id="markLearn">'+(learned.includes(d.c)?"✓ 已标记掌握":"✓ 我认识这个字")+'</button><button class="subtle-btn" id="prev">← 上一个</button><button class="subtle-btn" id="next">下一个 →</button></div></section>';
 const recent=chars.filter(function(c){return c.lesson}).slice(0,42);
 html+='<aside class="panel"><div class="between"><h2>看图识字</h2><button class="text-btn" id="seeAll">查看全部 →</button></div><div class="small-note">以下字有对应的本地图标。其余汉字仍可以学习拼音与笔画。</div><div class="tile-grid">'+recent.map(function(c){return '<button class="tile" data-char="'+byChar[c.c]+'"><span class="tile-icon">'+esc(c.lesson[3])+'</span><b>'+esc(c.c)+'</b><small>'+esc(c.py[0])+'</small></button>'}).join("")+'</div></aside></div>';
 $("content").innerHTML=html;
 $("markLearn").onclick=function(){if(!learned.includes(d.c))learned.push(d.c);save();stats();renderLearn()};
 $("prev").onclick=function(){current=(current+chars.length-1)%chars.length;renderLearn()};
 $("next").onclick=function(){current=(current+1)%chars.length;renderLearn()};
 $("readAloud").onclick=function(){sound(d)};
 $("seeAll").onclick=function(){tier="illustrated";search="";page=0;goto("bank")};
 $("content").querySelectorAll("[data-char]").forEach(function(b){b.onclick=function(){choose(Number(b.dataset.char))}});
}
function filtered(){
 const q=plain(search.trim());
 return chars.filter(function(d){
 if(tier==="500"&&d.freq!==0)return false;
 if(tier==="2500"&&d.freq>1)return false;
 if(tier==="illustrated"&&!d.lesson)return false;
 if(tier==="review"&&!wrong.includes(d.c))return false;
 if(!q)return true;
 return d.c.includes(search.trim())||plain(d.py.join(" ")).includes(q)||(d.lesson&&(d.lesson[0].includes(search.trim())||d.lesson[1].includes(search.trim())));
 });
}
function renderBank(){
 $("content").innerHTML='<section class="panel"><div class="between"><h2>汉字字库</h2><span class="muted">3500 字离线可查</span></div><p class="small-note">按字、拼音或组词查找。前500字是字库中的高频字，并非小学一年级教材顺序。</p><input class="search" type="search" id="bankSearch" placeholder="试试：山、shui、月亮、mao" value="'+esc(search)+'"><div class="filters"><button data-tier="all">全部3500</button><button data-tier="500">高频500</button><button data-tier="2500">常用2500</button><button data-tier="illustrated">有联想图</button></div><div class="between"><span id="resultCount" class="small-note"></span><span class="small-note">每页48字</span></div><div id="bankGrid" class="library-grid"></div><div class="pager" id="bankPager"></div></section>';
 const input=$("bankSearch");
 input.oninput=function(){search=input.value;page=0;updateBank()};
 $("content").querySelectorAll("[data-tier]").forEach(function(b){b.onclick=function(){tier=b.dataset.tier;page=0;updateBank()}});
 updateBank();
}
function updateBank(){
 const hits=filtered(),maxPage=Math.max(1,Math.ceil(hits.length/PAGE));page=Math.max(0,Math.min(page,maxPage-1));
 $("resultCount").textContent="找到 "+hits.length+" 个字 · 第 "+(page+1)+" / "+maxPage+" 页";
 $("content").querySelectorAll("[data-tier]").forEach(function(b){b.classList.toggle("on",b.dataset.tier===tier)});
 const slice=hits.slice(page*PAGE,(page+1)*PAGE);
 $("bankGrid").innerHTML=slice.length?slice.map(function(d){return '<button class="character-tile" data-open="'+byChar[d.c]+'"><span class="char-hanzi">'+esc(d.c)+'</span><small>'+esc(d.py[0])+'</small>'+(d.lesson?'<i title="有联想图">●</i>':'')+'</button>'}).join(""):'<div class="empty">没有搜索结果。可以试试另一个读音或汉字。</div>';
 $("bankGrid").querySelectorAll("[data-open]").forEach(function(b){b.onclick=function(){choose(Number(b.dataset.open))}});
 $("bankPager").innerHTML='<button id="bankPrev" '+(page===0?"disabled":"")+'>上一页</button><span>第 '+(page+1)+' 页</span><button id="bankNext" '+(page>=maxPage-1?"disabled":"")+'>下一页</button>';
 $("bankPrev").onclick=function(){if(page>0){page--;updateBank();$("content").scrollIntoView({behavior:"smooth"})}};
 $("bankNext").onclick=function(){if(page<maxPage-1){page++;updateBank();$("content").scrollIntoView({behavior:"smooth"})}};
}
function pickGame(){
 const subset=gameMode==="wubi"?chars.filter(function(d){return !!d.wubi}):gameMode==="picture"?chars.filter(function(d){return !!d.lesson&&d.py.length===1}):chars.filter(function(d){return d.py.length===1});
 gameChar=subset[Math.floor(Math.random()*subset.length)];
 gameDone=false;
}
function game(){
 if(!gameChar||(gameMode==="wubi"&&!gameChar.wubi)||(gameMode==="picture"&&!gameChar.lesson))pickGame();
 const d=gameChar;
 const title=gameMode==="wubi"?"输入五笔86键名字根编码":gameMode==="picture"?"看图写拼音":"看汉字写拼音";
 let prompt=gameMode==="picture"?pic(d):'<div class="game-char">'+esc(d.c)+'</div>';
 $("content").innerHTML='<section class="panel game-panel"><div class="between"><h2>⌨️ 打字闯关</h2><span class="muted">连对 '+streak+' 题</span></div><div class="filters"><button data-mode="pinyin">看字拼音</button><button data-mode="picture">看图拼音</button><button data-mode="wubi">五笔86字根</button></div><p class="small-note">'+title+(gameMode==="wubi"?" · 仅8个已校验键名字根":" · 多音字不进入自动出题")+'</p><div class="game-visual">'+prompt+'</div><div class="game-hint">'+(gameMode==="picture"?esc(d.c)+" · ":"")+(gameMode==="wubi"?"五笔代码由4个英文字母组成":"不需要输入声调符号")+'</div><input id="answer" class="answer" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="在这里输入答案，按回车检查"><div class="game-message" id="gameMessage" aria-live="polite"></div><div class="actions center"><button class="primary-btn" id="checkGame">检查答案</button><button class="subtle-btn" id="nextGame">换一个字 →</button></div></section>';
 $("content").querySelectorAll("[data-mode]").forEach(function(b){b.classList.toggle("on",b.dataset.mode===gameMode);b.onclick=function(){gameMode=b.dataset.mode;pickGame();game()}});
 const input=$("answer");
 function check(){
 if(gameDone)return;
 const val=plain(input.value.trim()),expected=gameMode==="wubi"?d.wubi[1].toLowerCase():plain(d.py[0]);
 if(!val)return;
 if(val===expected){
  gameDone=true;correct++;streak++;if(!learned.includes(d.c))learned.push(d.c);wrong=wrong.filter(function(x){return x!==d.c});save();stats();
  $("gameMessage").textContent="✓ 答对了！拼音："+d.py.join(" / ")+(d.lesson?" · "+d.lesson[0]:"");$("gameMessage").className="game-message right";$("checkGame").disabled=true;
 }else{
  streak=0;if(!wrong.includes(d.c))wrong.push(d.c);save();stats();
  $("gameMessage").textContent="再试一次。提示："+(gameMode==="wubi"?"这个字的字根键是 "+d.wubi[0]:"拼音首字母 "+plain(d.py[0]).charAt(0));$("gameMessage").className="game-message wrong";
 }
 }
 $("checkGame").onclick=check;
 input.onkeydown=function(e){if(e.key==="Enter"){if(gameDone){pickGame();game()}else check()}};
 $("nextGame").onclick=function(){pickGame();game()};
}
function wubiClass(){
 const pool=chars.filter(function(d){return !!d.wubi});
 $("content").innerHTML='<section class="panel"><h2>五笔86 · 键名字根入门</h2><p class="small-note">当前核验了8个键名字根，均遵循重复按该键4次的特殊输入规则。完整的3500字五笔拆分仍待正式码表与拆分数据核对，不能拿四连击替代普通字编码。</p><div class="wubi-grid">'+pool.map(function(d){return '<button class="wubi-item" data-open="'+byChar[d.c]+'"><b>'+esc(d.c)+'</b><span class="kbd">'+d.wubi[0]+'</span><strong>'+d.wubi[1]+'</strong></button>'}).join("")+'</div><div class="info"><b>区分86版与98版</b><p>本页只展示五笔86版的键名字根。普通汉字通常需要按照字根拆分、编码规则和识别码进行取码，未核验的数据不会显示为正确答案。</p></div><div class="actions"><button id="wubiPlay" class="primary-btn">练习这8个字</button></div></section>';
 $("content").querySelectorAll("[data-open]").forEach(function(b){b.onclick=function(){choose(Number(b.dataset.open))}});
 $("wubiPlay").onclick=function(){gameMode="wubi";pickGame();goto("game")};
}
function review(){
 const words=wrong.slice().sort(function(a,b){return byChar[a]-byChar[b]});
 $("content").innerHTML='<section class="panel"><div class="between"><h2>错字复习</h2><span class="muted">'+words.length+' 个</span></div><p class="small-note">打字答错后自动收入错字本，答对后自动移出。数据只保存在本浏览器。</p><div class="library-grid">'+(words.length?words.map(function(c){const d=chars[byChar[c]];return '<button class="character-tile" data-open="'+byChar[c]+'"><span class="char-hanzi">'+esc(c)+'</span><small>'+esc(d.py[0])+'</small></button>'}).join(""):'<div class="empty">暂无错字。到打字闯关里做几题吧。</div>')+'</div><div class="actions"><button id="clearWrong" class="subtle-btn">清空错字本</button><button id="goPractice" class="primary-btn">去闯关</button></div></section>';
 $("content").querySelectorAll("[data-open]").forEach(function(b){b.onclick=function(){choose(Number(b.dataset.open))}});
 $("clearWrong").onclick=function(){if(wrong.length&&confirm("确定清空错字本？")){wrong=[];save();stats();review()}};
 $("goPractice").onclick=function(){gameMode="pinyin";pickGame();goto("game")};
}
function render(){stats();activate();if(view==="learn")renderLearn();else if(view==="bank")renderBank();else if(view==="game")game();else if(view==="wubi")wubiClass();else review()}
$("topSearch").addEventListener("keydown",function(e){if(e.key==="Enter"){search=e.target.value.trim();tier="all";page=0;goto("bank")}});
$("topSearchBtn").onclick=function(){search=$("topSearch").value.trim();tier="all";page=0;goto("bank")};
document.querySelectorAll("[data-view]").forEach(function(b){b.onclick=function(){goto(b.dataset.view)}});
render();
})();