/* ===== UNHINGED WARFARE — Database di gioco ===== */
window.DATA=(function(){
const Chars={};
/* ---------------- PERSONAGGI (10) ---------------- */
Chars.zappo={
  id:'zappo', name:'FIGLIO DEL DIAVOLO', short:'IL DEMONIO', theme:'#ff3030',
  hp:105, speed:2.5, scale:0.9, unlock:'start',
  desc:'Fuggito dall’Inferno per noia. Sprigiona fiamme caotiche e impreca a 380 Volt.',
  ability:{name:'Zampata Infernale', cd:3.4, dmg:24, type:'wave', knock:16},
  ult:{name:'Pioggia di Brimstone', dmg:38, type:'chain'},
  tips:'Le sue fiamme rimbalzano tra i nemici spargendo zolfo e panico.'
};
Chars.mimi={
  id:'mimi', name:'ANGELO CADUTO IN DISGRAZIA', short:'ANGELO CADUTO', theme:'#b565ff',
  hp:95, speed:2.65, scale:0.9, unlock:'level2',
  desc:'Cacciata dal Paradiso per furto di ostie. Le sue lacrime sacre sono autentiche onde d’urto.',
  ability:{name:'Lacrime dell’Abisso', cd:3.8, dmg:20, type:'wave', knock:24},
  ult:{name:'Giudizio Apocalittico', dmg:36, type:'tide'},
  tips:'Onda d’urto sacra enorme: spazza via gruppi interi facendoli rimbalzare.'
};
Chars.bruno={
  id:'bruno', name:'PADRE DIVORZIATO', short:'PADRE DIVORZIATO', theme:'#596b78',
  hp:170, speed:1.35, scale:1.05, unlock:'level3',
  desc:'Vive di surgelati, canotta stazzonata e rancore per l’ex. Ha 400 kg di massa impassibile.',
  ability:{name:'Rancore Inossidabile', cd:8.5, dmg:0, type:'lead', dur:4.0},
  ult:{name:'Sgombero Forzato', dmg:44, type:'quake'},
  tips:'Attiva il rancore: invulnerabile, schiaccia chiunque attraversi a passo pesante.'
};
Chars.ferdinando={
  id:'ferdinando', name:'AVVOCATO FALLITO', short:'AVVOCATO FALLITO', theme:'#d4af37',
  hp:100, speed:2.7, scale:0.9, unlock:'level4',
  desc:'Radiato dall’albo per denunce surreali. Ogni suo colpo notifica tre ingiunzioni di fila!',
  ability:{name:'Ricorso d’Urgenza', cd:4.8, dmg:16, type:'triple'},
  ult:{name:'Ingiunzione Suprema', dmg:38, type:'whistle'},
  tips:'Ogni attacco diventa una raffica tripla con stordimento legale progressivo.'
};
Chars.dolores={
  id:'dolores', name:'NONNA ANARCHICA', short:'NONNA ANARCHICA', theme:'#70b85d',
  hp:110, speed:2.3, scale:0.95, unlock:'level5',
  desc:'Non riconosce alcuna autorità né le scadenze dei barattoli. Lancia conserve esplosive.',
  ability:{name:'Conserva Esplosiva', cd:4.2, dmg:32, type:'throw'},
  ult:{name:'Apocalisse della Dispensa', dmg:46, type:'button'},
  tips:'Il barattolo esplode come una bomba a frammentazione casalinga con danno ad area.'
};
Chars.kevin={
  id:'kevin', name:'COMPLOTTISTA PARANOICO (Kevin²)', short:'IL COMPLOTTISTA', theme:'#ff7f32',
  hp:110, speed:2.55, scale:0.95, unlock:'level6',
  desc:'Due copie nate da un microonde rubato. Litigano perennemente accusandosi a vicenda.',
  ability:{name:'Rissa Psicotica', cd:5.2, dmg:22, type:'fight'},
  ult:{name:'Paranoia di Massa', dmg:38, type:'double'},
  tips:'I due complottisti si azzuffano generando un vortice caotico di botte.'
};
Chars.carla={
  id:'carla', name:'CARLA LA FEMMINISTA', short:'CARLA FEMMINISTA', theme:'#ff2e7e',
  hp:105, speed:2.85, scale:0.9, unlock:'level7',
  desc:'Attivista estrema col megafono da 4000 Watt. I suoi cori abbattono mascelle e barriere.',
  ability:{name:'Slogan Spacca-Timpani', cd:4.6, dmg:26, type:'wave', knock:18},
  ult:{name:'Manifestazione Totale', dmg:42, type:'disco'},
  tips:'Onde sonore a 360° che disintegrano gli accerchiamenti all’istante.'
};
Chars.sandro={
  id:'sandro', name:'L’IDRAULICO LUNATICO', short:'IDRAULICO LUNATICO', theme:'#e65c00',
  hp:125, speed:2.3, scale:1.0, unlock:'chaos20',
  desc:'Intossicato da esalazioni fognarie. Risolve qualsiasi problema intasando il nemico di liquami bollenti.',
  ability:{name:'Spurgo Caustico', cd:4.2, dmg:14, type:'fry', burn:8, dur:2.5},
  ult:{name:'Sturatura Nucleare', dmg:38, type:'fryer'},
  tips:'Le pozze di scolo caustiche ustionano e rallentano chiunque ci metta piede.'
};
Chars.paolo={
  id:'paolo', name:'TRADER IN BANCAROTTA (Paolo 5%)', short:'TRADER FALLITO', theme:'#20c997',
  hp:95, speed:2.65, scale:0.92, unlock:'duel3',
  desc:'Ha perso tutto con meme-coin di criceti. Batteria al 5%: quando attiva il risparmio congela la realtà!',
  ability:{name:'Liquidazione Forzata', cd:8.5, dmg:0, type:'battery', dur:4.2},
  ult:{name:'Bull Run all’Inferno', dmg:38, type:'overdrive'},
  tips:'Rallenta il mondo al 40% e carica la barra CAOS a velocità fulminea.'
};
Chars.lucia={
  id:'lucia', name:'L’ESATTORE SPIETATO', short:'L’ESATTORE', theme:'#3a8fd9',
  hp:108, speed:2.55, scale:0.92, unlock:'chaos50',
  desc:'Ispettrice fiscale implacabile: pignora i proiettili nemici e li rimanda con mora al 200%.',
  ability:{name:'Pignoramento Istantaneo', cd:4.6, dmg:12, type:'sweep'},
  ult:{name:'Controllo Fiscale Totale', dmg:34, type:'redact'},
  tips:'Assorbe i colpi nemici circostanti e li rispedisce come cartelle esattoriali letali.'
};
Chars.ninoz={
  id:'ninoz', name:'NINOZ IL TRAPPER', short:'NINOZ', theme:'#e056fd',
  hp:115, speed:2.75, scale:0.92, unlock:'pills',
  desc:'Rapper europeo con capelli grigi, outfit oversize baggy e occhiali da sole a lenti rosse fiammanti. Scatena bombe di farina, mozziconi esplosivi e raffiche di piombo.',
  ability:{name:'Sigarette Esplosive', cd:3.6, dmg:28, type:'wave', knock:18},
  ult:{name:'Bomba di Farina', dmg:48, type:'flourbomb'},
  tips:'La Bomba di Farina crea un’enorme nuvola bianca che stordisce e acceca i nemici infliggendo danno devastante ad area.'
};

/* ---------------- ARMI (15) ---------------- */
const Weapons={
  mattarello:{name:'Mattarello Rullo', dmg:10, rate:.38, rng:46, kind:'melee', fx:'flour', price:0},
  randello:{name:'Randello del Vicino', dmg:16, rate:.5, rng:56, kind:'melee', fx:'none', price:420, aoe:.25},
  martello:{name:'Martello del Giudizio', dmg:21, rate:.64, rng:62, kind:'melee', fx:'slam', price:1300, aoe:.5},
  cucchiaio:{name:'Cucchiaio di Plastica', dmg:7, rate:.22, rng:40, kind:'melee', fx:'none', price:150},
  ombrello:{name:'Ombrello Scatto', dmg:8, rate:.30, rng:58, kind:'melee', fx:'spoke', price:200},
  estintore:{name:'Estintore Mazza', dmg:14, rate:.55, rng:50, kind:'melee', fx:'smoke', price:300, aoe:.4},
  spranga:{name:'Spranga Arrugginita', dmg:15, rate:.6, rng:52, kind:'melee', fx:'none', price:350, aoe:.3},
  padella:{name:'Padella Lancio', dmg:20, rate:.5, rng:150, kind:'ranged', fx:'pan', price:500},
  trombetta:{name:'Trombetta Stordente', dmg:9, rate:.42, rng:120, kind:'ranged', fx:'note', price:450},
  peluche:{name:'Peluche di Ferro', dmg:18, rate:.7, rng:46, kind:'melee', fx:'fluff', price:600, aoe:.5},
  megafono:{name:'Megafono Urla', dmg:9, rate:.6, rng:140, kind:'ranged', fx:'wave', price:700},
  ciabatta:{name:'Ciabatta a Molla', dmg:13, rate:.34, rng:66, kind:'melee', fx:'snap', aoe:.35, price:780},
  aspirafogli:{name:'Aspirafogli Portatile', dmg:8, rate:.34, rng:210, kind:'ranged', fx:'paper', price:850, pull:true},
  gelato:{name:'Gelato Balistico', dmg:14, rate:.48, rng:190, kind:'ranged', fx:'scoop', price:920, splash:46},
  anatra:{name:'Anatra da Bagno Supersonica', dmg:17, rate:.62, rng:175, kind:'ranged', fx:'duck', price:1050, splash:68},
  tostapane:{name:'Tostapane a Raffica', dmg:7, rate:.56, rng:190, kind:'ranged', fx:'toast', price:1120, spread:3},
  trombone:{name:'Trombone del Giudizio', dmg:12, rate:.52, rng:170, kind:'ranged', fx:'brass', price:1250, stun:.32},
  secchio:{name:'Secchio d\'Acqua Maleodorante', dmg:12, rate:.5, rng:155, kind:'ranged', fx:'splash', price:900, splash:55},
  teschio:{name:'Teschio da Scrivania', dmg:15, rate:.46, rng:175, kind:'ranged', fx:'bone', price:980, stun:.18},
  birra:{name:'Boccale dell\'Osteria Stregata', dmg:17, rate:.58, rng:165, kind:'ranged', fx:'glass', price:1020, splash:42},
  fuoco:{name:'Fuoco d\'Artificio del Vicino', dmg:14, rate:.55, rng:205, kind:'ranged', fx:'spark', price:1150, spread:2},
  forcone:{name:'Forcone del Demonio', dmg:20, rate:.46, rng:64, kind:'melee', fx:'flour', price:480, aoe:.35},
  sturalavandini:{name:'Sturalavandini a Pompa', dmg:16, rate:.36, rng:54, kind:'melee', fx:'splash', price:450, aoe:.3},
  valigetta:{name:'Valigetta Giudiziaria', dmg:18, rate:.50, rng:50, kind:'melee', fx:'paper', price:490, aoe:.4},
  cartello:{name:'Cartello di Rivolta', dmg:19, rate:.44, rng:62, kind:'melee', fx:'wave', price:520, aoe:.42},
  machete:{name:'Machete da Strada', dmg:24, rate:.38, rng:58, kind:'melee', fx:'slam', price:650, aoe:.45},
  sigarette:{name:'Sigarette Esplosive', dmg:22, rate:.42, rng:170, kind:'ranged', fx:'spark', price:700, splash:55},
  mitra:{name:'Mitra da Barrio', dmg:11, rate:.16, rng:220, kind:'ranged', fx:'smoke', price:850, spread:1}
};

/* ---------------- OUTFIT (8) ---------------- */
const Outfits={
  tuta:{name:'Tuta da Lavoro', price:0},
  camice:{name:'Camice con Anatre', price:120},
  pentole:{name:'Armatura di Pentole', price:260},
  elegante:{name:'Elegante + Ciabatte', price:300},
  fenicottero:{name:'Fenicottero Gonfiabile', price:400},
  aerobica:{name:'Tuta Aerobica Fluò', price:350},
  spacca:{name:'Completo Strappato', price:480},
  mascotte:{name:'Mascotte Sformata', price:550}
};

/* ---------------- Cappelli (8) ---------------- */
const Hats={
  nessuno:{name:'Nessuno', price:0},
  casco:{name:'Casco Consegne', price:80},
  cappaglia:{name:'Cappello di Paglia', price:140},
  cilindro:{name:'Cilindro Storto', price:160},
  elmetto:{name:'Elmetto da Cantiere', price:220},
  pallone:{name:'Palloncino su Testa', price:260},
  corna:{name:'Fascia con Corna', price:300},
  aureola:{name:'Aureola Storta', price:500}
};

/* ---------------- LIVELLI (13) ---------------- */
const Levels=[
 { id:1, name:'IL REPARTO CHE NON DORME MAI', place:'Ospedale', boss:'bendaggio',
   enemies:['nurse','gurney'], hp:55, waves:5, reward:120, obst:['vending','sbarra'] },
 { id:2, name:'PARCHEGGIO LIVELLO -3', place:'Parcheggio Multipiano', boss:'custode',
   enemies:['drone','cart'], hp:60, waves:6, reward:150, obst:['sbarra','ventola'] },
 { id:3, name:'STAZIONE DI POLIZIA n.9', place:'Commissariato', boss:'timbro',
   enemies:['folder','clerk'], hp:65, waves:6, reward:180, obst:['stampzone','copier'] },
 { id:4, name:'SUPERMERCATO H24', place:'Supermercato Notturno', boss:'coupon',
   enemies:['cart','granny'], hp:70, waves:7, reward:210, obst:['shelf','molla'] },
 { id:5, name:'METRO FANTASMA', place:'Metropolitana', boss:'capotreno',
   enemies:['passenger','folder'], hp:75, waves:7, reward:240, obst:['train','molla'] },
 { id:6, name:'LUNA PARK CHIUSO PER FERIE', place:'Luna Park', boss:'palloncino',
   enemies:['clown','plant'], hp:80, waves:8, reward:270, obst:['molla','shelf'] },
 { id:7, name:'UFFICIO PIANO 12', place:'Grattacielo', boss:'manager',
   enemies:['shredder','silla'], hp:85, waves:8, reward:300, obst:['copier','stampzone'] },
 { id:8, name:'VILLA RIPOSO ETERNO', place:'Ospizio', boss:'badante',
   enemies:['wheelchair','knitter'], hp:90, waves:8, reward:330, obst:['dentiera','tappeto'] },
 { id:9, name:'GATE 0 — IMBARCO IMMEDIATO', place:'Aeroporto', boss:'gatekeep',
   enemies:['suitcase','steward'], hp:95, waves:8, reward:360, obst:['nastro','trex'] },
 { id:10, name:'PISTA MITO 88', place:'Discoteca', boss:'deejay',
   enemies:['dancer','barman'], hp:100, waves:9, reward:390, obst:['subwoofer','glitter'] },
 { id:11, name:'I DUE TALLERI', place:'Stadio', boss:'allenatore',
   enemies:['ultrass','mascotte'], hp:105, waves:9, reward:420, obst:['riflettore','cannon'] },
 { id:12, name:'TORNEO DI QUALIFICAZIONE', place:'Stadio — Tribuna VIP', boss:'bandierona',
   enemies:['ultrass','mascotte','dancer'], hp:110, waves:9, reward:450, obst:['cannon','subwoofer'] },
 { id:13, name:'VILLA DELLE URLA SOSPETTE', place:'Casa Abbandonata', boss:'fantasma',
   enemies:['spettro','ratto','granny'], hp:115, waves:9, reward:470, obst:['lampadario','dentiera'] },
 { id:14, name:'PROCESSO SOMMARIO (E ASSURDO)', place:'Tribunale', boss:'giudice',
   enemies:['usciere','avvocato','clerk'], hp:120, waves:10, reward:490, obst:['martelletto','copier'] },
 { id:15, name:'IL CERVELLONE', place:'Impianto Centrale', boss:'cervellone', final:true,
   enemies:['nurse','drone','clown','clerk','shredder'], hp:999, waves:0, reward:500, obst:['ventola','copier'] }
];

/* ---------------- PROVE SVITATE (sblocco alternativo) ---------------- */
const Trials=[
 { id:'sandro', boss:'fritto', char:'zappo', bg:4,
   name:{it:'LA CUCINA INFERNALE',en:'THE INFERNAL KITCHEN'} },
 { id:'paolo', boss:'energia', char:'mimi', bg:7,
   name:{it:'LA CAMERA BIANCA',en:'THE CLEAN ROOM'} },
 { id:'lucia', boss:'archivio', char:'bruno', bg:3,
   name:{it:'IL SEMINTERRATO DEI FASCICOLI',en:'THE FILEMENT BASEMENT'} }
];

/* Maratona dei Boss: i 3 leggendari in sequenza — ordine di affronto */
const Marathon=[
 { trial:'sandro', boss:'fritto', bg:4 },
 { trial:'paolo', boss:'energia', bg:7 },
 { trial:'lucia', boss:'archivio', bg:3 }
];
const Trophies=[
 {id:'lv1', icon:'🏥', name:{it:'Il Reparto che Non Dorme Mai',en:'The Ward That Never Sleeps'}, desc:{it:'Completa il livello 1',en:'Complete level 1'}},
 {id:'lv8', icon:'🧠', name:{it:'Il Cervellone',en:'The Big Brain'}, desc:{it:'Completa la Storia',en:'Complete the Story'}},
 {id:'c50', icon:'♾️', name:{it:'Incubo Infinito',en:'Endless Nightmare'}, desc:{it:'Ondata 50 in Caos',en:'Wave 50 in Chaos'}},
 {id:'combo30', icon:'🔥', name:{it:'Fornace',en:'Furnace'}, desc:{it:'Combo x30',en:'30x combo'}},
 {id:'clip', icon:'🎬', name:{it:'Regista del Caos',en:'Chaos Director'}, desc:{it:'Salva una clip',en:'Save a clip'}},
 {id:'full', icon:'👑', name:{it:'Collezione Completa',en:'Full Collection'}, desc:{it:'Sblocca tutti gli Svitati',en:'Unlock all Unhinged'}},
 {id:'rich', icon:'💰', name:{it:'Magnate del Caos',en:'Chaos Tycoon'}, desc:{it:'Accumula 5000 monete totali',en:'Earn 5000 total coins'}},
 {id:'ult10', icon:'⚡', name:{it:'Overload',en:'Overload'}, desc:{it:'Usa 10 ultimate',en:'Use 10 ultimates'}},
 {id:'weekly', icon:'📅', name:{it:'Settimana Svitata',en:'Unhinged Week'}, desc:{it:'Completa una Sfida Settimanale',en:'Complete a Weekly Challenge'}},
 {id:'duel', icon:'⚔️', name:{it:'Maestro del Duello',en:'Duel Master'}, desc:{it:'Vinci 5 Duelli',en:'Win 5 duels'}},
 {id:'trial1', icon:'🍳', name:{it:'Cuoco Estremo',en:'Extreme Cook'}, desc:{it:'Batte il Moletossico Supremo',en:'Beat the Supreme Moletossic'}},
 {id:'trial2', icon:'🔋', name:{it:'Sovraccarico',en:'Overcharge'}, desc:{it:'Batte il Moderatore Energia∞',en:'Beat the Energy Moderator'}},
 {id:'trial3', icon:'🗄️', name:{it:'Polvere d\'Archivio',en:'Dust of Archives'}, desc:{it:'Batte l\'Archivista Supremo',en:'Beat the Supreme Archivist'}},
 {id:'marathon', icon:'🏃', name:{it:'Svitato Per Sempre',en:'Unhinged Forever'}, desc:{it:'Completa la Maratona dei Boss',en:'Complete the Boss Marathon'}}
];

return { Chars, Weapons, Outfits, Hats, Levels, Trophies, Trials, Marathon,
  BossNames:{
    bendaggio:'DOTTOR BENDAGGIO', custode:'IL CUSTODE DEL TICKET', timbro:'SERGENTE TIMBRO',
    coupon:'LA SIGNORA DEI COUPON', capotreno:'IL CAPOTRENO ETERNO', palloncino:'ZIO PALLONCINO',
    manager:'IL MANAGER DELLE RIUNIONI', badante:'BADANTE BARBARA', gatekeep:'IL GATEKEEPER',
    deejay:'DJ SUBBOTTA', allenatore:'IL COMMISSARIO TECNICO', bandierona:'IL BANDIERONA',
    fantasma:'L\'INQUILINO DI PIANO -1', giudice:'IL GIUDICE ASSOLUTAMENTE NO',
    fritto:'MOLETOSSICO SUPREMO', energia:'MODERATORE ENERGIA∞', archivio:'L\'ARCHIVISTA SUPREMO',
    cervellone:'IL CERVELLONE'
  }
};})();
