import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, hashKey, SCOPES } from '../supabase/functions/drogs-api/handler.mjs';
import { createSupabaseStore } from '../supabase/functions/drogs-api/store.mjs';

const token = 'drg_' + 'a'.repeat(43);
const people = [
  { id:'B4',role:'bishop',data:{code:4,name:'Example UD Person',title:'Episcopal Sister',organization:'UD-OLGC',denomination:'Example Church',mobile:'private-number',address:'private-address',age:'45',profession:'Teacher'} },
  { id:'B195',role:'bishop',data:{code:195,name:'Example FL Person',title:'Mother',organization:'UO-FLC190'} },
  { id:'P1',role:'pastor',data:{code:1,name:'Example Pastor',organization:'UD-OLGC'} },
];
async function fixture(overrides={}) {
  const key={id:'key-1',key_hash:await hashKey(token),scopes:['directory:read'],roles:[],organizations:[],expires_at:'2099-01-01T00:00:00Z',...overrides};
  const audit=[];
  const store={
    findKey:async hash=>hash===key.key_hash?key:null,
    consumeQuota:async()=>true,
    listPeople:async(filters,k,limit,offset)=>people.filter(p=>(!k.roles.length||k.roles.includes(p.role))&&(!k.organizations.length||k.organizations.includes(p.data.organization))&&(!filters.role||filters.role===p.role)&&(!filters.organization||filters.organization===p.data.organization)).slice(offset,offset+limit),
    getPerson:async id=>people.find(p=>p.id===id),
    getRecord:async()=>({status:'submitted',responses:{disclosure:'private disclosure'},paid:true,paymentMethod:'MoMo',paymentProof:'never return inline',paymentProofPath:'B4/proof.jpg',review:'In review',reviewNote:'private note'}),
    signProof:async()=> 'https://example.invalid/signed-proof',
    audit:async entry=>audit.push(entry),
  };
  const handler=createHandler(store);
  const call=(path='/v1/people',options={})=>handler(new Request('https://example.invalid'+path,{headers:{Authorization:'Bearer '+token,...options.headers},...options}));
  return{key,store,handler,call,audit};
}
test('Missing, invalid, expired, revoked and malformed-expiry keys are rejected',async()=>{
  const f=await fixture();
  assert.equal((await f.handler(new Request('https://example.invalid/v1/people'))).status,401);
  assert.equal((await f.call('/v1/people',{headers:{Authorization:'Bearer wrong'}})).status,401);
  for(const props of [{expires_at:'2020-01-01'},{revoked_at:'2026-01-01'},{expires_at:'bad'}])assert.equal((await(await fixture(props)).call()).status,401);
});
test('Directory scope omits contacts and private fields and cannot read other resources',async()=>{
  const f=await fixture(),r=await f.call();assert.equal(r.status,200);
  const body=await r.json();assert.equal(body.data.length,3);assert(!JSON.stringify(body).includes('private'));
  for(const path of ['contacts','profile','application','payment','payment-proof','review'])assert.equal((await f.call('/v1/people/B4/'+path)).status,403);
  assert(!JSON.stringify(f.audit).includes(token));
});
test('Organization and role restrictions apply to lists and guessed record IDs',async()=>{
  const f=await fixture({roles:['bishop'],organizations:['UD-OLGC'],scopes:SCOPES});
  assert.deepEqual((await(await f.call()).json()).data.map(p=>p.id),['B4']);
  for(const id of ['P1','B195'])for(const resource of ['', '/profile','/contacts','/application','/payment-proof'])assert.equal((await f.call('/v1/people/'+id+resource)).status,404);
});
test('Private answers and review notes require separate scopes',async()=>{
  const f=await fixture({scopes:['applications:read','reviews:read','payments:read']});
  const application=await(await f.call('/v1/people/B4/application')).json();assert(!('responses' in application.data));
  const review=await(await f.call('/v1/people/B4/review')).json();assert(!('reviewNote' in review.data));
  const payment=await(await f.call('/v1/people/B4/payment')).json();assert(!('paymentProof' in payment.data));assert(!('paymentProofPath' in payment.data));
  f.key.scopes=SCOPES;
  assert.equal((await(await f.call('/v1/people/B4/application')).json()).data.responses.disclosure,'private disclosure');
  assert.equal((await(await f.call('/v1/people/B4/review')).json()).data.reviewNote,'private note');
  assert.equal((await(await f.call('/v1/people/B4/payment-proof')).json()).data.expiresIn,60);
});
test('Pagination, CORS, methods and rate limits fail safely',async()=>{
  const f=await fixture();
  for(const query of ['limit=1000','offset=-1','limit=NaN','select=*','role=admin','organization=bad'])assert.equal((await f.call('/v1/people?'+query)).status,400);
  assert.equal((await f.call('/v1/people',{method:'POST'})).status,405);
  assert.equal((await f.call('/v1/people',{headers:{Authorization:'Bearer '+token,Origin:'https://other.invalid'}})).status,403);
  f.store.consumeQuota=async()=>false;assert.equal((await f.call()).status,429);
});
test('Deployment route prefix is supported; unexpected store failures expose no details',async()=>{
  const f=await fixture();assert.equal((await f.call('/functions/v1/drogs-api/v1/people')).status,200);
  f.store.findKey=async()=>{throw new Error('secret credentials here')};const r=await f.call();assert.equal(r.status,500);assert(!(await r.text()).includes('secret'));
});
test('Supabase adapter enforces key bounds and never treats modern secret keys as JWTs',async()=>{
  const requests=[];
  const store=createSupabaseStore('https://example.supabase.co','sb_secret_test',async(url,options)=>{requests.push({url,options});return Response.json([])});
  await store.listPeople({role:'pastor',organization:'UO-FLC190'}, {roles:['bishop'],organizations:['UD-OLGC']},50,0);
  const url=new URL(requests[0].url);
  assert.deepEqual(url.searchParams.getAll('role'),['in.("bishop")','eq.pastor']);
  assert.deepEqual(url.searchParams.getAll('data->>organization'),['in.("UD-OLGC")','eq.UO-FLC190']);
  assert(!requests[0].options.headers.Authorization);
});
