# UNHINGED WARFARE: La Guerra Improbabile
### (titolo internazionale: "UNHINGED WARFARE" — sottotitolo: "The Improbable War")

## 🎮 IL GIOCO
Apri `gioca.html` in un browser moderno. Il bundle contiene i moduli del gioco;
il renderer Three.js viene caricato separatamente da CDN quando disponibile, con
fallback Canvas2D. Per la PWA completa e il service worker serve un hosting HTTPS;
il doppio click su file locale non attiva il service worker e non garantisce la
richiesta Three.js al CDN.

## 🚀 Verifiche e pubblicazione
- Build locale: `python build.py`
- QA statica locale: `python qa_local.py`
- Verifica risorse dopo la pubblicazione: `python check_deploy.py <url>`

La QA locale controlla la coerenza dei file e del bundle, ma **non** esegue il
JavaScript e non sostituisce test browser, WebGL, mobile, PWA/offline o bilanciamento.
Guida alla pubblicazione e alla checklist reale in `PUBBLICA.md`.

## 📱 PWA
`manifest.json`, `sw.js` e `icons/` preparano il pacchetto all'installazione.
Prima di presentarlo come installabile o pronto offline, pubblica su HTTPS e verifica
service worker, icone, cache e avvio offline sul browser/dispositivo target.

### Cosa contiene il gioco
- **Modalità Storia**: 13 livelli con dialoghi, ondate e boss, compreso il finale.
- **10 personaggi giocabili** con abilità e finisher con effetti distinti,
  progressivamente sbloccabili tra Storia, Caos, Duelli e Prove.
- **15 armi da mischia e a distanza**, con proiettili/effetti e peculiarità
  differenti (spinta, area, stordimento o dispersione). Aggiornamento gameplay
  in corso: valuta bilanciamento e compatibilità touch/gamepad prima del rilascio.
- **Modalità Caos**: ondate infinite nelle arene selezionabili e record salvato.
- **Duello 1v1**: CPU, due giocatori sullo stesso dispositivo o boss leggendari.
- **Sfida Settimanale** e **Prove Svitate**, inclusa la Maratona dei boss.
- **Editor Personaggio**, negozio, trofei, condivisione clip e tutorial abilità.
- Arene con ambientazioni e segreti esplorativi persistenti per tutti i 13 livelli.
- Audio procedurale, interfaccia IT/EN, salvataggi locali, controlli touch,
  tastiera e gamepad (mappatura browser standard; verificare sul dispositivo).
- Renderer WebGL Three.js progressivo e renderer Canvas2D di fallback.

### Controlli
| Azione | Tastiera | Touch |
|---|---|---|
| Muoviti | WASD o frecce | stick virtuale |
| Attacco | J o Z | pulsante A |
| Abilità folle | K o X | pulsante B |
| Finisher (Caos) | L o C | pulsante ⚡ |
| Scatto | SHIFT | pulsante C |
| Interagisci | E o Invio | pulsante E vicino ai POI (3D) |
| Orienta camera | Q/R | stick destro orizzontale |
| Pausa | ESC o P | pulsante ❚❚ |

## Struttura tecnica
- `js/` — sorgenti modulari: localizzazione, salvataggio, audio, rendering,
  dati, motore, arena, UI, clip e avvio.
- `js/threeboot.js` — renderer Three.js caricato come sidecar esterno.
- `css/style.css` — stile UI.
- `build.py` — genera `gioca.html` con i dieci moduli inline.
- `qa_local.py` — controlli locali statici di coerenza e risorse PWA.
- `check_deploy.py` — verifica HTTP delle risorse dopo aver pubblicato un URL.
- `index.html` — versione multi-file, da servire tramite server web.
- `VERSION.md` — changelog.

## Nota di design
Tutti i personaggi sono figure fantastiche e cartoonesche con "stranezze
cosmiche", mai diagnosi cliniche vere. Mantieni questa impostazione anche in
fase di marketing per evitare stigma sulla salute mentale.
