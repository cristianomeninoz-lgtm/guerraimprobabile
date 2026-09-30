/* ===== UNHINGED WARFARE — Disegno arena + HUD ===== */
window.ARENA=(function(){
const W=ENGINE.W,H=ENGINE.H,GY=ENGINE.GY;
const PI=Math.PI;
const clamp=(v,a,b)=>v<a?a:v>b?b:v; /* per la camera */

/* ---- arrotondato compatibile ---- */
function rr(c,x,y,w,h,r){ c.beginPath();
  if(c.roundRect){ c.roundRect(x,y,w,h,r); }
  else { c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
}

/* ---------- Ostacoli disegnati ---------- */
function drawObstacle(c,o,t){
  c.save();
  if(o.type==='vending'){ c.fillStyle='#2a6a4a'; c.fillRect(o.x-18,GY-58,36,58);
    c.fillStyle='#183a28'; c.fillRect(o.x-14,GY-52,28,30);
    c.fillStyle='#ffd94d'; for(let i=0;i<6;i++) c.fillRect(o.x-12+(i%3)*9,GY-50+Math.floor(i/3)*12,7,9); }
  else if(o.type==='sbarra'){ c.fillStyle='#555'; c.fillRect(o.x-3,GY-60,6,60);
    c.fillStyle=Math.sin(t*4+o.x)>0?'#d33':'#eee'; c.fillRect(o.x-40,GY-60,80,7); }
  else if(o.type==='stampzone'){ c.fillStyle='rgba(200,40,40,0.10)'; c.fillRect(o.x-70,GY-8,140,10);
    c.strokeStyle='#c22'; c.strokeRect(o.x-60,GY-6,120,8); }
  else if(o.type==='shelf'){ c.fillStyle='#2a3038'; c.fillRect(o.x-24,GY-70,48,70);
    c.fillStyle='#ffd94d'; c.fillRect(o.x-20,GY-60,40,8); c.fillStyle='#d33'; c.fillRect(o.x-20,GY-44,40,8); }
  else if(o.type==='train'){ c.fillStyle='#3a5a7a'; c.fillRect(o.x-70,GY-52,140,44);
    c.fillStyle='#22384a'; c.fillRect(o.x-60,GY-46,50,24); c.fillRect(o.x+10,GY-46,50,24);
    c.fillStyle='#ffd94d'; c.fillRect(o.x-70,GY-14,140,6); }
  else if(o.type==='molla'){ c.strokeStyle='#c85a8a'; c.lineWidth=4;
    c.beginPath(); for(let i=0;i<5;i++){ c.moveTo(o.x-10,GY-8-i*8); c.lineTo(o.x+10,GY-12-i*8);} c.stroke(); }
  else if(o.type==='copier'){ c.fillStyle='#9aa4b0'; c.fillRect(o.x-22,GY-46,44,46);
    c.fillStyle='#333'; c.fillRect(o.x-16,GY-40,20,10); c.fillStyle='#4f8'; c.fillRect(o.x+6,GY-40,8,4); }
  else if(o.type==='ventola'){ c.save(); c.translate(o.x,GY-40); c.rotate(t*3);
    c.fillStyle='#4a4458'; for(let i=0;i<4;i++){ c.rotate(PI/2); c.beginPath(); c.ellipse(0,-14,6,14,0,0,7); c.fill(); }
    c.restore(); c.fillStyle='#2a2438'; c.beginPath(); c.arc(o.x,GY-40,5,0,7); c.fill(); }
  else if(o.type==='dentiera'){ const ch=Math.abs(Math.sin(t*3+o.x))*10;
    c.fillStyle='#e8e8f0'; c.fillRect(o.x-16,GY-14-ch,32,8);
    c.fillStyle='#fff'; for(let i=0;i<5;i++) c.fillRect(o.x-14+i*6.5,GY-13-ch,5,6);
    c.fillStyle='#d4b84a'; c.fillRect(o.x-16,GY-7-ch,32,3); }
  else if(o.type==='tappeto'){ c.fillStyle='#8a2a3a'; c.fillRect(o.x-45,GY-6,90,8);
    c.strokeStyle='#e8c96b'; c.lineWidth=2; c.strokeRect(o.x-38,GY-4.5,76,5);
    c.fillStyle='#6b1a2a'; c.fillRect(o.x-20,GY-4,40,3); }
  else if(o.type==='nastro'){ c.fillStyle='#3a3f4a'; c.fillRect(o.x-30,GY-16,60,10);
    c.fillStyle='#222'; for(let i=0;i<4;i++) c.beginPath(),c.arc(o.x-22+i*15,GY-5,3.5,0,7),c.fill();
    const off=(t*30)%15; c.fillStyle='#556'; c.fillRect(o.x-30,GY-13,60,2);
    c.fillStyle='#e8c96b'; c.fillRect(o.x-10+off,GY-22,14,7); }
  else if(o.type==='trex'){ c.fillStyle='#3a5a4a'; c.fillRect(o.x-8,GY-58,16,26);
    c.fillStyle='#4a6a5a'; c.beginPath(); c.ellipse(o.x,GY-64,16,10,0,0,7); c.fill();
    c.fillStyle='#fff'; c.beginPath(); c.arc(o.x-5,GY-66,2.5,0,7); c.arc(o.x+5,GY-66,2.5,0,7); c.fill();
    c.fillStyle='#111'; c.beginPath(); c.arc(o.x-5,GY-66,1.2,0,7); c.arc(o.x+5,GY-66,1.2,0,7); c.fill();
    c.fillStyle='#f4c84a'; c.beginPath(); c.moveTo(o.x-4,GY-58); c.lineTo(o.x+4,GY-58); c.lineTo(o.x,GY-52); c.closePath(); c.fill(); }
  else if(o.type==='subwoofer'){ c.fillStyle='#241a30'; c.fillRect(o.x-24,GY-52,48,52);
    c.fillStyle='#0e0a14'; c.beginPath(); c.arc(o.x,GY-26,18,0,7); c.fill();
    const pu=1+Math.sin(t*8+o.x)*0.25;
    c.fillStyle='#4a3a5a'; c.beginPath(); c.arc(o.x,GY-26,8*pu,0,7); c.fill(); }
  else if(o.type==='glitter'){ c.save(); c.translate(o.x,GY-40); c.rotate(t*2);
    c.fillStyle='#ff6bd6'; c.beginPath();
    for(let i=0;i<5;i++){ const a=i*PI*2/5; c.lineTo(Math.cos(a)*16,Math.sin(a)*16); c.lineTo(Math.cos(a+PI/5)*7,Math.sin(a+PI/5)*7); }
    c.closePath(); c.fill(); c.restore(); }
  else if(o.type==='riflettore'){ c.fillStyle='#2a2a30'; c.fillRect(o.x-4,GY-66,8,26);
    c.fillStyle='#3a3a44'; c.fillRect(o.x-16,GY-70,32,14);
    const on=Math.sin(t*4+o.x)>-0.2;
    c.fillStyle=on?'rgba(255,255,240,0.9)':'#555'; c.fillRect(o.x-12,GY-58,24,4);
    if(on){ c.fillStyle='rgba(255,255,240,0.08)'; c.beginPath(); c.moveTo(o.x,GY-56); c.lineTo(o.x-50,GY); c.lineTo(o.x+50,GY); c.closePath(); c.fill(); }  } else if(o.type==='cannon'){ c.save(); c.translate(o.x,GY-22); c.rotate(-0.5);
    c.fillStyle='#2a3a6a'; c.fillRect(-6,-10,34,14); c.fillStyle='#1a2440'; c.fillRect(24,-9,8,12); c.restore();
    c.fillStyle='#8a8a2a'; c.beginPath(); c.arc(o.x-6,GY-8,7,0,7); c.fill(); }
  else if(o.type==='lampadario'){ // lampadario dondolante della casa infestata
    const swing=Math.sin(t*1.4)*0.22;
    c.save();c.translate(o.x,GY-78);c.rotate(swing);
    c.strokeStyle='#8a6a3a';c.lineWidth=3;c.beginPath();c.moveTo(0,-22);c.lineTo(0,0);c.stroke();
    c.fillStyle='#c9a44a';c.beginPath();c.arc(0,8,15,PI,2*PI);c.fill();
    const fl=Math.sin(t*12+o.x)>0.3?1:0.35;
    for(let i=0;i<6;i++){const a=PI+(i/5)*PI;c.fillStyle='rgba(255,216,120,'+fl+')';c.beginPath();c.arc(Math.cos(a)*20,8+Math.sin(a)*7,3,0,PI*2);c.fill();}
    c.restore();
  }
  else if(o.type==='martelletto'){ // martelletto da giudice gigante
    const slam=Math.abs(Math.sin(t*1.1+o.x));
    c.fillStyle='#5a3620';c.fillRect(o.x-5,GY-46,10,46);
    c.save();c.translate(o.x,GY-52);c.rotate(-0.8+slam*0.8);
    c.fillStyle='#8a5a3a';c.fillRect(0,-4,34,8);c.fillStyle='#5a3620';c.fillRect(28,-11,13,22);c.restore();
    if(slam>0.82){c.strokeStyle='rgba(255,217,77,0.7)';c.lineWidth=3;c.beginPath();c.arc(o.x,GY-4,26,PI,2*PI);c.stroke();}
  }
  c.restore();
}

/* ---------- Vasi ---------- */
function drawVase(c,v,t){
  if(!v.alive)return;
  const bob=Math.sin(t*3+v.t)*2;
  c.save(); c.translate(v.x,GY+bob);
  c.fillStyle='#8a5ac8'; rr(c,-10,-26,20,26,5); c.fill();
  c.fillStyle='#b892e8'; c.fillRect(-7,-24,5,20);
  c.fillStyle='#ffd94d'; c.fillRect(-4,-32,8,7);
  if(v.secret&&!v.secret.used&&Math.sin(t*2.7+v.x)>0.82){
    c.fillStyle='#ffe36e';c.globalAlpha=0.8;c.fillRect(6,-30,2,2);c.globalAlpha=1;
  }
  c.restore();
}

/* ---------- Pozze d'olio di Sandro ---------- */
function drawOilPools(c,S){
  if(!S.oilPools)return;
  S.oilPools.forEach(op=>{
    const a=Math.min(1,op.life/1.5)*0.55;
    c.save(); c.globalAlpha=a;
    c.fillStyle='#ffb347';
    c.beginPath(); c.ellipse(op.x,GY-2,26+Math.sin(op.t*6)*3,7,0,0,7); c.fill();
    c.fillStyle='#ffd98a';
    for(let i=0;i<3;i++){ const bx=op.x-14+((op.t*40+i*17)%28);
      c.beginPath(); c.arc(bx,GY-3-Math.abs(Math.sin(op.t*5+i))*4,2,0,7); c.fill(); }
    c.restore();
  });
}

/* ---------- Proiettili ---------- */
function drawProj(c,pr){
  c.save(); c.translate(pr.x,pr.y);
  const speed=Math.hypot(pr.vx||0,pr.vy||0), angle=Math.atan2(pr.vy||0,pr.vx||1);
  c.rotate(angle*0.18);
  if(speed>180&&pr.kind!=='boulder'&&pr.kind!=='ring'){
    c.globalAlpha=0.25; c.strokeStyle=pr.col; c.lineWidth=5; c.beginPath(); c.moveTo(-Math.cos(angle)*22,-Math.sin(angle)*22); c.lineTo(0,0); c.stroke(); c.globalAlpha=1;
  }
  if(pr.kind==='duck'){
    c.fillStyle=pr.col; c.beginPath(); c.ellipse(0,0,10,7,0,0,7); c.arc(7,-5,4,0,7); c.fill();
    c.fillStyle='#f80'; c.beginPath(); c.moveTo(10,-5); c.lineTo(16,-3); c.lineTo(10,-1); c.fill();
    c.fillStyle='#111'; c.beginPath(); c.arc(7,-6,1,0,7); c.fill();
  } else if(pr.kind==='paper'||pr.kind==='bill'){
    c.rotate(pr.kind==='bill'?Math.sin(pr.t*18)*0.25:0);
    c.fillStyle=pr.kind==='bill'?'#e8eef8':'#e7e1c9'; c.fillRect(-8,-10,16,20);
    c.strokeStyle=pr.kind==='bill'?'#7ab8e8':'#a99'; c.lineWidth=1; c.beginPath();
    c.moveTo(-5,-5); c.lineTo(5,-5); c.moveTo(-5,0); c.lineTo(5,0); c.moveTo(-5,5); c.lineTo(2,5); c.stroke();
    if(pr.kind==='bill'){c.fillStyle='#c22';c.font='bold 8px Arial';c.textAlign='center';c.fillText('⚙',0,9);}
  } else if(pr.kind==='scoop'){
    c.fillStyle='#d7a56b'; c.beginPath(); c.moveTo(-3,-2); c.lineTo(4,10); c.lineTo(9,-2); c.closePath(); c.fill();
    c.fillStyle=pr.col; c.beginPath(); c.arc(1,-4,7,0,7); c.fill();
  } else if(pr.kind==='toast'){
    c.fillStyle='#ef8c42'; c.beginPath(); c.roundRect?c.roundRect(-6,-8,12,16,3):c.rect(-6,-8,12,16); c.fill();
    c.fillStyle='#ffe17c'; c.fillRect(-3,-4,6,8);
  } else if(pr.kind==='brass'){
    c.fillStyle=pr.col; c.beginPath(); c.arc(0,0,7,0,7); c.fill(); c.fillStyle='#fff0a8'; c.fillRect(-2,-2,4,4);
  } else if(pr.kind==='boulder'){
    c.fillStyle='#7bc86c'; c.beginPath(); c.arc(0,0,14,0,7); c.fill();
    c.fillStyle='#5a9a50'; c.beginPath(); c.arc(-4,-4,5,0,7); c.fill();
  } else if(pr.kind==='ring'){
    c.strokeStyle=pr.col; c.lineWidth=3; c.beginPath(); c.arc(0,0,20+pr.t*160,0,7); c.stroke();
  } else if(pr.kind==='note'){
    c.fillStyle=pr.col; c.font='bold 17px Arial'; c.fillText('♪',-5,5);
  } else if(pr.kind==='pan'){
    c.fillStyle=pr.col; c.beginPath(); c.arc(0,0,8,0,7); c.fill(); c.fillRect(-2,-12,4,12);
  } else if(pr.kind==='splash'){
    c.fillStyle=pr.col;c.beginPath();c.ellipse(0,0,9,7,0,0,PI*2);c.fill();
    c.fillStyle='rgba(255,255,255,0.55)';c.beginPath();c.arc(-2,-2,3,0,PI*2);c.fill();
    for(let i=0;i<3;i++){c.fillStyle=pr.col;c.beginPath();c.arc(-8+i*7,-9-(i%2)*3,2.2,0,PI*2);c.fill();}
  } else if(pr.kind==='bone'){
    c.fillStyle=pr.col;c.fillRect(-8,-2.6,16,5.2);
    c.beginPath();c.arc(-8,-3,3.4,0,PI*2);c.arc(-8,3,3.4,0,PI*2);c.arc(8,-3,3.4,0,PI*2);c.arc(8,3,3.4,0,PI*2);c.fill();
  } else if(pr.kind==='glass'){
    c.fillStyle=pr.col;c.beginPath();c.moveTo(-6,-9);c.lineTo(6,-9);c.lineTo(4,7);c.lineTo(-4,7);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,0.5)';c.fillRect(-3,-7,2.4,10);
    c.strokeStyle='#b8862a';c.lineWidth=1.6;c.beginPath();c.moveTo(-6,-2);c.lineTo(6,-2);c.stroke();
  } else if(pr.kind==='spark'){
    c.fillStyle=pr.col;c.beginPath();
    for(let i=0;i<8;i++){const a=i*PI/4+pr.t*6,r=i%2?4:9;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();
    c.fillStyle='#fff';c.beginPath();c.arc(0,0,2.4,0,PI*2);c.fill();
  } else {
    c.fillStyle=pr.col; c.beginPath(); c.arc(0,0,5,0,7); c.fill();
    c.fillStyle='rgba(255,255,255,0.5)'; c.beginPath(); c.arc(-1,-1,2,0,7); c.fill();
  }
  c.restore();
}

/* ---------- FX ---------- */
function drawFx(c,f){
  const k=clamp(f.t/Math.max(0.01,f.life),0,1), fade=1-k, mag=f.mag||1;
  c.save(); c.globalAlpha=fade;
  if(f.kind==='ring'||f.kind==='ult'){
    const radius=f.kind==='ult'?mag*k:mag*k+8;
    c.strokeStyle=f.col; c.lineWidth=f.kind==='ult'?6:4*fade+1; c.beginPath(); c.arc(f.x,f.y,radius,0,PI*2); c.stroke();
    if(f.kind==='ult'){c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.arc(f.x,f.y,radius*0.7,0,PI*2);c.stroke();}
  } else if(f.kind==='hit'){
    /* impatto esplosivo: stella + anello d'urto + scintille */
    const r=12*fade+4;
    c.strokeStyle=f.col||'#fff'; c.lineWidth=4*fade+1; c.beginPath(); c.arc(f.x,f.y,r*1.7,0,PI*2); c.stroke();
    c.strokeStyle='#fff'; c.lineWidth=3;
    for(let i=0;i<6;i++){const a=f.t*11+i*PI/3;c.beginPath();c.moveTo(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r);c.lineTo(f.x+Math.cos(a)*(r+11),f.y+Math.sin(a)*(r+11));c.stroke();}
    c.fillStyle='#fff'; c.beginPath();
    for(let i=0;i<8;i++){const a=i*PI/4+f.t*7,rr2=i%2?r*0.55:r*1.35;c.lineTo(f.x+Math.cos(a)*rr2,f.y+Math.sin(a)*rr2);}
    c.closePath(); c.fill();
  } else if(f.kind==='slash'||f.kind==='chain'||f.kind==='redact'||f.kind==='whistle'){
    const color=f.col||'#fff'; c.strokeStyle=color; c.lineWidth=(f.kind==='slash'?4:3)*fade+1;
    if(f.kind==='chain'){
      const link=Math.max(22,mag*0.1), endX=f.x+link, endY=f.y+Math.sin(f.t*10)*5;
      c.beginPath(); c.moveTo(f.x-link/2,f.y+5); c.lineTo(f.x-link/5,f.y-8); c.lineTo(f.x+link/8,f.y+7); c.lineTo(endX,endY-4); c.stroke();
      c.fillStyle='#fff'; c.beginPath(); c.arc(f.x-link/2,f.y+5,2,0,PI*2); c.arc(endX,endY-4,2,0,PI*2); c.fill();
    } else if(f.kind==='redact'){
      c.save(); c.translate(f.x,f.y); c.rotate(-0.15); c.strokeRect(-22,-10,44,20); c.beginPath(); c.moveTo(-18,0); c.lineTo(18,0); c.moveTo(-13,-5); c.lineTo(13,-5); c.stroke(); c.restore();
    } else if(f.kind==='whistle'){
      c.beginPath(); c.arc(f.x,f.y,24+mag*k*0.55,-0.75,0.75); c.stroke(); c.beginPath(); c.arc(f.x,f.y,24+mag*k*0.55,PI-0.75,PI+0.75); c.stroke();
      c.fillStyle='#fff1a6'; c.font='bold 18px Arial'; c.textAlign='center'; c.fillText('!',f.x,f.y-8);
    } else if(f.kind==='slash'){
      c.beginPath(); c.arc(f.x,f.y,26*mag,-0.9,0.9); c.stroke();
      c.strokeStyle='rgba(255,255,255,0.55)';c.lineWidth=1;c.beginPath();c.arc(f.x,f.y,20*mag,-0.8,0.8);c.stroke();
    }
  } else if(f.kind==='triple'){
    c.strokeStyle=f.col;c.lineWidth=4;c.beginPath();for(let i=0;i<3;i++){const y=f.y+(i-1)*12;c.moveTo(f.x-20,y-12);c.lineTo(f.x+20,y+12);}c.stroke();
  } else if(f.kind==='tide'||f.kind==='disco'||f.kind==='overdrive'){
    c.strokeStyle=f.col;c.lineWidth=5*fade+1;
    const r=24+mag*k*0.58;
    c.beginPath();c.arc(f.x,f.y,r,-0.8,0.8);c.stroke();c.beginPath();c.arc(f.x,f.y,r,PI-0.8,PI+0.8);c.stroke();
    if(f.kind==='disco'){for(let i=0;i<6;i++){const a=f.t*10+i*PI/3;c.fillStyle=i%2?'#52f2ff':'#ff6bd6';c.beginPath();c.arc(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r,3+2*fade,0,PI*2);c.fill();}}
    if(f.kind==='overdrive'){c.beginPath();c.arc(f.x,f.y,r*0.6,0,PI*2);c.stroke();}
  } else if(f.kind==='quake'||f.kind==='slam'||f.kind==='fryer'||f.kind==='button'){
    const radius=f.kind==='button'?30+mag*k*90:26+mag*k*0.56;
    c.strokeStyle=f.col;c.lineWidth=(f.kind==='button'?7:5)*fade+1;c.beginPath();c.ellipse(f.x,f.y+12,radius,10+radius*0.15,0,0,PI*2);c.stroke();
    if(f.kind==='quake'){for(let i=0;i<5;i++){const a=i*PI*2/5;c.beginPath();c.moveTo(f.x+Math.cos(a)*radius*0.5,f.y+Math.sin(a)*5);c.lineTo(f.x+Math.cos(a)*radius,f.y-18-Math.abs(Math.sin(a))*14);c.stroke();}}
    if(f.kind==='button'){c.fillStyle='#ffe27a';c.beginPath();c.arc(f.x,f.y-4,Math.max(3,18*(1-k)),0,PI*2);c.fill();}
    if(f.kind==='fryer'){for(let i=0;i<5;i++){const bx=f.x+Math.sin(f.t*9+i*2.2)*radius*0.7, by=f.y-12-Math.abs(Math.sin(f.t*7+i))*20;c.fillStyle=i%2?'#ffdd79':'#ff8c42';c.beginPath();c.arc(bx,by,3+fade*3,0,PI*2);c.fill();}}
  } else if(f.kind==='flash'){
    c.globalAlpha=0.16*fade;c.fillStyle=f.col;c.beginPath();c.arc(f.x,f.y,38+fade*34,0,PI*2);c.fill();
  } else if(f.kind==='blood'||f.kind==='splatter'){
    const radX=(f.r||2.2)*fade*(f.kind==='splatter'?1.8:1.2);
    const radY=(f.r||3.2)*fade*(f.kind==='splatter'?1.4:2.0);
    c.fillStyle=f.col;c.beginPath();
    c.ellipse(f.x,f.y,radX,radY,Math.atan2(f.vy,f.vx),0,PI*2);c.fill();
    // gocciolina secondaria per effetto splatter cartoon
    if(f.kind==='splatter'||fade>0.4){
      c.fillStyle='rgba(60,4,12,0.6)';
      c.beginPath();c.arc(f.x-f.vx*0.015,f.y-f.vy*0.015,radX*0.45,0,PI*2);c.fill();
    }
  } else if(f.kind==='bit'){
    c.fillStyle=f.col;c.fillRect(f.x-2,f.y-2,4,4);
  } else if(f.kind==='pop'){
    c.strokeStyle=f.col;c.lineWidth=3;c.beginPath();c.arc(f.x,f.y,14*k+4,0,PI*2);c.stroke();
  } else if(f.kind==='dash'){
    c.fillStyle='#fff';c.globalAlpha=0.35*fade;for(let i=0;i<3;i++)c.fillRect(f.x-i*14,f.y-20,8,40);
  } else if(f.kind==='dmg'){
    const dtxt=(f.txt!=null?f.txt:f.col!=null?f.col:''); /* difensivo: mai "undefined" a schermo */
    /* pop d'ingresso: il numero scatta grande e si rimpicciolisce salendo */
    const pop=k<0.22?1+(0.22-k)*2.2:1;
    c.save(); c.translate(f.x,f.y-k*28); c.scale(pop,pop);
    if(f.crit)c.rotate(Math.sin(f.t*22)*0.12);
    c.font='bold '+(f.crit?20:15)+'px Arial';c.textAlign='center';c.fillStyle=f.crit?'#ffd94d':'#fff';c.strokeStyle='rgba(0,0,0,0.85)';c.lineWidth=3.5;
    c.strokeText(dtxt,0,0);c.fillText(dtxt,0,0);
    c.restore();
  }
  c.restore();
}

/* ---------- Mire nemici ---------- */
function drawReticle(c,e,S){
  c.save();
  const y=e.y-e.h*e.s-10; /* sopra la testa, scala col nemico */
  const hp=clamp(e.hp/e.maxHp,0,1), boss=e.maxHp>100;
  const bw=boss?120:36;
  /* barra vita: TUTTI i nemici (verde→giallo→rosso), boss più grande */
  c.fillStyle='rgba(0,0,0,0.55)'; c.fillRect(e.x-bw/2,y,bw,boss?9:5);
  c.fillStyle=hp>0.5?'#39FF14':hp>0.25?'#ffd94d':'#ff4d4d';
  c.fillRect(e.x-bw/2+1,y+1,(bw-2)*hp,(boss?7:3));
  if(boss){ c.strokeStyle='rgba(255,80,80,0.5)'; c.lineWidth=1.5; c.strokeRect(e.x-bw/2,y,bw,9); }
  /* freccina ai piedi (mira) */
  c.strokeStyle='rgba(255,80,80,0.5)'; c.lineWidth=1.5;
  c.beginPath(); c.moveTo(e.x-6,e.y+2); c.lineTo(e.x,e.y+8); c.lineTo(e.x+6,e.y+2); c.stroke();
  /* telegrafo '!': l'attacco è imminente e il giocatore è a portata */
  const pl=S&&S.player;
  if(!e.dead&&e.atkT>0&&e.atkT<0.45&&pl&&!pl.dead&&Math.abs(pl.x-e.x)<(e.rng||40)*1.6){
    c.fillStyle='#ff4d4d'; c.font='bold 24px Arial'; c.textAlign='center';
    c.fillText('!',e.x,y-8-Math.sin(e.t*30)*2);
  }
  c.restore();
}

/* ---------- HUD ---------- */
function drawHUD(c,S,cw,ch){
  /* HUD in spazio SCHERMO (non mondo): fermo ai bordi, dimensioni leggibili
     su qualsiasi aspect ratio, indipendente dalla camera. */
  c.save();
  const k=Math.max(0.8,Math.min(1.35,ch/720)); /* scala HUD: media su schermi bassi, mai minuscola */
  c.scale(k,k);
  const VW=cw/k, VH=ch/k; /* viewport HUD in unità logiche */
  const p=S.player;
  /* vita giocatore */
  if(p){
    const hp=p.hp/p.maxHp;
    c.fillStyle='rgba(0,0,0,0.55)'; rr(c,14,14,250,56,10); c.fill();
    c.fillStyle='#1a1a1a'; rr(c,76,24,176,18,6); c.fill();
    c.fillStyle=hp>0.5?'#39FF14':hp>0.25?'#ffd94d':'#ff4d4d';
    rr(c,77,25,174*hp,16,5); c.fill();
    c.fillStyle='#E8FF00'; c.font='bold 13px Arial'; c.textAlign='left';
    c.fillText(DATA.Chars[p.charId].short,24,38);
    c.fillStyle='#888'; c.font='10px Arial';
    c.fillText(L('skills')+' '+Math.ceil(p.abCd)+'s',24,56);
    /* abilità */
    const ready=p.abCd<=0;
    c.fillStyle=ready?'#39FF14':'#444'; c.beginPath(); c.arc(200,52,10,0,7); c.fill();
    /* carica caos */
    c.fillStyle='#333'; rr(c,76,46,176,10,5); c.fill();
    c.fillStyle=p.chaosCharge>=100?'#ff4dd2':'#ff8c42';
    rr(c,77,47,174*(p.chaosCharge/100),8,4); c.fill();
    /* Risparmio Energetico attivo (Paolo) */
    if(S.slowAllMax>0&&S.slowAll>0){
      c.fillStyle='#333'; rr(c,76,60,176,8,4); c.fill();
      c.fillStyle='#39d98a'; rr(c,77,61,174*(S.slowAll/S.slowAllMax),6,3); c.fill();
      c.fillStyle='#39d98a'; c.font='bold 9px Arial'; c.textAlign='left';
      c.fillText('RISPARMIO',256,67);
    }
    /* Tutorial abilità al primo utilizzo del personaggio */
    if(S.tutorialT>0&&p){
      const C=DATA.Chars[p.charId];
      c.save(); c.globalAlpha=Math.min(1,S.tutorialT);
      c.fillStyle='rgba(10,8,18,0.92)'; rr(c,14,84,300,58,10); c.fill();
      c.strokeStyle=C.theme; c.lineWidth=2; rr(c,14,84,300,58,10); c.stroke();
      c.fillStyle=C.theme; c.font='bold 12px Arial'; c.textAlign='left';
      c.fillText(C.ability.name+' [K/X] • '+C.ult.name+' [L/C]',24,104,284);
      c.fillStyle='#ccc'; c.font='10px Arial';
      c.fillText(C.tips||'',24,122,284);
      c.fillStyle='#666'; c.font='9px Arial';
      c.fillText('J/Z attacco • Q/R camera • gamepad supportato',24,138,284);
      c.restore();
    }
  }
  /* Controlli rapidi e ricarica della mossa finale, sempre ancorati allo schermo. */
  if(p&&p.chaosCharge>=100){c.fillStyle='#ff4dd2';c.font='bold 12px Arial';c.textAlign='right';c.fillText('FINISHER PRONTO [L/C]',VW-22,128);}
  /* avversario/alleato nel duello (ancorato al bordo destro reale) */
  if(S.mode==='duel'&&S.ally){
    const a=S.ally, hp=a.hp/a.maxHp;
    c.fillStyle='rgba(0,0,0,0.55)'; rr(c,VW-264,14,250,56,10); c.fill();
    c.fillStyle='#1a1a1a'; rr(c,VW-252,24,176,18,6); c.fill();
    c.fillStyle=hp>0.5?'#39FF14':'#ff4d4d'; rr(c,VW-251,25,174*hp,16,5); c.fill();
    c.fillStyle='#E8FF00'; c.font='bold 13px Arial'; c.textAlign='right';
    c.fillText(S.duelVsBoss?(DATA.BossNames[S.duelVsBoss]||'BOSS'):(DATA.Chars[a.charId]||{short:'???'}).short,VW-24,38);
  }
  /* punteggio (centro reale) */
  c.fillStyle='#fff'; c.font='bold 26px Arial'; c.textAlign='center';
  const bounce=Math.max(0,S.comboT/2.2);
  c.save(); c.translate(VW/2,44); c.scale(1+bounce*0.15,1+bounce*0.15);
  if(S.combo>1){ c.fillStyle='#ff4dd2'; c.fillText('COMBO x'+S.combo,0,0); }
  else if(S.mode==='marathon'){ c.fillStyle='#FF2FB0'; c.fillText('🏃 PROVA '+(S.marathonIdx+1)+'/3'+(S.boss?(' — '+DATA.BossNames[S.boss.type]):''),0,0); }
  else { c.fillStyle='#888'; c.font='bold 14px Arial'; c.fillText(S.mode==='chaos'?('ONDATA '+S.wave):('ONDATA '+S.wave+'/'+S.wavesTotal),0,0); }
  c.restore();
  /* monete */
  c.fillStyle='#ffd94d'; c.font='bold 16px Arial'; c.textAlign='right';
  c.fillText('⛁ '+S.coinsEarned,VW-20,96);
  if(S.tempWeaponT>0&&S.player){
    const weapon=DATA.Weapons[S.player.colors.weapon];
    c.fillStyle='#ffd94d';c.font='bold 11px Arial';c.textAlign='right';
    c.fillText('ARMA BONUS: '+(weapon?weapon.name:'')+' · '+Math.ceil(S.tempWeaponT)+'s',VW-20,114);
  }
  /* barra boss grande (in basso, centrata) */
  if(S.boss&&!S.boss.dead){
    const bw=Math.min(420,VW-60), hp=S.boss.hp/S.boss.maxHp;
    c.fillStyle='rgba(0,0,0,0.6)'; rr(c,VW/2-bw/2,VH-40,bw,22,8); c.fill();
    c.fillStyle='#2a1010'; rr(c,VW/2-bw/2+3,VH-37,bw-6,16,6); c.fill();
    c.fillStyle=S.boss.phase>=2?'#ff4d4d':S.boss.phase===1?'#ff8c42':'#ffd94d';
    rr(c,VW/2-bw/2+3,VH-37,(bw-6)*hp,16,6); c.fill();
    c.fillStyle='#fff'; c.font='bold 12px Arial'; c.textAlign='center';
    c.fillText(DATA.BossNames[S.boss.type]||'',VW/2,VH-25);
  }
  /* messaggio fase */
  if(S.phaseT>0){ c.fillStyle='rgba(255,60,60,'+Math.min(1,S.phaseT)+')';
    c.font='bold 44px Arial'; c.textAlign='center';
    c.fillText(S.phaseMsg||'',VW/2,VH*0.3); }
  /* dialogo (avanza col tempo o al tocco) */
  if(S.dialog&&S.dialogT<S.dialog.length*2.6){
    S.dialogT+=1/60;
    const idx=Math.min(S.dialog.length-1,Math.floor(S.dialogT/2.6));
    const line=S.dialog[idx];
    const boxH=76, boxY=VH-boxH-104;
    c.fillStyle='rgba(10,8,18,0.88)'; rr(c,40,boxY,VW-80,boxH,12); c.fill();
    c.strokeStyle='#E8FF00'; c.lineWidth=2; rr(c,40,boxY,VW-80,boxH,12); c.stroke();
    c.fillStyle='#fff'; c.font='13px Arial'; c.textAlign='left';
    c.fillText(line,56,boxY+30,VW-110);
    c.fillStyle='#E8FF00'; c.font='bold 10px Arial'; c.textAlign='right';
    c.fillText((idx+1)+'/'+S.dialog.length+' — TOCCA PER CONTINUARE ▼',VW-56,boxY+62);
    /* skip al tocco: gestito da input */
  } else if(S.dialog) S.dialog=null;
  if(S.use3D&&(S.explorationPOIs||[]).length&&!S.over){
    const total=(S.explorationPOIs||[]).length, done=(S.explorationPOIs||[]).filter(function(poi){return poi.used;}).length;
    const progressText=L('explorationProgress')+' '+done+'/'+total+(S.explorationComplete?' ★':'');
    c.save(); c.fillStyle='rgba(8,12,15,0.76)'; rr(c,VW-142,104,128,24,8); c.fill();
    c.strokeStyle='#5c8178'; c.lineWidth=1; rr(c,VW-142,104,128,24,8); c.stroke();
    c.fillStyle=S.explorationComplete?'#ffd94d':'#b8d9d0'; c.font='bold 10px Arial'; c.textAlign='center'; c.textBaseline='middle';
    c.fillText(progressText,VW-78,116); c.restore();
  }
  if(S.use3D&&(S.nearbyPoi||(S.interactHintT>0&&S.lastPoiName))){
    const found=!S.nearbyPoi;
    const label=found?(L('discoveryPrompt')+' — '+S.lastPoiName):(L('interactPrompt')+' — '+S.nearbyPoi.name);
    const boxW=Math.min(VW-32,Math.max(300,Math.min(560,label.length*8+42))), boxH=42, boxX=(VW-boxW)/2, boxY=VH-82;
    c.save(); c.globalAlpha=found?Math.min(1,S.interactHintT):1;
    c.fillStyle='rgba(8,12,15,0.9)'; rr(c,boxX,boxY,boxW,boxH,10); c.fill();
    c.strokeStyle=found?'#39FF14':'#E8FF00'; c.lineWidth=2; rr(c,boxX,boxY,boxW,boxH,10); c.stroke();
    c.fillStyle=found?'#39FF14':'#E8FF00'; c.font='bold 13px Arial'; c.textAlign='center'; c.textBaseline='middle';
    c.fillText(label,VW/2,boxY+boxH/2,boxW-24); c.restore();
  }
  c.restore();
}

/* ---------- Scena completa ---------- */
function draw(c,S,cw,ch,dt){
  const t=S.t;
  const L=DATA.Levels[S.levelIdx];
  /* Three.js owns the world pass; Canvas2D remains the transparent HUD/UI layer. */
  if(window.THREE3D&&window.THREE3D.shouldRender&&window.THREE3D.shouldRender(S)){
    drawHUD(c,S,cw,ch);
    if(S.flash>0){ c.fillStyle='rgba(255,255,255,'+S.flash+')'; c.fillRect(0,0,cw,ch); }
    if(S.slowmo>0){ c.fillStyle='rgba(20,0,40,'+(0.25*Math.min(1,S.slowmo))+')'; c.fillRect(0,0,cw,ch); }
    if(S.hurtFlash>0){ c.fillStyle='rgba(190,12,34,'+(0.34*S.hurtFlash)+')'; c.fillRect(0,0,cw,ch); S.hurtFlash=Math.max(0,S.hurtFlash-(dt||0.016)*1.7); }
    return;
  }
  c.save();
  /* ---------- CAMERA v2: zoom dinamico + seguimento, schermo pieno ----------
     Scala base = COVER (riempie lo schermo, niente bande nere); la camera
     segue il giocatore sull'asse X del mondo. HUD disegnato dopo, in spazio
     schermo, così resta fermo e leggibile. */
  const baseK=Math.max(cw/W,ch/H);            /* cover invece di contain */
  const frameBounds=S.cameraFrame=(()=>{
    const top=Math.max(92,Math.min(160,H*0.2)),bottom=Math.max(48,Math.min(96,H*0.13));
    const usableH=Math.max(240,H-top-bottom),fit=Math.min(1.16,usableH/520);
    return {top:top,bottom:bottom,fit:fit};
  })();
  /* Scala basata sulla safe-area HUD, non sul rapporto schermo: camera ferma
     e più leggibile su telefoni stretti, tablet e desktop. */
  let zoom=frameBounds.fit*(1+(S.zoomKick>0?0.035*Math.min(1,S.zoomKick):0));
  /* zoom-out combattivo: più nemici in scena, più la camera si allarga */
  zoom*=1-Math.min(0.09,Math.max(0,S.enemies.length-3)*0.013);
  let k=baseK*zoom;
  let viewW=cw/k, viewH=ch/k;                 /* dimensioni vista in unità mondo */
  if(viewW>W){ k=cw/W; viewW=W; viewH=ch/k; } /* mai oltre i bordi del mondo */
  const p=S.player;
  const activeLevel=S.environmentIdx==null?S.levelIdx:S.environmentIdx;
  /* Camera a dead-zone: lascia correre l'azione, poi recupera il player senza scatti.
     Lo stick Q/R inclina il framing, senza mai poterlo trascinare fuori dall'arena. */
  const camNow=S.camX===undefined?(p?p.x:W/2):S.camX;
  const deadZone=Math.min(76,viewW*0.13), drift=p?clamp((p.vx||0)*10,-135,135):0;
  let targetX=camNow;
  if(p&&viewW<W&&Math.abs(p.x-camNow)>deadZone)targetX=p.x-Math.sign(p.x-camNow)*deadZone;
  else if(viewW>=W)targetX=W/2;
  targetX+=drift+(S.cameraAimX||0)*0.5;
  /* guardia all'azione: la camera anticipa leggermente il bersaglio più vicino */
  if(p){
    let near=null,nd=430;
    S.enemies.forEach(e=>{ if(e.dead)return; const d=Math.abs(e.x-p.x); if(d<nd){nd=d;near=e;} });
    if(S.boss&&!S.boss.dead&&Math.abs(S.boss.x-p.x)<nd)near=S.boss;
    if(near)targetX+=(near.x-targetX)*0.14;
  }
  targetX=clamp(targetX,Math.min(viewW/2,W/2),Math.max(W-viewW/2,W/2));
  S.camX=camNow+(targetX-camNow)*(1-Math.exp(-4.8*(dt||1/60)));
  /* Pan verticale controllabile, con pavimento/attore sempre nel frame. */
  const verticalLook=clamp(-(S.cameraAimY||0)*0.22,-34,34);
  const minTop=clamp(GY-viewH+frameBounds.bottom/k,0,Math.max(0,H-viewH));
  const maxTop=clamp(GY-frameBounds.top/k,0,Math.max(0,H-viewH));
  const centeredTop=clamp((H-viewH)/2+verticalLook,0,Math.max(0,H-viewH));
  const topWorld=minTop<=maxTop?clamp(centeredTop,minTop,maxTop):clamp(centeredTop,0,Math.max(0,H-viewH));
  const ox=-(S.camX-viewW/2)*k, oy=-topWorld*k;
  c.translate(ox,oy); c.scale(k,k);
  /* shake */
  if(S.screenShake>0){ c.translate(ENGINE.rnd(-S.screenShake,S.screenShake),ENGINE.rnd(-S.screenShake,S.screenShake)); }
  R.drawBG(c,Math.max(W,viewW),H,activeLevel+1,t);
  R.drawGround(c,Math.max(W,viewW),H,t,activeLevel+1);
  /* macchie permanenti: sangue, cocci e segni della battaglia sul pavimento */
  (S.decals||[]).forEach(dc=>{
    c.save();c.globalAlpha=0.5;c.fillStyle=dc.col;
    c.beginPath();c.ellipse(dc.x,dc.y,16*dc.size,5.2*dc.size,0,0,PI*2);c.fill();
    c.globalAlpha=0.32;c.beginPath();c.ellipse(dc.x+9*dc.size,dc.y-3*dc.size,7*dc.size,3*dc.size,0.4,0,PI*2);c.fill();
    c.restore();
  });
  S.obstacles.forEach(o=>drawObstacle(c,o,t));
  S.vases.forEach(v=>drawVase(c,v,t));
  (S.secrets||[]).forEach(function(secret){if(secret.used)return;
    secret.t=(secret.t||0)+dt;
    const pulse=0.5+0.5*Math.sin((S.t||0)*4+secret.index);
    const color=['#ff4d6d','#52f2ff','#ffe36e','#ff6bd6'][secret.index];
    c.save();c.globalAlpha=0.58+pulse*0.35;
    c.strokeStyle=color;c.fillStyle='rgba(10,8,18,0.88)';c.lineWidth=2.5;
    c.beginPath();c.arc(secret.x,GY-34,13+pulse*3,0,PI*2);c.fill();c.stroke();
    c.fillStyle=color;c.font='bold 15px Arial';c.textAlign='center';c.fillText(secret.hint||'?',secret.x,GY-29);
    c.fillStyle='rgba(0,0,0,0.65)';c.fillRect(secret.x-17,GY-4,34,3);
    c.fillStyle=color;c.fillRect(secret.x-17,GY-4,34,3);c.restore();
  });
  drawOilPools(c,S);
  /* pickups */
  S.pickups.forEach(pk=>{
    if(pk.type==='coin'){ c.fillStyle='#ffd94d'; c.beginPath(); c.arc(pk.x,pk.y-8,7,0,7); c.fill();
      c.fillStyle='#b89200'; c.fillText('⛁',pk.x-4,pk.y-4); }
    else if(pk.type==='heart'){ c.fillStyle='#ff4d6d'; c.font='16px Arial'; c.fillText('♥',pk.x-6,pk.y-2); }
    else { c.fillStyle='#39FF14'; c.fillRect(pk.x-7,pk.y-14,14,14); c.fillStyle='#0a3a0a'; c.fillText('⚡',pk.x-5,pk.y-3); }
  });
  /* attori (ordinati per y) */
  const actors=[];
  S.enemies.forEach(e=>{ if(!e.dead)actors.push({y:e.y,a:e}); });
  if(S.boss&&!S.boss.dead)actors.push({y:S.boss.y,a:S.boss});
  if(S.player&&!S.player.dead)actors.push({y:S.player.y,a:S.player});
  if(S.ally&&!S.ally.dead)actors.push({y:S.ally.y,a:S.ally});
  actors.sort((A,B)=>A.y-B.y);
  actors.forEach(o=>{
    const a=o.a;
    if(a.kind==='player'){
      c.save();
      if(a.hitFlash>0){ c.filter='brightness(2.5)'; }
      if(a.invT>0&&Math.floor(a.t*20)%2===0) c.globalAlpha=0.5;
      if(a.leadT>0){ c.save(); c.filter='grayscale(1) brightness(0.7)'; }
      drawPlayerFull(c,a,t);
      if(a.leadT>0) c.restore();
      c.restore();
    } else {
      R.drawActor(c,{x:a.x,y:a.y,s:a.s,h:a.h,dir:a.dir,t:a.t,walk:a.walk,vx:a.vx,
        draw:a.kind==='boss'?'boss':'en', id:a.type||a.charId, phase:a.phase, using:a.using,attackPose:a.attackPose,attackPoseT:a.attackPoseT,attackPoseMax:a.attackPoseMax,hp:a.hp,maxHp:a.maxHp});
      if(a.hitFlash>0){ c.globalAlpha=0.4; c.fillStyle='#fff';
        c.fillRect(a.x-14*a.s,a.y-56*a.s,28*a.s,56*a.s); c.globalAlpha=1; }
    }
  });
  /* proiettili + fx sopra */
  S.projs.forEach(pr=>drawProj(c,pr));
  S.fx.forEach(f=>drawFx(c,f));
  /* aura ultimate */
  if(S.player&&S.player.ultActive>0){ c.strokeStyle='#fff'; c.globalAlpha=0.5;
    c.beginPath(); c.arc(S.player.x,S.player.y-30,60,0,7); c.stroke(); c.globalAlpha=1; }
  /* mire solo su nemici */
  S.enemies.forEach(e=>{ if(!e.dead)drawReticle(c,e,S); });
  if(S.boss&&!S.boss.dead)drawReticle(c,S.boss,S);
  c.restore();
  /* vignetta: bordi scuri per profondità (skip su qualità bassa) */
  if(SAVE.data.settings.quality!=='low'){
    const vg=c.createRadialGradient(cw/2,ch*0.55,Math.min(cw,ch)*0.45,cw/2,ch*0.55,Math.max(cw,ch)*0.75);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.42)');
    c.fillStyle=vg; c.fillRect(0,0,cw,ch);
  }
  /* HUD fuori dalla scala? no, dentro: */
  drawHUD(c,S,cw,ch);
  /* flash ultimate */
  if(S.flash>0){ c.fillStyle='rgba(255,255,255,'+(S.flash)+')'; c.fillRect(0,0,cw,ch); }
  /* flash danno: vignetta rossa che segna i colpi subiti */
  if(S.hurtFlash>0){ c.fillStyle='rgba(190,12,34,'+(0.34*S.hurtFlash)+')'; c.fillRect(0,0,cw,ch); S.hurtFlash=Math.max(0,S.hurtFlash-(dt||0.016)*1.7); }
  /* slow-mo vignette */
  if(S.slowmo>0){ c.fillStyle='rgba(20,0,40,'+(0.25*Math.min(1,S.slowmo))+')'; c.fillRect(0,0,cw,ch); }
  /* FINISHER CINEMATOGRAFICA CARTOON OVERLAY */
  if(S.finisherT>0){
    const kf=Math.max(0,Math.min(1,S.finisherT/(S.finisherMax||2.2)));
    // Bande nere cinematografiche
    c.fillStyle='#000';
    c.fillRect(0,0,cw,ch*0.14);
    c.fillRect(0,ch-ch*0.14,cw,ch*0.14);
    // Scritta comic book pop
    c.save();
    c.translate(cw/2,ch*0.28);
    const scalePop=1+Math.sin((1-kf)*Math.PI)*0.25;
    c.scale(scalePop,scalePop);
    c.rotate(-0.06);
    c.font='900 52px Impact, sans-serif';
    c.textAlign='center';
    c.strokeStyle='#000';
    c.lineWidth=10;
    c.strokeText('ULTIMATE FINISHER!',0,0);
    c.fillStyle='#ff2a44';
    c.fillText('ULTIMATE FINISHER!',0,0);
    c.font='bold 22px Arial, sans-serif';
    c.strokeStyle='#000';
    c.lineWidth=6;
    c.strokeText('★ K.O. DEVAS-TANTE ★',0,36);
    c.fillStyle='#ffd700';
    c.fillText('★ K.O. DEVAS-TANTE ★',0,36);
    c.restore();
  }
}

/* ---------- Giocatore completo (con outfit/arma/cappello) ---------- */
function drawPlayerFull(c,a,t){
  const p={x:a.x,y:a.y,s:a.s,h:a.h,dir:a.dir,t:a.t,walk:a.walk,vx:a.vx||0,using:a.using,attackPose:a.attackPose,attackPoseT:a.attackPoseT,attackPoseMax:a.attackPoseMax};
  /* Alone personale e segno rotante: ogni svitato resta riconoscibile nel caos. */
  const hero=DATA.Chars[a.charId]||{theme:'#ffe678'},halo=hero.theme||'#ffe678';
  if(SAVE.data.settings.quality!=='low'){
    const gl=c.createRadialGradient(a.x,a.y-26*a.s,4,a.x,a.y-26*a.s,52*a.s);
    gl.addColorStop(0,'rgba(255,230,120,0.25)'); gl.addColorStop(0.38,halo+'33'); gl.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=gl;c.beginPath();c.arc(a.x,a.y-26*a.s,52*a.s,0,7);c.fill();
    c.save();c.globalAlpha=0.48+0.18*Math.sin(t*4);c.strokeStyle=halo;c.lineWidth=1.5*a.s;
    c.setLineDash([5*a.s,4*a.s]);c.beginPath();c.ellipse(a.x,a.y-18*a.s,21*a.s,7*a.s,t*0.3,0,PI*2);c.stroke();c.setLineDash([]);
    for(let shard=0;shard<3;shard++){const ang=t*1.7+shard*PI*2/3,x=a.x+Math.cos(ang)*22*a.s,y=a.y-18*a.s+Math.sin(ang)*7*a.s;
      c.fillStyle=halo;c.beginPath();c.moveTo(x,y-2.5*a.s);c.lineTo(x+2.5*a.s,y);c.lineTo(x,y+2.5*a.s);c.lineTo(x-2.5*a.s,y);c.closePath();c.fill();}
    c.restore();
  }
  /* ombra */
  c.fillStyle='rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(a.x,a.y+2,14*a.s,4*a.s,0,0,7); c.fill();
  /* freccia indicatore sopra la testa */
  const ab=Math.sin(t*4)*3;
  c.fillStyle='#E8FF00'; c.beginPath();
  c.moveTo(a.x,a.y-74*a.s-ab); c.lineTo(a.x-7,a.y-86*a.s-ab); c.lineTo(a.x+7,a.y-86*a.s-ab);
  c.closePath(); c.fill();
  /* attacco: arco arma */
  if(a.using){
    const weapon=DATA.Weapons[a.colors&&a.colors.weapon]||DATA.Weapons.mattarello;
    const pose=a.attackPose||weapon.fx, strong=weapon.dmg>=16||pose==='button'||pose==='slam';
    c.strokeStyle=pose==='note'||pose==='wave'||pose==='brass'?'rgba(255,217,77,0.86)':'rgba(255,255,255,0.9)'; c.lineWidth=strong?5:3;
    c.beginPath(); c.arc(a.x+a.dir*8*a.s,a.y-30*a.s,weapon.kind==='melee'?34*a.s:25*a.s,a.dir>0?-1.05:PI-0.7,a.dir>0?0.75:PI+0.3,a.dir<0); c.stroke();
    if(pose==='triple'||pose==='toast'){c.globalAlpha=0.55;c.beginPath();c.arc(a.x+a.dir*13*a.s,a.y-30*a.s,42*a.s,a.dir>0?-0.65:PI-0.3,a.dir>0?0.3:PI+0.65,a.dir<0);c.stroke();}
  }
  R.drawActor(c,{x:a.x,y:a.y,s:a.s,h:a.h,dir:a.dir,t:a.t,walk:a.walk,vx:a.vx,draw:'chars',id:a.charId,using:a.using,attackPose:a.attackPose,attackPoseT:a.attackPoseT,attackPoseMax:a.attackPoseMax,hp:a.hp,maxHp:a.maxHp});
  drawWeapon(c,a);
  drawHat(c,a);
  /* aura forma piombo */
  if(a.leadT>0){ c.strokeStyle='#aaa'; c.lineWidth=2; c.strokeRect(a.x-12*a.s,a.y-56*a.s,24*a.s,56*a.s); }
}

/* ---------- Arma disegnata ---------- */
function drawWeapon(c,a){
  const wid=a.colors&&a.colors.weapon;
  const x=a.x+a.dir*12*a.s, y=a.y-24*a.s;
  c.save(); c.translate(x,y); c.scale(a.dir,1);
  const poseT=a.attackPoseT||0, poseMax=a.attackPoseMax||0.28;
  const swing=a.using&&poseT>0?Math.sin(clamp(1-poseT/poseMax,0,1)*PI):0;
  const pose=a.attackPose||'';
  c.rotate(a.using?(pose==='paper'||pose==='bill'||pose==='note'?0.18*swing:-0.95*swing):Math.sin(a.walk||0)*0.06);
  if(a.using)c.translate(0,-2*swing);
  switch(wid){
    case 'mattarello': c.fillStyle='#b8925a'; c.fillRect(-2,-2,20,4); c.fillStyle='#8a6a3a'; c.fillRect(-5,-3,5,6); c.fillRect(15,-3,5,6); break;
    case 'cucchiaio': c.strokeStyle='#e8e8f0'; c.lineWidth=2.5; c.beginPath(); c.moveTo(0,0); c.lineTo(14,0); c.stroke();
      c.fillStyle='#e8e8f0'; c.beginPath(); c.ellipse(17,0,4,5,0,0,7); c.fill(); break;
    case 'ombrello': c.strokeStyle='#444'; c.lineWidth=2; c.beginPath(); c.moveTo(0,2); c.lineTo(16,-6); c.stroke();
      c.fillStyle='#d33'; c.beginPath(); c.arc(16,-8,6,PI,2*PI); c.fill(); break;
    case 'estintore': c.fillStyle='#c22'; c.fillRect(-2,-4,18,8); c.fillStyle='#333'; c.fillRect(14,-6,4,4); break;
    case 'spranga': c.fillStyle='#7a5a3a'; c.fillRect(-2,-2,24,4); break;
    case 'padella': c.fillStyle='#333'; c.beginPath(); c.arc(8,0,7,0,7); c.fill(); c.fillRect(13,-1.5,9,3); break;
    case 'trombetta': c.fillStyle='#ffd94d'; c.beginPath(); c.moveTo(0,-2); c.lineTo(12,-7); c.lineTo(12,7); c.closePath(); c.fill(); break;
    case 'peluche': c.fillStyle='#c88a5a'; c.beginPath(); c.arc(8,0,8,0,7); c.fill();
      c.fillStyle='#8a5a3a'; c.beginPath(); c.arc(3,-7,3,0,7); c.arc(13,-7,3,0,7); c.fill(); break;
    case 'megafono': c.fillStyle='#ff8c42'; c.beginPath(); c.moveTo(0,-3); c.lineTo(14,-9); c.lineTo(14,9); c.closePath(); c.fill(); break;
    case 'ciabatta': c.fillStyle='#b97842'; c.beginPath(); c.ellipse(10,0,13,6,0,0,7); c.fill(); c.fillStyle='#f2d6a6'; c.fillRect(1,-1,15,2); break;
    case 'aspirafogli': c.fillStyle='#566474'; rr(c,0,-7,16,14,4); c.fill(); c.fillStyle='#8ff'; c.beginPath(); c.arc(8,0,3,0,7); c.fill(); c.fillStyle='#ddd'; c.fillRect(14,-2,8,4); break;
    case 'gelato': c.fillStyle='#d7a56b'; c.beginPath(); c.moveTo(2,0); c.lineTo(15,-5); c.lineTo(15,5); c.closePath(); c.fill(); c.fillStyle='#ff7ca8'; c.beginPath(); c.arc(16,0,5,0,7); c.fill(); break;
    case 'anatra': c.fillStyle='#ffe36e'; c.beginPath(); c.ellipse(9,0,9,6,0,0,7); c.fill(); c.beginPath(); c.arc(16,-3,4,0,7); c.fill(); c.fillStyle='#f80'; c.beginPath(); c.moveTo(19,-3); c.lineTo(25,-1); c.lineTo(19,0); c.fill(); c.fillStyle='#111'; c.beginPath(); c.arc(16,-4,1,0,7); c.fill(); break;
    case 'tostapane': c.fillStyle='#9da8b4'; rr(c,0,-7,14,14,3); c.fill(); c.fillStyle='#333'; c.fillRect(4,-8,2,4); c.fillRect(9,-8,2,4); c.fillStyle='#f4ad48'; c.fillRect(16,-5,7,10); break;
    case 'trombone': c.strokeStyle='#d7a72d'; c.lineWidth=3; c.beginPath(); c.moveTo(1,3); c.lineTo(16,3); c.lineTo(16,-5); c.lineTo(7,-5); c.lineTo(7,-1); c.stroke(); c.fillStyle='#ffe36e'; c.beginPath(); c.arc(18,-5,4,0,7); c.fill(); break;
    case 'randello': c.fillStyle='#7a5a3a';c.beginPath();c.roundRect?c.roundRect(-2,-3.4,24,6.8,3):c.rect(-2,-3.4,24,6.8);c.fill();c.fillStyle='#5a3c22';c.fillRect(12,-4.6,7,9.2); break;
    case 'martello': c.fillStyle='#6b4426';c.fillRect(-2,-2,16,4);c.fillStyle='#3a3a44';c.fillRect(12,-6,10,12);c.fillStyle='#ffd94d';c.fillRect(14,-1.6,6,3.2); break;
    case 'secchio': c.fillStyle='#5a8ac8';c.beginPath();c.moveTo(0,-7);c.lineTo(16,-5);c.lineTo(13,7);c.lineTo(3,7);c.closePath();c.fill();c.strokeStyle='#3a5a88';c.lineWidth=1.6;c.beginPath();c.arc(8,-7,7,PI,2*PI);c.stroke(); break;
    case 'teschio': c.fillStyle='#e8e4d0';c.beginPath();c.arc(9,0,7,0,PI*2);c.fill();c.fillRect(5,4,8,4);c.fillStyle='#111';c.beginPath();c.arc(6.5,-1.5,1.7,0,PI*2);c.arc(11.5,-1.5,1.7,0,PI*2);c.fill(); break;
    case 'birra': c.fillStyle='#c8862a';c.fillRect(2,-7,11,14);c.fillStyle='#f0d080';c.fillRect(2,-9,11,4);c.strokeStyle='#8a5a1a';c.lineWidth=1.6;c.beginPath();c.arc(14,0,4,-PI/2,PI/2);c.stroke(); break;
    case 'fuoco': c.fillStyle='#8a8a92';c.fillRect(0,-1.6,16,3.2);c.fillStyle='#ff8c42';c.beginPath();c.arc(17,0,4.2,0,PI*2);c.fill();c.fillStyle='#ffe36e';c.beginPath();c.arc(17,0,2,0,PI*2);c.fill(); break;
    case 'machete': c.fillStyle='#718093';c.beginPath();c.moveTo(0,-2);c.lineTo(24,-5);c.lineTo(26,2);c.lineTo(0,2);c.closePath();c.fill();c.fillStyle='#2f3640';c.fillRect(-4,-3,6,6); break;
    case 'sigarette': c.fillStyle='#ffffff';c.fillRect(2,-2,16,4);c.fillStyle='#f39c12';c.fillRect(-2,-2,4,4);c.fillStyle='#e74c3c';c.beginPath();c.arc(18,0,2.5,0,PI*2);c.fill(); break;
    case 'mitra': c.fillStyle='#2c3e50';c.fillRect(0,-4,22,6);c.fillRect(6,2,4,8);c.fillStyle='#e74c3c';c.fillRect(18,-5,4,2); break;
    default: c.fillStyle='#b8925a'; c.fillRect(-2,-2,20,4);
  }
  c.restore();
}

/* ---------- Cappello disegnato ---------- */
function drawHat(c,a){
  const hid=a.colors&&a.colors.hat;
  if(!hid||hid==='nessuno')return;
  const x=a.x, y=a.y-58*a.s;
  c.save(); c.translate(x,y);
  switch(hid){
    case 'casco': c.fillStyle='#ff8c42'; c.beginPath(); c.arc(0,0,8,PI,2*PI); c.fill(); c.fillRect(-9,-1,18,2); break;
    case 'cappaglia': c.fillStyle='#e8c96b'; c.beginPath(); c.ellipse(0,0,14,4,0,0,7); c.fill(); c.fillRect(-6,-6,12,6); break;
    case 'cilindro': c.fillStyle='#222'; c.fillRect(-5,-14,10,14); c.fillRect(-9,-2,18,3); break;
    case 'elmetto': c.fillStyle='#ffd94d'; c.beginPath(); c.arc(0,0,8,PI,2*PI); c.fill(); c.fillRect(-2,-12,4,5); break;
    case 'pallone': c.strokeStyle='#f33'; c.beginPath(); c.moveTo(0,0); c.lineTo(3,-8); c.stroke();
      c.fillStyle='#f33'; c.beginPath(); c.arc(4,-14,6,0,7); c.fill(); break;
    case 'corna': c.fillStyle='#E8FF00'; c.fillRect(-9,-3,18,3);
      c.fillStyle='#f44'; c.beginPath(); c.moveTo(-8,-3); c.lineTo(-11,-9); c.lineTo(-5,-4); c.fill();
      c.beginPath(); c.moveTo(8,-3); c.lineTo(11,-9); c.lineTo(5,-4); c.fill(); break;
    case 'aureola': c.strokeStyle='#ffd94d'; c.lineWidth=2.5; c.beginPath(); c.ellipse(2,-8,7,3,0.2,0,7); c.stroke(); break;
  }
  c.restore();
}

/* ---------- Outfit: tinta corpo per look ---------- */
function outfitTint(c,a){
  /* Le tinte forti si vedono nel torso: ritocca colore principale */
  const o=a.colors&&a.colors.outfit;
  return o==='fenicottero'?'#ff8ac2':o==='mascotte'?'#8a5ac8':o==='aerobica'?'#39FF14':null;
}

return { draw, drawHUD, drawPlayerFull, drawWeapon, drawHat };
})();
