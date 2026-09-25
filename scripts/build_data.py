from pathlib import Path
from PIL import Image, ImageOps
import json, re, shutil

SOURCE = Path("/Users/joshuagbafa/Downloads/Bishop's project/BISHOPS PICTURES")
ROOT = Path("/Users/joshuagbafa/Documents/Codex/pastoral-renewal")
OUT = ROOT / "assets" / "bishops"
OUT.mkdir(parents=True, exist_ok=True)
for old_image in OUT.glob("*.jpg"):
    old_image.unlink()

folders = [
    (SOURCE / "UD AF", "United Denominations", "Africa"),
    (SOURCE / "UD EU", "United Denominations", "Europe"),
    (SOURCE / "ESCHATOS INT", "Eschatos International", "International"),
    (SOURCE / "FIRST LOVE BISHOPS RED JACKET", "Episcopal Council", "International"),
]

def clean_name(filename):
    name = Path(filename).stem
    name = re.sub(r"(?i)^copy of\s+", "", name)
    name = re.sub(r"(?i)\s*[-–]?\s*red\s*jacket.*$", "", name)
    name = re.sub(r"(?i)\s+red(?:\s*\(.*\))?$", "", name)
    name = re.sub(r"(?i)\b(bishop|bishops|bs|sister|es)\b", "", name)
    name = re.sub(r"[_()\d]+", " ", name)
    name = re.sub(r"([a-z])([A-Z])", r"\1 \2", name)
    words = []
    for part in name.split():
        words.append("-".join(piece.capitalize() for piece in part.split("-")))
    return " ".join(words)

seen = set()
entries = []
for folder, organization, region in folders:
    if not folder.exists():
        continue
    for source in sorted(folder.iterdir()):
        if source.suffix.lower() not in {".jpg", ".jpeg", ".png", ".heif", ".heic"}:
            continue
        if folder.name != "FIRST LOVE BISHOPS RED JACKET" and not re.search(r"(?i)\bred\b|red.?jacket", source.name):
            continue
        name = clean_name(source.name)
        key = re.sub(r"[^a-z]", "", name.lower())
        if len(name) < 5 or key in seen or name.lower() == "red jacket" or re.fullmatch(r"[a-f\d -]{24,}", name.lower()):
            continue
        try:
            with Image.open(source) as image:
                image = ImageOps.exif_transpose(image).convert("RGB")
                image.thumbnail((900, 1100), Image.Resampling.LANCZOS)
                canvas = Image.new("RGB", (720, 900), "#e9eceb")
                scale = max(720 / image.width, 900 / image.height)
                resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
                left = (resized.width - 720) // 2
                top = max(0, min((resized.height - 900) // 5, resized.height - 900))
                canvas.paste(resized.crop((left, top, left + 720, top + 900)))
        except Exception:
            continue
        seen.add(key)
        code = len(entries) + 1
        filename = f"{code:03d}.jpg"
        canvas.save(OUT / filename, "JPEG", quality=88, optimize=True, progressive=True)
        entries.append({
            "code": code,
            "name": name,
            "organization": organization,
            "region": region,
            "image": f"assets/bishops/{filename}",
            "amount": 100,
        })

logo_source = Path("/Users/joshuagbafa/Downloads/Bishop's project/Brand/IMG_6513.jpg")
(ROOT / "assets").mkdir(exist_ok=True)
shutil.copy2(logo_source, ROOT / "assets" / "mitre.jpg")

js = "window.BISHOPS = " + json.dumps(entries, ensure_ascii=False, separators=(",", ":")) + ";\n"
(ROOT / "data").mkdir(exist_ok=True)
(ROOT / "data" / "bishops.js").write_text(js)
print(json.dumps({"bishops": len(entries), "first": entries[:3], "last": entries[-1:]}, indent=2))
