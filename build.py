"""UNHINGED WARFARE — build: genera gioca.html (tutto inline, apribile doppio click)."""
import pathlib

root = pathlib.Path(__file__).parent
css = (root / "css" / "style.css").read_text(encoding="utf-8")
order = ["i18n.js","save.js","audio.js","render.js","data.js","engine.js","arena.js","ui.js","clip.js","main.js"]
scripts = "\n".join("<script>\n%s\n</script>" % (root/"js"/f).read_text(encoding="utf-8") for f in order)

SW_REG = """<script>
/* Registrazione Service Worker (PWA offline) — ignorata su file:// */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').catch(function(){});
  });
}
</script>"""

html = f"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="UNHINGED">
<meta name="theme-color" content="#0c0a12">
<title>UNHINGED WARFARE — La Guerra Improbabile</title>
<link rel="manifest" href="manifest.json">
<link rel="icon" type="image/png" sizes="64x64" href="icons/favicon-64.png">
<link rel="apple-touch-icon" sizes="180x180" href="icons/apple-touch-icon.png">
<script src="js/three.min.js"></script>
<script>
if (!window.THREE) {{
  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  document.head.appendChild(s);
}}
</script>
<style>
{css}
</style>
</head>
<body>
<canvas id="game"></canvas>
<div id="fade"></div>
{scripts}
<script src="js/threeboot.js"></script>
{SW_REG}
</body>
</html>
"""
out = root / "gioca.html"
out.write_text(html, encoding="utf-8")
print("OK ->", out, f"({out.stat().st_size//1024} KB)")
