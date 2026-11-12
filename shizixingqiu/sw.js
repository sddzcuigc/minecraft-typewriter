"use strict";
const CACHE_NAME="shizixingqiu-core-v9";
const CORE=["./","./index.html","./style.css","./design-v32.css","./data.js","./notes.js","./app.js","./advanced.js","./teacher-engine.js","./teacher.js","./strokes.js","./ATTRIBUTION.md","./STROKE-DATA-LICENSE.txt","./UPSTREAM-MIT-LICENSE.txt"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("shizixingqiu-")&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 event.respondWith(caches.match(req).then(async cached=>{
  if(cached)return cached;
  try{const response=await fetch(req);if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy))}return response}
  catch(err){return new Response("Offline: this resource has not been cached yet.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}})}
 }));
});
