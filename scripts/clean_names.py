"""Clean display formatting without guessing missing names or changing identities."""
from pathlib import Path
import json,re,unicodedata
ROOT=Path(__file__).resolve().parents[1]
titles={'rev':'Reverend','reverend':'Reverend','ps':'Pastor','pastor':'Pastor','lp':'Lady Pastor',
        'bishop':'Bishop','mother':'Mother','apostle':'Apostle','prophet':'Prophet','dr':'Dr'}
def name_part(piece):
    if re.fullmatch(r'(?:[A-Za-z]\.)+[A-Za-z]?\.?',piece):return piece.upper()
    if piece.lower().rstrip('.') in ('jr','jnr','sr','snr'):return piece.capitalize()
    piece=piece.rstrip('.')
    return piece[:1].upper()+piece[1:].lower()
changes=[]
for role in ('bishops','pastors'):
    path=ROOT/f'data/{role}.js'
    people=json.loads(path.read_text().split('=',1)[1].strip().rstrip(';'))
    for person in people:
        old=person['name'];name=unicodedata.normalize('NFC',old).strip()
        if role=='pastors' and person['code']==1197:name='Elvis Frank Gario'
        if role=='pastors' and person['code']==1231:name='Emmanuel Oppong Asamoah'
        if role=='pastors' and person['code']==3030:
            name='Mensah Mercy Omare';person['title']='Lady Pastor'
        match=re.match(r'^(rev(?:erend)?|ps|pastor|lp|bishop|mother|apostle|prophet|dr)(?:\.\s*|\s+)',name,re.I)
        if match:
            person['title']=titles[match[1].lower()]
            name=name[match.end():]
        name=re.sub(r'(?<!\S)[.\-]+(?!\S)',' ',name)
        name=re.sub(r'\s+-\s*','-',name)
        name=re.sub(r'\s+',' ',name).strip()
        # Fix inconsistent capitals while preserving single-letter initials.
        name=' '.join('-'.join(name_part(piece)
                     for piece in word.split('-')) for word in name.split())
        if name!=old:
            person['name']=name
            person['photoAliases']=list(set(person.get('photoAliases',[])+[old]))
            changes.append({'role':role,'code':person['code'],'before':old,'after':name,'title':person.get('title')})
    path.write_text(f'window.{role.upper()} = '+json.dumps(people,ensure_ascii=False,separators=(',',':'))+';\n')
(ROOT/'.private/name-cleanup.json').write_text(json.dumps(changes,indent=2))
print(f'Cleaned {len(changes)} display names; titles stored separately.')
