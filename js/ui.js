/* ===== UNHINGED WARFARE — Schermate e input ===== */
window.UI=(function(){
let canvas,c,screen='title',T=0,last=performance.now();
let buttons=[], buyGrids=[];
let inputState={left:false,right:false,up:false,down:false,dash:false,attack:false,ability:false,ult:false,interact:false,padMoveX:0,padMoveY:0,cameraX:0,cameraY:0};
const touchHeld={attack:false,ability:false,ult:false,dash:false,interact:false};
const touchPointers=Object.create(null);
let keys={};
let sel={char:0,level:0,tab:0,cat:0,shopCat:0,custChar:0,duel1:0,duel2:0,cpu:true,item:-1,shareTab:0,trial:0,vsBoss:false,vsBossIdx:0,board:-1};
let game=null, loopOn=false, pauseSel=false, resKind='win';
let pillsOpen=false, pillsValue='', pillsToast='';
let activeMenuCard=0;
let toastMsg='', toastT=0, lastFrame=performance.now();
function toast(m){ toastMsg=m; toastT=1.6; }
const W=ENGINE.W,H=ENGINE.H,GY=ENGINE.GY;
const YEL='#E8FF00', MAG='#FF2FB0', GRN='#39FF14', GYD='#9a9a9a';

function rr(c,x,y,w,h,r){ c.beginPath();
  if(c.roundRect){ c.roundRect(x,y,w,h,r); }
  else { c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
}
function jitter(mag){ const m=mag||2; return {jx:(Math.random()*2-1)*m, jy:(Math.random()*2-1)*m}; }

/* ---------- Pulsanti ---------- */
function btn(x,y,w,h,label,action,opts){
  opts=opts||{};
  buttons.push({x,y,w,h,label,action,opts,hl:jitter(opts.flat?0:2)});
}
function drawBtn(c,b){
  const hov=b.hover, col=b.opts.color||YEL, pulse=0.5+0.5*Math.sin(T*3+b.x*0.025);
  c.save();
  c.translate(b.x+b.hl.jx,b.y+b.hl.jy);
  if(b.opts.big){
    c.save();c.shadowColor=col;c.shadowBlur=hov?24:8+pulse*5;
    c.fillStyle='rgba(12,10,18,0.96)';rr(c,-3,-2,b.w+6,b.h+5,12);c.fill();c.restore();
  }
  c.fillStyle=hov?col:'rgba(12,10,18,0.88)';
  rr(c,0,0,b.w,b.h,10); c.fill();
  c.strokeStyle=col; c.lineWidth=b.opts.big?3.5:3; rr(c,0,0,b.w,b.h,10); c.stroke();
  /* graffi e linguette da poster stampato */
  c.strokeStyle=col;c.lineWidth=2;
  c.beginPath();c.moveTo(6,4);c.lineTo(2,12);c.moveTo(b.w-8,4);c.lineTo(b.w-4,12);
  c.moveTo(b.w*0.68,3);c.lineTo(b.w*0.68+7,3);c.stroke();
  if(b.opts.big){c.fillStyle=MAG;c.beginPath();c.moveTo(b.w-22,1);c.lineTo(b.w-3,1);c.lineTo(b.w-3,13);c.closePath();c.fill();}
  c.fillStyle=hov?'#0c0a12':col;
  c.font=(b.opts.big?'bold 30px':'bold 20px')+' Arial';
  c.textAlign='center'; c.textBaseline='middle';
  c.fillText(b.label,b.w/2,b.h/2+2);
  if(b.opts.sub){ c.font='11px Arial'; c.fillStyle=hov?'#0c0a12':'#aaa';
    c.fillText(b.opts.sub,b.w/2,b.h-14); }
  c.restore();
}
function hitTest(x,y){ for(let i=buttons.length-1;i>=0;i--){ const b=buttons[i];
  if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h) return b; } return null; }

/* ---------- Coordinamento con main ---------- */
function setGame(g){ game=g; }
function getGame(){ return game; }
function getScreen(){ return screen; }
function go(s){ screen=s; buttons=[]; buyGrids=[]; AUDIO.click();
  if(s==='menu'){ AUDIO.music('menu'); }
}
function activateMenuCard(index){
  activeMenuCard=((index%6)+6)%6;
  [()=>go('mode'),()=>go('custom'),()=>go('shop'),()=>go('trophies'),()=>go('settings'),()=>go('share')][activeMenuCard]();
}
function drawToast(){
  if(toastT<=0)return; toastT-=1/60;
  c.save(); c.globalAlpha=Math.min(1,toastT);
  c.fillStyle='#0c0a12'; rr(c,W/2-140,H-90,280,40,10); c.fill();
  c.strokeStyle=YEL; c.lineWidth=2; rr(c,W/2-140,H-90,280,40,10); c.stroke();
  c.fillStyle=YEL; c.font='bold 15px Arial'; c.textAlign='center';
  c.fillText(toastMsg,W/2,H-64); c.restore();
}

/* ================= SCHERMI ================= */
function drawTitle(){
  const cw=canvas.width/ch2Scale(), ch=canvas.height;
  const bgGrad=c.createLinearGradient(0,0,0,H); bgGrad.addColorStop(0,'#120a22'); bgGrad.addColorStop(0.55,'#1b1030'); bgGrad.addColorStop(1,'#070710');
  c.fillStyle=bgGrad; c.fillRect(0,0,W,H);
  /* fari di scena che si inseguono */
  c.save(); c.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){
    const a=Math.sin(T*0.42+i*2.1)*0.42, ox=W*(0.16+i*0.34);
    const g=c.createLinearGradient(ox,0,ox+Math.sin(a)*W*0.6,H);
    g.addColorStop(0,i%2?'rgba(255,47,176,0.12)':'rgba(82,242,255,0.12)'); g.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=g; c.beginPath(); c.moveTo(ox-16,0); c.lineTo(ox+16,0);
    c.lineTo(ox+Math.sin(a)*W*0.55+120,H); c.lineTo(ox+Math.sin(a)*W*0.55-120,H); c.closePath(); c.fill();
  }
  c.restore();
  /* silhouette sovrapposte */
  const ids=Object.keys(DATA.Chars);
  ids.forEach((id,i)=>{
    c.save(); c.globalAlpha=0.16;
    const x=120+((i*127)% (W-240)) + Math.sin(T+i)*20;
    R.drawActor(c,{x,y:GY-40-i*18,s:1.6+i*0.1,h:64,dir:1,t:T+i,draw:'chars',id});
    c.restore();
  });
  /* palco: svitati che ballano col groove */
  for(let i=0;i<3;i++){
    const bx=W*0.18+i*W*0.32+Math.sin(T*1.6+i*2)*28;
    const bob=Math.abs(Math.sin(T*3.4+i))*12;
    R.drawActor(c,{x:bx,y:GY-18-bob,s:1.5,h:64,dir:i%2?1:-1,t:T+i*1.3,walk:T*1.2+i,vx:Math.sin(T*1.6+i*2)*2.4,draw:'chars',id:ids[i%ids.length]});
  }
  /* logo animato lettera per lettera: ogni lettera ha il suo ritmo */
  const j=jitter(3+Math.sin(T*9)*1.5);
  c.save(); c.translate(j.jx,j.jy);
  c.textAlign='center';
  const drawWave=(text,y,size,fillA,fillB,strokeCol)=>{
    const chars=text.split('');
    const widths=chars.map(chr=>c.measureText(chr).width);
    const total=widths.reduce((acc,w2)=>acc+w2,0);
    let xk=W/2-total/2;
    chars.forEach((chr,i)=>{
      const dy=Math.sin(T*5+i*0.55)*5, rot=Math.sin(T*3.2+i*0.8)*0.055;
      c.save(); c.translate(xk+widths[i]/2,y+dy); c.rotate(rot);
      const g=c.createLinearGradient(0,-size*0.85,0,size*0.28);
      g.addColorStop(0,fillA); g.addColorStop(1,fillB);
      c.lineWidth=10; c.strokeStyle=strokeCol; c.strokeText(chr,0,0);
      c.fillStyle=g; c.fillText(chr,0,0);
      c.restore(); xk+=widths[i];
    });
  };
  c.font='bold 74px Arial';
  drawWave('UNHINGED',215,74,'#fff27a','#ffb400','#FF2FB0');
  c.font='bold 58px Arial';
  drawWave('WARFARE',285,58,'#8ef7ff','#ff2fb0','#ffe36e');
  c.font='bold 17px Arial'; c.fillStyle='#fff';
  c.fillText(L('tagline'),W/2,330);
  c.restore();
  /* lampeggio tap */
  if(Math.sin(T*4)>-0.2){ c.fillStyle='#fff'; c.font='bold 22px Arial'; c.textAlign='center';
    c.fillText(L('tapStart'),W/2,H-150); }
  ticker(H-96);
  const p=SAVE.data;
  c.fillStyle='#666'; c.font='12px Arial'; c.textAlign='center';
  c.fillText('v1.5.0 — '+p.coins+' ⛁ — '+p.chars.length+'/'+Object.keys(DATA.Chars).length+' '+L('unlockedNew').toLowerCase(),W/2,H-40);
}
/* ticker di gag scorrevole: stile televideo impazzito */
function ticker(y){
  const gags=SAVE.data.lang==='en'
    ?['POLICE SHUT DOWN THE FUNFAIR: THE CLOWN BITES','THE JUDGE ASKED FOR MORE CHAOS: GRANTED','COMBO x30: YOUR THERAPIST WILL HEAR ABOUT THIS','ALL 15 ZONES CLEARED? NOW GO OUTSIDE','THIS IS NOT VIOLENCE, IT IS CHOREOGRAPHY']
    :['LA POLIZIA HA CHIUSO IL LUNA PARK: IL CLOWN MORDEVA','IL GIUDICE HA CHIESTO PIÙ CAOS: CONCESSO','COMBO x30: IL TUO TERAPESTA SAPRÀ TUTTO','15 ZONE COMPLETATE? ORA VAI A PRENDERE ARIA','NON È VIOLENZA, È COREOGRAFIA'];
  const msg=gags[Math.floor(T/4.2)%gags.length];
  c.save();
  c.font='bold 13px monospace'; c.textAlign='left';
  const tw=c.measureText(msg).width, span=tw+W;
  const sx=W-((T*95)%span);
  c.fillStyle='rgba(232,255,0,0.78)';
  c.fillText(msg,sx,y);
  c.fillText(msg,sx+span,y);
  c.restore();
}
function ch2Scale(){ return 1; }

function drawMenu(){
  menuBackdrop();
  /* fari di scena che scrutano la folla */
  c.save(); c.globalCompositeOperation='lighter';
  for(let i=0;i<2;i++){
    const a=Math.sin(T*0.5+i*2.2)*0.5, ox=W*(0.2+i*0.58);
    const g=c.createLinearGradient(ox,0,ox+Math.sin(a)*W*0.6,H);
    g.addColorStop(0,'rgba(255,255,255,0.10)'); g.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=g; c.beginPath(); c.moveTo(ox-18,0); c.lineTo(ox+18,0);
    c.lineTo(ox+Math.sin(a)*W*0.55+130,H); c.lineTo(ox+Math.sin(a)*W*0.55-130,H); c.closePath(); c.fill();
  }
  c.restore();
  logo(0.5);
  c.save();c.globalAlpha=0.6+0.15*Math.sin(T*3);c.fillStyle='#52f2ff';c.textAlign='center';c.font='bold 11px monospace';c.fillText('ARCADE CHAOS • STORIA SENZA SENSO • 15 ZONE',W/2,105);c.restore();
  const bw=286,bh=48,x=68; let y=210;
  const labels=['▶ '+L('play'),'✎ '+L('customize'),'⛁ '+L('shop'),'🏆 '+L('trophies'),'⚙ '+L('settings'),'🔗 '+L('share')];
  labels.forEach((label,index)=>{
    const lift=activeMenuCard===index?-3:0;  c.save(); c.translate(0,lift);
    c.fillStyle='rgba(0,0,0,0.32)';rr(c,x+5,y+5,bw,bh,10);c.fill();
    if(index===activeMenuCard){c.fillStyle='rgba(255,47,176,0.1)';rr(c,x-5,y-4,bw+10,bh+8,12);c.fill();}
    btn(x,y,bw,bh,label,()=>activateMenuCard(index),{big:index===0,color:index===activeMenuCard?MAG:YEL});
    c.restore();y+=55;
  });
  const total=Object.keys(DATA.Chars).length, unlocked=SAVE.data.chars.length;
  c.fillStyle='rgba(6,5,12,0.78)';rr(c,28,H-82,235,48,10);c.fill();
  c.strokeStyle='rgba(255,47,176,0.7)';c.lineWidth=2;rr(c,28,H-82,235,48,10);c.stroke();
  c.fillStyle=YEL;c.font='bold 14px Arial';c.textAlign='left';c.fillText('SVITATI '+unlocked+'/'+total,44,H-62);
  c.fillStyle='#ffd94d';
  const secretCount=Object.keys(SAVE.data.secrets||{}).filter(function(id){return /^secret-[1-4]$/.test(id);}).length;
  c.fillText('SEGRETI '+secretCount+'/4',44,H-42);
  /* personaggio in primo piano */
  const count=Math.max(1,SAVE.data.chars.length),cid=SAVE.data.chars[((sel.char%count)+count)%count],character=DATA.Chars[cid],look=SAVE.look(cid);
  const cardX=W-264,cardY=H-338,cardW=232,cardH=260,cardPulse=0.5+Math.sin(T*3.2)*0.5;
  c.save();c.shadowColor=character.theme;c.shadowBlur=14+cardPulse*12;
  c.fillStyle='rgba(9,8,18,.82)';rr(c,cardX,cardY,cardW,cardH,18);c.fill();c.shadowBlur=0;
  c.strokeStyle=character.theme;c.lineWidth=2.5;rr(c,cardX,cardY,cardW,cardH,18);c.stroke();
  c.fillStyle=character.theme;c.font='bold 10px monospace';c.textAlign='left';c.fillText('FIGHTER SELECT // '+String(sel.char+1).padStart(2,'0'),cardX+16,cardY+24);
  c.fillStyle='#888';c.font='9px monospace';c.textAlign='right';c.fillText('ROSTER '+count,cardX+cardW-16,cardY+24);c.restore();
  c.save();c.translate(cardX+cardW/2,cardY+157+Math.sin(T*2.5)*3);
  c.globalAlpha=0.32+cardPulse*0.12;c.fillStyle=character.theme;c.beginPath();c.ellipse(0,3,80,18,0,0,Math.PI*2);c.fill();
  c.globalAlpha=0.72;c.strokeStyle=character.theme;c.lineWidth=2;c.setLineDash([4,6]);c.beginPath();c.ellipse(0,0,61,20,0,T,T+Math.PI*1.6);c.stroke();c.setLineDash([]);c.globalAlpha=1;
  c.scale(2.55,2.55);
  R.drawActor(c,{x:0,y:0,s:character.scale,h:64,dir:-1,t:T,walk:Math.sin(T*3)*0.4,draw:'chars',id:cid,colors:look});
  ARENA.drawWeapon(c,{x:0,y:0,s:1,dir:-1,using:0,colors:look,charId:cid});
  ARENA.drawHat(c,{x:0,y:0,s:1,colors:look});c.restore();
  c.fillStyle=character.theme;c.font='bold 18px Arial';c.textAlign='center';c.fillText(character.short,cardX+cardW/2,cardY+198);
  btn(cardX+22,cardY+215,42,30,'‹',()=>{sel.char=(sel.char+count-1)%count;},{color:character.theme});
  c.fillStyle='#ddd';c.font='9px monospace';c.textAlign='center';c.fillText('CAMBIA SVITATO',cardX+cardW/2,cardY+235);
  btn(cardX+cardW-64,cardY+215,42,30,'›',()=>{sel.char=(sel.char+1)%count;},{color:character.theme});
  ticker(H-14);
}
function logo(sy){
  c.save(); c.translate(0,H*sy*0.28);
  const j=jitter(1.5);
  c.translate(j.jx,j.jy); c.textAlign='center';
  c.font='bold 44px Arial'; c.lineWidth=6; c.strokeStyle=MAG;
  c.strokeText('UNHINGED WARFARE',W/2,60);
  c.fillStyle=YEL; c.fillText('UNHINGED WARFARE',W/2,60);
  c.font='bold 13px Arial'; c.fillStyle='#fff'; c.fillText(L('tagline'),W/2,82);
  c.restore();
}
function bg(){
  menuBackdrop();
}
function menuBackdrop(){
  const grad=c.createLinearGradient(0,0,W,H);grad.addColorStop(0,'#090d1c');grad.addColorStop(0.5,'#191126');grad.addColorStop(1,'#070710');
  c.fillStyle=grad;c.fillRect(0,0,W,H);
  /* Skyline a livelli con luce atmosferica, insegne e prospettiva in movimento lento. */
  const horizon=H*.72;
  for(let layer=0;layer<3;layer++){
    const factor=layer===0?1:layer===1?0.58:0.31, drift=T*(layer===0?5:layer===1?2.7:1.2);
    for(let i=-1;i<9;i++){
      const bw=(92+(i*37%67))*factor,bh=(150+(i*53%170))*factor;
      const x=((i*150-drift)%(W+170)+W+170)%(W+170)-85;
      const y=horizon-bh+(i%3)*12;
      c.fillStyle=layer===0?'rgba(12,13,27,.95)':layer===1?'rgba(25,20,43,.88)':'rgba(40,26,53,.82)';
      c.fillRect(x,y,bw,bh);
      c.fillStyle=layer===0?'rgba(82,242,255,.28)':'rgba(255,47,176,.34)';c.fillRect(x,y,bw,3);
      for(let wy=y+15;wy<horizon-10;wy+=20*factor)for(let wx=x+8;wx<x+bw-8;wx+=17*factor){
        const on=Math.sin(T*2+i*3+wx*.08+wy*.05)>0.2;
        c.fillStyle=on?(i%2?'rgba(232,255,0,.32)':'rgba(82,242,255,.28)'):'rgba(255,255,255,.035)';
        c.fillRect(wx,wy,5*factor,8*factor);
      }
    }
  }
  /* linea d'orizzonte, insegna flicker e pavimento stradale lucido */
  c.fillStyle='rgba(7,7,15,.9)';c.fillRect(0,horizon,W,H-horizon);
  c.fillStyle='rgba(82,242,255,.15)';c.fillRect(0,horizon,W,2);
  c.save();c.shadowColor=MAG;c.shadowBlur=18;c.fillStyle='rgba(255,47,176,.72)';
  c.font='bold 13px Arial';c.textAlign='right';c.fillText('NO RULES // ALL NIGHT',W-54,H*.28);c.restore();
  c.fillStyle='rgba(255,47,176,.11)';c.beginPath();c.ellipse(W*.72,H*.82,310,70,-.08,0,Math.PI*2);c.fill();
  c.strokeStyle='rgba(82,242,255,.12)';c.lineWidth=2;
  for(let i=-4;i<=4;i++){c.beginPath();c.moveTo(W*.53,H*.73);c.lineTo(W*.53+i*145,H);c.stroke();}
  c.beginPath();c.moveTo(0,H*.87);c.lineTo(W,H*.87);c.stroke();
  for(let i=0;i<28;i++){const x=(i*137+T*18)%W,y=(i*89+T*7)%H;c.fillStyle=i%2?'rgba(232,255,0,.1)':'rgba(255,47,176,.1)';c.fillRect(x,y,4+(i%7)*5,2);}
  /* trip psichedelico: raggi cangianti in blend additivo + orb vaganti */
  c.save();c.globalCompositeOperation='lighter';
  for(let r=0;r<9;r++){
    const a=T*0.12+r*Math.PI*2/9, hue=(T*24+r*44)%360;
    c.fillStyle='hsla('+hue+',90%,58%,0.05)';
    c.beginPath();c.moveTo(W*0.5,H*0.52);
    c.arc(W*0.5,H*0.52,Math.max(W,H),a,a+0.32);c.closePath();c.fill();
  }
  for(let o=0;o<7;o++){
    const ox=W*0.5+Math.sin(T*0.31+o*1.7)*W*0.42, oy=H*0.5+Math.cos(T*0.23+o*2.1)*H*0.36;
    const or=26+(o%3)*17+Math.sin(T+o)*7, hue=(T*30+o*61)%360;
    const g=c.createRadialGradient(ox,oy,0,ox,oy,or);
    g.addColorStop(0,'hsla('+hue+',95%,62%,0.16)');g.addColorStop(1,'hsla('+hue+',95%,62%,0)');
    c.fillStyle=g;c.beginPath();c.arc(ox,oy,or,0,Math.PI*2);c.fill();
  }
  c.restore();
}
function header(t,sub){
  bg();
  c.fillStyle=YEL; c.font='bold 24px Arial'; c.textAlign='left';
  c.fillText(t,40,84);
  if(sub){ c.fillStyle='#888'; c.font='12px Arial'; c.fillText(sub,40,106); }
}
function back(){ btn(20,H-64,150,44,'← '+L('back'),()=>go('menu'),{}); }

function drawMode(){
  header(L('play'));
  const bw=280,bh=54,x=W/2-bw/2; let y=200;
  btn(x,y,bw,bh,L('story'),()=>{sel.level=SAVE.data.storyLevel;go('levels');},{sub:DATA.Levels.length+' '+L('level')}); y+=68;
  btn(x,y,bw,bh,L('chaos'),()=>{sel.level=0;go('chaosSel');},{sub:'∞ ondate'}); y+=68;
  btn(x,y,bw,bh,L('duel'),()=>go('duelSel'),{sub:'1v1'}); y+=68;
  btn(x,y,bw,bh,L('weekly'),()=>{ startWeekly(); },{sub:weeklyDesc()}); y+=68;
  btn(x,y,bw,bh,'🔥 '+(SAVE.data.lang==='en'?'UNHINGED TRIALS':'PROVE SVITATE'),()=>go('trials'),{sub:SAVE.data.lang==='en'?'alternative unlocks':'sblocco alternativo'});
  back();
}
function weeklyDesc(){
  const k=SAVE.weeklyKey(), h=hash(k);
  const lvIdx=h%(DATA.Levels.length-1); /* mai il finale boss-only */
  const cIdx=h%LT('constraints').length;
  return DATA.Levels[lvIdx].place+' — '+LT('constraints')[cIdx];
}
function hash(s){ let h=0; for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0; return Math.abs(h); }
function drawTrials(){
  header('🔥 '+L('trialsTitle'),L('trialsSub'));
  /* bottone MARATONA in alto a destra */
  btn(W-350,60,310,46,'🏃 MARATONA DEI BOSS'+(SAVE.data.marathonDone?' ✓':''),()=>{ sel.pendingMode='marathon'; sel.char=0; sel.board=-1; go('charSel'); },{color:MAG});
  const bi=sel.board;
  if(bi>=0){
    /* pannello CLASSIFICA della prova selezionata */
    const T=DATA.Trials[bi], C=DATA.Chars[T.id];
    c.save(); c.translate(60,140);
    c.fillStyle='rgba(10,8,18,0.95)'; rr(c,0,0,840,420,14); c.fill();
    c.strokeStyle=C.theme; c.lineWidth=3; rr(c,0,0,840,420,14); c.stroke();
    c.fillStyle=C.theme; c.font='bold 20px Arial'; c.textAlign='left';
    c.fillText('⏱ '+(T.name[SAVE.data.lang]||T.name.it)+' — TOP 10',28,44);
    c.fillStyle='#888'; c.font='11px Arial';
    c.fillText(DATA.BossNames[T.boss],28,66);
    const board=SAVE.trialBoard().filter(e=>e.trial===T.id);
    if(!board.length){
      c.fillStyle='#666'; c.font='13px Arial'; c.textAlign='center';
      c.fillText(L('boardEmpty'),420,220);
    } else {
      board.forEach((e,i)=>{
        const y=96+i*32;
        const gold=i===0, Ch=DATA.Chars[e.char]||{short:e.char,theme:'#888'};
        if(gold){ c.fillStyle='rgba(255,217,77,0.10)'; rr(c,20,y-16,800,26,6); c.fill();
          c.fillStyle='#ffd94d'; c.font='bold 16px Arial'; }
        else { c.fillStyle=i<3?'#ddd':'#999'; c.font='bold 13px Arial'; }
        c.fillText((i+1)+'.',34,y);
        c.fillStyle=Ch.theme; c.fillText(Ch.short,70,y);
        c.fillStyle='#888'; c.font='10px Arial';
        c.fillText(new Date(e.ts).toLocaleDateString(),225,y);
        c.fillStyle='#E8FF00'; c.font='bold 13px Arial'; c.textAlign='right';
        c.fillText(e.time+'s',810,y);
        c.textAlign='left';
      });
    }
    c.restore();
    btn(60,580,200,46,'✕ '+L('boardClose'),()=>{ sel.board=-1; AUDIO.click(); },{});
    btn(W-260,580,200,46,'▶ '+L('play'),()=>{ sel.trial=bi; sel.level=bi; sel.pendingMode='trial'; sel.char=0; sel.board=-1; go('charSel'); },{color:GRN});
  } else {
    DATA.Trials.forEach((T,i)=>{
      const x=70+i*284, y=170, w=264, h=300;
      const done=SAVE.unlocked(T.id), C=DATA.Chars[T.id];
      const rec=(SAVE.data.trialBest||{})[T.id];
      c.save(); c.translate(x,y);
      c.fillStyle=done?'rgba(50,45,10,0.95)':'rgba(20,18,30,0.92)'; rr(c,0,0,w,h,12); c.fill();
      c.strokeStyle=done?C.theme:YEL; c.lineWidth=3; rr(c,0,0,w,h,12); c.stroke();
      c.save(); c.translate(w/2,150); c.scale(1.9,1.9);
      R.drawActor(c,{x:0,y:0,s:1.5,h:74,dir:-1,t:i*1.3,draw:'boss',id:T.boss});
      c.restore();
      c.fillStyle=done?C.theme:'#fff'; c.font='bold 15px Arial'; c.textAlign='center';
      c.fillText(T.name[SAVE.data.lang]||T.name.it,w/2,196,240);
      c.fillStyle=done?'#39FF14':MAG; c.font='bold 13px Arial';
      c.fillText(done?('★ '+C.short+' '+L('unlocked')):(DATA.BossNames[T.boss]+' → '+C.short),w/2,224,240);
      c.fillStyle='#888'; c.font='11px Arial';
      c.fillText(done?L('trialDone'):(L('trialHint')+' '+C.short),w/2,258,240);
      if(rec){ c.fillStyle='#ffd94d'; c.font='bold 12px Arial';
        c.fillText('⏱ '+rec+'s',w/2,282,240); }
      c.fillStyle='#556'; c.font='10px Arial';
      c.fillText(L('boardHint'),w/2,300,240);
      c.restore();
      /* corpo della card = gioca; striscia in basso = classifica */
      btn(x,y,w,h-20,'',(function(idx){return ()=>{sel.trial=idx;sel.level=idx;sel.pendingMode='trial';sel.char=0;go('charSel');AUDIO.click();};})(i),{flat:true});
      btn(x,y+h-20,w,20,'',(function(idx){return ()=>{sel.board=idx;AUDIO.click();};})(i),{flat:true});
    });
  }
  back();
}
function startWeekly(){
  const k=SAVE.weeklyKey(), h=hash(k);
  sel.level=h%(DATA.Levels.length-1); sel.constraint=h%LT('constraints').length; sel.pendingMode='weekly';
  go('charSel');
}

function drawLevels(){
  header(L('selectLevel'));
  const cols=5, bw=170,bh=110, gap=20;
  DATA.Levels.forEach((LV,i)=>{
    const x=70+(i%cols)*(bw+gap), y=140+Math.floor(i/cols)*(bh+gap);
    const unlocked=i<=SAVE.data.storyLevel;
    c.save(); c.translate(x,y);
    c.fillStyle=unlocked?'rgba(20,18,30,0.9)':'rgba(10,8,14,0.9)';
    rr(c,0,0,bw,bh,12); c.fill();
    c.strokeStyle=unlocked?YEL:'#333'; c.lineWidth=3; rr(c,0,0,bw,bh,12); c.stroke();
    c.fillStyle=unlocked?YEL:'#444'; c.font='bold 28px Arial'; c.textAlign='left';
    c.fillText(String(LV.id),14,38);
    c.fillStyle=unlocked?'#fff':'#555'; c.font='bold 11px Arial';
    c.fillText(LV.place,14,58,150);
    c.fillStyle=unlocked?'#888':'#444'; c.font='9px Arial';
    c.fillText(unlocked?(LV.final?'★ FINALE':'boss: '+DATA.BossNames[LV.boss]):('🔒 '+L('locked')),14,78,150);
    if(unlocked&&i<SAVE.data.storyLevel){ c.fillStyle=GRN; c.font='bold 11px Arial'; c.fillText('✓',bw-24,34); }
    c.restore();
    const act=(function(idx){return ()=>{ sel.level=idx; sel.pendingMode='story'; go('charSel'); };})(i);
    if(unlocked) btn(x,y,bw,bh,'',act,{flat:true});
  });
  back();
}
function drawChaosSel(){
  header(L('chaos')+' — '+L('selectLevel'),'RECORD: ondata '+SAVE.data.bestChaos);
  const cols=4, bw=190,bh=100, gap=24;
  DATA.Levels.forEach((LV,i)=>{
    const x=70+(i%cols)*(bw+gap), y=150+Math.floor(i/cols)*(bh+gap);
    const unlocked=i<=Math.min(SAVE.data.storyLevel,DATA.Levels.length-1);
    c.save(); c.translate(x,y);
    c.fillStyle='rgba(20,18,30,0.9)'; rr(c,0,0,bw,bh,12); c.fill();
    c.strokeStyle=unlocked?YEL:'#333'; c.lineWidth=3; rr(c,0,0,bw,bh,12); c.stroke();
    c.fillStyle=unlocked?YEL:'#444'; c.font='bold 30px Arial'; c.textAlign='left';
    c.fillText(String(LV.id),14,40);
    c.fillStyle=unlocked?'#fff':'#555'; c.font='bold 12px Arial'; c.fillText(LV.place,14,62);
    c.restore();
    if(unlocked) btn(x,y,bw,bh,'',(function(idx){return ()=>{sel.level=idx;sel.pendingMode='chaos';go('charSel');};})(i),{flat:true});
  });
  back();
}
function drawCharSel(){
  header(L('selectChar'));
  const ids=Object.keys(DATA.Chars).filter(function(id){return SAVE.unlocked(id);});
  if(!ids.length)return;
  sel.char=Math.max(0,Math.min(ids.length-1,sel.char));
  const n=ids.length, gap=n>6?10:18;
  const bw=Math.min(150,Math.floor((940-(n-1)*gap)/n)), bh=200;
  const cs=bw>=140?1.6:bw>=110?1.35:1.05, fs=bw>=140?13:bw>=110?12:10;
  let totalW=n*(bw+gap)-gap;
  let x0=W/2-totalW/2;
  ids.forEach((id,i)=>{
    const x=x0+i*(bw+gap), y=130, C=DATA.Chars[id];
    const selH=i===sel.char;
    c.save(); c.translate(x,y);
    c.fillStyle=selH?'rgba(40,36,10,0.9)':'rgba(20,18,30,0.9)';
    rr(c,0,0,bw,bh,12); c.fill();
    c.strokeStyle=selH?C.theme:'#333'; c.lineWidth=selH?4:2; rr(c,0,0,bw,bh,12); c.stroke();
    c.save(); c.translate(bw/2,bh-40); c.scale(cs,cs);
    R.drawActor(c,{x:0,y:0,s:C.scale,h:64,dir:0,t:T+i*2,draw:'chars',id});
    c.restore();
    c.fillStyle=C.theme; c.font='bold '+fs+'px Arial'; c.textAlign='center';
    c.fillText(C.short,bw/2,bh-14);
    if(SAVE.unlocked(id)){
      c.fillStyle='#39FF14';c.font='bold 9px Arial';c.fillText('SBLOCCATO',bw/2,18);
    }else{
      c.fillStyle='#ffd94d';c.font='bold 9px Arial';c.fillText('PROVA / SEGRETO',bw/2,18);
    }
    c.restore();
    btn(x,y,bw,bh,'',(function(idx){return ()=>{sel.char=idx;AUDIO.click();};})(i),{flat:true});
  });
  const C=DATA.Chars[ids[sel.char%ids.length]];
  c.fillStyle='#fff'; c.font='bold 16px Arial'; c.textAlign='center';
  c.fillText(C.name,W/2,376);
  c.fillStyle='#aaa'; c.font='12px Arial';
  c.fillText(C.desc,W/2,400,700);
  c.fillStyle='#888'; c.font='11px Arial';
  c.fillText('ABILITÀ: '+C.ability.name+'   |   ULTIMATE: '+C.ult.name,W/2,424);
  const bw2=320,bh2=56;
  btn(W/2-bw2/2,450,bw2,bh2,'▶ '+L('play'),()=>{
    if(!SAVE.unlocked(C.id)){toast('Personaggio bloccato: completa una prova o un obiettivo.');return;}
    launchGame(sel.pendingMode||'story',ids[sel.char%ids.length]);
  },{big:true,color:SAVE.unlocked(C.id)?YEL:'#555'});
  back();
}
function drawDuelSel(){
  header(L('duel'));
  const ids=SAVE.data.chars;
  const col=(x0,label,arr,key,cKey)=>{
    const many=arr.length>7;
    const cw2=many?100:145, ch2=many?58:120, gx=many?110:160, gy=many?64:130, y0=many?132:140;
    c.fillStyle='#fff'; c.font='bold 15px Arial'; c.textAlign='center';
    c.fillText(label,x0+75,125);
    arr.forEach((id,i)=>{
      const x=x0+(i%2)*gx, y=y0+Math.floor(i/2)*gy;
      const C=DATA.Chars[id], on=i===sel[key];
      c.save(); c.translate(x,y);
      c.fillStyle=on?'rgba(40,36,10,0.9)':'rgba(20,18,30,0.9)'; rr(c,0,0,cw2,ch2,10); c.fill();
      c.strokeStyle=on?C.theme:'#333'; c.lineWidth=on?3.5:2; rr(c,0,0,cw2,ch2,10); c.stroke();
      c.save(); c.translate(cw2/2,ch2-16); c.scale(many?0.72:1.2,many?0.72:1.2);
      R.drawActor(c,{x:0,y:0,s:C.scale,h:64,dir:0,t:T+i,draw:'chars',id}); c.restore();
      c.fillStyle=C.theme; c.font='bold '+(many?9:11)+'px Arial'; c.textAlign='center'; c.fillText(C.short,cw2/2,ch2-8);
      c.restore();
      btn(x,y,cw2,ch2,'',(function(idx){return ()=>{sel[key]=idx;AUDIO.click();};})(i),{flat:true});
    });
  };
  col(90,L('p1'),ids,'duel1');
  if(sel.vsBoss){
    /* colonna BOSS: i 3 leggendari delle Prove Svitata */
    const bshort={fritto:'MOLETOSSICO',energia:'ENERGIA∞',archivio:'ARCHIVISTA'};
    c.fillStyle=MAG; c.font='bold 15px Arial'; c.textAlign='center';
    c.fillText('BOSS',W-320+75,125);
    DATA.Trials.forEach((T,i)=>{
      const x=W-320+(i%2)*110, y=132+Math.floor(i/2)*64, w=100, h=58;
      const ok=SAVE.unlocked(T.id), on=sel.vsBossIdx===i;
      c.save(); c.translate(x,y);
      c.fillStyle=on?'rgba(40,36,10,0.9)':'rgba(20,18,30,0.9)'; rr(c,0,0,w,h,10); c.fill();
      c.strokeStyle=on?MAG:'#333'; c.lineWidth=on?3.5:2; rr(c,0,0,w,h,10); c.stroke();
      if(ok){ R.drawActor(c,{x:w/2,y:h-12,s:0.6,h:74,dir:-1,t:i*1.3,draw:'boss',id:T.boss}); }
      c.fillStyle=ok?MAG:'#555'; c.font='bold 9px Arial'; c.textAlign='center';
      c.fillText(ok?bshort[T.boss]:'🔒',w/2,h-4);
      c.restore();
      if(ok) btn(x,y,w,h,'',(function(idx){return ()=>{sel.vsBossIdx=idx;AUDIO.click();};})(i),{flat:true});
    });
  } else {
    col(W-320,sel.cpu?L('duelCPU'):L('p2'),ids,'duel2');
  }
  const many=ids.length>7;
  btn(many?W/2-60:W/2-150,470,140,50,sel.vsBoss?'BOSS: ON':'BOSS: OFF',()=>{sel.vsBoss=!sel.vsBoss;},{color:MAG});
  if(!sel.vsBoss) btn((many?W/2-60:W/2-150)+150,470,140,50,sel.cpu?'CPU: '+L('on'):'CPU: '+L('off'),()=>{sel.cpu=!sel.cpu;},{color:MAG});
  const c1=ids[sel.duel1%ids.length], c2=ids[sel.duel2%ids.length];
  if(sel.vsBoss){
    const T=DATA.Trials[sel.vsBossIdx%DATA.Trials.length], ok=SAVE.unlocked(T.id);
    btn(W/2-170,535,340,60, ok?('⚔ '+L('fight')+' — '+DATA.BossNames[T.boss]):'🔒 '+L('locked'), ()=>{
      if(ok) launchGame('duel',null,{p1:c1,vsBoss:T.boss,duelCpu:true});
    },{big:true,color:MAG});
  } else {
    btn(W/2-170,535,340,60,'⚔ '+L('fight'),()=>{
      launchGame('duel',null,{p1:c1,p2:c2,duelCpu:sel.cpu});
    },{big:true,color:MAG});
  }
  back();
}
function launchGame(mode,charId,opts){
  buttons=[]; resShown=false; lastClip=null; resCounted=false;
  if(mode==='weekly'){ opts=opts||{}; opts.constraint=sel.constraint; opts.levelIdx=sel.level; }
  else if(mode==='trial'){ opts=opts||{}; opts.levelIdx=sel.trial; }
  else if(mode==='marathon'){ opts=opts||{}; }
  else if(mode==='story'||mode==='chaos'){ opts=opts||{}; opts.levelIdx=sel.level; }
  game=ENGINE.start(mode,Object.assign({charId},opts||{}));
  screen='game'; loopOn=true; AUDIO.music(game.mode==='duel'?'duel':game.boss?'boss':'battle');
  if(game.mode==='chaos') AUDIO.music('battle');
  saveBestChaos();
}
function saveBestChaos(){ /* chiamato a fine partita */ }

/* ---------- Editor ---------- */
function drawCustom(){
  header(L('customize'));
  const ids=SAVE.data.chars;
  const cid=ids[sel.custChar%ids.length];
  const C=DATA.Chars[cid], look=SAVE.look(cid);
  /* pannello sinistro: personaggi + categorie */
  ids.forEach((id,i)=>{
    const y=110+i*44;
    const on=id===cid;
    c.fillStyle=on?'rgba(40,36,10,0.95)':'rgba(20,18,30,0.9)'; rr(c,30,y,150,38,8); c.fill();
    c.strokeStyle=on?DATA.Chars[id].theme:'#333'; c.lineWidth=2; rr(c,30,y,150,38,8); c.stroke();
    c.fillStyle=on?DATA.Chars[id].theme:'#888'; c.font='bold 12px Arial';
    c.fillText(DATA.Chars[id].short,44,y+24);
    btn(30,y,150,38,'',(function(ii){return ()=>{sel.custChar=ii;AUDIO.click();};})(i),{flat:true});
  });
  const cats=[['outfit','👕'],['weapon','⚔'],['hat','🎩']];
  cats.forEach((ct,i)=>{
    const y=110+i*50, on=sel.cat===i;
    c.fillStyle=on?YEL:'rgba(20,18,30,0.9)'; rr(c,210,y,120,42,8); c.fill();
    c.strokeStyle=YEL; c.lineWidth=2; rr(c,210,y,120,42,8); c.stroke();
    c.fillStyle=on?'#0c0a12':YEL; c.font='bold 16px Arial'; c.textAlign='center';
    c.fillText(ct[1]+' '+catName(i),270,y+26);
    btn(210,y,120,42,'',(function(ii){return ()=>{sel.cat=ii;sel.item=-1;AUDIO.click();};})(i),{flat:true});
  });
  /* griglia oggetti */
  const pools=[DATA.Outfits,DATA.Weapons,DATA.Hats];
  const pool=pools[sel.cat], names=Object.keys(pool);
  c.fillStyle='#fff'; c.font='bold 14px Arial'; c.textAlign='left';
  c.fillText(catName(sel.cat).toUpperCase()+' ('+names.length+')',360,116);
  const bw=150,bh=54;
  names.forEach((key,i)=>{
    const x=360+(i%3)*(bw+12), y=130+Math.floor(i/3)*(bh+12);
    const owned=SAVE.data.coins>=0&&isOwned(sel.cat,key,cid);
    const on=curVal(look,sel.cat)===key;
    c.save(); c.translate(x,y);
    c.fillStyle=on?'rgba(57,255,20,0.15)':'rgba(20,18,30,0.9)'; rr(c,0,0,bw,bh,8); c.fill();
    c.strokeStyle=on?GRN:'#444'; c.lineWidth=on?3:2; rr(c,0,0,bw,bh,8); c.stroke();
    c.fillStyle=on?GRN:'#ddd'; c.font='bold 11px Arial'; c.textAlign='left';
    c.fillText(pool[key].name,8,20,120);
    c.fillStyle=owned?'#888':MAG; c.font='bold 11px Arial';
    c.fillText(owned?(on?L('equipped'):L('equip')):(pool[key].price+' ⛁'),8,40);
    c.restore();
    btn(x,y,bw,bh,'',(function(k,own){return ()=>{
      if(own){ applyLook(cid,sel.cat,k); AUDIO.coin(); }
      else { if(SAVE.spend(pool[k].price)){ ownItem(k); applyLook(cid,sel.cat,k); AUDIO.unlock(); toast('✓ '+pool[k].name); }
        else { AUDIO.hurt(); toast('✗ '+L('price')); } }
    };})(key,owned),{flat:true});
  });
  /* modello centrale */
  c.save(); c.translate(W/2,H/2+40);
  const bob=Math.sin(T*2)*3;
  c.scale(2.4,2.4); c.translate(0,bob);
  c.fillStyle='rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0,2,16,5,0,0,7); c.fill();
  R.drawActor(c,{x:0,y:0,s:C.scale,h:64,dir:0,t:T,draw:'chars',id:cid});
  ARENA.drawWeapon(c,{x:0,y:0,s:1,dir:1,using:0,colors:look,charId:cid});
  ARENA.drawHat(c,{x:0,y:0,s:1,colors:look});
  c.restore();
  c.fillStyle='rgba(0,0,0,0.5)'; c.beginPath(); c.ellipse(W/2,H/2+44,60,12,0,0,7); c.fill();
  /* bottoni */
  btn(W/2+130,H/2+80,200,48,'🎲 '+L('randomCombo'),()=>{
    const ks=Object.keys(DATA.Outfits), kw=Object.keys(DATA.Weapons), kh=Object.keys(DATA.Hats);
    applyLook(cid,0,ks[Math.floor(Math.random()*ks.length)]);
    applyLook(cid,1,kw[Math.floor(Math.random()*kw.length)]);
    applyLook(cid,2,kh[Math.floor(Math.random()*kh.length)]);
    AUDIO.unlock();
  },{color:MAG});
  btn(W/2-330,H/2+80,200,48,'💾 '+L('saveLook'),()=>{ SAVE.setLook(cid,look); AUDIO.unlock(); },{color:GRN});
  back();
}
function catName(i){ const it=SAVE.data.lang!=='en'; return it?['OUTFIT','ARMA','CAPPELLO'][i]:['OUTFIT','WEAPON','HAT'][i]; }
function curVal(look,cat){ return cat===0?look.outfit:cat===1?look.weapon:look.hat; }
function isOwned(cat,key,cid){
  const pool=[DATA.Outfits,DATA.Weapons,DATA.Hats][cat];
  return pool[key].price===0||!!(SAVE.data.owned&&SAVE.data.owned[key]);
}
function ownItem(key){ SAVE.data.owned=SAVE.data.owned||{}; SAVE.data.owned[key]=true; SAVE.save(); }
function applyLook(cid,cat,key){
  const look=SAVE.look(cid);
  if(cat===0)look.outfit=key; else if(cat===1)look.weapon=key; else look.hat=key;
  SAVE.setLook(cid,look);
}

/* ================= NEGOZIO ================= */
function drawShop(){
  header(L('shop'));
  c.fillStyle='#ffd94d'; c.font='bold 20px Arial'; c.textAlign='right';
  c.fillText('⛁ '+SAVE.data.coins,W-40,84);
  c.fillStyle='#ffd94d'; c.font='bold 20px Arial'; c.textAlign='right';
  c.fillText('⛁ '+SAVE.data.coins,W-40,80);
  const tabs=[[0,L('customize')],[1,'ARMI'],[2,'CAPPELLI']];
  tabs.forEach(tb=>{
    const x=40+tb[0]*180, y=110, on=sel.shopCat===tb[0];
    c.fillStyle=on?YEL:'rgba(20,18,30,0.9)'; rr(c,x,y,170,42,8); c.fill();
    c.strokeStyle=YEL; c.lineWidth=2; rr(c,x,y,170,42,8); c.stroke();
    c.fillStyle=on?'#0c0a12':YEL; c.font='bold 15px Arial'; c.textAlign='center';
    c.fillText(tb[1],x+85,y+27);
    btn(x,y,170,42,'',(function(ii){return ()=>{sel.shopCat=ii;AUDIO.click();};})(tb[0]),{flat:true});
  });
  const pools=[DATA.Outfits,DATA.Weapons,DATA.Hats];
  const pool=pools[sel.shopCat];
  const keys=Object.keys(pool);
  const bw=200,bh=76;
  keys.forEach((key,i)=>{
    const x=40+(i%4)*(bw+16), y=180+Math.floor(i/4)*(bh+16);
    const owned=isOwned(sel.shopCat,key);
    c.save(); c.translate(x,y);
    c.fillStyle='rgba(20,18,30,0.92)'; rr(c,0,0,bw,bh,10); c.fill();
    c.strokeStyle=owned?GRN:'#555'; c.lineWidth=2; rr(c,0,0,bw,bh,10); c.stroke();
    c.fillStyle='#fff'; c.font='bold 13px Arial'; c.textAlign='left';
    c.fillText(pool[key].name,10,22,bw-20);
    c.fillStyle=owned?'#39FF14':MAG; c.font='bold 14px Arial';
    c.fillText(owned?'✓':(pool[key].price+' ⛁'),10,44);
    c.restore();
    btn(x,y,bw,bh,'',(function(k,own){return ()=>{
      if(own){ toast('✓ '+L('bought')); AUDIO.click(); return; }
      if(SAVE.spend(pool[k].price)){ ownItem(k); AUDIO.unlock(); toast('✓ '+pool[k].name); }
      else { AUDIO.hurt(); toast('✗'); }
    };})(key,owned),{flat:true});
  });
  back();
}

/* ================= TROFEI ================= */
function drawTrophies(){
  header('🏆 '+L('trophies'));
  const t=SAVE.data.trophies;
  let got=0;
  DATA.Trophies.forEach((tr,i)=>{
    const x=40+(i%4)*220, y=110+Math.floor(i/4)*124;
    const on=!!t[tr.id]; if(on)got++;
    c.save(); c.translate(x,y);
    c.fillStyle=on?'rgba(50,45,10,0.95)':'rgba(16,14,22,0.92)'; rr(c,0,0,204,112,10); c.fill();
    c.strokeStyle=on?YEL:'#333'; c.lineWidth=2; rr(c,0,0,204,112,10); c.stroke();
    c.globalAlpha=on?1:0.35;
    c.font='30px Arial'; c.textAlign='left'; c.fillText(tr.icon,12,42);
    c.fillStyle=on?YEL:'#888'; c.font='bold 12px Arial';
    c.fillText(tr.name[SAVE.data.lang]||tr.name.it,52,30,145);
    c.fillStyle=on?'#bbb':'#555'; c.font='10px Arial';
    c.fillText(tr.desc[SAVE.data.lang]||tr.desc.it,52,50,145);
    c.restore();
  });
  c.fillStyle='#888'; c.font='bold 14px Arial'; c.textAlign='right';
  c.fillText(got+'/'+DATA.Trophies.length,W-40,100);
  back();
}

/* ================= IMPOSTAZIONI ================= */
function drawSettings(){
  header('⚙ '+L('settings'));
  const st=SAVE.data.settings;
  const slider=(y,label,val,cb)=>{
    c.fillStyle='#fff'; c.font='bold 15px Arial'; c.textAlign='left'; c.fillText(label,60,y+8);
    c.fillStyle='#333'; rr(c,300,y-10,320,20,10); c.fill();
    c.fillStyle=YEL; rr(c,300,y-10,320*val,20,10); c.fill();
    c.fillStyle='#fff'; c.beginPath(); c.arc(300+320*val,y,12,0,7); c.fill();
    uiSliders.push({x:300,y,w:320,val,cb});
  };
  const toggle=(y,label,val,cb)=>{
    c.fillStyle='#fff'; c.font='bold 15px Arial'; c.textAlign='left'; c.fillText(label,60,y+8);
    c.fillStyle=val?GRN:'#444'; rr(c,540,y-12,80,28,14); c.fill();
    c.fillStyle='#fff'; c.beginPath(); c.arc(val?604:556,y+2,10,0,7); c.fill();
    btn(530,y-16,100,32,'',()=>{cb();AUDIO.click();},{flat:true});
  };
  uiSliders=[];
  slider(150,L('music'),st.music,v=>{st.music=v;SAVE.save();AUDIO.apply();AUDIO.music('menu');});
  slider(200,L('sfx'),st.sfx,v=>{st.sfx=v;SAVE.save();AUDIO.apply();AUDIO.click();});
  toggle(250,L('haptics'),st.haptics,()=>{st.haptics=!st.haptics;SAVE.save();});
  c.fillStyle='#fff';c.font='bold 15px Arial';c.textAlign='left';c.fillText('TELECAMERA',60,274);
  c.fillStyle='#52f2ff';c.font='10px monospace';c.fillText('←/→ Q/R PAN  •  ↑/↓ T/Y TILT  •  GAMEPAD: STICK DESTRO',300,274);
  btn(690,344,220,36,'💊 PILLS',()=>{pillsOpen=true;pillsValue='';pillsToast='';},{color:MAG});
  c.fillStyle='#aaa'; c.font='10px Arial'; c.textAlign='left';
  c.fillText('WASD/frecce: muovi • J/Z o Spazio: attacco • K/X/V: abilità • L/C/B: finisher',60,402);
  c.fillText('Duello locale: P1 WASD+J/K/L/Shift • P2 frecce+F/G/H/N',60,418);
  c.fillText('Gamepad: stick sx • X attacco • Y abilità • LB finisher • Start pausa',60,434);
  c.fillText('Camera: Q/R + T/Y • Alt+frecce • mouse destro+trascina • stick dx/touch CAM',60,450);
  toggle(490,L('render3d'),st.render3d!==false,()=>{st.render3d=st.render3d===false;SAVE.save();});
  c.fillStyle='#777'; c.font='10px Arial'; c.textAlign='left';
  const rendererUnavailable=!!(window.THREE3D&&THREE3D.error);
  c.fillText(st.render3d===false?L('renderer3dOff'):rendererUnavailable?L('renderer3dUnavailable'):L('renderer3dOn'),300,520);
  c.fillText(L('renderer3dHelp'),300,534);
  /* qualità */
  c.fillStyle='#fff'; c.font='bold 15px Arial'; c.textAlign='left'; c.fillText(L('quality'),60,308);
  [L('low'),L('med'),L('high')].forEach((q,i)=>{
    const x=300+i*110, on=st.quality===['low','med','high'][i];
    c.fillStyle=on?YEL:'rgba(20,18,30,0.9)'; rr(c,x,290,100,32,8); c.fill();
    c.strokeStyle=YEL; c.lineWidth=2; rr(c,x,290,100,32,8); c.stroke();
    c.fillStyle=on?'#0c0a12':YEL; c.font='bold 13px Arial'; c.textAlign='center'; c.fillText(q,x+50,311);
    btn(x,290,100,32,'',()=>{st.quality=['low','med','high'][i];SAVE.save();AUDIO.click();},{flat:true});
  });
  /* lingua */
  c.fillStyle='#fff'; c.font='bold 15px Arial'; c.textAlign='left'; c.fillText(L('language'),60,368);
  ['🇮🇹 ITALIANO','🇬🇧 ENGLISH'].forEach((q,i)=>{
    const x=300+i*160, on=SAVE.data.lang===(i?'en':'it');
    c.fillStyle=on?YEL:'rgba(20,18,30,0.9)'; rr(c,x,344,150,36,8); c.fill();
    c.strokeStyle=YEL; c.lineWidth=2; rr(c,x,344,150,36,8); c.stroke();
    c.fillStyle=on?'#0c0a12':YEL; c.font='bold 13px Arial'; c.textAlign='center'; c.fillText(q,x+75,367);
    btn(x,344,150,36,'',()=>{SAVE.data.lang=i?'en':'it';SAVE.save();AUDIO.click();},{flat:true});
  });
  /* reset */
  btn(40,H-130,240,46,'🗑 RESET SALVATAGGIO',()=>{
    if(confirm('Cancellare tutti i progressi?')){ localStorage.removeItem('unhinged_warfare_v1'); location.reload(); }
  },{color:'#ff4d4d'});
  back();
  if(pillsOpen)drawPillsDialog();
}
function grantPillsRewards(){
  SAVE.data.chars=Object.keys(DATA.Chars);
  SAVE.data.owned=SAVE.data.owned||{};
  Object.keys(DATA.Weapons).forEach(function(id){SAVE.data.owned[id]=true;});
  Object.keys(DATA.Outfits).forEach(function(id){SAVE.data.owned[id]=true;});
  Object.keys(DATA.Hats).forEach(function(id){SAVE.data.owned[id]=true;});
  SAVE.data.coins=10000;
  SAVE.save();
  pillsToast='Sbloccato: personaggi, armi e 10.000 crediti.';
}
function unlockNinozSecret(){
  SAVE.unlockChar('ninoz');
  SAVE.data.owned=SAVE.data.owned||{};
  SAVE.data.owned.machete=true;
  SAVE.data.owned.sigarette=true;
  SAVE.data.owned.mitra=true;
  SAVE.data.looks=SAVE.data.looks||{};
  SAVE.data.looks.ninoz={outfit:'elegante',weapon:'machete',hat:'nessuno',color:0};
  SAVE.save();
  pillsToast='🔥 NINOZ SBLOCCATO! Machete, Mitra e Sigarette Esplosive pronti!';
}
function drawPillsDialog(){
  c.save();c.fillStyle='rgba(4,3,10,0.86)';c.fillRect(0,0,W,H);
  const x=220,y=184,w=520,h=306;
  c.fillStyle='#14111e';rr(c,x,y,w,h,18);c.fill();
  c.strokeStyle=MAG;c.lineWidth=4;rr(c,x,y,w,h,18);c.stroke();
  c.fillStyle=YEL;c.font='bold 26px Arial';c.textAlign='center';c.fillText('💊 PILLS',W/2,y+46);
  c.fillStyle='#aaa';c.font='14px Arial';c.fillText('Digita il codice segreto',W/2,y+78);
  c.fillStyle='#08070d';rr(c,x+55,y+98,w-110,48,8);c.fill();
  c.strokeStyle='#555';c.lineWidth=2;rr(c,x+55,y+98,w-110,48,8);c.stroke();
  c.fillStyle='#fff';c.font='bold 22px monospace';c.fillText((pillsValue||'________________').toUpperCase(),W/2,y+130);
  c.fillStyle=pillsToast?GRN:'#777';c.font='12px Arial';c.fillText(pillsToast||'A-Z / 0-9 • INVIO per confermare',W/2,y+166);
  const keyRows=['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
  keyRows.forEach((row,ri)=>row.split('').forEach((ch,ci)=>{
    const kw=36,gap=5,base=row.length*(kw+gap)-gap,kx=W/2-base/2+ci*(kw+gap),ky=y+176+ri*32;
    c.fillStyle='rgba(255,255,255,0.08)';rr(c,kx,ky,kw,28,5);c.fill();c.strokeStyle='#555';c.lineWidth=1;rr(c,kx,ky,kw,28,5);c.stroke();
    c.fillStyle='#fff';c.font='bold 13px Arial';c.fillText(ch,kx+kw/2,ky+19);
    btn(kx,ky,kw,28,'',function(){if(pillsValue.length<20)pillsValue+=ch;},{flat:true});
  }));
  btn(W/2-190,y+278,100,30,'⌫',()=>{pillsValue=pillsValue.slice(0,-1);},{color:'#888'});
  btn(W/2-75,y+278,150,30,'SBLOCCA',()=>{
    const val=pillsValue.trim().toLowerCase();
    if(val==='ninoz'){unlockNinozSecret();}
    else if(val==='diodenaro'){grantPillsRewards();}
    else{pillsToast='Codice non riconosciuto.';pillsValue='';}
  },{color:GRN});
  btn(W/2+95,y+278,100,30,'CHIUDI',()=>{pillsOpen=false;pillsValue='';},{color:'#ff4d4d'});
  c.restore();
}
let uiSliders=[];

/* ================= CONDIVIDI ================= */
function drawShare(){
  header('🔗 '+L('share'));
  const clips=CLIP.list();
  if(!clips.length){
    c.fillStyle='#888'; c.font='15px Arial'; c.textAlign='center';
    c.fillText(L('noClips'),W/2,300);
  } else {
    clips.slice(0,6).forEach((cl,i)=>{
      const y=120+i*86;
      c.fillStyle='rgba(20,18,30,0.92)'; rr(c,40,y,W-80,76,10); c.fill();
      c.strokeStyle=MAG; c.lineWidth=2; rr(c,40,y,W-80,76,10); c.stroke();
      c.fillStyle='#fff'; c.font='bold 14px Arial'; c.textAlign='left';
      c.fillText('🎬 '+cl.name,60,y+30,500);
      c.fillStyle='#888'; c.font='11px Arial';
      c.fillText(cl.time+'   COMBO x'+cl.score,60,y+54);
      btn(W-360,y+14,150,48,'▶ '+L('shareClip'),(function(cc){return ()=>{ CLIP.share(cc); };})(cl),{color:MAG});
      btn(W-190,y+14,120,48,'🗑',(function(idx){return ()=>{ CLIP.remove(idx); AUDIO.click(); };})(i),{});
    });
  }
  back();
}

/* ================= SCHERMATA DI GIOCO ================= */
const touchBtns={};
let dtLast=1/60; /* dt reale dell'ultimo frame — serve alla camera per lo smoothing */
let cvW=0,cvH=0; /* dimensioni canvas reali, condivise con drawScreenVirt */
function drawGame(){
  const cw=canvas.width, ch=canvas.height;
  ARENA.draw(c,game,cw,ch,dtLast);
  /* controlli touch (solo se touch disponibile) */
  if(IS_TOUCH){
    buttons=[];
    const bx=cw/ (cw/ch*0+1); // noop
    const sc=Math.min(cw/ENGINE.W,ch/ENGINE.H);
    const ox=(cw-ENGINE.W*sc)/2, oy=(ch-ENGINE.H*sc)/2;
    const X=x=>ox+x*sc, Y=y=>oy+y*sc, S_=v=>v*sc;
    /* pulsanti azione in basso a destra */
    const defs=[
      ['attack',cw-120,ch-120,95,'A'],
      ['ability',cw-230,ch-150,72,'B'],
      ['dash',cw-90,ch-240,64,'C'],
      ['ult',cw-320,ch-70,72,'⚡']
    ];
    defs.forEach(d=>{
      const p=S.player;
      let col=YEL,lab=d[4];
      /* cooldown ad arco: frazione = quanto manca alla prossima azione */
      let frac=1;
      if(d[0]==='ability'){ col=p&&p.abCd<=0?GRN:'#555'; frac=p&&p.abCdMax?1-p.abCd/p.abCdMax:1; }
      if(d[0]==='ult'){ col=p&&p.chaosCharge>=100?MAG:'#555'; frac=p?p.chaosCharge/100:0; }
      if(d[0]==='attack') frac=p&&p.atkT>0?1-p.atkT/(DATA.Weapons[p.colors.weapon]||DATA.Weapons.mattarello).rate:1;
      c.save(); c.globalAlpha=0.72;
      c.fillStyle=col; c.beginPath(); c.arc(d[1],d[2],d[3]/2,0,7); c.fill();
      /* velo di ricarica (scuro quando non pronto) */
      if(frac<1){ c.fillStyle='rgba(10,8,16,0.75)';
        c.beginPath(); c.moveTo(d[1],d[2]);
        c.arc(d[1],d[2],d[3]/2+1,-PI/2,-PI/2+PI*2*(1-frac)); c.closePath(); c.fill(); }
      c.strokeStyle='#fff'; c.lineWidth=2; c.beginPath(); c.arc(d[1],d[2],d[3]/2,0,7); c.stroke();
      c.fillStyle='#0c0a12'; c.font='bold '+(d[3]/2.6)+'px Arial'; c.textAlign='center'; c.textBaseline='middle';
      c.fillText(lab,d[1],d[2]); c.restore();
      touchBtns[d[0]]={x:d[1],y:d[2],r:d[3]/2};
    });
    /* stick virtuale */
    const sx=150,sy=ch-130;
    c.save(); c.globalAlpha=0.35;
    c.fillStyle='#222'; c.beginPath(); c.arc(sx,sy,55,0,7); c.fill();
    c.fillStyle=YEL; c.beginPath(); c.arc(sx+stick.dx*30,sy+stick.dy*30,24,0,7); c.fill();
    c.restore();
    touchBtns.stick={x:sx,y:sy,r:60};
    /* pausa */
    c.save(); c.globalAlpha=0.6; c.fillStyle='#222';
    rr(c,cw-70,20,50,40,8); c.fill();
    c.fillStyle='#fff'; c.fillRect(cw-56,30,6,20); c.fillRect(cw-44,30,6,20); c.restore();
    touchBtns.pause={x:cw-45,y:40,r:30};
  }
  /* etichetta vincolo settimanale */
  if(game.mode==='weekly'&&game.constraint>=0){
    c.save(); c.fillStyle='rgba(0,0,0,0.6)'; rr(c,cw/2-190,12,380,34,8); c.fill();
    c.fillStyle=MAG; c.font='bold 14px Arial'; c.textAlign='center';
    c.fillText('📅 '+LT('constraints')[game.constraint],cw/2,34); c.restore();
  }
  /* Boss intro */
  if(game.bossIntro>0){
    c.fillStyle='rgba(0,0,0,'+Math.min(0.6,game.bossIntro)+')'; c.fillRect(0,0,cw,ch);
    c.fillStyle=MAG; c.font='bold 46px Arial'; c.textAlign='center';
    c.fillText(DATA.BossNames[game.boss?game.boss.type:'']||'',cw/2,ch/2-20);
    c.fillStyle=YEL; c.font='bold 22px Arial';
    c.fillText(L('bossDefeat')==='BOSS SCONFITTO!'?'⚠ BOSS':'⚠ BOSS',cw/2,ch/2+30);
  }
  drawToast();
}

/* ---------- PAUSA ---------- */
function drawPause(){
  const cw=canvas.width,ch=canvas.height;
  c.fillStyle='rgba(8,6,14,0.78)'; c.fillRect(0,0,cw,ch);
  const bw=300,bh=56,x=cw/2-bw/2; let y=ch/2-160;
  c.fillStyle=YEL; c.font='bold 40px Arial'; c.textAlign='center';
  c.fillText('PAUSA',cw/2,y-30);
  y+=10;
  btn(x,y,bw,bh,L('resume'),()=>{game.paused=false;screen='game';AUDIO.click();},{big:true}); y+=70;
  btn(x,y,bw,bh,L('restart'),()=>{ const g=game; launchGame(g.mode,g.player.charId,{levelIdx:g.levelIdx,p1:g.player.charId,p2:g.ally?g.ally.charId:null,duelCpu:g.duelCpu,constraint:g.constraint}); },{big:true}); y+=70;
  btn(x,y,bw,bh,L('settings'),()=>{pauseSettings=true;go('settings');},{}); y+=70;
  btn(x,y,bw,bh,L('quit'),()=>{ finalizeGame(); go('menu'); screen='menu'; },{color:'#ff4d4d'});
}
let pauseSettings=false;

/* ---------- RISULTATI ---------- */
function drawResults(){
  const cw=canvas.width,ch=canvas.height;
  c.fillStyle='rgba(8,6,14,0.85)'; c.fillRect(0,0,cw,ch);
  const win=resKind==='win';
  c.textAlign='center';
  c.fillStyle=win?GRN:'#ff4d4d'; c.font='bold 52px Arial';
  c.fillText(win?L('victory'):L('defeat'),cw/2,190);
  if(game){
    const S=game;
    const chaosBonus=Math.round(S.maxCombo*3+S.kills*1.5);
    const total=S.coinsEarned+chaosBonus;
    if(!resCounted){ resCounted=true; SAVE.addCoins(total);
      if(S.mode==='chaos'&&S.wave>SAVE.data.bestChaos){ SAVE.data.bestChaos=S.wave; SAVE.save(); }
      if(S.maxCombo>(SAVE.data.stats.maxCombo||0)){ SAVE.data.stats.maxCombo=S.maxCombo; SAVE.save(); }
      lastClip=CLIP.finish();
    }
    let y=240;
    c.fillStyle='#fff'; c.font='bold 18px Arial';
    c.fillText('⚙ '+(S.mode==='chaos'?(L('chaos')+' — ONDATA '+S.wave):(DATA.Levels[S.levelIdx].name)),cw/2,y); y+=34;
    c.fillStyle='#ffd94d'; c.font='bold 22px Arial';
    c.fillText('⛁ +'+total+' ('+S.coinsEarned+' + '+chaosBonus+' '+L('chaosBonus')+')',cw/2,y); y+=30;
    c.fillStyle='#aaa'; c.font='14px Arial';
    c.fillText('COMBO MAX x'+S.maxCombo+'   |   KILL '+S.kills+'   |   ⚡ x'+S.ultsUsed,cw/2,y); y+=40;
    /* nuovo personaggio */
    if(S.newChar){
      c.fillStyle=MAG; c.font='bold 22px Arial';
      c.fillText('★ '+L('unlockedNew')+': '+DATA.Chars[S.newChar].name+' ★',cw/2,y); y+=36;
    }
    if(lastClip){
      c.fillStyle='#9adcff'; c.font='bold 14px Arial';
      c.fillText('🎬 '+L('clipSaved'),cw/2,y); y+=28;
    }
    const bw=240,bh=52;
    let bx=cw/2-bw-20, by=y+10;
    btn(bx,by,bw,bh,L('replay'),()=>{ launchGame(S.mode,S.player.charId,{levelIdx:S.levelIdx,p1:S.player.charId,p2:S.ally?S.ally.charId:null,duelCpu:S.duelCpu,constraint:S.constraint}); },{});
    if(win&&S.mode==='story'&&S.levelIdx<DATA.Levels.length-1){
      btn(cw/2-bw/2,by,bw,bh,L('next')+' ▶',()=>{ sel.pendingMode='story'; sel.level=S.levelIdx+1; go('charSel'); },{color:GRN});
    }
    btn(cw/2+20,by,bw,bh,L('quit'),()=>{ go('menu'); },{color:'#ff4d4d'});
  }
  drawToast();
}
let resCounted=false, lastClip=null;
function finalizeGame(){
  if(game&&!game.over){ /* uscita anticipata */ }
  CLIP.finish(); game=null;
}

/* ================= LOOP ================= */
function tick(dt){
  T+=dt;
  dtLast=dt;
  const cw=canvas.width, ch=canvas.height; cvW=cw; cvH=ch;
  c.setTransform(1,0,0,1,0,0);
  c.clearRect(0,0,cw,ch);
  const active3D=!!(game&&window.THREE3D&&window.THREE3D.shouldRender&&window.THREE3D.shouldRender(game));
  if(!active3D){ c.fillStyle='#0c0a12'; c.fillRect(0,0,cw,ch); }
  /* scala virtuale */
  const sc=Math.min(cw/W,ch/H), ox=(cw-W*sc)/2, oy=(ch-H*sc)/2;
  /* il MONDO va in screen-space puro (camera COVER propria): fuori dal contain,
     altrimenti le due scale si moltiplicano e il gioco risulta minuscolo. */
  const needWorld=(screen==='game'||screen==='pause'||screen==='results')&&game;
  if(needWorld) ARENA.draw(c,game,cw,ch,dtLast);
  /* velatura a schermo INTERO per pausa/risultati (in screen-space, qui la
     trasformazione virtuale non è attiva) */
  if(screen==='pause'||screen==='results'){ c.fillStyle='rgba(8,6,14,0.85)'; c.fillRect(0,0,cw,ch); }
  c.save(); c.translate(ox,oy); c.scale(sc,sc);
  drawScreenVirt();
  c.restore();
  /* overlay non scalati */
  if(screen==='game'&&game&&!game.paused) drawGameOverlay(cw,ch,sc,ox,oy);
  /* toast fuori scala */
  /* aggiorna gioco */
  if(game&&!game.over&&(screen==='game'||screen==='pause'))pollGamepad();
  if(screen==='game'&&game){
    if(!game.paused&&!game.over){
      const gameInput=Object.assign({},inputState);
      game.inp=gameInput; ENGINE.update(game,dt,gameInput,inp2);
      CLIP.observe(game,canvas);
    }
    if(game.over&&!resShown){ resShown=true; resKind=game.win?'win':'lose'; resCounted=false;
      AUDIO.music(game.win?'unlock':'menu');
      screen='results'; buttons=[];
    }
  }
}
let resShown=false;
function drawScreenVirt(){
  buttons=[];
  switch(screen){
    case 'title': drawTitle(); break;
    case 'menu': drawMenu(); break;
    case 'mode': drawMode(); break;
    case 'levels': drawLevels(); break;
    case 'chaosSel': drawChaosSel(); break;
    case 'trials': drawTrials(); break;
    case 'charSel': drawCharSel(); break;
    case 'duelSel': drawDuelSel(); break;
    case 'custom': drawCustom(); break;
    case 'shop': drawShop(); break;
    case 'trophies': drawTrophies(); break;
    case 'settings': drawSettings(); break;
    case 'share': drawShare(); break;
    case 'pause':
      if(game){ drawPauseVirt(); }
      break;
    case 'game':
      if(game){
        if(!game.paused){
          if(game.bossIntro>0){ bossIntroVirt(); }
          if(game.mode==='weekly'&&game.constraint>=0){
            c.fillStyle='rgba(0,0,0,0.6)'; rr(c,W/2-190,12,380,34,8); c.fill();
            c.fillStyle=MAG; c.font='bold 14px Arial'; c.textAlign='center';
            c.fillText('📅 '+LT('constraints')[game.constraint],W/2,34);
          }
          drawToastVirt();
          if(!IS_TOUCH) pauseBtnVirt(); /* su touch c'è già quello dell'overlay */
        }
      }
      break;
    case 'results': drawResultsVirt(); break;
  }
  /* disegna tutti i pulsanti registrati (esclusi quelli trasparenti) */
  buttons.forEach(b=>{ if(b.label) drawBtn(c,b); });
}
function pauseBtnVirt(){
  c.save(); c.globalAlpha=0.55; c.fillStyle='#222';
  rr(c,W-64,16,48,36,8); c.fill();
  c.fillStyle='#fff'; c.fillRect(W-50,24,5,20); c.fillRect(W-40,24,5,20); c.restore();
  btn(W-64,16,48,36,'',()=>{ if(game)game.paused=true; screen='pause'; AUDIO.click(); },{flat:true});
}
function bossIntroVirt(){
  c.fillStyle='rgba(0,0,0,'+Math.min(0.65,game.bossIntro)+')'; c.fillRect(0,0,W,H);
  c.textAlign='center';
  c.fillStyle=MAG; c.font='bold 44px Arial';
  c.fillText(DATA.BossNames[game.boss&&game.boss.type]||'',W/2,H/2-10);
  c.fillStyle=YEL; c.font='bold 20px Arial'; c.fillText('⚠ BOSS ⚠',W/2,H/2+34);
}
function drawToastVirt(){
  if(toastT<=0)return; toastT-=1/60;
  c.save(); c.globalAlpha=Math.min(1,toastT);
  c.fillStyle='#0c0a12'; rr(c,W/2-140,H-120,280,40,10); c.fill();
  c.strokeStyle=YEL; c.lineWidth=2; rr(c,W/2-140,H-120,280,40,10); c.stroke();
  c.fillStyle=YEL; c.font='bold 15px Arial'; c.textAlign='center';
  c.fillText(toastMsg,W/2,H-95); c.restore();
}
function drawPauseVirt(){
  /* la velatura è fatta in tick() a schermo intero */
  const bw=300,bh=56,x=W/2-bw/2; let y=200;
  c.fillStyle=YEL; c.font='bold 40px Arial'; c.textAlign='center';
  c.fillText('PAUSA',W/2,y-24);
  y+=20;
  buttons.length=0;
  btn(x,y,bw,bh,L('resume'),()=>{ if(game)game.paused=false; screen='game'; AUDIO.click(); },{big:true}); y+=70;
  btn(x,y,bw,bh,L('restart'),()=>{ const g=game; launchGame(g.mode,g.player.charId,{levelIdx:g.levelIdx,trialIdx:g.trialIdx,p1:g.player.charId,p2:g.ally&&!g.duelVsBoss?g.ally.charId:null,vsBoss:g.duelVsBoss||null,duelCpu:g.duelCpu,constraint:g.constraint}); },{}); y+=70;
  btn(x,y,bw,bh,L('quit'),()=>{ finalizeGame(); go('menu'); screen='menu'; AUDIO.music('menu'); },{color:'#ff4d4d'});
}
function drawResultsVirt(){
  /* la velatura è fatta in tick() a schermo intero */
  const win=resKind==='win';
  c.textAlign='center';
  c.fillStyle=win?GRN:'#ff4d4d'; c.font='bold 52px Arial';
  c.fillText(win?L('victory'):L('defeat'),W/2,170);
  if(game){
    const S=game;
    const chaosBonus=Math.round(S.maxCombo*3+S.kills*1.5);
    const total=S.coinsEarned+chaosBonus;
    if(!resCounted){ resCounted=true;
      SAVE.addCoins(total);
      if(S.mode==='chaos'&&S.wave>(SAVE.data.bestChaos||0)){ SAVE.data.bestChaos=S.wave; }
      if(S.maxCombo>((SAVE.data.stats||{}).maxCombo||0)) SAVE.data.stats.maxCombo=S.maxCombo;
      if(SAVE.data.stats.maxCombo>=30) SAVE.trophy('combo30');
      lastClip=CLIP.finish();
      SAVE.save();
    }
    let y=210;
    c.fillStyle='#fff'; c.font='bold 18px Arial';
    c.fillText(S.mode==='duel'?L('duel')+' — '+(S.duelRound||1):S.mode==='trial'?'🔥 PROVA — '+(DATA.Trials[S.levelIdx]?DATA.Trials[S.levelIdx].name[SAVE.data.lang]||'':''):S.mode==='marathon'?'🏃 MARATONA — PROVA '+(S.marathonIdx+1)+'/3':S.mode==='chaos'?L('chaos')+' — ONDATA '+S.wave:DATA.Levels[S.levelIdx].name,W/2,y); y+=36;
    c.fillStyle='#ffd94d'; c.font='bold 22px Arial';
    c.fillText('⛁ +'+total+' ('+S.coinsEarned+' + '+chaosBonus+' '+L('chaosBonus')+')',W/2,y); y+=30;
    c.fillStyle='#aaa'; c.font='14px Arial';
    c.fillText('COMBO MAX x'+S.maxCombo+'   |   KILL '+S.kills+'   |   ⚡ x'+S.ultsUsed,W/2,y); y+=36;
    if(win&&S.mode==='duel'){ c.fillStyle=game.duelCpu||game.duelVsBoss?GRN:YEL; c.font='bold 20px Arial';
      if(game.duelVsBoss){
        const bn=DATA.BossNames[game.duelVsBoss]||'BOSS';
        c.fillText(game.win?(L('winP1')+' — '+bn+' SCONFITTO!'):('SCONFITTA! '+bn+' VINCE!'),W/2,y);
      } else c.fillText(game.win?L('winP1'):(game.duelCpu?L('winCPU'):L('winP2')),W/2,y);
      y+=34; }
    if(S.newChar){
      c.fillStyle=MAG; c.font='bold 20px Arial';
      c.fillText('★ '+L('unlockedNew')+': '+DATA.Chars[S.newChar].short+' ★',W/2,y); y+=34;
    }
    if(lastClip){ c.fillStyle='#9adcff'; c.font='bold 14px Arial'; c.fillText('🎬 '+L('clipSaved'),W/2,y); y+=26; }
    const bw=220,bh=52; let by=y+8;
    btn(W/2-bw-230,by,bw,bh,L('replay'),()=>{ const S2=game; launchGame(S2.mode,S2.player.charId,{levelIdx:S2.levelIdx,trialIdx:S2.trialIdx,p1:S2.player.charId,p2:S2.ally&&!S2.duelVsBoss?S2.ally.charId:null,vsBoss:S2.duelVsBoss||null,duelCpu:S2.duelCpu,constraint:S2.constraint}); },{});
    if(win&&S.mode==='story'&&S.levelIdx<DATA.Levels.length-1){
      btn(W/2-bw/2,by,bw,bh,L('next')+' ▶',()=>{ sel.pendingMode='story'; sel.level=S.levelIdx+1; go('charSel'); resShown=false; },{color:GRN});
    }
    btn(W/2+230,by,bw,bh,L('quit'),()=>{ finalizeGame(); go('menu'); screen='menu'; AUDIO.music('menu'); resShown=false; },{color:'#ff4d4d'});
    if(win&&S.mode==='trial'){ c.fillStyle=GRN; c.font='bold 15px Arial';
      const rec=(SAVE.data.trialBest||{})[DATA.Trials[S.levelIdx].id];
      const rk=S.trialRank||0;
      c.fillText((rk?('['+L('boardRank')+' #'+rk+'] '):'')+'PROVA SUPERATA'+(rec?(' — ⏱ '+rec+'s'):'')+' — '+DATA.Chars[DATA.Trials[S.levelIdx].id].short+' È TUA',W/2,by+bh+34); }
    if(win&&S.mode==='marathon'){ c.fillStyle=GRN; c.font='bold 15px Arial';
      c.fillText('🏆 MARATONA COMPLETATA — SVITATO PER SEMPRE',W/2,by+bh+34); }
    if(lastClip){
      btn(W/2-130,by+bh+14,260,44,'🎬 '+L('shareClip'),()=>{ CLIP.share(lastClip); resShown=false; },{color:MAG});
    }
  }
  drawToastVirt();
}

/* overlay per touch (fuori scala, coordinate reali) */
let stick={dx:0,dy:0,id:null}, cameraStick={dx:0,dy:0,id:null,origin:null}, mouseLook=null;
function drawGameOverlay(cw,ch,sc,ox,oy){
  if(!IS_TOUCH)return;
  const S=game; if(!S)return;
  const defs=[
    ['attack',cw-110,ch-110,95,'A','#E8FF00'],
    ['ability',cw-225,ch-140,72,'B',(S.player&&S.player.abCd<=0)?'#39FF14':'#555'],
    ['dash',cw-80,ch-235,62,'C','#9adcff'],
    ['ult',cw-330,ch-70,72,'⚡',(S.player&&S.player.chaosCharge>=100)?'#FF2FB0':'#555']
  ];
  if(S.nearbyPoi){ defs.push(['interact',cw*0.5,ch-240,58,'E','#39FF14']); }
  else delete touchBtns.interact;
  const PI2=Math.PI*2;
  defs.forEach(d=>{
    /* cooldown ad arco: frazione = quanto è pronto il comando (1 = pronto) */
    let frac=1;
    if(d[0]==='ability'&&S.player) frac=S.player.abCdMax?1-S.player.abCd/S.player.abCdMax:1;
    if(d[0]==='ult'&&S.player) frac=(S.player.chaosCharge||0)/100;
    if(d[0]==='attack'&&S.player){ const w=DATA.Weapons[S.player.colors.weapon]||DATA.Weapons.mattarello; frac=S.player.atkT>0?1-S.player.atkT/w.rate:1; }
    c.save(); c.globalAlpha=0.6;
    c.fillStyle=d[5]; c.beginPath(); c.arc(d[1],d[2],d[3]/2,0,PI2); c.fill();
    if(frac<1){ c.fillStyle='rgba(10,8,16,0.72)';
      c.beginPath(); c.moveTo(d[1],d[2]);
      c.arc(d[1],d[2],d[3]/2+1,-Math.PI/2,-Math.PI/2+PI2*(1-frac)); c.closePath(); c.fill(); }
    c.strokeStyle='#fff'; c.lineWidth=2; c.beginPath(); c.arc(d[1],d[2],d[3]/2,0,PI2); c.stroke();
    c.fillStyle='#0c0a12'; c.font='bold '+(d[3]/2.6)+'px Arial'; c.textAlign='center'; c.textBaseline='middle';
    c.fillText(d[4],d[1],d[2]); c.restore();
    touchBtns[d[0]]={x:d[1],y:d[2],r:d[3]/2};
  });
  const sx=140,sy=ch-120;
  c.save(); c.globalAlpha=0.3;
  c.fillStyle='#222'; c.beginPath(); c.arc(sx,sy,58,0,PI2); c.fill();
  c.fillStyle=YEL; c.beginPath(); c.arc(sx+stick.dx*32,sy+stick.dy*32,26,0,PI2); c.fill();
  c.restore();
  touchBtns.stick={x:sx,y:sy,r:62};
  const cx=cw-132,cy=ch-346,cr=48;
  c.save();c.globalAlpha=0.28;c.fillStyle='#111';c.beginPath();c.arc(cx,cy,cr+12,0,PI2);c.fill();
  c.globalAlpha=0.42;c.strokeStyle='#52f2ff';c.lineWidth=2;c.beginPath();c.arc(cx,cy,cr,0,PI2);c.stroke();
  c.globalAlpha=0.2;c.strokeStyle='#c6f7ff';c.lineWidth=1;c.beginPath();c.moveTo(cx-cr+8,cy);c.lineTo(cx+cr-8,cy);c.moveTo(cx,cy-cr+8);c.lineTo(cx,cy+cr-8);c.stroke();
  c.fillStyle='rgba(82,242,255,0.28)';c.beginPath();c.arc(cx+cameraStick.dx*30,cy+cameraStick.dy*30,20,0,PI2);c.fill();
  c.globalAlpha=0.8;c.fillStyle='#c6f7ff';c.font='bold 9px Arial';c.textAlign='center';c.fillText('CAM',cx,cy+3);
  c.font='bold 10px Arial';c.fillText('↕',cx,cy-cr-5);c.fillText('↔',cx+cr+4,cy+3);c.restore();
  touchBtns.cameraStick={x:cx,y:cy,r:cr};
  /* pausa touch: visibile e REGISTRATA (prima mancava: il tocco non la vedeva) */
  c.save(); c.globalAlpha=0.6; c.fillStyle='#222';
  rr(c,cw-70,20,50,40,8); c.fill();
  c.fillStyle='#fff'; c.fillRect(cw-56,30,6,20); c.fillRect(cw-44,30,6,20); c.restore();
  touchBtns.pause={x:cw-45,y:40,r:34};
}

/* ================= INPUT ================= */
const IS_TOUCH=('ontouchstart' in window)||navigator.maxTouchPoints>0;
let inp2={left:false,right:false,up:false,down:false,attack:false,ability:false,ult:false,dash:false};
const p2Keys={left:'arrowleft',right:'arrowright',up:'arrowup',down:'arrowdown',attack:'f',ability:'g',ult:'h',dash:'n'};
let p2GamepadIndex=-1;
function toVirt(px,py){
  const cw=canvas.width,ch=canvas.height;
  const sc=Math.min(cw/W,ch/H), ox=(cw-W*sc)/2, oy=(ch-H*sc)/2;
  return {x:(px-ox)/sc, y:(py-oy)/sc};
}
/* converte coordinate CSS dell'evento in coordinate canvas fisiche */
function canvasXY(clientX,clientY){
  const r=canvas.getBoundingClientRect();
  return { x:(clientX-r.left)*canvas.width/r.width, y:(clientY-r.top)*canvas.height/r.height };
}
function pointerDown(cx,cy,pointerId,button){
  AUDIO.start();
  if(button===2&&screen==='game'&&game&&!game.paused){
    mouseLook={id:pointerId,x:cx,y:cy};
    try{canvas.setPointerCapture(pointerId);}catch(err){}
    return;
  }
  const cc=canvasXY(cx,cy); const px=cc.x, py=cc.y;
  /* slider: trascinamento immediato se il tocco cade sulla pista */
  for(const s of uiSliders){
    if(Math.abs(py-s.y)<22&&px>s.x-18&&px<s.x+s.w+18){
      const nv=Math.max(0,Math.min(1,(px-s.x)/s.w)); s.val=nv; s.cb(nv);
      const up=()=>{ window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up); };
      const mv=e2=>{ const p2=canvasXY(e2.clientX,e2.clientY); const nv2=Math.max(0,Math.min(1,(p2.x-s.x)/s.w)); s.val=nv2; s.cb(nv2); };
      window.addEventListener('pointermove',mv); window.addEventListener('pointerup',up);
      return;
    }
  }
  const v=toVirt(px,py);
  if(pillsOpen&&screen==='settings'){
    if(hitTest(v.x,v.y)){const b=hitTest(v.x,v.y);b.action();return;}
    return;
  }
  if(screen==='title'){ go('menu'); screen='menu'; return; }
  if(screen==='game'&&game&&!game.paused){
    /* tocco sul dialogo = avanza/skip */      if(game.dialog){ game.dialogT=999; return; }
      /* touch: use lane joystick axes only with a live 3D renderer */
    if(IS_TOUCH){
      let hitCtrl=false;
      for(const k in touchBtns){ const b=touchBtns[k];
        if(Math.hypot(px-b.x,py-b.y)<b.r+14){
          hitCtrl=true;
          if(k==='stick'){ stick.id=pointerId; stick.origin={x:b.x,y:b.y}; updStick(px,py); touchPointers[pointerId]='stick'; }
          else if(k==='cameraStick'){cameraStick.id=pointerId;cameraStick.origin={x:b.x,y:b.y};updCameraStick(px,py);touchPointers[pointerId]='cameraStick';}
          else if(k==='attack'||k==='ability'||k==='ult'||k==='interact'||k==='dash'){
            touchHeld[k]=inputState[k]=true; touchPointers[pointerId]=k;
          }
          else if(k==='pause'){ game.paused=true; screen='pause'; AUDIO.click(); }
          return;
        } }
      /* nessun controllo touch toccato: prosegui sui bottoni virtuali
         (dialoghi, weekly banner, ecc.) invece di mangiare il tocco */
      if(!hitCtrl&&!game.dialog){ /* fallthrough all'hitTest sotto */ }
    }
  }
  const b=hitTest(v.x,v.y);
  if(b){ b.hover=true; b.action(); if(b.opts&&b.opts.flat)AUDIO.click(); }
}
function updStick(px,py){
  const b=touchBtns.stick; if(!b||!stick.origin)return;
  const dx=px-stick.origin.x, dy=py-stick.origin.y;
  const d=Math.hypot(dx,dy), m=Math.min(1,d/40);
  stick.dx=d?dx/d*m:0; stick.dy=d?dy/d*m:0;
  /* deadzone: sotto 18px fisici non si muove (niente passi fantasma) */
  inputState.left=stick.dx<-0.3; inputState.right=stick.dx>0.3;
  inputState.up=stick.dy<-0.3; inputState.down=stick.dy>0.3;
}
function updCameraStick(px,py){
  const b=touchBtns.cameraStick;if(!b||!cameraStick.origin)return;
  const dx=px-cameraStick.origin.x,dy=py-cameraStick.origin.y,d=Math.hypot(dx,dy),m=Math.min(1,d/42);
  cameraStick.dx=d?dx/d*m:0;cameraStick.dy=d?dy/d*m:0;
  inputState.cameraX=Math.abs(cameraStick.dx)>0.18?cameraStick.dx*0.95:0;
  inputState.cameraY=Math.abs(cameraStick.dy)>0.18?cameraStick.dy*0.75:0;
}
function pointerMove(cx,cy,pointerId){
  const cc=canvasXY(cx,cy); const px=cc.x, py=cc.y;
  if(mouseLook&&mouseLook.id===pointerId){
    const dx=cx-mouseLook.x,dy=cy-mouseLook.y;mouseLook.x=cx;mouseLook.y=cy;
    inputState.cameraX=Math.max(-1,Math.min(1,dx/14));inputState.cameraY=Math.max(-1,Math.min(1,dy/14));return;
  }
  if(stick.id===pointerId){ updStick(px,py); return; }
  if(cameraStick.id===pointerId){updCameraStick(px,py);return;}
  const v=toVirt(px,py);
  buttons.forEach(b=>{ b.hover=hitTest(v.x,v.y)===b; });
}
function pointerUp(pointerId){
  if(mouseLook&&(pointerId==null||mouseLook.id===pointerId)){
    mouseLook=null;inputState.cameraX=inputState.cameraY=0;
  }
  if(pointerId==null){
    const ids=Object.keys(touchPointers);
    if(ids.length){ids.forEach(function(id){pointerUp(Number(id));});return;}
  }
  const control=touchPointers[pointerId];
  if(control){
    delete touchPointers[pointerId];
    if(control==='stick'&&stick.id===pointerId){
      stick.id=null; stick.origin=null; stick.dx=stick.dy=0;
      inputState.left=inputState.right=inputState.up=inputState.down=false;
    }    else if(control==='cameraStick'&&cameraStick.id===pointerId){
      cameraStick.id=null;cameraStick.origin=null;cameraStick.dx=cameraStick.dy=0;inputState.cameraX=inputState.cameraY=0;

    } else if(touchHeld[control]){
      touchHeld[control]=false; inputState[control]=false;
    }
    return;
  }
  /* Mouse click/UI release: never cancel an independent touch or keyboard hold. */
  if(pointerId==null){
    stick.id=null; stick.origin=null; stick.dx=stick.dy=0;
    cameraStick.id=null;cameraStick.origin=null;cameraStick.dx=cameraStick.dy=0;
    inputState.left=inputState.right=inputState.up=inputState.down=false;
    inputState.attack=inputState.ability=inputState.ult=inputState.dash=inputState.interact=false;
    inputState.padMoveX=0; inputState.padMoveY=0; inputState.cameraX=0; inputState.cameraY=0;
  }
}

/* tastiera e controller */
let padPauseHeld=false;
function pollGamepad(){
  let pads=[];
  if(navigator.getGamepads){try{pads=Array.from(navigator.getGamepads()||[]);}catch(err){pads=[];}}
  const localDuel=!!(game&&game.mode==='duel'&&!game.duelCpu);
  const connected=pads.map((pad,index)=>pad&&pad.connected?index:-1).filter(index=>index>=0);
  p2GamepadIndex=localDuel&&connected.length>1?connected[1]:-1;
  const padIndex=connected.find(index=>index!==p2GamepadIndex);
  const pad=padIndex==null?null:pads[padIndex];
  const player2=p2GamepadIndex>=0?pads[p2GamepadIndex]:null;
  const axis=function(source,i){
    const v=source&&source.axes[i]||0;
    if(Math.abs(v)<0.12)return 0; // deadzone più stretta e reattiva da console
    // curva di risposta esponenziale morbida: micro-correzioni precise, affondi veloci
    const sgn=v>0?1:-1, norm=(Math.abs(v)-0.12)/(1-0.12);
    return sgn*Math.pow(norm,1.3);
  };
  const pressed=function(source,i){return !!(source&&source.buttons[i]&&source.buttons[i].pressed);};
  const dpadX=(pressed(pad,15)?1:0)-(pressed(pad,14)?1:0);
  const dpadY=(pressed(pad,13)?1:0)-(pressed(pad,12)?1:0);
  inputState.padMoveX=dpadX||axis(pad,0); inputState.padMoveY=dpadY||axis(pad,1);
  const altCamera=!!keys.alt;
  const keyCameraX=(keys.q?-0.7:0)+(keys.r?0.7:0)+(altCamera&&keys.arrowleft?-0.7:0)+(altCamera&&keys.arrowright?0.7:0);
  const keyCameraY=(keys.t?-0.7:0)+(keys.y?0.7:0)+(altCamera&&keys.arrowup?-0.7:0)+(altCamera&&keys.arrowdown?0.7:0);
  inputState.cameraX=axis(pad,2)||keyCameraX||(cameraStick.id!==null?cameraStick.dx*0.95:0);
  inputState.cameraY=axis(pad,3)||keyCameraY||(cameraStick.id!==null?cameraStick.dy*0.75:0);
  inp2.padMoveX=axis(player2,0); inp2.padMoveY=axis(player2,1);
  inp2.attack=!!keys.f||pressed(player2,2)||pressed(player2,0); inp2.ability=!!keys.g||pressed(player2,3);
  inp2.ult=!!keys.h||pressed(player2,4)||pressed(player2,6); inp2.dash=!!keys.n||pressed(player2,1)||pressed(player2,7);
  // Controller layout console: X/Square (button 0 o 2) attacco, B/Circle (1) o R2 (7) dash, Y/Triangle (3) abilità, LB/RB/L2 (4,5,6) ult/interact
  inputState.attack=touchHeld.attack||keys.j||keys.z||keys[' ']||pressed(pad,2)||pressed(pad,0);
  inputState.ability=touchHeld.ability||keys.k||keys.x||keys.v||pressed(pad,3);
  inputState.ult=touchHeld.ult||keys.l||keys.c||keys.b||pressed(pad,4)||pressed(pad,6);
  inputState.dash=touchHeld.dash||keys.shift||pressed(pad,1)||pressed(pad,7);
  inputState.interact=touchHeld.interact||keys.e||keys.enter||pressed(pad,5);
  const pauseNow=pressed(pad,9);
  if(pauseNow&&!padPauseHeld){
    if(screen==='game'){game.paused=true;screen='pause';pointerUp();}
    else if(screen==='pause'){game.paused=false;screen='game';}
    inputState.attack=inputState.ability=inputState.ult=inputState.dash=inputState.interact=false;
  }
  padPauseHeld=pauseNow;
}
function syncKeyboardMovement(){
  const localDuel=!!(game&&game.mode==='duel'&&!game.duelCpu);
  inputState.left=!!keys.a||(!localDuel&&!keys.alt&&!!keys.arrowleft);
  inputState.right=!!keys.d||(!localDuel&&!keys.alt&&!!keys.arrowright);
  inputState.up=!!keys.w||(!localDuel&&!keys.alt&&!!keys.arrowup);
  inputState.down=!!keys.s||(!localDuel&&!keys.alt&&!!keys.arrowdown);
  inp2.left=localDuel&&!!keys.arrowleft&&!keys.alt;
  inp2.right=localDuel&&!!keys.arrowright&&!keys.alt;
  inp2.up=localDuel&&!!keys.arrowup&&!keys.alt;
  inp2.down=localDuel&&!!keys.arrowdown&&!keys.alt;
}
function keyDown(e){
  AUDIO.start();
  const k=e.key.toLowerCase();
  if(pillsOpen&&screen==='settings'){
    e.preventDefault();
    if(k==='escape'){pillsOpen=false;pillsValue='';return;}
    if(k==='enter'){
      const val=pillsValue.trim().toLowerCase();
      if(val==='ninoz')unlockNinozSecret();
      else if(val==='diodenaro')grantPillsRewards();
      else{pillsToast='Codice non riconosciuto.';pillsValue='';}
      return;
    }
    if(k==='backspace'){e.preventDefault();pillsValue=pillsValue.slice(0,-1);return;}
    if(/^[a-z0-9]$/.test(k)&&pillsValue.length<20){pillsValue+=k;return;}
  }
  const wasDown=!!keys[k];
  keys[k]=true;
  if(screen==='title'){ go('menu'); screen='menu'; return; }
  if(screen==='menu'&&(k==='arrowleft'||k==='arrowright')){
    e.preventDefault();const n=Math.max(1,SAVE.data.chars.length);
    sel.char=(sel.char+(k==='arrowright'?1:n-1))%n;return;
  }
  if(screen==='menu'&&(k==='arrowup'||k==='arrowdown')){
    e.preventDefault();activeMenuCard=(activeMenuCard+(k==='arrowdown'?1:5))%6;return;
  }
  if(screen==='menu'&&k==='enter'){e.preventDefault();activateMenuCard(activeMenuCard);return;}
  if(screen==='charSel'&&(k==='arrowleft'||k==='arrowright')){
    e.preventDefault();const n=Object.keys(DATA.Chars).filter(id=>SAVE.unlocked(id)).length;
    if(n)sel.char=(sel.char+(k==='arrowright'?1:n-1))%n;return;
  }
  syncKeyboardMovement();
  if(k===' '){ inputState.jump=true; e.preventDefault(); }
  if(k==='e'||k==='enter') inputState.interact=true;
  if(k==='j'||k==='z'||k===' ') inputState.attack=true;
  if(k==='k'||k==='x'||k==='v') inputState.ability=true;
  if(k==='l'||k==='c'||k==='b') inputState.ult=true;
  if(k==='shift') inputState.dash=true;
  if(k==='q'||k==='arrowleft'&&e.altKey){inputState.cameraX=-0.7;if(k==='arrowleft'){keys.alt=true;e.preventDefault();}}
  if(k==='r'||k==='arrowright'&&e.altKey){inputState.cameraX=0.7;if(k==='arrowright'){keys.alt=true;e.preventDefault();}}
  if(k==='t'||k==='arrowup'&&e.altKey){inputState.cameraY=-0.7;if(k==='arrowup'){keys.alt=true;e.preventDefault();}}
  if(k==='y'||k==='arrowdown'&&e.altKey){inputState.cameraY=0.7;if(k==='arrowdown'){keys.alt=true;e.preventDefault();}}
  /* P2 duello locale */
  if(k==='f') inp2.attack=true;
  if(k==='g') inp2.ability=true;
  if(k==='h') inp2.ult=true;
  if(k==='n') inp2.dash=true;
  if((k==='escape'||k==='p')&&!wasDown){
    if(screen==='game'&&game){ game.paused=true; screen='pause'; inputState.attack=inputState.ability=inputState.ult=inputState.dash=inputState.interact=false; pointerUp(); }
    else if(screen==='pause'){ if(game)game.paused=false; screen='game'; }
  }
}
function keyUp(e){
  const k=e.key.toLowerCase(); keys[k]=false;
  syncKeyboardMovement();
  if(k===' ') inputState.jump=false;
  if(k==='e'||k==='enter') inputState.interact=false;
  if(k==='j'||k==='z'||k===' ') inputState.attack=false;
  if(k==='k'||k==='x'||k==='v') inputState.ability=false;
  if(k==='l'||k==='c'||k==='b') inputState.ult=false;
  if(k==='shift') inputState.dash=false;
  if(k==='alt'){keys.alt=false;syncKeyboardMovement();}
  if(k==='q'||k==='r'||k==='arrowleft'&&keys.alt||k==='arrowright'&&keys.alt)inputState.cameraX=0;
  if(k==='t'||k==='y'||k==='arrowup'&&keys.alt||k==='arrowdown'&&keys.alt)inputState.cameraY=0;
  if(k==='arrowleft'||k==='arrowright')syncKeyboardMovement();
  if(k==='f') inp2.attack=false;
  if(k==='g') inp2.ability=false;
  if(k==='h') inp2.ult=false;
  if(k==='n') inp2.dash=false;
}

/* API pubblica */
return {
  _dbg(){ return buttons.map(b=>({x:b.x,y:b.y,w:b.w,label:b.label||'(vuoto)'})); },
  init(cv,ctx){ canvas=cv; c=ctx;
    canvas.addEventListener('pointerdown',e=>{if(e.button===2)e.preventDefault();pointerDown(e.clientX,e.clientY,e.pointerId,e.button);});
    canvas.addEventListener('pointermove',e=>{pointerMove(e.clientX,e.clientY,e.pointerId);});
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    window.addEventListener('pointerup',e=>pointerUp(e.pointerId));
    window.addEventListener('pointercancel',e=>pointerUp(e.pointerId));
    window.addEventListener('keydown',e=>keyDown(e));
    window.addEventListener('keyup',e=>keyUp(e));
    window.addEventListener('blur',()=>{keys={};pointerUp();inp2={left:false,right:false,up:false,down:false,attack:false,ability:false,ult:false,dash:false,padMoveX:0,padMoveY:0};inputState.cameraX=inputState.cameraY=0;});
  },
  tick,
  getGame, getScreen, toast, launchGame, go,
  setSel(k,v){ sel[k]=v; },
  getSel(){ return sel; }
};
})();
