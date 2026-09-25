const app=document.querySelector('#app');
const STORE='drogs-2027';
const ENTRY='drogs-entry';
let current=null,currentType='bishop',confirmationTimer;
const session=createDrogsSession(ENTRY,()=>{current=null;history.replaceState(null,'',location.pathname);gate()});

const baseQuestions=BISHOP_QUESTIONS;
const wishesToResign=r=>r.status==='submitted'&&r.responses?.intention==='I wish to resign';

const roster=()=>currentType==='bishop'?BISHOPS:PASTORS;
function selectRecord(type,code){
  currentType=type;
  current=roster().find(person=>person.code===code||(type==='bishop'&&(person.previousBishopCodes||[]).includes(code)));
  if(!current&&type==='pastor'){
    current=BISHOPS.find(person=>person.previousPastorCode===code);
    if(current)currentType='bishop';
  }
  if(!current&&type==='bishop'){
    current=PASTORS.find(person=>(person.previousBishopCodes||[]).includes(code));
    if(current)currentType='pastor';
  }
}
const role=()=>currentType==='bishop'?'Leader':'Pastor';
const cycle=()=>currentType==='bishop'?'leadership':'pastoral';
const key=b=>`${currentType}:${b.code}`;
const initials=name=>name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const portrait=(person,className='',alt='')=>{const media=person.image?`<img class="${className}" src="${person.image}" alt="${esc(alt||person.name)}" loading="lazy" decoding="async">`:`<span class="avatar ${className}" aria-label="${esc(alt||person.name)}">${initials(person.name)}</span>`;return media};
const displayName=person=>person.name;
const affiliation=person=>`${person.designation||person.organization}${person.denomination?` — ${person.denomination}`:''}`;
const denominationLogo=(person,className='denomination-logo')=>person.denominationLogo?`<img class="${className}" src="${person.denominationLogo}" alt="${esc(person.denomination||person.organization)} logo" loading="lazy" decoding="async">`:'';
const displayCode=person=>`${currentType==='bishop'?'B':'P'}${person.code}`;
const paymentApps=[
  ['Wise','https://wise.com/send-money','wise.com'],['Sendwave','https://www.sendwave.com/en','sendwave.com'],['Remitly','https://www.remitly.com/','remitly.com'],['Western Union','https://www.westernunion.com/','westernunion.com'],['WorldRemit','https://www.worldremit.com/','worldremit.com'],
  ['LemFi','https://www.lemfi.com/','lemfi.com'],['Taptap Send','https://www.taptapsend.com/','taptapsend.com'],['MoMo','https://momo.mtn.com/','mtn.com'],['Skrill','https://www.skrill.com/','skrill.com'],['Paysend','https://paysend.com/','paysend.com'],
  ['TransferGo','https://www.transfergo.com/','transfergo.com'],['PayAngel','https://payangel.com/','payangel.com'],['Chipper','https://www.chippercash.com/','chippercash.com'],['Mukuru','https://www.mukuru.com/','mukuru.com'],['Flutterwave','https://flutterwave.com/','flutterwave.com'],
  ['Telecel Cash','https://telecel.com.gh/personal/telecel-cash/','telecel.com.gh'],['AT Money','https://at.com.gh/','at.com.gh']
];
const paymentAppLinks=()=>paymentApps.map(([name,url,domain])=>`<a class="payment-app" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="Open ${name}"><span class="app-mark"><img src="assets/payment-apps/${domain}.png" alt=""></span><span>${name}</span><i>↗</i></a>`).join('');

function loadRecords(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}}
function saveRecords(records){localStorage.setItem(STORE,JSON.stringify(records));window.dispatchEvent(new Event('storage'))}
function seeded(){return{status:'not_started',paid:false,review:'Awaiting submission',updatedAt:null,responses:{},paymentMethod:null}}
function record(b){const saved=loadRecords();return saved[key(b)]||(b.previousPastorCode?saved[`pastor:${b.previousPastorCode}`]:null)||(b.previousBishopCodes||[]).map(code=>saved[`bishop:${code}`]).find(Boolean)||seeded(b)}
function put(b,patch){const all=loadRecords();all[key(b)]={...record(b),...patch,role:currentType};saveRecords(all)}

function route(){clearTimeout(confirmationTimer);if(!session.active())return gate();const hash=location.hash.slice(1);const saved=history.state?.drogsRecord;if(saved&&['profile','declaration','payment','receipt','confirmation','response'].includes(hash)){selectRecord(saved.type,saved.code)}if(current&&['profile','declaration','payment','receipt','confirmation','response'].includes(hash))history.replaceState({drogsRecord:{type:currentType,code:current.code}},'');if(current&&wishesToResign(record(current))&&['payment','receipt','confirmation','response'].includes(hash))return responseThanks();if(hash==='declaration'&&current)return declaration();if(hash==='payment'&&current)return payment();if(['receipt','confirmation'].includes(hash)&&current)return confirmation();if(hash==='profile'&&current)return profile();home()}
function viewClass(name){document.body.classList.remove('gate-view','home-view','record-view');document.body.classList.add(name)}
function gate(){
  viewClass('gate-view');current=null;
  app.innerHTML=`<section class="hero gate"><div class="hero-grid"></div><div class="hero-content"><img class="gate-logo" src="assets/mitre-transparent.png" alt=""><h1>D.R.O.G.S</h1><form class="access-card" id="entry"><input id="entry-code" type="password" inputmode="numeric" placeholder="Enter password" aria-label="D.R.O.G.S password" autocomplete="current-password"><button>Enter <span>→</span></button></form><div class="error" id="entry-error" role="alert"></div></div></section>`;
  document.querySelector('#entry').onsubmit=event=>{event.preventDefault();if(document.querySelector('#entry-code').value!=='1234'){document.querySelector('#entry-error').textContent='That password is not correct.';return}session.start();home()};
}
function home(){
  viewClass('home-view');
  app.innerHTML=`<section class="hero"><div class="hero-grid"></div><div class="hero-content"><img class="gate-logo" src="assets/mitre-transparent.png" alt=""><h1>D.R.O.G.S</h1><form class="access-card" id="access"><input id="code" inputmode="text" placeholder="Enter your code here" aria-label="Enter your code here" autocomplete="one-time-code"><button>Continue <span>→</span></button></form><div class="error" id="access-error" role="alert"></div></div></section>`;
  document.querySelector('#access').onsubmit=event=>{
    event.preventDefault();
    const raw=document.querySelector('#code').value.trim().toUpperCase().replace(/\s+/g,'');
    if(!/^[BP]\d+$/.test(raw)){document.querySelector('#access-error').textContent='Enter your assigned B or P code.';return}
    currentType=raw[0]==='B'?'bishop':'pastor';
    const code=Number(raw.slice(1));
    selectRecord(currentType,code);
    if(!current){document.querySelector('#access-error').textContent='We could not find that code.';return}
    history.pushState({drogsRecord:{type:currentType,code:current.code}},'','#profile');route();
  };
}
function statusCopy(r){return{application:r.status==='submitted'?'Submitted':r.status==='draft'?'Draft saved':'Not started',payment:r.paid?'Paid':wishesToResign(r)?'Not required':'Outstanding',review:r.review||'Awaiting submission'}}
function profile(){
  viewClass('record-view');
  const r=record(current),s=statusCopy(r);
  app.innerHTML=`<div class="wrap"><div class="topline"><div><div class="eyebrow">Your annual record</div><h1>Welcome, ${esc(displayName(current))}.</h1></div><button class="ghost" id="change">Sign out</button></div><section class="identity"><div class="portrait-panel">${portrait(current,'profile-portrait')}</div><div class="identity-copy"><div class="identity-heading"><div><h2>${esc(current.name)}</h2><div class="profile-title">${esc(current.title||'')}</div><div class="profile-denomination">${denominationLogo(current)}<div class="affiliation"><strong class="denomination-name">${esc(current.denomination||'Denomination not recorded')}</strong><small class="organization-name">${esc(current.organization)}</small></div></div></div></div><p>Submit your annual declaration and confirm the annual commitment. The D.R.O.G.S Office will review your submission and update the decision here.</p><div class="status-rail"><div><span>Application</span><b>${s.application}</b></div><div><span>Annual commitment</span><b>${s.payment}</b></div><div><span>Church review</span><b>${s.review}</b></div></div>${r.status==='submitted'?`<button class="primary large" id="continue">${wishesToResign(r)?'View response':r.paid?'View confirmation':'Continue to payment'} <span>→</span></button>`:`<button class="primary large" id="continue">Fill annual declaration <span>→</span></button>`}</div></section></div>`;
  document.querySelector('#change').onclick=()=>session.signOut();
  document.querySelector('#continue').onclick=()=>{location.hash=r.status==='submitted'?(wishesToResign(r)?'response':r.paid?'confirmation':'payment'):'declaration'};
}
function qHtml(q,i,value,responses={}){
  const title=typeof q.title==='function'?q.title(role().toLowerCase()):q.title;
  if(q.type==='text')return `<div class="question"><span class="qno">${String(i+1).padStart(2,'0')}</span><h3><label for="${q.id}">${title}</label></h3><p>${q.help}</p><textarea class="field" id="${q.id}" name="${q.id}" placeholder="Write your response here">${esc(value||'')}</textarea></div>`;
  if(q.type==='scale')return`<div class="question"><span class="qno">${String(i+1).padStart(2,'0')}</span><h3>${title}</h3><p>${q.help}</p><div class="scale">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<label>${n}<input type="radio" name="${q.id}" value="${n}" ${String(value)===String(n)?'checked':''}></label>`).join('')}</div></div>`;
  return`<div class="question"><span class="qno">${String(i+1).padStart(2,'0')}</span><h3>${title}</h3><p>${q.help}</p><div class="options">${q.options.map(o=>`<label><input type="radio" name="${q.id}" value="${esc(o)}" ${value===o?'checked':''}> ${esc(o)}</label>`).join('')}</div>${q.id==='intention'?`<textarea class="field" name="intentionNote" placeholder="If you wish to resign or discuss your position, tell the D.R.O.G.S Office what you would like them to know.">${esc(responses.intentionNote||'')}</textarea>`:''}</div>`
}
function saveDeclaration(patch){
  const previous=record(current),questionSet=currentType==='pastor'?PASTOR_QUESTION_SET:'governance-2027-v1';
  const previousDeclarations=[...(previous.previousDeclarations||[])];
  if(currentType==='pastor'&&previous.questionSet!==questionSet&&Object.keys(previous.responses||{}).length){
    previousDeclarations.push({questionSet:previous.questionSet||'governance-2027-v1',responses:previous.responses,submittedAt:previous.submittedAt||null,status:previous.status});
  }
  put(current,{...patch,questionSet,previousDeclarations});
}
function declaration(){
  viewClass('record-view');
  const r=record(current),questions=currentType==='pastor'?PASTOR_QUESTIONS:baseQuestions,answered=questions.filter(q=>r.responses?.[q.id]).length;
  app.innerHTML=`<div class="wrap"><div class="topline"><div><div class="eyebrow">Annual declaration</div><h1>Your annual declaration</h1><p>Answer the questions that apply. You can save the form and return before submitting.</p></div><button class="ghost" id="back">Back to profile</button></div><div class="form-shell"><aside class="form-aside"><div class="mini-person">${portrait(current,'mini-avatar')}<div><strong>${esc(displayName(current))}</strong><small>${displayCode(current)}</small></div></div><div class="progress"><i style="width:${answered/10*100}%"></i></div><div class="progress-copy">${answered} of 10 questions answered</div></aside><form class="content-card" id="declaration-form">${questions.slice(0,-1).map((q,i)=>qHtml(q,i,r.responses?.[q.id],r.responses)).join('')}<div class="question"><span class="qno">CONFIDENTIAL DISCLOSURE</span><h3>Optional confidential note</h3><p>Use this space to request support, clarify an answer, or disclose a matter for private review.</p><textarea class="field" name="disclosure" placeholder="Write your confidential note here">${esc(r.responses?.disclosure||'')}</textarea></div>${qHtml(questions.at(-1),9,r.responses?.intention,r.responses)}<div class="question"><label class="options"><span><input type="checkbox" name="declaration" ${r.responses?.declaration?'checked':''}> I confirm that these answers are complete and truthful to the best of my knowledge.</span></label></div><div class="form-actions"><p>You can continue with unanswered questions for now. Submitting sends this declaration to the D.R.O.G.S Office.</p><button class="primary" id="submit-declaration">${r.responses?.intention==='I wish to resign'?'Submit response':'Continue to payment'} <span>→</span></button></div></form></div></div>`;
  document.querySelector('#back').onclick=()=>location.hash='profile';
  document.querySelector('#declaration-form').onchange=event=>{const fd=new FormData(event.currentTarget),responses=Object.fromEntries(fd.entries());responses.declaration=fd.has('declaration');document.querySelector('#submit-declaration').innerHTML=`${responses.intention==='I wish to resign'?'Submit response':'Continue to payment'} <span>→</span>`;saveDeclaration({status:'draft',responses,updatedAt:new Date().toISOString()})};
  document.querySelector('#declaration-form').onsubmit=event=>{event.preventDefault();const fd=new FormData(event.currentTarget),responses=Object.fromEntries(fd.entries());responses.declaration=fd.has('declaration');saveDeclaration({status:'submitted',responses,submittedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),review:responses.intention==='I wish to resign'?'Resignation requested':'Ready for review'});if(responses.intention==='I wish to resign')submissionLoading('response');else location.hash='payment'};
}

function submissionLoading(destination='confirmation'){
  clearTimeout(confirmationTimer);
  viewClass('record-view');
  app.innerHTML=`<div class="wrap confirmation-wrap"><section class="content-card confirmation-card" role="status" aria-live="polite" aria-busy="true"><img class="receipt-logo" src="assets/mitre-transparent.png" alt="D.R.O.G.S"><span class="submission-spinner" aria-hidden="true"></span><p>Preparing your confirmation…</p></section></div>`;
  window.scrollTo({top:0,behavior:'instant'});
  confirmationTimer=setTimeout(()=>{
    if(!session.active()||!current)return route();
    history.replaceState({drogsRecord:{type:currentType,code:current.code}},'',`#${destination}`);
    route();
  },750);
}
function responseThanks(){confirmation(true)}
function confirmation(resignation=false){
  viewClass('record-view');
  app.innerHTML=`<div class="wrap confirmation-wrap"><section class="content-card confirmation-card"><img class="receipt-logo" src="assets/mitre-transparent.png" alt="D.R.O.G.S"><div class="success-mark" aria-hidden="true">✓</div><h1 tabindex="-1">Thank you, ${esc(current.name)}.</h1><p>Your response is being reviewed by the D.R.O.G.S Office.</p>${resignation?'<p>Your request to resign has been recorded. The office will contact you privately.</p>':''}<div class="confirmation-actions"><button class="primary" id="confirmation-signout">Sign out</button><button class="ghost" id="profile">Return to record</button></div></section></div>`;
  document.querySelector('#confirmation-signout').onclick=()=>session.signOut();
  document.querySelector('#profile').onclick=()=>location.hash='profile';
  document.querySelector('.confirmation-card h1').focus({preventScroll:true});
}

function compressProof(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const image=new Image();image.onerror=reject;image.onload=()=>{const maximum=1400,scale=Math.min(1,maximum/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.76))};image.src=reader.result};reader.readAsDataURL(file)})}
function payment(){
  viewClass('record-view');
  const r=record(current);let proofData=r.paymentProof||'',proofName=r.paymentProofName||'',method=r.paymentMethod?.startsWith('Bank transfer')?'bank':'momo';
  const bank=FLOW_BANK_ACCOUNTS[0];
  app.innerHTML=`<div class="wrap"><div class="topline"><div><div class="eyebrow">Annual commitment</div><h1>Complete your annual commitment.</h1><p>Your declaration has been submitted. Send your commitment using mobile money or the Ghana bank account below.</p></div><button class="ghost" id="back">Back to profile</button></div><section class="content-card payment-single"><div class="mini-person">${portrait(current,'mini-avatar')}<div><strong>${esc(displayName(current))}</strong><small>2027 annual commitment · $${current.amount} USD</small></div></div><div class="payment-methods" role="group" aria-label="Payment method"><button type="button" data-payment-method="momo">Mobile money</button><button type="button" data-payment-method="bank">Bank transfer</button></div><section class="transfer-apps" id="momo-details"><div class="momo-instruction">Send mobile money payments to</div><div class="transfer-heading"><div><div class="eyebrow">MTN Mobile Money</div><h2>053 042 9589</h2></div><button type="button" id="copy-number">Copy number</button></div><p>Choose an app below, select Ghana and MTN, then enter the number above.</p><div class="payment-app-grid">${paymentAppLinks()}</div></section><section class="bank-details" id="bank-details"><div class="eyebrow">Bank transfer · Ghana</div><h2>The Flow Church</h2><dl class="bank-fields">${bank.fields.map(([label,value],i)=>`<div><dt>${esc(label)}</dt><dd><strong>${esc(value)}</strong><button type="button" data-bank-copy="${i}" aria-label="Copy ${esc(label.toLowerCase())}">Copy</button></dd></div>`).join('')}</dl><a class="bank-source" href="https://flowoffering.com/" target="_blank" rel="noopener noreferrer">Flow Church giving details ↗</a></section><p class="copy-status" id="copy-status" role="status"></p><section class="proof-upload"><div class="eyebrow">Payment proof</div><h3>Upload your payment screenshot</h3><p>The D.R.O.G.S Office will use this image to verify the payment.</p><label class="proof-drop"><input id="proof" type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif"><span>Choose screenshot</span><small>PNG, JPG, WEBP, HEIC or HEIF</small></label><div id="proof-preview" class="proof-preview ${proofData?'ready':''}">${proofData?`<img src="${proofData}" alt="Payment screenshot"><b>${esc(proofName||'Payment screenshot uploaded')}</b>`:''}</div><div class="proof-error" id="proof-error"></div></section><button class="primary large" id="pay" style="margin-top:22px">Submit payment proof <span>→</span></button></section></div>`;
  document.querySelector('#back').onclick=()=>location.hash='profile';
  const updateMethod=()=>{
    document.querySelector('#momo-details').hidden=method!=='momo';
    document.querySelector('#bank-details').hidden=method!=='bank';
    document.querySelectorAll('[data-payment-method]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.paymentMethod===method)));
  };
  document.querySelectorAll('[data-payment-method]').forEach(button=>button.onclick=()=>{method=button.dataset.paymentMethod;updateMethod()});
  updateMethod();
  const copy=async(value,label)=>{try{await navigator.clipboard.writeText(value);document.querySelector('#copy-status').textContent=`${label} copied.`}catch{document.querySelector('#copy-status').textContent=`Please select and copy the ${label.toLowerCase()} above.`}};
  document.querySelector('#copy-number').onclick=()=>copy('0530429589','MoMo number');
  document.querySelectorAll('[data-bank-copy]').forEach(button=>button.onclick=()=>{const [label,value]=bank.fields[Number(button.dataset.bankCopy)];copy(value,label)});
  document.querySelector('#proof').onchange=async event=>{const file=event.target.files[0];if(!file)return;document.querySelector('#proof-error').textContent='Preparing screenshot…';try{proofData=await compressProof(file);proofName=file.name;document.querySelector('#proof-preview').classList.add('ready');document.querySelector('#proof-preview').innerHTML=`<img src="${proofData}" alt="Payment screenshot"><b>${esc(proofName)}</b>`;document.querySelector('#proof-error').textContent='Screenshot ready to submit.'}catch{document.querySelector('#proof-error').textContent='That image could not be prepared. Please choose a PNG, JPG or WEBP screenshot.'}};
  document.querySelector('#pay').onclick=()=>{if(!proofData){document.querySelector('#proof-error').textContent='Upload your payment screenshot before continuing.';document.querySelector('#proof').focus();return}put(current,{paid:true,paymentMethod:method==='bank'?'Bank transfer — Ghana':'MTN Mobile Money',paymentProof:proofData,paymentProofName:proofName,paidAt:new Date().toISOString(),updatedAt:new Date().toISOString(),review:r.review==='Approved'?'Approved':'In review'});submissionLoading()};
}
function esc(value=''){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
window.addEventListener('hashchange',route);
route();
