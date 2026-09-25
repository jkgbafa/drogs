"""Apply source-backed First Love groups and logos without changing portraits or codes."""
from pathlib import Path
import json
import re
from denomination_assets import prepare_denomination_logos, match_denomination_logo

ROOT = Path(__file__).resolve().parents[1]
def normalize(name):
    name = re.sub(r'\b(bishop|mother|pastor|rev)\b', '', name.lower())
    return ''.join(re.findall(r'[a-z]+', name))

groups = json.loads((ROOT / 'data/first-love-groups.json').read_text())
by_name = {normalize(row['name']): row['group'] for row in groups}
logos = prepare_denomination_logos(ROOT)
report = {'source': 'FL BISHOPS GROUPS.pdf', 'matched': [], 'unmatchedGroupNames': []}
matched_names = set()
for collection in ('bishops', 'pastors'):
    path = ROOT / 'data' / f'{collection}.js'
    entries = json.loads(path.read_text().split('=', 1)[1].strip().rstrip(';'))
    for person in entries:
        direct = normalize(person['name'])
        supervisor = normalize(person.get('supervisingBishop', ''))
        group = by_name.get(direct) or by_name.get(supervisor)
        if group:
            person['firstLoveGroup'] = group
            person['organization'] = person['designation'] = 'UD-UO-FLC190'
            if direct in by_name:
                matched_names.add(direct)
            if supervisor in by_name:
                matched_names.add(supervisor)
            report['matched'].append({'collection': collection, 'code': person['code'], 'name': person['name'], 'group': group})
        first_love = person.get('designation') == 'UD-UO-FLC190'
        person['denominationLogo'] = match_denomination_logo('FIRST LOVE CHURCH' if first_love else person['denomination'], logos)
    path.write_text(f'window.{collection.upper()} = ' + json.dumps(entries, ensure_ascii=False, separators=(',', ':')) + ';\n')
report['unmatchedGroupNames'] = [row for row in groups if normalize(row['name']) not in matched_names]
(ROOT / 'data/first-love-group-match-report.json').write_text(json.dumps(report, indent=2))
print(json.dumps({'groupAssignments': len(report['matched']), 'groupNamesNeedingReview': len(report['unmatchedGroupNames'])}))
