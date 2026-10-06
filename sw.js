const CACHE="eleicao-offline-v1";
const ASSETS=["./","./index.html","./css/style.css","./js/app.js","./manifest.webmanifest","./icons/icon.svg"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return response;
  }).catch(()=>caches.match("./index.html"))));
});
self.addEventListener("sync",event=>{
  if(event.tag==="sync-votes"){
    event.waitUntil(self.registration.showNotification("Eleição Digital",{body:"Os registros locais estão prontos para sincronização.",icon:"./icons/icon.svg",tag:"vote-sync"}));
  }
});
self.addEventListener("message",event=>{
  if(event.data?.type==="TEST_NOTIFICATION"){
    self.registration.showNotification(event.data.title||"Eleição Digital",{body:event.data.body||"Notificação de teste."});
  }
});
