/* ===== UNHINGED WARFARE — Rendering procedurale (personaggi, nemici, boss, fondali) ===== */
window.R=(function(){
const R=Math.random, PI=Math.PI;

/* ---------- Palette colori principale per skin ---------- */
const MAIN=['#4db8ff','#ff6bd6','#8a8f98','#ffd94d','#7bc86c','#ff8c42','#ff4d6d'];
function mainColor(i){return MAIN[(i||0)%MAIN.length];}

/* ---------- Personaggi giocabili ---------- */
/* h=altezza, cada uno disegnato con primitive canvas, stile cartoon */
const CH={
 zappo(c,p){ // FIGLIO DEL DIAVOLO: corna rosse affilate, coda a freccia, occhi infuocati, fiamme e scintille
  body(c,p,'#b01c1c','#5a0e0e');
  // corna diaboliche rosse curve
  c.fillStyle='#ff2a2a'; c.strokeStyle='#2a0000'; c.lineWidth=1.2*p.s;
  for(let side of [-1,1]){
    c.beginPath();
    c.moveTo(p.x+side*3*p.s,p.y-p.h*0.5*p.s);
    c.quadraticCurveTo(p.x+side*7*p.s,p.y-p.h*0.62*p.s,p.x+side*6.5*p.s,p.y-p.h*0.75*p.s);
    c.quadraticCurveTo(p.x+side*2*p.s,p.y-p.h*0.58*p.s,p.x+side*3*p.s,p.y-p.h*0.5*p.s);
    c.fill(); c.stroke();
  }
  // cresta infuocata
  hairBob(c,p,'#ff6600');
  face(c,p,'#e64d3d','#ffe600',true);
  // coda a freccia demoniaca dietro
  const tailWave=Math.sin((p.t||0)*8)*4*p.s;
  c.strokeStyle='#ff2a2a'; c.lineWidth=2.2*p.s; c.beginPath();
  c.moveTo(p.x-p.dir*6*p.s,p.y-p.h*0.15*p.s);
  c.quadraticCurveTo(p.x-p.dir*14*p.s+tailWave,p.y-p.h*0.28*p.s,p.x-p.dir*16*p.s,p.y-p.h*0.12*p.s+tailWave);
  c.stroke();
  c.fillStyle='#ff2a2a'; c.beginPath();
  c.arc(p.x-p.dir*16*p.s,p.y-p.h*0.12*p.s+tailWave,3.5*p.s,0,7); c.fill();
  spark(c,p.x+p.dir*10*p.s,p.y-p.h*0.3*p.s,'#ff9900');
 },
 mimi(c,p){ // ANGELO CADUTO IN DISGRAZIA: aureola storta spezzata, ali piumate nere/viola, lacrime sacre
  body(c,p,'#4a2b66','#251238');
  hairBob(c,p,'#d8b4e2');
  face(c,p,'#e8d8f0','#a254f2',false,true); // occhi carichi di lacrime sacre
  // ali da angelo caduto
  for(let side of [-1,1]){
    c.fillStyle='rgba(130,70,180,0.85)'; c.strokeStyle='#1b092a'; c.lineWidth=1.2*p.s;
    c.beginPath();
    c.moveTo(p.x+side*4*p.s,p.y-p.h*0.3*p.s);
    c.lineTo(p.x+side*18*p.s,p.y-p.h*0.48*p.s+Math.sin((p.t||0)*6)*3*p.s);
    c.lineTo(p.x+side*12*p.s,p.y-p.h*0.18*p.s);
    c.closePath(); c.fill(); c.stroke();
  }
  // aureola storta e rotta sopra la testa
  c.save(); c.translate(p.x+2*p.s,p.y-p.h*0.58*p.s); c.rotate(0.35);
  c.strokeStyle='#ffe66d'; c.lineWidth=2.2*p.s;
  c.beginPath(); c.ellipse(0,0,10*p.s,3.2*p.s,0,0,PI*1.7); c.stroke();
  c.restore();
  if(p.using){ tear(c,p); }
 },
 bruno(c,p){ // PADRE DIVORZIATO: canotta sformata, lattina di birra, ciabatte, barba incolta
  body(c,p,'#718290','#424d55',1.48);
  hairBob(c,p,'#3d3532',0.6);
  face(c,p,'#e0be9b','#1f1f1f',false,false,true);
  // canotta e petto villoso da separato in casa
  c.fillStyle='#f0ede6'; c.fillRect(p.x-5.5*p.s,p.y-p.h*0.32*p.s,11*p.s,13*p.s);
  c.strokeStyle='#4a3b32'; c.lineWidth=1.2*p.s;
  c.beginPath(); c.moveTo(p.x-3*p.s,p.y-p.h*0.28*p.s); c.lineTo(p.x+3*p.s,p.y-p.h*0.28*p.s); c.stroke();
  // barba ispida
  c.fillStyle='rgba(45,35,30,0.55)'; c.beginPath(); c.ellipse(p.x,p.y-p.h*0.36*p.s,5.2*p.s,3.2*p.s,0,0,PI); c.fill();
 },
 ferdinando(c,p){ // AVVOCATO FALLITO: completo sgualcito a righe gessate, cravatta slacciata, valigetta
  body(c,p,'#2f3542','#1e222b',1.02);
  hairBob(c,p,'#b08d57');
  face(c,p,'#ffd9b3','#2b1e11',true);
  // colletto aperto e cravatta allentata
  c.fillStyle='#fff'; c.beginPath(); c.moveTo(p.x-4*p.s,p.y-p.h*0.34*p.s); c.lineTo(p.x+4*p.s,p.y-p.h*0.34*p.s); c.lineTo(p.x,p.y-p.h*0.26*p.s); c.fill();
  c.fillStyle='#d4af37'; c.beginPath(); c.moveTo(p.x-1.5*p.s,p.y-p.h*0.26*p.s); c.lineTo(p.x+1.5*p.s,p.y-p.h*0.26*p.s); c.lineTo(p.x+p.dir*3*p.s,p.y-p.h*0.14*p.s); c.lineTo(p.x,p.y-p.h*0.1*p.s); c.fill();
 },
 dolores(c,p){ // NONNA ANARCHICA: grembiule a toppe punk, occhiali spessi, barattolo pronto
  body(c,p,'#385e38','#203620');
  face(c,p,'#ffd9b3','#111',false,false,false,true);
  // occhiali tondi grandi da cartone
  c.strokeStyle='#222'; c.lineWidth=1.8*p.s;
  c.beginPath(); c.arc(p.x-3*p.s,p.y-p.h*0.42*p.s,3*p.s,0,7); c.arc(p.x+3*p.s,p.y-p.h*0.42*p.s,3*p.s,0,7); c.stroke();
  c.beginPath(); c.moveTo(p.x-1*p.s,p.y-p.h*0.42*p.s); c.lineTo(p.x+1*p.s,p.y-p.h*0.42*p.s); c.stroke();
  // fazzoletto con teschio/anarchia
  c.fillStyle='#cc2233'; c.beginPath(); c.arc(p.x,p.y-p.h*0.48*p.s,7.2*p.s,PI,2*PI); c.fill();
  c.fillStyle='#fff'; c.font='bold 7px Arial'; c.textAlign='center'; c.fillText('Ⓐ',p.x,p.y-p.h*0.5*p.s);
 },
 kevin(c,p){ // COMPLOTTISTA PARANOICO: cappellino di carta stagnola anti-5G, occhi sgranati
  const off=Math.sin(p.t*8)*3.5*p.s;
  body(c,p,'#d36a28','#8f4214',0.88,p.x-off*0.4);
  body(c,p,'#d36a28','#8f4214',0.88,p.x+off*0.4);
  for(const xo of [-off,off]){ const hx=p.x+xo*0.5;
    c.fillStyle='#ffd9b3'; c.beginPath(); c.arc(hx,p.y-p.h*0.41*p.s,5.2*p.s*0.9,0,7); c.fill();
    // occhi spalancati da paranoia
    c.fillStyle='#fff'; c.beginPath(); c.arc(hx-2*p.s,p.y-p.h*0.43*p.s,2.2*p.s,0,7); c.arc(hx+2*p.s,p.y-p.h*0.43*p.s,2.2*p.s,0,7); c.fill();
    c.fillStyle='#b81414'; c.beginPath(); c.arc(hx-2*p.s,p.y-p.h*0.43*p.s,0.9*p.s,0,7); c.arc(hx+2*p.s,p.y-p.h*0.43*p.s,0.9*p.s,0,7); c.fill();
    // cappellino a cono di carta stagnola
    c.fillStyle='#c8d6e5'; c.strokeStyle='#8395a7'; c.lineWidth=1*p.s;
    c.beginPath(); c.moveTo(hx-5*p.s,p.y-p.h*0.47*p.s); c.lineTo(hx+5*p.s,p.y-p.h*0.47*p.s); c.lineTo(hx+p.dir*1.5*p.s,p.y-p.h*0.62*p.s); c.closePath(); c.fill(); c.stroke();
  }
 },
 carla(c,p){ // CARLA LA FEMMINISTA: maglietta di protesta accesa, fascia da battaglia, megafono
  body(c,p,'#ff2e7e','#b81250');
  hairBob(c,p,'#631e78');
  face(c,p,'#e8b88a','#111');
  // bandana di protesta fucsia fluo
  c.fillStyle='#00f2fe'; c.fillRect(p.x-7.5*p.s,p.y-p.h*0.48*p.s,15*p.s,3.6*p.s);
  // pugno levato stampato sulla maglietta
  c.fillStyle='#fff'; c.font='bold 8px Arial'; c.textAlign='center'; c.fillText('✊',p.x,p.y-p.h*0.22*p.s);
 },
 sandro(c,p){ // L'IDRAULICO LUNATICO: tuta arancione/blu da spurghi, baffi esagerati, tubi gocciolanti
  body(c,p,'#d9531e','#8a300d',1.1);
  hairBob(c,p,'#38241b');
  face(c,p,'#ffd9b3','#111');
  // baffoni neri da cartone stile idraulico
  c.fillStyle='#221a16'; c.beginPath();
  c.arc(p.x-2.5*p.s,p.y-p.h*0.37*p.s,2.4*p.s,0,PI);
  c.arc(p.x+2.5*p.s,p.y-p.h*0.37*p.s,2.4*p.s,0,PI);
  c.fill();
  // berretto da lavoro idraulico
  c.fillStyle='#d9531e'; c.beginPath(); c.ellipse(p.x,p.y-p.h*0.5*p.s,7.8*p.s,3.2*p.s,0,0,PI*2); c.fill();
  if(p.using){ // schizzi di spurgo fognario caustico
    c.fillStyle='#2bb34a';
    for(let i=0;i<4;i++) c.fillRect(p.x+(i-1.5)*7*p.s,p.y-10*p.s+((p.t*70+i*17)%24)*p.s,3*p.s,5*p.s);
  }
 },
 paolo(c,p){ // TRADER IN BANCAROTTA: camicia stropicciata, occhiaie profonde, grafico a candela rossa
  body(c,p,'#283c48','#16242c',0.96);
  hairBob(c,p,'#4a4a4a');
  face(c,p,'#d8d3c5','#111',false,false,true); // occhiaie e disperazione
  // occhiaie violacee
  c.fillStyle='rgba(130,90,150,0.45)';
  c.beginPath(); c.arc(p.x-2.5*p.s,p.y-p.h*0.41*p.s,2*p.s,0,PI); c.arc(p.x+2.5*p.s,p.y-p.h*0.41*p.s,2*p.s,0,PI); c.fill();
  // candela rossa da crash crypto sul petto
  c.strokeStyle='#ff3838'; c.lineWidth=1.5*p.s;
  c.beginPath(); c.moveTo(p.x,p.y-29*p.s); c.lineTo(p.x,p.y-20*p.s); c.stroke();
  c.fillStyle='#ff3838'; c.fillRect(p.x-3*p.s,p.y-26*p.s,6*p.s,5*p.s);
  if(p.slowAll>0){
    const bl=(p.t*1.5%1)<0.5;
    c.fillStyle=bl?'#ff3838':'rgba(255,56,56,0.2)';
    c.beginPath(); c.arc(p.x,p.y-42*p.s,4.5*p.s,0,7); c.fill();
  }
 },
 lucia(c,p){ // L'ESATTORE SPIETATO: completo blu scuro ministeriale, occhiali squadrati, timbro sequestri
  body(c,p,'#223a5e','#132238',1.02);
  hairBob(c,p,'#1a1d24');
  face(c,p,'#f2dbcb','#111');
  // occhiali squadrati da ispettore implacabile
  c.strokeStyle='#d4af37'; c.lineWidth=1.6*p.s;
  c.strokeRect(p.x-5.5*p.s,p.y-p.h*0.44*p.s,4.2*p.s,2.6*p.s);
  c.strokeRect(p.x+1.3*p.s,p.y-p.h*0.44*p.s,4.2*p.s,2.6*p.s);
  c.beginPath(); c.moveTo(p.x-1.3*p.s,p.y-p.h*0.42*p.s); c.lineTo(p.x+1.3*p.s,p.y-p.h*0.42*p.s); c.stroke();
  // cartella rossa "SEQUESTRO"
  c.fillStyle='#b81414'; c.fillRect(p.x+p.dir*3*p.s,p.y-18*p.s,6*p.s,8*p.s);
  c.fillStyle='#fff'; c.font='bold 5px Arial'; c.fillText('TAX',p.x+p.dir*4*p.s,p.y-12*p.s);
 },
 ninoz(c,p){ // NINOZ IL TRAPPER: ragazzo europeo, capelli grigi ondulati, maglia oversize rapper, occhiali da sole con lenti rosse
  body(c,p,'#1e1b2e','#0f0d17',1.05); // vestiti larghi baggy
  // maglietta oversize da rapper con logo grafico
  c.fillStyle='#2a263d'; c.fillRect(p.x-7*p.s,p.y-28*p.s,14*p.s,16*p.s);
  c.fillStyle='#e056fd'; c.font='bold 7px Arial'; c.textAlign='center'; c.fillText('⚡TRAP',p.x,p.y-18*p.s);
  // catenina dorata da rapper
  c.strokeStyle='#ffd700'; c.lineWidth=1.8*p.s;
  c.beginPath(); c.arc(p.x,p.y-26*p.s,4.5*p.s,0,PI); c.stroke();
  // capelli grigi moderni stile cartoon
  hairBob(c,p,'#bdc3c7');
  c.fillStyle='#95a5a6'; c.beginPath();
  c.arc(p.x,p.y-p.h*0.48*p.s,7.2*p.s,PI*0.8,PI*2.2); c.fill();
  face(c,p,'#f3d5b5','#111');
  // occhiali da sole con montatura scura e lenti rosse fiammanti
  c.fillStyle='#ff1e42'; c.strokeStyle='#111'; c.lineWidth=1.5*p.s;
  c.fillRect(p.x-5.8*p.s,p.y-p.h*0.44*p.s,4.8*p.s,3.2*p.s);
  c.strokeRect(p.x-5.8*p.s,p.y-p.h*0.44*p.s,4.8*p.s,3.2*p.s);
  c.fillRect(p.x+1.0*p.s,p.y-p.h*0.44*p.s,4.8*p.s,3.2*p.s);
  c.strokeRect(p.x+1.0*p.s,p.y-p.h*0.44*p.s,4.8*p.s,3.2*p.s);
  c.beginPath(); c.moveTo(p.x-1.0*p.s,p.y-p.h*0.42*p.s); c.lineTo(p.x+1.0*p.s,p.y-p.h*0.42*p.s); c.stroke();
  // riflesso bianco cartoon sulle lenti rosse
  c.fillStyle='#ffffff';
  c.fillRect(p.x-4.8*p.s,p.y-p.h*0.43*p.s,1.6*p.s,1*p.s);
  c.fillRect(p.x+2.0*p.s,p.y-p.h*0.43*p.s,1.6*p.s,1*p.s);
 }
};
function headY(p){ /* la testa bobba in modo indipendente: doppio pendolo da cartone animato */
  const moving=Math.min(1,Math.abs(p.vx||0)/2.4);
  return -Math.abs(Math.sin((p.walk||0)*7))*1.5*p.s*moving+Math.sin((p.t||0)*5)*0.45*p.s;
}
function body(c,p,top,bot,scale,xoff){
  const s=(scale||1)*p.s, x=xoff!=null?xoff:p.x, y=p.y, phase=p.walk||0, moving=Math.min(1,Math.abs(p.vx||0)/2.4);
  const OUT='rgba(22,12,30,0.92)'; /* outline cel-shaded: silhouette leggibile */
  const stride=Math.sin(phase*7)*5*s*moving, bob=Math.abs(Math.sin(phase*7))*1.5*s*moving;
  const poseT=p.attackPoseT||0, poseMax=p.attackPoseMax||0.5, attacking=!!p.attackPose;
  const pp=attacking?Math.min(1,Math.max(0,1-poseT/poseMax)):0;
  const punch=attacking?Math.sin(pp*PI):0;
  /* squash & stretch: più è veloce più si allunga, al colpo si comprime */
  const speed=Math.min(1,Math.abs(p.vx||0)/3.2);
  const stretch=speed*0.05*Math.sin(phase*14)+(attacking?-0.07*punch:0);
  /* anticipazione: il corpo arretra prima dello scatto, poi affonda in avanti */
  const windup=attacking&&pp<0.3?(0.3-pp)*1.5:0;
  const lunge=attacking?punch*0.13*p.dir:0;
  c.save();
  c.translate(x,y-2); c.rotate(lunge-windup*0.1*p.dir); c.scale(1-stretch*0.55,1+stretch); c.translate(-x,-(y-2));
  c.translate(0,-bob);
  // Ombra, gambe snodate e scarpe chunky.
  c.fillStyle='rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(x,y+1,11*s,3*s,0,0,PI*2); c.fill();
  for(let side=-1;side<=1;side+=2){
    c.save(); c.translate(x+side*4*s,y-15*s); c.rotate(-(stride*(side>0?1:-1))/(18*s||1));
    c.fillStyle=bot; c.beginPath(); c.roundRect?c.roundRect(-3*s,0,6*s,14*s,3*s):c.rect(-3*s,0,6*s,14*s); c.fill();
    c.strokeStyle=OUT; c.lineWidth=1.3*s; c.stroke();
    const shoeX=side<0?-5*s:-2*s;
    c.fillStyle='#25242b'; c.beginPath(); c.roundRect?c.roundRect(shoeX,11*s,9*s,4*s,2*s):c.rect(shoeX,11*s,9*s,4*s); c.fill(); c.stroke();
    c.restore();
  }
  // Torso con fianchi larghi, spalle morbide, colletto e pannello leggibile.
  const grad=c.createLinearGradient(x-10*s,y-32*s,x+10*s,y-12*s); grad.addColorStop(0,top); grad.addColorStop(0.55,top); grad.addColorStop(1,bot);
  c.fillStyle=grad;c.beginPath();c.moveTo(x-7*s,y-32*s);c.quadraticCurveTo(x-11*s,y-31*s,x-10*s,y-26*s);c.lineTo(x-8*s,y-15*s);c.quadraticCurveTo(x,y-11*s,x+8*s,y-15*s);c.lineTo(x+10*s,y-26*s);c.quadraticCurveTo(x+11*s,y-31*s,x+7*s,y-32*s);c.closePath();c.fill();
  c.strokeStyle=OUT; c.lineWidth=1.7*s; c.stroke();
  c.strokeStyle='rgba(255,255,255,0.28)'; c.lineWidth=1.1*s; c.beginPath(); c.moveTo(x-6*s,y-29*s); c.lineTo(x-6*s,y-17*s); c.stroke();
  c.fillStyle='rgba(255,255,255,0.32)';c.beginPath();c.moveTo(x-7*s,y-31*s);c.lineTo(x,y-26*s);c.lineTo(x+7*s,y-31*s);c.closePath();c.fill();
  c.fillStyle='rgba(10,12,20,0.28)';c.beginPath();c.roundRect?c.roundRect(x-4*s,y-24*s,8*s,8*s,2*s):c.rect(x-4*s,y-24*s,8*s,8*s);c.fill();
  if(p.stripes){ c.fillStyle='#222'; for(let i=-1;i<2;i++) c.fillRect(x-9*s,y-27*s+i*5*s,18*s,1.8*s); }
  // Braccia ruotano dalla spalla; il colpo arretra, poi affonda verso il bersaglio.
  for(let side=-1;side<=1;side+=2){
    c.save(); c.translate(x+side*8*s,y-28*s);
    const swing=Math.sin(phase*7+ (side>0?Math.PI:0))*0.35*moving;
    const isPunchArm=attacking&&side===p.dir;
    const attackAngle=attacking?(isPunchArm?(-0.82*punch+windup*1.05):0.48*punch+windup*0.4):0;
    c.rotate(swing+attackAngle);
    c.fillStyle=grad;c.beginPath();c.roundRect?c.roundRect(-2.5*s,-1*s,5*s,10*s,2.5*s):c.rect(-2.5*s,-1*s,5*s,10*s);c.fill();
    c.strokeStyle=OUT; c.lineWidth=1.2*s; c.stroke();
    c.fillStyle='#ffd9b3'; c.beginPath(); c.arc(0,10*s,2.8*s,0,PI*2); c.fill(); c.stroke();
    c.fillStyle='rgba(255,255,255,0.34)';c.beginPath();c.arc(-0.7*s,9.2*s,0.8*s,0,PI*2);c.fill();
    if(isPunchArm){c.fillStyle='#ffd9b3';c.beginPath();c.arc(0,11*s,2.6*s+2*punch*s,0,PI*2);c.fill();c.strokeStyle=OUT;c.stroke();}
    c.restore();
  }
  c.restore();
}
function hairBob(c,p,col,w){
  const s=p.s,wf=w||1;
  c.save(); c.translate(0,headY(p));
  c.fillStyle=col; c.beginPath(); c.arc(p.x,p.y-p.h*0.455*p.s,6.2*s*wf,PI,2*PI); c.fill();
  c.strokeStyle='rgba(22,12,30,0.75)'; c.lineWidth=1.1*s; c.stroke();
  c.restore();
}
function face(c,p,skin,eyeCol,nervy,teary,flat,old){
  const s=p.s;
  c.save(); c.translate(0,headY(p));
  const fx=p.x+p.dir*0.35*s, fy=p.y-p.h*0.41*s;
  const headGrad=c.createRadialGradient(fx-1.5*s,fy-2*s,0.5*s,fx,fy,7.8*s);
  headGrad.addColorStop(0,'#fff8ee');headGrad.addColorStop(0.25,skin);headGrad.addColorStop(1,skin);
  c.fillStyle=headGrad;c.beginPath();c.ellipse(fx,fy,6.8*s,7.6*s,0,0,PI*2);c.fill();
  c.strokeStyle='#100814';c.lineWidth=1.8*s;c.stroke();
  c.fillStyle='rgba(255,100,120,0.42)';c.beginPath();c.arc(fx-p.dir*3.4*s,fy+2.0*s,1.7*s,0,PI*2);c.fill();
  const ey=p.y-p.h*0.43*s, ex=p.dir*1.2*s;
  const attacking=!!p.attackPose&&p.attackPoseT>0&&p.attackPoseT<(p.attackPoseMax||0.5)*0.72;
  const blink=Math.sin((p.t||0)*1.7)>0.986;
  /* occhi grandi stile cartoon: sclera, iride, pupilla e lucino */
  if(flat){
    c.fillStyle='#fff'; c.fillRect(p.x-3.4*s+ex,ey-1.2*s,2.6*s,2.2*s); c.fillRect(p.x+0.8*s+ex,ey-1.2*s,2.6*s,2.2*s);
    c.fillStyle=eyeCol; c.fillRect(p.x-2.6*s+ex,ey-0.9*s,1.6*s,1.6*s); c.fillRect(p.x+1.6*s+ex,ey-0.9*s,1.6*s,1.6*s);
    c.strokeStyle='rgba(40,20,36,0.6)';c.lineWidth=0.9*s;
    c.strokeRect(p.x-3.4*s+ex,ey-1.2*s,2.6*s,2.2*s); c.strokeRect(p.x+0.8*s+ex,ey-1.2*s,2.6*s,2.2*s);
  } else {
    for(let side=-1;side<=1;side+=2){
      const exx=p.x+side*2.35*s+ex;
      c.fillStyle='#fff'; c.beginPath(); c.ellipse(exx,ey,2.5*s,3*s,0,0,PI*2); c.fill();
      c.strokeStyle='rgba(30,16,28,0.55)'; c.lineWidth=0.8*s; c.stroke();
      if(blink){ c.strokeStyle=eyeCol; c.lineWidth=1.4*s; c.beginPath(); c.moveTo(exx-1.7*s,ey); c.lineTo(exx+1.7*s,ey); c.stroke(); continue; }
      c.fillStyle=eyeCol; c.beginPath(); c.arc(exx+p.dir*0.55*s,ey+0.25*s,1.55*s,0,PI*2); c.fill();
      c.fillStyle='#100814'; c.beginPath(); c.arc(exx+p.dir*0.8*s,ey+0.3*s,0.82*s,0,PI*2); c.fill();
      c.fillStyle='#fff'; c.beginPath(); c.arc(exx+p.dir*0.3*s,ey-0.8*s,0.62*s,0,PI*2); c.fill();
      if(teary){ c.fillStyle='rgba(154,220,255,0.85)'; c.beginPath(); c.arc(exx,ey+1.35*s,0.95*s,0,7); c.fill(); }
    }
  }
  /* sopracciglia espressive: arrabbiate in attacco, spaventate se nervoso, calanti se anziano */
  c.strokeStyle='rgba(40,20,36,0.85)'; c.lineWidth=1.5*s; c.beginPath();
  if(attacking){ c.moveTo(p.x-4.3*s+ex,ey-3.6*s); c.lineTo(p.x-1.2*s+ex,ey-2.3*s); c.moveTo(p.x+1.2*s+ex,ey-2.3*s); c.lineTo(p.x+4.3*s+ex,ey-3.6*s); }
  else if(nervy){ c.moveTo(p.x-4.3*s+ex,ey-3.1*s); c.lineTo(p.x-1.2*s+ex,ey-4*s); c.moveTo(p.x+1.2*s+ex,ey-4*s); c.lineTo(p.x+4.3*s+ex,ey-3.1*s); }
  else if(old){ c.moveTo(p.x-4.2*s+ex,ey-2.5*s); c.lineTo(p.x-1.2*s+ex,ey-3.2*s); c.moveTo(p.x+1.2*s+ex,ey-3.2*s); c.lineTo(p.x+4.2*s+ex,ey-2.5*s); }
  else { c.moveTo(p.x-4.3*s+ex,ey-3.5*s); c.quadraticCurveTo(p.x-2.7*s+ex,ey-4.3*s,p.x-1.2*s+ex,ey-3.5*s); c.moveTo(p.x+1.2*s+ex,ey-3.5*s); c.quadraticCurveTo(p.x+2.7*s+ex,ey-4.3*s,p.x+4.3*s+ex,ey-3.5*s); }
  c.stroke();
  /* bocca: sorriso da cartone, "O" spalancata in attacco, zigzag se nervoso */
  const my=p.y-p.h*0.352*s;
  if(attacking){
    c.fillStyle='#5a1a28'; c.beginPath(); c.ellipse(p.x+p.dir*0.6*s,my,2.3*s,2.9*s,0,0,PI*2); c.fill();
    c.fillStyle='#ff7a8a'; c.beginPath(); c.ellipse(p.x+p.dir*0.6*s,my+1.15*s,1.25*s,1.15*s,0,0,PI*2); c.fill();
  } else {
    c.strokeStyle='rgba(40,20,36,0.9)'; c.lineWidth=1.35*s; c.beginPath();
    if(nervy){ c.moveTo(p.x-2.5*s,my); c.lineTo(p.x-1.25*s,my+0.9*s); c.lineTo(p.x,my); c.lineTo(p.x+1.25*s,my+0.9*s); c.lineTo(p.x+2.5*s,my); }
    else if(old){ c.moveTo(p.x-1.6*s,my); c.quadraticCurveTo(p.x,my+1.3*s,p.x+1.6*s,my); }
    else { c.arc(p.x,my-1.15*s,2.3*s,0.15*PI,0.85*PI); }
    c.stroke();
  }
  c.restore();
}
function tear(c,p){ c.fillStyle='#9adcff';
  const t=(p.t%0.9)/0.9;
  c.beginPath(); c.ellipse(p.x-4*p.s,p.y-p.h*0.36*p.s+t*18*p.s,1.5*p.s,2.2*p.s,0,0,7); c.fill(); }
function spark(c,x,y,col){ c.strokeStyle=col; c.lineWidth=1.5; c.beginPath();
  c.moveTo(x-4,y); c.lineTo(x+4,y); c.moveTo(x,y-4); c.lineTo(x,y+4); c.stroke(); }

/* ---------- Nemici ---------- */
const EN={
 nurse(c,p){ body(c,p,'#e8e8f0','#9a9ab8',1);
  c.fillStyle='#8a8ab0'; c.fillRect(p.x-8*p.s,p.y-24*p.s,16*p.s,4*p.s);
  c.fillStyle='#fff'; c.beginPath(); c.arc(p.x,p.y-p.h*0.44*p.s,5*p.s,0,7); c.fill();
  c.fillStyle='#d33'; c.fillRect(p.x-1*p.s,p.y-p.h*0.48*p.s,2*p.s,5*p.s); c.fillRect(p.x-3*p.s,p.y-p.h*0.46*p.s,6*p.s,2*p.s);
  c.fillStyle='#111'; c.fillRect(p.x-3*p.s,p.y-p.h*0.43*p.s,1.6*p.s,1.6*p.s); c.fillRect(p.x+1.4*p.s,p.y-p.h*0.43*p.s,1.6*p.s,1.6*p.s);
 },
 gurney(c,p){ // barella mobile
  c.fillStyle='#b8bec8'; c.fillRect(p.x-11*p.s,p.y-10*p.s,22*p.s,3.5*p.s);
  c.fillStyle='#888'; c.fillRect(p.x-9*p.s,p.y-6.5*p.s,2*p.s,6*p.s); c.fillRect(p.x+7*p.s,p.y-6.5*p.s,2*p.s,6*p.s);
  c.fillStyle='#333'; c.beginPath(); c.arc(p.x-8*p.s,p.y,2.2*p.s,0,7); c.arc(p.x+8*p.s,p.y,2.2*p.s,0,7); c.fill();
  c.fillStyle='#f2f2f2'; c.fillRect(p.x-9*p.s,p.y-13*p.s,18*p.s,3*p.s);
 },
 cart(c,p){ // carrello spazzato
  c.strokeStyle='#c0c8d8'; c.lineWidth=1.6*p.s;
  c.strokeRect(p.x-8*p.s,p.y-13*p.s,16*p.s,10*p.s);
  c.beginPath(); c.moveTo(p.x-8*p.s,p.y-13*p.s); c.lineTo(p.x+4*p.s,p.y-19*p.s); c.stroke();
  c.fillStyle='#333'; c.beginPath(); c.arc(p.x-6*p.s,p.y-1*p.s,2*p.s,0,7); c.arc(p.x+6*p.s,p.y-1*p.s,2*p.s,0,7); c.fill();
 },
 folder(c,p){ // faldone volante
  c.fillStyle='#e8d9a0'; c.save(); c.translate(p.x,p.y-8*p.s); c.rotate(Math.sin(p.t*6)*0.2);
  c.fillRect(-7*p.s,-9*p.s,14*p.s,18*p.s); c.fillStyle='#b89a50'; c.fillRect(-7*p.s,-3*p.s,14*p.s,2*p.s); c.restore();
 },
 drone(c,p){ // drone parcheggio
  c.fillStyle='#3a3f4a'; c.beginPath(); c.arc(p.x,p.y-10*p.s,6*p.s,0,7); c.fill();
  c.strokeStyle='#666'; c.beginPath(); c.moveTo(p.x-10*p.s,p.y-13*p.s); c.lineTo(p.x+10*p.s,p.y-13*p.s); c.stroke();
  const b=Math.sin(p.t*30)*4*p.s;
  c.fillStyle='#9ab'; c.fillRect(p.x-13*p.s,p.y-14*p.s+b,6*p.s,1.5*p.s); c.fillRect(p.x+7*p.s,p.y-14*p.s-b,6*p.s,1.5*p.s);
  c.fillStyle='#f33'; c.beginPath(); c.arc(p.x,p.y-10*p.s,2*p.s,0,7); c.fill();
 },
 silla(c,p){ // sedia impazzita
  c.fillStyle='#2a2f3a'; c.fillRect(p.x-7*p.s,p.y-14*p.s,14*p.s,3*p.s);
  c.fillRect(p.x-7*p.s,p.y-11*p.s,3*p.s,11*p.s);
  c.fillStyle='#444'; c.beginPath(); c.arc(p.x,p.y-2*p.s,3*p.s,0,7); c.fill();
 },
 clerk(c,p){ // agente robot in loop
  body(c,p,'#4a5a4a','#333f33',1);
  c.fillStyle='#888'; c.beginPath(); c.arc(p.x,p.y-p.h*0.44*p.s,5*p.s,0,7); c.fill();
  c.fillStyle='#0f0'; c.fillRect(p.x-3*p.s,p.y-p.h*0.44*p.s,2*p.s,1.5*p.s); c.fillRect(p.x+1*p.s,p.y-p.h*0.44*p.s,2*p.s,1.5*p.s);
 },
 granny(c,p){ // nonna coupon
  body(c,p,'#c85a8a','#8a3a5a',1.1);
  hairBob(c,p,'#ddd');
  face(c,p,'#f0c8a8','#111');
  c.fillStyle='#ffd94d'; c.fillRect(p.x-6*p.s,p.y-p.h*0.2*p.s,12*p.s,4*p.s);
 },
 passenger(c,p){ // passeggero annoiato
  body(c,p,'#5a6a8a','#3a4a6a',1);
  hairBob(c,p,'#444');
  face(c,p,'#e0b898','#222',false,false,true);
 },
 clown(c,p){ // pupazzo a molla
  body(c,p,'#c85ac8','#8a3a8a',1);
  c.fillStyle='#f33'; c.beginPath(); c.arc(p.x,p.y-p.h*0.5*p.s,2.5*p.s,0,7); c.fill();
  hairBob(c,p,'#f80');
  face(c,p,'#fff','#111');
  c.fillStyle='#111'; c.beginPath(); c.arc(p.x,p.y-p.h*0.36*p.s,1.8*p.s,0,7); c.fill();
 },
 plant(c,p){ // pianta finta carnivora
  c.fillStyle='#2a7a4a'; c.fillRect(p.x-2*p.s,p.y-16*p.s,4*p.s,16*p.s);
  c.fillStyle='#f8c'; c.beginPath(); c.ellipse(p.x,p.y-19*p.s,5*p.s,7*p.s,Math.sin(p.t*5)*0.3,0,7); c.fill();
  c.fillStyle='#fff'; c.beginPath(); for(let i=0;i<4;i++){ c.moveTo(p.x-4*p.s+i*3*p.s,p.y-22*p.s); c.lineTo(p.x-3*p.s+i*3*p.s,p.y-17*p.s);} c.strokeStyle='#fff'; c.stroke();
 },
 shredder(c,p){ // fotocopiatrice mobile
  c.fillStyle='#9aa4b0'; c.fillRect(p.x-10*p.s,p.y-16*p.s,20*p.s,16*p.s);
  c.fillStyle='#333'; c.fillRect(p.x-7*p.s,p.y-13*p.s,8*p.s,3*p.s);
  c.fillStyle='#4f8'; c.fillRect(p.x+4*p.s,p.y-13*p.s,3*p.s,1.5*p.s);
  c.fillStyle='#333'; c.beginPath(); c.arc(p.x-7*p.s,p.y-1*p.s,2*p.s,0,7); c.arc(p.x+7*p.s,p.y-1*p.s,2*p.s,0,7); c.fill();
 },
 wheelchair(c,p){ // sedia a rotelle da corsa
  c.strokeStyle='#888'; c.lineWidth=1.5*p.s;
  c.beginPath(); c.arc(p.x-4*p.s,p.y-7*p.s,7*p.s,0,7); c.stroke();
  c.beginPath(); c.moveTo(p.x-4*p.s,p.y-13*p.s); c.lineTo(p.x-4*p.s,p.y-1*p.s); c.moveTo(p.x-10*p.s,p.y-7*p.s); c.lineTo(p.x+2*p.s,p.y-7*p.s); c.stroke();
  c.fillStyle='#333'; c.beginPath(); c.arc(p.x+7*p.s,p.y-2*p.s,2*p.s,0,7); c.fill();
  c.fillStyle='#6b4a8a'; c.fillRect(p.x-2*p.s,p.y-14*p.s,9*p.s,3*p.s); // seduta
  c.fillStyle='#ffd9b3'; c.beginPath(); c.arc(p.x+5*p.s,p.y-19*p.s,4*p.s,0,7); c.fill();
  c.fillStyle='#111'; c.fillRect(p.x+3.4*p.s,p.y-20*p.s,1.4*p.s,1.4*p.s); c.fillRect(p.x+6.2*p.s,p.y-20*p.s,1.4*p.s,1.4*p.s);
 },
 knitter(c,p){ // nonna del maglione
  body(c,p,'#a8b8d0','#7a8aa0',1);
  hairBob(c,p,'#ddd');
  face(c,p,'#f0c8a8','#111',false,false,false,true);
  // gomitoli
  c.fillStyle='#ff6bd6'; c.beginPath(); c.arc(p.x-7*p.s,p.y-3*p.s,2.6*p.s,0,7); c.fill();
  c.fillStyle='#7bc86c'; c.beginPath(); c.arc(p.x+6*p.s,p.y-2*p.s,2.2*p.s,0,7); c.fill();
  c.strokeStyle='#ff6bd6'; c.lineWidth=0.8*p.s;
  c.beginPath(); c.moveTo(p.x-7*p.s,p.y-3*p.s); c.lineTo(p.x-3*p.s,p.y-14*p.s); c.stroke();
 },
 suitcase(c,p){ // valigia corazzata
  c.fillStyle='#8a5a3a'; c.fillRect(p.x-9*p.s,p.y-15*p.s,18*p.s,13*p.s);
  c.fillStyle='#6b4430'; c.fillRect(p.x-9*p.s,p.y-9*p.s,18*p.s,1.5*p.s);
  c.strokeStyle='#444'; c.lineWidth=1.5*p.s; c.beginPath(); c.arc(p.x,p.y-15*p.s,4*p.s,PI,2*PI); c.stroke();
  c.fillStyle='#333'; c.beginPath(); c.arc(p.x-5*p.s,p.y-1*p.s,1.8*p.s,0,7); c.arc(p.x+5*p.s,p.y-1*p.s,1.8*p.s,0,7); c.fill();
  c.fillStyle='#ffd94d'; c.fillRect(p.x-3*p.s,p.y-13*p.s,6*p.s,3*p.s); // adesivo aeroporto
 },
 steward(c,p){ // assistente di volo
  body(c,p,'#2a8a8a','#1a5a5a',1);
  hairBob(c,p,'#3a2a1a');
  face(c,p,'#ffd9b3','#111');
  // scialle e spilla
  c.fillStyle='#e8e8f0'; c.fillRect(p.x-9*p.s,p.y-26*p.s,3*p.s,12*p.s); c.fillRect(p.x+6*p.s,p.y-26*p.s,3*p.s,12*p.s);
  c.fillStyle='#ffd94d'; c.beginPath(); c.arc(p.x+p.dir*4*p.s,p.y-24*p.s,1.5*p.s,0,7); c.fill();
  // vassoio
  c.fillStyle='#c0c0c0'; c.fillRect(p.x+p.dir*8*p.s,p.y-16*p.s,7*p.s,1.5*p.s);
 },
 dancer(c,p){ // ballerina disco
  body(c,p,'#ff6bd6','#c24a9a',1);
  hairBob(c,p,'#ffd94d',1.3);
  face(c,p,'#e8b88a','#111');
  // pantaloni a zampa
  c.fillStyle='#c24a9a';
  c.beginPath(); c.moveTo(p.x-6*p.s,p.y-13*p.s); c.lineTo(p.x-9*p.s,p.y); c.lineTo(p.x-2*p.s,p.y); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(p.x+6*p.s,p.y-13*p.s); c.lineTo(p.x+9*p.s,p.y); c.lineTo(p.x+2*p.s,p.y); c.closePath(); c.fill();
 },
 barman(c,p){ // barman dello shake
  body(c,p,'#2a2a3a','#1a1a2a',1.05);
  hairBob(c,p,'#222');
  face(c,p,'#e8c39e','#111');
  // papillon e shaker
  c.fillStyle='#f33'; c.fillRect(p.x-3*p.s,p.y-29*p.s,6*p.s,2.5*p.s);
  c.fillStyle='#c0c0c0'; c.fillRect(p.x+p.dir*7*p.s,p.y-20*p.s,3.5*p.s,8*p.s);
  c.fillStyle='#ffd94d'; c.fillRect(p.x+p.dir*7*p.s,p.y-14*p.s,3.5*p.s,1.5*p.s);
 },
 ultrass(c,p){ // ultras con sciarpa
  body(c,p,'#1a3a8a','#12265a',1);
  hairBob(c,p,'#4a3a2a');
  face(c,p,'#e8c8a8','#111',true); // grida
  // sciarpa al vento
  c.fillStyle='#d33';
  c.beginPath(); c.moveTo(p.x-p.dir*6*p.s,p.y-26*p.s);
  c.quadraticCurveTo(p.x-p.dir*16*p.s,p.y-22*p.s+Math.sin(p.t*8)*3,p.x-p.dir*22*p.s,p.y-18*p.s);
  c.lineTo(p.x-p.dir*20*p.s,p.y-15*p.s); c.closePath(); c.fill();
  // cappellino
  c.fillStyle='#111'; c.fillRect(p.x-7*p.s,p.y-p.h*0.52*p.s,14*p.s,3*p.s);
 },  spettro(c,p){ // fantasma di condominio, felpato e lamentoso
  const fl=Math.sin(p.t*3)*2*p.s, al=0.82+Math.sin(p.t*5)*0.12;
  c.save();c.globalAlpha=al;
  c.fillStyle='#dfe9f5';c.beginPath();c.moveTo(p.x-10*p.s,p.y-26*p.s);
  c.quadraticCurveTo(p.x,p.y-36*p.s,p.x+10*p.s,p.y-26*p.s);
  c.lineTo(p.x+9*p.s,p.y-4*p.s+fl);
  for(let w=0;w<4;w++){const wx=p.x+9*p.s-w*6*p.s;c.quadraticCurveTo(wx-2*p.s,p.y-10*p.s+fl,wx-3*p.s,p.y-2*p.s+((w%2)?4:-2)*p.s+fl);}
  c.closePath();c.fill();
  c.fillStyle='#1c2438';c.beginPath();c.arc(p.x-3.5*p.s,p.y-22*p.s,2.4*p.s,0,PI*2);c.arc(p.x+3.5*p.s,p.y-22*p.s,2.4*p.s,0,PI*2);c.fill();
  c.fillStyle='#fff';c.beginPath();c.arc(p.x-4.2*p.s,p.y-22.8*p.s,0.8*p.s,0,PI*2);c.arc(p.x+2.8*p.s,p.y-22.8*p.s,0.8*p.s,0,PI*2);c.fill();
  c.fillStyle='#1c2438';c.beginPath();c.ellipse(p.x,p.y-15*p.s,2.6*p.s,3.4*p.s,0,0,PI*2);c.fill(); // bocca “oooooh”
  c.restore();
 },  ratto(c,p){ // ratto delle fogne, nervoso e maleducato
  c.fillStyle='#6b6b78';c.beginPath();c.ellipse(p.x,p.y-10*p.s,11*p.s,7.5*p.s,0,0,PI*2);c.fill();
  c.beginPath();c.arc(p.x+p.dir*9*p.s,p.y-15*p.s,5*p.s,0,PI*2);c.fill(); // testa
  c.fillStyle='#8a7a88';c.beginPath();c.arc(p.x+p.dir*6*p.s,p.y-20*p.s,2.8*p.s,0,PI*2);c.fill(); // orecchio
  c.fillStyle='#ff9aa8';c.beginPath();c.arc(p.x+p.dir*13.4*p.s,p.y-13.6*p.s,1.6*p.s,0,PI*2);c.fill(); // naso
  c.fillStyle='#fff';c.fillRect(p.x+p.dir*11*p.s,p.y-11.5*p.s,1.2*p.s,2.4*p.s); // dente
  c.fillStyle='#f33';c.beginPath();c.arc(p.x+p.dir*10*p.s,p.y-16.2*p.s,1.1*p.s,0,PI*2);c.fill(); // occhio rosso
  c.strokeStyle='#8a7a88';c.lineWidth=1.6*p.s;c.beginPath();
  c.moveTo(p.x-p.dir*10*p.s,p.y-8*p.s);c.quadraticCurveTo(p.x-p.dir*18*p.s+Math.sin(p.t*6)*3*p.s,p.y-12*p.s,p.x-p.dir*20*p.s,p.y-4*p.s);c.stroke(); // coda
 },

 usciere(c,p){ // usciere di tribunale, mazzetta e distintivo
  body(c,p,'#2c3346','#1d2333',1.05);
  c.fillStyle='#222';c.fillRect(p.x-8*p.s,p.y-p.h*0.52*p.s,16*p.s,3.5*p.s); // berretto
  c.fillRect(p.x-10*p.s,p.y-p.h*0.485*p.s,20*p.s,1.8*p.s);
  face(c,p,'#e8c39e','#222',false,false,true);
  c.fillStyle='#ffd94d';c.beginPath();c.arc(p.x+p.dir*5*p.s,p.y-26*p.s,1.8*p.s,0,PI*2);c.fill(); // distintivo
  c.fillStyle='#8a5a3a';c.fillRect(p.x+p.dir*8*p.s,p.y-18*p.s,3*p.s,10*p.s); // mazzetta
 },
 avvocato(c,p){ // avvocato con parrucca e valigetta
  body(c,p,'#26262e','#17171d',1);
  // parrucca bianca arricciata
  c.fillStyle='#e8e6e0';
  for(let i=-2;i<=2;i++){c.beginPath();c.arc(p.x+i*3.4*p.s,p.y-p.h*0.5*p.s,3.2*p.s,0,PI*2);c.fill();}
  face(c,p,'#f0c8a8','#333',false,false,true);
  c.fillStyle='#fff';c.fillRect(p.x-2*p.s,p.y-28*p.s,4*p.s,7*p.s); // tovaglia/colletto
  c.fillStyle='#5a3a2a';c.fillRect(p.x+p.dir*8*p.s,p.y-15*p.s,8*p.s,7*p.s); // valigetta
  c.fillStyle='#3a2418';c.fillRect(p.x+p.dir*8*p.s,p.y-15*p.s,8*p.s,1.4*p.s);
 },
 mascotte(c,p){ // mascotte tigre dello stadio
  c.fillStyle='#ff8c42'; c.beginPath(); c.arc(p.x,p.y-16*p.s,14*p.s,0,7); c.fill(); // corpo tondo
  c.fillStyle='#e8e0d0'; c.beginPath(); c.arc(p.x,p.y-10*p.s,7*p.s,0,7); c.fill(); // pancia
  // orecchie
  c.fillStyle='#ff8c42'; c.beginPath(); c.arc(p.x-9*p.s,p.y-27*p.s,4*p.s,0,7); c.arc(p.x+9*p.s,p.y-27*p.s,4*p.s,0,7); c.fill();
  // occhi e muso
  c.fillStyle='#fff'; c.beginPath(); c.arc(p.x-4*p.s,p.y-20*p.s,3*p.s,0,7); c.arc(p.x+4*p.s,p.y-20*p.s,3*p.s,0,7); c.fill();
  c.fillStyle='#111'; c.beginPath(); c.arc(p.x-4*p.s,p.y-20*p.s,1.4*p.s,0,7); c.arc(p.x+4*p.s,p.y-20*p.s,1.4*p.s,0,7); c.fill();
  c.fillStyle='#333'; c.beginPath(); c.arc(p.x,p.y-15*p.s,2*p.s,0,7); c.fill();
  // strisce
  c.strokeStyle='#333'; c.lineWidth=1.5*p.s;
  c.beginPath(); c.moveTo(p.x-12*p.s,p.y-24*p.s); c.lineTo(p.x-8*p.s,p.y-23*p.s); c.moveTo(p.x+12*p.s,p.y-24*p.s); c.lineTo(p.x+8*p.s,p.y-23*p.s); c.stroke();
 }
};
function sSafe(p){return p.s;}

/* ---------- Boss (grandi, con facce caratteristiche) ---------- */ const BOSS={
 fantasma(c,p){ // L'INQUILINO DI PIANO -1 — fantasma padrone di casa
  const fl=Math.sin(p.t*2.2)*4*p.s;
  c.save();c.globalAlpha=0.92;
  c.fillStyle='#cdd8ec';c.beginPath();c.moveTo(p.x-20*p.s,p.y-p.h*0.62*p.s);
  c.quadraticCurveTo(p.x,p.y-p.h*0.82*p.s,p.x+20*p.s,p.y-p.h*0.62*p.s);
  c.lineTo(p.x+18*p.s,p.y-6*p.s+fl);
  for(let w=0;w<5;w++){const wx=p.x+18*p.s-w*9*p.s;c.quadraticCurveTo(wx-4*p.s,p.y-18*p.s+fl,wx-5*p.s,p.y-4*p.s+((w%2)?7:-3)*p.s+fl);}
  c.closePath();c.fill();
  // catene del mutuo
  c.strokeStyle='#8a94a8';c.lineWidth=2.4*p.s;
  for(let ch=0;ch<3;ch++){c.beginPath();c.arc(p.x-12*p.s+ch*12*p.s,p.y-p.h*0.3*p.s+Math.sin(p.t*3+ch)*3*p.s,3.4*p.s,0,PI*2);c.stroke();}
  // occhi e bocca
  c.fillStyle='#141c2e';c.beginPath();c.arc(p.x-7*p.s,p.y-p.h*0.56*p.s,4.6*p.s,0,PI*2);c.arc(p.x+7*p.s,p.y-p.h*0.56*p.s,4.6*p.s,0,PI*2);c.fill();
  c.fillStyle='#fff';c.beginPath();c.arc(p.x-8.6*p.s,p.y-p.h*0.58*p.s,1.4*p.s,0,PI*2);c.arc(p.x+5.4*p.s,p.y-p.h*0.58*p.s,1.4*p.s,0,PI*2);c.fill();
  c.fillStyle='#141c2e';c.beginPath();c.ellipse(p.x,p.y-p.h*0.44*p.s,3.6*p.s,5.2*p.s,0,0,PI*2);c.fill();
  // sopracciglia arrabbiate
  c.strokeStyle='#141c2e';c.lineWidth=2.6*p.s;c.beginPath();
  c.moveTo(p.x-12*p.s,p.y-p.h*0.62*p.s);c.lineTo(p.x-3*p.s,p.y-p.h*0.58*p.s);
  c.moveTo(p.x+12*p.s,p.y-p.h*0.62*p.s);c.lineTo(p.x+3*p.s,p.y-p.h*0.58*p.s);c.stroke();
  c.restore();
 },
 giudice(c,p){ // IL GIUDICE ASSOLUTAMENTE NO — parrucca, martello e sdegno
  big(c,p,'#241c2e','#161021',2.6);
  // parrucca bianca
  c.fillStyle='#e8e6e0';
  for(let i=-2;i<=2;i++){c.beginPath();c.arc(p.x+i*7*p.s,p.y-p.h*0.56*p.s,6.4*p.s,0,PI*2);c.fill();}
  // toga con banda rossa
  c.fillStyle='#3a1220';c.fillRect(p.x-4.5*p.s,p.y-p.h*0.34*p.s,9*p.s,18*p.s);
  // faccia severa
  eyes(c,p,'#111');
  c.strokeStyle='#111';c.lineWidth=2*p.s;c.beginPath();
  c.moveTo(p.x-6*p.s,p.y-p.h*0.365*p.s);c.lineTo(p.x+6*p.s,p.y-p.h*0.365*p.s);c.stroke();
  // martelletto che batte
  c.save();c.translate(p.x+p.dir*14*p.s,p.y-p.h*0.34*p.s);c.rotate(p.dir*(-0.7+Math.sin(p.t*5)*0.55));
  c.fillStyle='#8a5a3a';c.fillRect(0,-1.6*p.s,13*p.s,3.2*p.s);
  c.fillStyle='#5a3620';c.fillRect(11*p.s,-4.6*p.s,6*p.s,9*p.s);c.restore();
 },
 bendaggio(c,p){ // chirurgo bendato
  big(c,p,'#e8e8f0','#c9c9d8',2.4);
  // bende incrociate
  c.strokeStyle='#fff'; c.lineWidth=4*p.s;
  c.beginPath(); c.moveTo(p.x-9*p.s,p.y-p.h*0.52*p.s); c.lineTo(p.x+9*p.s,p.y-p.h*0.32*p.s); c.stroke();
  c.beginPath(); c.moveTo(p.x+9*p.s,p.y-p.h*0.52*p.s); c.lineTo(p.x-9*p.s,p.y-p.h*0.32*p.s); c.stroke();
  c.fillStyle='#fff'; c.beginPath(); c.arc(p.x,p.y-p.h*0.42*p.s,6*p.s,0,7); c.fill();
  c.fillStyle='#d33'; c.fillRect(p.x-1*p.s,p.y-p.h*0.46*p.s,2*p.s,6*p.s); c.fillRect(p.x-3.5*p.s,p.y-p.h*0.44*p.s,7*p.s,2*p.s);
  eyes(c,p,'#111','#d33');
 },
 custode(c,p){ // guardiano del ticket
  big(c,p,'#3a5a3a','#26402a',2.4);
  c.fillStyle='#222'; c.fillRect(p.x-10*p.s,p.y-p.h*0.55*p.s,20*p.s,4*p.s);
  c.fillStyle='#ffd94d'; c.fillRect(p.x-6*p.s,p.y-p.h*0.3*p.s,12*p.s,6*p.s); // biglietto sul petto
  eyes(c,p,'#f80');
 },
 timbro(c,p){ // sergente timbro
  big(c,p,'#2a4a6a','#1a324a',2.5);
  c.fillStyle='#d33'; // timbro in mano
  c.fillRect(p.x+p.dir*9*p.s,p.y-p.h*0.3*p.s,6*p.s,8*p.s);
  eyes(c,p,'#111');
 },
 coupon(c,p){ // signora dei coupon
  big(c,p,'#c85a8a','#8a3a5a',2.2);
  hairBob(c,p,'#eee');
  eyes(c,p,'#111');
  c.fillStyle='#ffd94d';
  for(let i=0;i<3;i++) c.fillRect(p.x-8*p.s+i*7*p.s,p.y-p.h*0.22*p.s,4*p.s,5*p.s);
 },
 capotreno(c,p){ // capotreno eterno
  big(c,p,'#1a3a5a','#0e2440',2.6);
  c.fillStyle='#222'; c.fillRect(p.x-11*p.s,p.y-p.h*0.56*p.s,22*p.s,5*p.s); // cappello
  c.fillStyle='#ffd94d'; c.fillRect(p.x-3*p.s,p.y-p.h*0.47*p.s,6*p.s,3*p.s);
  eyes(c,p,'#111');
  if(p.t%1<0.5){ c.fillStyle='#fff'; c.fillRect(p.x-2*p.s,p.y-p.h*0.3*p.s,4*p.s,2*p.s);} // fischietto
 },
 palloncino(c,p){ // zio palloncino
  big(c,p,'#f06a9a','#c04a6a',2.2);
  hairBob(c,p,'#a44');
  eyes(c,p,'#111');
  const b=1+Math.sin(p.t*4)*0.1;
  c.fillStyle='#f33'; c.beginPath(); c.arc(p.x,p.y-p.h*0.16*p.s,5*p.s*b,0,7); c.fill(); // palloncino in mano
  c.strokeStyle='#f33'; c.beginPath(); c.moveTo(p.x,p.y-p.h*0.12*p.s); c.lineTo(p.x+2*p.s,p.y-p.h*0.05*p.s); c.stroke();
 },
 manager(c,p){ // manager delle riunioni
  big(c,p,'#2a2a3a','#1a1a2a',2.3);
  c.fillStyle='#ffd94d'; // cravatta
  c.fillRect(p.x-2*p.s,p.y-p.h*0.3*p.s,4*p.s,10*p.s);
  eyes(c,p,'#111');
  // occhiali
  c.strokeStyle='#000'; c.lineWidth=1.5*p.s; c.beginPath(); c.arc(p.x-3*p.s,p.y-p.h*0.44*p.s,2.5*p.s,0,7); c.arc(p.x+3*p.s,p.y-p.h*0.44*p.s,2.5*p.s,0,7); c.stroke();
 },
 badante(c,p){ // BADANTE BARBARA
  big(c,p,'#7bc86c','#4a9a4a',2.5);
  // boccoli viola
  for(let i=-1;i<=1;i++){ c.fillStyle='#9a5ac8'; c.beginPath();
    c.arc(p.x+i*6*p.s,p.y-p.h*0.54*p.s,4.5*p.s,0,7); c.fill(); }
  eyes(c,p,'#111');
  // cuore sulla tuta
  c.fillStyle='#ff4d6d'; c.beginPath();
  c.arc(p.x-2.5*p.s,p.y-p.h*0.3*p.s,2*p.s,PI,2*PI); c.arc(p.x+2.5*p.s,p.y-p.h*0.3*p.s,2*p.s,PI,2*PI);
  c.lineTo(p.x,p.y-p.h*0.24*p.s); c.closePath(); c.fill();
  // siringone gigante
  c.save(); c.translate(p.x+p.dir*12*p.s,p.y-p.h*0.32*p.s); c.rotate(p.dir*(0.5+Math.sin(p.t*4)*0.15));
  c.fillStyle='#e8f0f8'; c.fillRect(-3*p.s,-4*p.s,14*p.s,8*p.s);
  c.strokeStyle='#889'; c.lineWidth=1.2*p.s; c.beginPath(); c.moveTo(11*p.s,0); c.lineTo(19*p.s,0); c.stroke();
  c.fillStyle='#ff8ac2'; c.fillRect(-3*p.s,-1*p.s,8*p.s,2*p.s);
  c.restore();
 },
 gatekeep(c,p){ // IL GATEKEEPER
  big(c,p,'#2a3a5a','#1a2440',2.5);
  // berretto con visiera e ali dorate
  c.fillStyle='#1a2440'; c.fillRect(p.x-11*p.s,p.y-p.h*0.6*p.s,22*p.s,4.5*p.s);
  c.fillRect(p.x-13*p.s,p.y-p.h*0.56*p.s,26*p.s,2.5*p.s);
  c.fillStyle='#ffd94d'; c.fillRect(p.x-3*p.s,p.y-p.h*0.58*p.s,6*p.s,2*p.s);
  // bottoni dorati
  c.fillStyle='#ffd94d';
  c.beginPath(); c.arc(p.x-4*p.s,p.y-p.h*0.36*p.s,1.2*p.s,0,7); c.arc(p.x+4*p.s,p.y-p.h*0.36*p.s,1.2*p.s,0,7); c.fill();
  eyes(c,p,'#111');
  // scansatore in mano
  c.fillStyle='#444'; c.fillRect(p.x+p.dir*10*p.s,p.y-p.h*0.42*p.s,7*p.s,12*p.s);
  c.fillStyle=p.phase>=2?'#f33':'#4f8'; c.fillRect(p.x+p.dir*11.5*p.s,p.y-p.h*0.4*p.s,4*p.s,3*p.s);
 },
 deejay(c,p){ // DJ SUBBOTTA
  big(c,p,'#3a2a5a','#241a40',2.4);
  // cuffie
  c.strokeStyle='#222'; c.lineWidth=2.5*p.s;
  c.beginPath(); c.arc(p.x,p.y-p.h*0.46*p.s,8.5*p.s,PI,2*PI); c.stroke();
  c.fillStyle='#222'; c.beginPath(); c.arc(p.x-8.5*p.s,p.y-p.h*0.46*p.s,3.2*p.s,0,7); c.arc(p.x+8.5*p.s,p.y-p.h*0.46*p.s,3.2*p.s,0,7); c.fill();
  // occhiali a specchio
  c.fillStyle='#111'; c.fillRect(p.x-5*p.s,p.y-p.h*0.45*p.s,4.5*p.s,2.5*p.s); c.fillRect(p.x+0.5*p.s,p.y-p.h*0.45*p.s,4.5*p.s,2.5*p.s);
  // consolle luminosa
  const g=0.5+Math.sin(p.t*8)*0.5;
  c.fillStyle='#1a1a2a'; c.fillRect(p.x+p.dir*9*p.s,p.y-p.h*0.28*p.s,14*p.s,6*p.s);
  c.fillStyle='rgba(255,47,176,'+(0.5+g*0.5)+')'; c.fillRect(p.x+p.dir*10*p.s,p.y-p.h*0.265*p.s,4*p.s,2*p.s);
  c.fillStyle='rgba(57,255,20,'+(1-g*0.5)+')'; c.fillRect(p.x+p.dir*16*p.s,p.y-p.h*0.265*p.s,4*p.s,2*p.s);
  eyes(c,p,'#111');
 },
 allenatore(c,p){ // IL COMMISSARIO TECNICO
  big(c,p,'#3a4444','#26302e',2.5);
  // completino + cravatta
  c.fillStyle='#fff'; c.fillRect(p.x-3*p.s,p.y-p.h*0.34*p.s,6*p.s,3*p.s);
  c.fillStyle='#d33'; c.fillRect(p.x-1.2*p.s,p.y-p.h*0.32*p.s,2.4*p.s,9*p.s);
  // berretto
  c.fillStyle='#222'; c.fillRect(p.x-10*p.s,p.y-p.h*0.58*p.s,20*p.s,4*p.s); c.fillRect(p.x-12*p.s,p.y-p.h*0.545*p.s,24*p.s,2*p.s);
  eyes(c,p,'#111');
 // tabellino tattico
  c.fillStyle='#c8b888'; c.fillRect(p.x+p.dir*9*p.s,p.y-p.h*0.36*p.s,9*p.s,7*p.s);
  c.strokeStyle='#d33'; c.lineWidth=1*p.s;
  c.beginPath(); c.moveTo(p.x+p.dir*10.5*p.s,p.y-p.h*0.33*p.s); c.lineTo(p.x+p.dir*13*p.s,p.y-p.h*0.31*p.s); c.lineTo(p.x+p.dir*15.5*p.s,p.y-p.h*0.335*p.s); c.stroke();
 },
 bandierona(c,p){ // IL BANDIERONA
  big(c,p,'#e8e8f0','#c9c9d8',2.6);
  // caschetto arbitrale
  c.fillStyle='#111'; c.fillRect(p.x-10*p.s,p.y-p.h*0.58*p.s,20*p.s,4*p.s); c.fillRect(p.x+2*p.s,p.y-p.h*0.545*p.s,10*p.s,2*p.s);
  eyes(c,p,'#111');
  // bandierone a strisce
  c.save(); c.translate(p.x+p.dir*13*p.s,p.y-p.h*0.44*p.s); c.rotate(p.dir*Math.sin(p.t*3)*0.2);
  c.strokeStyle='#8a6a3a'; c.lineWidth=1.8*p.s; c.beginPath(); c.moveTo(0,0); c.lineTo(0,-22*p.s); c.stroke();
  for(let i=0;i<3;i++){ c.fillStyle=i%2?'#fff':'#d33'; c.fillRect(0,-22*p.s+i*4*p.s,13*p.s,4*p.s); }
  c.restore();
 },
 fritto(c,p){ // MOLETOSSICO SUPREMO — polpettone gigante in frittura profonda
  big(c,p,'#8a4a2a','#5a2e18',2.8);
  // bolle di frittura
  const bub=(p.t*3)%1;
  for(let i=0;i<4;i++){ const a=i*PI/2+p.t*2; c.fillStyle='#ffb347';
    c.beginPath(); c.arc(p.x+Math.cos(a)*14*p.s,p.y-p.h*(0.3+0.09*i)*p.s,(2+bub*3)*p.s,0,7); c.fill(); }
  // occhi arrabbiati
  c.fillStyle='#fff'; c.beginPath(); c.arc(p.x-5*p.s,p.y-p.h*0.5*p.s,3.5*p.s,0,7); c.arc(p.x+5*p.s,p.y-p.h*0.5*p.s,3.5*p.s,0,7); c.fill();
  c.fillStyle='#111'; c.beginPath(); c.arc(p.x-5*p.s,p.y-p.h*0.5*p.s,1.6*p.s,0,7); c.arc(p.x+5*p.s,p.y-p.h*0.5*p.s,1.6*p.s,0,7); c.fill();
  c.strokeStyle='#111'; c.lineWidth=1.8*p.s;
  c.beginPath(); c.moveTo(p.x-8*p.s,p.y-p.h*0.56*p.s); c.lineTo(p.x-2*p.s,p.y-p.h*0.54*p.s);
  c.moveTo(p.x+8*p.s,p.y-p.h*0.56*p.s); c.lineTo(p.x+2*p.s,p.y-p.h*0.54*p.s); c.stroke();
  // briciole di pane
  c.fillStyle='#e8c96b'; for(let i=0;i<5;i++) c.fillRect(p.x-12*p.s+i*6*p.s,p.y-p.h*0.62*p.s,3*p.s,2*p.s);
 },
 energia(c,p){ // MODERATORE ENERGIA∞ — contatore elettrico senziente
  big(c,p,'#2a3a4a','#1a2430',2.6);
  // quadrante LCD
  c.fillStyle='#0e1a12'; c.fillRect(p.x-12*p.s,p.y-p.h*0.54*p.s,24*p.s,12*p.s);
  c.fillStyle='#39FF14'; c.font='bold '+(8*p.s)+'px monospace'; c.textAlign='center';
  c.fillText(p.phase>=2?'∞':'99.9',p.x,p.y-p.h*0.45*p.s);
  // cavi laterali
  c.strokeStyle='#ffd94d'; c.lineWidth=2*p.s;
  c.beginPath(); c.moveTo(p.x-14*p.s,p.y-p.h*0.3*p.s); c.quadraticCurveTo(p.x-20*p.s+Math.sin(p.t*4)*4,p.y-p.h*0.2*p.s,p.x-14*p.s,p.y-p.h*0.1*p.s); c.stroke();
  c.beginPath(); c.moveTo(p.x+14*p.s,p.y-p.h*0.3*p.s); c.quadraticCurveTo(p.x+20*p.s-Math.sin(p.t*4)*4,p.y-p.h*0.2*p.s,p.x+14*p.s,p.y-p.h*0.1*p.s); c.stroke();
  // occhio singolo
  c.fillStyle='#fff'; c.beginPath(); c.arc(p.x,p.y-p.h*0.32*p.s,4*p.s,0,7); c.fill();
  c.fillStyle=p.phase>=2?'#f33':'#3af'; c.beginPath(); c.arc(p.x,p.y-p.h*0.32*p.s,2*p.s,0,7); c.fill();
 },
 archivio(c,p){ // L'ARCHIVISTA SUPREMO — mobile archivio su gambe
  big(c,p,'#4a4a5a','#33333f',2.7);
  // cassetti con maniglie
  for(let i=0;i<3;i++){ c.fillStyle='#5a5a6a'; c.fillRect(p.x-10*p.s,p.y-(20+i*10)*p.s,20*p.s,8*p.s);
    c.fillStyle='#c0c0c0'; c.fillRect(p.x-3*p.s,p.y-(17+i*10)*p.s,6*p.s,1.5*p.s); }
  // occhio singolo nel cassetto superiore
  c.fillStyle='#fff'; c.beginPath(); c.arc(p.x,p.y-p.h*0.52*p.s,3.5*p.s,0,7); c.fill();
  c.fillStyle='#111'; c.beginPath(); c.arc(p.x,p.y-p.h*0.52*p.s,1.7*p.s,0,7); c.fill();
  // carta che vola via (dove va a finire il fascicolo…)
  const fl=(p.t*1.5)%1;
  c.save(); c.translate(p.x+Math.sin(p.t*3)*14*p.s,p.y-p.h*0.72*p.s-fl*10*p.s); c.rotate(fl*6);
  c.fillStyle='#e8e8f0'; c.fillRect(-4*p.s,-3*p.s,8*p.s,6*p.s); c.restore();
 },
 cervellone(c,p){ // IL CERVELLONE — cervello cyber
  const pul=0.9+Math.sin(p.t*6)*0.1;
  // supporto macchina
  c.fillStyle='#2a2a3a'; c.fillRect(p.x-16*p.s,p.y-8*p.s,32*p.s,8*p.s);
  // cervello
  c.fillStyle='#f088a8'; c.beginPath(); c.ellipse(p.x,p.y-p.h*0.5*p.s,18*p.s*pul,14*p.s*pul,0,0,7); c.fill();
  c.strokeStyle='#b05a78'; c.lineWidth=2*p.s;
  for(let i=-2;i<=2;i++){ c.beginPath(); c.moveTo(p.x-15*p.s,p.y-p.h*0.5*p.s+i*5*p.s);
    c.quadraticCurveTo(p.x,p.y-p.h*0.5*p.s+i*7*p.s+(i%2?4:-4)*p.s,p.x+15*p.s,p.y-p.h*0.5*p.s+i*5*p.s); c.stroke(); }
  // tubi
  c.strokeStyle='#6af'; c.lineWidth=3*p.s;
  c.beginPath(); c.moveTo(p.x-18*p.s,p.y-p.h*0.45*p.s); c.lineTo(p.x-28*p.s,p.y-p.h*0.2*p.s); c.stroke();
  c.beginPath(); c.moveTo(p.x+18*p.s,p.y-p.h*0.45*p.s); c.lineTo(p.x+28*p.s,p.y-p.h*0.2*p.s); c.stroke();
  // occhio singolo
  c.fillStyle='#fff'; c.beginPath(); c.arc(p.x,p.y-p.h*0.52*p.s,6*p.s,0,7); c.fill();
  c.fillStyle=p.phase>=2?'#f33':'#3af'; c.beginPath(); c.arc(p.x,p.y-p.h*0.52*p.s,3*p.s,0,7); c.fill();
 }
};
function big(c,p,top,bot,s){ body(c,p,top,bot,s); }
function eyes(c,p,col,pupil){ const s=p.s;
  c.fillStyle=col; c.beginPath(); c.arc(p.x-4*s,p.y-p.h*0.44*s,1.8*s,0,7); c.arc(p.x+4*s,p.y-p.h*0.44*s,1.8*s,0,7); c.fill(); }

/* ---------- API: disegna un attore generico ---------- */
function drawActor(c,a){
  const p={x:a.x,y:a.y,s:a.s,h:a.h,dir:a.dir||1,t:a.t||0,walk:a.walk||0,vx:a.vx||0,using:a.using,attackPose:a.attackPose,attackPoseT:a.attackPoseT,attackPoseMax:a.attackPoseMax,stripes:a.stripes,phase:a.phase};
  c.save();
  if(a.hitFlash>0){ c.filter='brightness(2.2)'; }
  if(a.squash){ c.translate(a.x,a.y); c.scale(1+a.squash,a.squash?1-a.squash*0.7:1); c.translate(-a.x,-a.y); }
  if(p.attackPoseT>0&&p.attackPose){
    const progress=1-p.attackPoseT/(a.attackPoseMax||0.72), reach=8+Math.max(0,Math.min(1,Math.sin(progress*PI)))*12;
    const trailColor=p.attackPose==='quake'||p.attackPose==='fryer'?'#ffb347':p.attackPose==='disco'?'#ff6bd6':p.attackPose==='redact'?'#9adcff':'#fff1a6';
    c.save();c.globalAlpha=0.28;c.strokeStyle=trailColor;c.lineWidth=2.5*p.s;
    for(let trail=0;trail<3;trail++){const yy=a.y-(19+trail*5)*a.s;c.beginPath();c.moveTo(a.x+a.dir*(10+trail*4)*a.s,yy);c.lineTo(a.x+a.dir*(reach+trail*5)*a.s,yy-4*a.s);c.stroke();}
    c.restore();
  }
  if(a.draw==='chars'&&CH[a.id]) CH[a.id](c,p);
  else  if(a.draw==='en'&&EN[a.id]) EN[a.id](c,p);  else if(a.draw==='boss'&&BOSS[a.id]) BOSS[a.id](c,p);
  /* segni del danno: graffi, lividi e colate quando la vita cala — il combattimento si vede addosso */
  const wound=(a.hp!=null&&a.maxHp)?Math.min(1,Math.max(0,1-a.hp/a.maxHp)):0;
  if(wound>0.22){
    c.save();
    c.globalAlpha=Math.min(0.9,0.35+wound*0.6);
    c.strokeStyle='#6e0f22'; c.lineWidth=1.5*p.s; c.lineCap='round';
    const marks=wound>0.55?4:2;
    for(let i=0;i<marks;i++){
      const sx=p.x+(((i*11)%17)-8)*p.s, sy=p.y-p.h*(0.16+0.09*i)*p.s;
      c.beginPath(); c.moveTo(sx,sy); c.lineTo(sx+5*p.s,sy+3.5*p.s); c.lineTo(sx+2*p.s,sy+6*p.s); c.stroke();
    }
    if(wound>0.5){
      const drip=(p.t*46%14)*p.s;
      c.fillStyle='rgba(126,18,38,0.75)';
      c.beginPath(); c.ellipse(p.x-6.5*p.s,p.y-p.h*0.22*p.s+drip*0.25,1.5*p.s,3*p.s+drip*0.35,0,0,PI*2); c.fill();
      c.beginPath(); c.ellipse(p.x+5.5*p.s,p.y-p.h*0.25*p.s+drip*0.18,1.3*p.s,2.4*p.s+drip*0.3,0,0,PI*2); c.fill();
    }
    c.restore();
  }
  /* varianti NPC: stesso mostro, facce diverse — cappellino, occhiali, bandana o cresta */
  if(a.draw==='en'&&a.variant!=null&&EN[a.id]){
    const v=a.variant%4, vy=p.y-p.h*0.52*p.s, vc=['#ff8c42','#222','#ff4d6d','#ffe34c'][v];
    c.save();
    if(v===0){ c.fillStyle=vc;c.beginPath();c.arc(p.x,vy,6.4*p.s,PI,2*PI);c.fill();c.fillRect(p.x-7*p.s,vy-0.8*p.s,14*p.s,2*p.s); }
    else if(v===1){ c.fillStyle=vc;c.fillRect(p.x-5.4*p.s,vy+2.2*p.s,10.8*p.s,2.6*p.s);c.fillRect(p.x-1.2*p.s,vy+3*p.s,2.4*p.s,1*p.s); }
    else if(v===2){ c.fillStyle=vc;c.fillRect(p.x-7*p.s,vy+0.6*p.s,14*p.s,3*p.s);c.beginPath();c.moveTo(p.x+p.dir*7*p.s,vy+1.2*p.s);c.lineTo(p.x+p.dir*13*p.s,vy+4.4*p.s);c.lineTo(p.x+p.dir*7*p.s,vy+4*p.s);c.closePath();c.fill(); }
    else { c.fillStyle=vc;for(let m=-1;m<=1;m++){c.beginPath();c.moveTo(p.x+m*3*p.s,vy+1*p.s);c.lineTo(p.x+m*3*p.s+1.6*p.s,vy-7*p.s);c.lineTo(p.x+m*3*p.s+3.2*p.s,vy+1*p.s);c.closePath();c.fill();} }
    c.globalAlpha=0.16;c.fillStyle=vc;c.fillRect(p.x-11*p.s,p.y-32*p.s,22*p.s,22*p.s);
    c.restore();
  }
  c.restore();
}

/* ---------- Fondali livelli ---------- */
function drawBG(c,W,H,lv,t){
  c.save();
  const gs=SAVE.data.settings.quality;
  if(lv===1){ // ospedale
    c.fillStyle='#0e2418'; c.fillRect(0,0,W,H);
    // parete: linoleum a bande sottili (a zoom alto gli scacchi enormi pesano)
    const sq=24; for(let y=0;y<H;y+=sq) for(let x=0;x<W;x+=sq){
      c.fillStyle=((x+y)/sq)%2?'#163028':'#122921'; c.fillRect(x,y,sq,sq); }
    // luci neon sfarfallanti
    const fl=(Math.sin(t*13)>0.4||Math.sin(t*31)>0.7)?1:0.25;
    c.fillStyle='rgba(120,255,180,'+(0.10*fl)+')'; c.fillRect(0,0,W,H);
    for(let x=30;x<W;x+=140){ c.fillStyle='rgba(150,255,200,'+(0.5*fl)+')'; c.fillRect(x,20,50,6); }
    // tubazioni e travi al soffitto (niente buchi in alto)
    c.fillStyle='#0a1a12'; c.fillRect(0,0,W,18);
    for(let x=0;x<W;x+=96){ c.fillStyle='#12291f'; c.fillRect(x,4,88,8); c.fillStyle='#1c4433'; c.fillRect(x+10,6,60,3); }
    // porte del reparto: stipite, oblò con croce, cartello e spia rossa
    for(let x=80;x<W;x+=260){
      c.fillStyle='#08150e'; c.fillRect(x-6,H*0.18-8,82,H*0.34+16);
      c.fillStyle='#122c1f'; c.fillRect(x,H*0.18,70,H*0.34);
      c.fillStyle='#1e4030'; c.fillRect(x+5,H*0.18+5,60,H*0.34-10);
      const wy=H*0.18+18;
      c.fillStyle='rgba(140,220,180,'+(0.35+0.3*fl)+')'; c.fillRect(x+20,wy,30,38);
      c.strokeStyle='#0a1f14'; c.lineWidth=3; c.beginPath();
      c.moveTo(x+35,wy); c.lineTo(x+35,wy+38); c.moveTo(x+20,wy+19); c.lineTo(x+50,wy+19); c.stroke();
      c.fillStyle='#9aa8a0'; c.fillRect(x+56,wy+18,8,4); // maniglia
      c.fillStyle='#0c2016'; c.fillRect(x+8,H*0.18-26,54,16);
      c.fillStyle='#59ffb0'; c.font='bold 10px Arial'; c.textAlign='center';
      c.fillText('REPARTO '+(1+((x/260)|0)%9),x+35,H*0.18-14);
      c.fillStyle='rgba(255,80,60,'+(0.4+0.4*Math.sin(t*3+x))+')'; c.beginPath(); c.arc(x+35,H*0.18-34,5,0,PI*2); c.fill();
    }
    // flebo e monitor cardiaco tra le porte
    for(let x=210;x<W;x+=260){
      c.strokeStyle='#8aa89a'; c.lineWidth=2; c.beginPath(); c.moveTo(x,40); c.lineTo(x,H*0.52); c.stroke();
      c.fillStyle='#dfe9e4'; c.fillRect(x-8,48,16,22);
      c.fillStyle='rgba(90,255,170,0.3)'; c.fillRect(x-8,62,16,8);
      c.fillStyle='#04120a'; c.fillRect(x-26,H*0.34,52,30);
      c.strokeStyle='#39FF88'; c.lineWidth=2; c.beginPath();
      const by=H*0.34+15; c.moveTo(x-22,by);
      c.lineTo(x-10,by); c.lineTo(x-6,by-9); c.lineTo(x-2,by+7); c.lineTo(x+2,by-12); c.lineTo(x+6,by); c.lineTo(x+22,by); c.stroke();
    }
    // macchie e toppe di decadimento sul muro
    for(let x=40;x<W;x+=310){
      c.fillStyle='rgba(20,50,36,0.5)'; c.beginPath(); c.ellipse(x,H*0.62,34,14,0.3,0,PI*2); c.fill();
      c.strokeStyle='rgba(60,120,90,0.35)'; c.lineWidth=2; c.beginPath();
      c.moveTo(x-18,H*0.6); c.lineTo(x-6,H*0.64); c.lineTo(x+4,H*0.6); c.lineTo(x+16,H*0.65); c.stroke();
    }
  } else if(lv===2){ // parcheggio
    c.fillStyle='#1a1208'; c.fillRect(0,0,W,H);
    // colonne
    for(let x=60;x<W;x+=180){ c.fillStyle='#3a3a30'; c.fillRect(x,H*0.1,34,H*0.62); c.fillStyle='#e8a020'; c.fillRect(x,H*0.1,34,10); }
    // auto parcheggiate silhouette
    for(let x=30;x<W;x+=170){ const col=['#7a3030','#30607a','#7a6a30','#5a3060'][(x/170|0)%4];
      c.fillStyle=col; c.fillRect(x,H*0.42,110,46); c.fillStyle='#111'; c.fillRect(x+14,H*0.42-22,70,26);
      c.beginPath(); c.arc(x+22,H*0.42+46,10,0,7); c.arc(x+88,H*0.42+46,10,0,7); c.fill(); }
    // lampade arancioni
    for(let x=100;x<W;x+=240){ c.fillStyle='rgba(255,160,40,0.10)'; c.beginPath(); c.arc(x,60,90,0,7); c.fill(); }
    c.fillStyle='#0c0804'; c.fillRect(0,H*0.72,W,H*0.28);
  } else if(lv===3){ // commissariato
    c.fillStyle='#101a14'; c.fillRect(0,0,W,H);
    c.fillStyle='#1c3028'; for(let y=0;y<H*0.7;y+=120) c.fillRect(0,y,W,2);
    // faldoni impilati
    for(let x=20;x<W;x+=130){ for(let i=0;i<5;i++){ c.fillStyle=i%2?'#c8b880':'#b8a870'; c.fillRect(x,H*0.55-i*12,80,10);} }
    // bacheca
    c.fillStyle='#4a3a20'; c.fillRect(W-240,30,200,130); c.fillStyle='#d8cfa8'; c.fillRect(W-230,40,180,110);
    c.fillStyle='#888'; c.fillRect(W-220,55,60,40); c.fillRect(W-150,70,50,35);
    c.fillStyle='rgba(200,255,220,0.05)'; c.fillRect(0,0,W,H);
  } else if(lv===4){ // supermercato
    c.fillStyle='#141820'; c.fillRect(0,0,W,H);
    // scaffali
    for(let x=40;x<W;x+=200){ c.fillStyle='#2a3038'; c.fillRect(x,H*0.14,120,H*0.52);
      for(let r=0;r<4;r++) for(let i=0;i<5;i++){ c.fillStyle='hsl('+((x+r*30+i*47)%360)+',60%,55%)'; c.fillRect(x+8+i*22,H*0.16+r*(H*0.12),16,22); } }
    // cartelli OFFERTA
    for(let x=140;x<W;x+=280){ c.fillStyle='#ffd94d'; c.beginPath(); c.moveTo(x-40,40); c.lineTo(x+40,40); c.lineTo(x+30,70); c.lineTo(x-30,70); c.fill();
      c.fillStyle='#d33'; c.font='bold 14px Arial'; c.textAlign='center'; c.fillText('OFFERTA',x,61); }
    c.fillStyle='#20242c'; c.fillRect(0,H*0.68,W,H*0.32);
    c.fillStyle='rgba(255,255,255,0.03)'; for(let x=0;x<W;x+=60) c.fillRect(x,H*0.68,2,H*0.32);
  } else if(lv===5){ // metropolitana
    c.fillStyle='#0a1420'; c.fillRect(0,0,W,H);
    // piastrelle
    const sq=36; for(let y=0;y<H*0.7;y+=sq) for(let x=0;x<W;x+=sq){ c.fillStyle=((x+y)/sq)%2?'#12283c':'#0e2033'; c.fillRect(x,y,sq,sq); }
    // tabelloni
    for(let x=60;x<W;x+=300){ c.fillStyle='#041008'; c.fillRect(x,26,150,40);
      c.fillStyle='#3f8'; c.font='10px monospace'; c.textAlign='left';
      c.fillText('TRENO: '+(Math.floor(t*7)%99)+' min', x+8, 42); c.fillText('RITARDO: ∞', x+8, 56); }
    // binario
    c.fillStyle='#060a10'; c.fillRect(0,H*0.7,W,H*0.3);
    c.fillStyle='#222'; c.fillRect(0,H*0.72,W,8); c.fillRect(0,H*0.72+16,W,8);
  } else if(lv===6){ // luna park
    c.fillStyle='#160e1e'; c.fillRect(0,0,W,H);
    // ruota panoramica
    c.strokeStyle='#4a3a5a'; c.lineWidth=6; c.beginPath(); c.arc(W*0.78,H*0.28,110,0,7); c.stroke();
    for(let i=0;i<8;i++){ const a=t*0.15+i*PI/4; c.fillStyle=['#c33','#3a6','#36a','#a63'][i%4];
      c.beginPath(); c.arc(W*0.78+Math.cos(a)*110,H*0.28+Math.sin(a)*110,13,0,7); c.fill();
      c.strokeStyle='#4a3a5a'; c.beginPath(); c.moveTo(W*0.78,H*0.28); c.lineTo(W*0.78+Math.cos(a)*110,H*0.28+Math.sin(a)*110); c.stroke(); }
    // insegne neon rotte
    for(let x=70;x<W;x+=240){ const on=Math.sin(t*5+x)>-0.3;
      c.fillStyle=on?'#ff4dd2':'#3a2038'; c.fillRect(x,70,120,26); }
    // giostra
    c.fillStyle='#3a2a4a'; c.beginPath(); c.moveTo(W*0.15,H*0.5); c.lineTo(W*0.15+180,H*0.5); c.lineTo(W*0.15+90,H*0.32); c.fill();
    c.fillStyle='#222'; c.fillRect(0,H*0.72,W,H*0.28);
  } else if(lv===7){ // ufficio
    c.fillStyle='#10121a'; c.fillRect(0,0,W,H);
    // finestre città
    for(let x=20;x<W;x+=150){ c.fillStyle='#1a2030'; c.fillRect(x,30,110,H*0.3);
      c.fillStyle='#2a3a5a'; for(let wy=40;wy<H*0.3;wy+=20) for(let wx=x+8;wx<x+100;wx+=18) if((wx*wy)%7>2){ c.fillStyle=(wx+wy)%3?'#3a5a8a':'#ffd94d'; c.fillRect(wx,wy,10,12);} }
    // scrivanie
    for(let x=50;x<W;x+=220){ c.fillStyle='#2a2f3a'; c.fillRect(x,H*0.5,140,16);
      c.fillStyle='#181c26'; c.fillRect(x+8,H*0.5+16,10,60); c.fillRect(x+120,H*0.5+16,10,60);
      c.fillStyle='#0a0f0a'; c.fillRect(x+30,H*0.5-40,80,40); c.fillStyle='#4f8'; c.fillRect(x+34,H*0.5-36,30,3); }
    c.fillStyle='#1a1e28'; c.fillRect(0,H*0.7,W,H*0.3);
  } else if(lv===8){ // ospizio — sala comune
    c.fillStyle='#1a1410'; c.fillRect(0,0,W,H);
    // carta da parati a fiori
    for(let x=20;x<W;x+=70) for(let y=20;y<H*0.62;y+=60){
      c.fillStyle='#2a3a2a'; c.fillRect(x,y,2,8);
      c.fillStyle='#3a5a3a'; c.beginPath(); c.arc(x+1,y+2,4,0,7); c.fill(); }
    // poltrone
    for(let x=60;x<W;x+=280){ c.fillStyle='#6b3a2a'; c.fillRect(x,H*0.32,90,50);
      c.fillStyle='#8a4a34'; c.fillRect(x+6,H*0.32-10,78,18);
      c.fillStyle='#4a2818'; c.fillRect(x+8,H*0.32+50,10,12); c.fillRect(x+72,H*0.32+50,10,12); }
    //orologio da parete fermo
    c.strokeStyle='#4a3a20'; c.lineWidth=6; c.beginPath(); c.arc(W-120,90,42,0,7); c.stroke();
    c.fillStyle='#e8e0c8'; c.beginPath(); c.arc(W-120,90,38,0,7); c.fill();
    c.strokeStyle='#222'; c.lineWidth=3; c.beginPath(); c.moveTo(W-120,90); c.lineTo(W-120+30*Math.cos(3.6),90+30*Math.sin(3.6)); c.stroke();
    c.fillStyle='#241c14'; c.fillRect(0,H*0.68,W,H*0.32);
  } else if(lv===9){ // aeroporto — gate di imbarco
    c.fillStyle='#141824'; c.fillRect(0,0,W,H);
    // vetrate panoramica con aerei
    for(let x=0;x<W;x+=180){ c.fillStyle='#0a1020'; c.fillRect(x,20,160,H*0.4);
      c.fillStyle='#22304a'; c.fillRect(x+4,24,152,H*0.4-8);
      c.fillStyle='#c8d4e8'; c.fillRect(x+30,70,60,10); c.fillRect(x+70,62,26,10);
      c.fillStyle='#f4c84a'; c.fillRect(x+92,66,18,6); }
    // montanti
    for(let x=0;x<=W;x+=180){ c.fillStyle='#3a4358'; c.fillRect(x-4,20,8,H*0.42); }
    // pannelli partenze
    for(let x=60;x<W;x+=240){ c.fillStyle='#041008'; c.fillRect(x,26,150,44);
      c.fillStyle='#3f8'; c.font='10px monospace'; c.textAlign='left';
      c.fillText('VOLTO: RITARDO ∞',x+8,44); c.fillText('GATE 0: CHIUSO',x+8,60); }
    // file di sedie plastica
    for(let x=50;x<W;x+=130){ c.fillStyle='#2a3140'; c.fillRect(x,H*0.48,54,16); c.fillRect(x+6,H*0.48+16,8,14); c.fillRect(x+40,H*0.48+16,8,14); }
    c.fillStyle='#1c2028'; c.fillRect(0,H*0.7,W,H*0.3);
  } else if(lv===10){ // discoteca — pista luminosa
    c.fillStyle='#0a0612'; c.fillRect(0,0,W,H);
    // pista luminosa animata
    for(let y=H*0.44;y<H*0.7;y+=52) for(let x=0;x<W;x+=52){
      const hue=((x+y)*0.9+t*90)%360;
      c.fillStyle='hsla('+hue+',80%,55%,0.22)';
      c.fillRect(x+2,y+2,48,48); }
    // sfera specchiata
    c.save(); c.translate(W*0.5,86);
    c.strokeStyle='#444'; c.beginPath(); c.moveTo(0,0); c.lineTo(0,-86); c.stroke();
    for(let a=0;a<8;a++){ c.fillStyle=(a+t*3)%2?'#c8d4e8':'#8898b8';
      c.beginPath(); c.arc(Math.cos(a)*24,Math.sin(a*1.7)*22+14,12,0,7); c.fill(); }
    c.restore();
    // laser
    c.strokeStyle='rgba(255,47,176,0.35)'; c.lineWidth=2;
    for(let i=0;i<4;i++){ const a=Math.sin(t*2+i)*0.7;
      c.beginPath(); c.moveTo(W*0.2+i*180,60); c.lineTo(W*0.2+i*180+a*180,H*0.5); c.stroke(); }
    // casse
    for(let x=30;x<W;x+=330){ c.fillStyle='#241a30'; c.fillRect(x,H*0.2,64,90);
      c.fillStyle='#0e0a14'; c.beginPath(); c.arc(x+32,H*0.2+34,22,0,7); c.fill();
      c.fillStyle='#4a3a5a'; c.beginPath(); c.arc(x+32,H*0.2+34,10,0,7); c.fill(); }
    c.fillStyle='#140c1e'; c.fillRect(0,H*0.7,W,H*0.3);
  } else if(lv===11||lv===12){ // stadio e tribuna VIP — campo e tribuna
    c.fillStyle='#0e1810'; c.fillRect(0,0,W,H);
    // tribuna con folla colorata
    c.fillStyle='#1a2028'; c.fillRect(0,10,W,H*0.34);
    for(let x=10;x<W;x+=26) for(let y=20;y<H*0.32;y+=18){
      c.fillStyle='hsl('+((x*7+y*13)%360)+',60%,'+(38+((x+y)%3)*8)+'%)';
      c.fillRect(x,y,16,10); }
    // riflettori
    for(let x=100;x<W;x+=280){ c.fillStyle='#2a2a30'; c.fillRect(x,0,8,26);
      c.fillStyle='rgba(255,255,240,0.8)'; c.fillRect(x-22,20,52,10);
      c.fillStyle='rgba(255,255,240,0.06)'; c.beginPath(); c.moveTo(x,30); c.lineTo(x-90,H*0.5); c.lineTo(x+90,H*0.5); c.closePath(); c.fill(); }
    // campo con strisce falciate
    for(let x=0;x<W;x+=64){ c.fillStyle=(x/64)%2?'#1e4a24':'#1a4020'; c.fillRect(x,H*0.44,64,H*0.26); }
    // porte da calcio
    c.strokeStyle='#d8d8e0'; c.lineWidth=4;
    c.strokeRect(60,H*0.42,90,34); c.strokeRect(W-150,H*0.42,90,34);
    c.fillStyle='#10241a'; c.fillRect(0,H*0.7,W,H*0.3);
  } else if(lv===13){ // casa abbandonata: carta da parati che si sfoglia, quadri storti, lampadario
    c.fillStyle='#1c1424'; c.fillRect(0,0,W,H);
    // carta da parati a fiorami scuri con macchie di umidità
    for(let x=16;x<W;x+=64) for(let y=16;y<H*0.62;y+=52){
      c.fillStyle='rgba(120,90,150,0.16)';c.beginPath();c.arc(x,y,7,0,PI*2);c.fill();
      c.fillStyle='rgba(90,60,120,0.22)';c.fillRect(x-2,y+6,4,10);
    }
    for(let i=0;i<10;i++){ const mx=(i*137)%W,my=40+(i*79)%(H*0.5);
      c.fillStyle='rgba(20,12,30,0.35)';c.beginPath();c.ellipse(mx,my,44+i%3*18,26+i%4*10,0.3,0,PI*2);c.fill(); }
    // quadri storti con occhi che guardano
    for(let x=60;x<W;x+=230){
      c.save();c.translate(x,H*0.22);c.rotate(Math.sin(x)*0.12);
      c.fillStyle='#6b4a2a';c.fillRect(-26,-20,52,40);
      c.fillStyle='#241a30';c.fillRect(-20,-14,40,28);
      c.fillStyle='#ffd94d';c.beginPath();c.arc(-7,-2,3,0,PI*2);c.arc(7,-2,3,0,PI*2);c.fill();
      c.fillStyle='#111';c.beginPath();c.arc(-7,-2,1.3,0,PI*2);c.arc(7,-2,1.3,0,PI*2);c.fill();
      c.restore();
    }
    // lampadario pendulo che dondola
    c.save();c.translate(W*0.5+Math.sin(t*0.7)*22,26);c.rotate(Math.sin(t*0.7)*0.1);
    c.strokeStyle='#8a6a3a';c.lineWidth=3;c.beginPath();c.moveTo(0,0);c.lineTo(0,52);c.stroke();
    c.fillStyle='#c9a44a';c.beginPath();c.arc(0,58,16,PI,2*PI);c.fill();
    for(let cch=0;cch<7;cch++){const a=PI+(cch/6)*PI;c.fillStyle='#e8cf8a';c.beginPath();c.arc(Math.cos(a)*22,58+Math.sin(a)*8,3.2,0,PI*2);c.fill();}
    c.restore();
    const flick=(Math.sin(t*17)>0.6||Math.sin(t*5)>0.92)?1:0.28;
    c.fillStyle='rgba(255,214,120,'+(0.07*flick)+')';c.fillRect(0,0,W,H);
    // scala e pianerottolo
    c.fillStyle='#2a1c34';c.fillRect(0,H*0.62,W,H*0.1);
    for(let s=0;s<9;s++){c.fillStyle=s%2?'#3a2a44':'#322338';c.fillRect(W*0.08+s*26,H*0.62-s*13,26,13);}
    // ragnatele negli angoli
    c.strokeStyle='rgba(220,220,240,0.22)';c.lineWidth=1;
    for(let g=0;g<7;g++){const gx=W-30-g*16;c.beginPath();c.moveTo(W,20+g*8);c.lineTo(gx,20);c.moveTo(W,20+g*8);c.lineTo(W-8,20+g*12);c.stroke();}
    c.fillStyle='#160e1e';c.fillRect(0,H*0.72,W,H*0.28);
  } else if(lv===14){ // tribunale: boiserie, colonne, bilancia della giustizia e pubblico
    c.fillStyle='#2a1c14';c.fillRect(0,0,W,H);
    // boiserie in legno con pannelli
    for(let x=0;x<W;x+=120){
      c.fillStyle='#3a2818';c.fillRect(x,20,112,H*0.46);
      c.fillStyle='#4a3420';c.fillRect(x+8,32,96,H*0.46-30);
      c.fillStyle='rgba(255,220,150,0.06)';c.fillRect(x+12,36,88,H*0.46-42);
    }
    // colonne marmoree
    for(let x=30;x<W;x+=300){
      c.fillStyle='#c8b898';c.fillRect(x,26,34,H*0.5);
      c.fillStyle='#e8dcc0';c.fillRect(x+6,26,8,H*0.5);
      c.fillStyle='#b0a080';c.fillRect(x-6,20,46,12);c.fillRect(x-6,H*0.52,46,12);
    }
    // stemma e motto
    c.save();c.translate(W*0.5,86);
    c.fillStyle='#8a6a3a';c.beginPath();c.arc(0,0,36,0,PI*2);c.fill();
    c.fillStyle='#ffd94d';c.font='bold 30px Arial';c.textAlign='center';c.fillText('§',0,11);
    c.fillStyle='#e8cf8a';c.font='bold 12px Arial';c.fillText('LA LEGGE È UGUALE PER TUTTI (MA NON PER TE)',0,58);
    c.restore();
    // panca del giudice
    c.fillStyle='#4a2c18';c.fillRect(W*0.32,H*0.42,W*0.36,H*0.12);
    c.fillStyle='#5a3a22';c.fillRect(W*0.3,H*0.4,W*0.4,18);
    c.fillStyle='#8a5a3a';c.fillRect(W*0.47,H*0.36,W*0.06,H*0.05); // martelletto sul bancone
    // bilancia della giustizia storta
    c.save();c.translate(W*0.16,H*0.32);c.rotate(Math.sin(t*1.2)*0.09);
    c.strokeStyle='#c9a44a';c.lineWidth=3;c.beginPath();c.moveTo(0,0);c.lineTo(0,-40);c.moveTo(-32,-38);c.lineTo(32,-38);c.stroke();
    c.fillStyle='#c9a44a';c.beginPath();c.arc(-32,-30,11,0,PI);c.arc(32,-30,11,0,PI);c.fill();
    c.restore();
    // pubblico in silouette che sbuffa
    for(let i=0;i<22;i++){
      const px=20+(i*97)%(W-40),py=H*0.62+((i*53)%46), bob=Math.sin(t*1.4+i)*2;
      c.fillStyle=i%2?'#160e12':'#1e1418';
      c.beginPath();c.arc(px,py+bob,12,PI,2*PI);c.fill();c.fillRect(px-12,py+bob,24,26);
    }
    c.fillStyle='#3a2416';c.fillRect(0,H*0.72,W,H*0.28);
    c.fillStyle='rgba(255,220,150,0.07)';for(let x=0;x<W;x+=90)c.fillRect(x,H*0.72,44,H*0.28);
  } else if(lv===15){ // laboratorio finale: vasche luminose e terminali di contenimento
    c.fillStyle='#0e0a1a'; c.fillRect(0,0,W,H);
    for(let x=24;x<W;x+=128){
      const pulse=0.5+Math.sin(t*2.1+x*0.03)*0.18;
      c.fillStyle='#202238'; c.fillRect(x,56,74,H*0.43);
      c.fillStyle='rgba(82,242,255,'+pulse+')'; c.fillRect(x+7,72,60,5);
      c.fillStyle='rgba(155,67,255,0.22)'; c.fillRect(x+10,90,54,H*0.31);
      c.strokeStyle='rgba(82,242,255,0.32)'; c.lineWidth=2; c.strokeRect(x+7,68,60,H*0.37);
    }
    c.strokeStyle='rgba(82,242,255,0.25)'; c.lineWidth=3;
    for(let i=0;i<5;i++){const y=30+i*32;c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
    c.save();c.translate(W/2,H*0.32);c.rotate(t*0.8);
    c.strokeStyle='#52f2ff';c.lineWidth=5;c.beginPath();c.arc(0,0,62,0,PI*2);c.stroke();
    c.strokeStyle='#9b43ff';c.lineWidth=3;c.beginPath();c.ellipse(0,0,82,30,t*0.2,0,PI*2);c.stroke();c.restore();
    c.fillStyle='#1a1428';c.fillRect(0,H*0.7,W,H*0.3);
  } else { // cervellone — sala macchine
    c.fillStyle='#0e0a1a'; c.fillRect(0,0,W,H);
    // Fasci di tubi, valvole e cablaggi luminosi con moto lento.
    for(let i=0;i<6;i++){ const y=40+i*36, hue=(t*40+i*60)%360;
      c.fillStyle='hsl('+hue+',70%,'+(30+Math.sin(t*3+i)*8)+'%)';
      c.fillRect(0,y,W,10);
      c.fillStyle='rgba(255,255,255,0.15)'; c.fillRect(0,y+2,W,2);
      for(let x=22+i*11;x<W;x+=164){c.fillStyle='#33314b';c.fillRect(x,y-5,12,20);c.fillStyle=i%2?'#52f2ff':'#ff6bd6';c.fillRect(x+4,y+1,4,6);}
    }
    c.strokeStyle='rgba(82,242,255,0.18)'; c.lineWidth=3;
    for(let x=24;x<W;x+=180){c.beginPath();c.moveTo(x,0);c.lineTo(x,26);c.lineTo(x+32,40);c.lineTo(x+32,H*0.28);c.stroke();}
    // ventola gigante al centro
    c.save(); c.translate(W/2,H*0.34); c.rotate(t*0.8);
    c.fillStyle='#2a2438'; for(let i=0;i<5;i++){ c.rotate(PI*2/5); c.beginPath(); c.ellipse(0,-40,16,40,0,0,7); c.fill(); }
    c.restore();
    c.fillStyle='#1a1428'; c.beginPath(); c.arc(W/2,H*0.34,14,0,7); c.fill();
    // vapore colorato
    for(let i=0;i<7;i++){ const x=(i*137+t*22)%(W+100)-50, y=H*0.55+Math.sin(t*1.3+i)*30;
      c.fillStyle='rgba('+((i*67)%200)+',120,'+((i*97)%180)+',0.06)';
      c.beginPath(); c.arc(x,y,50+i*7,0,7); c.fill(); }
    c.fillStyle='#120c20'; c.fillRect(0,H*0.74,W,H*0.26);
  }
  c.restore();
}

/* ---------- Pavimento v2: prerender offscreen, rovinato, palette per livello ----------
   Piastrelle di larghezza irregolare, crepe, macchie e dettagli tematici
   (strisce parcheggio, linea tattile stazioni, pista discoteca, manto stadio…).
   Il pavimento è statico: lo si disegna UNA volta su canvas offscreen e poi
   si fa blit ogni frame (zero costo). */
let gCache=null, gKey='';
function floorPal(lv){ /* [base, piastrella scura, bordo parete, dettaglio] */
  const P={
    1:['#2a3c34','#22322c','#33473d','#182420'],  /* ospedale: linoleum verde-acqua sporco */
    2:['#3a3630','#2e2a25','#46423a','#221f1a'],  /* parcheggio: cemento */
    3:['#2a3830','#22302a','#354539','#1a2620'],  /* commissariato */
    4:['#333844','#292e38','#3f4552','#20242e'],  /* supermercato: resina */
    5:['#26313e','#1e2833','#313e4c','#181f28'],  /* metropolitana */
    6:['#332640','#281e33','#403050','#1e1626'],  /* luna park */
    7:['#31343e','#272a33','#3d414c','#1e2028'],  /* ufficio: moquette */
    8:['#3c3226','#30281e','#493d2e','#241e16'],  /* ospizio: parquet */
    9:['#323a48','#282f3a','#404a5a','#1e242e'],  /* aeroporto */
    10:['#241a30','#1c1425','#2e2240','#160f20'], /* discoteca */
    11:['#24522c','#1d4424','#2d6236','#163418'], /* stadio: manto */
    12:['#3a3038','#2f262c','#483c46','#221c22'], /* tribuna VIP: tappeto */
    13:['#2e2238','#241a2c','#3a2c46','#180f22'], /* casa abbandonata */
    14:['#4a3420','#3a2818','#5a4028','#241608'], /* tribunale: legno */
    15:['#241c34','#1c1528','#2f2442','#150f20']  /* sala macchine */
  };
  return P[lv]||P[1];
}
function buildFloor(lv,W){
  const cv=document.createElement('canvas');
  cv.width=W; cv.height=96;
  const g=cv.getContext('2d');
  const [base,dk,,line]=floorPal(lv);
  g.fillStyle=base; g.fillRect(0,0,W,96);
  /* piastrelle irregolari (non una scacchiera uniforme) */
  const tz=48;
  for(let y=0;y<96;y+=tz){ let x=0; const row=(y/tz)|0;
    while(x<W){ const w=tz+((x*7+row*13)%17)-8;
      g.fillStyle=((x/tz|0)+row)%2?dk:base;
      g.fillRect(x,y,w,tz);
      g.fillStyle='rgba(0,0,0,0.18)'; g.fillRect(x,y,w,2); /* giunto in ombra */
      x+=w;
    }
    g.fillStyle='rgba(0,0,0,0.22)'; g.fillRect(0,y+tz-2,W,2);
  }
  /* crepe + macchie: PRNG con seed fisso per livello (pavimento stabile) */
  let s=lv*97+13; const rr=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
  g.strokeStyle='rgba(0,0,0,0.4)'; g.lineWidth=1.5;
  for(let i=0;i<W/34;i++){
    let cx=rr()*W, cy=rr()*96;
    g.beginPath(); g.moveTo(cx,cy);
    for(let k=0;k<4;k++){ cx+=(rr()-0.5)*26; cy+=rr()*12; g.lineTo(cx,cy); }
    g.stroke();
  }
  for(let i=0;i<W/60;i++){ g.fillStyle='rgba(0,0,0,'+(0.08+rr()*0.12).toFixed(2)+')';
    g.beginPath(); g.ellipse(rr()*W,rr()*96,10+rr()*22,4+rr()*7,0,0,7); g.fill(); }
  /* bordo parete: linea di luce */
  g.fillStyle='rgba(255,255,255,0.07)'; g.fillRect(0,0,W,3);
  g.fillStyle=line; g.fillRect(0,3,W,2);
  /* dettagli tematici per livello */
  if(lv===2){ for(let x=20;x<W;x+=130){ g.fillStyle='rgba(230,190,60,0.5)'; g.fillRect(x,30,6,60); } }
  if(lv===5||lv===9){ for(let x=40;x<W;x+=200){ g.fillStyle='rgba(230,190,60,0.35)';
    for(let k=0;k<6;k++) g.fillRect(x+k*10,40,6,16); } } /* linea tattile */
  if(lv===10){ for(let y=0;y<96;y+=24) for(let x=0;x<W;x+=24){
    g.fillStyle='hsla('+((x+y*3)%360)+',70%,50%,0.10)'; g.fillRect(x+2,y+2,20,20); } }
  if(lv===11||lv===12){ for(let x=0;x<W;x+=64){ g.fillStyle='rgba(255,255,255,0.05)'; g.fillRect(x,0,32,96); } }
  if(lv===8){ g.strokeStyle='rgba(0,0,0,0.25)'; g.lineWidth=1;
    for(let x=0;x<W;x+=90){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,96); g.stroke(); } }
  /* Grana e scheggiature stabili: più materia visiva senza costo per frame. */
  g.save();
  for(let i=0;i<Math.floor(W/18);i++){
    const x=(i*137+lv*53)%W, y=(i*47+lv*19)%96;
    g.fillStyle=i%4===0?'rgba(255,255,255,0.11)':'rgba(0,0,0,0.12)';
    g.beginPath(); g.ellipse(x,y,2+i%5,1+i%3,(i%7)*0.3,0,PI*2); g.fill();
  }
  g.strokeStyle='rgba(255,255,255,0.12)'; g.lineWidth=1;
  g.beginPath(); g.moveTo(0,7); g.lineTo(W,7); g.stroke();
  g.restore();
  return cv;
}
function drawGround(c,W,H,t,lv){
  /* larghezza fissa 1024: copre sempre tutta l'arena (max 960) senza buchi */
  const key='f'+lv;
  if(!gCache||gKey!==key){ gCache=buildFloor(lv,1024); gKey=key; }
  const gy=H-96;
  c.drawImage(gCache,0,gy);
  /* riflesso di luce che corre lungo il bordo (skip su qualità bassa) */
  if(SAVE.data.settings.quality!=='low'){
    c.fillStyle='rgba(255,255,255,0.05)';
    for(let x=((t*40)%80)-80;x<W;x+=80) c.fillRect(x,gy,40,2);
  }
}

return { drawActor, drawBG, drawGround, mainColor };
})();