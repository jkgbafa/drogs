"""Withdraw bishop classifications that were based solely on photo folders.

Retain master-roster bishop records, the supplied named First Love groups and
explicit user corrections. Preserve withdrawn records privately for review.
"""
from pathlib import Path
import ast, json, re, subprocess
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
def read(role):
    return json.loads((ROOT / f'data/{role}.js').read_text().split('=', 1)[1].strip().rstrip(';'))
def historical(role):
    text = subprocess.check_output(['git', 'show', f'016d8ae:data/{role}.js'], cwd=ROOT, text=True)
    return json.loads(text.split('=', 1)[1].strip().rstrip(';'))
def norm(name): return re.sub('[^a-z]', '', name.lower())

bishops, pastors = read('bishops'), read('pastors')
baseline = {p['code'] for p in historical('bishops')}
original_pastors = {p['code']: p for p in historical('pastors')}
tree = ast.parse((ROOT / 'scripts/reconcile_first_love.py').read_text())
aliases = {n.targets[0].id: ast.literal_eval(n.value) for n in tree.body
           if isinstance(n, ast.Assign) and isinstance(n.targets[0], ast.Name)
           and n.targets[0].id in ('record_aliases', 'group_aliases')}
pdf_matches, unresolved_pdf = {}, []
for row in json.loads((ROOT / 'data/first-love-groups.json').read_text()):
    name = aliases['group_aliases'].get(row['name'], row['name'])
    reference = aliases['record_aliases'].get(name)
    matches = [p for p in bishops if norm(name) in {norm(p['name']), *(norm(a) for a in p.get('photoAliases', []))}]
    if reference:
        matches = [p for p in bishops if (reference[0] == 'B' and p['code'] == reference[1])
                   or (reference[0] == 'P' and p.get('previousPastorCode') == reference[1])]
    if len(matches) == 1:
        pdf_matches[matches[0]['code']] = row['name']
    else:
        unresolved_pdf.append(row)

withdrawn, retained = [], []
for person in bishops:
    if person['code'] in baseline or person['code'] in pdf_matches:
        retained.append(person)
        continue
    withdrawn.append(person)

report_path = ROOT / '.private/folder-role-corrections.json'
previous = json.loads(report_path.read_text()) if report_path.exists() else {'withdrawn': [], 'restoredPastors': [], 'pendingRoleReview': []}
report = {'withdrawn': previous['withdrawn'] + withdrawn,
          'restoredPastors': previous['restoredPastors'],
          'pendingRoleReview': previous['pendingRoleReview'],
          'unresolvedFirstLoveGroupNames': unresolved_pdf}
for person in withdrawn:
    old_code = person.get('previousPastorCode')
    if old_code is not None:
        assert not any(p['code'] == old_code for p in pastors)
        restored = dict(original_pastors[old_code])
        # Keep the user's name cleanup and current photo mapping intact.
        for key in ('name', 'image', 'photoAliases', 'photoMatch', 'photoSourceFile', 'udGroup'):
            if key in person: restored[key] = person[key]
        restored['previousBishopCodes'] = sorted(set(restored.get('previousBishopCodes', []) + [person['code']]))
        restored['roleSource'] = 'Pastor roster restored; photo folder does not establish bishop status'
        pastors.append(restored)
        report['restoredPastors'].append({'name': restored['name'], 'pastorCode': old_code, 'withdrawnBishopCode': person['code']})
    else:
        report['pendingRoleReview'].append(person)

for role, group in [('bishops', retained), ('pastors', pastors)]:
    assert len(group) == len({p['code'] for p in group})
    (ROOT / f'data/{role}.js').write_text(f'window.{role.upper()} = ' + json.dumps(group, ensure_ascii=False, separators=(',', ':')) + ';\n')
report_path.write_text(json.dumps(report, indent=2))
print(json.dumps({'withdrawnThisRun': len(withdrawn), 'restoredPastors': len(report['restoredPastors']),
                  'pendingRoleReview': len(report['pendingRoleReview']), 'remainingBishops': len(retained),
                  'remainingByOrganization': dict(Counter(p['organization'] for p in retained))}, indent=2))
