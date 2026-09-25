const app=document.querySelector('#app');
const STORE='drogs-2027';
const ENTRY='drogs-entry';
let current=null,currentType='bishop';
const session=createDrogsSession(ENTRY,()=>{current=null;history.replaceState(null,'',location.pathname);gate()});

const baseQuestions=[
  {id:'intention',title:role=>`Do you wish to continue serving as a ${role} for the coming year?`,help:'If you intend to resign, select that option. The D.R.O.G.S Office will contact you privately.',type:'choice',options:['I wish to continue','I wish to resign','I need to discuss my position']},
  {id:'standing',title:()=>`How would you describe your present standing and readiness for this office?`,help:'Use the scale as an honest personal reflection. It is not an automatic score.',type:'scale'},
  {id:'oversight',title:()=>`Are you actively overseeing and caring for the people, ministry and leaders entrusted to you?`,help:'Consider supervision, pastoral care, standards, training and timely support.',type:'choice',options:['Yes, consistently','Partly — I need support','No']},
  {id:'doctrine',title:()=>`Are you in agreement with the church’s statement of faith, aims, vision and governing direction?`,help:'Please disclose any area that requires clarification.',type:'choice',options:['Yes','I need clarification','No']},
  {id:'training',title:()=>`Have you intentionally trained and developed leaders or successors during this annual cycle?`,help:'Ministry includes producing and strengthening other leaders.',type:'choice',options:['Yes, consistently','Somewhat','Not during this period']},
  {id:'councils',title:()=>`Have you worked faithfully through the appropriate councils and implemented their decisions?`,help:'This includes participation, accountability and follow-through.',type:'choice',options:['Yes','Mostly','I need to discuss this']},
  {id:'communication',title:()=>`Are you maintaining open communication, unity and healthy relationships with leaders above and below you?`,help:'Include any isolation, unresolved conflict or relationship requiring help in your disclosure.',type:'choice',options:['Yes','Some areas need attention','No']},
  {id:'stewardship',title:()=>`Are the administration, reporting, finances and property under your care handled responsibly?`,help:'This includes compliance with church procedures and applicable laws.',type:'choice',options:['Yes','There are matters to resolve','No']},
  {id:'integrity',title:()=>`Is there any matter of conduct, marriage, finance, authority or personal integrity that requires confidential review?`,help:'A request for help is treated as a disclosure for authorized review, not as an automatic decision.',type:'choice',options:['No matter to disclose','Yes — I request a confidential review']},
  {id:'commitment',title:()=>`Will you uphold the obligations of this office, including confidentiality, accountability and responsible leadership?`,help:'Your annual declaration confirms the information supplied in this submission.',type:'choice',options:['Yes, I recommit','I need to discuss this before recommitting']}
];

baseQuestions.push(baseQuestions.shift());
const wishesToResign=r=>r.status==='submitted'&&r.responses?.intention==='I wish to resign';

const roster=()=>currentType==='bishop'?BISHOPS:PASTORS;
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

function route(){if(!session.active())return gate();const hash=location.hash.slice(1);const saved=history.state?.drogsRecord;if(saved&&['profile','declaration','payment','receipt','response'].includes(hash)){currentType=saved.type;current=roster().find(person=>person.code===saved.code||(person.previousBishopCodes||[]).includes(saved.code))}if(current&&['profile','declaration','payment','receipt','response'].includes(hash))history.replaceState({drogsRecord:{type:currentType,code:current.code}},'');if(current&&wishesToResign(record(current))&&['payment','receipt','response'].includes(hash))return responseThanks();if(hash==='declaration'&&current)return declaration();if(hash==='payment'&&current)return payment();if(hash==='receipt'&&current)return receipt();if(hash==='profile'&&current)return profile();home()}
function viewClass(name){document.body.classList.remove('gate-view','home-view','record-view');document.body.classList.add(name)}
function gate(){
  viewClass('gate-view');current=null;
  app.innerHTML=`<section class="hero gate"><div class="hero-grid"></div><div class="hero-content"><img class="gate-logo" src="assets/mitre-transparent.png" alt=""><h1>D.R.O.G.S</h1><form class="access-card" id="entry"><input id="entry-code" type="password" inputmode="numeric" placeholder="Enter password" aria-label="D.R.O.G.S password" autocomplete="current-password"><button>Enter <span>→</span></button></form><div class="error" id="entry-error" role="alert"></div></div></section>`;
  document.querySelector('#entry').onsubmit=event=>{event.preventDefault();if(document.querySelector('#entry-code').value!=='1234'){document.querySelector('#entry-error').textContent='That password is not correct.';return}session.start();home()};
}
function home(){
  viewClass('home-view');
  app.innerHTML=`<section class="hero"><div class="hero-grid"></div><div class="hero-content"><h1>D.R.O.G.S</h1><form class="access-card" id="access"><input id="code" inputmode="text" placeholder="Enter your code here" aria-label="Enter your code here" autocomplete="one-time-code"><button>Continue <span>→</span></button></form><div class="error" id="access-error" role="alert"></div></div></section>`;
  document.querySelector('#access').onsubmit=event=>{
    event.preventDefault();
    const raw=document.querySelector('#code').value.trim().toUpperCase().replace(/\s+/g,'');
    if(!/^[BP]\d+$/.test(raw)){document.querySelector('#access-error').textContent='Enter your assigned B or P code.';return}
    currentType=raw[0]==='B'?'bishop':'pastor';
    const code=Number(raw.slice(1));
    current=roster().find(person=>person.code===code||(person.previousBishopCodes||[]).includes(code));
    if(!current){document.querySelector('#access-error').textContent='We could not find that code.';return}
    history.pushState({drogsRecord:{type:currentType,code:current.code}},'','#profile');route();
  };
}
function statusCopy(r){return{application:r.status==='submitted'?'Submitted':r.status==='draft'?'Draft saved':'Not started',payment:r.paid?'Paid':wishesToResign(r)?'Not required':'Outstanding',review:r.review||'Awaiting submission'}}
function profile(){
  viewClass('record-view');
  const r=record(current),s=statusCopy(r);
  app.innerHTML=`<div class="wrap"><div class="topline"><div><div class="eyebrow">Your annual record</div><h1>Welcome, ${esc(displayName(current))}.</h1></div><button class="ghost" id="change">Sign out</button></div><section class="identity"><div class="portrait-panel">${portrait(current,'profile-portrait')}</div><div class="identity-copy"><div class="identity-heading"><div><h2>${esc(current.name)}</h2><div class="profile-title">${esc(current.title||'')}</div><div class="profile-denomination">${denominationLogo(current)}<div class="affiliation"><strong class="denomination-name">${esc(current.denomination||'Denomination not recorded')}</strong><small class="organization-name">${esc(current.organization)}</small></div></div></div></div><p>Submit your annual declaration and confirm the annual fee. The D.R.O.G.S Office will review your submission and update the decision here.</p><div class="status-rail"><div><span>Application</span><b>${s.application}</b></div><div><span>Annual fee</span><b>${s.payment}</b></div><div><span>Church review</span><b>${s.review}</b></div></div>${r.status==='submitted'?`<button class="primary large" id="continue">${wishesToResign(r)?'View response':r.paid?'View receipt':'Continue to payment'} <span>→</span></button>`:`<button class="primary large" id="continue">Fill annual declaration <span>→</span></button>`}</div></section></div>`;
  document.querySelector('#change').onclick=()=>session.signOut();
  document.querySelector('#continue').onclick=()=>{location.hash=r.status==='submitted'?(wishesToResign(r)?'response':r.paid?'receipt':'payment'):'declaration'};
}
function qHtml(q,i,value,responses={}){
  const title=q.title(role().toLowerCase());
  if(q.type==='scale')return`<div class="question"><span class="qno">${String(i+1).padStart(2,'0')}</span><h3>${title}</h3><p>${q.help}</p><div class="scale">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<label>${n}<input type="radio" name="${q.id}" value="${n}" ${String(value)===String(n)?'checked':''}></label>`).join('')}</div></div>`;
  return`<div class="question"><span class="qno">${String(i+1).padStart(2,'0')}</span><h3>${title}</h3><p>${q.help}</p><div class="options">${q.options.map(o=>`<label><input type="radio" name="${q.id}" value="${esc(o)}" ${value===o?'checked':''}> ${esc(o)}</label>`).join('')}</div>${q.id==='intention'?`<textarea class="field" name="intentionNote" placeholder="If you wish to resign or discuss your position, tell the D.R.O.G.S Office what you would like them to know.">${esc(responses.intentionNote||'')}</textarea>`:''}</div>`
}
function declaration(){
  viewClass('record-view');
  const r=record(current),answered=baseQuestions.filter(q=>r.responses?.[q.id]).length;
  app.innerHTML=`<div class="wrap"><div class="topline"><div><div class="eyebrow">Annual declaration</div><h1>Your annual declaration</h1><p>Answer the questions that apply. You can save the form and return before submitting.</p></div><button class="ghost" id="back">Back to profile</button></div><div class="form-shell"><aside class="form-aside"><div class="mini-person">${portrait(current,'mini-avatar')}<div><strong>${esc(displayName(current))}</strong><small>${displayCode(current)}</small></div></div><div class="progress"><i style="width:${answered/10*100}%"></i></div><div class="progress-copy">${answered} of 10 governance questions answered</div></aside><form class="content-card" id="declaration-form">${baseQuestions.slice(0,-1).map((q,i)=>qHtml(q,i,r.responses?.[q.id],r.responses)).join('')}<div class="question"><span class="qno">CONFIDENTIAL DISCLOSURE</span><h3>Is there anything else the D.R.O.G.S Office or reviewing council should know?</h3><p>Use this space to request support, clarify an answer, or disclose a matter for private review.</p><textarea class="field" name="disclosure" placeholder="Write your confidential note here">${esc(r.responses?.disclosure||'')}</textarea></div>${qHtml(baseQuestions.at(-1),9,r.responses?.intention,r.responses)}<div class="question"><label class="options"><span><input type="checkbox" name="declaration" ${r.responses?.declaration?'checked':''}> I confirm that these answers are complete and truthful to the best of my knowledge.</span></label></div><div class="form-actions"><p>You can continue with unanswered questions for now. Submitting sends this declaration to the D.R.O.G.S Office.</p><button class="primary" id="submit-declaration">${r.responses?.intention==='I wish to resign'?'Submit response':'Continue to payment'} <span>→</span></button></div></form></div></div>`;
  document.querySelector('#back').onclick=()=>location.hash='profile';
  document.querySelector('#declaration-form').onchange=event=>{const fd=new FormData(event.currentTarget),responses=Object.fromEntries(fd.entries());responses.declaration=fd.has('declaration');document.querySelector('#submit-declaration').innerHTML=`${responses.intention==='I wish to resign'?'Submit response':'Continue to payment'} <span>→</span>`;put(current,{status:'draft',responses,updatedAt:new Date().toISOString()})};
  document.querySelector('#declaration-form').onsubmit=event=>{event.preventDefault();const fd=new FormData(event.currentTarget),responses=Object.fromEntries(fd.entries());responses.declaration=fd.has('declaration');put(current,{status:'submitted',responses,submittedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),review:responses.intention==='I wish to resign'?'Resignation requested':'Ready for review'});location.hash=responses.intention==='I wish to resign'?'response':'payment'};
}

function responseThanks(){
  viewClass('record-view');
  app.innerHTML=`<div class="wrap"><section class="content-card receipt"><img class="receipt-logo" src="assets/mitre-transparent.png" alt="D.R.O.G.S"><h1>Thank you for your response.</h1><p>Your request to resign has been recorded. The D.R.O.G.S Office will contact you privately.</p><div class="receipt-person">${portrait(current,'receipt-avatar')}<h2>${esc(current.name)}</h2></div><button class="primary" id="response-signout">Sign out</button></section></div>`;
  document.querySelector('#response-signout').onclick=()=>session.signOut();
}

function compressProof(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const image=new Image();image.onerror=reject;image.onload=()=>{const maximum=1400,scale=Math.min(1,maximum/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.76))};image.src=reader.result};reader.readAsDataURL(file)})}
function payment(){
  viewClass('record-view');
  const r=record(current);let proofData=r.paymentProof||'',proofName=r.paymentProofName||'';
  app.innerHTML=`<div class="wrap"><div class="topline"><div><div class="eyebrow">Annual commitment fee</div><h1>Complete your annual commitment.</h1><p>Your declaration has been submitted. Send the fee to the MTN MoMo number below.</p></div><button class="ghost" id="back">Back to profile</button></div><section class="content-card payment-single"><div class="mini-person">${portrait(current,'mini-avatar')}<div><strong>${esc(displayName(current))}</strong><small>2027 annual commitment · $${current.amount} USD</small></div></div><section class="transfer-apps"><div class="momo-instruction">Please send all payments to</div><div class="transfer-heading"><div><div class="eyebrow">MTN Mobile Money</div><h2>053 042 9589</h2></div><button type="button" id="copy-number">Copy number</button></div><p>Choose an app below, select Ghana and MTN, then enter the number above.</p><div class="payment-app-grid">${paymentAppLinks()}</div></section><section class="proof-upload"><div class="eyebrow">Payment proof</div><h3>Upload your payment screenshot</h3><p>The D.R.O.G.S Office will use this image to verify the payment.</p><label class="proof-drop"><input id="proof" type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif"><span>Choose screenshot</span><small>PNG, JPG, WEBP, HEIC or HEIF</small></label><div id="proof-preview" class="proof-preview ${proofData?'ready':''}">${proofData?`<img src="${proofData}" alt="Payment screenshot"><b>${esc(proofName||'Payment screenshot uploaded')}</b>`:''}</div><div class="proof-error" id="proof-error"></div></section><button class="primary large" id="pay" style="margin-top:22px">Submit payment proof <span>→</span></button></section></div>`;
  document.querySelector('#back').onclick=()=>location.hash='profile';
  document.querySelector('#copy-number').onclick=async event=>{await navigator.clipboard.writeText('0530429589');event.currentTarget.textContent='Copied'};
  document.querySelector('#proof').onchange=async event=>{const file=event.target.files[0];if(!file)return;document.querySelector('#proof-error').textContent='Preparing screenshot…';try{proofData=await compressProof(file);proofName=file.name;document.querySelector('#proof-preview').classList.add('ready');document.querySelector('#proof-preview').innerHTML=`<img src="${proofData}" alt="Payment screenshot"><b>${esc(proofName)}</b>`;document.querySelector('#proof-error').textContent='Screenshot ready to submit.'}catch{document.querySelector('#proof-error').textContent='That image could not be prepared. Please choose a PNG, JPG or WEBP screenshot.'}};
  document.querySelector('#pay').onclick=()=>{if(!proofData){document.querySelector('#proof-error').textContent='Upload your payment screenshot before continuing.';document.querySelector('#proof').focus();return}put(current,{paid:true,paymentMethod:'MTN Mobile Money',paymentProof:proofData,paymentProofName:proofName,paidAt:new Date().toISOString(),updatedAt:new Date().toISOString(),review:r.review==='Approved'?'Approved':'In review',receipt:`DRG-${currentType==='bishop'?'B':'P'}-2027-${String(current.code).padStart(4,'0')}`});location.hash='receipt'};
}
function receipt(){
  viewClass('record-view');
  const r=record(current),date=new Date(r.paidAt||Date.now()).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  app.innerHTML=`<div class="wrap"><section class="content-card receipt"><div class="receipt-head"><div class="success-mark">✓</div><img class="receipt-logo" src="assets/mitre-transparent.png" alt="D.R.O.G.S"><div class="eyebrow">Annual commitment receipt</div><h1 style="font-size:42px;letter-spacing:-2px;margin:10px 0">Thank you for completing your annual commitment.</h1></div><div class="receipt-person">${portrait(current,'receipt-avatar')}<div><h2>${esc(displayName(current))}</h2><p>2027 annual commitment</p></div></div><div class="receipt-lines"><div><span>Receipt number</span><b>${esc(r.receipt||`DRG-${currentType==='bishop'?'B':'P'}-2027-${String(current.code).padStart(4,'0')}`)}</b></div><div><span>Commitment year</span><b>2027</b></div><div><span>Amount paid</span><b>$${current.amount} USD</b></div><div><span>Payment method</span><b>${esc(r.paymentMethod||'Payment received')}</b></div><div><span>Date</span><b>${date}</b></div><div><span>Church review</span><b>${esc(r.review)}</b></div></div><div class="receipt-actions"><button class="primary" onclick="window.print()">Print receipt</button><button class="ghost" id="profile">Return to record</button></div></section></div>`;
  document.querySelector('#profile').onclick=()=>location.hash='profile';
}
function esc(value=''){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
window.addEventListener('hashchange',route);
route();
