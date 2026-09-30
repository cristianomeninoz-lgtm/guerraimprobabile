# Da `gioca.html` a un vero APK — Guida pratica

## Punto di partenza: pacchetto PWA locale
Il progetto include `manifest.json`, service worker (`sw.js`) e icone in
`icons/`. Prima di distribuirlo, esegui `python build.py` e `python qa_local.py`,
poi pubblica su HTTPS e completa le prove reali descritte in `PUBBLICA.md`.
Questi file preparano la PWA, ma non dimostrano da soli che hosting, installazione
o supporto WebGL funzionino sul dispositivo scelto.

## Opzione A — PWA installabile (5 minuti, consigliata)
1. Metti **tutta la cartella** su un hosting statico qualsiasi
   (GitHub Pages è gratis: serve anche `sw.js` e la cartella `icons/`,
   non solo `gioca.html`).
2. Apri l'URL con Chrome su Android → menu ⋮ → **"Installa app"**
   (o "Aggiungi alla schermata Home"): se il browser soddisfa i requisiti PWA,
   la shell può essere installata a schermo intero landscape con icona propria.
   Verifica l'avvio offline sul dispositivo: Three.js è caricato da CDN e il suo
   funzionamento offline non è garantito da questa cache del service worker.
3. Verifica su desktop Chrome: F12 → Application → Manifest (nessun
   errore) e Service Workers ("activated").
4. Per un **APK firmato pronto al Play Store**:
   **PWABuilder** (pwabuilder.com) → incolla l'URL → Package for stores →
   scarica l'APK/AAB. Niente Android Studio richiesto.

## Opzione B — WebView APK con Android Studio (massimo controllo)
1. Installa Android Studio.
2. Nuovo progetto "Empty Views Activity" (linguaggio: Kotlin).
3. Nell'`activity_main.xml` sostituisci tutto con una WebView che riempie lo schermo.
4. In `MainActivity.kt`:
```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val wv = WebView(this)
        wv.settings.javaScriptEnabled = true
        wv.settings.domStorageEnabled = true   // richiesto per il salvataggio
        wv.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        setContentView(wv)
        wv.loadUrl("file:///android_asset/gioca.html")
    }
}
```
5. Copia `gioca.html` in `app/src/main/assets/`.
6. In `AndroidManifest.xml`: `android:screenOrientation="sensorLandscape"`
   sull'activity e niente permessi (il gioco non ne usa).
7. `Build > Build Bundle(s)/APK(s) > Build APK(s)` — l'APK è pronto.
8. Per il Play Store servono: icona 512px, firma con keystore release
   (`Build > Generate Signed Bundle`), e un account Google Play (25$ una tantum).

## Checklist prima della pubblicazione
- [ ] Icona app e splash screen coerenti con lo stile di `04_menu_e_ui.md`
- [ ] Test su 2-3 dispositivi Android di fascia diversa
- [ ] Compatibilità Canvas2D e WebGL verificata separatamente
- [ ] Versione tablet/orientamento landscape verificati
- [ ] Modalità offline e service worker provati senza rete
- [ ] Se punti al Play Store: rispetto delle linee guida contenuti
      (vedi nota salute mentale in `00_README.md` — mai riferimenti clinici
      nelle descrizioni/marketing)

## Roadmap consigliata dopo il lancio
1. **Online duels** (es. Firebase Realtime DB): già previsto dall'architettura
   (il motore è deterministico e separato dal rendering).
2. **Nuovi personaggi/ livelli**: basta aggiungere elementi in `js/data.js`
   e le funzioni di disegno in `js/render.js` — nessuna modifica al motore.
3. **Classifiche globali** per la modalità Caos.
4. **Skin stagionali** nel negozio per la retention (Halloween, Natale…).
