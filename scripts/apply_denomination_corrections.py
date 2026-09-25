"""Apply the user's named denomination/logo corrections without changing roles or photos."""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = Path('/Users/joshuagbafa/Downloads/DENOMINATION LOGOS + BISHOPS')
ASSETS = ROOT / 'assets/denominations/first-love'
LOGOS = {
    'go-ye-church.jpg': '1 - Go Ye Church (Netherlands) - Heywood Osei-Bonsu.jpg',
    'go-church.png': '2 - Go Church (Belgium) - King Appiagyei.png',
    'jesus-gefunden.png': '3 - Jesus Gefunden (Germany) - Edwin Adu-Tutu.png',
    'benediction-totale.jpg': '4+5 - Benediction Totale (France) - Reginald Dadzie or Henri Fogwe.jpg',
    'mustard-seed-chapel-international.png': '6 - Mustard Seed Chapel International (UK) - Sena Agyepong.png',
    'qodesh-family-church.png': '7 - Qodesh Family Church (Ghana) - Glen Kwame Opoku.png',
}
# Organization and role are deliberately independent from denomination.
CORRECTIONS = [
    ('pastors', 5088, 'Heywood Osei Bonsu', 'GO YE CHURCH', 'go-ye-church.jpg'),
    ('bishops', 109, 'King Bodom Appiagyei', 'GO CHURCH', 'go-church.png'),
    ('bishops', 44, 'Edwin Adu-Tutu', 'JESUS GEFUNDEN', 'jesus-gefunden.png'),
    ('bishops', 165, 'Reginald Agyir Dadzie', 'BÉNÉDICTION TOTALE', 'benediction-totale.jpg'),
    ('bishops', 78, 'Henri Fogwe', 'BÉNÉDICTION TOTALE', 'benediction-totale.jpg'),
    ('bishops', 181, 'Sena Agyepong', 'MUSTARD SEED CHAPEL INTERNATIONAL', 'mustard-seed-chapel-international.png'),
    ('bishops', 74, 'Glen Kwame Opoku', 'QODESH FAMILY CHURCH', 'qodesh-family-church.png'),
]

def main():
    rosters = {role: json.loads((ROOT / f'data/{role}.js').read_text().split('=', 1)[1].strip().rstrip(';')) for role in ('bishops', 'pastors')}
    for role, code, name, denomination, logo in CORRECTIONS:
        person = next(p for p in rosters[role] if p['code'] == code)
        if person['name'] != name:
            raise ValueError(f'Name changed for {role} {code}; review before applying')
        person.update(denomination=denomination, denominationLogo=f'assets/denominations/first-love/{logo}', denominationSource='User-confirmed denomination table, 25 September 2026', denominationLogoSource=LOGOS[logo])
    ASSETS.mkdir(parents=True, exist_ok=True)
    for filename, source in LOGOS.items():
        shutil.copyfile(SOURCES / source, ASSETS / filename)
    for role, entries in rosters.items():
        (ROOT / f'data/{role}.js').write_text(f'window.{role.upper()} = '+json.dumps(entries,ensure_ascii=False,separators=(',', ':'))+';\n')
    print(f'Applied {len(CORRECTIONS)} named denomination mappings and {len(LOGOS)} logos; roles and organizations preserved.')

if __name__ == '__main__':
    main()
