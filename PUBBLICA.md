# 🚀 Pubblicazione PWA — checklist di rilascio

Il pacchetto PWA è stato preparato localmente: per ogni rilascio esegui i
controlli statici e genera il bundle aggiornato. La verifica di un sito online,
l'installazione e le prove su dispositivi si fanno soltanto dopo la pubblicazione.

## 1. Controlli locali prima del rilascio

Dalla cartella del progetto:

```bash
python build.py
python -m py_compile build.py check_deploy.py qa_local.py
python qa_local.py
```

La QA locale controlla che `gioca.html` corrisponda ai sorgenti inline, che il
renderer Three.js e il suo riferimento siano presenti, e che manifest, service
worker, cache e risorse abbiano coerenza strutturale. **Non esegue JavaScript né
prova rendering, gameplay, installazione o funzionamento offline.**

Pubblica il contenuto del progetto su un hosting statico HTTPS (per esempio
GitHub Pages) includendo `gioca.html`, `index.html`, `manifest.json`, `sw.js`,
`css/`, `js/` e `icons/`. Conserva anche `build.py` e `qa_local.py` per i rilasci
successivi. Non incollare i comandi di pubblicazione finché non hai scelto il
repository e l'hosting: nessun deploy è stato eseguito da questa checklist.

## 2. Verifica dell'URL pubblicato

Dopo aver ottenuto l'URL pubblico, esegui:

```bash
python check_deploy.py https://TUO-UTENTE.github.io/unhinged-warfare/
```

Il controllo verifica risorse HTTP, icone PNG, manifest, content-type del service
worker e riferimenti PWA in `gioca.html`. Un esito positivo prova la disponibilità
HTTP delle risorse, non la correttezza del gioco nel browser.

`manifest.json` usa `start_url: "gioca.html"` e `scope: "./"`, relativi alla
cartella dell'applicazione.

## 3. Collaudo reale (ancora necessario per dichiarare il rilascio completo)

Su Chrome desktop, apri il sito e usa DevTools → Application per controllare
manifest, errori della console, service worker attivo e risorse cache. Prova il
gioco nelle modalità principali, i passaggi dei livelli e la raccolta dei segreti.
Disconnetti la rete e ricarica per verificare l'offline shell.

Su Android, verifica installazione, orientamento landscape, controlli touch,
audio, salvataggi, prestazioni e recupero dopo sospensione. Ripeti almeno il
percorso Canvas2D; prova anche WebGL su un dispositivo compatibile. I browser
possono bloccare WebGL o la rete CDN, perciò il fallback va collaudato davvero.

Questo repository locale non ha un URL pubblico configurato né un test browser
completato: non dichiarare completate pubblicazione, PWA online o QA dispositivi
finché queste prove non sono state eseguite.

## 4. APK (opzionale)

Dopo aver convalidato l'URL HTTPS, PWABuilder può creare un pacchetto Android;
per la pubblicazione su store servono firma e controlli specifici della piattaforma.
In alternativa, consulta `06_istruzioni_apk.md` per la strada WebView Android.
