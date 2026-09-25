"""Fill missing portraits from named sources; never create people or change their role.

Only the current master import is used for pastors. Bishop images can also come
from explicitly named portrait libraries. Uncertain matches stay in a private report.
"""
from pathlib import Path
from collections import defaultdict, Counter
import json, re, unicodedata, zipfile, hashlib, subprocess, os
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parents[1]
MASTER=Path('/Users/joshuagbafa/Downloads/Bishop\'s project/MASTER PORTRAITS IMPORT')
PRIVATE=ROOT/'.private'; PRIVATE.mkdir(exist_ok=True)
EXT={'.jpg','.jpeg','.png','.webp','.jfif','.heic','.heif','.tif','.tiff','.jpg_'}
NOISE=set('bishop bishops pastor pastors reverend rev lady mother sister episcopal es ps lp bs lr dr prophet jpg jpeg png webp heic red jacket attire edited copy clean photo image portrait picture'.split())
def tokens(value):
 value=unicodedata.normalize('NFKD',value).encode('ascii','ignore').decode().lower()
 value=re.sub(r'\([^)]*\)|\[[^]]*\]',' ',value)
 value=re.sub(r'\b(jnr|junior)\b','jr',value);value=re.sub(r'\b(snr|senior)\b','sr',value)
 return tuple(x for x in re.findall('[a-z]+',value) if x not in NOISE)
def key(value):return tuple(sorted(tokens(value)))
def valid(path):return path.suffix.lower() in EXT and not any(x.startswith('.') or x=='__MACOSX' for x in path.parts)
def read(role):return json.loads((ROOT/f'data/{role}.js').read_text().split('=',1)[1].strip().rstrip(';'))
def save(role,people):(ROOT/f'data/{role}.js').write_text(f'window.{role.upper()} = '+json.dumps(people,ensure_ascii=False,separators=(',',':'))+';\n')
people={role:read(role) for role in ('bishops','pastors')}
# Extract only portrait files from archives supplied inside the current master.
archive_root=MASTER/'EXTRACTED PORTRAIT ARCHIVES'
archive_errors=[]
for archive in list(MASTER.rglob('*.zip')):
 if archive_root in archive.parents:continue
 try:
  folder=archive_root/hashlib.sha256(str(archive).encode()).hexdigest()[:12]
  with zipfile.ZipFile(archive) as z:
   for info in z.infolist():
    rel=Path(info.filename)
    if info.is_dir() or not valid(rel) or rel.is_absolute() or '..' in rel.parts:continue
    target=folder/rel
    if not target.exists():
     target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(z.read(info))
 except (OSError,zipfile.BadZipFile) as e:archive_errors.append({'archive':str(archive),'error':str(e)})
master=[p for p in MASTER.rglob('*') if p.is_file() and valid(p)]
bishop_files=list(master)
for inventory in ('/tmp/drogs-current-local-files.txt','/tmp/drogs-current-ssd-files.txt'):
 if not Path(inventory).exists():continue
 for line in Path(inventory).read_text().splitlines():
  p=Path(line)
  if valid(p) and any(x in line for x in ('BISHOPS PICTURES','/Photos/','Bishops Images','PEOPLE PHOTOS','FLOW Church Photos','ALL UD BISHOPS','ALL FIRST LOVE BISHOPS')):bishop_files.append(p)
all_people=[p for group in people.values() for p in group]
name_owners=defaultdict(set)
for role,group in people.items():
 for p in group:
  for name in [p['name'],*p.get('photoAliases',[])]:name_owners[key(name)].add((role,p['code']))
# Previously user-confirmed alternate names only.
confirmed={('bishops',252):['Joseph Dick Mills']}
def index(files,bishop=False):
 result=defaultdict(list)
 for p in sorted(set(files)):
  label=p.stem
  # In the formal portrait library only, direct personal folders contain generic camera filenames.
  if bishop and re.match(r'^(photo|img|dsc)[-_0-9]',label,re.I) and '/Photos/' in str(p):label=p.parent.name
  k=key(label)
  if len(k)>=2:result[k].append(p)
 return result
indices={'bishops':index(bishop_files,True),'pastors':index(master)}
report={'attireReview':[],'matches':[],'ambiguous':[],'missing':{},'titleChanges':[],'archiveErrors':archive_errors}
for p in people['bishops']:
 female=str(p.get('gender','')).strip().upper() in ('F','FEMALE') or p.get('title') in ('Mother','Episcopal Sister')
 if female:
  title='Mother' if p['organization']=='UO-FLC190' else 'Episcopal Sister'
  if p.get('title')!=title:report['titleChanges'].append({'code':p['code'],'name':p['name'],'before':p.get('title'),'after':title});p['title']=title

def open_image(path):
 if path.suffix.lower() in ('.heic','.heif'):
  cache=PRIVATE/'heic-previews';cache.mkdir(exist_ok=True)
  output=cache/(hashlib.sha256(str(path).encode()).hexdigest()+'.jpg')
  if not output.exists():subprocess.run(['sips','-s','format','jpeg',str(path),'--out',str(output)],check=True,capture_output=True)
  return Image.open(output)
 return Image.open(path)
def rank(path):
 text=str(path).lower()
 return (0 if 'red jacket' in text or 'formal' in text else 1,0 if 'bishops pictures' in text else 1,str(path))
for role,group in people.items():
 idx=indices[role]
 for p in group:
  if p.get('image') and (ROOT/p['image']).exists():continue
  identity=(role,p['code']);candidates=[];kind='Exact normalized name'
  for label in [p['name'],*p.get('photoAliases',[]),*confirmed.get(identity,[])]:
   k=key(label)
   if name_owners[k]-{identity}:continue
   candidates+=idx.get(k,[])
  if not candidates:
   words=tokens(p['name']);wordset=set(words)
   # Retain all filename names; allow omitted middle names only for a unique roster identity.
   for k,paths in idx.items():
    ks=set(k)
    if len(ks)<2 or len(words)<2 or not ks<=wordset or words[-1] not in ks:continue
    owners=[q for q in all_people if ks<=set(tokens(q['name']))]
    if len(owners)==1:candidates+=paths;kind='Unique matching surname and other recorded names'
   if not candidates:
    # A country/city suffix is allowed only when it is recorded on that person.
    locations=set(tokens(' '.join(str(p.get(f,'')) for f in ('region','city','state','denomination'))))
    for k,paths in idx.items():
     photo_names=set(k)-locations
     if len(photo_names)>=2 and photo_names<=wordset and words[-1] in photo_names:
      owners=[q for q in all_people if photo_names<=set(tokens(q['name']))]
      if len(owners)==1:candidates+=paths;kind='Unique recorded names with matching denomination or location'
     elif len(wordset)>=3 and wordset<=set(k) and len(name_owners[key(p['name'])])==1:
      owners=[q for q in all_people if wordset<=set(tokens(q['name']))]
      if len(owners)==1:candidates+=paths;kind='Complete unique roster name with extra filename detail'
  if candidates and role=='bishops' and p['code'] not in (153,173) and os.environ.get('ALLOW_CASUAL_BISHOPS')!='yes':
   report['attireReview'].append({'code':p['code'],'name':p['name'],'candidates':[str(x) for x in sorted(set(candidates))]})
   candidates=[]
  if candidates:
   successful=False
   for source in sorted(set(candidates),key=rank):
    try:
     with open_image(source) as original:
      im=ImageOps.exif_transpose(original).convert('RGBA');im.thumbnail((840,1000),Image.Resampling.LANCZOS)
      out=ROOT/f'assets/{role}/reconciled-{p["code"]}.webp';im.save(out,'WEBP',quality=87,method=4)
     p.update(image=str(out.relative_to(ROOT)),photoSourceFile=source.name,photoMatch=kind)
     p.pop('photoNeedsReview',None)
     report['matches'].append({'role':role,'code':p['code'],'name':p['name'],'source':str(source),'method':kind});successful=True;break
    except (OSError,ValueError,subprocess.SubprocessError) as e:continue
  if not p.get('image'):
   # Suggestions are review-only, never assigned using fuzzy spelling.
   ws=set(tokens(p['name']))
   options=[{'filename':str(paths[0]),'nameTokens':list(k)} for k,paths in idx.items() if len(ws&set(k))>=2 and (len(ws&set(k))/max(len(ws),len(k)))>=.65]
   if options:report['ambiguous'].append({'role':role,'code':p['code'],'name':p['name'],'candidates':options[:5]})
 report['missing'][role]=[{'code':p['code'],'name':p['name'],'organization':p['organization']} for p in group if not p.get('image')]
 save(role,group)
report['counts']={role:{'total':len(group),'withPhoto':sum(bool(p.get('image')) for p in group),'missing':len(report['missing'][role])} for role,group in people.items()}
(PRIVATE/'missing-photo-reconciliation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
audit_path=ROOT/'data/directory-audit.json';audit=json.loads(audit_path.read_text());audit.update(bishopPhotos=report['counts']['bishops']['withPhoto'],pastorPhotos=report['counts']['pastors']['withPhoto']);audit_path.write_text(json.dumps(audit,indent=2)+'\n')
print(json.dumps({'counts':report['counts'],'newMatches':len(report['matches']),'titleChanges':report['titleChanges'],'ambiguous':len(report['ambiguous']),'bishopMatches':[m for m in report['matches'] if m['role']=='bishops']},indent=2))
