export function recordKeys(person,type){
 return [...new Set([`${type}:${person.code}`,...(person.previousBishopCodes||[]).map(code=>`bishop:${code}`),...[person.previousPastorCode,...(person.previousPastorCodes||[])].filter(code=>code!==undefined&&code!==null).map(code=>`pastor:${code}`)])];
}
export function findRecord(records,person,type,fallback={}){
 const candidates=recordKeys(person,type).map(key=>({key,record:records[key]})).filter(x=>x.record);
 const time=r=>Date.parse(r.updatedAt||r.submittedAt||'')||0;
 candidates.sort((a,b)=>time(b.record)-time(a.record));
 if(!candidates.length)return fallback;
 const chosen=candidates[0].record;
 if(candidates.length===1)return chosen;
 const history=[...(chosen.previousDeclarations||[])];
 for(const item of candidates.slice(1)){
  history.push(...(item.record.previousDeclarations||[]));
  if(Object.keys(item.record.responses||{}).length)history.push({...item.record,previousDeclarations:undefined,mergedFrom:item.key});
 }
 const seen=new Set();
 return {...chosen,previousDeclarations:history.filter(item=>{const id=JSON.stringify([item.questionSet,item.responses,item.submittedAt]);if(seen.has(id))return false;seen.add(id);return true})};
}
