# VERSION — UNHINGED WARFARE

## v1.4.2 — "PRONTO DA COLLAUDARE" (Settembre 2026)

- Allineate schermata titolo, menu e metadati PWA ai 13 livelli e alla versione
  effettiva del progetto.
- Aggiunto `qa_local.py` per ripetere i controlli statici sul bundle, renderer,
  localizzazioni, precache e risorse locali prima di ogni pubblicazione.
- Aggiornata la guida di pubblicazione: separa i controlli statici dalle prove
  URL, WebGL, gameplay, offline e installazione, da eseguire nell'ambiente reale.
- Corretto un errore di sintassi residuo nel sorgente del renderer Three.js.

### 🔎 VERIFICA
- Build e 29 controlli QA locali statici superati. Nessun browser runtime o
  dispositivo è stato collaudato; pubblicazione e test end-to-end restano aperti.

---

## v1.4.1 — "SEGNI DI VITA" (Settembre 2026)

- Aggiunti accenti animati ai landmark dei livelli: monitor e varco del
  parcheggio, scanner e segnale metro, pianta e orologio dell’ospizio,
  tabellone partenze, specchio rotante, scoreboard e nucleo del reattore.
- I 40 reperti esplorativi hanno emblemi 3D coerenti con il tema di ciascuna
  arena; le animazioni sono leggere e non alterano gameplay o fallback 2D.
- Le lancette ruotano attorno al perno, le cabine seguono la ruota panoramica
  mantenendosi dritte, e gli accenti si ricostruiscono a ogni cambio arena.

### 🔎 VERIFICA
- Build e controlli statici del bundle superati; rendering WebGL non
  collaudato in browser in questa sessione.

---

## v1.4.0 — "LUOGHI DA VIVERE" (Settembre 2026)

> Ogni arena ora racconta il proprio luogo, con dettagli animati e segreti
> persistenti da esplorare: non solo uno sfondo diverso, ma piccole storie da
> scoprire tra un’ondata e l’altra.

### 🗺️ IDENTITÀ PER TUTTE LE ARENE
- Motivi a pavimento specifici per tutti i 13 ambienti: linoleum ospedaliero,
  stalli del parcheggio, corsie della metro, parquet dell’ospizio, gate
  aeroportuale, campo da calcio e tribuna VIP, oltre agli altri luoghi.
- Landmark riconoscibili in ogni livello; ruota panoramica, cabine sospese,
  orologio, allarmi e dettagli del reattore hanno animazioni leggere.
- Oggetti segreti persistenti e ricompense esplorative per tutti i 13 livelli;
  le Prove e i passaggi della Maratona mostrano i segreti della loro arena.
- Rigenerato `gioca.html`, mantenendo Three.js progressivo e fallback Canvas2D.

### 🔎 VERIFICA
- Verifiche statiche del bundle, dei 13 landmark, dei 40 punti d’interesse e
  delle localizzazioni IT/EN. Il renderer WebGL non è stato collaudato in un
  browser in questa sessione.

---

## v1.2.0 — "ORA SI VEDE" (Settembre 2026)

> Rinnovamento grafico e game-feel: schermo pieno reale, personaggi grandi
> e leggibili, pavimenti rovinati con identità per livello, juice da brawler.

### 📷 CAMERA E SCHERMO (il cambio più grosso)
- **Schermo pieno reale**: il mondo non passa più per la scala "contain" del
  menu → niente più bande nere laterali; il gioco riempie ogni aspect ratio.
- **Camera v2**: scala COVER + zoom di leggibilità adattivo (i personaggi
  risultano ~1.4× più grandi), look-ahead sulla velocità, lerp morbida,
  vista **ancorata al fondo** (su schermi panoramici si taglia il cielo,
  mai il terreno), zoom dolce quando parte l'ultimate.
- **Pavimento v2**: prerender offscreen (zero costo per frame) con piastrelle
  irregolari, crepe, macchie e palette dedicata per ognuno dei 13 livelli
  (linoleum ospedale, cemento parcheggio + strisce, parquet ospizio,
  pista da ballo, manto stadio…), riflesso di luce che corre sul bordo.
- **Vignetta** sui bordi dello schermo (disattivabile con qualità Bassa).

### 👁 LEGGIBILITÀ DEGLI ATTORI
- Personaggi e nemici più grandi (scala ×1.35 / ×1.25 nei motori).
- **Alone di luce** attorno al giocatore + freccia gialla rimbalzina.
- **Barra vita sopra OGNI nemico** (verde→giallo→rosso; i boss la hanno
  più grande). Telegrafo **"!" rosso** quando l'attacco nemico è imminente.

### 💥 GAME FEEL (juice)
- **Numeri di danno** fluttuanti (giallo per i colpi forti).
- **Hit-stop** di 60 ms sui kill (il colpo si "sente").
- **Input buffering 0,2 s**: l'attacco/abilità/ultimate premuto un attimo
  prima parte appena pronto — più touch sfasati, più permissive.
- **Accelerazione e frenata morbide** (poco peso al personaggio).
- **Vibrazione** sul danno subito (se Haptics è attivo nelle impostazioni).

### 📱 TOUCH (fix reali)
- **FIX: il pulsante pausa touch non esisteva** nell'overlay attivo → ora
  è disegnato, registrato e funzionante.
- **FIX: su mobile i bottoni dei menu non rispondono** (il ramo touch si
  mangiava il tocco) → ora un tocco fuori dai controlli passa ai menu.
- **Cooldown ad arco** su A/B/⚡: il bottone si "riempie" man mano che
  attacco/abilità/ultimate sono pronti.
- Deadzone joystick (i passi fantasma da tocco fermo sono finiti).
- **FIX: le due vistose bande vuote sopra/sotto l'overlay di pausa e
  risultati** → velatura ora a schermo intero.

### 🐛 FIX COLLATERALI
- `cw is not defined` avviando una partita (refuso dello step camera).
- Scacchi muro ospedale più fini (a zoom alto erano enormi).

---

## v1.1.0 — "LA GUERRA SI ALLARGA" (Settembre 2026)

> Da 7 a 10 Svitati, da 8 a 13 livelli, tre boss leggendari, la Maratona,
> il Duello contro i boss e — finalmente — i colpi a distanza che colpiscono.

### 🆕 NUOVI SVITATI (10 totali)

| Personaggio | Abilità folle | Ultimate (Caos) | Sblocco |
|---|---|---|---|
| **SANDRO "IL LAPO"** — ex friggitore, frigge a occhio | **Frittura Immediata**: schizzo d'olio, ustione nel tempo + pozza che frigge chi ci passa (lui no) | La Friggitrice Suprema | Ondata 20 in Caos **oppure** Prova Svitata |
| **PAOLO "5%"** — ex progettista di batterie, vivacità al 5% | **Risparmio Energetico**: il mondo rallenta al 45%, carica CAOS ×4 | Ricarica Veloce 1000% (si ricarica da sola: ultimate a catena) | 3 Duelli vinti **oppure** Prova Svitata |
| **L'ANTINOSTALGIA (Lucia)** — ex archivista: non pulisce, CANCELLA | **Spolverata della Dimenticanza**: ruba i proiettili e li rispedisce come bollette (più forti) | Registro Cancellato | Ondata 50 in Caos **oppure** Prova Svitata |

Sprite procedurali nuovi, voci i18n IT/EN, tips in caricamento, tutorial
abilità dedicato al primo utilizzo.

### 🗺️ STORIA ALLARGATA: 8 → 13 LIVELLI

| # | Luogo | Boss |
|---|---|---|
| 8 | Villa Riposo Eterno (Ospizio) | **BADANTE BARBARA** — abbracci a 360° e siringone di emozioni obbligatorie |
| 9 | Gate 0 — Imbarco Immediato (Aeroporto) | **IL GATEKEEPER** — "CARTA D'IDENTITÀ! CARTA D'IDENTITÀ!" |
| 10 | Pista Mito 88 (Discoteca) | **DJ SUBBOTTA** — la serata non finisce mai (dal 1994) |
| 11 | I Due Talloni (Stadio) | **IL COMMISSARIO TECNICO** — ti seleziona dopo 12 anni di 0-0 |
| 12 | Torneo di Qualificazione (Tribuna VIP) | **IL BANDIERONA** — "TUTTO È FUORI GIOCO!" |
| 13 | IL CERVELLONE (finale, invariato) | — |

Nuovi contenuti: **8 nemici** e **8 ostacoli** per le nuove arene,
**5 fondali animati**, dialoghi GUIDO in IT/EN, schede in `03_livelli.md`.

### 🔥 PROVE SVITATE, MARATONA, DUELLI E TROFEI
- Tre prove contro boss leggendari sbloccano Sandro, Paolo e Lucia come percorso
  alternativo. La Maratona concatena i tre boss e conserva la vita tra le prove.
- Duello contro boss con round da 45 secondi; classifica locale top 10 dei tempi
  delle Prove. Quattordici trofei complessivi.

### 📱 PACCHETTO PWA
- `manifest.json`, `sw.js` e icone predisposti per installazione da hosting HTTPS.
- Il precache copre gli asset dello stesso progetto; Three.js arriva da CDN, quindi
  il suo funzionamento offline non è garantito dal service worker.
- La disponibilità URL, l'installazione e il ripristino offline vanno verificati
  nell'hosting e nei browser target con `PUBBLICA.md`.

### 🔧 CORREZIONI DOCUMENTATE
Colpi ranged del giocatore, priorità boss nell'auto-mira, ostacoli da dati livello,
progressione dei boss, Duello locale, Prove e Maratona hanno ricevuto fix nel corso
precedente del progetto. Questi punti richiedono comunque verifica runtime prima
che si possa dichiarare una release validata end-to-end.

## v1.0 — "LA GUERRA IMPROBABILE" (versione iniziale)
Versione iniziale: Storia, Caos, Duello, Sfida Settimanale, editor, negozio,
trofei, clip virali, audio procedurale, IT/EN e salvataggio automatico.
