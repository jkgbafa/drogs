import test from 'node:test';import assert from 'node:assert/strict';import {progressStatus} from '../src/runtime/progress-status.js';
test('new records have one status and submitted stages stay distinct',()=>{
 assert.deepEqual(progressStatus({status:'not_started'}),{stage:'Not started',stageTone:'',approval:null,approvalTone:'info'});
 assert.equal(progressStatus({status:'submitted'}).stage,'Application submitted');
 assert.equal(progressStatus({status:'submitted',paid:true}).stage,'Form and payment complete');
 assert.equal(progressStatus({status:'submitted',paid:true}).approval,'Awaiting approval');
 assert.equal(progressStatus({status:'submitted',paid:true,review:'Approved'}).approvalTone,'good');
});
test('resignations and exceptional decisions retain their meaning',()=>{
 const r={status:'submitted',responses:{intention:'I wish to resign'}};assert.equal(progressStatus(r).stage,'Resignation requested');assert.equal(progressStatus(r).approval,null);
 assert.equal(progressStatus({status:'submitted',review:'Declined'}).approval,'Declined');
 assert.equal(progressStatus({status:'draft',paid:true}).stage,'Payment recorded · form incomplete');
});

import {paymentUnlocked} from '../src/runtime/payment-eligibility.js';
test('payment stays locked until a submitted application is approved',()=>{
 for(const r of [{},{status:'draft',review:'Approved'},{status:'submitted',review:'In review'},{status:'submitted',review:'Declined'},{status:'submitted',review:'On hold'},{status:'submitted',review:'Approved',responses:{intention:'I wish to resign'}}])assert.equal(paymentUnlocked(r),false);
 assert.equal(paymentUnlocked({status:'submitted',review:'Approved',paid:false}),true);
 assert.equal(progressStatus({status:'submitted',review:'Approved'}).stage,'Approved · commitment pending');
});
