"""Télécharge les logos référencés dans livebox-tv-card.js vers <repo>/logos/ (PNG redimensionnés à 256 px max).

Usage : python tools/fetch_logos.py [dossier_du_depot] [--force]   (nécessite Pillow : pip install pillow)
Par défaut, seuls les logos absents de logos/ sont téléchargés ; --force les retélécharge tous.
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
card = repo / "livebox-tv-card.js"
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

def local_name(name, path):
    """Doit rester identique à _builtinLogos() dans la carte."""
    if re.match(r"^https?:", path):
        return slugify(name) + (".svg" if path.lower().endswith(".svg") else ".png")
    return path.split("/")[-1] + ".png"

def download(url, tries=4):
    req = urllib.request.Request(url, headers={"User-Agent": "livebox-tv-card-logo-fetch/1.0"})
    for i in range(tries):
        try:
            return urllib.request.urlopen(req, timeout=30).read()
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504) or i == tries - 1:
                raise
            time.sleep(int(e.headers.get("Retry-After") or 0) or 3 * (i + 1))

out = repo / "logos"
out.mkdir(exist_ok=True)
done, total, fails, fetched, skipped = {}, 0, [], 0, 0
for name, path in table.items():
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
            im = im.convert("RGBA")
            im.thumbnail((256, 256), Image.LANCZOS)
            im.save(out / fn, "PNG", optimize=True)
        total += (out / fn).stat().st_size
    except Exception as e:  # noqa: BLE001
        fails.append(f"{name}: {e}")

print(f"{len(table)} chaînes -> {len(done)} fichiers ({fetched} téléchargés, {skipped} déjà présents), "
      f"{total / 1024:.0f} Ko, échecs : {len(fails)}")
for f in fails:
    print("  ", f)
sys.exit(1 if fails else 0)
