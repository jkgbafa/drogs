"""Upload only linked directory portraits; credentials stay outside the repository.

Run with a Python environment containing boto3. The default credential file is
~/.config/drogs/r2.env (mode 0600). No raw workbooks or payment receipts are uploaded.
"""
from pathlib import Path
import argparse, json, hashlib, mimetypes, concurrent.futures, os
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
ROOT=Path(__file__).resolve().parents[1]
def client():
 path=Path(os.environ.get('DROGS_R2_CONFIG',str(Path.home()/'.config/drogs/r2.env')))
 config=dict(line.split('=',1) for line in path.read_text().splitlines() if line and not line.startswith('#'))
 return boto3.client('s3',endpoint_url=f'https://{config["R2_ACCOUNT_ID"]}.r2.cloudflarestorage.com',aws_access_key_id=config['R2_ACCESS_KEY_ID'],aws_secret_access_key=config['R2_SECRET_ACCESS_KEY'],region_name='auto',config=Config(signature_version='s3v4',s3={'addressing_style':'path'},connect_timeout=15,read_timeout=60,retries={'max_attempts':3},max_pool_connections=24)),config['R2_BUCKET']
def roster(role):return json.loads((ROOT/f'data/{role}.js').read_text().split('=',1)[1].strip().rstrip(';'))
def upload(s3,bucket,role,person):
 relative=person['image'];path=(ROOT/relative).resolve()
 if not any(path.is_relative_to((ROOT/'assets'/folder).resolve()) for folder in ('bishops','pastors')):raise ValueError('Portrait outside approved directory')
 data=path.read_bytes();sha=hashlib.sha256(data).hexdigest()
 key=f'portraits/{sha[:2]}/{sha}{path.suffix.lower()}'
 try:head=s3.head_object(Bucket=bucket,Key=key)
 except ClientError as error:
  if error.response['Error']['Code'] not in ('404','NoSuchKey','NotFound'):raise
  head=None
 if not head or head['ContentLength']!=len(data) or head.get('Metadata',{}).get('sha256')!=sha:
  s3.put_object(Bucket=bucket,Key=key,Body=data,ContentType=mimetypes.guess_type(path.name)[0] or 'image/webp',CacheControl='public, max-age=31536000, immutable',Metadata={'sha256':sha})
  head=s3.head_object(Bucket=bucket,Key=key)
 if head['ContentLength']!=len(data) or head.get('Metadata',{}).get('sha256')!=sha:raise ValueError('Uploaded object verification failed')
 return relative,{'key':key,'sha256':sha,'bytes':len(data)}
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--probe',action='store_true');args=parser.parse_args();s3,bucket=client()
 if args.probe:
  s3.list_objects_v2(Bucket=bucket,MaxKeys=1);print('R2 bucket access verified.');return
 jobs=[(role,p) for role in ('bishops','pastors') for p in roster(role) if p.get('image')]
 results={};failures=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
  pending={pool.submit(upload,s3,bucket,role,p):(role,p['code']) for role,p in jobs}
  for future in concurrent.futures.as_completed(pending):
   try:path,item=future.result();results[path]=item
   except Exception as error:failures.append({'record':pending[future],'errorType':type(error).__name__})
   if (len(results)+len(failures))%200==0:print(f'Checked {len(results)+len(failures)} / {len(jobs)} portraits; failures: {len(failures)}',flush=True)
 report={'verified':len(results),'expected':len(jobs),'bytes':sum(x['bytes'] for x in results.values()),'failures':failures}
 (ROOT/'.private/r2-upload-report.json').write_text(json.dumps(report,indent=2))
 if failures:print(json.dumps(report));raise SystemExit(1)
 dest=ROOT/'data/photo-storage.json'
 previous=json.loads(dest.read_text()) if dest.exists() else {}
 dest.write_text(json.dumps({'provider':'r2','publicBaseUrl':previous.get('publicBaseUrl',''),'objects':dict(sorted(results.items()))},indent=2)+'\n')
 print(json.dumps(report))
if __name__=='__main__':
 try:main()
 except ClientError as error:
  print('R2 request failed:',error.response.get('Error',{}).get('Code','Unknown'));raise SystemExit(1)
