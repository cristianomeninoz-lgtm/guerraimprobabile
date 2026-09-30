/* ===== UNHINGED WARFARE — Audio procedurale (WebAudio, zero file) ===== */
window.AUDIO=(function(){
let ctx=null,mg=null,sg=null,started=false;
function ensure(){ if(!ctx){ try{ ctx=new (window.AudioContext||window.webkitAudioContext)(); mg=ctx.createGain(); sg=ctx.createGain(); mg.connect(ctx.destination); sg.connect(ctx.destination);}catch(e){} }
  if(ctx&&ctx.state==='suspended') ctx.resume(); }
function apply(){ if(!ctx)return; ensure(); mg.gain.value=(SAVE.data.settings.music||0)*0.5; sg.gain.value=(SAVE.data.settings.sfx||0)*0.7; }
function tone(f,dur,type,vol,slide){ ensure(); if(!ctx)return; try{
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.type=type||'square'; o.frequency.value=f;
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),ctx.currentTime+dur);
  g.gain.setValueAtTime(vol||0.15,ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur);
  o.connect(g); g.connect(sg); o.start(); o.stop(ctx.currentTime+dur);}catch(e){} }
function noise(dur,vol,flp){ ensure(); if(!ctx)return; try{
  const n=Math.floor(ctx.sampleRate*dur), b=ctx.createBuffer(1,n,ctx.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
  const s=ctx.createBufferSource(); s.buffer=b;
  const g=ctx.createGain(); g.gain.value=vol||0.2;
  let node=s;
  if(flp){ const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=flp; s.connect(f); node=f; }
  node.connect(g); g.connect(sg); s.start(); }catch(e){} }
let musTimer=null,musStep=0,musPat=null,musTempo=210;
/* scale psichedeliche: frigia/discordante per il menu, piu' dura in battaglia */
const PATS={
  menu:[110,116.5,0,130.8,146.8,0,130.8,116.5,98,0,116.5,130.8,0,146.8,164.8,146.8],
  battle:[110,110,116.5,130.8,0,146.8,130.8,116.5,98,98,116.5,130.8,164.8,0,146.8,130.8],
  boss:[73.4,0,73.4,77.8,0,87.3,69.3,0,73.4,0,77.8,73.4,0,87.3,98,69.3],
  duel:[146.8,0,155.6,174.6,0,146.8,130.8,0,116.5,0,146.8,155.6,174.6,0,130.8,116.5]
};
const TEMPO={menu:245,battle:175,boss:158,duel:185};
/* pad triangolare smorzato: alone mistico dietro la melodia */
function pad(f,dur,vol){ ensure(); if(!ctx)return; try{
  const g=ctx.createGain(),flt=ctx.createBiquadFilter();
  flt.type='lowpass'; flt.frequency.setValueAtTime(320,ctx.currentTime);
  flt.frequency.exponentialRampToValueAtTime(1100,ctx.currentTime+dur*0.5);
  flt.frequency.exponentialRampToValueAtTime(280,ctx.currentTime+dur);
  g.gain.setValueAtTime(0.0001,ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(vol||0.035,ctx.currentTime+dur*0.35);
  g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur);
  [f,f*1.005,f*1.5].forEach(fr=>{ const o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=fr;
    o.connect(flt); o.start(); o.stop(ctx.currentTime+dur); });
  flt.connect(g); g.connect(mg);
}catch(e){} }
function musLoop(){ if(!ctx||!musPat)return;
  const n=musPat[musStep%musPat.length];
  if(n){
    /* lead con vibrato tramite slide + ottava soffiata */
    tone(n,0.26,'triangle',0.055,musStep%3===0?n*0.02:0);
    if(musStep%2===0) tone(n/2,0.42,'triangle',0.05,-n*0.01);
    if(musStep%4===2) tone(n*2,0.5,'sine',0.022);
    if(musStep%8===0) pad(n/2,1.6,0.03);
    if(musStep%16===12) noise(0.22,0.025,2600); // scia d'aria psichedelica
  }
  musStep++; musTimer=setTimeout(musLoop,musTempo); }
return {
  start(){ if(started)return; started=true; apply(); },
  apply,
  music(name){ ensure(); if(musTimer){clearTimeout(musTimer);musTimer=null;} musPat=PATS[name]||null; musTempo=TEMPO[name]||210; musStep=0; if(musPat&&SAVE.data.settings.music>0) musLoop(); },
  stopMusic(){ musPat=null; if(musTimer){clearTimeout(musTimer);musTimer=null;} },
  hit(){ noise(0.08,0.25,1200); tone(160,0.08,'sawtooth',0.12,-80); },
  heavy(){ noise(0.16,0.35,700); tone(90,0.18,'sawtooth',0.18,-50); },
  dash(){ noise(0.12,0.12,2500); },
  jump(){ tone(300,0.12,'square',0.08,240); },
  coin(){ tone(880,0.07,'square',0.1); setTimeout(()=>tone(1318,0.12,'square',0.1),60); },
  ult(){ ensure(); if(!ctx)return; tone(65,0.9,'sawtooth',0.3,220); noise(0.7,0.3,900); },
  hurt(){ tone(220,0.15,'sawtooth',0.2,-140); },
  click(){ tone(600,0.05,'square',0.08,200); },
  unlock(){ [523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,0.18,'square',0.12),i*110)); },
  vase(){ noise(0.2,0.3,3000); tone(700,0.1,'triangle',0.1,-500); },
  bossRoar(){ tone(55,0.8,'sawtooth',0.28,35); noise(0.5,0.2,300); },
  shoot(){ tone(900,0.06,'square',0.06,-400); }
};})();
