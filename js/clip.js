/* ===== UNHINGED WARFARE — Clip virali (auto-highlight + watermark) ===== */
window.CLIP=(function(){
let session=null;
const MAX_CLIPS=6;

function begin(S){
  session={ frames:[], peakCombo:0, lastMile:0, ults:0, phase:0, startTime:Date.now(), done:false };
}
/* Osserva la partita: cattura frame ai momenti epici */
function observe(S,canvas){
  if(!session){ if(S&&!S.over) begin(S); else return; }
  if(session.done)return;
  const c=Math.max(S.combo,S.maxCombo);
  if(c>session.peakCombo) session.peakCombo=c;
  const milestone=Math.floor(c/8);
  if(milestone>session.lastMile){
    session.lastMile=milestone;
    snap(canvas);
  }
  if(S.ultsUsed>(session.ults||0)){ session.ults=S.ultsUsed; snap(canvas); }
  if(S.boss&&S.boss.phase>(session.phase||0)){ session.phase=S.boss.phase; snap(canvas); }
}
function snap(canvas){
  try{
    const off=document.createElement('canvas');
    const w=Math.min(480,canvas.width), h=Math.round(w*canvas.height/canvas.width);
    off.width=w; off.height=h;
    const cx=off.getContext('2d');
    cx.drawImage(canvas,0,0,w,h);
    /* watermark */
    cx.fillStyle='rgba(0,0,0,0.45)'; cx.fillRect(0,h-26,w,26);
    cx.fillStyle='#E8FF00'; cx.font='bold 13px Arial'; cx.textAlign='left';
    cx.fillText('UNHINGED WARFARE',8,h-9);
    cx.fillStyle='#FF2FB0'; cx.textAlign='right';
    cx.fillText('#UnhingedWarfare',w-8,h-9);
    session.frames.push(off.toDataURL('image/jpeg',0.55));
    if(session.frames.length>10) session.frames.shift();
  }catch(e){}
}
/* Chiude la sessione e restituisce la clip (una sola volta) */
function finish(){
  if(!session||session.done){ session=null; return null; }
  session.done=true;
  let clip=null;
  if(session.frames.length>=2){
    const d=new Date();
    clip={ name:'CAOS_'+d.getHours()+String(d.getMinutes()).padStart(2,'0'),
      time:d.toLocaleDateString(), score:session.peakCombo||0,
      frames:session.frames.slice(-6), date:Date.now() };
    const list=SAVE.data.clips||[];
    list.unshift(clip);
    SAVE.data.clips=list.slice(0,MAX_CLIPS);
    SAVE.trophy('clip');
    SAVE.save();
  }
  session=null;
  return clip;
}
/* Condivisione: Web Share API con immagini, fallback download strip */
async function share(clip){
  if(!clip)return;
  const text='UNHINGED WARFARE — la mia clip più assurda! COMBO x'+clip.score+' #UnhingedWarfare';
  try{
    if(navigator.share){
      /* prova a condividere la strip come immagine */
      const blob=await stripBlob(clip);
      const files=blob?[new File([blob],'unhinged_warfare.jpg',{type:'image/jpeg'})]:undefined;
      if(files&&navigator.canShare&&navigator.canShare({files})){
        await navigator.share({files,text,title:'UNHINGED WARFARE'}); return;
      }
      await navigator.share({text,title:'UNHINGED WARFARE'}); return;
    }
  }catch(e){ /* utente ha annullato o non supportato → fallback */ }
  /* fallback: scarica la strip con watermark */
  try{
    const blob=await stripBlob(clip);
    if(!blob)return;
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=(clip.name||'unhinged_clip')+'.jpg';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  }catch(e){}
}
/* Compositing: strip verticale dei frame con watermark grande */
function stripBlob(clip){
  return new Promise(res=>{
    const frames=clip.frames||[]; if(!frames.length){res(null);return;}
    const fw=360, fh=Math.round(fw*9/16);
    const off=document.createElement('canvas');
    off.width=fw; off.height=fh*Math.min(frames.length,3);
    const cx=off.getContext('2d');
    cx.fillStyle='#0c0a12'; cx.fillRect(0,0,off.width,off.height);
    frames.slice(0,3).forEach((src,i)=>{
      const im=new Image();
      im.onload=()=>{ cx.drawImage(im,0,i*fh,fw,fh); ready(); };
      im.onerror=()=>ready();
      im.src=src;
    });
    let pend=frames.slice(0,3).length;
    function ready(){ if(--pend>0)return;
      /* watermark grande */
      cx.fillStyle='rgba(0,0,0,0.55)'; cx.fillRect(0,off.height-40,off.width,40);
      cx.fillStyle='#E8FF00'; cx.font='bold 22px Arial'; cx.textAlign='left';
      cx.fillText('UNHINGED WARFARE',10,off.height-12);
      cx.fillStyle='#FF2FB0'; cx.textAlign='right';
      cx.fillText('#UnhingedWarfare',off.width-10,off.height-12);
      off.toBlob(b=>res(b),'image/jpeg',0.85);
    }
  });
}
function list(){ return SAVE.data.clips||[]; }
function remove(i){ const l=SAVE.data.clips||[]; l.splice(i,1); SAVE.data.clips=l; SAVE.save(); }

return { observe, finish, share, list, remove };
})();
