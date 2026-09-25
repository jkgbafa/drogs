export const REVIEW_RULE_VERSION='2027-09-25-v1';
export const visibleFields=(questions,responses)=>questions.flatMap(q=>[q,...(q.followUps||[]).filter(f=>!f.when||responses[q.id]===f.when)]);
const values=field=>(field.options||[]).map(o=>typeof o==='string'?o:o.value);
export function validateApplication(questions,responses,{attestation=false}={}){
 const errors=[];
 for(const f of visibleFields(questions,responses)){
  const v=responses[f.id],title=f.title||f.label;
  if(f.type==='choice'&&!values(f).includes(v))errors.push({id:f.id,title});
  else if(f.type==='number'&&(v===undefined||String(v).trim()===''||!Number.isInteger(Number(v))||Number(v)<0))errors.push({id:f.id,title});
  else if(f.type==='text'&&f.title&&!String(v||'').trim())errors.push({id:f.id,title});
 }
 if(attestation&&responses.declaration!==true)errors.push({id:'declaration',title:'Confirm that your answers are truthful.'});
 return errors;
}
export function assessApplication(questions,responses){
 const flags=[],middle=[];
 const add=(f,reason)=>flags.push({id:f.id,question:f.title||f.label,answer:responses[f.id]??'',reason});
 for(const f of visibleFields(questions,responses)){
  const v=responses[f.id],rule=f.review;
  if(rule){if((rule.middle||[]).includes(v))middle.push(f);else if(!(rule.clear||[]).includes(v))add(f,rule.reason||'This answer needs individual review.');}
  if(f.reviewNote&&String(v||'').trim())add(f,'Additional information supplied for review.');
 }
 if(middle.length>=3)middle.forEach(f=>add(f,'Three or more answers indicate partial participation or commitment.'));
 for(const [id,question]of [['disclosure','Confidential note'],['intentionNote','Additional information about your renewal decision']])if(String(responses[id]||'').trim())add({id,title:question},'A personal note needs review.');
 for(const error of validateApplication(questions,responses,{attestation:true}))if(!flags.some(f=>f.id===error.id))add(error,'Required answer or truthfulness declaration missing.');
 const resignation=responses.intention==='I wish to resign';
 return {rulesVersion:REVIEW_RULE_VERSION,flags,middleCount:middle.length,review:resignation?'Resignation requested':flags.length?'In review':'Approved',automatic:!resignation&&!flags.length};
}
export function needsApplicationReview(record={}){
 return record.status==='submitted'&&record.responses?.intention!=='I wish to resign'&&!['Approved','Declined'].includes(record.review);
}
export function applicationFlags(record={}){
 if(record.reviewAssessment?.flags?.length)return record.reviewAssessment.flags;
 return [{id:'legacy',question:'Application requires individual review',answer:'This application was submitted before the current review rules, or was placed on hold.',reason:'Review the original responses before making a decision.'}];
}
