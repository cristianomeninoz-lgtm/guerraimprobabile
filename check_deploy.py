#!/usr/bin/env python3
"""UNHINGED WARFARE — verifica risorse PWA pubblicate (non gameplay/browser QA).

Controlla:
  1. Le risorse HTTP critiche rispondono con successo
  2. Il manifest è JSON valido e le icone dichiarate sono PNG raggiungibili
  3. Il service worker risponde con content-type JavaScript
  4. gioca.html contiene i riferimenti PWA attesi

Uso:
  python check_deploy.py https://utente.github.io/unhinged-warfare/
  python check_deploy.py http://127.0.0.1:8123/

Un esito positivo non prova che JavaScript, Three.js/WebGL, installazione PWA,
cache offline o gameplay funzionino nel browser o sui dispositivi target.
"""
import json
import sys
import urllib.request

FAILED = []


def get(url, expect_ct=None):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "unhinged-qa/1.0"})
        with urllib.request.urlopen(req, timeout=15) as response:
            body = response.read()
            content_type = (response.headers.get("content-type") or "").lower()
            if expect_ct and expect_ct not in content_type:
                FAILED.append("content-type %s: atteso '%s', trovato '%s'"
                              % (url, expect_ct, content_type))
            return body, content_type
    except Exception as error:  # noqa: BLE001
        FAILED.append("%s -> %s" % (url, error))
        return None, None


def main(base):
    base = base.rstrip("/") + "/"
    print("Verifica risorse HTTP su:", base)
    print("=" * 60)

    critical = ["gioca.html", "index.html", "manifest.json", "sw.js",
                "css/style.css", "icons/icon-192.png", "icons/icon-512.png",
                "icons/maskable-512.png", "icons/favicon-64.png"]
    for path in critical:
        body, _ = get(base + path)
        ok = body is not None
        print(("  OK  " if ok else "  FAIL") + " " + path)
        if not ok:
            FAILED.append("risorsa mancante: " + path)

    body, _ = get(base + "manifest.json")
    if body:
        try:
            manifest = json.loads(body.decode("utf-8"))
            print("  OK  manifest.json valido — %s (%s, versione %s)"
                  % (manifest.get("short_name"), manifest.get("display"),
                     manifest.get("version", "?")))
            if not manifest.get("start_url"):
                FAILED.append("manifest senza start_url")
            if not any(icon.get("purpose") == "maskable" for icon in manifest.get("icons", [])):
                FAILED.append("manifest senza icona maskable")
            for icon in manifest.get("icons", []):
                source = icon["src"]
                image, _ = get(base + source)
                print(("  OK  icona " if image else "  FAIL icona ") + source)
                if not image or not image.startswith(b"\x89PNG"):
                    FAILED.append("icona non-PNG o mancante: " + source)
        except Exception as error:  # noqa: BLE001
            FAILED.append("manifest non parsabile: %s" % error)

    body, content_type = get(base + "sw.js", expect_ct="javascript")
    if body:
        print("  OK  sw.js servito come JavaScript (%s, %d bytes)"
              % (content_type.split(";")[0], len(body)))
        if b"unhinged-warfare" not in body:
            FAILED.append("sw.js non sembra quello del progetto")

    body, _ = get(base + "gioca.html")
    if body:
        html = body.decode("utf-8", "ignore")
        for tag in ['rel="manifest"', "theme-color", "serviceWorker"]:
            ok = tag in html
            print(("  OK  gioca.html: " if ok else "  FAIL gioca.html: ") + tag)
            if not ok:
                FAILED.append("gioca.html senza tag " + tag)

    print("=" * 60)
    if FAILED:
        print("FALLITO — %d problemi:" % len(FAILED))
        for failure in FAILED:
            print("  ✗ " + failure)
        sys.exit(1)
    print("RISORSE HTTP OK — l'URL serve gli asset attesi.")
    print("Questo risultato non certifica l'installazione PWA, l'offline o il gameplay.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    main(sys.argv[1])
