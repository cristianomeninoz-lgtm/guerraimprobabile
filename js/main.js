/* ===== UNHINGED WARFARE — Bootstrap e loop principale ===== */
(function(){
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');

function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.floor(window.innerWidth*dpr);
  canvas.height=Math.floor(window.innerHeight*dpr);
  canvas.style.width=window.innerWidth+'px';
  canvas.style.height=window.innerHeight+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.imageSmoothingEnabled=true;
}
window.addEventListener('resize',resize);
resize();

UI.init(canvas,ctx);
UI.tick(0);

let last=performance.now(), running=true;
document.addEventListener('visibilitychange',()=>{ running=!document.hidden; last=performance.now(); });

function frame(now){
  const dt=Math.min(0.05,(now-last)/1000);
  last=now;
  if(running) UI.tick(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
