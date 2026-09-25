import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
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
