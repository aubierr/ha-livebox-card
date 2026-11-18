"""Télécharge les logos référencés dans dist/livebox-tv-card.js vers dist/logos/ (PNG redimensionnés à 256 px max).

Usage : python tools/fetch_logos.py [dossier_du_depot] [--force]   (nécessite Pillow : pip install pillow)
Par défaut, seuls les logos absents de dist/logos/ sont téléchargés ; --force les retélécharge tous.
"""
import io, re, sys, time, unicodedata, urllib.error, urllib.request
from pathlib import Path
from PIL import Image

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:  # noqa: BLE001
    pass

args = [a for a in sys.argv[1:] if not a.startswith("--")]
force = "--force" in sys.argv
repo = Path(args[0] if args else ".")
card = repo / "dist" / "livebox-tv-card.js"
if not card.is_file():
    sys.exit(f"Fichier introuvable : {card} (indiquez le dossier du dépôt)")
src = card.read_text(encoding="utf-8")

# Tolérant à la mise en forme (espaces, guillemets simples ou doubles, virgule finale, commentaires).
m = re.search(r"""\bconst\s+LOGO_BASE\s*=\s*(["'`])(.+?)\1""", src)
if not m:
    sys.exit("Constante LOGO_BASE introuvable dans livebox-tv-card.js")
base = m.group(2)
m = re.search(r"\bconst\s+CHANNEL_LOGOS\s*=\s*\{([\s\S]*?)^\s*\}\s*;?", src, flags=re.M)
if not m:
    sys.exit("Table CHANNEL_LOGOS introuvable dans livebox-tv-card.js")

STR = r"""("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')"""
ENTRY = re.compile(rf"""^\s*({STR[1:-1]}|[\w$]+)\s*:\s*{STR}\s*,?\s*(?://.*)?$""")

def unquote(s):
    if s[0] in "\"'":
        s = s[1:-1]
    return re.sub(r"\\(.)", r"\1", s)

table = {}
for line in m.group(1).splitlines():
    if not line.strip() or line.strip().startswith("//"):
        continue
    e = ENTRY.match(line)
    if not e:
        sys.exit(f"Ligne non comprise dans CHANNEL_LOGOS : {line.strip()}")
    table[unquote(e.group(1))] = unquote(e.group(2))
if not table:
    sys.exit("Table CHANNEL_LOGOS vide")

def slugify(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower().replace("+", "plus")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def resolve(name, path):
    """Suit un alias « =AUTRE NOM » vers l'entrée visée."""
    if path.startswith("="):
        target = path[1:]
        if target not in table or table[target].startswith("="):
            raise SystemExit(f"Alias invalide pour {name} : {path}")
        return target, table[target]
    return name, path

def local_name(name, path):
    """Doit rester identique à _builtinLogos() dans la carte."""
    name, path = resolve(name, path)
    if re.match(r"^https?:", path):
        return slugify(name) + (".svg" if path.lower().endswith(".svg") else ".png")
    if path.startswith("@"):
        return path[1:] + ".png"
    return path.split("/")[-1] + ".png"

# Logos « @nom » : pas d'équivalent en ligne utilisable tel quel, l'image est fabriquée à partir de cette source.
LOCAL_SOURCES = {
    # visuel officiel de la chaîne sur france.tv : logo blanc sur fond sombre, extrait et rendu transparent
    "mieux": ("https://medias.france.tv/hkh5OI4-RzN_ubxlij12nFrGAGA/880x0/filters:quality(85):format(jpeg)/q/o/p/phpgaepoq.jpg",
              "light-on-dark"),
}

def light_on_dark(im):
    """Logo clair sur fond sombre uni -> logo blanc sur fond transparent, recadré."""
    g = im.convert("L")
    # zone du logo : pixels nettement clairs (le fond peut être un dégradé), avec une petite marge
    box = g.point(lambda v: 255 if v > 110 else 0).getbbox()
    if box:
        m = 6
        box = (max(0, box[0] - m), max(0, box[1] - m), min(g.width, box[2] + m), min(g.height, box[3] + m))
        im, g = im.crop(box), g.crop(box)
    hist, acc, bg = g.histogram(), 0, 0
    for bg, n in enumerate(hist):  # niveau du fond : 10e centile de luminosité
        acc += n
        if acc >= (g.width * g.height) // 2:  # médiane : la majorité de la zone est du fond
            break
    alpha = g.point(lambda v: 0 if v <= bg + 12 else min(255, int((v - bg) * 255 / max(1, 255 - bg))))
    out_im = Image.new("RGBA", im.size, (255, 255, 255, 0))
    out_im.putalpha(alpha)
    return out_im.crop(alpha.getbbox())

def trim_background(im):
    """Retire un fond uni (blanc ou de couleur) opaque autour d'un logo JPEG et recadre."""
    rgb = im.convert("RGB")
    w, h = rgb.size
    corners = [rgb.getpixel(p) for p in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]]
    ref = max(set(corners), key=corners.count)
    def close(c):
        return sum(abs(a - b) for a, b in zip(c, ref)) < 40
    if sum(close(c) for c in corners) < 3:
        return im.convert("RGBA")
    px = rgb.load()
    alpha = Image.new("L", (w, h), 255)
    ap = alpha.load()
    for y in range(h):
        for x in range(w):
            if close(px[x, y]):
                ap[x, y] = 0
    res = rgb.convert("RGBA")
    res.putalpha(alpha)
    bbox = alpha.getbbox()
    return res.crop(bbox) if bbox else res

def download(url, tries=4):
    req = urllib.request.Request(url, headers={"User-Agent": "livebox-tv-card-logo-fetch/1.0"})
    for i in range(tries):
        try:
            return urllib.request.urlopen(req, timeout=30).read()
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504) or i == tries - 1:
                raise
            time.sleep(int(e.headers.get("Retry-After") or 0) or 3 * (i + 1))

# Logos fournis à la verticale par la source : rotation en degrés (sens antihoraire, comme Pillow).
ROTATE = {
    "arte-fr.png": -90,  # « arte » se lit de bas en haut dans tv-logos
}

out = repo / "dist" / "logos"
out.mkdir(exist_ok=True)
done, total, fails, fetched, skipped = {}, 0, [], 0, 0
for name, path in table.items():
    if path.startswith("="):
        resolve(name, path)  # vérifie seulement l'alias
        continue
    transform = None
    if path.startswith("@"):
        if path[1:] not in LOCAL_SOURCES:
            fails.append(f"{name}: source inconnue pour {path} (LOCAL_SOURCES)")
            continue
        url, transform = LOCAL_SOURCES[path[1:]]
    else:
        url = path if re.match(r"^https?:", path) else f"{base}{path if '/' in path else 'france/' + path}.png"
    fn = local_name(name, path)
    if fn in done:
        if done[fn] != url:
            fails.append(f"{name}: le fichier {fn} est déjà utilisé par une autre URL")
        continue
    done[fn] = url
    if (out / fn).is_file() and not force:
        skipped += 1
        total += (out / fn).stat().st_size
        continue
    try:
        data = download(url)
        fetched += 1
        if fn.endswith(".svg"):
            if b"<svg" not in data[:2000]:
                raise ValueError("pas un SVG")
            (out / fn).write_bytes(data)
        else:
            im = Image.open(io.BytesIO(data))
            im.load()
            if transform == "light-on-dark":
                im = light_on_dark(im)
            elif im.mode not in ("RGBA", "LA", "P") or (im.mode == "P" and "transparency" not in im.info):
                im = trim_background(im)  # JPEG ou image sans transparence : fond uni retiré
            im = im.convert("RGBA")
            if fn in ROTATE:
                im = im.rotate(ROTATE[fn], expand=True)
            im.thumbnail((256, 256), Image.LANCZOS)
            im.save(out / fn, "PNG", optimize=True)
        total += (out / fn).stat().st_size
    except Exception as e:  # noqa: BLE001
        fails.append(f"{name}: {e}")

def source_of(url):
    if "tv-logo/tv-logos" in url:
        return "tv-logos"
    if "picons/picons" in url:
        return "picons"
    if "france.tv" in url:
        return "france.tv"
    return "iptv-org"

SOURCES = {
    "tv-logos": ("[tv-logo/tv-logos](https://github.com/tv-logo/tv-logos)",
                 "logos proposés par le projet sous licences Creative Commons CC BY-SA / CC BY-NC-SA "
                 "(usage non commercial pour une partie d'entre eux)"),
    "picons": ("[picons/picons](https://github.com/picons/picons)", "dépôt sous licence GPL-3.0"),
    "iptv-org": ("[iptv-org/database](https://github.com/iptv-org/database)",
                 "URLs d'images référencées par la base (Unlicense pour les données) ; les images elles-mêmes "
                 "appartiennent aux chaînes"),
    "france.tv": ("[france.tv](https://www.france.tv/)",
                  "visuel officiel de la chaîne, dont le logo a été extrait sur fond transparent"),
}
channels_by_file = {}
for name, path in table.items():
    channels_by_file.setdefault(local_name(name, path), []).append(name)
lines = [
    "# Crédits des logos",
    "",
    "Les logos de ce dossier sont des **marques déposées appartenant à leurs détenteurs respectifs** "
    "(chaînes et groupes audiovisuels). Ils sont fournis uniquement pour identifier les chaînes, dans le cadre "
    "d'un usage personnel et non commercial. Ils ne sont **pas** couverts par la licence MIT du projet.",
    "",
    "Les images ont été redimensionnées (256 px max) et converties en PNG, sauf les SVG.",
    "Si vous êtes détenteur d'un de ces logos et souhaitez son retrait, ouvrez une issue sur le dépôt.",
    "",
    "## Sources",
    "",
]
for key, (link, note) in SOURCES.items():
    count = sum(1 for u in done.values() if source_of(u) == key)
    lines.append(f"- {link} — {count} fichier{'s' if count > 1 else ''} : {note}.")
lines += ["", "## Fichiers", "", "| Fichier | Chaînes | Source | Origine |", "| --- | --- | --- | --- |"]
for fn in sorted(done):
    chans = ", ".join(channels_by_file[fn][:3]) + (f" (+{len(channels_by_file[fn]) - 3})" if len(channels_by_file[fn]) > 3 else "")
    lines.append(f"| `{fn}` | {chans.replace('|', '/')} | {source_of(done[fn])} | [lien]({done[fn]}) |")
(out / "CREDITS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

print(f"{len(table)} chaînes -> {len(done)} fichiers ({fetched} téléchargés, {skipped} déjà présents), "
      f"{total / 1024:.0f} Ko, échecs : {len(fails)}")
for f in fails:
    print("  ", f)
sys.exit(1 if fails else 0)
