import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {findRecord,recordKeys} from '../src/runtime/person-records.js';
const context={window:{}};
for(const role of ['bishops','pastors'])vm.runInNewContext(readFileSync(new URL(`../data/${role}.js`,import.meta.url),'utf8'),context);
const {BISHOPS:b,PASTORS:p}=context.window;
test('withdrawn folder classifications do not appear in the bishop roster',()=>{
  assert(!b.some(person=>person.name==='Afua Boateng'));
  assert(!b.some(person=>person.code>=255&&person.code<=318));
  assert.equal(p.find(person=>person.code===36).title,'Pastor');
  assert(p.find(person=>person.code===36).previousBishopCodes.includes(255));
  assert(p.find(person=>person.sourceId==='4419').previousBishopCodes.includes(298));
});
test('corrected codes remain unique and previous bishop aliases are unambiguous',()=>{
  for(const list of [b,p])assert.equal(new Set(list.map(person=>person.code)).size,list.length);
  const aliases=p.flatMap(person=>person.previousBishopCodes||[]);
  assert.equal(new Set(aliases).size,aliases.length);
  assert(!b.some(person=>aliases.includes(person.code)));
});
test('all source rows remain accounted for after rank corrections',()=>{
  const audit=JSON.parse(readFileSync(new URL('../data/source-count-audit.json',import.meta.url),'utf8'));
  assert.equal(audit.unresolvedRows,0);
  assert.equal(Object.values(audit.mappedRowsByCategory).reduce((sum,n)=>sum+n,0),4709);
});

test('female bishop titles follow their recorded organization',()=>{
  for(const person of b.filter(person=>person.gender==='FEMALE')){
    assert.equal(person.title,person.organization==='UD-OLGC'?'Episcopal Sister':'Mother',person.name);
  }
});

test('confirmed merges retain old codes and keep the two Franks separate',()=>{
  const paa=b.find(x=>x.code===148),kofi=p.find(x=>x.code===2622),raquel=p.find(x=>x.code===5019);
  assert(recordKeys(paa,'bishop').includes('bishop:150'));
  assert(recordKeys(kofi,'pastor').includes('pastor:4993'));
  assert(recordKeys(raquel,'pastor').includes('pastor:3341'));
  assert(!b.some(x=>x.code===150));
  assert(!p.some(x=>[4993,3341].includes(x.code)));
  assert.equal(kofi.organization,'UO-FLC190');
  const frankB=b.find(x=>x.code===69),frankP=p.find(x=>x.code===1662);
  assert.equal(frankP.name,'Frank Asirifi Otchere');
  assert(frankB.image&&frankP.image);
  assert.notEqual(frankB.image,frankP.image);
  assert(!readFileSync(new URL('../'+frankB.image,import.meta.url)).equals(readFileSync(new URL('../'+frankP.image,import.meta.url))));
});

test('merged records retain previous submissions without changing stored originals',()=>{
  const person=b.find(x=>x.code===148);
  const records={'bishop:148':{responses:{doctrine:'Yes'},updatedAt:'2026-09-25T10:00:00Z'},'bishop:150':{responses:{doctrine:'No'},updatedAt:'2026-09-24T10:00:00Z'}};
  const original=JSON.stringify(records),result=findRecord(records,person,'bishop');
  assert.equal(result.responses.doctrine,'Yes');
  assert.equal(result.previousDeclarations[0].responses.doctrine,'No');
  assert.equal(JSON.stringify(records),original);
  assert.equal(findRecord({'bishop:150':records['bishop:150']},person,'bishop').responses.doctrine,'No');
});


test('confirmed Healing Jesus and FLOW members are Outreach leaders with their logo and preserved identities',()=>{
 const groups={
  'Healing Jesus Council':['Prince Charles Addae','Ebo Ankrah','Randy Mills-Thompson','Marcel Aboagye','George Antwi','Lovell Ankrah','Faustina Carla Boateng','Miranda Siweya'],
  'FLOW Office':['Nely Nina Masuku','Brian Masuku','Leonard Hyde','Joshua Gbafa','Pius Worlano','Darius Phiri','Eniola Ajiga','Joel Obuobisa Jr','Walter Wolle']
 };
 for(const [group,names]of Object.entries(groups))for(const name of names){
  const person=b.find(x=>x.name===name);assert(person,name);assert.equal(person.organization,'OUTREACH');assert.equal(person.outreachGroup,group);assert.equal(person.denominationLogo,'assets/denominations/outreach-org.png');assert(person.image);assert(!p.some(x=>x.name===name));
 }
 assert.equal(b.find(x=>x.name==='Joel Obuobisa').organization,'UD-OLGC');
 assert(recordKeys(b.find(x=>x.name==='Miranda Siweya'),'bishop').includes('pastor:3127'));
 assert(recordKeys(b.find(x=>x.name==='Darius Phiri'),'bishop').includes('pastor:4699'));
 assert(p.some(x=>x.code===4746&&x.name==='Joanne Eniola'));
});
