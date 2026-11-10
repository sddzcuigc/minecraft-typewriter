(function(){
"use strict";
var THREE=window.THREE, DATA=window.WORDMAP_DATA, API=window.WordMapUI, canvas=document.getElementById("worldCanvas");
if(!THREE||!canvas||!DATA){document.body.classList.add("world-no-webgl");return;}
var renderer, scene, camera;
try{
 renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
}catch(err){document.body.classList.add("world-no-webgl");return;}
var pixelRatio=Math.min(window.devicePixelRatio||1,1.5);
renderer.setPixelRatio(pixelRatio);
renderer.setSize(window.innerWidth,window.innerHeight,false);
renderer.shadowMap.enabled=window.innerWidth>900&&(navigator.hardwareConcurrency||4)>4;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
scene=new THREE.Scene();
scene.background=new THREE.Color("#8bd0ef");
scene.fog=new THREE.Fog("#8bd0ef",52,115);
camera=new THREE.PerspectiveCamera(42,window.innerWidth/window.innerHeight,.1,220);
var target=new THREE.Vector3(0,1,0),targetGoal=target.clone(),yaw=.73,pitch=.61,radius=43,radiusGoal=43;
var clock=new THREE.Clock(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),hitTargets=[],islands=[],clouds=[],particles=[],markerNodes=[],selectedUnitId=DATA.units[0].id;
var cubeGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.SphereGeometry(1,12,10);
var mats={
 grass:new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),
 dirt:new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),
 stone:new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),
 wood:new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),
 leaves:new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),
 sand:new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),
 roof:new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),
 brick:new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),
 glass:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.3,metalness:.05}),
 snow:new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),
 gold:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.55,metalness:.1})
};
var palette=[
 {grass:"#76b94c",leaf:"#3f8e48",dirt:"#8d633d",wood:"#754a2d",roof:"#a74d38",accent:"#f0c85f",stone:"#777e7b"},
 {grass:"#7ebd59",leaf:"#438c4c",dirt:"#9a7049",wood:"#9b7044",roof:"#b65c3e",accent:"#e9c06b",stone:"#818985"},
 {grass:"#79b7a1",leaf:"#4c927b",dirt:"#8a7c63",wood:"#6d5943",roof:"#6b9caa",accent:"#f1d16c",stone:"#8a9695"},
 {grass:"#b0a64d",leaf:"#c4773f",dirt:"#8c633f",wood:"#805332",roof:"#9d5638",accent:"#e7bd61",stone:"#777e76"},
 {grass:"#c4a65f",leaf:"#63975b",dirt:"#a77b4c",wood:"#795436",roof:"#a85d37",accent:"#f1d074",stone:"#8b8578"},
 {grass:"#5c9b62",leaf:"#347a4a",dirt:"#76573f",wood:"#64432e",roof:"#a75b3d",accent:"#e9c56b",stone:"#707d76"}
];
var unitPositions=[
 {x:-16,z:-10,y:1.3},{x:0,z:-19,y:.4},{x:16,z:-10,y:1.8},
 {x:16,z:10,y:.6},{x:0,z:19,y:1.5},{x:-16,z:10,y:.8}
];
var matObj=new THREE.Object3D();
var ambient=new THREE.HemisphereLight("#e8f7ff","#5d704c",2.05);scene.add(ambient);
var sun=new THREE.DirectionalLight("#fff3d2",2.35);sun.position.set(-24,36,18);sun.castShadow=renderer.shadowMap.enabled;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-42;sun.shadow.camera.right=42;sun.shadow.camera.top=42;sun.shadow.camera.bottom=-42;scene.add(sun);
var fill=new THREE.DirectionalLight("#a7d8ff",.65);fill.position.set(24,16,-24);scene.add(fill);
function rng(seed){var x=seed>>>0;return function(){x=(x*1664525+1013904223)>>>0;return x/4294967296;};}
function addBlock(b,type,x,y,z,color,size){
 if(!b[type])b[type]=[];
 b[type].push({x:x,y:y,z:z,color:color||"#ffffff",size:size||1});
}
function flushBlocks(group,batches){
 Object.keys(batches).forEach(function(type){
  var arr=batches[type];if(!arr.length)return;
  var mesh=new THREE.InstancedMesh(cubeGeo,mats[type]||mats.stone,arr.length);
  mesh.castShadow=renderer.shadowMap.enabled;mesh.receiveShadow=true;
  for(var i=0;i<arr.length;i++){
   var b=arr[i];matObj.position.set(b.x,b.y,b.z);matObj.scale.set(b.size,b.size,b.size);matObj.rotation.set(0,0,0);matObj.updateMatrix();mesh.setMatrixAt(i,matObj.matrix);mesh.setColorAt(i,new THREE.Color(b.color));
  }
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;group.add(mesh);
 });
}
function topHeight(x,z,r){return Math.max(0,Math.floor((r-Math.sqrt(x*x+z*z))*.2));}
function addTree(b,x,z,y,leafColor){
 for(var i=0;i<4;i++)addBlock(b,"wood",x,y+i,z,"#80502d",1.02);
 for(var ly=2;ly<=4;ly++)for(var lx=-1;lx<=1;lx++)for(var lz=-1;lz<=1;lz++){
  if(Math.abs(lx)+Math.abs(lz)+(ly===4?1:0)<=3)addBlock(b,"leaves",x+lx,y+ly,z+lz,leafColor||"#4a994a",1.02);
 }
 addBlock(b,"leaves",x,y+5,z,leafColor||"#4a994a",.9);
}
function addHouse(b,x,z,y,pal,scale){
 scale=scale||1;
 for(var fx=-2;fx<=2;fx++)for(var fz=-2;fz<=2;fz++)addBlock(b,"wood",x+fx,y,z+fz,"#8c603a",scale);
 for(var wy=1;wy<=3;wy++)for(var wx=-2;wx<=2;wx++)for(var wz=-2;wz<=2;wz++){
  if(Math.abs(wx)===2||Math.abs(wz)===2){
   if(!(wz===2&&wx===0&&wy<3))addBlock(b,"brick",x+wx,y+wy,z+wz,pal.wood,scale);
  }
 }
 for(var rx=-3;rx<=3;rx++)for(var rz=-3;rz<=3;rz++){
  if(Math.abs(rx)+Math.abs(rz)<=5)addBlock(b,"roof",x+rx,y+4+Math.floor((5-Math.abs(rx)-Math.abs(rz))*.15),z+rz,pal.roof,scale);
 }
 addBlock(b,"glass",x-2,y+2,z,pal.accent,scale*.55);
 addBlock(b,"glass",x+2,y+2,z,pal.accent,scale*.55);
 addBlock(b,"wood",x,y+1,z+2,"#5c3d2a",scale*.85);
}
function addIslandTerrain(b,r,pal,seed){
 var random=rng(seed);
 for(var x=-r;x<=r;x++)for(var z=-r;z<=r;z++){
  var d=Math.sqrt(x*x+z*z),noise=(random()-.5)*.65;
  if(d>r+noise)continue;
  var top=Math.max(0,Math.floor((r-d)*.22+noise));
  addBlock(b,"grass",x,top,z,pal.grass,1.04);
  for(var depth=1;depth<=3;depth++)addBlock(b,depth===3?"stone":"dirt",x,top-depth,z,depth===3?pal.stone:pal.dirt,1.04);
 }
 for(var layer=0;layer<3;layer++){
  var rr=r-1-layer*1.35;
  for(var ax=-r;ax<=r;ax++)for(var az=-r;az<=r;az++)if(Math.sqrt(ax*ax+az*az)<rr&&rng(seed+layer*29+ax*7+az*13)()>.12)addBlock(b,"stone",ax,-4-layer,az,layer===0?"#777f7b":"#59615f",1.05);
 }
}
function addGoal(b,pal){
 for(var z=-3;z<=3;z+=6){addBlock(b,"wood",-3,1,z,"#eee5c6");addBlock(b,"wood",3,1,z,"#eee5c6");}
 for(var y=1;y<=3;y++){addBlock(b,"wood",-3,y,0,"#f4f0d9");addBlock(b,"wood",3,y,0,"#f4f0d9");}
 for(var x=-3;x<=3;x++)addBlock(b,"wood",x,4,0,"#f4f0d9");
 addBlock(b,"gold",0,5,0,pal.accent,1.15);
}
function addWeatherTower(b,pal){
 for(var y=1;y<=6;y++)addBlock(b,"stone",0,y,0,"#8b9990");
 for(var x=-2;x<=2;x++)for(var z=-2;z<=2;z++)if(Math.abs(x)+Math.abs(z)<4)addBlock(b,"glass",x,7,z,"#b7e5e8",.92);
 addBlock(b,"gold",0,8,0,pal.accent,1.3);
 for(var x=-2;x<=2;x++)for(var z=-1;z<=1;z++)if(Math.abs(x)+Math.abs(z)<4)addBlock(b,"snow",x,10,z,"#eaf2e2",.9);
}
function addTrain(b,pal){
 for(var x=-3;x<=3;x++){addBlock(b,"stone",x,1,-2,"#595d58");addBlock(b,"stone",x,1,2,"#595d58");addBlock(b,"wood",x,1,0,"#a68a52");}
 for(var x=-2;x<=2;x++){addBlock(b,"brick",x,2,0,"#c35c3d");addBlock(b,"glass",x,3,0,"#a8d9e8");}
 addBlock(b,"gold",0,4,0,pal.accent,1.1);
}
function addLighthouse(b,pal){
 for(var y=1;y<=7;y++)for(var x=-1;x<=1;x++)for(var z=-1;z<=1;z++)addBlock(b,"stone",x,y,z,y>5?"#e5dfc0":"#a8b4a4");
 for(var x=-2;x<=2;x++)for(var z=-2;z<=2;z++)addBlock(b,"roof",x,8,z,pal.roof);
 addBlock(b,"glass",0,6,0,"#a6e7f3",1.4);addBlock(b,"gold",0,9,0,pal.accent,1.1);
}
function addSeasonTree(b,pal){
 addTree(b,0,0,1,pal.leaf);
 for(var x=-3;x<=3;x++)for(var z=-3;z<=3;z++)if(Math.abs(x)+Math.abs(z)<5)addBlock(b,"leaves",x,5,z,pal.leaf,.9);
 for(var i=0;i<7;i++)addBlock(b,"leaves",-3+(i%4),4+Math.floor(i/3),2+(i%2),i%2?"#d78b42":"#b84e3e",.8);
}
function addUnitStructure(b,idx,pal){
 if(idx===0)addGoal(b,pal);
 else if(idx===1)addHouse(b,0,0,1,pal,1);
 else if(idx===2)addWeatherTower(b,pal);
 else if(idx===3)addSeasonTree(b,pal);
 else if(idx===4)addTrain(b,pal);
 else addLighthouse(b,pal);
}
function makeIsland(unit,idx){
 var pos=unitPositions[idx],pal=palette[idx],group=new THREE.Group(),b={},r=5,random=rng(700+idx*31);
 addIslandTerrain(b,r,pal,100+idx*77);
 if(idx===1){addHouse(b,0,0,2,pal,1);}
 else addUnitStructure(b,idx,pal);
 var treeSpots=[[-3,-2],[3,-2],[-3,3],[3,3]];
 treeSpots.forEach(function(p,i){if(idx!==3||i>1)addTree(b,p[0],p[1],topHeight(p[0],p[1],r)+1,pal.leaf);});
 for(var i=0;i<18;i++){
  var fx=Math.floor(random()*9)-4,fz=Math.floor(random()*9)-4;
  if(fx*fx+fz*fz<17)addBlock(b,"leaves",fx,topHeight(fx,fz,r)+1,fz,i%3===0?"#f3c85f":(i%3===1?"#e77c53":"#a6c95e"),.25);
 }
 flushBlocks(group,b);group.position.set(pos.x,pos.y,pos.z);scene.add(group);
 var hit=new THREE.Mesh(new THREE.CylinderGeometry(5.4,5.4,2.8,12),new THREE.MeshBasicMaterial({transparent:true,opacity:0,colorWrite:false,depthWrite:false,side:THREE.DoubleSide}));
 hit.position.set(pos.x,pos.y+1,pos.z);hit.userData.unit=unit;hitTargets.push(hit);scene.add(hit);
 var label=document.createElement("button");label.className="world-marker";label.type="button";label.innerHTML='<span class="marker-emoji"></span><span><b></b><small></small></span>';
 label.querySelector(".marker-emoji").textContent=unit.emoji||"🧱";
 label.querySelector("b").textContent="世界 "+(idx+1)+" · "+unit.name;
 label.querySelector("small").textContent=unit.title;
 label.addEventListener("click",function(){selectUnit(unit);});
 document.getElementById("worldLabels").appendChild(label);
 markerNodes.push({el:label,position:new THREE.Vector3(pos.x,pos.y+7.2,pos.z),unit:unit});
 islands.push({unit:unit,position:new THREE.Vector3(pos.x,pos.y+1,pos.z),idx:idx});
}
function makeHub(){
 var group=new THREE.Group(),b={},pal={grass:"#75b64c",leaf:"#418c49",dirt:"#91643d",wood:"#78502e",roof:"#a74f37",accent:"#f1c86d",stone:"#777e7b"};
 addIslandTerrain(b,7,pal,900);
 addHouse(b,-3,-2,2,pal,.8);addHouse(b,3,-2,2,pal,.8);
 addTree(b,-5,3,2,"#4a9a4c");addTree(b,5,3,2,"#4a9a4c");
 for(var x=-2;x<=2;x++)for(var z=4;z<=6;z++)addBlock(b,"stone",x,2,z,"#8d9c8c");
 for(var y=2;y<=6;y++){addBlock(b,"gold",-2,y,6,"#d6a84f");addBlock(b,"gold",2,y,6,"#d6a84f");}
 for(var x=-2;x<=2;x++){addBlock(b,"gold",x,6,6,"#d6a84f");addBlock(b,"gold",x,2,6,"#d6a84f");}
 flushBlocks(group,b);scene.add(group);
 var portal=new THREE.Mesh(new THREE.PlaneGeometry(3.4,3.8),new THREE.MeshBasicMaterial({color:"#52c6e7",transparent:true,opacity:.63,side:THREE.DoubleSide}));
 portal.position.set(0,4,6.03);scene.add(portal);
 var glow=new THREE.PointLight("#52c6ff",2.5,12);glow.position.set(0,4,7);scene.add(glow);
 var avatar=new THREE.Group();
 function part(x,y,z,sx,sy,sz,color){var m=new THREE.Mesh(cubeGeo,new THREE.MeshStandardMaterial({color:color,roughness:1}));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;avatar.add(m);return m;}
 part(0,2.2,0,.95,1.2,.55,"#2f77b7");part(0,3.35,0,.92,.92,.85,"#e3b98b");part(0,3.83,0,.95,.22,.9,"#4a3021");part(-.26,3.4,.44,.12,.12,.06,"#202b28");part(.26,3.4,.44,.12,.12,.06,"#202b28");part(-.28,1.25,0,.34,.9,.42,"#455c9a");part(.28,1.25,0,.34,.9,.42,"#455c9a");part(-.65,2.3,0,.28,1,.3,"#d5a67b");part(.65,2.3,0,.28,1,.3,"#d5a67b");
 avatar.position.set(0,2.2,1.8);scene.add(avatar);window.__wordmapAvatar=avatar;
 var board=document.createElement("canvas");board.width=512;board.height=128;var ctx=board.getContext("2d");
 ctx.fillStyle="#18352d";ctx.fillRect(0,0,512,128);ctx.fillStyle="#d6b96f";ctx.fillRect(0,0,512,8);ctx.fillRect(0,120,512,8);ctx.fillRect(0,0,8,128);ctx.fillRect(504,0,8,128);ctx.fillStyle="#f6edc8";ctx.font="bold 48px Trebuchet MS, sans-serif";ctx.textAlign="center";ctx.fillText("WORDCRAFT",256,78);
 var tex=new THREE.CanvasTexture(board);tex.colorSpace=THREE.SRGBColorSpace;
 var sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:true}));sprite.scale.set(8,2,1);sprite.position.set(0,10.5,0);scene.add(sprite);window.__wordmapBoard={canvas:board,ctx:ctx,texture:tex};
}
function makeBridge(pos){
 var group=new THREE.Group(),b={};
 var dx=pos.x,dz=pos.z,len=Math.sqrt(dx*dx+dz*dz),steps=10;
 for(var i=0;i<=steps;i++){var t=i/steps,x=dx*t,z=dz*t;if(t>.33&&t<.72){addBlock(b,"wood",x,0,z,"#8c633b",.82);if(i%2===0){addBlock(b,"wood",x,1,z-0.6,"#a67c49",.55);addBlock(b,"wood",x,1,z+0.6,"#a67c49",.55);}}}
 flushBlocks(group,b);scene.add(group);
}
function makeCloud(x,y,z,scale){
 var g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:"#ffffff",roughness:1});
 var pieces=[[-1,0,0,2,1,1],[0,.45,0,2,1.2,1],[1.2,0,0,1.8,1,1],[.2,-.25,.55,1.5,.65,.7]];
 pieces.forEach(function(p){var m=new THREE.Mesh(cubeGeo,mat);m.position.set(p[0],p[1],p[2]);m.scale.set(p[3],p[4],p[5]);g.add(m);});
 g.position.set(x,y,z);g.scale.setScalar(scale||1);scene.add(g);clouds.push({group:g,speed:.12+Math.random()*.14,origin:x});
}
function makeBackdrop(){
 var sea=new THREE.Mesh(new THREE.PlaneGeometry(220,220),new THREE.MeshStandardMaterial({color:"#4ba9c5",transparent:true,opacity:.48,roughness:.4,metalness:.05}));sea.rotation.x=-Math.PI/2;sea.position.y=-11;scene.add(sea);
 var sunCube=new THREE.Mesh(cubeGeo,new THREE.MeshBasicMaterial({color:"#ffe6a0"}));sunCube.scale.set(5,5,5);sunCube.position.set(-28,27,-34);scene.add(sunCube);
 var b={};
 for(var i=0;i<10;i++){
  var a=i*Math.PI/5,dist=38+(i%3)*5,mx=Math.cos(a)*dist,mz=Math.sin(a)*dist,height=5+(i%4)*2;
  for(var y=0;y<height;y++)for(var x=-2;x<=2;x++)for(var z=-2;z<=2;z++)if(Math.abs(x)+Math.abs(z)<5-y*.45)addBlock(b,"stone",mx+x,y-2,mz+z,"#73847e",1.1);
  for(var x=-2;x<=2;x++)for(var z=-2;z<=2;z++)if(Math.abs(x)+Math.abs(z)<4)addBlock(b,"grass",mx+x,height-2,mz+z,"#568d53",1.1);
 }
 var g=new THREE.Group();flushBlocks(g,b);scene.add(g);
 makeCloud(-24,18,-20,1.7);makeCloud(19,22,-27,1.35);makeCloud(29,15,15,1.1);makeCloud(-25,16,23,1.3);makeCloud(0,25,32,1.7);
 var particleGeo=new THREE.BoxGeometry(.18,.18,.18);
 for(var p=0;p<65;p++){
  var pm=new THREE.Mesh(particleGeo,new THREE.MeshBasicMaterial({color:p%3===0?"#ffe6a0":(p%3===1?"#d7f4ff":"#a8dc82")}));
  pm.position.set((Math.random()-.5)*55,Math.random()*18+2,(Math.random()-.5)*55);scene.add(pm);particles.push({mesh:pm,phase:Math.random()*6,speed:.3+Math.random()*.7});
 }
}
function buildWorld(){
 makeBackdrop();makeHub();
 for(var i=0;i<DATA.units.length;i++){makeBridge(unitPositions[i]);makeIsland(DATA.units[i],i);}
}
function unitById(id){return DATA.units.find(function(u){return u.id===id;});}
function getUnitProgress(unit){
 if(!API)return {open:0,total:0,done:0};
 var list=API.getWords().filter(function(w){return w.unit===unit.id;});
 return {open:list.filter(function(w){return API.isUnlocked(w.id);}).length,total:list.length,done:list.filter(function(w){return API.isMastered(w.id);}).length};
}
function buildQuestList(){
 var host=document.getElementById("worldUnitList");if(!host)return;host.innerHTML="";
 DATA.units.forEach(function(u,i){
  var p=getUnitProgress(u),button=document.createElement("button");button.type="button";button.className="world-unit-button";button.dataset.unit=u.id;
  var icon=document.createElement("span");icon.className="world-unit-icon";icon.textContent=u.emoji||"🧱";
  var copy=document.createElement("span");copy.className="world-unit-copy";var title=document.createElement("b");title.textContent=u.name;var sub=document.createElement("small");sub.textContent="世界 "+(i+1)+" · "+u.title;copy.appendChild(title);copy.appendChild(sub);
  var count=document.createElement("span");count.className="world-unit-count";count.textContent=p.done+"/"+p.total;
  button.appendChild(icon);button.appendChild(copy);button.appendChild(count);button.addEventListener("click",function(){selectUnit(u);});host.appendChild(button);
 });
}
function updateBillboard(w){
 var board=window.__wordmapBoard;if(!board||!w)return;
 var ctx=board.ctx;ctx.clearRect(0,0,512,128);ctx.fillStyle="#18352d";ctx.fillRect(0,0,512,128);ctx.fillStyle="#d6b96f";ctx.fillRect(0,0,512,8);ctx.fillRect(0,120,512,8);ctx.fillRect(0,0,8,128);ctx.fillRect(504,0,8,128);
 ctx.fillStyle="#b5d78a";ctx.font="bold 20px Trebuchet MS, sans-serif";ctx.textAlign="center";ctx.fillText("CURRENT QUEST",256,35);
 ctx.fillStyle="#fff0c8";ctx.font="bold 48px Trebuchet MS, sans-serif";ctx.fillText(String(w.en||"WORD").toUpperCase().slice(0,17),256,91);
 board.texture.needsUpdate=true;
}
function syncHud(){
 if(!API)return;
 var w=API.getCurrentWord();if(w){
  var unit=unitById(w.unit);document.getElementById("worldCurrentWord").textContent=w.en;
  document.getElementById("worldCurrentMeaning").textContent=w.zh;
  document.getElementById("worldCurrentUnit").textContent=(unit?unit.name:"自定义词")+" · 当前任务";
  var p=API.getProgress(w.id),pct=Math.max(0,Math.min(100,(p.level||0)*20));document.getElementById("worldProgressBar").style.width=pct+"%";
  updateBillboard(w);
  if(unit){selectedUnitId=unit.id;var found=islands.find(function(x){return x.unit.id===unit.id;});if(found){markerNodes.forEach(function(m){m.el.classList.toggle("active",m.unit.id===unit.id);});document.querySelectorAll(".world-unit-button").forEach(function(b){b.classList.toggle("active",b.dataset.unit===unit.id);});}}
 }
 buildQuestList();
}
function focusIsland(unitId){
 var item=islands.find(function(x){return x.unit.id===unitId;});if(!item)return;
 targetGoal.copy(item.position);radiusGoal=31;
 selectedUnitId=unitId;
}
function selectUnit(unit){
 if(!unit||!API)return;
 focusIsland(unit.id);API.setCurrent(unit.seed);syncHud();
}
function resetView(){targetGoal.set(0,1,0);radiusGoal=43;yaw=.73;pitch=.61;}
function updateCamera(dt){
 target.lerp(targetGoal,Math.min(1,dt*2.5));
 radius+=(radiusGoal-radius)*Math.min(1,dt*2.5);
 var cp=Math.cos(pitch),sp=Math.sin(pitch);
 camera.position.set(target.x+Math.sin(yaw)*cp*radius,target.y+sp*radius,target.z+Math.cos(yaw)*cp*radius);
 camera.lookAt(target);
}
function updateMarkers(){
 var width=window.innerWidth,height=window.innerHeight;
 markerNodes.forEach(function(m){
  var v=m.position.clone().project(camera),x=(v.x*.5+.5)*width,y=(-v.y*.5+.5)*height;
  var visible=v.z<1&&x>-100&&x<width+100&&y>40&&y<height-70;
  m.el.style.display=visible?"flex":"none";m.el.style.left=x+"px";m.el.style.top=y+"px";
 });
}
function animate(){
 requestAnimationFrame(animate);var dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
 updateCamera(dt);
 clouds.forEach(function(c){c.group.position.x=c.origin+Math.sin(t*c.speed*.18)*2.2;c.group.position.y+=Math.sin(t*c.speed)*.0008;});
 particles.forEach(function(p){p.mesh.position.y+=Math.sin(t*p.speed+p.phase)*.002;p.mesh.rotation.y+=dt*p.speed*.3;});
 if(window.__wordmapAvatar)window.__wordmapAvatar.position.y=2.2+Math.sin(t*2.2)*.08;
 renderer.render(scene,camera);updateMarkers();
}
var pointerDown=false,dragged=false,startX=0,startY=0,lastX=0,lastY=0;
canvas.addEventListener("pointerdown",function(e){pointerDown=true;dragged=false;startX=lastX=e.clientX;startY=lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener("pointermove",function(e){if(!pointerDown)return;var dx=e.clientX-lastX,dy=e.clientY-lastY;if(Math.abs(e.clientX-startX)+Math.abs(e.clientY-startY)>5)dragged=true;if(dragged){yaw-=dx*.006;pitch=Math.max(.22,Math.min(1.22,pitch+dy*.004));}lastX=e.clientX;lastY=e.clientY;});
canvas.addEventListener("pointerup",function(e){pointerDown=false;if(dragged)return;pointer.x=(e.clientX/window.innerWidth)*2-1;pointer.y=-(e.clientY/window.innerHeight)*2+1;raycaster.setFromCamera(pointer,camera);var hits=raycaster.intersectObjects(hitTargets,false);if(hits.length&&hits[0].object.userData.unit)selectUnit(hits[0].object.userData.unit);});
canvas.addEventListener("pointercancel",function(){pointerDown=false;});
canvas.addEventListener("wheel",function(e){radiusGoal=Math.max(25,Math.min(65,radiusGoal+e.deltaY*.025));},{passive:true});
document.getElementById("worldResetView").addEventListener("click",resetView);
window.addEventListener("resize",function(){camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight,false);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));});
window.addEventListener("wordmap:current",syncHud);
window.addEventListener("wordmap:stats",syncHud);
buildWorld();buildQuestList();syncHud();animate();
})();