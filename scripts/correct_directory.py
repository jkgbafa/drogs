"""User-confirmed corrections. Preserve assigned codes and keep provenance explicit."""
from pathlib import Path
import json
import shutil
import re
from denomination_assets import match_denomination_logo, prepare_denomination_logos

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/Users/joshuagbafa/Downloads/Bishop's project/BISHOPS PICTURES")
def read(role):
    return json.loads((ROOT / 'data' / f'{role}.js').read_text().split('=', 1)[1].strip().rstrip(';'))
def key(name):
    return re.sub('[^a-z]', '', name.lower())
def save(role, people):
    (ROOT / 'data' / f'{role}.js').write_text(f'window.{role.upper()} = ' + json.dumps(people, ensure_ascii=False, separators=(',', ':')) + ';\n')

bishops, pastors = read('bishops'), read('pastors')
logos = prepare_denomination_logos(ROOT)
report = {'excluded': [], 'photoAssignmentsRemovedForReview': [], 'confirmedCorrections': []}
bishops = [p for p in bishops if key(p['name']) != 'daghewardmills']
report['excluded'].append({'name': 'Dag Heward-Mills', 'oldCode': 'B25', 'reason': 'User requested exclusion; code not reassigned.'})
for people in (bishops, pastors):
    for p in people:
        p['organization'] = p['designation'] = 'UO-FLC190' if p.get('organization') in ('UD-UO-FLC190','UO-FLC190') else 'UD-OLGC'
        p['title'] = p.pop('honorific', '') or ('Bishop' if people is bishops else 'Pastor')
        if people is bishops and p.get('gender') == 'FEMALE':
            p['title'] = 'Mother' if p['organization'] == 'UO-FLC190' else 'Episcopal Sister'

adelaide = next(p for p in bishops if key(p['name']) == 'adelaidehewardmills')
adelaide.update(organization='UD-OLGC', designation='UD-OLGC', title='Episcopal Sister')
adelaide.pop('firstLoveGroup', None)
photo = SOURCE / 'BISHOPS PHOTOS/OTHER BISHOPS/ES Adelaide Heward-Mills.JPG'
destination = ROOT / 'assets/bishops/adelaide-heward-mills.jpg'
shutil.copyfile(photo, destination)
adelaide['image'] = str(destination.relative_to(ROOT))
adelaide['photoSource'] = str(photo.relative_to(SOURCE))
report['confirmedCorrections'].append({'name': adelaide['name'], 'organization': 'UD-OLGC', 'photoSource': adelaide['photoSource']})

# Restore the separately named Joshua and Kiki portraits to their own records.
# Their bishop-role membership is explicitly corroborated by the supplied PDF.
for name, filename, title in (
    ('Joshua Heward-Mills', 'Copy of Joshua Heward Mills .jpg', 'Bishop'),
    ('Kiki Heward-Mills', 'KIKI HEWARD-MILLS.jpeg', 'Mother'),
):
    person = next((p for p in bishops if key(p['name']) == key(name)), None)
    if person is None:
        person = next(p for p in pastors if key(p['name']) == key(name))
        pastors.remove(person)
        person['previousPastorCode'] = person['code']
        person['code'] = max(p['code'] for p in bishops) + 1
        bishops.append(person)
    person.update(name=name, title=title, organization='UO-FLC190', designation='UO-FLC190', amount=100, roleSource='FL BISHOPS GROUPS.pdf')
    photo = SOURCE / 'FIRST LOVE BISHOPS RED JACKET' / filename
    destination = ROOT / 'assets/bishops' / (key(name) + photo.suffix.lower())
    shutil.copyfile(photo, destination)
    person['image'] = str(destination.relative_to(ROOT))
    person['photoSource'] = str(photo.relative_to(SOURCE))
    report['confirmedCorrections'].append({'name': name, 'code': person['code'], 'photoSource': person['photoSource']})

# Remove demonstrably unsafe surname/fuzzy assignments pending full-name review.
# Existing exact full-name assignments remain intact.
matches = json.loads((ROOT / 'data/leader-photo-match-report.json').read_text())
for match in matches:
    person = next((p for p in bishops if p['code'] == match['code']), None)
    if person and person['name'] != 'Adelaide Heward-Mills' and match.get('score', 0) and match['score'] < .94:
        if person.get('image'):
            report['photoAssignmentsRemovedForReview'].append({'code': person['code'], 'name': person['name'], 'previousSourceImage': match['sourceImage']})
        person['image'] = None
        person['photoNeedsReview'] = True

for p in bishops + pastors:
    p['denominationLogo'] = match_denomination_logo('FIRST LOVE CHURCH' if p['organization'] == 'UO-FLC190' else p.get('denomination', ''), logos)
save('bishops', bishops)
save('pastors', pastors)
from collections import Counter
report['currentBishopCounts'] = dict(Counter(p['organization'] for p in bishops))
report['sourceNotes'] = {'workbook': 'PASTORS DATA.xlsx: original bishop/consecrated records; prior photo-folder organization assignments remain provisional except user-confirmed corrections.', 'firstLovePDF': '61 named bishops in seven groups. Complete roster status awaiting confirmation.'}
(ROOT / 'data/directory-audit.json').write_text(json.dumps(report, indent=2))
print(json.dumps({'bishops': len(bishops), 'pastors': len(pastors), 'organizations': report['currentBishopCounts'], 'unsafePhotoAssignmentsRemoved': len(report['photoAssignmentsRemovedForReview'])}))
