"""UNHINGED WARFARE — generatore icone PWA (solo stdlib: zlib + struct).

Disegna il logo "fulmine" (giallo #E8FF00, bordo magenta #FF2FB0, fondo
#0c0a12) a 1024px con scanline + BFS della banda del bordo (veloce), poi
ridimensiona con antialiasing:
  icons/icon-192.png, icons/icon-512.png   (angoli arrotondati)
  icons/maskable-512.png                   (full-bleed, zona sicura)
  icons/apple-touch-icon.png (180)         (senza trasparenza)
  icons/favicon-64.png

Uso: python make_icons.py
"""
import os
import struct
import zlib

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "icons")
N = 1024                      # buffer di rendering (supersampling)

BG = (12, 10, 18)             # #0c0a12
YEL = (232, 255, 0)           # #E8FF00
MAG = (255, 47, 176)          # #FF2FB0

# Poligono del fulmine in coordinate normalizzate [0..1]
BOLT = [(0.58, 0.06), (0.24, 0.54), (0.46, 0.54), (0.36, 0.94),
        (0.76, 0.42), (0.52, 0.42)]

CORNER_RAD = 0.22             # raggio angoli (frazione lato)


def lerp(a, b, t):
    return a + (b - a) * t


def bolt_mask(scale):
    """Maschera inside (bytearray N*N) del fulmine scalato attorno al centro."""
    poly = [((x - 0.5) * scale + 0.5, (y - 0.5) * scale + 0.5) for x, y in BOLT]
    m = bytearray(N * N)
    edges = [(poly[i], poly[(i + 1) % len(poly)]) for i in range(len(poly))]
    for y in range(N):
        yc = (y + 0.5) / N
        xs = []
        for (x1, y1), (x2, y2) in edges:
            if (y1 <= yc) != (y2 <= yc):
                xs.append(x1 + (yc - y1) * (x2 - x1) / (y2 - y1))
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            a = max(0, int(xs[i] * N))
            b = min(N, int(xs[i + 1] * N) + 1)
            base = y * N
            for x in range(a, b):
                m[base + x] = 1
    return m


def dist_map(m):
    """Distanza (in px) dal bordo della maschera, tramite BFS a onde."""
    INF = 255
    d = bytearray(N * N)
    for i in range(N * N):
        d[i] = INF
    frontier = []
    # bordo = pixel adiacente a un valore diverso (scansione destra/giù)
    for y in range(N):
        base = y * N
        for x in range(N):
            i = base + x
            v = m[i]
            if x + 1 < N and m[i + 1] != v:
                frontier.append(i)
                frontier.append(i + 1)
            if y + 1 < N and m[i + N] != v:
                frontier.append(i)
                frontier.append(i + N)
    for i in frontier:
        d[i] = 0
    dist = 0
    while frontier and dist < 40:
        dist += 1
        nxt = []
        for i in frontier:
            x = i % N
            for j in (i - 1 if x > 0 else -1,
                      i + 1 if x < N - 1 else -1,
                      i - N if i >= N else -1,
                      i + N if i < N * (N - 1) else -1):
                if j >= 0 and d[j] == INF:
                    d[j] = dist
                    nxt.append(j)
        frontier = nxt
    return d


def render(maskable=False):
    scale = 0.62 if maskable else 0.80
    edge = int((0.014 if maskable else 0.018) * N)   # spessore bordo in px
    halo = int(edge * 1.6)
    m = bolt_mask(scale)
    d = dist_map(m)
    # tavola colori per (inside, dist)
    def col(inside, dd):
        if inside:
            t = min(1.0, dd / max(1, edge))
            return (int(lerp(MAG[0], YEL[0], t)), int(lerp(MAG[1], YEL[1], t)),
                    int(lerp(MAG[2], YEL[2], t)), 255)
        if dd < halo:
            return (*MAG, 255)
        return (*BG, 255)
    lut_in = [col(1, dd) for dd in range(edge + 2)]
    lut_out = [col(0, dd) for dd in range(halo + 2)]
    rows = []
    rad = int(CORNER_RAD * N)
    for y in range(N):
        row = bytearray()
        base = y * N
        corner_row = (y < rad or y >= N - rad)
        for x in range(N):
            dd = d[base + x]
            if m[base + x]:
                c = lut_in[dd] if dd <= edge else YEL + (255,)
            else:
                c = lut_out[dd] if dd <= halo else (*BG, 255)
            row += bytes(c)
        # angoli arrotondati (solo icone non-maskable)
        if not maskable and corner_row:
            for x in range(N):
                cx = x if x < rad else (x if x < N - rad else N - 1 - x)
                if cx >= rad:
                    continue
                cy = y if y < rad else N - 1 - y
                if (x - cx) ** 2 + (y - cy) ** 2 > rad * rad:
                    i4 = x * 4
                    row[i4:i4 + 4] = bytes((0, 0, 0, 0))
        rows.append(bytes(row))
    return rows


def downsample(rows, target):
    out = []
    for ty in range(target):
        y0 = (ty * N) // target
        y1 = ((ty + 1) * N) // target
        row = bytearray()
        for tx in range(target):
            x0 = (tx * N) // target
            x1 = ((tx + 1) * N) // target
            rs = gs = bs = as_ = n = 0
            for yy in range(y0, y1):
                rrow = rows[yy]
                for xx in range(x0, x1):
                    i = xx * 4
                    rs += rrow[i]; gs += rrow[i + 1]; bs += rrow[i + 2]; as_ += rrow[i + 3]
                    n += 1
            row += bytes((rs // n, gs // n, bs // n, as_ // n))
        out.append(bytes(row))
    return out


def solid(rows):
    out = []
    for r in rows:
        b = bytearray(r)
        for i in range(0, len(b), 4):
            if b[i + 3] < 128:
                b[i:i + 4] = bytes((*BG, 255))
        out.append(bytes(b))
    return out


def write_png(path, rows, w, h):
    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    raw = b"".join(b"\x00" + r for r in rows)
    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(raw, 9))
           + chunk(b"IEND", b""))
    with open(path, "wb") as f:
        f.write(png)
    print("OK ->", os.path.relpath(path, ROOT), "(%d KB)" % (os.path.getsize(path) // 1024))


def main():
    os.makedirs(OUT, exist_ok=True)
    print("Rendering %dx%d (normale)..." % (N, N))
    hi = render(False)
    print("Rendering %dx%d (maskable)..." % (N, N))
    hi_mask = render(True)
    write_png(os.path.join(OUT, "icon-512.png"), downsample(hi, 512), 512, 512)
    write_png(os.path.join(OUT, "icon-192.png"), downsample(hi, 192), 192, 192)
    write_png(os.path.join(OUT, "maskable-512.png"), downsample(hi_mask, 512), 512, 512)
    write_png(os.path.join(OUT, "apple-touch-icon.png"), solid(downsample(hi, 180)), 180, 180)
    write_png(os.path.join(OUT, "favicon-64.png"), downsample(hi, 64), 64, 64)
    print("Fatto.")


if __name__ == "__main__":
    main()
