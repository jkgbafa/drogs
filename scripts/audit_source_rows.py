"""Account for every master-sheet row without renumbering existing records.

Only four verified import omissions are restored. Exact names/recorded aliases
are used for the audit; ambiguous names remain unresolved rather than merged.
The row-level audit stays private. Run with --restore to persist corrections.
"""
from pathlib import Path
from collections import Counter, defaultdict
import argparse, json, re, unicodedata
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/Users/joshuagbafa/Downloads/PASTORS DATA.xlsx')
parser = argparse.ArgumentParser()
parser.add_argument('--restore', action='store_true')
args = parser.parse_args()

def clean(value):
    return re.sub(r'\s+', ' ', str(value if value is not None else '')).strip()

def norm(value):
    value = unicodedata.normalize('NFKD', clean(value)).encode('ascii', 'ignore').decode().lower()
    value = re.sub(r'\b(?:bishop|pastor|reverend|rev|ps|lp|lady|mother|dr)\b', '', value)
    return re.sub('[^a-z]', '', value)

people = {role: json.loads((ROOT / f'data/{role}.js').read_text().split('=', 1)[1].strip().rstrip(';'))
          for role in ('bishops', 'pastors')}
rows = list(load_workbook(SOURCE, read_only=True, data_only=True).active.values)
headers = rows.pop(0)
rows = [(number, dict(zip(headers, row))) for number, row in enumerate(rows, 2)]

# Explicitly confirmed aliases must also survive later source audits.
for code, aliases in {79: ['Henrietta Orleans-Lindsay'], 86: ['Jake Etrue Godwyll']}.items():
    person = next(p for p in people['bishops'] if p['code'] == code)
    person['photoAliases'] = sorted(set(person.get('photoAliases', []) + aliases))

restored = []
# Both source lists give this exact full name, country and organization. The
# master sheet explicitly lists the bishop rank; preserve that existing record.
if args.restore:
    bishop = next(p for p in people['bishops'] if p['code'] == 182)
    duplicate = next((p for p in people['pastors'] if p['code'] == 4687), None)
    if duplicate:
        assert all(bishop.get(k) == duplicate.get(k) for k in ('name', 'region', 'organization'))
        source_row = next(row for _, row in rows if norm(row['FULLNAME']) == norm(bishop['name']))
        assert source_row['STATUSRANK'] == 'BISHOP' or source_row['YEARCONSECRATED']
        for key, value in duplicate.items():
            if key not in ('code', 'title', 'amount', 'image') and not bishop.get(key):
                bishop[key] = value
        bishop['previousPastorCode'] = duplicate['code']
        people['pastors'].remove(duplicate)
missing_ids = {'2273', '971', '3435', '4001'}
field_map = {'yearAppointed':'YEARAPPOINTED', 'yearOrdained':'YEARORDAINED', 'gender':'GENDER',
             'mobile':'MOBILE', 'whatsapp':'WHATSAPP NUMBER', 'email':'ALTERNATEEMAIL',
             'adminRank':'ADMINRANK', 'ministryRank':'MINISTRYRANK', 'statusRank':'STATUSRANK',
             'functionsRank':'FUNCTIONSRANK', 'council':'COUNCIL', 'diocese':'DIOCESE',
             'city':'CITY', 'state':'STATE', 'address':'ADDRESS', 'qualification':'QUALIFICATION',
             'profession':'PROFESSION', 'occupation':'OCCUPATION', 'maritalStatus':'MARITALSTATUS'}
if args.restore:
    for row_number, row in rows:
        if clean(row['PASTORID']) not in missing_ids:
            continue
        if any(norm(p['name']) == norm(row['FULLNAME']) for group in people.values() for p in group):
            continue
        assert not row['DENOMINATION'], 'Only verified blank-denomination omissions may be restored'
        person = {key: clean(row[column]) for key, column in field_map.items()}
        age = clean(row['AGE'])
        person.update(code=max(p['code'] for p in people['pastors']) + 1,
                      name=clean(row['FULLNAME']).title(), title='Pastor',
                      organization='UD-OLGC', designation='UD-OLGC', denomination='',
                      denominationLogo=None, region=clean(row['COUNTRY']).title(),
                      branch=clean(row['BRANCH']).title(), image=None, amount=50,
                      age=age if age.isdigit() and 18 <= int(age) <= 100 else '',
                      supervisingBishop='', sourceId=clean(row['PASTORID']),
                      source='PASTORS DATA.xlsx', sourceRow=row_number)
        people['pastors'].append(person)
        restored.append({'row': row_number, 'code': person['code'], 'name': person['name']})

index = defaultdict(dict)
for role, group in people.items():
    for p in group:
        for name in {p['name'], *p.get('photoAliases', [])}:
            index[norm(name)][(role, p['code'])] = p
counts = Counter()
unique = defaultdict(set)
details, unresolved = [], []
for row_number, row in rows:
    entry = {'row': row_number, 'sourceId': clean(row['PASTORID']), 'name': clean(row['FULLNAME'])}
    if norm(row['FULLNAME']) == norm('Dag Heward-Mills'):
        counts['excludedByRequest'] += 1
        details.append(dict(entry, disposition='Excluded at user request'))
        continue
    candidates = list(index[norm(row['FULLNAME'])].items())
    if len(candidates) > 1:
        same_denomination = [(key, p) for key, p in candidates if norm(p.get('denomination')) == norm(row['DENOMINATION'])]
        if len(same_denomination) == 1:
            candidates = same_denomination
    if len(candidates) == 1:
        (role, code), p = candidates[0]
        bucket = f'{role}:{p["organization"]}'
        counts[bucket] += 1
        unique[bucket].add(code)
        details.append(dict(entry, role=role, code=code, organization=p['organization']))
    else:
        unresolved.append(dict(entry, candidates=[{'role':key[0], 'code':key[1]} for key, _ in candidates]))

summary = {'source': SOURCE.name, 'sheetRowsIncludingHeader': len(rows) + 1,
           'sourcePeopleRows': len(rows), 'mappedRowsByCategory': dict(counts),
           'distinctRecordsByCategory': {key: len(codes) for key, codes in unique.items()},
           'repeatedRowsMappingToSameRecord': sum(counts[key] - len(codes) for key, codes in unique.items()),
           'unresolvedRows': len(unresolved),
           'restoredBlankDenominationRecords': len(missing_ids),
           'directoryCounts': {role: dict(Counter(p['organization'] for p in group)) for role, group in people.items()}}
assert sum(counts.values()) + len(unresolved) == len(rows)
(ROOT / '.private/source-row-audit.json').write_text(json.dumps({'summary':summary, 'rows':details, 'unresolved':unresolved, 'restored':restored}, indent=2))
if args.restore:
    for role, group in people.items():
        (ROOT / f'data/{role}.js').write_text(f'window.{role.upper()} = ' + json.dumps(group, ensure_ascii=False, separators=(',', ':')) + ';\n')
    (ROOT / 'data/source-count-audit.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps(summary, indent=2))
if unresolved:
    print('Unresolved source rows remain; inspect the private audit before claiming completeness.')
