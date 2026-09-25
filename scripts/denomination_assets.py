from pathlib import Path
from difflib import SequenceMatcher
import re
import shutil
import unicodedata


UD_LOGOS = Path('/Users/joshuagbafa/Downloads/all UD logos/Transparent PNGs')
FIRST_LOVE_LOGO = Path('/Users/joshuagbafa/Downloads/DENOMINATION LOGOS + BISHOPS/0 - First Love Church (red circle).png')
SSD_LOGOS = Path('/Volumes/HJC SSD 5/DOCUMENTARIES/SUPERNOVA/Other (Unorganized)/ELEMENTS CREATION/Version 1/3 ASSETS/Para-Church Logos (from PARA-CHURCH)/All-Denominations/WEBP UD Logos')
SSD_NUMBERED_LOGOS = Path('/Volumes/HJC SSD 5/DOCUMENTARIES/SUPERNOVA/Other (Unorganized)/ELEMENTS CREATION/Version 1/3 ASSETS/UD Logos (55)')


def normalize(value):
    value = unicodedata.normalize('NFKD', str(value or '')).encode('ascii', 'ignore').decode().upper()
    value = re.sub(r'^\d+\s*-\s*', '', value)
    value = re.sub(r'\.(PNG|JPG|JPEG|WEBP)$', '', value)
    replacements = {
        'CHURCHES': 'CHURCH', 'INTERNATIONALE': 'INTERNATIONAL', 'INT ': 'INTERNATIONAL ',
        'CENTER': 'CENTRE', 'PREMIERO': 'PRIMEIRO', 'FRUITFEROS': 'FRUTIFEROS',
        'SAVIOR ': 'SAVIOURS ', 'SAVIOUR ': 'SAVIOURS ', 'PRECIOUS SOULS NAMIBIA': 'PRECIOUS SOULS CHURCH',
        'PRECIOUS SOULS SWAZILAND': 'PRECIOUS SOULS CHURCH', 'ONCTION INTERNATIONALE BENIN': 'ONCTION INTERNATIONAL',
        'SAGESSE INTERNATIONALE GUINEA': 'SAGESSE INTERNATIONAL', 'STRAIT GATE CHURCH LIBERIA': 'STRAIT GATE CHURCH',
        'MAKARIOS WESTERN NORTH': 'WESTERN NORTH MAKARIOS CHURCH', 'EVERYTHING BY PRAYER CENTER': 'EVERYTHING BY PRAYER CHURCH',
        'THE MACHANEH': 'MACHANEH', 'THE MAKARIOS': 'MAKARIOS', 'THE MEGA': 'MEGA',
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    value = re.sub(r'\b(THE|WORLDWIDE)\b', ' ', value)
    value = re.sub(r'\s+', ' ', re.sub(r'[^A-Z0-9]+', ' ', value)).strip()
    return value


def slug(value):
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', value.lower())).strip('-')


def prepare_denomination_logos(root):
    destination = root / 'assets' / 'denominations'
    destination.mkdir(parents=True, exist_ok=True)
    for old in destination.glob('*'):
        if old.is_file():
            old.unlink()

    index = {}
    if UD_LOGOS.exists():
        for source in sorted(UD_LOGOS.iterdir()):
            if not source.is_file() or source.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.webp'}:
                continue
            title = re.sub(r'^\d+\s*-\s*', '', source.stem).strip()
            filename = f'{slug(title)}{source.suffix.lower()}'
            shutil.copy2(source, destination / filename)
            index[normalize(title)] = f'assets/denominations/{filename}'

    if SSD_LOGOS.exists():
        for source in sorted(SSD_LOGOS.glob('*.webp')):
            if source.name.startswith('.') or normalize(source.stem) in index:
                continue
            filename=f'{slug(source.stem)}.webp'
            shutil.copy2(source,destination/filename)
            index[normalize(source.stem)]=f'assets/denominations/{filename}'

    if SSD_NUMBERED_LOGOS.exists():
        for source in sorted(SSD_NUMBERED_LOGOS.glob('*.png')):
            title=re.sub(r'^\d+\s*-\s*','',source.stem)
            if source.name.startswith('.') or normalize(title) in index:continue
            filename=f'{slug(title)}.png'
            shutil.copy2(source,destination/filename)
            index[normalize(title)]=f'assets/denominations/{filename}'

    if FIRST_LOVE_LOGO.exists():
        filename = 'first-love-church.png'
        shutil.copy2(FIRST_LOVE_LOGO, destination / filename)
        index[normalize('FIRST LOVE CHURCH WORLDWIDE')] = f'assets/denominations/{filename}'
    return index


def match_denomination_logo(denomination, index):
    target = normalize(denomination)
    aliases = {
        'QODESH CITY CHURCHES': 'QODESH FAMILY CHURCH',
        'JESUS IS THE DOOR': 'Jesus is the Door Church',
        'POIMANO INTERNACIONAL NICARAGUA': 'poimano Internacional',
        'GOOD SHEPHERD CHURCH GUYANA': 'GOOD SHEPHERD CHURCH',
        'LAIKOS INTERNATIONAL CHURCH': 'LAIKOS INTERNATIONAL',
        'CATCH THE ANOINTING CENTRE': 'Catch the Anointing',
        'GREATER LOVE CHURCH GHANA': 'Greater Love Church',
        'LA BELLE EGLISE': 'LA BELLE EGLISE GABON',
        'ESCHATOS': 'ESCHATOS CHURCH',
        'JESUS IS THE ROCK CHURCH': 'JESUS IS THE ROCK',
        'JESUS SAVIOUR OF THE WORLD CHURCH INTERNATIONAL': 'JESUS SAVIOUR OF THE WORLD',
        'EVERYTHING BY PRAYER CENTER': 'EVERYTHING BY PRAYER CHURCH',
        'ONCTION INTERNATIONALE BENIN': 'ONCTION INTERNATIONALE',
        'SAGESSE INTERNATIONALE GUINEA': 'SAGESSE INTERNATIONALE',
        'FRUITFEROS INTERNACIONAL GUINEA BISSAU': 'FRUTIFEROS INTERNACIONAL',
        'POIMEN CHURCH SENEGAL-GAMBIA': 'POIMEN CHURCH',
        'PLEASANT SURPRISE': 'PLEASANT SURPRISE CHURCH INTERNATIONAL',
    }
    target = {normalize(k): normalize(v) for k, v in aliases.items()}.get(target, target)
    if not target:
        return None
    if target in index:
        return index[target]
    target_tokens = set(target.split())
    ranked = []
    for label, path in index.items():
        label_tokens = set(label.split())
        token_score = 2 * len(target_tokens & label_tokens) / max(1, len(target_tokens) + len(label_tokens))
        sequence_score = SequenceMatcher(None, target, label).ratio()
        ranked.append((max(token_score, sequence_score), path))
    ranked.sort(reverse=True)
    return ranked[0][1] if ranked and ranked[0][0] >= .90 else None
