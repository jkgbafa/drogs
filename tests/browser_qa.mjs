import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

const BASE='http://127.0.0.1:4198';
const OUT='/tmp/pastoral-renewal-qa';
await mkdir(OUT,{recursive:true});

const launchOptions={headless:true};
if(process.env.PLAYWRIGHT_EXECUTABLE_PATH)launchOptions.executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const browser=await chromium.launch(launchOptions);
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const errors=[];
const watch=page=>{
  page.on('console',msg=>{if(msg.type()==='error')errors.push(`console: ${msg.text()}`)});
  page.on('pageerror',error=>errors.push(`page: ${error}`));
};

const page=await context.newPage();
watch(page);
await page.goto(BASE,{waitUntil:'networkidle'});
await page.evaluate(()=>localStorage.clear());
await page.reload({waitUntil:'networkidle'});
assert(await page.getByRole('heading',{name:'Renew your commitment.'}).isVisible());
await page.locator('#code').fill('999');
await page.getByRole('button',{name:'Continue'}).click();
assert((await page.locator('#access-error').textContent()).includes('could not find'));

await page.locator('#code').fill('2');
await page.getByRole('button',{name:'Continue'}).click();
assert((await page.locator('.topline h1').textContent()).includes('Joseph Aryee'));
await page.getByRole('button',{name:'Use another code'}).click();
await page.locator('#code').fill('1');
await page.getByRole('button',{name:'Continue'}).click();
assert((await page.locator('.topline h1').textContent()).includes('Jeremy Elorm-Menyisse'));
await page.screenshot({path:`${OUT}/public-profile.png`,fullPage:true});

await page.getByRole('button',{name:/Fill annual renewal form/}).click();
await page.getByRole('heading',{name:'Your renewal form'}).waitFor();
const questions=page.locator('.question');
for(let i=0;i<10;i++) await questions.nth(i).locator('input[type="radio"]').first().check();
await page.locator('input[name="declaration"]').check();
await page.getByRole('button',{name:/Submit renewal/}).click();
await page.getByRole('heading',{name:'Complete your renewal.'}).waitFor();
await page.locator('input[value="Mobile Money"]').check();
await page.getByRole('button',{name:/Pay annual fee/}).click();
await page.getByText('Thank you for completing your annual renewal.').waitFor();
assert(await page.getByText('PR-B-2027-0001').isVisible());
await page.screenshot({path:`${OUT}/receipt.png`,fullPage:true});

const admin=await context.newPage();
watch(admin);
await admin.goto(`${BASE}/admin/`,{waitUntil:'networkidle'});
await admin.locator('#pin').fill('1111');
await admin.getByRole('button',{name:'Enter renewal office'}).click();
assert((await admin.locator('#error').textContent()).includes('not correct'));
await admin.locator('#pin').fill('1234');
await admin.getByRole('button',{name:'Enter renewal office'}).click();
assert(await admin.getByRole('heading',{name:'Renewal office'}).isVisible());
assert.equal(await admin.locator('tbody tr').count(),69);
await admin.locator('#search').fill('Jeremy Elorm-Menyisse');
assert.equal(await admin.locator('tbody tr').count(),1);
await admin.locator('tbody tr').click();
assert(await admin.getByRole('heading',{name:'Jeremy Elorm-Menyisse'}).isVisible());
const details=await admin.locator('.details').textContent();
assert(details.includes('Submitted'));
assert(details.includes('Paid'));
await admin.locator('#close').click();
await admin.locator('#search').fill('');
await admin.locator('#status').selectOption('submitted');
assert((await admin.locator('tbody tr').count())>0);
await admin.locator('#view').click();
assert(await admin.locator('.bishop-card').first().isVisible());
await admin.screenshot({path:`${OUT}/admin-directory.png`,fullPage:true});
await admin.locator('[data-role="pastor"]').click();
assert.equal(await admin.locator('tbody tr').count(),4647);
await admin.locator('#search').fill('Bernard Koranteng');
assert.equal(await admin.locator('tbody tr').count(),1);

const pastor=await context.newPage();
watch(pastor);
await pastor.goto(BASE,{waitUntil:'networkidle'});
await pastor.locator('[data-role="pastor"]').click();
assert((await pastor.locator('.access-note').textContent()).includes('4,647'));
await pastor.locator('#code').fill('1');
await pastor.getByRole('button',{name:'Continue'}).click();
assert((await pastor.locator('.topline h1').textContent()).includes('Bernard Koranteng'));
assert((await pastor.locator('.identity-copy h2').textContent()).includes('Pastor Bernard Koranteng'));

const mobile=await context.newPage();
watch(mobile);
await mobile.setViewportSize({width:390,height:844});
await mobile.goto(BASE,{waitUntil:'networkidle'});
assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
await mobile.screenshot({path:`${OUT}/mobile-home.png`,fullPage:true});

assert.equal(errors.length,0,errors.join('\n'));
console.log('Browser QA passed: code mapping, renewal, payment, receipt, admin login, filters, directory and mobile layout.');
console.log(OUT);
await browser.close();
