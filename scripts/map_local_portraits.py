"""Match named local portraits without fuzzy matching or inheriting a supervisor's name.

Preserves directory IDs. Full source paths stay in a git-ignored local audit.
"""
from pathlib import Path
from collections import defaultdict, Counter
import json, re, unicodedata
from PIL import Image, ImageOps
import subprocess, hashlib
from denomination_assets import prepare_denomination_logos, match_denomination_logo

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path('/Users/joshuagbafa/Downloads')
OLD = DOWNLOADS / "Bishop's project/BISHOPS PICTURES"
MASTER = DOWNLOADS / "Bishop's project/MASTER PORTRAITS IMPORT"
SSD = Path('/Volumes/HJC SSD 5/DOCUMENTARIES/SUPERNOVA')
GROUPS = {'ESCHATOS':'ESC — Eschatos','UD AFRICA':'UA — United Africa','UD EUROPE':'UD EU — Europe',
          'UD GHANA':'UD GH — Ghana','UD NORTH AMERICA':'UD NA — North America',
          'UNITED ISLANDS':'UI — United Islands','UNITED JESUS':'UJ — United Jesus'}

def words(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii','ignore').decode().lower()
    value = re.sub(r'\[[^]]*\]|\([^)]*\)', ' ', value)
    value = re.sub(r'\b(jnr|junior)\b','jr',value)
    value = re.sub(r'\b(snr|senior)\b','sr',value)
    value = re.sub(r'copy of|red jacket|red attire', ' ', value)
    value = re.sub(r'\b(bishop|bishops|pastor|pastors|reverend|rev|lady|mother|sister|es|ps|lp|bs|dr|prophet|jpg|jpeg|png|red)\b',' ',value)
    value = re.sub(r'^b\.\s*', '', value)
    return re.findall('[a-z]+',value)
def norm(value):return ''.join(words(value))

def read(role):
    return json.loads((ROOT/f'data/{role}.js').read_text().split('=',1)[1].strip().rstrip(';'))
def save(role, people):
    (ROOT/f'data/{role}.js').write_text(f'window.{role.upper()} = '+json.dumps(people,ensure_ascii=False,separators=(',',':'))+';\n')
def usable(path):
    return path.is_file() and path.suffix.lower() in {'.jpg','.jpeg','.png','.webp','.jfif','.heic','.heif','.tif','.jpg_'} and not any(x.startswith('.') for x in path.parts)

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
           38:['Dennis Djagblatey'],150:['Paa Kwesi Nyarkoh'],156:['Phillippa Marker Coker'],
           9:['Amelia Barecha Aidoo'],19:['Bridgette Marian Emunah Ogoe'],
           23:['Christos Isaac Abbey Tala'],56:['Pascal Erasmus Mensah'],
           99:['Joseph Kabiro Wachiro'],128:['Lovell Nii Ankrah'],250:['Reginald Opoku Sarkodie']}
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
bindex,pindex = index(bishop_paths+pastor_paths),index(pastor_paths)
group_aliases={'UD AF':'UD AFRICA','UD EU':'UD EUROPE','UD NA':'UD NORTH AMERICA','ESCHATOS INT':'ESCHATOS','UJ':'UNITED JESUS'}
def path_groups(path):
    return {GROUPS.get(group_aliases.get(part.upper(),part.upper())) for part in path.parts}-{None}
group_by_name=defaultdict(set)
for path in bishop_paths+pastor_paths:
    gs=path_groups(path)
    if len(gs)!=1:continue
    # Folder labels inform group membership, never the subject of a photograph.
    for part in path.parts[1:]:group_by_name[norm(Path(part).stem)].update(gs)
names = Counter(norm(p['name']) for p in bishops+pastors)
audit=[]
def open_image(source):
    if source.suffix.lower() in ('.heic','.heif'):
        cache=ROOT/'.private/heic-previews';cache.mkdir(exist_ok=True)
        converted=cache/(hashlib.sha256(str(source).encode()).hexdigest()+'.jpg')
        if not converted.exists():
            subprocess.run(['sips','-s','format','jpeg',str(source),'--out',str(converted)],check=True,capture_output=True)
        return Image.open(converted)
    return Image.open(source)
red_cache={}
def red_portrait(source):
    if source in red_cache:return red_cache[source]
    try:
        with open_image(source) as im:
            im=im.convert('RGB');im.thumbnail((72,72))
            red_cache[source]=sum(r>g*1.45 and r>b*1.35 and r>90 for r,g,b in im.getdata())/(im.width*im.height)>.025
    except (OSError,ValueError,subprocess.SubprocessError):red_cache[source]=False
    return red_cache[source]
def rank(path):
    text=str(path).lower()
    return (0 if 'red jacket' in text or re.search(r'\bred\b',path.stem.lower()) else 1,
            0 if '/all ud bishops/' in text or '/all first love bishops/' in text else 1,
            0 if path.suffix.lower()=='.png' else 1, str(path))
def assign(person,role,candidates):
    for source in sorted(set(candidates),key=lambda path:((0 if red_portrait(path) else 1,) if role=='bishops' else ())+rank(path)):
        try:
            out=ROOT/f'assets/{role}/matched-{person["code"]}.webp'
            if person.get('image')==str(out.relative_to(ROOT)) and person.get('photoSourceFile')==source.name and out.exists():
                audit.append({'role':role,'code':person['code'],'name':person['name'],'source':str(source)})
                return source
            with open_image(source) as original:
                im=ImageOps.exif_transpose(original).convert('RGBA')
                im.thumbnail((840,1000),Image.Resampling.LANCZOS)
                out.parent.mkdir(parents=True,exist_ok=True)
                im.save(out,'WEBP',quality=87,method=4)
            person['image']=str(out.relative_to(ROOT))
            person.pop('photoNeedsReview',None)
            person['photoMatch']='Exact named local portrait'
            person['photoSourceFile']=source.name
            audit.append({'role':role,'code':person['code'],'name':person['name'],'source':str(source)})
            return source
        except (OSError,ValueError,subprocess.SubprocessError): continue
    return None

for p in bishops:
    labels=aliases.get(p['code'],[p['name']])+p.get('photoAliases',[])
    candidates=[f for label in labels for f in bindex.get(norm(label),[])]
    if p['code']==67:
        confirmed=MASTER/'PASTORS PICTURES/UD AF/BISHOP FRANCIS TSIKATA/BISHOP FRANCIS TSIKATA/BISHOP FRANCIS.jpeg'
        if confirmed.exists():candidates.append(confirmed)
    if p['code']==246:
        confirmed=MASTER/'PASTORS PICTURES/UD GHANA/Bs Joojo/Bs Joojo.jpeg'
        if confirmed.exists():candidates.append(confirmed)
    if p['code']==253:
        confirmed=MASTER/'PASTORS PICTURES/UD AF/Bishop Daniel Marcus Annan/DANNY MARCUS.jpg'
        if confirmed.exists():candidates.append(confirmed)
    # Never match the unsuffixed Richard name to his junior.
    assign(p,'bishops',candidates)
    groups=set()
    for f in candidates:
        groups.update(path_groups(f))
        marker='/KURIAKE/UD BISHOPS/'
        if marker in str(f):
            folder=str(f).split(marker)[1].split('/')[0]
            if folder in GROUPS: groups.add(GROUPS[folder])
    for label in labels:groups.update(group_by_name.get(norm(label),set()))
    if p['organization']=='UD-OLGC' and len(groups)==1: p['udGroup']=groups.pop()

short_index=defaultdict(list)
for photo in pastor_paths:
    tokens=words(photo.stem)
    if len(tokens)>=2:short_index[(tokens[0],tokens[-1])].append((set(tokens),photo))
person_names=defaultdict(list)
for p in bishops+pastors:
    tokens=words(p['name'])
    if len(tokens)>=2:person_names[(tokens[0],tokens[-1])].append(p)
for p in pastors:
    if names[norm(p['name'])]!=1: continue
    candidates=pindex.get(norm(p['name']),[])
    match_kind='Exact named local portrait'
    if not candidates:
        tokens=words(p['name'])
        if len(tokens)>=2 and len(person_names[(tokens[0],tokens[-1])])==1:
            candidates=[file for nameset,file in short_index[(tokens[0],tokens[-1])] if nameset<=set(tokens)]
            match_kind='Unique first and last name; remaining filename names agree with roster'
    source=assign(p,'pastors',candidates)
    if source:p['photoMatch']=match_kind
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
