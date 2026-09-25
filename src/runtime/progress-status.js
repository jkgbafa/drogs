import { needsApplicationReview } from './application-review.js';
export function progressStatus(r={}){
 const submitted=r.status==='submitted';
 const resignation=submitted&&r.responses?.intention==='I wish to resign';
 const stage=resignation?'Resignation requested':submitted?(r.paid?'Form and payment complete':r.review==='Approved'?'Approved · commitment pending':'Application submitted'):r.paid?'Payment recorded · form incomplete':r.status==='draft'?'Application in progress':'Not started';
 const exceptions=['Declined','On hold','More information requested'];
 const approval=r.review==='Approved'?'Approved':exceptions.includes(r.review)?r.review:submitted&&!resignation?'Awaiting approval':null;
 return {stage,stageTone:resignation?'warn':submitted||r.paid?'info':'',approval,approvalTone:approval==='Approved'?'good':needsApplicationReview(r)?'bad':exceptions.includes(approval)?'warn':'info'};
}
