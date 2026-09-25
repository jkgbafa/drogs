"""Import the supplied bishop groups and named bishop photo directory.

IDs are append-only. Ambiguous aliases are listed for review rather than guessed.
"""
if __name__ == '__main__':
    raise SystemExit('Legacy folder importer disabled. Use the named bishop roster and explicit role corrections; do not infer rank from photos.')
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
def read(role):return json.loads((ROOT/f'data/{role}.js').read_text().split('=',1)[1].strip().rstrip(';'))
def norm(n):return re.sub('[^a-z]','',n.lower())
bishops,pastors=read('bishops'),read('pastors')
report={'merged':[],'promoted':[],'added':[],'needsReview':[]}
for keep,remove,oldpastor,name in [(141,245,None,'James Quist-Therson'),(196,248,None,'Edwin Morgan Ogoe Jr'),(252,None,4697,'Joseph Odarkwei Mills')]:
    target=next((p for p in bishops if p['code']==keep),None)
    if not target:continue
    prior=next((p for p in bishops if p['code']==remove),None) if remove else next((p for p in pastors if p['code']==oldpastor),None)
    target['photoAliases']=list(set(target.get('photoAliases',[])+[target['name'],name]))
    target['name']=name
    if remove:target['previousBishopCodes']=list(set(target.get('previousBishopCodes',[])+[remove]))
    if oldpastor:target['previousPastorCode']=oldpastor
    if prior:
        for k,v in prior.items():
            if k not in ('code','name','title','amount') and not target.get(k):target[k]=v
        (bishops if remove else pastors).remove(prior)
    report['merged'].append({'bishopCode':keep,'previousBishopCode':remove,'previousPastorCode':oldpastor,'name':name,'source':'User confirmed aliases'})
for code,oldcode,name in [(79,4884,'Henrietta Ariel Orleans-Lindsay'),(86,4707,'Jacob Etrue Godwyll')]:
    b=next(p for p in bishops if p['code']==code)
    old=next((p for p in pastors if p['code']==oldcode),None)
    if old:
        for k,v in old.items():
            if k not in ('code','name','image','amount','title') and not b.get(k):b[k]=v
        pastors.remove(old)
    b.update(name=name,previousPastorCode=oldcode)
    report['merged'].append({'bishopCode':code,'previousPastorCode':oldcode,'name':name,'source':'User confirmation'})

folder=Path('/Volumes/HJC SSD 5/DOCUMENTARIES/SUPERNOVA/Other (Unorganized)/COUNCILS/FIRST LOVE COUNCILS/ALL FIRST LOVE BISHOPS')
# Explicit name variants with retained provenance. Jr/Sr are never stripped.
record_aliases={
 'Edwin Tutu':('B',44),'Glen Opoku':('B',74),'Henrietta Ariel Orlean Lindsay':('B',79),
 'Joseph Kabiro Wachiro':('B',99),'Luca Erica Aryee':('B',59),'Nii Nortey Quist':('B',141),
 'Richard Aryee Jnr':('B',169),'Simone-Pierre Ademola':('B',182),'Zoe-Freda Andrea Asamoah':('B',193),
 'EdwinMorganOgoeJr':('B',196),'Kent':('P',2583),'Esme Mantiziba':('P',4991),
 'Daniel Fiifi Gyamera':('P',5079),'Annika Naa Ofeibea Dwimoh':('P',4514),
 'Jennis Kwabena Opoku':('P',2233),'Patrick Incoom':('P',3428),
 'Paula Chela Mills Thompson':('P',3465),'Serena Ariana Ababio':('P',4026),
 'Ruth Jani Appiah-Denkyira':('P',3864),'Adara Hyde':('P',2181),
 'Dayanara Hart':('P',846),'Enoch Lamptey':('P',1351),'Farrell Bruce':('P',1545),
 'Kobby Ogoe':('B',196),'Joseph Dick mills':('B',252)
}
ambiguous={'Aida Maya Asiedu','Enoch','Daniel Adjei'}
source_people={}
def promote(p,source):
    if p in pastors:
        pastors.remove(p);old=p['code'];p['code']=max(x['code'] for x in bishops)+1
        p['previousPastorCode']=old;bishops.append(p)
        report['promoted'].append({'name':p['name'],'previousPastorCode':old,'bishopCode':p['code'],'source':source})
    p.update(organization='UO-FLC190',designation='UO-FLC190',denomination='FIRST LOVE CHURCH',amount=100)
    if p.get('title') in ('Pastor','') or not p.get('title'):p['title']='Mother' if p.get('gender')=='FEMALE' else 'Bishop'
    p['roleSource']=source
    return p
def resolve(name,source):
    if name in ambiguous:
        report['needsReview'].append({'name':name,'source':source,'reason':'Name is incomplete or has multiple possible roster matches'});return
    existing=source_people.get(norm(name))
    if existing:return existing
    alias=record_aliases.get(name)
    p=None
    if alias:
        collection=bishops if alias[0]=='B' else pastors
        p=next((x for x in collection if x['code']==alias[1]),None)
        if p is None and alias[0]=='P':p=next((x for x in bishops if x.get('previousPastorCode')==alias[1]),None)
    if p is None:
        candidates=[x for x in bishops+pastors if norm(x['name'])==norm(name)]
        if len(candidates)>1:
            report['needsReview'].append({'name':name,'source':source,'reason':'Duplicate exact names'});return
        if candidates:p=candidates[0]
    if p is None:
        p=dict(code=max(x['code'] for x in bishops)+1,name=name,title='Bishop',region='',image=None,amount=100)
        bishops.append(p);report['added'].append({'name':name,'bishopCode':p['code'],'source':source})
    p=promote(p,source);source_people[norm(name)]=p
    return p

for path in sorted(folder.glob('*.png')):
    if path.name.startswith('.'):continue
    name=path.stem
    p=resolve(name,'Named file in ALL FIRST LOVE BISHOPS; user confirmed folder membership')
    if p:
        p['photoAliases']=list(set(p.get('photoAliases',[])+[name]))

group_aliases={
 'Daniel Gyamerah':'Daniel Fiifi Gyamera','Esme Asha Mantiziba':'Esme Mantiziba',
 'Daniella Dayanara Hart':'Dayanara Hart','Jane Adara Hyde':'Adara Hyde','Daniel Amofa':'Daniel Amofah',
 'Enoch Tetteh Angmor':'Enoch Tettey Angmor','Cleland Coffie Bruce':'Cleland Cofie Bruce',
 'Ferrel Nikki Bruce':'Farrell Bruce','Kojo Atiemo':'Kojo Yeboah Atiemo','Jennis Opoku':'Jennis Kwabena Opoku',
 'Prince Osei':'Prince Samuel Osei','Joseph Papa Wachyira':'Joseph Kabiro Wachiro',
 'Annika Naa Offeibea Dwimoh':'Annika Naa Ofeibea Dwimoh','Maxwell Adjei-Manu':'Maxwell Manu',
 'Christian Agbosu':'Christian Agbosu-Agorvor','Nana Kwesi Mensah':'Nana Kwasi Mensah',
 'Stephen Asamoah':'Stephen Jaiden Asamoah','Reginald Dadzie':'Reginald Agyir Dadzie'
}
for row in json.loads((ROOT/'data/first-love-groups.json').read_text()):
    name=group_aliases.get(row['name'],row['name'])
    p=resolve(name,'FL BISHOPS GROUPS.pdf')
    if p:p['firstLoveGroup']=row['group']
for role,people in [('bishops',bishops),('pastors',pastors)]:
    (ROOT/f'data/{role}.js').write_text(f'window.{role.upper()} = '+json.dumps(people,ensure_ascii=False,separators=(',',':'))+';\n')
(ROOT/'.private/first-love-reconciliation.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:len(v) for k,v in report.items()}))
