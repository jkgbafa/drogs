import test from 'node:test';
import assert from 'node:assert/strict';
import {bulkApprovalBlock,prepareBulkApproval} from '../src/runtime/bulk-review.js';
const ready=()=>({status:'submitted',paid:true,review:'In review',responses:{intention:'I wish to continue'},paymentProof:'receipt',reviewNote:'Retain this'});
const options={timestamp:'2026-09-25T15:00:00Z',batchId:'test-batch'};
test('bulk approval excludes unsubmitted, resigning, approved and individual-review cases',()=>{
 assert.equal(bulkApprovalBlock(ready()),'');
 assert.equal(bulkApprovalBlock({...ready(),paid:false}),'');
 for(const patch of [{status:'draft'},{review:'Approved'},{review:'Declined'},{review:'On hold'},{review:'More information requested'},{responses:{intention:'I wish to resign'}},{responses:{intention:'I need to discuss my position'}}])assert(bulkApprovalBlock({...ready(),...patch}));
});
test('batch changes only selected canonical records, preserving receipts, responses, notes and role identity',()=>{
 const r=ready(), records={'bishop:1':r,'pastor:1':ready(),'pastor:2':ready()};
 const people=[{type:'bishop',code:1,r},{type:'pastor',code:1,r:records['pastor:1']}];
 const next=prepareBulkApproval(records,people,options);
 for(const key of ['bishop:1','pastor:1']){
  assert.equal(next[key].review,'Approved');assert.equal(next[key].paymentProof,'receipt');assert.equal(next[key].reviewNote,'Retain this');assert.deepEqual(next[key].responses,r.responses);assert.equal(next[key].reviewHistory[0].batchId,'test-batch');
 }
 assert.equal(next['pastor:2'],records['pastor:2']);assert.equal(records['bishop:1'].review,'In review');
});
test('changed or invalid selected record rejects entire batch without mutating source',()=>{
 const r=ready(), people=[{type:'pastor',code:1,r},{type:'pastor',code:2,r}];
 for(const change of [{paid:false},{review:'Approved'},{reviewNote:'Changed by another review'}]){
  const records={'pastor:1':r,'pastor:2':{...r,...change}};
  assert.throws(()=>prepareBulkApproval(records,people,options),/changed/);assert.equal(records['pastor:1'].review,'In review');
 }
 assert.throws(()=>prepareBulkApproval({},[],options),/Select/);
});
test('merged aliases resolve safely and batches support more than 5000 submissions',()=>{
 const r=ready(), next=prepareBulkApproval({'pastor:99':r},[{type:'pastor',code:100,previousPastorCode:99,r}],options);
 assert.equal(next['pastor:100'].review,'Approved');assert.equal(next['pastor:99'].review,'In review');
 const people=Array.from({length:5100},(_,code)=>({type:'pastor',code,r:ready()}));
 const records=Object.fromEntries(people.map(p=>[`pastor:${p.code}`,p.r]));
 const updated=prepareBulkApproval(records,people,options);
 assert.equal(Object.values(updated).filter(r=>r.review==='Approved').length,5100);
});
