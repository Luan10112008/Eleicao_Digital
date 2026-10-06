const DB_NAME = "eleicao-offline-db";
const DB_VERSION = 1;
const STORE = "app";
const CANDIDATES = [
  {id:"01", name:"Ana Martins", party:"Renovação Digital", number:"01"},
  {id:"02", name:"Bruno Costa", party:"Conexão Cidadã", number:"02"},
  {id:"03", name:"Carla Souza", party:"Inovação Brasil", number:"03"}
];

let selected = null;
let db;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=e=>{
      const d=e.target.result;
      if(!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
    };
    req.onsuccess=e=>{db=e.target.result;resolve(db)};
    req.onerror=()=>reject(req.error);
  });
}
function dbGet(key){
  return new Promise((resolve,reject)=>{
    const req=db.transaction(STORE,"readonly").objectStore(STORE).get(key);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
function dbSet(key,value){
  return new Promise((resolve,reject)=>{
    const req=db.transaction(STORE,"readwrite").objectStore(STORE).put(value,key);
    req.onsuccess=resolve; req.onerror=()=>reject(req.error);
  });
}
function now(){return new Date().toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2800)}
function logNotification(title,text){
  const list=JSON.parse(localStorage.getItem("notifications")||"[]");
  list.unshift({title,text,time:now()});
  localStorage.setItem("notifications",JSON.stringify(list.slice(0,20)));
  renderNotifications();
}
function renderNotifications(){
  const list=JSON.parse(localStorage.getItem("notifications")||"[]");
  $("#notificationLog").innerHTML=list.length?list.map(x=>`<div class="notification-item"><strong>${x.title}</strong><div>${x.text}</div><small>${x.time}</small></div>`).join(""):`<div class="notice info">Nenhuma notificação registrada ainda.</div>`;
}
function renderCandidates(){
  const voted=localStorage.getItem("voted")==="true";
  $("#candidateGrid").innerHTML=CANDIDATES.map(c=>`
    <article class="candidate ${selected===c.id?"selected":""}">
      <div class="number">${c.number}</div>
      <h3>${c.name}</h3><p>${c.party}</p>
      <button class="btn ${selected===c.id?"btn-primary":"btn-light"}" data-candidate="${c.id}" ${voted?"disabled":""}>${selected===c.id?"Selecionado":"Votar neste candidato"}</button>
    </article>`).join("");
  $$("#candidateGrid button").forEach(b=>b.onclick=()=>{selected=b.dataset.candidate;renderCandidates();const c=CANDIDATES.find(x=>x.id===selected);$("#selectedCandidate").textContent=`${c.number} - ${c.name}`;$("#voteSummary").classList.remove("hidden")});
  if(voted){$("#alreadyVoted").classList.remove("hidden");$("#voteSummary").classList.add("hidden")}
}
async function getVotes(){return (await dbGet("votes"))||Object.fromEntries(CANDIDATES.map(c=>[c.id,0]))}
async function renderResults(){
  const votes=await getVotes(); const total=Object.values(votes).reduce((a,b)=>a+b,0);
  $("#totalVotes").textContent=`${total} ${total===1?"voto":"votos"}`;
  $("#resultsGrid").innerHTML=CANDIDATES.map(c=>`<div class="result-card"><span>${c.number} · ${c.party}</span><strong>${votes[c.id]||0}</strong><span>votos</span></div>`).join("");
  $("#bars").innerHTML=CANDIDATES.map(c=>{
    const n=votes[c.id]||0,p=total?Math.round(n/total*100):0;
    return `<div class="bar-row"><div class="bar-label"><span>${c.name}</span><strong>${p}%</strong></div><div class="bar-bg"><div class="bar" style="width:${p}%"></div></div></div>`;
  }).join("");
}
async function registerVote(){
  if(!selected || localStorage.getItem("voted")==="true") return;
  const votes=await getVotes(); votes[selected]=(votes[selected]||0)+1;
  await dbSet("votes",votes);
  const pending=JSON.parse(localStorage.getItem("pendingVotes")||"[]");
  pending.push({candidateId:selected,createdAt:new Date().toISOString(),synced:navigator.onLine});
  localStorage.setItem("pendingVotes",JSON.stringify(pending));
  localStorage.setItem("voted","true");
  const c=CANDIDATES.find(x=>x.id===selected);
  $("#appStatus").textContent=navigator.onLine?"Voto registrado":"Voto salvo offline";
  $("#syncStatus").textContent=navigator.onLine?"Dados disponíveis localmente.":"Voto aguardando sincronização.";
  logNotification("Voto registrado",`Voto para ${c.name} salvo com segurança no dispositivo.`);
  if("serviceWorker" in navigator && "SyncManager" in window){
    const reg=await navigator.serviceWorker.ready;
    try{await reg.sync.register("sync-votes")}catch(e){}
  }
  if(navigator.onLine) syncPending();
  renderCandidates(); renderResults(); updateSyncStatus();
  toast(navigator.onLine?"Voto registrado com sucesso!":"Sem internet: voto salvo e pronto para sincronização.");
}
async function syncPending(){
  const pending=JSON.parse(localStorage.getItem("pendingVotes")||"[]");
  if(!pending.length){updateSyncStatus();return}
  pending.forEach(x=>x.synced=true);
  localStorage.setItem("pendingVotes",JSON.stringify(pending));
  $("#syncStatus").textContent="Dados locais sincronizados.";
  updateSyncStatus();
}
function updateSyncStatus(){
  const pending=JSON.parse(localStorage.getItem("pendingVotes")||"[]");
  $("#syncStatus").textContent=pending.length?`${pending.length} evento(s) de voto registrado(s).`: "Nenhum voto pendente.";
}
function updateNetwork(){
  const online=navigator.onLine;
  const el=$("#networkStatus");el.textContent=online?"● Online":"● Offline";el.className=`status-pill ${online?"online":"offline"}`;
  if(!online){$("#appStatus").textContent="Modo offline ativo";$("#syncStatus").textContent="Aplicação funcionando sem internet."}
  else {$("#appStatus").textContent="Pronta para votar";syncPending()}
}
async function enableNotifications(){
  if(!("Notification" in window)){toast("Seu navegador não oferece notificações.");return}
  const permission=await Notification.requestPermission();
  if(permission==="granted"){
    new Notification("Eleição Digital",{body:"Notificações ativadas com sucesso."});
    logNotification("Notificações ativadas","O navegador autorizou as notificações desta PWA.");
    toast("Notificações ativadas.");
  }else toast("Permissão de notificação não concedida.");
}
function setupTabs(){
  $$(".tab").forEach(btn=>btn.onclick=()=>{
    $$(".tab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
    $$(".tab-panel").forEach(x=>x.classList.remove("active"));$(`#${btn.dataset.tab}`).classList.add("active");
    if(btn.dataset.tab==="resultados")renderResults();
  });
}
async function reset(){
  if(!confirm("Resetar todos os votos desta simulação neste dispositivo?"))return;
  await dbSet("votes",Object.fromEntries(CANDIDATES.map(c=>[c.id,0])));
  localStorage.removeItem("voted");localStorage.removeItem("pendingVotes");localStorage.removeItem("notifications");
  selected=null;renderCandidates();renderResults();renderNotifications();updateSyncStatus();toast("Simulação resetada.");
}
let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").classList.remove("hidden")});
$("#installBtn").onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("#installBtn").classList.add("hidden")};
window.addEventListener("online",updateNetwork);window.addEventListener("offline",updateNetwork);
$("#confirmVote").onclick=registerVote;$("#notifyBtn").onclick=enableNotifications;$("#resetBtn").onclick=reset;

(async function init(){
  await openDB();
  if(!(await dbGet("votes"))) await dbSet("votes",Object.fromEntries(CANDIDATES.map(c=>[c.id,0])));
  if("serviceWorker" in navigator){
    try{await navigator.serviceWorker.register("sw.js");}catch(e){console.warn("SW:",e)}
  }
  setupTabs();renderCandidates();renderResults();renderNotifications();updateSyncStatus();updateNetwork();
})();