"""Match named local portraits without fuzzy matching or inheriting a supervisor's name.

Preserves directory IDs. Full source paths stay in a git-ignored local audit.
"""
from pathlib import Path
from collections import defaultdict, Counter
import json, re, unicodedata
from PIL import Image, ImageOps
from denomination_assets import prepare_denomination_logos, match_denomination_logo

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path('/Users/joshuagbafa/Downloads')
OLD = DOWNLOADS / "Bishop's project/BISHOPS PICTURES"
MASTER = DOWNLOADS / "Bishop's project/MASTER PORTRAITS IMPORT"
SSD = Path('/Volumes/HJC SSD 5/DOCUMENTARIES/SUPERNOVA')
GROUPS = {'ESCHATOS':'ESC — Eschatos','UD AFRICA':'UA — United Africa','UD EUROPE':'UD EU — Europe',
          'UD GHANA':'UD GH — Ghana','UD NORTH AMERICA':'UD NA — North America',
          'UNITED ISLANDS':'UI — United Islands','UNITED JESUS':'UJ — United Jesus'}

def norm(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii','ignore').decode().lower()
    value = re.sub(r'\[[^]]*\]|\([^)]*\)', ' ', value)
    value = re.sub(r'\b(jnr|junior)\b','jr',value)
    value = re.sub(r'\b(snr|senior)\b','sr',value)
    value = re.sub(r'copy of|red jacket|red attire', ' ', value)
    value = re.sub(r'\b(bishop|bishops|pastor|pastors|reverend|rev|lady|mother|es|ps|bs|dr|prophet|jpg|jpeg|png|red)\b',' ',value)
    value = re.sub(r'^b\.\s*', '', value)
    return ''.join(re.findall('[a-z]+',value))

def read(role):
    return json.loads((ROOT/f'data/{role}.js').read_text().split('=',1)[1].strip().rstrip(';'))
def save(role, people):
    (ROOT/f'data/{role}.js').write_text(f'window.{role.upper()} = '+json.dumps(people,ensure_ascii=False,separators=(',',':'))+';\n')
def usable(path):
    return path.suffix.lower() in {'.jpg','.jpeg','.png','.webp'} and not any(x.startswith('.') for x in path.parts)

bishops, pastors = read('bishops'), read('pastors')
by_code = {p['code']:p for p in bishops}
# Explicit user corrections; never copy the senior's biography into the junior.
for code in (45,167,115):
    by_code[code].update(organization='UD-OLGC',designation='UD-OLGC')
    by_code[code].pop('firstLoveGroup',None)
if not any(norm(p['name'])=='edwinmorganogoejr' for p in bishops):
    bishops.append(dict(code=max(p['code'] for p in bishops)+1,name='Edwin Morgan Ogoe Jr',title='Bishop',
                        organization='UO-FLC190',designation='UO-FLC190',denomination='FIRST LOVE CHURCH',
                        region='',image=None,amount=100,roleSource='User-confirmed junior; named First Love bishop portrait'))

# These aliases retain all known distinct identities, including Jr/Sr.
aliases = {45:['Edwin Morgan Ogoe','Edwin Morgan Ogoe Snr'],167:['Richard Aryee Snr'],
           169:['Richard Aryee Jnr'],79:['Henrietta Ariel Orlean Lindsay','Henrietta Ariel Orleans Lindsay'],
           59:['Luca Erica Aryee'],86:['Jacob Etrue Godwyll'],193:['Zoe Freda Andrea Asamoah'],
           38:['Dennis Djagblatey'],150:['Paa Kwesi Nyarkoh'],156:['Phillippa Marker Coker']}
ssd_paths = [Path(p) for p in Path('/tmp/drogs-ssd-files.txt').read_text().splitlines()]
# Limit automatic bishop matching to portrait libraries, not generated composites.
bishop_paths = [p for p in ssd_paths if usable(p) and any(x in str(p) for x in
    ['/COUNCILS/','/Bishops Images/','/ORGANIZED ELEMENTS/PEOPLE PHOTOS/'])]
bishop_paths += [p for p in OLD.rglob('*') if usable(p)]
desktop = Path('/tmp/drogs-desktop-images.txt')
if desktop.exists(): bishop_paths += [Path(p) for p in desktop.read_text().splitlines() if usable(Path(p)) and 'Screenshot' not in p]
pastor_paths = [p for p in MASTER.rglob('*') if usable(p)]
def index(paths):
    result=defaultdict(list)
    for p in paths: result[norm(p.stem)].append(p)
    return result
bindex,pindex = index(bishop_paths),index(pastor_paths)
names = Counter(norm(p['name']) for p in bishops+pastors)
audit=[]
def rank(path):
    text=str(path).lower()
    return (0 if 'red jacket' in text or re.search(r'\bred\b',path.stem.lower()) else 1,
            0 if '/all ud bishops/' in text or '/all first love bishops/' in text else 1,
            0 if path.suffix.lower()=='.png' else 1, str(path))
def assign(person,role,candidates):
    for source in sorted(set(candidates),key=rank):
        try:
            with Image.open(source) as original:
                im=ImageOps.exif_transpose(original).convert('RGBA')
                im.thumbnail((840,1000),Image.Resampling.LANCZOS)
                out=ROOT/f'assets/{role}/matched-{person["code"]}.webp'
                out.parent.mkdir(parents=True,exist_ok=True)
                im.save(out,'WEBP',quality=87,method=4)
            person['image']=str(out.relative_to(ROOT))
            person.pop('photoNeedsReview',None)
            person['photoMatch']='Exact named local portrait'
            audit.append({'role':role,'code':person['code'],'name':person['name'],'source':str(source)})
            return source
        except (OSError,ValueError): continue
    return None

for p in bishops:
    labels=aliases.get(p['code'],[p['name']])
    candidates=[f for label in labels for f in bindex.get(norm(label),[])]
    # Never match the unsuffixed Richard name to his junior.
    assign(p,'bishops',candidates)
    groups=set()
    for f in candidates:
        marker='/KURIAKE/UD BISHOPS/'
        if marker in str(f):
            folder=str(f).split(marker)[1].split('/')[0]
            if folder in GROUPS: groups.add(GROUPS[folder])
    if p['organization']=='UD-OLGC' and len(groups)==1: p['udGroup']=groups.pop()

for p in pastors:
    if names[norm(p['name'])]!=1: continue
    source=assign(p,'pastors',pindex.get(norm(p['name']),[]))
    if source and p['organization']=='UD-OLGC':
        parts=[x.upper() for x in source.parts]
        folder_aliases={'UD AF':'UD AFRICA','UD EU':'UD EUROPE','UD NA':'UD NORTH AMERICA','ESCHATOS INT':'ESCHATOS','UJ':'UNITED JESUS'}
        candidates={GROUPS.get(folder_aliases.get(x,x)) for x in parts}-{None}
        if len(candidates)==1:p['udGroup']=candidates.pop()

logos=prepare_denomination_logos(ROOT)
for p in bishops+pastors:
    p['denominationLogo']=match_denomination_logo('FIRST LOVE CHURCH' if p['organization']=='UO-FLC190' else p.get('denomination',''),logos)
save('bishops',bishops);save('pastors',pastors)
(ROOT/'.private').mkdir(exist_ok=True)
(ROOT/'.private/local-photo-matches.json').write_text(json.dumps(audit,indent=2))
report={}
for role,people in [('bishops',bishops),('pastors',pastors)]:
    report[role]={'total':len(people),'organizations':dict(Counter(p['organization'] for p in people)),
      'withPhoto':sum(bool(p.get('image')) for p in people),'newPhotoMatches':sum(a['role']==role for a in audit),
      'groupAssignments':dict(Counter((p.get('udGroup') or p.get('firstLoveGroup') or 'Unassigned') for p in people)),
      'missingPhotos':[{'code':p['code'],'name':p['name']} for p in people if not p.get('image')],
      'missingLogos':dict(Counter(p.get('denomination','Unspecified') for p in people if not p.get('denominationLogo')))}
(ROOT/'.private/mapping-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:{a:b for a,b in v.items() if a not in ('missingPhotos','missingLogos')} for k,v in report.items()},indent=2))
