#!/usr/bin/env python3
"""UNHINGED WARFARE — controlli locali statici ripetibili.

Uso: python qa_local.py
Non esegue JavaScript e non sostituisce il collaudo del gioco nel browser.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
MODULES = ["i18n.js", "save.js", "audio.js", "render.js", "data.js",
           "engine.js", "arena.js", "ui.js", "clip.js", "main.js"]
EMBLEMS = ["hospital-cross", "parking-token", "police-shield",
           "supermarket-star", "metro-token", "funfair-star", "office-chip",
           "villa-leaf", "airport-wing", "club-note", "stadium-ball",
           "vip-star", "manor-key", "gavel-star", "reactor-shard"]
HOSPITAL_KEYS = {"poiMedCart", "poiWardLocker", "poiRecordsTerminal", "poiNightCache"}
FAILURES = []
CHECKS = 0


def check(condition, message):
    global CHECKS
    CHECKS += 1
    if not condition:
        FAILURES.append(message)
        print("  FAIL", message)
    else:
        print("  OK  ", message)


def read(path):
    try:
        return (ROOT / path).read_text(encoding="utf-8")
    except OSError as error:
        FAILURES.append("impossibile leggere %s: %s" % (path, error))
        return ""


def main():
    print("UNHINGED WARFARE — QA locale statico")
    print("=" * 58)
    html = read("gioca.html")
    sidecar = read("js/threeboot.js")
    sw = read("sw.js")
    build = read("build.py")
    ui = read("js/ui.js")
    data_js = read("js/data.js")
    engine = read("js/engine.js")
    i18n = read("js/i18n.js")
    manifest_text = read("manifest.json")

    check(bool(html), "bundle gioca.html presente")
    check(bool(sidecar) and html.count('<script src="js/threeboot.js"></script>') == 1,
          "sidecar Three.js presente e referenziato una volta")
    check('“},{' not in sidecar, "nessun marcatore di modifica accidentale nel renderer")

    for module in MODULES:
        source = read("js/" + module)
        check(bool(source) and source in html,
              "gioca.html include il sorgente corrente di js/%s" % module)
    check(all('"%s"' % module in build for module in MODULES),
          "build.py dichiara tutti i moduli inline")
    check("v1.5.0" in html and "v1.5.0" in ui,
          "versione mostrata nel titolo allineata alla release")
    check("DATA.Levels.length+' '+L('level')" in ui,
          "menu mostra il conteggio livelli dai dati correnti")

    check(all(re.search(r"case\s+%d\s*:" % index, sidecar) for index in range(15)),
          "renderer definisce landmark per tutti i 15 livelli")
    check(all(emblem in sidecar for emblem in EMBLEMS),
          "renderer contiene gli emblemi tematici dei 15 livelli")

    try:
        manifest = json.loads(manifest_text)
        manifest_ok = True
    except (TypeError, ValueError) as error:
        manifest = {}
        manifest_ok = False
        FAILURES.append("manifest.json non valido: %s" % error)
    check(manifest_ok, "manifest.json è JSON valido")
    check(manifest.get("version") == "1.5.0", "versione manifest allineata alla release")
    check(bool(manifest.get("start_url")) and bool(manifest.get("scope")),
          "manifest definisce start_url e scope")

    cache_version = re.search(r"const VERSION = ['\"]([^'\"]+)", sw)
    check(bool(cache_version) and cache_version.group(1).startswith("v1.5.0"),
          "service worker aggiorna la versione della cache")
    precache = re.search(r"const PRECACHE = \[(.*?)\];", sw, re.S)
    cached = set(re.findall(r"['\"]([^'\"]+)['\"]", precache.group(1))) if precache else set()
    required = ["gioca.html", "index.html", "manifest.json", "css/style.css",
                "js/threeboot.js"] + ["js/" + module for module in MODULES]
    check(all(path in cached for path in required),
          "precache include bundle, sorgenti, sidecar, shell e manifest")
    check(all((ROOT / path).is_file() for path in required),
          "le risorse critiche richieste esistono localmente")

    levels = re.search(r"const Levels\s*=\s*\[(.*?)\n\];", data_js, re.S)
    level_count = len(re.findall(r"\{\s*id\s*:\s*\d+", levels.group(1))) if levels else 0
    check(level_count == 15, "dati campagna contengono 15 livelli (trovati %d)" % level_count)

    poi_levels = re.search(r"const all\s*=\s*\[(.*?)\n  \];", engine, re.S)
    poi_ids = re.findall(r"\['([A-Za-z][A-Za-z0-9]*)'\s*,", poi_levels.group(1)) if poi_levels else []
    check(len(poi_ids) == 46, "catalogo esplorazione contiene 46 POI (trovati %d)" % len(poi_ids))
    check("recordDiscovery(poi.id)" in engine and "'poiLevelNames.'" in engine,
          "POI persistenti e nomi localizzati collegati al motore")

    langs = re.search(r"window\.I18N\s*=\s*\{\s*it:\{(.*?)\n},\nen:\{(.*?)\n\}\};", i18n, re.S)
    for index, label in [(1, "italiano"), (2, "inglese")]:
        block = langs.group(index) if langs else ""
        localized_hospital = set(re.findall(r"\b(poi[A-Za-z]+)\s*:\s*['\"]", block))
        poi_block = re.search(r"poiLevelNames:\s*\{(.*?)\n  \}, interactPrompt", block, re.S)
        localized_by_level = {}
        if poi_block:
            for number, body in re.findall(r"^\s*(\d+):\{([^{}]*)\}", poi_block.group(1), re.M):
                localized_by_level[int(number)] = set(
                    re.findall(r"\b([A-Za-z][A-Za-z0-9]*)\s*:\s*['\"]", body))
        hospital_ok = HOSPITAL_KEYS.issubset(localized_hospital)
        other_ok = len(poi_ids) == 46 and all(
            poi_id in localized_by_level.get(index // 3 + 2, set())
            for index, poi_id in enumerate(poi_ids[4:]))
        check(hospital_ok and other_ok,
              "nomi dei 46 POI localizzati in %s nelle chiavi corrette" % label)

    print("=" * 58)
    if FAILURES:
        print("QA FALLITA — %d errori su %d controlli" % (len(FAILURES), CHECKS))
        sys.exit(1)
    print("QA STATICO OK — %d controlli superati" % CHECKS)
    print("NOTA: nessun controllo statico verifica rendering WebGL, gameplay o installazione PWA.")


if __name__ == "__main__":
    main()
