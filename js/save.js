/* ===== UNHINGED WARFARE — Salvataggio (localStorage) ===== */
window.SAVE = (function(){
const KEY='unhinged_warfare_v1';
const def={ lang:'it', coins:150, storyLevel:0, bestChaos:0, seen:{}, chars:['zappo','mimi','bruno'],
  looks:{
    zappo:{outfit:'tuta', weapon:'mattarello', hat:'nessuno', color:0},
    mimi:{outfit:'tuta', weapon:'mattarello', hat:'nessuno', color:0},
    bruno:{outfit:'tuta', weapon:'mattarello', hat:'nessuno', color:0}
  },
  settings:{music:.7,sfx:.9,quality:'high',haptics:true,render3d:true},
  trophies:{}, weeklyDone:0, weeklyKey:'', clips:[], discoveries:{}, stats:{ults:0,maxCombo:0,coinsTotal:0} };
let data;
try{ data=Object.assign({},def,JSON.parse(localStorage.getItem(KEY)||'{}')); }
catch(e){ data=Object.assign({},def); }
data.settings=Object.assign({},def.settings,data.settings||{});
data.stats=Object.assign({},def.stats,data.stats||{});
data.looks=Object.assign({},def.looks,data.looks||{});
data.discoveries=Object.assign({},def.discoveries,data.discoveries||{});
data.secrets=Object.assign({},data.secrets||{});
if(!Array.isArray(data.chars)) data.chars=[];
['zappo','mimi','bruno'].forEach(function(id){
  if(data.chars.indexOf(id)<0)data.chars.push(id);
  data.looks[id]=data.looks[id]||{outfit:'tuta',weapon:'mattarello',hat:'nessuno',color:0};
});
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(data)); }catch(e){} }
save(); // migra anche i salvataggi precedenti al roster iniziale di tre personaggi
/* ---------- Classifica locale delle Prove (top 10) ---------- */
function trialBoard(){
  if(!Array.isArray(data.trialBoard)) data.trialBoard=[];
  return data.trialBoard;
}
function addTrialScore(trialId,charId,time){
  const b=trialBoard();
  const entry={trial:trialId,char:charId,time:Math.round(time*10)/10,ts:Date.now()};
  b.push(entry);
  b.sort((x,y)=>x.time-y.time);
  if(b.length>10) b.length=10;
  save();
  /* rank (1-10) della run se ancora in classifica, altrimenti 0 */
  const idx=b.findIndex(e=>e.ts===entry.ts);
  return idx>=0?idx+1:0;
}
function makeLook(id){ data.looks[id]=data.looks[id]||{outfit:'tuta',weapon:'mattarello',hat:'nessuno',color:0}; return data.looks[id]; }
function checkFullTrophy(){
  /* Sblocca tutti gli Svitati: assegnato quando chars contiene tutti gli id di DATA.Chars */
  const ids=Object.keys(window.DATA?DATA.Chars:{});
  if(ids.length&&ids.every(id=>data.chars.indexOf(id)>=0)&&!data.trophies.full){
    data.trophies.full=Date.now();
  }
}
return {
  data, save, trialBoard, addTrialScore,
  recordDiscovery(id){
    if(!id||data.discoveries[id]) return false;
    data.discoveries[id]=Date.now(); save(); return true;
  },
  discoveryCount(){ return Object.keys(data.discoveries||{}).length; },
  unlocked(id){ return data.chars.indexOf(id)>=0; },
  unlockChar(id){ if(!this.unlocked(id)){ data.chars.push(id); makeLook(id); checkFullTrophy(); save(); return true; } return false; },
  look(id){ return data.looks[id]||{outfit:'tuta',weapon:'mattarello',hat:'nessuno',color:0}; },
  setLook(id,l){ data.looks[id]=l; save(); },
  addCoins(n){ data.coins+=n; data.stats.coinsTotal+=n; if(data.stats.coinsTotal>=5000) this.trophy('rich'); save(); },
  spend(n){ if(data.coins<n) return false; data.coins-=n; save(); return true; },
  trophy(id){ if(!data.trophies[id]){ data.trophies[id]=Date.now(); save(); return true; } return false; },
  weeklyKey(){ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+Math.floor(d.getDate()/7); }
};})();