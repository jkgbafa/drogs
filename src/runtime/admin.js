import { bulkApprovalBlock, prepareBulkApproval, submissionKey } from './bulk-review';
import { progressStatus } from './progress-status';
import { findRecord } from './person-records';
import { portraitUrl } from './photo-url';
import { portraitStyle } from './portrait-framing';
import { createDrogsSession } from './session';
import { createEventScope } from './events';

export function mountAdmin(host,directory) {
const {BISHOPS,PASTORS,BISHOP_QUESTIONS,BISHOP_QUESTION_SET,BISHOP_QUESTIONS_V1,BISHOP_QUESTIONS_V2,PASTOR_QUESTIONS,PASTOR_QUESTION_SET,PASTOR_QUESTIONS_V1,FLOW_BANK_ACCOUNTS}=directory;
const events=createEventScope();
const FIRST_LOVE_GROUPS=["FL OJ: ONLY JESUS","FL JF: JESUS FIRST","FL EU: SERVE JESUS","FL UK: CHOOSE JESUS","FL CI: JESUS NOW","FL NA: JESUS FOREVER","FL KJ: KING JESUS"];
const UD_GROUPS=['UA — United Africa','UI — United Islands','UD EU — Europe','UD GH — Ghana','UD NA — North America','UJ — United Jesus','ESC — Eschatos'];
const personGroup=person=>person.organization==='OUTREACH'?person.outreachGroup:person.organization==='UO-FLC190'?person.firstLoveGroup:person.udGroup;
const root=host,STORE='drogs-2027';
let activeView='directory',submissionRole='all',submissionQuery='';
let submissionOrganization='',submissionDenomination='',submissionReadiness='all',bulkNotice='';
const bulkSelected=new Set();
let sidebarHidden=localStorage.getItem('drogs-sidebar-hidden')==='yes';
let mode='cards',query='',adminType='bishop',openFilter=null,filterQuery='';
const session=createDrogsSession('drogs-admin',()=>{document.querySelector('#backdrop')?.remove();document.body.style.overflow='';login()});
const selected={organization:new Set(),denomination:new Set(),group:new Set(),status:new Set()};
const source=()=>adminType==='bishop'?BISHOPS:PASTORS;
const role=()=>adminType==='bishop'?'Bishop':'Pastor';
const rolePlural=()=>adminType==='bishop'?'Bishops':'Pastors';
const key=person=>`${adminType}:${person.code}`;
const initials=name=>name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const portrait=(person,className='')=>person.image?`<img class="${className}" style="${portraitStyle(person.image,className==='person-photo'?1:.8)}" src="${esc(portraitUrl(person.image,'../'))}" alt="${esc(person.name)}" loading="lazy" decoding="async">`:`<span class="admin-avatar ${className}">${initials(person.name)}</span>`;
const displayName=person=>person.name;
const displayCode=person=>`${adminType==='bishop'?'B':'P'}${person.code}`;
const affiliation=person=>person.organization;
const denominationLogo=(person,className='record-logo')=>person.denominationLogo?`<img class="${className}" src="../${person.denominationLogo}" alt="" decoding="async">`:'';
const gridIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>';
const listIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
const wishesToResign=r=>r.status==='submitted'&&r.responses?.intention==='I wish to resign';
const statusOptions=[['resignation','Wishes to resign'],['not_started','Not started'],['draft','Draft'],['submitted','Form submitted'],['submitted_unpaid','Submitted, not paid'],['complete','Submitted and paid'],['paid','Paid'],['unpaid','Unpaid'],['approved','Approved'],['ready','Ready / in review']];
const filterLabels={organization:'Organization',denomination:'Denomination',group:'Groups',status:'Status'};
function records(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return{}}}
function seeded(){return{status:'not_started',paid:false,review:'Awaiting submission',updatedAt:null,responses:{},paymentMethod:null}}
function rec(person){return findRecord(records(),person,adminType,seeded())}
function save(person,patch){const all=records();all[key(person)]={...rec(person),...patch,role:adminType,updatedAt:new Date().toISOString()};localStorage.setItem(STORE,JSON.stringify(all));dashboard()}
function status(r){if(r.status==='submitted'&&r.paid)return'complete';if(r.status==='submitted'&&!r.paid)return'submitted_unpaid';if(r.paid&&r.status!=='submitted')return'paid_unsubmitted';return r.status}
function login(){root.innerHTML=`<section class="login"><form class="login-card" id="login"><img class="logo" src="../assets/mitre-transparent.png" alt=""><div class="eyebrow">DROGS</div><h1>Administration</h1><p>Enter the office access code.</p><input class="field" id="pin" type="password" inputmode="numeric" placeholder="Access code" aria-label="Access code" autofocus><button class="primary">Enter DROGS</button><div class="error" id="error"></div></form></section>`;document.querySelector('#login').onsubmit=event=>{event.preventDefault();if(document.querySelector('#pin').value!=='1234'){document.querySelector('#error').textContent='That access code is not correct.';return}session.start();dashboard()}}
function data(type=adminType){const saved=records();return (type==='bishop'?BISHOPS:PASTORS).map(person=>({...person,r:findRecord(saved,person,type,seeded())}))}
function statusMatches(person,value){const r=person.r;return(value==='resignation'&&wishesToResign(r))||value===status(r)||(value==='submitted'&&r.status==='submitted')||(value==='paid'&&r.paid)||(value==='unpaid'&&!r.paid&&!wishesToResign(r))||(value==='approved'&&r.review==='Approved')||(value==='ready'&&r.status==='submitted'&&r.paid&&r.review!=='Approved'&&!wishesToResign(r))}
function categoryMatches(person){return(!selected.organization.size||selected.organization.has(person.organization))&&(!selected.denomination.size||selected.denomination.has(person.denomination))&&(!selected.group.size||selected.group.has(personGroup(person)))}
function matches(person){return categoryMatches(person)&&(!selected.status.size||[...selected.status].some(value=>statusMatches(person,value)))&&(!query||`${person.name} ${(person.nameAliases||[]).join(' ')} ${person.title||''} ${person.organization} ${person.denomination||''} ${person.region} ${displayCode(person)}`.toLowerCase().includes(query.toLowerCase()))}
function sorted(list){return list.sort((a,b)=>a.name.localeCompare(b.name))}
function metrics(list){return{total:list.length,resignation:list.filter(x=>wishesToResign(x.r)).length,outstanding:list.filter(x=>!x.r.paid&&!wishesToResign(x.r)).length,submitted:list.filter(x=>x.r.status==='submitted').length,paid:list.filter(x=>x.r.paid).length,ready:list.filter(x=>statusMatches(x,'ready')).length,approved:list.filter(x=>x.r.review==='Approved').length}}
function tag(text,type=''){return`<span class="tag ${type}">${esc(text)}</span>`}
function row(person){const r=person.r;return`<tr data-code="${person.code}" tabindex="0"><td><div class="person">${portrait(person,'person-photo')}<span><b>${esc(person.name)}</b><small>${displayCode(person)}</small></span></div></td><td>${esc(person.title||'—')}</td><td><b>${esc(person.organization)}</b><small class="cell-sub">${esc(person.denomination||'—')}</small></td><td>${esc(person.region)}</td><td>${tag(r.status==='submitted'?'Submitted':r.status==='draft'?'Draft':'Not started',r.status==='submitted'?'info':'')}</td><td>${tag(r.paid?'Paid':wishesToResign(r)?'Not required':'Outstanding',r.paid?'good':'warn')}</td><td>${tag(r.review,r.review==='Approved'?'good':'')}</td></tr>`}
function card(person){return`<button class="bishop-card portrait-card" data-code="${person.code}" aria-label="Open ${esc(person.name)}"><div class="card-image">${portrait(person,'card-photo')}</div><b>${esc(person.name)}</b></button>`}
function optionsFor(kind){
 if(kind==='status')return statusOptions;
 if(kind==='organization')return [['UD-OLGC','UD – OLGC'],['UO-FLC190','UO – FLC190'],['OUTREACH','Outreach']];
 if(kind==='group')return [...(!selected.organization.size||selected.organization.has('UD-OLGC')?UD_GROUPS:[]),...(!selected.organization.size||selected.organization.has('UO-FLC190')?FIRST_LOVE_GROUPS:[]),...(!selected.organization.size||selected.organization.has('OUTREACH')?[...new Set(BISHOPS.filter(p=>p.organization==='OUTREACH').map(p=>p.outreachGroup).filter(Boolean))]:[])].map(value=>[value,value]);
 return [...new Set(source().filter(x=>!selected.organization.size||selected.organization.has(x.organization)).map(x=>x.denomination).filter(Boolean))].sort().map(value=>[value,value]);
}
function filterControl(kind){
 const count=selected[kind].size;
 return`<div class="filter-control"><button class="filter-trigger ${count?'has-selection':''}" data-filter-menu="${kind}" aria-label="${filterLabels[kind]}" aria-expanded="${openFilter===kind}">${filterLabels[kind]}${count?`<span>${count}</span>`:''}<i>⌄</i></button>${openFilter===kind?`<section class="filter-menu" aria-label="${filterLabels[kind]} filters"><input id="filter-search" aria-label="Find ${filterLabels[kind].toLowerCase()}" placeholder="Find a record" value="${esc(filterQuery)}"><div class="filter-options">${optionsFor(kind).filter(([,label])=>label.toLowerCase().includes(filterQuery.toLowerCase())).map(([value,label])=>`<label><input type="checkbox" data-option="${esc(value)}" ${selected[kind].has(value)?'checked':''}><span>${esc(label)}</span></label>`).join('')}</div><div class="filter-footer"><button id="clear-category">Clear</button><button id="done-filter">Done</button></div></section>`:''}</div>`;
}
function clearFilters(){Object.values(selected).forEach(values=>values.clear());query='';openFilter=null;filterQuery=''}
function denominationHeading(){
 return [...selected.denomination].map(name=>{
  const belongs=p=>p.denomination===name&&(!selected.organization.size||selected.organization.has(p.organization));
  const bishops=BISHOPS.filter(belongs),pastors=PASTORS.filter(belongs),person=bishops[0]||pastors[0];
  const organizations=[...new Set([...bishops,...pastors].map(p=>p.organization))];
  return `<section class="denomination-heading" aria-label="Selected denomination"><div class="denomination-identity">${person?denominationLogo(person,'denomination-heading-logo'):''}<div><h2>${esc(name)}</h2><p>${organizations.map(esc).join(' · ')}</p></div></div><div class="denomination-totals"><button data-directory-role="bishop" data-directory-denomination="${esc(name)}" aria-label="View ${bishops.length} bishops in ${esc(name)}"><span>Bishops</span><strong>${bishops.length.toLocaleString()}</strong><small>View bishops <i aria-hidden="true">↗</i></small></button><button data-directory-role="pastor" data-directory-denomination="${esc(name)}" aria-label="View ${pastors.length} pastors in ${esc(name)}"><span>Pastors</span><strong>${pastors.length.toLocaleString()}</strong><small>View pastors <i aria-hidden="true">↗</i></small></button></div></section>`;
 }).join('');
}
function sidebarMarkup(){return `<aside class="sidebar"><div class="side-brand"><img src="../assets/mitre-transparent.png" alt=""><span><strong>DROGS</strong><small>2027</small></span></div><nav class="side-nav"><button class="${activeView==='directory'?'active':''}" id="directory"><i></i>Directory</button><button class="${activeView==='submissions'?'active':''}" id="submissions"><i></i>Submissions</button><button class="${activeView==='resignations'?'active':''}" id="resignations"><i></i>Resignations</button></nav><div class="side-foot"><button id="logout">Sign out</button></div></aside>`}
function bindNavigation(){
 document.querySelector('#toggle-sidebar').onclick=()=>{sidebarHidden=!sidebarHidden;localStorage.setItem('drogs-sidebar-hidden',sidebarHidden?'yes':'no');dashboard()};
 document.querySelector('#directory').onclick=()=>{bulkSelected.clear();activeView='directory';openFilter=null;dashboard()};
 document.querySelector('#submissions').onclick=()=>{activeView='submissions';submissionRole='all';submissionQuery='';submissionOrganization='';submissionDenomination='';submissionReadiness='all';bulkSelected.clear();bulkNotice='';openFilter=null;dashboard()};
 document.querySelector('#resignations').onclick=()=>{activeView='resignations';submissionRole='all';submissionQuery='';submissionOrganization='';submissionDenomination='';submissionReadiness='all';bulkSelected.clear();bulkNotice='';openFilter=null;dashboard()};
 document.querySelector('#logout').onclick=()=>session.signOut();
}
function submissionTime(value){
 const date=new Date(value);
 return value&&Number.isFinite(date.getTime())?date.getTime():0;
}
function submissionDate(value){
 return submissionTime(value)?new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Accra'}).format(new Date(value)):'Time not recorded';
}
function submissionsPage(){
 const resignationOnly=activeView==='resignations';
 const submitted=['bishop','pastor'].flatMap(type=>data(type).map(person=>({...person,type})))
   .filter(person=>(person.r.status==='submitted'||person.r.submittedAt)&&(!resignationOnly||wishesToResign(person.r)));
 const view=submitted.filter(person=>(submissionRole==='all'||person.type===submissionRole)&&
   (!submissionOrganization||person.organization===submissionOrganization)&&(!submissionDenomination||person.denomination===submissionDenomination)&&
   (submissionReadiness==='all'||(submissionReadiness==='ready'?!bulkApprovalBlock(person.r):person.r.review==='Approved'))&&
   (!submissionQuery||`${person.name} ${(person.nameAliases||[]).join(' ')} ${person.organization} ${person.region}`.toLowerCase().includes(submissionQuery.toLowerCase())))
   .sort((a,b)=>submissionTime(b.r.submittedAt)-submissionTime(a.r.submittedAt)||a.name.localeCompare(b.name));
 const eligible=view.filter(person=>!bulkApprovalBlock(person.r));
 const eligibleKeys=new Set(eligible.map(submissionKey));
 for(const key of bulkSelected)if(!eligibleKeys.has(key))bulkSelected.delete(key);
 const denominations=[...new Set(submitted.filter(p=>!submissionOrganization||p.organization===submissionOrganization).map(p=>p.denomination).filter(Boolean))].sort();
 const batchControls=resignationOnly?'':`<section class="bulk-workflow" aria-label="Bulk approval"><div class="bulk-intro"><div><h2>Approve by denomination</h2><p>1. Choose a denomination &nbsp; 2. Select everyone ready &nbsp; 3. Uncheck people to review individually &nbsp; 4. Approve the rest</p></div></div><div class="submission-filters"><label>Organization<select id="submission-organization"><option value="">All organizations</option>${['UD-OLGC','UO-FLC190','OUTREACH'].map(value=>`<option value="${value}" ${submissionOrganization===value?'selected':''}>${value}</option>`).join('')}</select></label><label>Denomination<select id="submission-denomination"><option value="">All denominations</option>${denominations.map(value=>`<option value="${esc(value)}" ${submissionDenomination===value?'selected':''}>${esc(value)}</option>`).join('')}</select></label><label>Show<select id="submission-readiness">${[['all','All submissions'],['ready','Ready for approval'],['approved','Already approved']].map(([value,label])=>`<option value="${value}" ${submissionReadiness===value?'selected':''}>${label}</option>`).join('')}</select></label></div><p class="bulk-help">Bulk approval includes submitted, paid applications. Resignations and cases needing individual review are excluded. Uncheck anyone you want to review individually; their status stays unchanged. Open their name to review responses and receipts, or put them On hold to exclude them from future batches.</p><div class="bulk-actions"><label><input type="checkbox" id="select-all-submissions" ${eligible.length&&bulkSelected.size===eligible.length?'checked':''} ${eligible.length?'':'disabled'}> Select all ${eligible.length.toLocaleString()} ready in these results</label><span id="bulk-selection-count" aria-live="polite">${bulkSelected.size.toLocaleString()} selected</span><button id="clear-bulk-selection" class="bulk-secondary">Clear selection</button><button id="review-bulk" class="primary" ${bulkSelected.size?'':'disabled'}>Review selected (${bulkSelected.size.toLocaleString()})</button></div></section>`;
 root.innerHTML=`<div class="shell ${sidebarHidden?'sidebar-collapsed':''}">${sidebarMarkup()}<section class="workspace"><header class="top"><button id="toggle-sidebar" class="sidebar-toggle" aria-label="${sidebarHidden?'Show sidebar':'Hide sidebar'}" aria-expanded="${!sidebarHidden}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg></button><div><h1>${resignationOnly?'Resignation requests':'Submissions'}</h1><p>${resignationOnly?'Requests for church review':'Latest submitted forms'} · Ghana time (GMT)</p></div></header><div class="submissions-toolbar"><div class="submission-role-filter" role="group" aria-label="Submission role">${[['all','Everyone'],['bishop','Bishops'],['pastor','Pastors']].map(([value,label])=>`<button data-submission-role="${value}" aria-pressed="${submissionRole===value}">${label}</button>`).join('')}</div><input id="submission-search" aria-label="Search submissions" placeholder="Search name or country" value="${esc(submissionQuery)}"></div>${batchControls}${bulkNotice?`<p class="bulk-notice" role="status">${esc(bulkNotice)}</p>`:''}<p class="submission-count">${view.length.toLocaleString()} ${resignationOnly?(view.length===1?'resignation request':'resignation requests'):(view.length===1?'submission':'submissions')}</p><div class="table-card"><div class="table-wrap"><table class="submission-table"><thead><tr>${resignationOnly?'':'<th>Select</th>'}<th>Name</th><th>Role</th><th>Organization</th><th>${resignationOnly?'Requested':'Submitted'} at · GMT</th><th>Response</th><th>Commitment</th><th>Review</th></tr></thead><tbody>${view.map(person=>`<tr data-submission-code="${person.code}" data-submission-type="${person.type}" tabindex="0">${resignationOnly?'':`<td class="submission-select"><input type="checkbox" data-bulk-key="${submissionKey(person)}" aria-label="Select ${esc(person.name)}" ${bulkSelected.has(submissionKey(person))?'checked':''} ${bulkApprovalBlock(person.r)?'disabled':''}>${bulkApprovalBlock(person.r)?`<small>${esc(bulkApprovalBlock(person.r))}</small>`:''}</td>`}<td><button class="submission-person">${portrait(person,'person-photo')}<b>${esc(person.name)}</b></button></td><td>${esc(person.title||(person.type==='bishop'?'Bishop':'Pastor'))}</td><td>${esc(person.organization)}<small class="cell-sub">${esc(person.denomination||'')}</small></td><td>${submissionTime(person.r.submittedAt)?`<time datetime="${esc(person.r.submittedAt)}">${submissionDate(person.r.submittedAt)}</time>`:'Time not recorded'}</td><td>${esc(person.r.responses?.intention||'Not specified')}</td><td>${tag(person.r.paid?'Paid':wishesToResign(person.r)?'Not required':'Outstanding',person.r.paid?'good':'warn')}</td><td>${tag(person.r.review,person.r.review==='Approved'?'good':'info')}</td></tr>`).join('')}</tbody></table>${view.length?'':`<div class="empty">${submitted.length?'No submissions match your search.':resignationOnly?'No resignation requests have been submitted.':'No forms have been submitted yet.'}</div>`}</div></div></section></div>`;
 bindNavigation();
 document.querySelectorAll('[data-submission-role]').forEach(button=>button.onclick=()=>{bulkSelected.clear();bulkNotice='';submissionRole=button.dataset.submissionRole;dashboard()});
 document.querySelector('#submission-search').oninput=event=>{const cursor=event.target.selectionStart;bulkSelected.clear();bulkNotice='';submissionQuery=event.target.value;dashboard();const input=document.querySelector('#submission-search');input.focus();input.setSelectionRange(cursor,cursor)};
 if(!resignationOnly){
  const updateSelection=()=>{
   document.querySelector('#bulk-selection-count').textContent=`${bulkSelected.size.toLocaleString()} selected`;
   const button=document.querySelector('#review-bulk');button.disabled=!bulkSelected.size;button.textContent=`Review selected (${bulkSelected.size.toLocaleString()})`;
   const all=document.querySelector('#select-all-submissions');all.checked=!!eligible.length&&bulkSelected.size===eligible.length;all.indeterminate=bulkSelected.size>0&&bulkSelected.size<eligible.length;
   document.querySelectorAll('[data-bulk-key]').forEach(input=>input.checked=bulkSelected.has(input.dataset.bulkKey));
  };
  document.querySelectorAll('[data-bulk-key]').forEach(input=>input.onchange=()=>{input.checked?bulkSelected.add(input.dataset.bulkKey):bulkSelected.delete(input.dataset.bulkKey);updateSelection()});
  document.querySelector('#select-all-submissions').onchange=event=>{bulkSelected.clear();if(event.target.checked)eligible.forEach(person=>bulkSelected.add(submissionKey(person)));updateSelection()};
  document.querySelector('#clear-bulk-selection').onclick=()=>{bulkSelected.clear();updateSelection()};
  document.querySelector('#review-bulk').onclick=()=>reviewBulk(eligible.filter(person=>bulkSelected.has(submissionKey(person))));
  for(const kind of ['organization','denomination','readiness'])document.querySelector(`#submission-${kind}`).onchange=event=>{
   bulkSelected.clear();bulkNotice='';
   if(kind==='organization'){submissionOrganization=event.target.value;submissionDenomination=''}
   if(kind==='denomination')submissionDenomination=event.target.value;
   if(kind==='readiness')submissionReadiness=event.target.value;
   dashboard();
  };
  updateSelection();
 }
 document.querySelectorAll('[data-submission-code]').forEach(row=>{
  const open=()=>{adminType=row.dataset.submissionType;clearFilters();drawer(Number(row.dataset.submissionCode),view)};
  row.onclick=event=>{if(!event.target.closest('.submission-select'))open()};row.onkeydown=event=>{if(event.key==='Enter'&&!event.target.closest('.submission-select')){event.preventDefault();open()}};
 });
}
function reviewBulk(people){
 if(!people.length||!session.active())return;
 const summary=new Map();
 for(const p of people){const label=`${p.organization} · ${p.denomination||'Denomination not recorded'}`;summary.set(label,(summary.get(label)||0)+1)}
 root.insertAdjacentHTML('beforeend',`<dialog id="bulk-dialog" class="bulk-dialog" aria-labelledby="bulk-title"><div class="eyebrow">Review selection</div><h2 id="bulk-title">Approve ${people.length.toLocaleString()} ${people.length===1?'application':'applications'}?</h2><p>These people will be marked Approved. Unchecked people stay awaiting review. Selected people’s responses, receipts and existing review notes will be kept.</p><ul class="bulk-summary">${[...summary].map(([name,count])=>`<li><span>${esc(name)}</span><strong>${count.toLocaleString()}</strong></li>`).join('')}</ul><details><summary>See all ${people.length.toLocaleString()} selected names</summary><ol class="bulk-names">${people.map(person=>`<li><b>${esc(person.name)}</b><span>${esc(person.title||person.type)} · ${esc(person.organization)} · ${esc(person.denomination||'')}</span></li>`).join('')}</ol></details><p id="bulk-error" role="alert"></p><div class="bulk-dialog-actions"><button id="cancel-bulk" class="bulk-secondary">Cancel</button><button id="confirm-bulk" class="primary">Approve ${people.length.toLocaleString()}</button></div></dialog>`);
 const dialog=document.querySelector('#bulk-dialog');dialog.showModal();
 const close=()=>{dialog.close();dialog.remove();document.querySelector('#review-bulk')?.focus()};
 dialog.oncancel=event=>{event.preventDefault();close()};
 document.querySelector('#cancel-bulk').onclick=close;
 document.querySelector('#confirm-bulk').onclick=()=>{
  if(!session.active()){close();login();return}
  const button=document.querySelector('#confirm-bulk');button.disabled=true;
  try{
   const fresh=JSON.parse(localStorage.getItem(STORE)||'{}');
   const next=prepareBulkApproval(fresh,people,{timestamp:new Date().toISOString(),batchId:crypto.randomUUID()});
   localStorage.setItem(STORE,JSON.stringify(next));
   close();bulkSelected.clear();bulkNotice=`${people.length.toLocaleString()} ${people.length===1?'application approved':'applications approved'}.`;dashboard();
  }catch(error){
   document.querySelector('#bulk-error').textContent=error.name==='QuotaExceededError'?'There is not enough browser storage to save these approvals. No approvals were saved.':error.message;
   button.disabled=false;
  }
 };
 document.querySelector('#cancel-bulk').focus();
}
function dashboard(){
 if(!session.active())return login();
 if(activeView==='submissions'||activeView==='resignations')return submissionsPage();
 const all=data(),m=metrics(all.filter(categoryMatches)),view=sorted(all.filter(matches)),count=Object.values(selected).reduce((n,s)=>n+s.size,0);
 root.innerHTML=`<div class="shell ${sidebarHidden?'sidebar-collapsed':''}">${sidebarMarkup()}<section class="workspace"><header class="top"><button id="toggle-sidebar" class="sidebar-toggle" aria-label="${sidebarHidden?'Show sidebar':'Hide sidebar'}" aria-expanded="${!sidebarHidden}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg></button><div><h1>DROGS</h1></div></header><div class="admin-role-switch"><button data-role="bishop" class="${adminType==='bishop'?'active':''}">Bishops <strong>${BISHOPS.length.toLocaleString()}</strong></button><button data-role="pastor" class="${adminType==='pastor'?'active':''}">Pastors <strong>${PASTORS.length.toLocaleString()}</strong></button></div><div class="metrics"><button class="metric" data-filter="all"><span>Listed ${rolePlural().toLowerCase()}</span><strong>${m.total.toLocaleString()}</strong><small>2027 directory</small></button><button class="metric" data-filter="submitted"><span>Forms submitted</span><strong>${m.submitted.toLocaleString()}</strong><small>${(m.total-m.submitted).toLocaleString()} not submitted</small></button><button class="metric" data-filter="paid"><span>Commitments paid</span><strong>${m.paid.toLocaleString()}</strong><small>${m.outstanding.toLocaleString()} outstanding</small></button><button class="metric" data-filter="ready"><span>Ready / in review</span><strong>${m.ready.toLocaleString()}</strong><small>Submitted and paid</small></button><button class="metric" data-filter="approved"><span>Approved</span><strong>${m.approved.toLocaleString()}</strong><small>2027 decisions</small></button></div><div class="resignation-summary"><button class="metric resignation-metric" data-filter="resignation"><span>Wishes to resign</span><strong>${m.resignation.toLocaleString()}</strong><small>View ${rolePlural().toLowerCase()} who requested to resign →</small></button></div><div class="toolbar compact-toolbar"><div class="filter-controls">${['organization','denomination','group','status'].map(filterControl).join('')}</div><input id="search" aria-label="Search directory" placeholder="Search name or country" value="${esc(query)}"><div class="view-toggle" role="group" aria-label="Directory view"><button data-view="cards" aria-label="Grid view" title="Grid view" aria-pressed="${mode==='cards'}">${gridIcon}</button><button data-view="table" aria-label="List view" title="List view" aria-pressed="${mode==='table'}">${listIcon}</button></div></div>${denominationHeading()}<div class="result-count">Showing ${view.length.toLocaleString()} ${view.length===1?role().toLowerCase():rolePlural().toLowerCase()} <span class="organization-counts">(UD: ${view.filter(p=>p.organization==='UD-OLGC').length.toLocaleString()} · UO: ${view.filter(p=>p.organization==='UO-FLC190').length.toLocaleString()} · Outreach: ${view.filter(p=>p.organization==='OUTREACH').length.toLocaleString()})</span>${count?`<button id="clear-filters">Clear filters (${count})</button>`:''}</div>${mode==='table'?`<div class="table-card"><div class="table-wrap"><table><thead><tr><th>Name</th><th>Title</th><th>Organization / denomination</th><th>Country</th><th>Application</th><th>Payment</th><th>Church review</th></tr></thead><tbody>${view.map(row).join('')}</tbody></table>${view.length?'':'<div class="empty">No records match these filters.</div>'}</div></div>`:`<div class="cards">${view.map(card).join('')}${view.length?'':'<div class="empty">No records match these filters.</div>'}</div>`}</section></div>`;
 bindNavigation();
 document.querySelector('#search').oninput=event=>{const cursor=event.target.selectionStart;query=event.target.value;dashboard();const input=document.querySelector('#search');input.focus();input.setSelectionRange(cursor,cursor)};
 document.querySelectorAll('[data-filter-menu]').forEach(button=>button.onclick=()=>{openFilter=openFilter===button.dataset.filterMenu?null:button.dataset.filterMenu;filterQuery='';dashboard();document.querySelector('#filter-search')?.focus()});
 document.querySelectorAll('[data-option]').forEach(input=>input.onchange=()=>{const set=selected[openFilter];input.checked?set.add(input.dataset.option):set.delete(input.dataset.option);dashboard()});
 const filterSearch=document.querySelector('#filter-search');
 if(filterSearch)filterSearch.oninput=event=>{const cursor=event.target.selectionStart;filterQuery=event.target.value;dashboard();const input=document.querySelector('#filter-search');input.focus();input.setSelectionRange(cursor,cursor)};
 const clearCategory=document.querySelector('#clear-category');if(clearCategory)clearCategory.onclick=()=>{selected[openFilter].clear();dashboard()};
 const done=document.querySelector('#done-filter');if(done)done.onclick=()=>{openFilter=null;dashboard()};
 const clear=document.querySelector('#clear-filters');if(clear)clear.onclick=()=>{clearFilters();dashboard()};
 document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{mode=button.dataset.view;openFilter=null;dashboard()});
 document.querySelectorAll('[data-role]').forEach(button=>button.onclick=()=>{adminType=button.dataset.role;openFilter=null;dashboard()});
 document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{selected.status.clear();if(button.dataset.filter!=='all')selected.status.add(button.dataset.filter);dashboard()});
 document.querySelectorAll('[data-directory-role]').forEach(button=>button.onclick=()=>{adminType=button.dataset.directoryRole;selected.denomination=new Set([button.dataset.directoryDenomination]);selected.group.clear();selected.status.clear();query='';openFilter=null;dashboard()});
 document.querySelectorAll('[data-code]').forEach(element=>{element.onclick=()=>drawer(Number(element.dataset.code));if(element.tagName==='TR')element.onkeydown=event=>{if(event.key==='Enter')drawer(Number(element.dataset.code))}});
}
events.listen(document,'click',event=>{if(openFilter&&!event.target.closest('.filter-control')&&!event.target.closest('#backdrop')){openFilter=null;dashboard()}});
events.listen(document,'keydown',event=>{if(event.key==='Escape'&&openFilter){openFilter=null;dashboard()}});
function fact(labelText,value){return value&&value!=='N/A'?`<div><span>${labelText}</span><b>${esc(value)}</b></div>`:''}
function declarationAnswers(r,type){
 const responses=r.responses||{};
 const pastorForm=r.questionSet?.startsWith('pastor-')||Object.keys(responses).some(name=>name.startsWith('pastor'));
 const questions=pastorForm?(r.questionSet===PASTOR_QUESTION_SET?PASTOR_QUESTIONS:PASTOR_QUESTIONS_V1):(r.questionSet===BISHOP_QUESTION_SET?BISHOP_QUESTIONS:r.questionSet==='governance-2027-v2'?BISHOP_QUESTIONS_V2:BISHOP_QUESTIONS_V1);
 const answer=(value,options=[])=>{
   if(value===undefined||value===null||value==='')return 'Not answered';
   const option=options.find(o=>typeof o==='object'&&o.value===value);
   return option?option.label:typeof value==='boolean'?(value?'Yes':'No'):String(value);
 };
 const known=new Set([...questions.flatMap(q=>[q.id,...(q.followUps||[]).map(f=>f.id)]),'declaration','disclosure','intentionNote']);
 return `<ol class="response-list">${questions.map(q=>`<li><h3>${esc(typeof q.title==='function'?q.title(type==='pastor'?'pastor':'leader'):q.title)}</h3><p>${esc(answer(responses[q.id],q.options))}</p>${(q.followUps||[]).filter(f=>!f.when||responses[q.id]===f.when||responses[f.id]).map(f=>`<div class="response-follow-up"><h4>${esc(f.label)}</h4><p>${esc(answer(responses[f.id],f.options))}</p></div>`).join('')}</li>`).join('')}</ol><div class="response-notes"><h3>Additional information about continuing or resigning</h3><p>${esc(answer(responses.intentionNote))}</p><h3>Confidential note</h3><p>${esc(answer(responses.disclosure))}</p><h3>Truthfulness declaration confirmed</h3><p>${esc(answer(responses.declaration))}</p>${Object.entries(responses).filter(([name])=>!known.has(name)).map(([name,value])=>`<h3>${esc(label(name))}</h3><p>${esc(answer(value))}</p>`).join('')}</div>`;
}
function drawer(code,submissionPeople=null){
  const people=submissionPeople||sorted(data().filter(matches)).map(person=>({...person,type:adminType}));
  const position=people.findIndex(x=>x.code===code&&x.type===adminType),person=source().find(x=>x.code===code);
  if(!person||position<0)return;
  const r=rec(person),progress=progressStatus(r);
  const previous=people[(position-1+people.length)%people.length],next=people[(position+1)%people.length];
  document.querySelector('#backdrop')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<div class="drawer-backdrop" id="backdrop"><section class="record-modal"><header class="record-toolbar"><button id="previous" aria-label="Previous record">←</button><span>${position+1} of ${people.length}</span><button id="next" aria-label="Next record">→</button><button class="drawer-close" id="close" aria-label="Close record">×</button></header><div class="record-hero"><div class="record-portrait">${portrait(person,'record-photo')}<span>DROGS · ${esc(person.title||role())}</span></div><div class="record-title"><div class="eyebrow record-person-title">${esc(person.title||role())}</div><h2>${esc(person.name)}</h2>${person.region&& !['international','n/a','unknown','country not recorded'].includes(person.region.trim().toLowerCase())?`<p class="record-country">${esc(person.region)}</p>`:''}<button class="denomination-link" id="browse-denomination" aria-label="View ${esc(person.denomination)}">${denominationLogo(person)}<span>${esc(person.denomination||'')}<small>View this denomination →</small></span></button><div class="record-tags">${tag(progress.stage,progress.stageTone)}${progress.approval?tag(progress.approval,progress.approvalTone):''}</div></div></div><nav class="record-sections" aria-label="Submission sections">${submissionPeople?'':'<button data-record-section="profile-info">Profile information</button>'}${submissionPeople?'<button data-record-section="declaration-responses">Responses</button>':''}<button data-record-section="payment-proof">Payment receipt</button></nav><div class="record-content"><section>${submissionPeople?'':`<div id="profile-info" class="eyebrow record-section-title">Personal and ministry information</div><div class="fact-grid">${fact('Title',person.title)}${fact('Age',person.age)}${fact('Gender',person.gender)}${fact('Organization',person.designation||person.organization)}${fact('Denomination',person.denomination)}${fact('Group',personGroup(person))}${fact('Supervising bishop',person.supervisingBishop)}${fact('Profession',person.profession)}${fact('Occupation',person.occupation)}${fact('Qualification',person.qualification)}${fact('Marital status',person.maritalStatus)}${fact('Country',person.region&&person.region.trim().toLowerCase()!=='international'?person.region:'')}${fact('City / state',[person.city,person.state].filter(Boolean).join(', '))}${fact('Council',person.council)}${fact('Diocese',person.diocese)}${fact('Administrative rank',person.adminRank)}${fact('Ministry rank',person.ministryRank)}${fact('Status rank',person.statusRank)}${fact('Function',person.functionsRank)}${fact('Year appointed',person.yearAppointed)}${fact('Year consecrated',person.yearConsecrated)}${fact('Year ordained',person.yearOrdained)}${fact('Mobile',person.mobile)}${fact('WhatsApp',person.whatsapp)}${fact('Email',person.email)}</div>`}${submissionPeople?`<section class="answer-block" id="declaration-responses"><h2>Declaration responses</h2><p class="submission-timestamp">Submitted: ${esc(submissionDate(r.submittedAt))} · GMT</p>${declarationAnswers(r,adminType)}${(r.previousDeclarations||[]).map(previous=>`<details class="previous-declaration"><summary>Previous declaration · ${esc(submissionDate(previous.submittedAt))}</summary>${declarationAnswers(previous,adminType)}</details>`).join('')}</section>`:''}</section><aside><div class="details"><div><span>Application</span><b>${r.status==='submitted'?'Submitted':r.status==='draft'?'Draft':'Not started'}</b></div><div><span>Annual commitment</span><b>${r.paid?'Paid':wishesToResign(r)?'Not required':'Outstanding'}</b></div><div><span>Payment method</span><b>${esc(r.paymentMethod||'—')}</b></div><div><span>Last activity</span><b>${r.updatedAt?new Date(r.updatedAt).toLocaleString('en-GB'):'—'}</b></div></div><div class="review-controls"><div class="eyebrow">Church decision</div><label>Review status<select id="decision"><option>Resignation requested</option><option>Awaiting submission</option><option>Ready for review</option><option>In review</option><option>More information requested</option><option>On hold</option><option>Approved</option><option>Declined</option></select></label><label>Internal review note<textarea id="note" placeholder="Record the reason or next action">${esc(r.reviewNote||'')}</textarea></label><button class="primary" id="save">Save review decision</button></div></aside></div></section></div>`);
  const proof=typeof r.paymentProof==='string'&&/^data:image\/(png|jpeg|webp);base64,/.test(r.paymentProof)?r.paymentProof:'';
  document.querySelector('.record-content aside').insertAdjacentHTML('afterbegin',`<section class="admin-proof" id="payment-proof"><h2>Payment receipt</h2>${proof?`<button class="proof-open" id="open-proof" aria-label="Enlarge payment receipt"><img src="${esc(proof)}" alt="Uploaded payment receipt"><span>View full image ↗</span></button><p>${esc(r.paymentProofName||'Payment receipt')}</p>`:`<p>${wishesToResign(r)?'Payment is not required for a resignation request.':'No payment receipt has been uploaded.'}</p>`}</section>`);
  if(proof){
    document.querySelector('.record-modal').insertAdjacentHTML('beforeend',`<dialog class="proof-dialog" id="proof-dialog" aria-label="Payment receipt image"><button id="close-proof" aria-label="Close payment receipt">×</button><img src="${esc(proof)}" alt="Full payment receipt"></dialog>`);
    const proofDialog=document.querySelector('#proof-dialog');
    document.querySelector('#open-proof').onclick=()=>proofDialog.showModal();
    document.querySelector('#close-proof').onclick=()=>proofDialog.close();
    proofDialog.onclick=event=>{if(event.target===proofDialog)proofDialog.close()};
  }
  document.querySelectorAll('[data-record-section]').forEach(button=>button.onclick=()=>document.getElementById(button.dataset.recordSection).scrollIntoView({behavior:'smooth',block:'start'}));
  document.body.style.overflow='hidden';
  document.querySelector('#decision').value=r.review;
  const close=()=>{document.removeEventListener('keydown',keys);document.querySelector('#backdrop')?.remove();document.body.style.overflow=''};
  const move=target=>{close();adminType=target.type;drawer(target.code,submissionPeople)};
  const keys=event=>{if(document.querySelector('#proof-dialog')?.open||event.target.matches('input,textarea,select'))return;if(event.key==='Escape')close();if(event.key==='ArrowLeft')move(previous);if(event.key==='ArrowRight')move(next)};
  events.listen(document,'keydown',keys);
  document.querySelector('#close').onclick=close;
  document.querySelector('#browse-denomination').onclick=()=>{close();activeView='directory';clearFilters();selected.organization.add(person.organization);if(person.denomination)selected.denomination.add(person.denomination);mode='cards';dashboard()};
  document.querySelector('#previous').onclick=()=>move(previous);
  document.querySelector('#next').onclick=()=>move(next);
  document.querySelector('#backdrop').onclick=event=>{if(event.target.id==='backdrop')close()};
  let startX=0;const modal=document.querySelector('.record-modal');modal.addEventListener('touchstart',event=>startX=event.changedTouches[0].clientX,{passive:true});modal.addEventListener('touchend',event=>{const delta=event.changedTouches[0].clientX-startX;if(!document.querySelector('#proof-dialog')?.open&&Math.abs(delta)>70)move(delta>0?previous:next)},{passive:true});
  document.querySelector('#save').onclick=()=>{const decision=document.querySelector('#decision').value,note=document.querySelector('#note').value;close();save(person,{review:decision,reviewNote:note})};
}
function label(key){const question=PASTOR_QUESTIONS.find(q=>q.id===key);if(question&&key!=='intention')return question.title;return key.replace(/([A-Z])/g,' $1').replace(/^./,x=>x.toUpperCase())}
function esc(value=''){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
events.listen(window,'storage',()=>dashboard());
dashboard();

return ()=>{events.dispose();session.dispose();host.replaceChildren();document.querySelector('#backdrop')?.remove();document.body.style.overflow='';};
}
