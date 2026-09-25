"""Promote exact-name UD bishop-folder members without guessing ambiguous aliases."""
from pathlib import Path
import json,re
from difflib import SequenceMatcher
ROOT=Path(__file__).resolve().parents[1]
def norm(n):return re.sub('[^a-z]','',n.lower())
def read(role):return json.loads((ROOT/f'data/{role}.js').read_text().split('=',1)[1].strip().rstrip(';'))
bishops,pastors=read('bishops'),read('pastors')
folder=Path('/Volumes/HJC SSD 5/DOCUMENTARIES/SUPERNOVA/Other (Unorganized)/COUNCILS/UD COUNCILS/ALL UD BISHOPS')
report={'promoted':[],'added':[],'matchedExisting':[],'nameVariantsToReview':[]}
for photo in sorted(folder.glob('*.png')):
    if photo.name.startswith('.'):continue
    key=norm(photo.stem)
    existing=[p for p in bishops if key in {norm(p['name']),norm(Path(p.get('photoSourceFile','')).stem),*(norm(a) for a in p.get('photoAliases',[]))}]
    candidates=existing or [p for p in pastors if norm(p['name'])==key]
    if not candidates:
        parts=set(re.findall('[a-z]+',photo.stem.lower()))
        if len(parts)>=2:candidates=[p for p in bishops+pastors if parts<=set(re.findall('[a-z]+',p['name'].lower()))]
    if len(candidates)>1:
        report['nameVariantsToReview'].append({'name':photo.stem,'candidates':[p['name'] for p in candidates]});continue
    if not candidates:
        # Close spelling variants require confirmation; no fuzzy identity merge.
        similar=[p['name'] for p in bishops+pastors if SequenceMatcher(None,key,norm(p['name'])).ratio()>=.86]
        if similar:
            report['nameVariantsToReview'].append({'name':photo.stem,'candidates':similar});continue
        person=dict(code=max(p['code'] for p in bishops)+1,name=photo.stem,region='',denomination='',image=None)
        bishops.append(person);report['added'].append({'name':person['name'],'bishopCode':person['code']})
    else:person=candidates[0]
    if person in pastors:
        old=person['code'];pastors.remove(person)
        person.update(code=max(p['code'] for p in bishops)+1,previousPastorCode=old)
        bishops.append(person)
        report['promoted'].append({'name':person['name'],'previousPastorCode':old,'bishopCode':person['code']})
    else:report['matchedExisting'].append({'name':person['name'],'bishopCode':person['code'],'filename':photo.name})
    person.update(organization='UD-OLGC',designation='UD-OLGC',amount=100,
                  title='Episcopal Sister' if person.get('gender')=='FEMALE' else 'Bishop',
                  roleSource='Named member of supplied ALL UD BISHOPS photo directory')
    person['photoAliases']=list(set(person.get('photoAliases',[])+[photo.stem]))
    person.pop('firstLoveGroup',None)
for role,people in [('bishops',bishops),('pastors',pastors)]:
    (ROOT/f'data/{role}.js').write_text(f'window.{role.upper()} = '+json.dumps(people,ensure_ascii=False,separators=(',',':'))+';\n')
(ROOT/'.private/ud-reconciliation.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:len(v) for k,v in report.items()}))
