import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync} from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const window={};for(const file of ['bishops','pastors'])vm.runInNewContext(readFileSync(`data/${file}.js`,'utf8'),{window});
const candidates=window.PASTORS.filter(p=>p.organization==='UD-OLGC'&&p.denomination&&!p.previousBishopCodes&&!p.previousPastorCodes&&!p.previousPastorCode);
const group=candidates.find(p=>candidates.filter(x=>x.denomination===p.denomination).length>6).denomination;
const selected=candidates.filter(p=>p.denomination===group).slice(0,6);
const other=candidates.find(p=>p.denomination!==group);
const bishop=window.BISHOPS.find(p=>p.code===1);
const record=()=>({status:'submitted',paid:false,review:'In review',submittedAt:'2026-09-25T10:00:00Z',responses:{intention:'I wish to continue'},paymentProofName:'example.png',reviewNote:'Keep this'});
const saved=Object.fromEntries([...selected,other].map(p=>[`pastor:${p.code}`,record()]));
saved[`bishop:${bishop.code}`]=record();
saved[`pastor:${selected[2].code}`].paid=false;
saved[`pastor:${selected[2].code}`].review='More information requested';
saved[`pastor:${selected[3].code}`].responses.intention='I wish to resign';
saved[`pastor:${selected[4].code}`].review='Approved';
saved[`pastor:${selected[5].code}`].review='On hold';
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto(`${process.env.DROGS_BASE_URL}/admin/`,{waitUntil:'networkidle'});
 await page.evaluate(saved=>localStorage.setItem('drogs-2027',JSON.stringify(saved)),saved);
 await page.locator('#pin').fill('1234');await page.locator('#login button').click();await page.locator('#submissions').click();
 await page.locator('[data-submission-role="pastor"]').click();
 await page.locator('#submission-organization').selectOption('UD-OLGC');await page.locator('#submission-denomination').selectOption(group);
 assert.equal(await page.locator('[data-bulk-key]:enabled').count(),2);
 await page.locator('#select-all-submissions').check();assert.equal(await page.locator('[data-bulk-key]:checked').count(),2);
 await page.locator('#review-bulk').click();assert(await page.getByRole('heading',{name:'Approve 2 applications?'}).isVisible());
 await page.locator('#cancel-bulk').click();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('drogs-2027'))),saved);
 // Changing a filter drops the entire previous selection.
 await page.locator('#submission-readiness').selectOption('ready');assert.equal(await page.locator('[data-bulk-key]:checked').count(),0);
 await page.locator('#select-all-submissions').check();await page.locator('#review-bulk').click();
 // A newer individual decision cannot be overwritten by the pending batch.
 await page.evaluate(code=>{const all=JSON.parse(localStorage.getItem('drogs-2027'));all[`pastor:${code}`].review='On hold';localStorage.setItem('drogs-2027',JSON.stringify(all))},selected[0].code);
 await page.locator('#confirm-bulk').click();assert((await page.locator('#bulk-error').textContent()).includes('changed'));
 assert.equal(await page.evaluate(code=>JSON.parse(localStorage.getItem('drogs-2027'))[`pastor:${code}`].review,selected[1].code),'In review');
 await page.locator('#cancel-bulk').click();
 await page.evaluate(saved=>localStorage.setItem('drogs-2027',JSON.stringify(saved)),saved);
 await page.locator('#submission-readiness').selectOption('all');await page.locator('#select-all-submissions').check();
 mkdirSync('/tmp/drogs-qa',{recursive:true});await page.screenshot({path:'/tmp/drogs-qa/bulk-desktop.png',fullPage:true});
 await page.locator('#review-bulk').click();await page.screenshot({path:'/tmp/drogs-qa/bulk-confirm.png'});
 // Storage failure must leave the original state intact and show a useful message.
 await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='drogs-2027')throw new DOMException('Full','QuotaExceededError');return window.originalSetItem.call(this,k,v)}});
 await page.locator('#confirm-bulk').click();assert((await page.locator('#bulk-error').textContent()).includes('No approvals were saved'));
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('drogs-2027'))),saved);
 await page.evaluate(()=>Storage.prototype.setItem=window.originalSetItem);
 await page.locator('#confirm-bulk').click();assert((await page.locator('.bulk-notice').textContent()).includes('2 applications approved'));
 const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('drogs-2027')));
 for(const person of selected.slice(0,2)){const key=`pastor:${person.code}`;assert.equal(result[key].review,'Approved');assert.equal(result[key].reviewNote,'Keep this');assert.equal(result[key].reviewHistory.length,1)}
 for(const key of Object.keys(saved).filter(k=>!selected.slice(0,2).some(p=>k===`pastor:${p.code}`)))assert.deepEqual(result[key],saved[key]);

 // Select a denomination, exclude one person, and approve only the remainder.
 await page.evaluate(saved=>localStorage.setItem('drogs-2027',JSON.stringify(saved)),saved);
 await page.locator('#submission-readiness').selectOption('all');
 await page.locator('#select-all-submissions').check();
 await page.locator(`[data-bulk-key="pastor:${selected[1].code}"]`).uncheck();
 assert.equal(await page.locator('[data-bulk-key]:checked').count(),1);
 await page.locator('#review-bulk').click();
 assert(await page.getByRole('heading',{name:'Approve 1 application?'}).isVisible());
 await page.locator('#confirm-bulk').click();
 const excluded=await page.evaluate(code=>JSON.parse(localStorage.getItem('drogs-2027'))[`pastor:${code}`],selected[1].code);
 assert.deepEqual(excluded,saved[`pastor:${selected[1].code}`]);
 assert.equal(await page.evaluate(code=>JSON.parse(localStorage.getItem('drogs-2027'))[`pastor:${code}`].review,selected[0].code),'Approved');
 await page.reload({waitUntil:'networkidle'});await page.locator('#submissions').click();assert((await page.locator(`[data-submission-code="${selected[0].code}"][data-submission-type="pastor"]`).textContent()).includes('Approved'));
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/drogs-qa/bulk-mobile.png',fullPage:true});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));assert.deepEqual(errors,[]);
 console.log('Bulk approval browser checks passed: filter scope, excluded records, cancellation, stale data, storage failure, batch persistence and mobile layout.');
}finally{await browser.close()}
