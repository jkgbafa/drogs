"""Read-only audit of portrait filenames, archives, links and duplicate assets.
No fuzzy candidate is assigned automatically. Reports remain private.
"""
from pathlib import Path
from collections import defaultdict,Counter
from difflib import SequenceMatcher
import json,re,unicodedata,zipfile,hashlib
ROOT=Path(__file__).resolve().parents[1];PRIVATE=ROOT/'.private'
EXT={'.jpg','.jpeg','.png','.webp','.heic','.heif','.tif','.tiff','.jfif','.psd'}
NOISE=set('bishop bishops pastor pastors reverend rev lady mother sister episcopal es ps lp bs lr dr prophet red jacket attire edited copy clean photo image portrait picture official formal new final png jpg jpeg'.split())
def words(value):
 value=unicodedata.normalize('NFKD',value).encode('ascii','ignore').decode().lower()
 value=re.sub(r'\b(jnr|junior)\b','jr',value);value=re.sub(r'\b(snr|senior)\b','sr',value)
 return tuple(x for x in re.findall('[a-z]+',value) if x not in NOISE)
def normalized(value):return ' '.join(sorted(words(value)))
def read(role):return json.loads((ROOT/f'data/{role}.js').read_text().split('=',1)[1].strip().rstrip(';'))
people={role:read(role) for role in ('bishops','pastors')}
paths=Path(PRIVATE/'all-photo-search-paths.txt').read_text().splitlines()
entries=[];archives=[];archive_errors=[]
for value in paths:
 p=Path(value)
 if any(x.startswith('.') or x in ('node_modules','__MACOSX','out','public') for x in p.parts):continue
 if p.suffix.lower() in EXT:entries.append({'path':value,'name':p.name,'parent':p.parent.name})
 elif p.suffix.lower()=='.zip':archives.append(p)
for archive in archives:
 try:
  with zipfile.ZipFile(archive) as z:
   for member in z.namelist():
    p=Path(member)
    if p.suffix.lower() in EXT and not any(x.startswith('.') or x=='__MACOSX' for x in p.parts):entries.append({'path':str(archive)+'::'+member,'name':p.name,'parent':p.parent.name,'archive':str(archive),'member':member})
 except (OSError,zipfile.BadZipFile) as e:archive_errors.append({'archive':str(archive),'type':type(e).__name__})
index=defaultdict(list);token_index=defaultdict(set)
for entry in entries:
 label=Path(entry['name']).stem
 if re.match(r'^(?:img|dsc|photo|\d)[-_\d]',label,re.I) and re.search('formal|official|bishops',entry['path'],re.I):
  if len(words(entry['parent']))>=2:label=entry['parent']
 key=normalized(label)
 if len(key.split())<2:continue
 index[key].append(entry)
 for token in key.split():token_index[token].add(key)
report={'inventoryFiles':len(paths),'imageFilesAndArchiveEntries':len(entries),'archivesInspected':len(archives),'archiveErrors':archive_errors,'missingCandidates':{},'linkedFileErrors':[],'existingNameReview':[],'duplicateImages':[]}
owners=defaultdict(list)
for role,rows in people.items():
 for p in rows:owners[normalized(p['name'])].append(f'{role}:{p["code"]}')
for role,rows in people.items():
 missing=[]
 for p in rows:
  if p.get('image'):
   file=ROOT/p['image']
   if not file.exists():report['linkedFileErrors'].append({'role':role,'code':p['code'],'name':p['name'],'error':'Missing file'})
   source=p.get('photoSourceFile','')
   if source:
    a=set(words(p['name']));b=set(words(Path(source).stem));shared=a&b
    if len(shared)<2 and len(b)>=2:report['existingNameReview'].append({'role':role,'code':p['code'],'name':p['name'],'filename':source,'photoMatch':p.get('photoMatch','')})
   continue
  labels=[p['name'],*p.get('photoAliases',[])];exact=[]
  for label in labels:exact+=index.get(normalized(label),[])
  options=set()
  for token in words(p['name']):options.update(token_index.get(token,()))
  target=normalized(p['name']);ts=set(words(p['name']));candidates=[]
  for option in options:
   shared=ts&set(option.split());similarity=SequenceMatcher(None,target,option).ratio()
   if len(shared)>=2 or similarity>=.78:
    score=round(100*(.6*similarity+.4*len(shared)/max(len(ts),len(option.split()))),1)
    candidates.append({'label':option,'score':score,'paths':[e['path'] for e in index[option][:4]]})
  candidates.sort(key=lambda x:x['score'],reverse=True)
  missing.append({'code':p['code'],'name':p['name'],'organization':p['organization'],'country':p.get('region'),'uniqueRosterName':len(owners[target])==1,'exactSources':exact[:15],'nearNames':candidates[:5]})
 report['missingCandidates'][role]=missing
# Decode every assigned asset and detect identical bytes across different records.
from PIL import Image
hashes=defaultdict(list)
for role,rows in people.items():
 for p in rows:
  if not p.get('image'):continue
  file=ROOT/p['image']
  try:
   with Image.open(file) as im:im.verify()
   hashes[hashlib.sha256(file.read_bytes()).hexdigest()].append({'role':role,'code':p['code'],'name':p['name'],'image':p['image']})
  except Exception as e:report['linkedFileErrors'].append({'role':role,'code':p['code'],'name':p['name'],'error':type(e).__name__})
report['duplicateImages']=[group for group in hashes.values() if len(group)>1]
(PRIVATE/'comprehensive-photo-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'filesSearched':len(paths),'imageEntries':len(entries),'archivesInspected':len(archives),'archiveErrors':len(archive_errors),'brokenImages':len(report['linkedFileErrors']),'duplicateImageGroups':len(report['duplicateImages']),'existingNamesForReview':len(report['existingNameReview']),'missingWithExactSources':{r:sum(bool(x['exactSources']) for x in group) for r,group in report['missingCandidates'].items()}},indent=2),flush=True)
for p in report['missingCandidates']['bishops']:print(json.dumps(p,ensure_ascii=False))
