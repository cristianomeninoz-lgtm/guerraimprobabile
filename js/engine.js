/* ===== UNHINGED WARFARE — Motore di gioco (logica pura) ===== */
window.ENGINE=(function(){
const W=960,H=720,GY=640;
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function threeDActive(){ return !!(window.THREE3D&&window.THREE3D.isActive&&window.THREE3D.isActive()); }
function laneDistance(a,b){ return Math.abs((a.laneZ||0)-(b.laneZ||0)); }
function combatDistance(S,a,b){
  return S.use3D ? Math.hypot(a.x-b.x,(a.y||0)-(b.y||0),laneDistance(a,b)) : dist(a,b);
}

/* ---------- Stato base di una partita ---------- */
function baseState(mode,opts){
  opts=opts||{};
  return {
    mode, levelIdx:opts.levelIdx||0, environmentIdx:null, duelCpu:!!opts.duelCpu, constraint:(opts.constraint!=null&&opts.constraint>=0)?opts.constraint:-1,
    use3D:false, explorationPOIs:[], discoveredPOIs:0, explorationComplete:false, nearbyPoi:null, interactHintT:0,
    paused:false, over:false, win:false, t:0,
    wave:0, wavesTotal:0, waveTimer:0, betweenWaves:1.5, spawnQueue:0, spawnT:0,
    chaos:0, combo:0, comboT:0, maxCombo:0, hits:0, kills:0, coinsEarned:0, ultsUsed:0,
    screenShake:0, hitStop:0, flash:0, slowmo:0, slowAll:0, slowAllMax:0, cameraAimX:0, cameraAimY:0,
    dialog:null, dialogT:0, phaseMsg:null, phaseT:0,
    bossPhase:0, bossDefeated:false, clipFlag:false, clipArmT:0,
    player:null, ally:null, enemies:[], projs:[], fx:[], pickups:[], obstacles:[], vases:[], oilPools:[], secrets:[], secretFound:0, tempWeaponT:0, tempWeaponPrev:null,
    decals:[]
  };
}

/* ---------- Fabbrica giocatori ---------- */
function makePlayer(charId,x,colors,p2){
  const C=DATA.Chars[charId], look=SAVE.look(charId);
  return { kind:'player', charId, x, y:GY, vx:0, vy:0, laneZ:0, vz:0, s:C.scale*1.35, h:64,
    dir:p2?-1:1, hp:C.hp, maxHp:C.hp, speed:C.speed,
    atkT:0, abCd:0, abCdMax:C.ability.cd, using:0, usingT:0,
    leadT:0, invT:0, hitFlash:0, squash:0, walk:0, t:Math.random()*9, slowT:0,
    chaosCharge:0, ultActive:0, ultPose:null, ultPoseT:0, dead:false, faceLockT:0,
    colors: colors||{outfit:look.outfit,weapon:look.weapon,hat:look.hat,color:look.color},
    tripleShots:0, attackPose:null, attackPoseT:0, attackPoseMax:0, dashCd:0, buf:{}, restrictMelee:false, restrictSkill:false
  };
}

/* ---------- Fabbrica nemici ---------- */
const ESTATS={
  nurse:{hp:26,spd:.8,dmg:8,rng:26,coin:3},
  gurney:{hp:40,spd:1.3,dmg:12,rng:30,coin:4,charge:true},
  drone:{hp:22,spd:1.1,dmg:7,rng:220,coin:4,ranged:true},
  cart:{hp:30,spd:1.8,dmg:10,rng:28,coin:3,charge:true},
  folder:{hp:16,spd:1.5,dmg:6,rng:170,coin:2,ranged:true},
  clerk:{hp:34,spd:.7,dmg:9,rng:28,coin:4},
  granny:{hp:44,spd:.9,dmg:11,rng:200,coin:6,ranged:true},
  passenger:{hp:28,spd:1.0,dmg:8,rng:26,coin:3},
  clown:{hp:32,spd:1.6,dmg:9,rng:30,coin:5,jumpy:true},
  plant:{hp:24,spd:.5,dmg:10,rng:34,coin:3},
  silla:{hp:26,spd:2.0,dmg:8,rng:26,coin:3,charge:true},
  shredder:{hp:48,spd:.6,dmg:12,rng:190,coin:6,ranged:true},
  wheelchair:{hp:34,spd:1.9,dmg:11,rng:28,coin:4,charge:true},
  knitter:{hp:30,spd:.7,dmg:9,rng:210,coin:5,ranged:true},
  suitcase:{hp:36,spd:1.4,dmg:10,rng:30,coin:4,charge:true},
  steward:{hp:26,spd:1.2,dmg:8,rng:200,coin:5,ranged:true},
  dancer:{hp:28,spd:2.1,dmg:9,rng:26,coin:4,jumpy:true},
  barman:{hp:38,spd:.8,dmg:10,rng:230,coin:6,ranged:true},
  ultrass:{hp:40,spd:1.7,dmg:11,rng:28,coin:5,jumpy:true},
  mascotte:{hp:46,spd:.9,dmg:12,rng:30,coin:6},
  spettro:{hp:30,spd:1.35,dmg:10,rng:175,coin:5,ranged:true},
  ratto:{hp:22,spd:2.2,dmg:8,rng:26,coin:3,charge:true},
  usciere:{hp:46,spd:.9,dmg:13,rng:30,coin:6},
  avvocato:{hp:32,spd:1.05,dmg:10,rng:215,coin:6,ranged:true}
};
function makeEnemy(type,x,mult){
  const st=ESTATS[type]||ESTATS.nurse;
  return { kind:'enemy', type, x, y:GY, vx:0, vy:0, laneZ:0, vz:0, s:1.25, h:58, dir:-1,
    hp:st.hp*(mult||1), maxHp:st.hp*(mult||1), spd:st.spd, dmg:Math.round(st.dmg*0.75),
    rng:st.rng, coin:st.coin, ranged:st.ranged, charge:st.charge, jumpy:st.jumpy,
    atkT:rnd(0.3,1.5), hitFlash:0, squash:0, t:Math.random()*9, walk:0, dead:false,
    stunT:0, burnT:0, burnDmg:0, baseSpd:st.spd, variant:ri(0,3) };
}

/* ---------- Fabbrica boss ---------- */
const BSTATS={
  bendaggio:{hp:420,spd:.9,dmg:16,coin:80,rng:64},
  custode:{hp:480,spd:1.0,dmg:18,coin:90,rng:70},
  timbro:{hp:520,spd:.8,dmg:20,coin:100,rng:150},
  coupon:{hp:560,spd:1.0,dmg:20,coin:110,rng:180},
  capotreno:{hp:620,spd:1.2,dmg:22,coin:120,rng:70},
  palloncino:{hp:660,spd:1.0,dmg:22,coin:130,rng:80},
  manager:{hp:700,spd:.9,dmg:24,coin:140,rng:160},
  badante:{hp:740,spd:1.1,dmg:24,coin:150,rng:70},
  gatekeep:{hp:740,spd:1.0,dmg:17,coin:160,rng:190},
  deejay:{hp:790,spd:1.1,dmg:18,coin:170,rng:170},
  allenatore:{hp:860,spd:1.2,dmg:27,coin:180,rng:80},
  bandierona:{hp:900,spd:1.1,dmg:28,coin:190,rng:75},
  cervellone:{hp:999,spd:.7,dmg:19,coin:250,rng:200},
  fritto:{hp:880,spd:1.1,dmg:19,coin:0,rng:80},
  energia:{hp:690,spd:0.95,dmg:11,coin:0,rng:150},
  archivio:{hp:850,spd:1.05,dmg:19,coin:0,rng:80},
  fantasma:{hp:820,spd:1.15,dmg:21,coin:200,rng:165},
  giudice:{hp:930,spd:1.0,dmg:25,coin:210,rng:120}
};
function makeBoss(id,mult){
  const st=BSTATS[id];
  return { kind:'boss', type:id, x:W-140, y:GY, vx:0, vy:0, laneZ:0, vz:0, s:1.9, h:74, dir:-1,
    hp:st.hp*(mult||1), maxHp:st.hp*(mult||1), spd:st.spd, dmg:st.dmg, rng:st.rng,
    coin:st.coin, phase:0, atkT:2, hitFlash:0, squash:0, t:0, walk:0, dead:false,
    stunT:0, minionT:5, enraged:false, ranged:id==='timbro'||id==='coupon'||id==='manager'||id==='gatekeep'||id==='deejay'||id==='energia'||id==='cervellone'||id==='fantasma'||id==='giudice' };
}

/* ---------- Ostacoli e vasi ---------- */
function makeObstacles(levelId){
  const obs=[], n=ri(2,3);
  const L=DATA.Levels[levelId-1];
  /* usa gli ostacoli progettati del livello; posizionati ai lati dell'arena per non ostruire la telecamera */
  const types=(L&&L.obst&&L.obst.length)?L.obst:['vending','sbarra','stampzone','shelf','train','molla','copier','ventola'];
  const type=types[(levelId-1)%types.length];
  for(let i=0;i<n;i++) {
    const laneSide = (i % 2 === 0 ? 1 : -1) * rnd(50, 95);
    obs.push({type, x:rnd(180,W-180), y:GY, laneZ:laneSide, w:60, h:40, cd:rnd(2,5), t:rnd(0,9)});
  }
  return obs;
}
function makeVases(){
  const v=[]; for(let i=0;i<ri(3,5);i++) v.push({x:rnd(80,W-80), y:GY, laneZ:rnd(-100,100), alive:true, respawnT:0, t:rnd(0,9)});
  return v;
}
const SECRET_NAMES=['IL TACCHINO DELL’APOCALISSE','PORTA 404: IL BAGNO QUANTICO','IL PAPA DELLE ANATRE','LA LUNA È UN FORMAGGIO'];
function makeSecrets(levelIdx){
  const levels=[1,4,7,10],index=levels.indexOf(levelIdx),found=SAVE.data.secrets||{};
  if(index<0)return [];
  const salt=(levelIdx+1)*73;
  return [{id:'secret-'+(index+1),index,x:120+((salt*37)%700),laneZ:index%2?-92:92,y:GY,used:!!found['secret-'+(index+1)],hint:'?'}];
}
function triggerSecret(S,secret,p){
  if(!secret||secret.used)return;
  secret.used=true;SAVE.data.secrets=SAVE.data.secrets||{};SAVE.data.secrets[secret.id]=Date.now();
  p.hp=Math.min(p.maxHp,p.hp+30);p.abCd=0;p.chaosCharge=clamp(p.chaosCharge+35,0,100);
  if(secret.index===0)p.ultActive=Math.max(p.ultActive,2.5);
  if(secret.index===1){p.speed*=1.18;p.secretSpeedUntil=S.t+18;}
  if(secret.index===2){p.tripleShots=3;p.tripleUntil=S.t+3.5;}
  if(secret.index===3){S.slowAll=2.2;S.slowAllMax=2.2;}
  S.secretFound=(S.secretFound||0)+1;S.coinsEarned+=80;SAVE.trophy('secret'+(secret.index+1));
  S.phaseMsg=SECRET_NAMES[secret.index]+'! BONUS +80';S.phaseT=3;
  addFx(S,p.x,p.y-36,'ult',['#ff4d6d','#52f2ff','#ffe36e','#ff6bd6'][secret.index],130,p.laneZ);
  const count=Object.keys(SAVE.data.secrets).filter(function(id){return /^secret-[1-4]$/.test(id);}).length;
  if(count>=4){SAVE.trophy('allSecrets');SAVE.unlockChar('lucia');}
  SAVE.save();AUDIO.ult();
}
function attachSecretVase(S){
  if(!S.secrets||!S.secrets.length||!S.vases||!S.vases.length)return;
  const secret=S.secrets[0],v=S.vases[0];
  v.x=secret.x;v.laneZ=secret.laneZ;v.secret=secret;
}
function makeExplorationPOIs(levelIdx){
  const discoveries=SAVE.data.discoveries||{};
  const poiName=function(key,fallback){ return window.I18N&&window.SAVE?L(key):fallback; };
  const all=[
    [
      ['medCart','medical','CARRELLO DELLE CURE','MEDICAL SUPPLY CART',175,-83,'heal'],
      ['wardLocker','locker','ARMADIETTO SMARRITO','LOST PROPERTY LOCKER',390,84,'coins'],
      ['recordsTerminal','terminal','TERMINALE CARTELLE','PATIENT RECORDS TERMINAL',650,-86,'charge'],
      ['nightCache','cache','SCORTA DEL TURNO NOTTURNO','NIGHT SHIFT CACHE',805,85,'coins']
    ],
    [['parkingMeter','terminal','PARCOMETRO TRUCCATO','RIGGED PARKING METER',180,-78,'coins'],['towLocker','locker','ARMADIETTO DEL CARRO ATTREZZI','TOW-TRUCK LOCKER',430,82,'charge'],['lostBumper','cache','PARAURTI DISPERSO','MISSING BUMPER',690,-84,'heal']],
    [['evidenceBox','cache','SCATOLA DELLE PROVE','EVIDENCE BOX',190,82,'coins'],['caseFiles','terminal','FASCICOLI TOP SECRET','TOP-SECRET CASE FILES',475,-82,'charge'],['blueLocker','locker','ARMADIETTO BLU','BLUE LOCKER',770,84,'heal']],
    [['couponPrinter','terminal','STAMPANTE DEI COUPON','COUPON PRINTER',180,-84,'coins'],['lostCart','cache','CARRELLO ABBANDONATO','ABANDONED SHOPPING CART',500,82,'heal'],['freezerKey','locker','CHIAVE DEL CONGELATORE','FREEZER KEY',795,-80,'charge']],
    [['lastTicket','cache','ULTIMO BIGLIETTO','THE LAST TICKET',185,84,'coins'],['ghostTimetable','terminal','ORARIO DEI TRENI FANTASMA','GHOST TRAIN TIMETABLE',490,-84,'charge'],['platformCase','locker','VALIGIA SUL BINARIO','SUITCASE ON THE PLATFORM',785,82,'heal']],
    [['parkToken','cache','GETTONE DEL LUNA PARK','FUNFAIR TOKEN',175,-84,'coins'],['rideControl','terminal','QUADRO DELLA RUOTA','FERRIS WHEEL CONTROLS',480,82,'charge'],['prizeCabinet','locker','ARMADIO DEI PREMI','PRIZE CABINET',790,-84,'heal']],
    [['meetingMemo','cache','VERBALE MAI APPROVATO','NEVER-APPROVED MINUTES',180,82,'coins'],['boardroomTablet','terminal','TABLET DELLA RIUNIONE','BOARDROOM TABLET',475,-84,'charge'],['quietRoom','locker','STANZA DEL SILENZIO','QUIET ROOM',790,84,'heal']],
    [['knitBasket','cache','CESTO DEI FERRI','KNITTING BASKET',180,-82,'coins'],['medicineChart','terminal','TABELLONE DELLE PASTIGLIE','MEDICATION CHART',490,84,'heal'],['gardenKey','locker','CHIAVE DEL GIARDINO','GARDEN KEY',790,-82,'charge']],
    [['boardingPass','cache','CARTA D’IMBARCO','BOARDING PASS',180,82,'coins'],['gateConsole','terminal','CONSOLE DEL GATE 0','GATE 0 CONSOLE',490,-84,'charge'],['baggageTag','locker','ETICHETTA BAGAGLIO','BAGGAGE TAG',795,82,'heal']],
    [['glowBracelet','cache','BRACCIALETTO FLUO','GLOW BRACELET',180,-84,'coins'],['djSetlist','terminal','PLAYLIST PROIBITA','FORBIDDEN SETLIST',490,82,'charge'],['mirrorballFuse','locker','FUSIBILE DELLA SFERA','MIRRORBALL FUSE',795,-84,'heal']],
    [['captainArmband','cache','FASCIA DA CAPITANO','CAPTAIN’S ARMBAND',180,82,'coins'],['scoreConsole','terminal','TABELLONE DELLO 0-0','THE 0-0 SCOREBOARD',490,-84,'charge'],['lockerRoom','locker','SPOGLIATOIO OSPITI','AWAY TEAM LOCKER',795,82,'heal']],
    [['vipPass','cache','PASS DELLA TRIBUNA VIP','VIP STAND PASS',180,-84,'coins'],['varArchive','terminal','ARCHIVIO DEL VAR','VAR ARCHIVE',490,82,'charge'],['trophyCabinet','locker','VETRINA DEL TROFEO','TROPHY CABINET',795,-84,'heal']],
    [['spiritBoard','cache','TAVOLA OUIJA SMARRITA','LOST OUIJA BOARD',180,-82,'charge'],['hauntedFuse','terminal','FUSIBILE MALEDETTO','HAUNTED FUSE BOX',490,84,'coins'],['atticKey','locker','CHIAVE DEL SOFFITTA','ATTIC KEY',795,-82,'heal']],
    [['gavelCase','cache','TECA DEL MARTELLETTO','GAVEL CASE',180,82,'coins'],['evidenceLocker','terminal','ARMADIO DELLE PROVE','EVIDENCE LOCKER',490,-84,'charge'],['sentenceFile','locker','FASCICOLI DELLA SENTENZA','SENTENCE FILE',795,82,'heal']],
    [['coreShard','cache','SCAGLIA DEL NUCLEO','CORE SHARD',180,82,'charge'],['brainLog','terminal','DIARIO DEL CERVELLONE','THE BIG BRAIN’S LOG',490,-84,'coins'],['escapePod','locker','POD DI EMERGENZA','EMERGENCY ESCAPE POD',795,82,'heal']]
  ];
  const level=all[levelIdx];
  if(!level)return [];
  return level.map(function(entry,index){
    const hospitalIds={medCart:'hospital:med-cart',wardLocker:'hospital:ward-locker',recordsTerminal:'hospital:records-terminal',nightCache:'hospital:night-shift-cache'};
    const id=levelIdx===0?hospitalIds[entry[0]]:'level'+(levelIdx+1)+':'+entry[0];
    const name=levelIdx===0&&index===0?poiName('poiMedCart',entry[2]):
      levelIdx===0&&index===1?poiName('poiWardLocker',entry[2]):
      levelIdx===0&&index===2?poiName('poiRecordsTerminal',entry[2]):
      levelIdx===0&&index===3?poiName('poiNightCache',entry[2]):
      poiName('poiLevelNames.'+(levelIdx+1)+'.'+entry[0],SAVE.data.lang==='en'?entry[3]:entry[2]);
    return {id,type:entry[1],name,x:entry[4],y:GY,laneZ:entry[5],used:!!discoveries[id],reward:entry[6],index};
  });
}
function setExploration(S,levelIdx){
  S.explorationPOIs=makeExplorationPOIs(levelIdx);
  S.discoveredPOIs=S.explorationPOIs.filter(function(poi){return poi.used;}).length;
  S.explorationComplete=S.explorationPOIs.length>0&&S.explorationPOIs.every(function(poi){return poi.used;});
}
function interactWithPoi(S,poi,p){
  if(!poi||poi.used||!SAVE.recordDiscovery(poi.id)) return;
  poi.used=true; S.discoveredPOIs++;
  const secrets=(S.explorationPOIs||[]);
  const completesLevel=secrets.length>0&&!S.explorationComplete&&secrets.every(function(item){return item.used;});
  S.lastPoiName=poi.name;
  if(poi.reward==='heal'){
    const healed=Math.min(35,p.maxHp-p.hp); p.hp+=healed;
    S.coinsEarned+=20; addFx(S,p.x,p.y-42,'pop','#39FF14',1.3,poi.laneZ);
  } else if(poi.reward==='charge'){
    p.abCd=0; p.chaosCharge=clamp(p.chaosCharge+18,0,100); S.coinsEarned+=25;
    addFx(S,p.x,p.y-42,'pop','#52f2ff',1.3,poi.laneZ);
  } else {
    S.coinsEarned+=40; S.chaos=clamp(S.chaos+4,0,100);
    addFx(S,p.x,p.y-42,'pop','#ffd94d',1.3,poi.laneZ);
  }
  if(completesLevel){
    S.explorationComplete=true; S.coinsEarned+=75; S.chaos=clamp(S.chaos+10,0,100);
    S.lastPoiName=poi.name+' — '+L('secretSetComplete');
    addFx(S,p.x,p.y-58,'ult','#ffd94d',1.5,poi.laneZ);
  }
  S.interactHintT=completesLevel?3.4:2.2; S.nearbyPoi=null;
  AUDIO.coin();
  if(navigator.vibrate&&SAVE.data.settings.haptics) navigator.vibrate([18,24,18]);
}

/* ---------- Proiettili, FX, pickup ---------- */
function shoot(S,from,tx,ty,speed,dmg,col,kind,owner,toLaneZ){
  const originY=from.y-40*(from.s||1);
  const aimY=S.use3D?originY:from.y; // lascia invariata la traiettoria del renderer Canvas2D
  const targetY=S.use3D?ty-40:ty;
  const a=Math.atan2(targetY-aimY,tx-from.x);
  const laneZ=from.laneZ||0, targetLane=toLaneZ==null?laneZ:toLaneZ;
  const travelTime=Math.hypot(tx-from.x,targetY-originY)/Math.max(1,speed);
  S.projs.push({x:from.x,y:from.y-40*(from.s||1),vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,
    dmg,col:col||'#ffd94d',kind:kind||'bullet',owner:owner||'enemy',life:2.5,t:0,laneZ,laneV:travelTime>0?(targetLane-laneZ)/travelTime:0});
}
function effectLane(S,x,y,laneZ){
  if(laneZ!=null)return laneZ;
  let nearest=null, best=Infinity;
  const consider=function(a){
    if(!a||a.dead)return;
    const d=Math.hypot((a.x||0)-x,(a.y||0)-y);
    if(d<best){best=d;nearest=a;}
  };
  consider(S.player); consider(S.ally); consider(S.boss);
  (S.enemies||[]).forEach(consider);
  return nearest?(nearest.laneZ||0):0;
}
function addFx(S,x,y,kind,col,mag,laneZ){      const fxLife={ring:0.45,chain:0.72,tide:0.78,quake:0.8,whistle:0.7,button:0.85,slam:0.7,disco:0.8,fryer:0.75,overdrive:0.82,redact:0.72,triple:0.7};
  S.fx.push({x,y,kind,col:col||'#fff',mag:mag||1,t:0,life:fxLife[kind]||0.5,
    r:0, vx:kind==='bit'?rnd(-90,90):0, vy:kind==='bit'?rnd(-160,-40):0, txt:kind==='dmg'?col:0,laneZ:effectLane(S,x,y,laneZ)});
}
/* numero di danno fluttuante (juice + leggibilità del combattimento) */
function dmgNumber(S,x,y,d,crit,laneZ){
  if(SAVE.data.settings.quality==='low')return;
  S.fx.push({x:x+rnd(-8,8),y,kind:'dmg',col:String(Math.round(d)),txt:String(Math.round(d)),crit:!!crit,t:0,life:0.8,r:0,vx:0,vy:0,mag:1,laneZ:laneZ||0});
}
function dropPickup(S,x,forced,laneZ){
  const r=Math.random(), types=['coin','coin','coin','heart','charge','coin'];
  const type=forced||types[Math.floor(r*types.length)];
  S.pickups.push({x,y:GY,laneZ:laneZ||0,vx:rnd(-60,60),vy:-180,type,t:0,life:9});
}

/* ---------- Danno ---------- */
function hurtEnemy(S,e,dmg,knock,fromX){
  if(e.dead)return 0;
  e.hp-=dmg; e.hitFlash=0.16; e.woundT=0.38;
  /* impatto graduato: più il colpo è grosso, più il mondo trema e si ferma */
  const heavy=dmg>=20, mid=dmg>=12;
  if(heavy){S.hitStop=Math.max(S.hitStop||0,0.06);S.screenShake=Math.max(S.screenShake||0,4.2);}
  else if(mid){S.hitStop=Math.max(S.hitStop||0,0.035);S.screenShake=Math.max(S.screenShake||0,2.4);}
  else S.screenShake=Math.max(S.screenShake||0,1.2);
  if(knock){ e.x+=(fromX!==undefined&&fromX>e.x?-1:1)*(knock||0); e.stunT=Math.max(e.stunT,0.18); }
  addFx(S,e.x,e.y-30,'hit',heavy?'#ffd94d':'#fff',heavy?1.8:1.1,e.laneZ);
  /* schizzi splatter sul pavimento e burst cartoon */
  if((mid||heavy)&&Math.random()<0.85)addDecal(S,e.x+rnd(-18,18),e.y+rnd(-6,6),rnd(0,1)>0.4?'#8a0b1d':'#630512',rnd(.45,.95),e.laneZ);
  const bloodCount=heavy?8:mid?5:3;
  for(let i=0;i<bloodCount;i++){
    const angle=-Math.PI*0.88+Math.random()*Math.PI*0.76,speed=45+Math.random()*110;
    S.fx.push({x:e.x+rnd(-6,6),y:e.y-30+rnd(-6,6),kind:'blood',col:i%3===0?'#780516':i%2?'#b51e36':'#ff2a44',t:0,life:0.28+Math.random()*0.18,mag:heavy?1.6:1.2,r:rnd(1.8,3.4),vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,laneZ:e.laneZ||0});
  }
  if(heavy){
    for(let b=0;b<4;b++){
      const ba=Math.random()*Math.PI*2, bspd=60+Math.random()*80;
      S.fx.push({x:e.x,y:e.y-28,kind:'splatter',col:'#940b1e',t:0,life:0.35,mag:1.4,r:rnd(2.5,4.5),vx:Math.cos(ba)*bspd,vy:Math.sin(ba)*bspd-40,laneZ:e.laneZ||0});
    }
  }
  dmgNumber(S,e.x,e.y-52,dmg,!!knock&&knock>=6,e.laneZ);
  if(e.hp<=0){ S.hitStop=Math.max(S.hitStop||0,0.08); killEnemy(S,e); return 2; }
  return 1;
}
function addDecal(S,x,y,col,size,laneZ){
  if(!S.decals)return;
  S.decals.push({x,y:y+2,col,size:size||1,laneZ:laneZ||0,t:0});
  if(S.decals.length>70)S.decals.splice(0,S.decals.length-70);
}
function killEnemy(S,e){
  e.dead=true; S.kills++;
  /* macchia di sangue permanente e splatter burst cartoon esagerato */
  addDecal(S,e.x,e.y,'#6b0717',e.kind==='boss'?3.2:1.6,e.laneZ);
  for(let i=0;i<(e.kind==='boss'?12:7);i++)addDecal(S,e.x+rnd(-36,36),e.y+rnd(-9,9),i%3===0?'#9e1128':i%2?'#78081a':'#520410',rnd(.5,1.25),e.laneZ);
  // Esplosione splatter cartoon di particelle ematiche
  const burstCount=e.kind==='boss'?26:14;
  for(let i=0;i<burstCount;i++){
    const ang=-Math.PI*0.95+Math.random()*Math.PI*0.9, spd=60+Math.random()*150;
    S.fx.push({x:e.x+rnd(-10,10),y:e.y-28+rnd(-8,8),kind:'blood',col:i%3===0?'#5e0614':i%2?'#c4142d':'#ff334b',t:0,life:0.32+Math.random()*0.24,mag:1.8,r:rnd(2.2,4.8),vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd-50,laneZ:e.laneZ||0});
  }
  if(e.kind==='boss'){
    if(!S.bossDefeated){ S.bossDefeated=true; onBossDefeated(S); }
    S.overT2=2.2; /* riarmato anche per boss multipli */
  }
  S.combo++; S.comboT=2.2; if(S.combo>S.maxCombo)S.maxCombo=S.combo;
  S.chaos=clamp(S.chaos+2.5,0,100);
  const coins=e.coin||3; S.coinsEarned+=coins;
  for(let i=0;i<6;i++) addFx(S,e.x,e.y-30,'bit','#ffd94d',1,e.laneZ);
  addFx(S,e.x,e.y-34,'pop','#fff',1,e.laneZ);
  dropPickup(S,e.x,null,e.laneZ);
  if(S.combo>=30) SAVE.trophy('combo30');
}
function hurtPlayer(S,p,dmg){
  if(p.dead||p.invT>0||p.leadT>0||p.ultActive>0)return;
  if(S.dialog)return; /* durante i dialoghi narrativi il giocatore è invulnerabile */
  if(p.abCd>0&&p.charId==='bruno')return;
  p.hp-=dmg; p.invT=1.1; p.hitFlash=0.25; S.screenShake=Math.max(S.screenShake,6);
  S.hurtFlash=Math.max(S.hurtFlash||0,0.85); /* vignetta rossa: il colpo si sente anche visivamente */
  S.combo=0; AUDIO.hurt(); S.hitStop=Math.max(S.hitStop||0,0.05);
  dmgNumber(S,p.x,p.y-60,dmg,true,p.laneZ);
  if(navigator.vibrate&&SAVE.data.settings.haptics) navigator.vibrate(35);
  addFx(S,p.x,p.y-30,'hit','#f44',1,p.laneZ);
  for(let i=0;i<5;i++)S.fx.push({x:p.x,y:p.y-30,kind:'blood',col:i%2?'#8a0b1d':'#e83a4f',t:0,life:0.3,mag:1.4,r:rnd(2,3.5),vx:(Math.random()-0.5)*120,vy:-45-Math.random()*85,laneZ:p.laneZ||0});
  if(p.hp<=0){ p.hp=0; p.dead=true; }
}
function hurtAlly(S,a,dmg){
  if(!a||a.dead||a.invT>0||a.ultActive>0)return;
  a.hp-=dmg; a.invT=0.7; a.hitFlash=0.2;
  if(a.hp<=0){ a.hp=0; a.dead=true; }
}
function hurtCombatTarget(S,target,dmg,knock,fromX){
  if(!target||target.dead)return;
  if(S.mode==='duel'&&target===S.ally&&target.kind==='player'){
    const before=target.hp;
    hurtAlly(S,target,dmg);
    if(target.hp<before){
      target.hitFlash=0.2;
      addFx(S,target.x,target.y-30,'hit','#fff',1,target.laneZ);
      for(let i=0;i<2;i++)S.fx.push({x:target.x,y:target.y-30,kind:'blood',col:i?'#b51e36':'#e83a4f',t:0,life:0.26,mag:1,r:1,vx:(Math.random()-0.5)*90,vy:-35-Math.random()*65,laneZ:target.laneZ||0});
      dmgNumber(S,target.x,target.y-52,dmg,!!knock&&knock>=6,target.laneZ);
      if(knock){target.x+=(fromX!==undefined&&fromX>target.x?-1:1)*knock;target.stunT=Math.max(target.stunT||0,0.15);}
    }
  } else if(target.kind==='player')hurtPlayer(S,target,dmg);
  else hurtEnemy(S,target,dmg,knock,fromX);
}

/* ---------- Abilità folle ---------- */
function useAbility(S,p){
  const C=DATA.Chars[p.charId];
  if(p.abCd>0||p.dead)return;
  if(p.restrictSkill)return;
  p.abCd=p.abCdMax; p.using=1; p.usingT=0.5; p.squash=0.25;
  if(S.mode==='duel')p.chaosCharge=clamp((p.chaosCharge||0)+6,0,100);
  const typ=C.ability.type;
  p.attackPose='ability:'+typ; p.attackPoseT=0.5; p.attackPoseMax=0.5;
  const impactY=p.y-30, lane=p.laneZ||0;
  const abilityTargets=(S.mode==='duel'?([p===S.player?S.ally:S.player].filter(Boolean)):(S.enemies||[]).concat(S.boss&&!S.boss.dead?[S.boss]:[])).filter(function(target){return !target.dead&&(!S.use3D||laneDistance(target,p)<115);});
  const hitAbilityTarget=function(target,damage,knock){
    hurtCombatTarget(S,target,damage,knock||0,p.x);
  };
  if(typ==='wave'){
    const R=190;
    addFx(S,p.x,impactY,'ring',p.charId==='mimi'?'#9adcff':C.theme,R,lane);
    abilityTargets.forEach(function(target){if(combatDistance(S,p,target)<R+30)hitAbilityTarget(target,target.kind==='boss'?C.ability.dmg*0.7:C.ability.dmg,C.ability.knock||12);});
  } else if(typ==='lead'){
    p.leadT=C.ability.dur; addFx(S,p.x,impactY,'ring','#aaa',80,lane);
  } else if(typ==='triple'){
    p.tripleShots=3; p.atkT=0; p.tripleUntil=S.t+3.5; addFx(S,p.x,impactY,'triple','#ffe27a',1,lane); AUDIO.heavy();
  } else if(typ==='throw'){
    const tgt=nearestTarget(S,p);
    const tx=tgt?tgt.x:p.x+p.dir*200, ty=tgt?tgt.y-20:p.y-20;
    const laneZ=p.laneZ||0, targetLane=tgt?(tgt.laneZ||0):laneZ;
    S.projs.push({x:p.x,y:p.y-40,vx:(tx-p.x)*1.2,vy:(ty-(p.y-40))*1.2,dmg:C.ability.dmg,col:'#7bc86c',kind:'boulder',owner:S.mode==='duel'&&p!==S.player?'enemy':'player',life:1.6,aoe:90,t:0,laneZ,laneV:(targetLane-laneZ)*1.2});
    addFx(S,p.x,impactY,'slam','#7bc86c',1,lane);
    AUDIO.heavy();
  } else if(typ==='fight'){
    const R=160;
    addFx(S,p.x-20,impactY,'ring','#ff8c42',R,lane);
    addFx(S,p.x+20,impactY,'ring','#ff8c42',R,lane);
    abilityTargets.forEach(function(target){if(combatDistance(S,p,target)<R+30)hitAbilityTarget(target,C.ability.dmg,target.kind==='boss'?14:20);});
  } else if(typ==='fry'){
    /* SANDRO: schizzi di olio bollente → pozze ustionanti nel tempo */
    const R=170;
    addFx(S,p.x,impactY,'ring','#ffb347',R,lane);
    let splashed=0;
    abilityTargets.forEach(function(target){
      if(combatDistance(S,p,target)>R+30)return;
      hitAbilityTarget(target,target.kind==='boss'?C.ability.dmg*0.7:C.ability.dmg,6);
      if(!target.dead&&!target.burnT){target.burnT=C.ability.dur;target.burnDmg=C.ability.burn;splashed++;}
    });
    /* pozza d'olio al suolo: brucia chi ci cammina sopra */
    S.oilPools.push({x:p.x+(Math.random()*140-70), laneZ:lane, life:C.ability.dur+2, dps:5, t:0, owner:S.mode==='duel'?(p===S.player?S.player:S.ally):null});
    if(splashed) AUDIO.heavy();
  } else if(typ==='battery'){
    /* PAOLO: risparmio energetico — il mondo va al 45%, la carica CAOS esplode */
    p.slowT=C.ability.dur; S.slowAll=C.ability.dur; S.slowAllMax=C.ability.dur;
    addFx(S,p.x,impactY,'ring','#39d98a',150,lane);
    S.flash=0.2; S.screenShake=Math.max(S.screenShake,4); p.ultPose='battery'; p.ultPoseT=0.62; p.attackPoseT=0.62; p.attackPoseMax=0.62; AUDIO.heavy();
  } else if(typ==='sweep'){
    /* LUCIA: spazza i proiettili nemici e li rimanda come bollette */
    const R=230;
    addFx(S,p.x,impactY,'ring','#c8e8ff',R,lane);
    let stolen=0;
    const hostileOwner=S.mode==='duel'&&p!==S.player?'player':'enemy';
    const reflectedOwner=hostileOwner==='player'?'enemy':'player';
    S.projs.forEach(pr=>{
      const hostile=pr.owner===hostileOwner;
      const steal=hostile&&(!S.use3D||laneDistance(pr,p)<115);
      if(!steal)return;
      if(Math.hypot(pr.x-p.x,pr.y-(p.y-30),S.use3D?laneDistance(pr,p):0)<R){
        pr.owner=reflectedOwner;
        pr.dmg=Math.max(pr.dmg,14); pr.col='#7ab8e8';
        pr.kind='bill'; pr.vx=-pr.vx*1.35; pr.vy=-pr.vy*1.35; pr.life=Math.max(pr.life,1.4);
        addFx(S,pr.x,pr.y,'hit','#7ab8e8'); stolen++;
      }
    });
    if(stolen) S.screenShake=Math.max(S.screenShake,3);
  }
  AUDIO.hit();
}
function nearestTarget(S,p){
  /* auto-mira: preferisce il BOSS quando è raggiungibile (i minion non devono
     mangiare i proiettili del giocatore) */
  const pool=S.mode==='duel'?[p===S.player?S.ally:S.player].filter(Boolean):S.enemies.concat(S.boss&&!S.boss.dead?[S.boss]:[]);
  let best=null,bd=1e9,bossD=null;
  pool.forEach(t=>{ if(!t.dead){ const d=combatDistance(S,p,t); if(t.kind==='boss'&&d<340&&bossD===null)bossD=d; if(d<bd){bd=d;best=t;} } });
  if(bossD!==null&&bossD<=bd*1.5) best=pool.find(t=>t.kind==='boss'&&!t.dead);
  return best;
}

/* ---------- Ultimate: una finisher distinta per ogni personaggio ---------- */
function ultimateTargets(S,p){
  if(S.mode==='duel'){
    const opponent=p===S.player?S.ally:S.player;
    return opponent&&!opponent.dead?[opponent]:[];
  }
  const list=(S.enemies||[]).filter(function(e){return !e.dead;});
  if(S.boss&&!S.boss.dead)list.push(S.boss);
  return list;
}
function ultimateHit(S,target,damage,knock,fromX){
  const prevHp=target?target.hp:0;
  const res=hurtCombatTarget(S,target,damage,knock||0,fromX);
  // Finisher cinematografica quando si batte un boss con l'Ultimate
  if(target&&(target.kind==='boss'||(S.mode==='duel'&&target===S.ally))&&prevHp>0&&target.hp<=0){
    S.finisherT=2.2;
    S.finisherMax=2.2;
    S.finisherBoss=target;
    S.screenShake=18;
    S.slowmo=0.15;
    AUDIO.bossRoar();
  }
  return res;
}
function useUltimate(S,p){
  if(!p||p.chaosCharge<100||p.dead)return;
  const C=DATA.Chars[p.charId], type=C.ult.type||'burst', dmg=C.ult.dmg, R=420;
  p.chaosCharge=0; p.ultPose=type; p.ultPoseT=1.25; p.using=1; p.usingT=0.72; p.squash=0.32; p.attackPose=type; p.attackPoseT=0.72; p.attackPoseMax=0.72; p.dir=p.dir||1;
  p.ultActive=type==='overdrive'?5:1.6;
  p.invT=Math.max(p.invT,type==='overdrive'?0.7:1.2);
  S.zoomKick=1.6; S.slowmo=type==='overdrive'?0.35:1.1;
  S.flash=type==='overdrive'?0.24:0.42; S.screenShake=type==='quake'||type==='button'?15:10;
  S.ultsUsed++;
  if(S.ultsUsed>=10) SAVE.trophy('ult10');
  const targets=ultimateTargets(S,p);
  const laneTargets=targets.filter(function(target){return !S.use3D||laneDistance(target,p)<115;});
  addFx(S,p.x,p.y-30,'ult',C.theme,420,p.laneZ);
  addFx(S,p.x,p.y-30,'flash',C.theme,1,p.laneZ);

  if(type==='chain'){
    let origin=p, remaining=laneTargets.slice(), jumps=0;
    while(remaining.length&&jumps<5){
      remaining.sort(function(a,b){return combatDistance(S,origin,a)-combatDistance(S,origin,b);});
      const next=remaining[0];
      if(combatDistance(S,origin,next)>(jumps?205:460))break;
      remaining.shift(); ultimateHit(S,next,dmg*Math.pow(0.76,jumps),10,p.x);
      const prev=origin;
      addFx(S,next.x,next.y-30,'chain',C.theme,Math.hypot(next.x-prev.x,next.y-prev.y),next.laneZ);
      origin=next; jumps++;
    }
  } else if(type==='tide'){
    const waveEnd=clamp(p.x+p.dir*145,30,W-30);
    addFx(S,p.x+p.dir*130,p.y-30,'tide','#9adcff',360,p.laneZ);
    laneTargets.forEach(function(e){
      if((e.x-p.x)*p.dir>-70&&Math.abs(e.x-p.x)<460){
        ultimateHit(S,e,dmg*1.15,38,p.x);
      }
    });
    p.x=waveEnd; p.vx=p.dir*3.2; p.invT=Math.max(p.invT,0.52);
  } else if(type==='quake'){
    addFx(S,p.x,p.y-12,'quake','#d6b77a',235,p.laneZ);
    laneTargets.forEach(function(e){if(combatDistance(S,p,e)<235){ultimateHit(S,e,dmg*1.25,54,p.x);}});
  } else if(type==='whistle'){
    addFx(S,p.x,p.y-30,'whistle','#fff1a6',R,p.laneZ);
    laneTargets.forEach(function(e){if(combatDistance(S,p,e)<R)ultimateHit(S,e,dmg*0.9,24,p.x);});
    const incomingOwner=S.mode==='duel'&&p!==S.player?'player':'enemy';
    const reflectedOwner=incomingOwner==='player'?'enemy':'player';
    S.projs.forEach(function(pr){if(pr.owner===incomingOwner&&(!S.use3D||laneDistance(pr,p)<115)){pr.owner=reflectedOwner;pr.dmg=Math.max(pr.dmg,dmg*0.45);pr.vx=-pr.vx*1.3;pr.vy=-pr.vy*1.3;pr.col='#fff1a6';}});
    laneTargets.forEach(function(e){if(e.dead&&e.coin)S.pickups.push({x:e.x,y:e.y-26,vx:0,vy:-85,type:'coin',t:0,life:4,laneZ:e.laneZ||p.laneZ||0});});
  } else if(type==='button'){
    addFx(S,p.x,p.y-30,'button','#ffe27a',180,p.laneZ);
    laneTargets.sort(function(a,b){return combatDistance(S,p,a)-combatDistance(S,p,b);});
    const target=laneTargets[0];
    if(target&&combatDistance(S,p,target)<500){
      ultimateHit(S,target,dmg*1.35,34,p.x);
      laneTargets.forEach(function(e){if(e!==target&&!e.dead&&combatDistance(S,target,e)<175)ultimateHit(S,e,dmg*0.6,18,p.x);});
    }
  } else if(type==='double'){
    const hit=new Set();
    [-1,1].forEach(function(side,index){
      const cx=clamp(p.x+side*92,30,W-30), lane=p.laneZ||0;
      addFx(S,cx,p.y-28,'slam','#ff8c42',145,lane);
      laneTargets.forEach(function(e){if(!e.dead&&!hit.has(e)&&combatDistance(S,{x:cx,y:p.y,laneZ:lane},e)<145){hit.add(e);ultimateHit(S,e,dmg*0.82,27,cx);}});
    });
  } else if(type==='disco'){
    const start=p.x, finish=clamp(start+p.dir*250,35,W-35), minX=Math.min(start,finish), maxX=Math.max(start,finish);
    addFx(S,start,p.y-30,'disco',C.theme,250,p.laneZ);
    for(let i=0;i<5;i++)addFx(S,start+(finish-start)*i/4,p.y-24,'ring',i%2?'#52f2ff':'#ff6bd6',34,p.laneZ);
    laneTargets.forEach(function(e){if(e.x>=minX-48&&e.x<=maxX+48)ultimateHit(S,e,dmg*1.18,24,p.x);});
    p.x=finish; p.invT=Math.max(p.invT,0.55);
  } else if(type==='fryer'){
    addFx(S,p.x,p.y-26,'fryer','#ffb347',220,p.laneZ);
    laneTargets.forEach(function(e){if(combatDistance(S,p,e)<220){ultimateHit(S,e,dmg*0.6,12,p.x);e.burnT=Math.max(e.burnT||0,2.8);e.burnDmg=Math.max(e.burnDmg||0,9);}});
    const poolOwner=S.mode==='duel'&&p!==S.player?S.ally:p;
    for(let i=-2;i<=2;i++)S.oilPools.push({x:clamp(p.x+i*62,30,W-30),laneZ:p.laneZ||0,life:5,dps:9,t:0,owner:poolOwner});
  } else if(type==='overdrive'){
    p.hp=Math.min(p.maxHp,p.hp+32); p.abCd=0;
    S.slowAll=1.6; S.slowAllMax=1.6;
    addFx(S,p.x,p.y-30,'overdrive','#39d98a',1,p.laneZ);
    laneTargets.forEach(function(e){if(combatDistance(S,p,e)<150)ultimateHit(S,e,dmg*0.45,18,p.x);});
  } else if(type==='redact'){
    addFx(S,p.x,p.y-30,'redact','#7ab8e8',R);
    laneTargets.forEach(function(e){if(combatDistance(S,p,e)<R)ultimateHit(S,e,dmg,0,p.x);});
    const reflected=[];
    const incomingOwner=S.mode==='duel'&&p!==S.player?'player':'enemy';
    const reflectedOwner=incomingOwner==='player'?'enemy':'player';
    S.projs.forEach(function(pr){if(pr.owner===incomingOwner&&(!S.use3D||laneDistance(pr,p)<115)){pr.owner=reflectedOwner;pr.dmg=Math.max(pr.dmg,12);pr.col='#7ab8e8';pr.kind='bill';pr.vx=-pr.vx*1.25;pr.vy=-pr.vy*1.25;pr.life=Math.max(pr.life,1.2);reflected.push(pr);}});
    reflected.forEach(function(pr){
      const hit=function(target){if(target&&!target.dead&&Math.abs(pr.x-target.x)<42&&Math.abs(pr.y-(target.y-(target.kind==='boss'?40:30)))<(target.kind==='boss'?52:52)&&(!S.use3D||laneDistance(pr,target)<26)){ultimateHit(S,target,pr.dmg,2,p.x);pr.life=0;}};
      if(S.mode==='duel')hit(p===S.player?S.ally:S.player);
      else{S.enemies.forEach(hit);if(S.boss&&!S.boss.dead)hit(S.boss);}
    });
    S.projs=S.projs.filter(function(pr){return pr.owner!==incomingOwner||(S.use3D&&laneDistance(pr,p)>=115);});
    S.chaos=clamp(S.chaos+7,0,100);
    p.abCd=Math.max(0,p.abCd-1.5);
  } else if(type==='flourbomb'){
    // BOMBA DI FARINA DI NINOZ: enorme nuvola bianca accecante, stordimento e polverizzazione ad area
    addFx(S,p.x,p.y-30,'ring','#e056fd',280,p.laneZ);
    addFx(S,p.x,p.y-30,'whistle','#ffffff',320,p.laneZ);
    S.screenShake=16; S.flash=0.55;
    laneTargets.forEach(function(e){
      if(combatDistance(S,p,e)<320){
        ultimateHit(S,e,dmg*1.3,38,p.x);
        e.stunT=Math.max(e.stunT||0,1.8);
      }
    });
    for(let i=0;i<18;i++){
      const ba=Math.random()*Math.PI*2, bspd=80+Math.random()*160;
      S.fx.push({x:p.x+rnd(-20,20),y:p.y-25+rnd(-15,15),kind:'bit',col:i%2?'#ffffff':'#f0e6ff',t:0,life:0.75+Math.random()*0.4,mag:2.4,r:rnd(3,7),vx:Math.cos(ba)*bspd,vy:Math.sin(ba)*bspd-35,laneZ:p.laneZ||0});
    }
  } else {
    laneTargets.forEach(function(e){if(combatDistance(S,p,e)<R)ultimateHit(S,e,dmg,24,p.x);});
  }
  AUDIO.ult();
}

/* ---------- Attacco base ---------- */
function doAttack(S,p){
  if(p.atkT>0||p.dead||p.leadT>0)return;
  const w=DATA.Weapons[p.colors.weapon]||DATA.Weapons.mattarello;
  if(p.restrictMelee&&w.kind!=='melee')return;
  if(S.mode==='duel')p.chaosCharge=clamp((p.chaosCharge||0)+2.6,0,100);
  if(p.tripleShots>0){
    const tgt=nearestTarget(S,p), tx=tgt?tgt.x:p.x+p.dir*300, ty=tgt?tgt.y-24:p.y-24;
    for(let shot=0;shot<3;shot++){
      const projectile={x:p.x,y:p.y-40,vx:(tx-p.x)*1.1,vy:(ty-(p.y-40)+(shot-1)*18)*1.1,dmg:w.dmg*(1+shot*0.3),col:'#ffd94d',kind:w.fx==='pan'?'pan':'bullet',owner:S.mode==='duel'&&p!==S.player?'enemy':'player',life:2,t:0,laneZ:p.laneZ||0,laneV:0};
      S.projs.push(projectile);
    }
    p.tripleShots=0; p.atkT=w.rate*0.35; p.using=1; p.usingT=0.32; p.attackPose='triple'; p.attackPoseT=0.32; p.attackPoseMax=0.32; AUDIO.shoot(); return;
  }
  p.atkT=w.rate; p.using=1; p.usingT=0.28; p.attackPose=w.fx||w.kind; p.attackPoseT=0.28; p.attackPoseMax=0.28; p.faceLockT=Math.max(p.faceLockT||0,0.25);
  if(w.fx==='snap'){const snapTgt=nearestTarget(S,p);if(snapTgt&&!snapTgt.dead&&Math.abs(snapTgt.x-p.x)<100)snapTgt.stunT=Math.max(snapTgt.stunT||0,0.16);}
  S.screenShake=Math.max(S.screenShake||0,w.dmg>=16?2.2:0.7);
  if(w.dmg>=18)S.hitStop=Math.max(S.hitStop||0,0.035);
  const rng=w.rng;
  /* auto-mira colpo corpo a corpo: se un bersaglio è a portata, il colpo si orienta lì */
  if(w.kind==='melee'){
    const snapT=nearestTarget(S,p);
    if(snapT&&!snapT.dead&&Math.abs(snapT.x-p.x)<rng+34&&Math.abs(snapT.y-p.y)<64)p.dir=snapT.x>p.x?1:-1;
  }
  const hd=p.dir;
  const dmg=w.dmg*(p.ultActive>0?2:1);
  if(w.kind==='melee'){
    /* affondo: il corpo scatta in avanti col colpo, per dare peso all'impatto */
    p.x=clamp(p.x+hd*15,30,W-30);
    AUDIO.hit();
    addFx(S,p.x+hd*30,p.y-30,'slash','#fff',Math.max(1,w.rng/46),p.laneZ);
    let any=false;
    const targets=S.mode==='duel'?[p===S.player?S.ally:S.player].filter(Boolean):S.enemies;
    targets.forEach(e=>{ if(!e.dead&&Math.sign(e.x-p.x||hd)===hd&&Math.abs(e.x-p.x)<rng+(e.kind==='boss'?40:10)&&Math.abs(e.y-p.y)<60&&(!S.use3D||laneDistance(e,p)<(e.kind==='boss'?26:22))){
      hurtCombatTarget(S,e,dmg,6,p.x);
      any=true;
      if(w.aoe) targets.forEach(o=>{ if(o!==e&&!o.dead&&combatDistance(S,o,e)<60*w.aoe+20)hurtCombatTarget(S,o,dmg*0.5,4,p.x); });
    }});
    if(S.mode!=='duel'&&S.boss&&!S.boss.dead&&Math.sign(S.boss.x-p.x||hd)===hd&&Math.abs(S.boss.x-p.x)<rng+34&&(!S.use3D||Math.abs(S.boss.y-p.y)<60)&&(!S.use3D||laneDistance(S.boss,p)<26))hurtEnemy(S,S.boss,dmg,4,p.x);
    if(!any) AUDIO.shoot();
  } else {
    const tgt=nearestTarget(S,p), tx=tgt?tgt.x:p.x+hd*300, ty=tgt?tgt.y-24:p.y-24;
    const shots=w.spread||1;
    for(let i=0;i<shots;i++){
      const spreadOffset=(i-(shots-1)/2)*22;
      shoot(S,{x:p.x,y:p.y,laneZ:p.laneZ||0},tx,ty+spreadOffset,420,dmg,w.fx==='pan'?'#c0c0c0':w.fx==='duck'?'#ffe36e':w.fx==='scoop'?'#ff8ac2':w.fx==='paper'?'#e7e1c9':w.fx==='toast'?'#ef8c42':w.fx==='brass'?'#ffd34e':w.fx==='splash'?'#6fd0ff':w.fx==='bone'?'#e8e4d0':w.fx==='glass'?'#ffd98a':w.fx==='spark'?'#ff8c42':'#ffd94d',w.fx||'bullet',S.mode==='duel'&&p!==S.player?'enemy':'player',tgt?tgt.laneZ||0:p.laneZ||0);
      const projectile=S.projs[S.projs.length-1];
      projectile.splash=w.splash||0; projectile.pull=!!w.pull; projectile.stun=w.stun||0;
    }
    AUDIO.shoot();
  }
}

/* ---------- Ondate ---------- */
function nextWave(S){
  S.wave++;    if(S.mode==='trial'||S.mode==='marathon'){ spawnBoss(S); return; }
  const L=DATA.Levels[S.levelIdx];
  if(S.mode==='story'||S.mode==='weekly'){
    if(S.wave>L.waves){ spawnBoss(S); return; }
    S.spawnQueue=ri(2,3)+Math.floor(S.wave*0.6);
    /* premio di fine ondata: recupero vita */
    if(S.wave>1&&S.player&&!S.player.dead) S.player.hp=Math.min(S.player.maxHp,S.player.hp+15);
  } else if(S.mode==='chaos'){
    S.spawnQueue=3+S.wave*2;
    if(S.wave>1&&S.player&&!S.player.dead) S.player.hp=Math.min(S.player.maxHp,S.player.hp+20);
  } else if(S.mode==='duel'){
    /* duello gestito altrove */
  }
  S.betweenWaves=0;
}
function spawnBoss(S){
  if(S.mode==='trial'){
    const T=DATA.Trials[S.levelIdx];
    S.boss=makeBoss(T.boss,1);
  } else if(S.mode==='marathon'){
    const M=DATA.Marathon[S.marathonIdx||0];
    S.boss=makeBoss(M.boss,1);
    S.marathonStartT=S.t;
  } else {
    const L=DATA.Levels[S.levelIdx];
    S.boss=makeBoss(L.boss,S.mode==='weekly'&&S.constraint===4?1.4:1);
  }
  S.bossIntro=2.2;
  AUDIO.bossRoar(); S.screenShake=10;
}

/* ---------- Duello ---------- */
function initDuel(S,p1Char,p2Char,opts){
  opts=opts||{};
  S.wavesTotal=3;
  S.player=makePlayer(p1Char,240,SAVE.look(p1Char),false);
  if(opts.vsBoss){
    /* DUELLO VS BOSS: il boss leggendario prende il posto dell'avversario CPU */
    const bid=opts.vsBoss;
    S.ally=makeBoss(bid,1);
    /* taratura duello: scala da boss di prova a avversario best-of-3 */
    S.ally.hp=S.ally.maxHp=Math.round(S.ally.maxHp*0.5);
    S.ally.dmg=Math.round(S.ally.dmg*0.72);
    S.ally.x=W-240;
    S.duelVsBoss=bid;
  } else {
    S.ally=makePlayer(p2Char,W-240,SAVE.look(p2Char),true);
  }
  S.betweenWaves=2.5; S.duelIntroT=2.5; S.duelRoundT=opts.vsBoss?45:30;
  S.duelRound=1; S.roundWinsP1=0; S.roundWinsP2=0;
}
function nextDuelRound(S){
  S.duelRound++;
  S.player.hp=S.player.maxHp; S.ally.hp=S.ally.maxHp;
  S.player.dead=S.ally.dead=false;
  S.player.x=240; S.ally.x=W-240;    if(S.duelVsBoss){ S.ally.phase=0; S.ally.enraged=false; S.ally.spd=(BSTATS[S.duelVsBoss]||BSTATS.cervellone).spd; }
  S.player.invT=S.ally.invT=0; S.player.stunT=S.ally.stunT=0;
  S.player.ultActive=S.ally.ultActive=0; S.player.leadT=S.ally.leadT=0;
  S.player.attackPose=S.ally.attackPose=null; S.player.attackPoseT=S.ally.attackPoseT=0;
  S.player.using=S.ally.using=0; S.player.chaosCharge=S.ally.chaosCharge=0;
  S.player.vx=S.ally.vx=0; S.player.vy=S.ally.vy=0;
  S.player.laneZ=S.ally.laneZ=0; S.player.vz=S.ally.vz=0;
  S.betweenWaves=2.5; S.projs.length=0; S.oilPools.length=0; S.enemies.length=0; S.fx.length=0;
  S.roundEndT=0; S.roundWinner=0; S.overT=0; S.bossDefeated=false; S.overT2=0;
  S.duelRoundT=S.duelVsBoss?45:30; S.duelIntroT=2.5;
  S.player.atkT=S.ally.atkT=0; S.player.abCd=S.ally.abCd=0;
  S.player.dashCd=S.ally.dashCd=0; S.player.tripleShots=S.ally.tripleShots=0;
  S.player.hitFlash=S.ally.hitFlash=0; S.player.squash=S.ally.squash=0;
  S.player.chaosCharge=S.ally.chaosCharge=0; S.player.ultPose=S.ally.ultPose=null;
  S.player.ultPoseT=S.ally.ultPoseT=0; S.slowAll=S.slowAllMax=0;
}
function duelRoundEnd(S,winner){ /* winner: 1=giocatore, 2=avversario */
  if(!winner){
    /* tempo scaduto: vince chi ha più vita (sudden death) */
    const p=S.player, a=S.ally;
    const rp=p.hp/p.maxHp, ra=a.hp/a.maxHp;
    winner=rp>=ra?1:2;
  }
  if(winner===1)S.roundWinsP1++; else S.roundWinsP2++;
  if(S.roundWinsP1>=2||S.roundWinsP2>=2){
    S.over=true; S.win=S.roundWinsP1>=2;
    if(S.win){ SAVE.data.duelWins=(SAVE.data.duelWins||0)+1;
      if((SAVE.data.duelWins||0)>=5) SAVE.trophy('duel'); }
    SAVE.save();
  } else nextDuelRound(S);
}

/* ---------- Inizio partita ---------- */
function start(mode,opts){
  opts=opts||{};
  const S=baseState(mode,opts);
  const L=DATA.Levels[S.levelIdx];
  if(mode==='duel'){ initDuel(S,opts.p1,opts.p2,opts); }
  else if(mode==='trial'){
    const T=DATA.Trials[S.levelIdx];
    const cid=opts.charId||T.char;
    S.player=makePlayer(cid,W*0.25,SAVE.look(cid),false);
    S.wavesTotal=0;
    S.obstacles=makeObstacles(T.bg);
    S.vases=makeVases();
    S.betweenWaves=0.8;
    S.trial=T.id;
    S.environmentIdx=Math.max(0,(T.bg||1)-1);
    setExploration(S,S.environmentIdx);
    if(!SAVE.data.seen[cid]){ SAVE.data.seen[cid]=1; S.tutorialT=8; }
  }
  else if(mode==='marathon'){
    /* MARATONA DEI BOSS: i 3 leggendari di fila, la vita si porta dietro */
    const M=DATA.Marathon[0];
    const cid=opts.charId||SAVE.data.chars[0];
    S.player=makePlayer(cid,W*0.25,SAVE.look(cid),false);
    S.wavesTotal=0;
    S.obstacles=makeObstacles(M.bg);
    S.vases=makeVases();
    S.betweenWaves=0.8;
    S.marathonIdx=0;
    S.environmentIdx=Math.max(0,(M.bg||1)-1);
    setExploration(S,S.environmentIdx);
    S.tutorialT=(!SAVE.data.seen[cid])?8:0;
    if(!SAVE.data.seen[cid]){ SAVE.data.seen[cid]=1; SAVE.save(); }
  }
  else {
    const cid=opts.charId||SAVE.data.chars[0];
    S.player=makePlayer(cid,W*0.25,SAVE.look(cid),false);
    if(S.constraint===0) S.player.restrictMelee=true;
    if(S.constraint===1) S.player.restrictSkill=true;
    if(S.constraint===2){ S.player.hp=Math.ceil(S.player.hp/2); S.player.maxHp=S.player.hp; }
    /* tutorial abilità: una sola volta per personaggio (dopo la creazione dello stato) */
    if(!SAVE.data.seen[cid]){ SAVE.data.seen[cid]=1; SAVE.save(); S.tutorialT=8; }
    S.wavesTotal=mode==='chaos'?0:L.waves;
    S.obstacles=makeObstacles(S.levelIdx+1);
    S.vases=makeVases();
    S.secrets=makeSecrets(S.levelIdx);
    attachSecretVase(S);
    setExploration(S,S.levelIdx);
    if(mode!=='chaos'&&mode!=='trial'&&LT('storyDlg.l'+(S.levelIdx+1)).length){ S.dialog=LT('storyDlg.l'+(S.levelIdx+1)); S.dialogT=0; }
    else if(mode==='chaos'||mode==='trial'){ S.betweenWaves=S.betweenWaves||1; }
  }
  return S;
}

/* ---------- Update principale ---------- */
function update(S,dt,inp,inp2){
  if(S.paused||S.over)return;
  S.inp2=inp2||{};
  S.t+=dt;
  if(S.duelIntroT>0)S.duelIntroT=Math.max(0,S.duelIntroT-dt);
  if(S.hitStop>0){ S.hitStop-=dt; dt*=0.05; }
  if(S.finisherT>0){ S.finisherT-=dt; dt*=0.12; }
  if(S.slowmo>0){ S.slowmo-=dt; dt*=0.35; }
  if(S.screenShake>0) S.screenShake=Math.max(0,S.screenShake-dt*30);
  if(S.flash>0) S.flash-=dt;
  if(S.zoomKick>0) S.zoomKick=Math.max(0,S.zoomKick-dt);
  if(S.comboT>0){ S.comboT-=dt; if(S.comboT<=0) S.combo=0; }
  if(S.tutorialT>0) S.tutorialT-=dt;
  if(S.phaseT>0) S.phaseT-=dt;
  if(S.clipArmT>0){ S.clipArmT-=dt; if(S.clipArmT<=0) S.clipFlag=false; }

  /* Risparmio Energetico di PAOLO: il mondo intero va in risparmio */    if(S.slowAll>0){ S.slowAll-=dt; if(S.slowAll<=0)S.slowAllMax=0; }
  const p=S.player;
  S.use3D=threeDActive();
  if(S.tempWeaponT>0){
    S.tempWeaponT=Math.max(0,S.tempWeaponT-dt);
    if(S.tempWeaponT===0&&S.tempWeaponPrev&&p){p.colors.weapon=S.tempWeaponPrev;S.tempWeaponPrev=null;}
  }
  if(p&&p.secretSpeedUntil&&S.t>=p.secretSpeedUntil){p.speed=DATA.Chars[p.charId].speed;p.secretSpeedUntil=0;}
  if(!S.use3D){
    S.nearbyPoi=null;
    if(p){ p.laneZ=0; p.vz=0; }
    (S.explorationPOIs||[]).forEach(function(poi){ poi.laneZ=0; });
    S.enemies.forEach(function(e){ e.laneZ=0; e.vz=0; });
    if(S.boss){ S.boss.laneZ=0; S.boss.vz=0; }
    if(S.ally){ S.ally.laneZ=0; S.ally.vz=0; }
    S.projs.forEach(function(pr){ pr.laneZ=0; pr.laneV=0; });
    S.pickups.forEach(function(pk){ pk.laneZ=0; });
    S.obstacles.forEach(function(o){ o.laneZ=0; });
    S.vases.forEach(function(v){ v.laneZ=0; });
    S.oilPools.forEach(function(o){ o.laneZ=0; });
    S.fx.forEach(function(f){ f.laneZ=0; });
  }
  if(p&&!p.dead&&!(S.mode==='duel'&&S.duelIntroT>0)){
    p.t+=dt;    p.atkT=Math.max(0,p.atkT-dt); p.abCd=Math.max(0,p.abCd-dt);
    if(p.tripleShots>0&&S.t>(p.tripleUntil||0))p.tripleShots=0;
    p.invT=Math.max(0,p.invT-dt); p.hitFlash=Math.max(0,p.hitFlash-dt);
    p.usingT=Math.max(0,p.usingT-dt); if(p.usingT<=0)p.using=0;
    p.leadT=Math.max(0,p.leadT-dt); p.squash=Math.max(0,p.squash-dt*1.5);
    p.ultActive=Math.max(0,p.ultActive-dt); p.ultPoseT=Math.max(0,p.ultPoseT-dt); if(p.ultPoseT<=0)p.ultPose=null;
    p.attackPoseT=Math.max(0,p.attackPoseT-dt); if(p.attackPoseT<=0){p.attackPose=null;p.attackPoseMax=0;} p.slowT=Math.max(0,p.slowT-dt);
    p.walk+=Math.abs(p.vx)*dt*0.35;
    if(inp){
      /* input buffering: un attacco premuto troppo presto parte appena pronto
         (finestra 0.2s) — i touch sfasati non si perdono più */
      ['attack','ability','ult','interact'].forEach(k=>{
        const available=!(k==='attack'&&p.atkT>0)&&!(k==='ability'&&p.abCd>0)&&!(k==='ult'&&p.chaosCharge<100);
        if(inp[k]&&available)p.buf=(p.buf||{}),p.buf[k]=0.2;
      });
      ['attack','ability','ult','interact'].forEach(k=>{ if(p.buf&&p.buf[k]>0)p.buf[k]-=dt; });
      let mv=0;
      if(inp.left)mv-=1; if(inp.right)mv+=1;
      mv+=Math.max(-1,Math.min(1,inp.padMoveX||0)); mv=clamp(mv,-1,1);
      S.nearbyPoi=null;
      if(S.use3D){
        let lane=0; if(inp.up)lane-=1; if(inp.down)lane+=1;
        lane+=Math.max(-1,Math.min(1,inp.padMoveY||0)); lane=clamp(lane,-1,1);
        const targetLane=lane*85; // game units/second; più reattivo su controller da console
        p.vz+=(targetLane-p.vz)*Math.min(1,(lane===0?0.36:0.28)*(dt*60));
        if(Math.abs(p.vz)<1.5&&lane===0)p.vz=0;
        p.laneZ=clamp((p.laneZ||0)+p.vz*dt,-112,112);
        /* nearby POI is evaluated after horizontal movement below */
      } else { p.vz=0; p.laneZ=0; }
      if(S.interactHintT>0)S.interactHintT=Math.max(0,S.interactHintT-dt);
      /* accelerazione/frenata migliorata stile console action: risposta immediata con fluidità */
      const tv=mv*p.speed*(p.leadT>0?0.35:1)*(inp.dash?1.95:1);
      const acc=(mv===0?0.38:0.28);
      p.vx+=(tv-p.vx)*Math.min(1,acc*(dt*60));
      if(Math.abs(p.vx)<6&&mv===0)p.vx=0;
      const cameraInput=clamp(inp.cameraX||0,-1,1), cameraInputY=clamp(inp.cameraY||0,-1,1);
      S.cameraAimX=clamp((S.cameraAimX||0)+cameraInput*320*dt,-320,320);
      S.cameraAimY=clamp((S.cameraAimY||0)+cameraInputY*180*dt,-180,180);
      if(Math.abs(cameraInput)<0.05)S.cameraAimX+=(0-S.cameraAimX)*Math.min(1,3.2*dt);
      if(Math.abs(cameraInputY)<0.05)S.cameraAimY+=(0-S.cameraAimY)*Math.min(1,3.2*dt);
      if(mv!==0&&p.faceLockT<=0) p.dir=mv>0?1:-1;
      p.faceLockT=Math.max(0,p.faceLockT-dt);
      /* buffering vero: l'azione messa in coda parte APPENA disponibile */
      if(p.atkT<=0&&p.leadT<=0&&(inp.attack||(p.buf&&p.buf.attack>0))){ if(p.buf)p.buf.attack=0; doAttack(S,p); }
      if(p.abCd<=0&&(inp.ability||(p.buf&&p.buf.ability>0))){ if(p.buf)p.buf.ability=0; useAbility(S,p); }
      if(p.chaosCharge>=100&&(inp.ult||(p.buf&&p.buf.ult>0))){ if(p.buf)p.buf.ult=0; useUltimate(S,p); }
      if(inp.dash&&!p.dashCd){ p.dashCd=0.65; p.invT=Math.max(p.invT,0.30); AUDIO.dash(); addFx(S,p.x,p.y-30,'dash','#fff'); }
      if(p.dashCd) p.dashCd=Math.max(0,p.dashCd-dt);
    }
    p.x=clamp(p.x+p.vx*dt*60,30,W-30);
    if(S.use3D) {
      let nearestPoi=null, nearestPoiD=Infinity;
      (S.explorationPOIs||[]).forEach(function(poi){
        if(poi.used)return;
        const d=Math.hypot((p.x-poi.x)*0.1,((p.laneZ||0)-(poi.laneZ||0))*0.1);
        if(d<nearestPoiD){nearestPoiD=d;nearestPoi=poi;}
      });
      if(nearestPoi&&nearestPoiD<1.65){
        S.nearbyPoi=nearestPoi;
        if(inp&&(inp.interact||(p.buf&&p.buf.interact>0))){ interactWithPoi(S,nearestPoi,p); p.buf=p.buf||{}; p.buf.interact=0; }
      }
    }

    p.chaosCharge=clamp(p.chaosCharge+S.chaos*0+ (S.combo>0?2.2*dt:0)+S.kills*0,0,100);
    p.chaosCharge=clamp(p.chaosCharge+dt*1.4*(S.mode==='chaos'?1.4:1)*(S.slowAll>0?4:1),0,100);
  }
  /* Alleato/CPU/avversario */
  if(S.ally){ updateAlly(S,S.ally,dt); }
  if(S.mode==='duel'&&S.duelIntroT<=0&&!S.roundEndT&&!S.over){
    if(S.player.dead||S.ally.dead){ S.roundEndT=1.3; S.roundWinner=S.player.dead?2:1;  } else if(S.duelRoundT===undefined) S.duelRoundT=S.duelVsBoss?45:30;
  else { S.duelRoundT-=dt; if(S.duelRoundT<=0){ S.roundEndT=1.3; S.roundWinner=0; } }
  }
  if(S.roundEndT){ S.roundEndT-=dt; if(S.roundEndT<=0){
    duelRoundEnd(S,S.roundWinner); S.roundEndT=0; } }

  /* Ostacoli attivi */    S.obstacles.forEach(o=>{ o.t+=dt; o.cd-=dt;
    if(o.cd<=0){ o.cd=rnd(3,6); o.touchedThisTick=true; obstacleFire(S,o); } });

  /* Vasi */    S.vases.forEach(v=>{ v.t+=dt;
    if(!v.alive){ v.respawnT-=dt; if(v.respawnT<=0){ v.alive=true; } return; }
    if(p&&!p.dead&&Math.abs(p.x-v.x)<30&&(!S.use3D||laneDistance(p,v)<20)){ v.alive=false; v.respawnT=18;
      AUDIO.vase(); addFx(S,v.x,v.y-20,'bit','#8ff'); addFx(S,v.x,v.y-20,'pop','#fff');
      /* cocci sul pavimento: il vaso si rompe e lascia il segno */
      for(let s=0;s<4;s++)addDecal(S,v.x+rnd(-18,18),v.y+rnd(-4,4),s%2?'#6b4a9e':'#8a5ac8',rnd(.3,.6),v.laneZ);
      if(v.secret&&!v.secret.used){
        v.respawnT=18;triggerSecret(S,v.secret,p);
      }else{
        const weaponIds=Object.keys(DATA.Weapons).filter(function(id){return id!=='mattarello';});
        if(Math.random()<0.16){
          const weaponId=weaponIds[ri(0,weaponIds.length-1)];
          if(!S.tempWeaponT)S.tempWeaponPrev=p.colors.weapon;
          p.colors.weapon=weaponId;S.tempWeaponT=11;S.phaseMsg='ARMA TROVATA: '+DATA.Weapons[weaponId].name;S.phaseT=2;
          addFx(S,v.x,v.y-35,'ult','#ffd94d',58,v.laneZ);
        }else dropPickup(S,v.x,null,v.laneZ);
      }
      S.chaos=clamp(S.chaos+1.5,0,100);
    } });

  /* Gestione ondate (non duello) */
  if(S.mode!=='duel'){
    if(S.bossIntro>0){ S.bossIntro-=dt; }
    else if(!S.boss||S.boss.dead){
      if(S.bossDefeated){ /* boss sconfitto: partita in chiusura, niente nuove ondate/boss */ }
      else if(S.betweenWaves>0){ S.betweenWaves-=dt;
        if(S.betweenWaves<=0) nextWave(S);
      } else if(S.spawnQueue>0){
        S.spawnT-=dt;
        if(S.spawnT<=0){ S.spawnT=0.5;
          const L=DATA.Levels[S.levelIdx];
          const type=L.enemies[ri(0,L.enemies.length-1)];
          const mult=1+S.wave*0.12+(S.mode==='chaos'?S.wave*0.03:0);
      const e=makeEnemy(type,Math.random()<0.5?rnd(-20,0):rnd(W,W+20),mult);
      if(S.use3D) e.laneZ=rnd(-95,95);
      if(S.constraint===3) e.baseSpd*=1.4;
          S.enemies.push(e); S.spawnQueue--;
        }
      } else if(S.enemies.every(e=>e.dead)){
        if(S.mode==='story'||S.mode==='weekly'){
          if(S.wave>=L.waves){ /* boss già spawnato */ }
          else S.betweenWaves=1.6;
        } else { S.betweenWaves=1.2; }
      }
    }
  }

  /* Nemici */
  S.enemies.forEach(e=>{ if(e.dead)return; updateEnemy(S,e,dt,p); });
  S.enemies=S.enemies.filter(e=>!e.dead);

  /* Boss */
  if(S.boss&&!S.boss.dead) updateBoss(S,S.boss,dt,p);

  /* Proiettili: owner distingue i due lottatori nei duelli. */
  S.projs.forEach(pr=>{
    pr.t+=dt; pr.life-=dt; pr.x+=pr.vx*dt; pr.y+=pr.vy*dt;
    if(S.use3D)pr.laneZ=(pr.laneZ||0)+(pr.laneV||0)*dt;
    if(pr.kind==='boulder')pr.vy+=300*dt;
    if(pr.y>GY-6&&pr.kind==='boulder'){pr.life=0;boulderBoom(S,pr);}
    const source=S.mode==='duel'?(pr.owner==='player'?S.player:S.ally):S.player;
    const projectileHit=function(target,knock){
      if(pr.life<=0||!target||target.dead)return;
      hurtCombatTarget(S,target,pr.dmg,knock,source?source.x:p.x);
      pr.life=0;
      if(pr.stun)target.stunT=Math.max(target.stunT||0,pr.stun);
      if(pr.kind==='duck'){target.stunT=Math.max(target.stunT||0,0.24);target.dir=source&&target.x>source.x?-1:1;}
      if(pr.pull){
        const sourceX=source?source.x:p.x;
        target.x+=(sourceX>target.x?1:-1)*Math.min(24,Math.abs(sourceX-target.x)*0.12);
        target.stunT=Math.max(target.stunT||0,0.12);
      }
      if(pr.splash>0){
        const splashTargets=S.mode==='duel'?[]:(S.enemies||[]).concat(S.boss&&!S.boss.dead?[S.boss]:[]);
        splashTargets.forEach(function(other){
          if(other!==target&&!other.dead&&combatDistance(S,target,other)<pr.splash){
            hurtEnemy(S,other,pr.dmg*0.55,3,source?source.x:p.x);
          }
        });
      }
    };
    if(S.mode==='duel'){
      const target=pr.owner==='player'?S.ally:S.player;
      const targetY=target&&(target.kind==='boss'?40:30);
      const xRange=target&&(target.kind==='boss'?30:18);
      const yRange=target&&(target.kind==='boss'?50:40);
      if(target&&!target.dead&&Math.abs(pr.x-target.x)<xRange&&Math.abs(pr.y-(target.y-targetY))<yRange&&(!S.use3D||laneDistance(pr,target)<24)){
        projectileHit(target,2);
      }
    } else if(pr.owner==='player'){
      S.enemies.forEach(function(e){
        if(!e.dead&&Math.abs(pr.x-e.x)<20*e.s&&Math.abs(pr.y-(e.y-30))<40&&(!S.use3D||laneDistance(pr,e)<22)){
          projectileHit(e,4);
        }
      });
      if(S.boss&&!S.boss.dead&&Math.abs(pr.x-S.boss.x)<30&&Math.abs(pr.y-(S.boss.y-40))<50&&(!S.use3D||laneDistance(pr,S.boss)<24)){
        projectileHit(S.boss,2);
      }
    } else if(p&&!p.dead&&Math.abs(pr.x-p.x)<16&&Math.abs(pr.y-(p.y-30))<40&&(!S.use3D||laneDistance(pr,p)<20)){
      projectileHit(p,0);
    }
    if(pr.x<-40||pr.x>W+40||pr.y<-40||pr.y>H+40)pr.life=0;
  });
  S.projs=S.projs.filter(pr=>pr.life>0);

  /* FX: schizzi piccoli, radi e di breve durata. */
  S.fx.forEach(f=>{f.t+=dt;if(f.kind==='bit'||f.kind==='blood'){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=(f.kind==='blood'?260:500)*dt;}});
  S.fx=S.fx.filter(f=>f.t<f.life);

  /* Pickup */
  S.pickups.forEach(pk=>{
    pk.t+=dt; pk.life-=dt; pk.vy+=600*dt;
    pk.y+=pk.vy*dt; pk.x+=pk.vx*dt;
    if(pk.y>GY){ pk.y=GY; pk.vy*=-0.4; pk.vx*=0.8; }
    if(pk.y<GY+2&&Math.abs(pk.vy)<20)pk.vy=0;
    if(p&&!p.dead&&Math.abs(pk.x-p.x)<26&&Math.abs(pk.y-p.y)<40&&(!S.use3D||laneDistance(pk,p)<20)){
      pk.life=0;
      if(pk.type==='coin'){ S.coinsEarned+=2; AUDIO.coin(); addFx(S,pk.x,pk.y-20,'pop','#ffd94d'); }
      else if(pk.type==='heart'){ p.hp=Math.min(p.maxHp,p.hp+20); AUDIO.coin(); addFx(S,pk.x,pk.y-20,'pop','#4f8'); }
      else { p.abCd=0; AUDIO.coin(); addFx(S,pk.x,pk.y-20,'pop','#8ff'); }
    }
  });
  S.pickups=S.pickups.filter(pk=>pk.life>0);

  /* Fine livello */
  if(!S.over){
    if(p&&p.dead&&!S.over&&S.mode!=='duel'){ /* nel duello conta solo il flusso round */
      S.overT=(S.overT||0)+dt;
      if(S.overT>1.4){ S.over=true; S.win=false; }
    }
    if(S.boss&&S.boss.dead&&S.bossDefeated&&S.mode!=='duel'){ /* vittoria solo da flusso round nel duello */
      S.overT2-=dt; if(S.overT2<=0){ S.over=true; S.win=true; }
    }
  }
  /* Pozze d'olio di SANDRO: bruciano i nemici che ci passano sopra */
  if(S.oilPools&&S.oilPools.length){
    S.oilPools.forEach(op=>{ op.life-=dt; op.t+=dt;        S.enemies.forEach(function(enemy){
        if(!enemy.dead&&Math.abs(enemy.x-op.x)<26&&(!S.use3D||laneDistance(enemy,op)<20)&&!enemy.burnT){enemy.burnT=1.2;enemy.burnDmg=op.dps;}
      });
      if(S.mode==='duel'&&op.owner){
        const target=op.owner===S.player?S.ally:S.player;
        if(target&&!target.dead&&Math.abs(target.x-op.x)<34&&(!S.use3D||laneDistance(target,op)<26)&&!target.burnT){target.burnT=1.2;target.burnDmg=op.dps;}
        op.hitT=(op.hitT||0)-dt;
        if(target&&!target.dead&&Math.abs(target.x-op.x)<20&&(!S.use3D||laneDistance(target,op)<18)&&target.invT<=0&&op.hitT<=0&&target.charId!=='sandro'){
          hurtCombatTarget(S,target,2,0,op.x);op.hitT=0.28;
        }
      } else {
        if(S.boss&&!S.boss.dead&&Math.abs(S.boss.x-op.x)<34&&(!S.use3D||laneDistance(S.boss,op)<26)&&!S.boss.burnT){S.boss.burnT=1.2;S.boss.burnDmg=op.dps;}
        if(p&&!p.dead&&Math.abs(p.x-op.x)<20&&(!S.use3D||laneDistance(p,op)<18)&&p.invT<=0&&p.charId!=='sandro')hurtPlayer(S,p,2);
      }
    });
    S.oilPools=S.oilPools.filter(op=>op.life>0);
  }
  /* Sblocco SANDRO (ondata 20 in Caos) e LUCIA (ondata 50) */
  if(S.mode==='chaos'&&S.wave>=20&&!SAVE.unlocked('sandro')){ SAVE.unlockChar('sandro'); S.newChar='sandro'; }
  if(S.mode==='chaos'&&S.wave>=50&&!SAVE.unlocked('lucia')){ SAVE.unlockChar('lucia'); if(!S.newChar)S.newChar='lucia'; }
  /* Sblocco PAOLO (3 Duelli vinti) */
  if(S.mode==='duel'&&!S.over&&(SAVE.data.duelWins||0)>=3&&!SAVE.unlocked('paolo')){ SAVE.unlockChar('paolo'); S.newChar='paolo'; }
}

/* ---------- Nemico: comportamento ---------- */
function updateEnemy(S,e,dt,p){
  e.t+=dt; e.hitFlash=Math.max(0,e.hitFlash-dt); e.atkT-=dt;
  e.stunT=Math.max(0,e.stunT-dt);
  if(e.stunT>0)return;
  if(e.burnT>0){ e.burnT-=dt; e.hp-=e.burnDmg*dt; if(e.hp<=0){ killEnemy(S,e); return; } }
  if(!p||p.dead){ e.walk+=dt; return; }  const d=S.use3D?Math.hypot(p.x-e.x,(p.y||0)-(e.y||0),laneDistance(p,e)):Math.abs(p.x-e.x);
  e.dir=p.x>e.x?1:-1;
    if(S.use3D){
      const laneDelta=(p.laneZ||0)-(e.laneZ||0);
      const laneStep=Math.sign(laneDelta)*Math.min(Math.abs(laneDelta),e.spd*0.48*dt*60);
      if(Math.abs(laneDelta)>12)e.laneZ=(e.laneZ||0)+laneStep;
    }
    if(e.ranged){
    if(d>e.rng*0.55){ if(!S.use3D||laneDistance(p,e)<14)e.x+=e.dir*e.spd*dt*60; e.walk+=dt*6; }
    else if(e.atkT<=0&&(!S.use3D||laneDistance(p,e)<18)){ e.atkT=rnd(1.6,2.6);
      shoot(S,e,p.x,p.y-24,300,e.dmg,e.type==='drone'?'#f66':e.type==='granny'?'#ffd94d':'#ddd','bullet','enemy',p.laneZ||0);
      AUDIO.shoot(); }
  } else if(e.charge){
    if(d>60){ if(!S.use3D||laneDistance(p,e)<14)e.x+=e.dir*e.spd*dt*60*1.4; e.walk+=dt*8; }
    else if(e.atkT<=0&&(!S.use3D||laneDistance(p,e)<18)&&(!S.use3D||Math.abs(p.y-e.y)<60)){ e.atkT=1.1; e.chargeV=520*e.dir; addFx(S,e.x,e.y-24,'dash','#fff'); }
    if(e.chargeV){
      const previousX=e.x;
      e.x+=e.chargeV*dt;
      if(S.use3D&&p.x>=Math.min(previousX,e.x)-18&&p.x<=Math.max(previousX,e.x)+18&&laneDistance(p,e)<20&&Math.abs(p.y-e.y)<60&&p.invT<=0){
        hurtPlayer(S,p,e.dmg); e.chargeV=0;
      }
      e.chargeV*=0.85; if(Math.abs(e.chargeV)<30)e.chargeV=0;
    }
  } else if(e.jumpy){
    if(!S.use3D||laneDistance(p,e)<14)e.x+=e.dir*e.spd*dt*60; e.walk+=dt*9;
    e.y=GY-Math.abs(Math.sin(e.t*6))*26;
    if(d<e.rng&&e.atkT<=0&&(!S.use3D||laneDistance(p,e)<18)&&(!S.use3D||Math.abs(p.y-e.y)<60)){ e.atkT=1.2; hurtPlayer(S,p,e.dmg); addFx(S,e.x,e.y-30,'hit','#fff'); }
  } else {
    if(d>e.rng*0.5){ if(!S.use3D||laneDistance(p,e)<14)e.x+=e.dir*e.spd*dt*60; e.walk+=dt*6; }
    else if(e.atkT<=0&&(!S.use3D||laneDistance(p,e)<18)&&(!S.use3D||Math.abs(p.y-e.y)<60)){ e.atkT=rnd(1.7,2.2); hurtPlayer(S,p,e.dmg); addFx(S,e.x+e.dir*14,e.y-30,'hit','#fff'); }
  }
  e.x=clamp(e.x,-30,W+30);
}

/* ---------- Boss: comportamento a fasi ---------- */
function updateBoss(S,b,dt,p){
  if(S.bossIntro>0){ b.t+=dt; return; }
  b.t+=dt; b.hitFlash=Math.max(0,b.hitFlash-dt); b.atkT-=dt;
  if(b.burnT>0){ b.burnT-=dt; b.hp-=b.burnDmg*dt; if(b.hp<=0){ killEnemy(S,b); return; } }
  const hpr=b.hp/b.maxHp;
  const newPhase=hpr>0.66?0:hpr>0.33?1:2;
  if(newPhase>b.phase){ b.phase=newPhase; S.phaseMsg=(b.phase===1?'FASE 2!':'FASE FINALE!'); S.phaseT=1.6;
    S.screenShake=10; AUDIO.bossRoar(); addFx(S,b.x,b.y-40,'ring','#f44',240);
    b.spd*=1.15; if(b.phase===2)b.enraged=true; }
  if(!p||p.dead||(S.mode==='duel'&&S.duelIntroT>0))return;
  const d=S.use3D?Math.hypot(p.x-b.x,(p.y||0)-(b.y||0),laneDistance(p,b)):Math.abs(p.x-b.x);
  b.dir=p.x>b.x?1:-1;
  if(S.use3D){ const laneDelta=(p.laneZ||0)-(b.laneZ||0); if(Math.abs(laneDelta)>10)b.laneZ=(b.laneZ||0)+Math.sign(laneDelta)*Math.min(Math.abs(laneDelta),b.spd*0.38*dt*60); }
  b.minionT-=dt;
  /* mai minion nel duello vs boss: resta un 1v1 pulito */  if(!(S.mode==='duel'&&S.duelVsBoss)&&b.minionT<=0){
    const trialLike=(S.mode==='trial'||S.mode==='marathon');
    b.minionT=trialLike?(b.enraged?10:13):(b.enraged?7:10);
    /* nelle prove/maratona: massimo 1 minion vivo — il focus resta il duello col boss */
    if(trialLike&&S.enemies.filter(e=>!e.dead).length>=1) return;
    let type;
    if(trialLike){
      const pool={fritto:['nurse','granny'],energia:['clerk'],archivio:['folder','clerk']};
      const arr=pool[S.boss.type]||['nurse'];
      type=arr[ri(0,arr.length-1)];
    } else {
      const L=DATA.Levels[S.levelIdx];
      type=L.enemies[ri(0,L.enemies.length-1)];
    }
    const minion=makeEnemy(type,b.x-b.dir*60,1+b.phase*0.25);
    minion.laneZ=S.use3D?(b.laneZ||0):0;
    S.enemies.push(minion); }
  if(b.ranged){
    if(d>b.rng*0.6){ if(!S.use3D||laneDistance(p,b)<12)b.x+=b.dir*b.spd*dt*60; b.walk+=dt*5; }
    if(b.atkT<=0){ b.atkT=b.enraged?1.1:1.7;
      const n=b.enraged?3:2;
      for(let i=0;i<n;i++){ const spread=(i-(n-1)/2)*0.22;
        const a=Math.atan2((p.y-24)-(b.y-40),p.x-b.x)+spread;
        const laneZ=b.laneZ||0, laneTime=Math.hypot(p.x-b.x,p.y-b.y)/330;
        S.projs.push({x:b.x,y:b.y-46,vx:Math.cos(a)*330,vy:Math.sin(a)*330,dmg:b.dmg*0.7,col:b.phase>=2?'#f44':'#ffd94d',kind:'bullet',owner:'enemy',life:2.5,t:0,laneZ,laneV:laneTime>0?((p.laneZ||0)-laneZ)/laneTime:0}); }
      AUDIO.shoot();
    }
  } else {
    if(d>70){ if(!S.use3D||laneDistance(p,b)<12)b.x+=b.dir*b.spd*dt*60*(b.enraged?1.3:1); b.walk+=dt*5; }
    else if(b.atkT<=0&&(!S.use3D||laneDistance(p,b)<18)&&(!S.use3D||Math.abs(p.y-b.y)<60)){ b.atkT=b.enraged?0.9:1.4;
      hurtPlayer(S,p,b.dmg); addFx(S,b.x+b.dir*30,b.y-36,'hit','#fff');
      addFx(S,b.x+b.dir*40,b.y-36,'ring',b.phase>=2?'#f44':'#fa4',90); }
  }
  b.x=clamp(b.x,60,W-60);
}

/* ---------- Ostacoli: sparano/colpiscono ---------- */
function obstacleFire(S,o){
  const p=S.player;
  if(!p||p.dead)return;
  /* duello col boss in corso: l'arena si svuota, gli ostacoli si fermano */
  if(S.boss&&!S.boss.dead&&S.bossIntro<=0)return;
  if(S.use3D&&laneDistance(p,o)>24) return;
  const targetLane=p.laneZ||0;
  switch(o.type){
    case 'vending': shoot(S,o,p.x,p.y-20,320,5,'#ffb347','bullet','enemy',targetLane); break;
    case 'sbarra': if(Math.abs(p.x-o.x)<70){ hurtPlayer(S,p,8); addFx(S,o.x,o.y-40,'hit','#f44'); } break;
    case 'alarm': S.projs.push({x:o.x,y:o.y-120,vx:0,vy:0,dmg:5,col:'#f44',kind:'ring',owner:'enemy',life:0.8,t:0,laneZ:o.laneZ||0});
      if(Math.abs(p.x-o.x)<130) hurtPlayer(S,p,5); break;
    case 'stampzone': if(Math.abs(p.x-o.x)<90) p.slowT=1.2; break;
    case 'shelf': for(let i=0;i<3;i++) shoot(S,o,p.x+rnd(-60,60),p.y-20,260,6,'#8cf','bullet','enemy',targetLane); break;
    case 'train': if(Math.abs(p.x-o.x)<200&&Math.random()<0.5){ hurtPlayer(S,p,10); S.screenShake=8; } break;
    case 'molla': if(Math.abs(p.x-o.x)<60){ p.invT=Math.max(p.invT,0.1); p.y=GY-70; setTimeout(()=>{p.y=GY;},400); } break;
    case 'copier': shoot(S,o,p.x,p.y-30,280,7,'#fff','bullet','enemy',targetLane); break;
    case 'ventola': if(Math.abs(p.x-o.x)<150){ p.vx+= (p.x<o.x?-1:1)*260; hurtPlayer(S,p,4); } break;
    case 'dentiera': if(Math.abs(p.x-o.x)<80){ hurtPlayer(S,p,7); addFx(S,o.x,GY-30,'hit','#fff'); } break;
    case 'tappeto': if(Math.abs(p.x-o.x)<130){ p.slowT=1.1; addFx(S,p.x,p.y-40,'pop','#c8a06a'); } break;
    case 'nastro': shoot(S,o,p.x,p.y-24,240,7,'#e8c96b','bullet','enemy',targetLane); break;
    case 'trex': if(Math.abs(p.x-o.x)<95){ hurtPlayer(S,p,12); S.screenShake=Math.max(S.screenShake,6); addFx(S,o.x,GY-46,'hit','#f44'); } break;
    case 'subwoofer': if(Math.abs(p.x-o.x)<150){ hurtPlayer(S,p,5); p.vx+=(p.x<o.x?-1:1)*180; S.screenShake=Math.max(S.screenShake,4); } break;
    case 'glitter': for(let i=0;i<3;i++) shoot(S,o,p.x+rnd(-70,70),p.y-24,300,5,'#ff6bd6','bullet','enemy',targetLane); break;
    case 'riflettore': if(Math.abs(p.x-o.x)<110){ hurtPlayer(S,p,4); S.flash=Math.max(S.flash||0,0.15); } break;
    case 'cannon': shoot(S,o,p.x,p.y-20,340,8,'#4a5ac8','bullet','enemy',targetLane); break;
    case 'lampadario': if(Math.abs(p.x-o.x)<85){ hurtPlayer(S,p,9); S.screenShake=Math.max(S.screenShake,6); addFx(S,o.x,GY-70,'hit','#ffd94d'); for(let i=0;i<3;i++)addDecal(S,o.x+rnd(-20,20),o.y,'#c9a44a',rnd(.4,.7),o.laneZ); } break;
    case 'martelletto': if(Math.abs(p.x-o.x)<95){ hurtPlayer(S,p,11); S.screenShake=Math.max(S.screenShake,8); addFx(S,o.x,GY-30,'slam','#8a5ac8',1,o.laneZ); } break;
  }
}

/* ---------- Esplosione macigno ---------- */function boulderBoom(S,pr){
  addFx(S,pr.x,pr.y,'ring','#7bc86c',110,pr.laneZ);
  S.screenShake=6;  if(S.mode==='duel'){
    const target=pr.owner==='player'?S.ally:S.player;
    if(target&&!target.dead&&combatDistance(S,target,pr)<(target.kind==='boss'?110:100)){hurtCombatTarget(S,target,pr.dmg,10,pr.x);}
  } else {
    S.enemies.forEach(e=>{if(!e.dead&&combatDistance(S,e,pr)<100)hurtEnemy(S,e,pr.dmg,20,pr.x);});
    if(S.boss&&!S.boss.dead&&combatDistance(S,S.boss,pr)<110)hurtEnemy(S,S.boss,pr.dmg*0.8,10,pr.x);
  }
}

/* ---------- Alleato / avversario duello ---------- */
function updateAlly(S,a,dt){
  if(S.mode==='duel'&&S.duelIntroT>0)return;
  /* Avversario BOSS nel duello: delega all'AI a fasi dei boss */
  if(S.duelVsBoss){
    if(a.dead){
      a.t+=dt;
      if(S.mode==='duel'&&!S.roundEndT&&!S.over){ S.roundEndT=1.3; S.roundWinner=1; }
      return;
    }
    updateBoss(S,a,dt,S.player);
    return;
  }
  a.t+=dt; a.atkT=Math.max(0,a.atkT-dt); a.abCd=Math.max(0,a.abCd-dt);
  a.invT=Math.max(0,a.invT-dt); a.hitFlash=Math.max(0,a.hitFlash-dt);
  a.usingT=Math.max(0,a.usingT-dt); if(a.usingT<=0)a.using=0;
  a.attackPoseT=Math.max(0,a.attackPoseT-dt); if(a.attackPoseT<=0){a.attackPose=null;a.attackPoseMax=0;}
  a.leadT=Math.max(0,a.leadT-dt); a.squash=Math.max(0,a.squash-dt*1.5);
  a.ultActive=Math.max(0,a.ultActive-dt);  a.walk+=Math.abs(a.vx||0)*dt*0.35;
  if(S.mode==='duel')a.chaosCharge=clamp((a.chaosCharge||0)+1.4*dt,0,100);
  const foe=S.player;
  if(S.mode==='duel'&&foe&&!foe.dead&&!a.dead){
    if(!S.duelCpu){ humanAlly(S,a,S.inp2||{},dt); }
    else {
      a.dir=foe.x>a.x?1:-1;
      const d=S.use3D?Math.hypot(foe.x-a.x,laneDistance(a,foe)):Math.abs(foe.x-a.x);
      const w=DATA.Weapons[a.colors.weapon]||DATA.Weapons.mattarello;
      if(d>44){ a.vx=a.dir*a.speed; a.x+=a.vx*dt*60; a.walk+=dt*6; } else a.vx=0;
      if(S.use3D){ const laneDelta=(foe.laneZ||0)-(a.laneZ||0); if(Math.abs(laneDelta)>10)a.laneZ=(a.laneZ||0)+Math.sign(laneDelta)*Math.min(Math.abs(laneDelta),a.speed*0.4*dt*60); }
      if(d<=44&&a.atkT<=0&&(!S.use3D||laneDistance(a,foe)<24)){
        if(w.kind!=='melee'||!S.use3D||Math.abs(a.y-foe.y)<60){
          a.atkT=w.rate*1.3; a.using=1; a.usingT=0.3;
          a.attackPose=w.fx||w.kind;a.attackPoseT=0.3;a.attackPoseMax=0.3;
          if(w.kind==='melee'){ hurtPlayer(S,foe,w.dmg*0.8); addFx(S,a.x+a.dir*30,a.y-30,'slash','#fff',1,a.laneZ); AUDIO.hit(); }
          else { shoot(S,a,foe.x,foe.y-24,380,w.dmg*0.8,'#ffd94d','bullet','enemy',foe.laneZ||0); AUDIO.shoot(); }
        }
      }
      if(a.abCd<=0&&d<170&&Math.random()<0.02){ useAbility(S,a); }
      if(a.chaosCharge>=100&&Math.random()<0.01){ useUltimate(S,a); }
      a.x=clamp(a.x,30,W-30);
    }
  }
}
/* P2 umano nel duello locale: F/G/H per agire, si volta da solo se non si muove */
function humanAlly(S,a,in2,dt){
  const foe=S.player;
  let mv=0;  if(in2.left)mv-=1; if(in2.right)mv+=1;
  mv=clamp(mv+(in2.padMoveX||0),-1,1);
  if(mv===0&&foe&&!foe.dead)a.dir=foe.x>a.x?1:-1;
  a.vx=mv*a.speed; a.x=clamp(a.x+a.vx*dt*60,30,W-30);
  if(S.use3D){ let lane=0; if(in2.up)lane-=1; if(in2.down)lane+=1; const targetLane=lane*70; a.vz+=(targetLane-(a.vz||0))*Math.min(1,0.22*dt*60); if(Math.abs(a.vz)<1.5&&lane===0)a.vz=0; a.laneZ=clamp((a.laneZ||0)+a.vz*dt,-112,112); }
  if(mv!==0)a.dir=mv>0?1:-1;
  if(in2.attack) doAttackAlly(S,a);
  if(in2.ability&&a.abCd<=0){ useAbility(S,a); }
  if(in2.ult&&a.chaosCharge>=100){ useUltimate(S,a); }
  if(in2.dash&&!a.dashCd){
    a.dashCd=0.8; a.invT=Math.max(a.invT,0.25);
    a.x=clamp(a.x+Math.sign(mv||a.dir)*52,30,W-30);
    AUDIO.dash(); addFx(S,a.x,a.y-30,'dash','#fff',1,a.laneZ);
  }
  if(a.dashCd)a.dashCd=Math.max(0,a.dashCd-dt);
}
function doAttackAlly(S,a){ doAttack(S,a); }

/* ---------- Boss sconfitto ---------- */
function onBossDefeated(S){
  S.screenShake=12; AUDIO.unlock();
  const bx=S.boss||S.ally;
  for(let i=0;i<24;i++) addFx(S,bx.x+rnd(-40,40),bx.y-40,'bit',['#ffd94d','#ff4dd2','#39FF14'][i%3]);
  if(S.mode==='duel') return; /* nel duello il boss è solo un avversario */
  const L=DATA.Levels[S.levelIdx];
  if(S.mode==='trial'){
    /* PROVA SVITATA superata: sblocco alternativo + trofeo + record + classifica */
    const ti=S.levelIdx, T=DATA.Trials[ti];
    if(SAVE.unlockChar(T.id)) S.newChar=T.id;
    SAVE.trophy('trial'+(ti+1));
    const time=+S.t.toFixed(1);
    const recs=SAVE.data.trialBest=SAVE.data.trialBest||{};
    if(!recs[T.id]||time<recs[T.id]) recs[T.id]=time;
    S.trialRank=SAVE.addTrialScore(T.id,S.player.charId,time);
  } else if(S.mode==='marathon'){
    /* MARATONA: la vita si porta dietro — il boss successivo parte più debole
       se hai chiuso il precedente IN FRETTA (par 45s: min 30% HP, max 100%). */
    const frac=clamp(((S.t-(S.marathonStartT||0))/45),0.3,1);
    S.marathonIdx=(S.marathonIdx||0)+1;
    if(S.marathonIdx>=DATA.Marathon.length){
      SAVE.trophy('marathon');
      S.marathonDone=true;
    } else {
      const M=DATA.Marathon[S.marathonIdx];
      S.player.hp=Math.min(S.player.maxHp,S.player.hp+45);
      S.boss=makeBoss(M.boss,1);
      S.environmentIdx=Math.max(0,(M.bg||1)-1);
      setExploration(S,S.environmentIdx);
      S.boss.hp=S.boss.maxHp=Math.max(120,Math.round(S.boss.maxHp*frac));
      S.marathonStartT=S.t;
      S.bossDefeated=false; S.overT2=0;
      S.bossIntro=2.2;
      S.phaseMsg='PROVA '+(S.marathonIdx+1)+'/3 — '+DATA.BossNames[M.boss]; S.phaseT=2.4;
      S.screenShake=10;
    }
  } else {
    const cid=charFromBoss(L.boss);
    if(S.mode==='story'&&cid){ if(SAVE.unlockChar(cid)) S.newChar=cid; }
    if(S.levelIdx===0) SAVE.trophy('lv1');
    if(L.final) SAVE.trophy('lv8');
    if(S.mode==='weekly'){ SAVE.data.weeklyDone=(SAVE.data.weeklyDone||0)+1; SAVE.trophy('weekly'); }
    SAVE.data.storyLevel=Math.max(SAVE.data.storyLevel,S.levelIdx+1);
  }
  SAVE.save();
}
function charFromBoss(b){
  return {bendaggio:'mimi',custode:'bruno',timbro:'ferdinando',coupon:'dolores',
    capotreno:'kevin',palloncino:'carla',manager:'zappo',cervellone:null}[b]||null;
}

return { start, update, W, H, GY, makePlayer, makeEnemy, makeBoss, rnd, ri, clamp, dist,
  hurtEnemy, useAbility, useUltimate, doAttack, addFx };
})();
